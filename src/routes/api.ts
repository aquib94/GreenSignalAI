import { Router } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { MessagingService } from '../services/messaging';
import { AlertsService } from '../services/alerts';
import { CoordinatorDbService } from '../services/coordinatorDb';
import { DbAdminService } from '../services/dbAdmin';
import { generateProposalPdf } from '../services/proposalPdf';
import path from 'path';
import fs from 'fs';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'greensignal_ai_secure_jwt_secret_key_2026';

// 1. Authentication Endpoints
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username/email and password are required' });
    }

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

    return res.json({ token, user, message: 'Authentication successful' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// User Registration / Signup
router.post(['/auth/signup', '/auth/register'], async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      fullName,
      role = 'CITIZEN',
      phone,
      organization,
      districtNodeId
    } = req.body;

    if (!username || !email || !password || !fullName) {
      return res.status(400).json({
        message: 'Missing required fields: username, email, password, and fullName are mandatory.'
      });
    }

    // Format and sanitize
    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '_');
    const cleanEmail = email.trim().toLowerCase();
    const cleanFullName = fullName.trim();

    if (password.length < 4) {
      return res.status(400).json({ message: 'Password must be at least 4 characters long' });
    }

    // Check for duplicate username or email
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanUsername },
          { email: cleanEmail }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.username.toLowerCase() === cleanUsername) {
        return res.status(409).json({ message: `Username "${cleanUsername}" is already taken. Please choose another.` });
      }
      if (existingUser.email.toLowerCase() === cleanEmail) {
        return res.status(409).json({ message: `Email "${cleanEmail}" is already registered. Please sign in instead.` });
      }
    }

    // Validate role
    const validRoles = ['CITIZEN', 'WORKER', 'COORDINATOR', 'PLANNER', 'ADMIN'];
    const assignedRole = validRoles.includes(role?.toUpperCase()) ? role.toUpperCase() : 'CITIZEN';

    // Hash password
    const passwordHash = bcrypt.hashSync(password, 10);

    // Verify districtNodeId if provided
    let verifiedDistrictNodeId: string | null = null;
    if (districtNodeId) {
      const node = await prisma.administrativeNode.findUnique({
        where: { id: districtNodeId }
      });
      if (node) {
        verifiedDistrictNodeId = node.id;
      }
    }

    // Create user in database
    const newUser = await prisma.user.create({
      data: {
        username: cleanUsername,
        email: cleanEmail,
        passwordHash,
        fullName: cleanFullName,
        role: assignedRole as any,
        phone: phone ? phone.trim() : null,
        organization: organization ? organization.trim() : (assignedRole === 'CITIZEN' ? 'General Public' : 'National Emergency Response'),
        districtNodeId: verifiedDistrictNodeId,
        messages: []
      },
      include: {
        districtNode: true
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, role: newUser.role, districtNodeId: newUser.districtNodeId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      message: 'Account created successfully! Welcome to GreenSignal AI.',
      token,
      user: newUser
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    return res.status(500).json({ message: err.message || 'Internal server error during registration' });
  }
});

