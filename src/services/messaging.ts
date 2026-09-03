import { prisma } from '../lib/prisma';
import { Server, Socket } from 'socket.io';

export interface UserSearchResult {
  id: string;
  username: string;
  fullName: string;
  role: string;
  organization: string | null;
}

export class MessagingService {
  /**
   * Search users across system by username or full name for messaging
   */
  static async searchUsers(query: string, currentUserId: string): Promise<UserSearchResult[]> {
    if (!query || query.trim().length === 0) return [];

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentUserId } },
          {
            OR: [
              { username: { contains: query, mode: 'insensitive' } },
              { fullName: { contains: query, mode: 'insensitive' } }
            ]
          }
        ]
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        organization: true
      },
      take: 15
    });

    return users;
  }

  /**
   * Save message to chat_messages table
   */
  static async saveMessage(senderId: string, channel: string, text: string) {
    return await prisma.chatMessage.create({
      data: {
        senderId,
        channel,
        text
      },
      include: {
        sender: {
          select: { id: true, username: true, fullName: true, role: true }
        }
      }
    });
  }

  /**
   * Fetch chat history for a given channel
   */
  static async getChannelHistory(channel: string, limit: number = 50) {
    return await prisma.chatMessage.findMany({
      where: { channel },
      include: {
        sender: {
          select: { id: true, username: true, fullName: true, role: true }
        }
      },
      orderBy: { createdAt: 'asc' },
      take: limit
    });
  }

  /**
   * Setup Socket.io real-time chat listeners
   */
  static setupSocketMessaging(io: Server) {
    io.on('connection', (socket: Socket) => {
      socket.on('join_channel', (channel: string) => {
        socket.join(channel);
      });

      socket.on('send_message', async (data: { senderId: string; channel: string; text: string }) => {
        try {
          const msg = await this.saveMessage(data.senderId, data.channel, data.text);
          io.to(data.channel).emit('new_message', msg);
        } catch (err) {
          socket.emit('error', { message: 'Failed to send message' });
        }
      });
    });
  }
}