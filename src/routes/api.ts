import { Router } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { MessagingService } from '../services/messaging';
import { AlertsService } from '../services/alerts';
import { CoordinatorDbService } from '../services/coordinatorDb';

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
router.get('/alerts', async (req, res) => {
  try {
    const district = req.query.district as string;
    const alerts = await AlertsService.getActiveAlerts(district);
    return res.json(alerts);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// 3. Upazila Dashboard Context (Nearest Relief Center, Sensors, Upazila Coordinator Contact)
router.get('/upazila-context/:nodeId', async (req, res) => {
  try {
    const nodeId = req.params.nodeId;

    let targetNode = await prisma.administrativeNode.findUnique({
      where: { id: nodeId }
    });

    if (!targetNode) {
      targetNode = await prisma.administrativeNode.findFirst({
        where: { tier: 'UPAZILA' }
      });
    }

    if (!targetNode) return res.status(404).json({ message: 'Administrative node not found' });

    // Find nearest/upazila relief center
    const reliefCenter = await prisma.reliefCenter.findFirst({
      where: { districtNodeId: targetNode.id }
    });

    // Find sensors in this Upazila
    const sensors = await prisma.sensorNode.findMany({
      where: { districtNodeId: targetNode.id }
    });

    // Find Upazila Coordinator user for contact button
    const coordinator = await prisma.user.findFirst({
      where: { districtNodeId: targetNode.id, role: 'COORDINATOR' },
      select: { fullName: true, phone: true, username: true }
    });

    // Find parent district node to get all district relief centers for mapping
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
router.get('/coordinator/scope/:userNodeId', async (req, res) => {
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

router.get('/coordinator/boq/:centerId', async (req, res) => {
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

router.get('/messages/:channel', async (req, res) => {
  try {
    const history = await MessagingService.getChannelHistory(req.params.channel);
    return res.json(history);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;