// Administrative Nodes & Locations Listing for Signup Selectors
router.get(['/locations', '/administrative-nodes', '/nodes'], async (req, res) => {
  try {
    const nodes = await prisma.administrativeNode.findMany({
      orderBy: { name: 'asc' }
    });

    const upazilas = nodes.filter((n: any) => n.tier === 'UPAZILA');
    const districts = nodes.filter((n: any) => n.tier === 'DISTRICT');
    const divisions = nodes.filter((n: any) => n.tier === 'DIVISION');

    return res.json({
      total: nodes.length,
      upazilas: upazilas.map((u: any) => ({ id: u.id, name: u.name, code: u.code, parentId: u.parentId })),
      districts: districts.map((d: any) => ({ id: d.id, name: d.name, code: d.code, parentId: d.parentId })),
      divisions: divisions.map((v: any) => ({ id: v.id, name: v.name, code: v.code })),
      all: nodes.map((n: any) => ({ id: n.id, name: n.name, tier: n.tier, code: n.code, parentId: n.parentId }))
    });
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

// 3b. Interactive GIS Telemetry & Map Features API
router.get(['/gis/features', '/gis/map-data', '/gis/overview'], async (req, res) => {
  try {
    const { nodeId, district, type } = req.query as { nodeId?: string; district?: string; type?: string };

    let targetNodeId = nodeId;
    if (!targetNodeId) {
      // Default to first division (Rajshahi Division) or first district
      const defaultDiv = await prisma.administrativeNode.findFirst({
        where: { tier: 'DIVISION', code: 'DIV-RAJSHAHI' }
      }) || await prisma.administrativeNode.findFirst({
        where: { tier: 'DIVISION' }
      });
      targetNodeId = defaultDiv?.id;
    }

    const scopeData = await CoordinatorDbService.getCoordinatorScopeData(targetNodeId);

    let centers = scopeData.reliefCenters || [];
    let sensors = scopeData.sensors || [];

    // Filter by district if requested
    if (district && district !== 'ALL') {
      centers = centers.filter((c: any) => 
        c.districtNode?.parentId === district || 
        c.districtNode?.id === district ||
        c.districtNode?.parent?.name?.toLowerCase().includes(district.toLowerCase()) ||
        c.districtNode?.name?.toLowerCase().includes(district.toLowerCase())
      );
      sensors = sensors.filter((s: any) => 
        s.districtNode?.parentId === district || 
        s.districtNode?.id === district ||
        s.districtNode?.parent?.name?.toLowerCase().includes(district.toLowerCase()) ||
        s.districtNode?.name?.toLowerCase().includes(district.toLowerCase())
      );
    }

    // Filter by type if requested
    if (type && type !== 'ALL') {
      if (type === 'RELIEF_CENTER') {
        sensors = [];
      } else if (type === 'SENSOR') {
        centers = [];
      } else {
        // Specific sensor type: WATER, WIND, SALINITY, SEISMOGRAPH
        centers = [];
        sensors = sensors.filter((s: any) => s.type === type.toUpperCase());
      }
    }

    // Format for clean client GIS consumption
    const formattedCenters = centers.map((c: any) => {
      const upzName = c.districtNode?.name || 'Upazila Center';
      const distName = c.districtNode?.parent?.name || 'District HQ';
      const distId = c.districtNode?.parent?.id || c.districtNode?.parentId || c.districtNodeId;
      return {
        id: c.id,
        name: c.name,
        centerCode: c.centerCode,
        latitude: c.latitude,
        longitude: c.longitude,
        capacity: c.capacity || 1000,
        occupancy: c.occupancy || 0,
        contactNum: c.contactNum || '+8801700000000',
        isOperational: c.isOperational ?? true,
        stockPolicy: c.stockPolicy || {},
        currentStock: c.currentStock || {},
        emergencyRequirement: c.emergencyRequirement || {},
        restockingRequirement: c.restockingRequirement || {},
        upazilaName: upzName,
        upazilaId: c.districtNodeId,
        districtName: distName,
        districtId: distId,
        districtNodeId: distId
      };
    });

    const formattedSensors = sensors.map((s: any) => {
      const upzName = s.districtNode?.name || 'Local Area';
      const distName = s.districtNode?.parent?.name || 'District';
      const distId = s.districtNode?.parent?.id || s.districtNode?.parentId || s.districtNodeId;
      return {
        id: s.id,
        sensorCode: s.sensorCode,
        type: s.type,
        latitude: s.latitude,
        longitude: s.longitude,
        metricValue: s.metricValue,
        currentValue: s.currentValue,
        unit: s.unit,
        warningThreshold: s.warningThreshold,
        dangerThreshold: s.dangerThreshold,
        timeSeries: s.timeSeries || [],
        forecastSeries: s.forecastSeries || [],
        analytics: s.analytics || {},
        status: s.status || 'ACTIVE',
        lastPing: s.lastPing || new Date(),
        upazilaName: upzName,
        upazilaId: s.districtNodeId,
        districtName: distName,
        districtId: distId,
        districtNodeId: distId
      };
    });

    const sensorCounts = {
      WATER: (scopeData.sensors || []).filter((s: any) => s.type === 'WATER').length,
      WIND: (scopeData.sensors || []).filter((s: any) => s.type === 'WIND').length,
      SALINITY: (scopeData.sensors || []).filter((s: any) => s.type === 'SALINITY').length,
      SEISMOGRAPH: (scopeData.sensors || []).filter((s: any) => s.type === 'SEISMOGRAPH').length,
      RAINFALL: (scopeData.sensors || []).filter((s: any) => s.type === 'RAINFALL').length,
    };

    return res.json({
      scopeTier: scopeData.tier,
      scopeName: scopeData.scopeNode?.name || 'Regional',
      scopeId: scopeData.scopeNode?.id,
      districts: (scopeData.districts || []).map((d: any) => ({ id: d.id, name: d.name, centersCount: d.centersCount })),
      upazilas: (scopeData.upazilas || []).map((u: any) => ({ id: u.id, name: u.name, districtId: u.districtId, districtName: u.districtName })),
      centers: formattedCenters,
      sensors: formattedSensors,
      totalCenters: formattedCenters.length,
      totalSensors: formattedSensors.length,
      sensorCounts
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// 3c. Direct Sensor Detail & Time-Series Prediction API
router.get('/sensors/:id', async (req, res) => {
  try {
    const sensor = await prisma.sensorNode.findUnique({
      where: { id: req.params.id },
      include: {
        districtNode: {
          include: {
            parent: true
          }
        }
      }
    });

    if (!sensor) {
      return res.status(404).json({ message: 'Sensor not found' });
    }

    return res.json({
      ...sensor,
      upazilaName: sensor.districtNode?.name || 'Upazila',
      districtName: sensor.districtNode?.parent?.name || 'District'
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.get('/sensors/:id/history', async (req, res) => {
  try {
    const sensor = await prisma.sensorNode.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        sensorCode: true,
        type: true,
        metricValue: true,
        currentValue: true,
        unit: true,
        warningThreshold: true,
        dangerThreshold: true,
        timeSeries: true,
        forecastSeries: true,
        analytics: true
      }
    });

    if (!sensor) return res.status(404).json({ message: 'Sensor not found' });
    return res.json(sensor);
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

router.get(['/coordinator/scope-boq/:type/:id', '/coordinator/work-order/scope/:type/:id'], async (req, res) => {
  try {
    const boq = await CoordinatorDbService.generateScopeBOQ(req.params.type.toUpperCase() as any, req.params.id);
    return res.json(boq);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// 5. Messaging & User Search Routes
router.get(['/messages/conversations', '/messages/senders'], async (req, res) => {
  try {
    const userId = (req.query.userId as string) || '';
    const conversations = await MessagingService.getRecentConversations(userId);
    return res.json(conversations);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

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
    const userId = (req.query.userId as string) || '';

    // If channel is direct message, verify user belongs to it
    if (channel.startsWith('direct-') && userId) {
      if (!channel.includes(userId)) {
        return res.status(403).json({ message: 'Forbidden: You are not a participant in this conversation' });
      }
    }

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
      const channel = payload.channel || 'upazila-general';
      io?.to(channel).emit('new_message', newRecord);
      if (channel === 'upazila-general') {
        io?.emit('conversation_updated', {
          channel,
          latestMessage: newRecord
        });
      } else {
        io?.to(channel).emit('conversation_updated', {
          channel,
          latestMessage: newRecord
        });
      }
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

// Download Formal Project Proposal PDF
router.get('/proposal/download', async (req, res) => {
  try {
    const staticPdfPath = path.join(process.cwd(), 'public', 'GreenSignal_AI_Project_Proposal.pdf');
    let pdfBuffer: Buffer;

    if (req.query.fresh === '1' || !fs.existsSync(staticPdfPath)) {
      pdfBuffer = await generateProposalPdf(staticPdfPath);
    } else {
      pdfBuffer = fs.readFileSync(staticPdfPath);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="GreenSignal_AI_Project_Proposal.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err: any) {
    console.error('Error serving proposal PDF:', err);
    res.status(500).json({ error: 'Failed to generate proposal PDF', details: err.message });
  }
});

// Generate static proposal PDF immediately on startup
(async () => {
  try {
    const staticPdfPath = path.join(process.cwd(), 'public', 'GreenSignal_AI_Project_Proposal.pdf');
    console.log('Generating updated 8-page proposal PDF at', staticPdfPath);
    await generateProposalPdf(staticPdfPath);
    console.log('Updated 8-page proposal PDF generated successfully');
  } catch (e) {
    console.warn('Initial PDF pre-generation notice:', e);
  }
})();

export default router;
