import { PrismaClient, Role, NodeTier, SensorType, NodeStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface CSVRow {
  division: string;
  district: string;
  upazila: string;
  lat: number | null;
  lng: number | null;
}

// Helper to sanitize text for usernames & codes
function sanitizeName(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

function createCode(prefix: string, name: string): string {
  const clean = name.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `${prefix}-${clean}`;
}

// Simple CSV parser for upazilla CSVs
function parseCSVs(): CSVRow[] {
  const basePath = process.cwd();
  const mainCsvPath = path.join(basePath, 'upazillas.csv');
  const latLongCsvPath = path.join(basePath, 'upazilla lat long - Sheet1.csv');

  const mainLines = fs.readFileSync(mainCsvPath, 'utf-8').split(/\r?\n/).filter(line => line.trim().length > 0);
  const latLongLines = fs.readFileSync(latLongCsvPath, 'utf-8').split(/\r?\n/).filter(line => line.trim().length > 0);

  // Map to store lat/long lookup: "Division|District|Upazila" -> { lat, lng }
  const coordsMap = new Map<string, { lat: number; lng: number }>();

  // Process lat/long CSV
  let currentDivLL = '';
  let currentDistLL = '';

  for (let i = 1; i < latLongLines.length; i++) {
    const parts = latLongLines[i].split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/);
    if (parts.length < 3) continue;

    const rawDiv = parts[0]?.trim();
    const rawDist = parts[1]?.trim();
    const rawUpz = parts[2]?.trim();
    
    // Joint Lat,long column or separated columns
    let rawLatLongStr = parts.slice(3).join(',').replace(/"/g, '').trim();

    if (rawDiv) currentDivLL = rawDiv;
    if (rawDist) currentDistLL = rawDist.replace(/\s+District$/i, '');

    if (!rawUpz) continue;

    const upzClean = rawUpz.replace(/^\d+\.\s*/, '').replace(/\s+Upazila$/i, '').trim();
    const key = `${currentDivLL.toLowerCase()}|${currentDistLL.toLowerCase()}|${upzClean.toLowerCase()}`;

    if (rawLatLongStr) {
      const coords = rawLatLongStr.split(',').map(s => parseFloat(s.trim()));
      if (coords.length >= 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        coordsMap.set(key, { lat: coords[0], lng: coords[1] });
      }
    }
  }

  // Fallback map by district for missing lat/long
  const districtCoordsFallback = new Map<string, { lat: number; lng: number }>();
  coordsMap.forEach((coords, key) => {
    const districtKey = key.split('|')[1];
    if (!districtCoordsFallback.has(districtKey)) {
      districtCoordsFallback.set(districtKey, coords);
    }
  });

  // Process main upazilla CSV
  const rows: CSVRow[] = [];
  let currentDiv = '';
  let currentDist = '';

  for (let i = 1; i < mainLines.length; i++) {
    const parts = mainLines[i].split(',').map(p => p.trim());
    if (parts.length < 3) continue;

    const rawDiv = parts[0];
    const rawDist = parts[1];
    const rawUpz = parts[2];

    if (rawDiv) currentDiv = rawDiv;
    if (rawDist) currentDist = rawDist.replace(/\s+District$/i, '');

    if (!rawUpz) continue;

    const upzClean = rawUpz.replace(/^\d+\.\s*/, '').replace(/\s+Upazila$/i, '').trim();
    const lookupKey = `${currentDiv.toLowerCase()}|${currentDist.toLowerCase()}|${upzClean.toLowerCase()}`;
    const districtKey = currentDist.toLowerCase();

    let coords = coordsMap.get(lookupKey) || districtCoordsFallback.get(districtKey) || { lat: 23.8103, lng: 90.4125 };

    rows.push({
      division: sanitizeName(currentDiv),
      district: sanitizeName(currentDist),
      upazila: sanitizeName(upzClean),
      lat: coords.lat,
      lng: coords.lng
    });
  }

  return rows;
}

async function main() {
  console.log('🌱 Starting Database Seeding Process...');

  // Clear existing database records in safe sequence (except users, which we upsert)
  await prisma.simulationRun.deleteMany();
  await prisma.responsePolicy.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.disasterAlert.deleteMany();
  await prisma.sensorNode.deleteMany();
  await prisma.reliefCenter.deleteMany();
  await prisma.administrativeNode.deleteMany();

  console.log('🧹 Cleaned existing database tables (excluding users).');

  // 1. Create National HQ Node
  const countryNode = await prisma.administrativeNode.create({
    data: {
      name: 'Bangladesh National Command',
      tier: NodeTier.COUNTRY,
      code: 'BD-HQ',
      latitude: 23.8103,
      longitude: 90.4125
    }
  });

  // Parse CSV Data
  const csvData = parseCSVs();
  console.log(`📊 Parsed ${csvData.length} Upazilas across Bangladesh.`);

  const divisionMap = new Map<string, string>(); // DivName -> NodeId
  const districtMap = new Map<string, string>(); // DistName -> NodeId
  const upazilaMap = new Map<string, { id: string; lat: number; lng: number; district: string; division: string }>();

  // Hash Cache for User Passwords (Password == Username)
  const hashCache = new Map<string, string>();
  const getPasswordHash = (username: string): string => {
    if (!hashCache.has(username)) {
      hashCache.set(username, bcrypt.hashSync(username, 10));
    }
    return hashCache.get(username)!;
  };

  // 2. Build Divisions, Districts, & Upazilas Hierarchy
  for (const row of csvData) {
    // Division Node
    if (!divisionMap.has(row.division)) {
      const divNode = await prisma.administrativeNode.create({
        data: {
          name: row.division,
          tier: NodeTier.DIVISION,
          code: createCode('DIV', row.division),
          parentId: countryNode.id,
          latitude: row.lat,
          longitude: row.lng
        }
      });
      divisionMap.set(row.division, divNode.id);

      // Seed Division Coordinator Account using upsert
      const divUsername = `${row.division} Coordinator`;
      await prisma.user.upsert({
        where: { username: divUsername },
        update: { districtNodeId: divNode.id }, 
        create: {
          username: divUsername,
          email: `${row.division.toLowerCase().replace(/\s+/g, '')}.coordinator@bndrss.gov.bd`,
          passwordHash: getPasswordHash(divUsername),
          fullName: `${row.division} Division Coordinator`,
          role: Role.COORDINATOR,
          organization: 'Ministry of Disaster Management & Relief',
          districtNodeId: divNode.id
        }
      });
    }

    // District Node
    const divId = divisionMap.get(row.division)!;
    const distKey = `${row.division}|${row.district}`;

    if (!districtMap.has(distKey)) {
      const distNode = await prisma.administrativeNode.create({
        data: {
          name: row.district,
          tier: NodeTier.DISTRICT,
          code: createCode('DST', `${row.division}-${row.district}`),
          parentId: divId,
          latitude: row.lat,
          longitude: row.lng
        }
      });
      districtMap.set(distKey, distNode.id);

      // Seed District Coordinator Account using upsert
      const distCoordUsername = `${row.district} Coordinator`;
      await prisma.user.upsert({
        where: { username: distCoordUsername },
        update: { districtNodeId: distNode.id },
        create: {
          username: distCoordUsername,
          email: `${row.district.toLowerCase().replace(/\s+/g, '')}.coordinator@bndrss.gov.bd`,
          passwordHash: getPasswordHash(distCoordUsername),
          fullName: `${row.district} District Coordinator`,
          role: Role.COORDINATOR,
          organization: 'District Disaster Management Committee',
          districtNodeId: distNode.id
        }
      });

      // Seed District Planner Account using upsert
      const distPlannerUsername = `${row.district} Planner`;
      await prisma.user.upsert({
        where: { username: distPlannerUsername },
        update: { districtNodeId: distNode.id },
        create: {
          username: distPlannerUsername,
          email: `${row.district.toLowerCase().replace(/\s+/g, '')}.planner@bndrss.gov.bd`,
          passwordHash: getPasswordHash(distPlannerUsername),
          fullName: `${row.district} Resource Planner`,
          role: Role.PLANNER,
          organization: 'Bangladesh Planning Commission',
          districtNodeId: distNode.id
        }
      });
    }

    // Upazila Node
    const distId = districtMap.get(distKey)!;
    const upzNode = await prisma.administrativeNode.create({
      data: {
        name: row.upazila,
        tier: NodeTier.UPAZILA,
        code: createCode('UPZ', `${row.district}-${row.upazila}`),
        parentId: distId,
        latitude: row.lat,
        longitude: row.lng
      }
    });

    upazilaMap.set(row.upazila, {
      id: upzNode.id,
      lat: row.lat || 23.8103,
      lng: row.lng || 90.4125,
      district: row.district,
      division: row.division
    });

    // Seed Upazila Citizen Account using upsert
    const citizenUsername = `${row.upazila} Citizen`;
    await prisma.user.upsert({
      where: { username: citizenUsername },
      update: { districtNodeId: upzNode.id },
      create: {
        username: citizenUsername,
        email: `${row.upazila.toLowerCase().replace(/\s+/g, '')}.citizen@bndrss.gov.bd`,
        passwordHash: getPasswordHash(citizenUsername),
        fullName: `${row.upazila} Resident Citizen`,
        role: Role.CITIZEN,
        districtNodeId: upzNode.id
      }
    });

    // Seed Upazila Coordinator Account using upsert
    const upzCoordUsername = `${row.upazila} Coordinator`;
    await prisma.user.upsert({
      where: { username: upzCoordUsername },
      update: { districtNodeId: upzNode.id },
      create: {
        username: upzCoordUsername,
        email: `${row.upazila.toLowerCase().replace(/\s+/g, '')}.coordinator@bndrss.gov.bd`,
        passwordHash: getPasswordHash(upzCoordUsername),
        fullName: `${row.upazila} Disaster Officer`,
        role: Role.COORDINATOR,
        organization: 'Upazila Nirbahi Office',
        districtNodeId: upzNode.id
      }
    });

    // 3. Seed Sensors for Each Upazila (WATER, WIND, SALINITY, SEISMOGRAPH)
    const sensorTypes: SensorType[] = [
      SensorType.WATER,
      SensorType.WIND,
      SensorType.SALINITY,
      SensorType.SEISMOGRAPH
    ];

    const initialMetrics = {
      WATER: '2.1m',
      WIND: '18km/h',
      SALINITY: '2.4ppt',
      SEISMOGRAPH: '1.2M'
    };

    for (const sType of sensorTypes) {
      await prisma.sensorNode.create({
        data: {
          sensorCode: createCode('SN', `${row.upazila}-${sType}`),
          districtNodeId: upzNode.id,
          type: sType,
          latitude: (row.lat || 23.8103) + (Math.random() - 0.5) * 0.02,
          longitude: (row.lng || 90.4125) + (Math.random() - 0.5) * 0.02,
          metricValue: initialMetrics[sType],
          status: NodeStatus.ACTIVE
        }
      });
    }

    // 4. Seed Relief Center for Each Upazila with 4 JSON Stock Columns
    await prisma.reliefCenter.create({
      data: {
        centerCode: createCode('RC', `${row.district}-${row.upazila}`),
        name: `${row.upazila} Primary Relief Shelter`,
        districtNodeId: upzNode.id,
        latitude: row.lat || 23.8103,
        longitude: row.lng || 90.4125,
        capacity: 1000,
        occupancy: 150,
        contactNum: '+8801700000000',
        isOperational: true,
        
        stockPolicy: {
          beds: 600,
          food_packs: 1200,
          medical_kits: 300,
          vehicles: 6,
          tents: 80
        },
        currentStock: {
          beds: 420,
          food_packs: 850,
          medical_kits: 180,
          vehicles: 4,
          tents: 50
        },
        emergencyRequirement: {
          beds: 80,
          food_packs: 200,
          medical_kits: 50,
          vehicles: 2,
          tents: 20
        },
        restockingRequirement: {
          beds: 180,
          food_packs: 350,
          medical_kits: 120,
          vehicles: 2,
          tents: 30
        }
      }
    });
  }

  // 5. Seed System Master Admin Account using upsert
  const adminUsername = 'Admin';
  await prisma.user.upsert({
    where: { username: adminUsername },
    update: { districtNodeId: countryNode.id },
    create: {
      username: adminUsername,
      email: 'admin@bndrss.gov.bd',
      passwordHash: getPasswordHash(adminUsername),
      fullName: 'System Administrator',
      role: Role.ADMIN,
      organization: 'B-NDRSS Central Engineering',
      districtNodeId: countryNode.id
    }
  });

  // 6. Seed Baseline Response Policy
  const samplePolicy = await prisma.responsePolicy.create({
    data: {
      name: 'Cost-Minimized Flood & Cyclone Response Policy v1',
      description: 'National baseline optimization strategy balancing transport cost against unmet demand penalties.',
      tierScope: NodeTier.COUNTRY,
      triggers: {
        min_rainfall_24h_mm: 100.0,
        river_level_above_danger_m: 0.5,
        predicted_path_probability: 0.70
      },
      allocationRules: {
        food_packs_per_person_per_day: 1.0,
        water_liters_per_person_per_day: 3.0,
        medical_kits_per_100_people: 1.0,
        hub_safety_stock_percent: 20
      },
      priorityWeights: {
        vulnerability_score_weight: 0.35,
        affected_population_weight: 0.30,
        lead_time_proximity_weight: 0.20,
        shelter_capacity_utilization_weight: 0.15
      },
      costParameters: {
        transport_cost_per_km_ton: 45.0,
        warehouse_holding_cost_per_day: 5.0,
        unmet_demand_penalty_per_person: 1500.0
      }
    }
  });

  console.log(`✅ Seeding Completed Successfully!`);
  console.log(`   • ${csvData.length} Upazilas, 64 Districts, 8 Divisions created.`);
  console.log(`   • ${csvData.length * 4} Sensors seeded (4 per Upazila).`);
  console.log(`   • ${csvData.length} Relief Centers seeded with 4 JSON stock columns.`);
  console.log(`   • Users ensured (via upsert): ${csvData.length} Citizens, ${csvData.length} Upazila Coords, 64 Dist Coords, 64 Dist Planners, 8 Div Coords, 1 Admin.`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
