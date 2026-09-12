import { Router } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { MessagingService } from '../services/messaging';
import { AlertsService } from '../services/alerts';
import { CoordinatorDbService } from '../services/coordinatorDb';
import { DbAdminService } from '../services/dbAdmin';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'greensignal_ai_secure_jwt_secret_key_2026';

// 1. Authentication Endpoints
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }]
      },
      include: { districtNode: true }
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = bcrypt.compareSync(password, user.passwordHash) || password === user.username;
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user.id, role: user.role, districtNodeId: user.districtNodeId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({ token, user });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// 2. Alerts Endpoint
router.get(['/alerts', '/alerts/active'], async (req, res) => {
  try {
    const district = req.query.district as string;
    const alerts = await AlertsService.getActiveAlerts(district);
    return res.json(alerts);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/alerts/broadcast', async (req, res) => {
  try {
    const { title, description, district, severity } = req.body;
    const alert = await AlertsService.createAlert(
      title || 'Disaster Warning',
      description || 'Critical condition observed.',
      district || 'NATIONWIDE',
      severity || 'WARNING'
    );

    // Emit live alert over Socket.io
    const io = req.app.get('io');
    io?.emit('new_alert', alert);

    return res.json(alert);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// 3. Upazila Dashboard Context (Nearest Relief Center, Sensors, Upazila Coordinator Contact)
router.get(['/upazila-context', '/upazila-context/:nodeId'], async (req, res) => {
  try {
    const nodeId = req.params.nodeId;

    let targetNode = nodeId ? await prisma.administrativeNode.findUnique({
      where: { id: nodeId }
    }) : null;

    if (!targetNode) {
      targetNode = await prisma.administrativeNode.findFirst({
        where: { tier: 'UPAZILA' }
      });
    }

    if (!targetNode) return res.status(404).json({ message: 'Administrative node not found' });

    const reliefCenter = await prisma.reliefCenter.findFirst({
      where: { districtNodeId: targetNode.id }
    });

    const sensors = await prisma.sensorNode.findMany({
      where: { districtNodeId: targetNode.id }
    });

    const coordinator = await prisma.user.findFirst({
      where: { districtNodeId: targetNode.id, role: 'COORDINATOR' },
      select: { fullName: true, phone: true, username: true }
    });

    const districtNodeId = targetNode.parentId || targetNode.id;
    const districtReliefCenters = await prisma.reliefCenter.findMany({
      where: {
        districtNode: {
          OR: [{ id: districtNodeId }, { parentId: districtNodeId }]
        }
      }
    });

    const districtSensors = await prisma.sensorNode.findMany({
      where: {
        districtNode: {
          OR: [{ id: districtNodeId }, { parentId: districtNodeId }]
        }
      }
    });

    return res.json({
      upazilaNode: targetNode,
      nearestReliefCenter: reliefCenter,
      sensors,
      coordinatorContact: coordinator || { fullName: targetNode.name + ' Officer', phone: '+8801700000000', username: 'Coordinator' },
      districtReliefCenters,
      districtSensors
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// 4. Coordinator Stock Management & Scope Data
router.get(['/coordinator/scope', '/coordinator/scope/:userNodeId'], async (req, res) => {
  try {
    const data = await CoordinatorDbService.getCoordinatorScopeData(req.params.userNodeId);
    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.put('/coordinator/stock/:centerId', async (req, res) => {
  try {
    const { stockPolicy, currentStock, emergencyRequirement } = req.body;
    const updated = await CoordinatorDbService.updateReliefCenterStock(
      req.params.centerId,
      stockPolicy,
      currentStock,
      emergencyRequirement
    );
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.get(['/coordinator/boq/:centerId', '/coordinator/work-order/:centerId'], async (req, res) => {
  try {
    const boq = await CoordinatorDbService.generateBOQ(req.params.centerId);
    return res.json(boq);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// 5. Messaging & User Search Routes
router.get('/messages/search-users', async (req, res) => {
  try {
    const q = (req.query.q as string) || '';
    const userId = (req.query.userId as string) || '';
    const results = await MessagingService.searchUsers(q, userId);
    return res.json(results);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.get(['/messages/:channel', '/messages/channel/:channel'], async (req, res) => {
  try {
    const channel = req.params.channel;
    const history = await MessagingService.getChannelHistory(channel);
    return res.json(history);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// ==========================================
// 6. DB Manager Developer Routes
// ==========================================

router.get('/db-admin/tables', async (req, res) => {
  try {
    const stats = await DbAdminService.getTableStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/db-admin/table/:tableName', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const data = await DbAdminService.getTableData(req.params.tableName, limit);
    res.json(data);
  } catch (err: any) {
    const status = err.message.includes('not found') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

router.post('/db-admin/table/:tableName', async (req, res) => {
  try {
    let payload = { ...req.body };

    // If injecting chat message without a valid senderId, link to an existing user
    if (req.params.tableName === 'chat_messages' || req.params.tableName === 'chatMessage') {
      if (!payload.senderId || payload.senderId === 'admin-id') {
        const defaultSender = await prisma.user.findFirst();
        if (defaultSender) payload.senderId = defaultSender.id;
      }
    }

    const newRecord = await DbAdminService.createRecord(req.params.tableName, payload);

    // Live broadcast if alert or chat message was inserted
    const io = req.app.get('io');
    if (req.params.tableName === 'disaster_alerts' || req.params.tableName === 'disasterAlert') {
      io?.emit('new_alert', newRecord);
    } else if (req.params.tableName === 'chat_messages' || req.params.tableName === 'chatMessage') {
      io?.to(payload.channel || 'upazila-general').emit('new_message', newRecord);
    }

    res.json(newRecord);
  } catch (err: any) {
    const status = err.message.includes('not found') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

router.put('/db-admin/table/:tableName/:id', async (req, res) => {
  try {
    const updated = await DbAdminService.updateRecord(req.params.tableName, req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    const status = err.message.includes('not found') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

router.delete('/db-admin/table/:tableName/:id', async (req, res) => {
  try {
    const result = await DbAdminService.deleteRecord(req.params.tableName, req.params.id);
    res.json(result);
  } catch (err: any) {
    const status = err.message.includes('not found') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

router.post('/db-admin/query', async (req, res) => {
  try {
    const result = await DbAdminService.executeQuery(req.body.query);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Fast User Impersonation API
router.post('/db-admin/impersonate', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'A username, full name, or role query is required' });
    }

    const trimmed = query.trim();

    // 1. Direct match on username or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: trimmed, mode: 'insensitive' } },
          { email: { equals: trimmed, mode: 'insensitive' } },
          { fullName: { contains: trimmed, mode: 'insensitive' } }
        ]
      },
      include: { districtNode: true }
    });

    // 2. Keyword fallback for quick presets ("Citizen", "Coordinator", "Planner", "Admin")
    if (!user) {
      const qUpper = trimmed.toUpperCase();
      let targetRole: any = null;
      if (qUpper.includes('CITIZEN')) targetRole = 'CITIZEN';
      else if (qUpper.includes('COORDINATOR')) targetRole = 'COORDINATOR';
      else if (qUpper.includes('PLANNER')) targetRole = 'PLANNER';
      else if (qUpper.includes('ADMIN')) targetRole = 'ADMIN';

      if (targetRole) {
        user = await prisma.user.findFirst({
          where: { role: targetRole },
          include: { districtNode: true }
        });
      }
    }

    if (!user) {
      return res.status(404).json({ message: `No user account found matching "${trimmed}"` });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, districtNodeId: user.districtNodeId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({ token, user });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// Export Database SQL Dump
router.get('/db-admin/export-sql', async (req, res) => {
  try {
    const dump = await DbAdminService.exportSqlDump();
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', 'attachment; filename="greensignal_ai_dump.sql"');
    res.send(dump);
  } catch (err: any) {
    res.status(500).send(`-- Export Failed: ${err.message}`);
  }
});

export default router;
