import { PrismaClient } from '@prisma/client';
import { InMemoryStore } from '../src/lib/inMemoryStore';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const renderDatabaseUrl = process.env.DATABASE_URL || 'postgresql://greensignal_user:gWUsfi0oH2iZWEsZJiK5uVFSKA5bBdSg@dpg-dack328n74is73dff5og-a.singapore-postgres.render.com/greensignal_ai?sslmode=require';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: renderDatabaseUrl
    }
  }
});

async function main() {
  console.log('🚀 Connecting to Render PostgreSQL database...');
  await prisma.$connect();
  console.log('✅ Connected successfully to Render!');

  const store = new InMemoryStore();
  console.log(`📦 Loaded in-memory dataset:`);
  console.log(`   - Administrative Nodes: ${store.administrativeNodes.length}`);
  console.log(`   - User Accounts:        ${store.users.length}`);
  console.log(`   - Relief Centers:       ${store.reliefCenters.length}`);
  console.log(`   - Sensor Stations:      ${store.sensorNodes.length}`);
  console.log(`   - Disaster Alerts:      ${store.disasterAlerts.length}`);
  console.log(`   - Response Policies:    ${store.responsePolicies.length}`);

  // 0. Clean Existing Partial/Legacy Records
  console.log('\n🧹 Clearing old data to ensure pristine seeding...');
  await prisma.chatMessage.deleteMany({});
  await prisma.simulationRun.deleteMany({});
  await prisma.responsePolicy.deleteMany({});
  await prisma.disasterAlert.deleteMany({});
  await prisma.sensorNode.deleteMany({});
  await prisma.reliefCenter.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.administrativeNode.deleteMany({});
  console.log('   ✓ Database cleared.');

  // 1. Seed Administrative Nodes by Tier
  console.log('\n🌱 Seeding Administrative Nodes...');
  const tiers: ('COUNTRY' | 'DIVISION' | 'DISTRICT' | 'UPAZILA')[] = ['COUNTRY', 'DIVISION', 'DISTRICT', 'UPAZILA'];
  for (const tier of tiers) {
    const nodesInTier = store.administrativeNodes
      .filter(n => n.tier === tier)
      .map(n => ({
        id: n.id,
        name: n.name,
        tier: n.tier,
        code: n.code,
        parentId: n.parentId,
        latitude: n.latitude,
        longitude: n.longitude,
        inventory: n.inventory,
        requirements: n.requirements,
        affectedPeople: n.affectedPeople,
        sensorData: n.sensorData,
        incidents: n.incidents || [],
        situationReport: n.situationReport,
        messages: n.messages || []
      }));

    if (nodesInTier.length > 0) {
      const result = await prisma.administrativeNode.createMany({
        data: nodesInTier
      });
      console.log(`   ✓ ${tier} nodes seeded: ${result.count} / ${nodesInTier.length}`);
    }
  }

  // 2. Seed Users
  console.log('\n🌱 Seeding Users (with @dmr.bd.gov emails)...');
  const validNodeIds = new Set(store.administrativeNodes.map(n => n.id));
  const userData = store.users.map(u => ({
    id: u.id,
    username: u.username,
    email: u.email,
    passwordHash: u.passwordHash,
    fullName: u.fullName,
    role: u.role,
    phone: u.phone,
    organization: u.organization,
    districtNodeId: u.districtNodeId && validNodeIds.has(u.districtNodeId) ? u.districtNodeId : null,
    messages: u.messages || []
  }));

  const userChunkSize = 500;
  let totalUsersSeeded = 0;
  for (let i = 0; i < userData.length; i += userChunkSize) {
    const chunk = userData.slice(i, i + userChunkSize);
    const result = await prisma.user.createMany({
      data: chunk
    });
    totalUsersSeeded += result.count;
  }
  console.log(`   ✓ Users seeded: ${totalUsersSeeded} / ${userData.length}`);

  // 3. Seed Relief Centers
  console.log('\n🌱 Seeding Relief Centers...');
  const centerData = store.reliefCenters.map(c => ({
    id: c.id,
    centerCode: c.centerCode,
    name: c.name,
    districtNodeId: c.districtNodeId,
    latitude: c.latitude,
    longitude: c.longitude,
    capacity: c.capacity,
    occupancy: c.occupancy,
    contactNum: c.contactNum,
    isOperational: c.isOperational,
    stockPolicy: c.stockPolicy,
    currentStock: c.currentStock,
    emergencyRequirement: c.emergencyRequirement,
    restockingRequirement: c.restockingRequirement
  }));

  const centerChunkSize = 500;
  let totalCentersSeeded = 0;
  for (let i = 0; i < centerData.length; i += centerChunkSize) {
    const chunk = centerData.slice(i, i + centerChunkSize);
    const result = await prisma.reliefCenter.createMany({
      data: chunk
    });
    totalCentersSeeded += result.count;
  }
  console.log(`   ✓ Relief Centers seeded: ${totalCentersSeeded} / ${centerData.length}`);

  // 4. Seed Sensor Nodes
  console.log('\n🌱 Seeding Sensor Nodes...');
  const sensorData = store.sensorNodes.map(s => ({
    id: s.id,
    sensorCode: s.sensorCode,
    districtNodeId: s.districtNodeId,
    type: s.type,
    latitude: s.latitude,
    longitude: s.longitude,
    metricValue: s.metricValue,
    status: s.status,
    lastPing: s.lastPing || new Date()
  }));

  const sensorChunkSize = 500;
  let totalSensorsSeeded = 0;
  for (let i = 0; i < sensorData.length; i += sensorChunkSize) {
    const chunk = sensorData.slice(i, i + sensorChunkSize);
    const result = await prisma.sensorNode.createMany({
      data: chunk
    });
    totalSensorsSeeded += result.count;
  }
  console.log(`   ✓ Sensor Stations seeded: ${totalSensorsSeeded} / ${sensorData.length}`);

  // 5. Seed Disaster Alerts
  console.log('\n🌱 Seeding Disaster Alerts...');
  const alertData = store.disasterAlerts.map(a => ({
    id: a.id,
    title: a.title,
    description: a.description,
    district: a.district,
    severity: a.severity,
    isActive: a.isActive
  }));
  const alertResult = await prisma.disasterAlert.createMany({
    data: alertData
  });
  console.log(`   ✓ Alerts seeded: ${alertResult.count} / ${alertData.length}`);

  // 6. Seed Response Policies
  console.log('\n🌱 Seeding Response Policies...');
  const policyData = store.responsePolicies.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status,
    tierScope: p.tierScope,
    triggers: p.triggers,
    allocationRules: p.allocationRules,
    priorityWeights: p.priorityWeights,
    costParameters: p.costParameters
  }));
  const policyResult = await prisma.responsePolicy.createMany({
    data: policyData
  });
  console.log(`   ✓ Response Policies seeded: ${policyResult.count} / ${policyData.length}`);

  // 7. Seed Initial Chat Messages
  console.log('\n🌱 Seeding Initial Chat Messages...');
  const validUserIds = new Set(userData.map(u => u.id));
  const messageData = store.chatMessages
    .filter(m => validUserIds.has(m.senderId))
    .map(m => ({
      id: m.id,
      channel: m.channel,
      text: m.text,
      senderId: m.senderId,
      createdAt: m.createdAt || new Date()
    }));
  if (messageData.length > 0) {
    const msgResult = await prisma.chatMessage.createMany({
      data: messageData
    });
    console.log(`   ✓ Chat Messages seeded: ${msgResult.count} / ${messageData.length}`);
  }

  // 8. Verification Counts from Render
  console.log('\n📊 Verifying Render PostgreSQL live record counts:');
  const [nodeCount, userCount, rcCount, snCount, alertCount, policyCount, msgCount] = await Promise.all([
    prisma.administrativeNode.count(),
    prisma.user.count(),
    prisma.reliefCenter.count(),
    prisma.sensorNode.count(),
    prisma.disasterAlert.count(),
    prisma.responsePolicy.count(),
    prisma.chatMessage.count()
  ]);

  console.log(`   ✨ administrative_nodes: ${nodeCount}`);
  console.log(`   ✨ users:                ${userCount}`);
  console.log(`   ✨ relief_centers:       ${rcCount}`);
  console.log(`   ✨ sensor_nodes:         ${snCount}`);
  console.log(`   ✨ disaster_alerts:      ${alertCount}`);
  console.log(`   ✨ response_policies:    ${policyCount}`);
  console.log(`   ✨ chat_messages:        ${msgCount}`);

  console.log('\n🎉 RENDER DATABASE SEEDING COMPLETED SUCCESSFULLY!');
}

main()
  .catch(err => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
