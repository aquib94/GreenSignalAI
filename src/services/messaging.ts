import { prisma } from '../lib/prisma';
import { Server, Socket } from 'socket.io';

export interface UserSearchResult {
  id: string;
  username: string;
  fullName: string;
  role: string;
  organization: string | null;
}

export interface ConversationSenderItem {
  id: string;
  userId?: string;
  channel: string;
  name: string;
  username?: string;
  role?: string;
  organization?: string | null;
  phone?: string | null;
  isGroup?: boolean;
  avatarIcon: string;
  avatarColor: string;
  lastMessage?: {
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    createdAt: string | Date;
  } | null;
  unreadCount: number;
}

export class MessagingService {
  /**
   * Search users across system by username, full name, role, phone, or organization for messaging
   */
  static async searchUsers(query: string, currentUserId?: string): Promise<UserSearchResult[]> {
    if (!query || query.trim().length === 0) return [];

    const q = query.trim();
    const validRoles = ['CITIZEN', 'WORKER', 'COORDINATOR', 'PLANNER', 'ADMIN'];
    const matchingRoles = validRoles.filter(r => r.toLowerCase().includes(q.toLowerCase()));

    const orConditions: any[] = [
      { username: { contains: q, mode: 'insensitive' } },
      { fullName: { contains: q, mode: 'insensitive' } },
      { organization: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q } }
    ];
    if (matchingRoles.length > 0) {
      orConditions.push({ role: { in: matchingRoles } });
    }

    const whereClause: any = {
      OR: orConditions
    };

