import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';
import { MessagingService } from './services/messaging';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend from public/ (automatically covers public/dev)
app.use(express.static(path.join(__dirname, '../public')));

// Mount API routes
app.use('/api', apiRoutes);

// WebSocket messaging setup
MessagingService.setupSocketMessaging(io);

// SPA Fallback
app.get('*', (req, res) => {
  // Prevent missing API or Dev routes from returning index.html
  if (req.path.startsWith('/api') || req.path.startsWith('/dev')) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  // Otherwise, serve the SPA for standard frontend routes
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

server.listen(PORT, () => {
  console.log(`🚀 GreenSignalAI Server running at http://localhost:${PORT}`);
});