    if (currentUserId) {
      whereClause.AND = [
        { id: { not: currentUserId } }
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        phone: true,
        organization: true
      },
      take: 50
    });

    return users as any;
  }

  /**
   * Fetch recent message senders and active conversations strictly isolated per user
   */
  static async getRecentConversations(currentUserId?: string): Promise<ConversationSenderItem[]> {
    const effectiveUserId = currentUserId || '';

    // 1. Fetch latest message for 'upazila-general'
    const generalMsg = await prisma.chatMessage.findFirst({
      where: { channel: 'upazila-general' },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: { id: true, username: true, fullName: true, role: true }
        }
      }
    });

    const generalConv: ConversationSenderItem = {
      id: 'upazila-general',
      channel: 'upazila-general',
      name: 'Upazila General Emergency Channel',
      username: 'all_responders',
      role: 'BROADCAST',
      organization: 'Emergency Operations Command',
      isGroup: true,
      avatarIcon: 'fa-bullhorn',
      avatarColor: 'bg-indigo-600',
      lastMessage: generalMsg ? {
        id: generalMsg.id,
        text: generalMsg.text,
        senderId: generalMsg.senderId,
        senderName: generalMsg.sender?.fullName || 'Emergency Dispatch',
        createdAt: generalMsg.createdAt
      } : null,
      unreadCount: 0
    };

    const conversationsMap = new Map<string, ConversationSenderItem>();

    // 2. If user is logged in, find ONLY direct messages that involve this user
    if (effectiveUserId) {
      const userDirectMessages = await prisma.chatMessage.findMany({
        where: {
          channel: {
            startsWith: 'direct-',
            contains: effectiveUserId
          }
        },
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              fullName: true,
              role: true,
              phone: true,
              organization: true
            }
          }
        },
        take: 200
      });

      // Group by other user ID
      for (const msg of userDirectMessages) {
        const rem = msg.channel.slice('direct-'.length);
        let otherUserId = '';
        if (rem.startsWith(effectiveUserId + '-')) {
          otherUserId = rem.slice(effectiveUserId.length + 1);
        } else if (rem.endsWith('-' + effectiveUserId)) {
          otherUserId = rem.slice(0, rem.length - effectiveUserId.length - 1);
        } else {
          const parts = rem.split('-');
          otherUserId = msg.senderId !== effectiveUserId ? msg.senderId : (parts.find((p: string) => p !== effectiveUserId) || '');
        }

        if (!otherUserId || otherUserId === effectiveUserId) continue;

        if (!conversationsMap.has(otherUserId)) {
          let otherUser = (msg.sender && msg.sender.id === otherUserId) ? msg.sender : null;
          if (!otherUser) {
            otherUser = await prisma.user.findUnique({
              where: { id: otherUserId },
              select: {
                id: true,
                username: true,
                fullName: true,
                role: true,
                phone: true,
                organization: true
              }
            });
          }

          if (otherUser) {
            const roleColor = otherUser.role === 'COORDINATOR' ? 'bg-blue-600' :
                              otherUser.role === 'WORKER' ? 'bg-emerald-600' :
                              otherUser.role === 'ADMIN' ? 'bg-purple-600' :
                              otherUser.role === 'PLANNER' ? 'bg-cyan-600' : 'bg-amber-600';
            const roleIcon = otherUser.role === 'COORDINATOR' ? 'fa-user-shield' :
                             otherUser.role === 'WORKER' ? 'fa-helmet-safety' :
                             otherUser.role === 'ADMIN' ? 'fa-shield-halved' :
                             otherUser.role === 'PLANNER' ? 'fa-chart-line' : 'fa-user';

            const sortedIds = [effectiveUserId, otherUser.id].sort();
            const channelName = `direct-${sortedIds.join('-')}`;

            conversationsMap.set(otherUserId, {
              id: otherUser.id,
              userId: otherUser.id,
              channel: channelName,
              name: otherUser.fullName || otherUser.username,
              username: otherUser.username,
              role: otherUser.role,
              organization: otherUser.organization,
              phone: otherUser.phone,
              isGroup: false,
              avatarIcon: roleIcon,
              avatarColor: roleColor,
              lastMessage: {
                id: msg.id,
                text: msg.text,
                senderId: msg.senderId,
                senderName: msg.sender?.fullName || otherUser.fullName || 'User',
                createdAt: msg.createdAt
              },
              unreadCount: msg.senderId !== effectiveUserId ? 1 : 0
            });
          }
        }
      }
    }

    // 3. Add default available contacts to chat with, but with lastMessage = null
    const availableContacts = await prisma.user.findMany({
      where: effectiveUserId ? { id: { not: effectiveUserId } } : undefined,
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        phone: true,
        organization: true
      },
      orderBy: [
        { role: 'asc' },
        { createdAt: 'desc' }
      ],
      take: 40
    });

    for (const contact of availableContacts) {
      if (!conversationsMap.has(contact.id)) {
        const roleColor = contact.role === 'COORDINATOR' ? 'bg-blue-600' :
                          contact.role === 'WORKER' ? 'bg-emerald-600' :
                          contact.role === 'ADMIN' ? 'bg-purple-600' :
                          contact.role === 'PLANNER' ? 'bg-cyan-600' : 'bg-amber-600';
        const roleIcon = contact.role === 'COORDINATOR' ? 'fa-user-shield' :
                         contact.role === 'WORKER' ? 'fa-helmet-safety' :
                         contact.role === 'ADMIN' ? 'fa-shield-halved' :
                         contact.role === 'PLANNER' ? 'fa-chart-line' : 'fa-user';

        const myId = effectiveUserId || 'guest';
        const sortedIds = [myId, contact.id].sort();
        const channelName = `direct-${sortedIds.join('-')}`;

        conversationsMap.set(contact.id, {
          id: contact.id,
          userId: contact.id,
          channel: channelName,
          name: contact.fullName || contact.username,
          username: contact.username,
          role: contact.role,
          organization: contact.organization,
          phone: contact.phone,
          isGroup: false,
          avatarIcon: roleIcon,
          avatarColor: roleColor,
          lastMessage: null,
          unreadCount: 0
        });
      }
    }

    // 4. Sort: Conversations with actual messages first (newest to oldest), then contacts without messages
    const directList = Array.from(conversationsMap.values());
    directList.sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      if (timeA > 0 || timeB > 0) {
        return timeB - timeA;
      }
      return a.name.localeCompare(b.name);
    });

    return [generalConv, ...directList];
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
   * Setup Socket.io real-time chat listeners with privacy isolation
   */
  static setupSocketMessaging(io: Server) {
    io.on('connection', (socket: Socket) => {
      socket.on('join_channel', (channel: string) => {
        if (channel) socket.join(channel);
      });

      socket.on('join_user', (userId: string) => {
        if (userId) socket.join(`user_${userId}`);
      });

      socket.on('send_message', async (data: { senderId: string; channel: string; text: string }) => {
        try {
          const msg = await this.saveMessage(data.senderId, data.channel, data.text);
          io.to(data.channel).emit('new_message', msg);

          if (data.channel === 'upazila-general') {
            io.emit('conversation_updated', {
              channel: data.channel,
              latestMessage: msg
            });
          } else if (data.channel && data.channel.startsWith('direct-')) {
            // Emit ONLY to the direct channel room
            io.to(data.channel).emit('conversation_updated', {
              channel: data.channel,
              latestMessage: msg
            });

            // Also notify participant user rooms if outside current channel view
            if (data.senderId) {
              io.to(`user_${data.senderId}`).emit('conversation_updated', {
                channel: data.channel,
                latestMessage: msg
              });

              const rem = data.channel.slice('direct-'.length);
              let otherId = '';
              if (rem.startsWith(data.senderId + '-')) {
                otherId = rem.slice(data.senderId.length + 1);
              } else if (rem.endsWith('-' + data.senderId)) {
                otherId = rem.slice(0, rem.length - data.senderId.length - 1);
              }
              if (otherId) {
                io.to(`user_${otherId}`).emit('conversation_updated', {
                  channel: data.channel,
                  latestMessage: msg
                });
              }
            }
          }
        } catch (err) {
          socket.emit('error', { message: 'Failed to send message' });
        }
      });
    });
  }
}