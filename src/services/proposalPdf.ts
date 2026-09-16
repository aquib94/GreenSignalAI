import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export function generateProposalPdf(outputPath?: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4', // 595.28 x 841.89 pt
        margins: { top: 35, bottom: 20, left: 45, right: 45 },
        bufferPages: true,
        info: {
          Title: 'GreenSignal AI - National Disaster Response & Relief Infrastructure Technical Proposal',
          Author: 'GreenSignal AI Consortium & Ministry of Disaster Management and Relief (MoDMR)',
          Subject: 'Automated IoT Telemetry, Upazila Tactical Operations & Strategic Relief Allocation',
          Keywords: 'Bangladesh, MoDMR, Disaster Management, 100 Crore, IoT, Starlink, Early Warning, Relief',
          CreationDate: new Date()
        }
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        if (outputPath) {
          fs.writeFileSync(outputPath, pdfData);
        }
        resolve(pdfData);
      });

      // Palette
      const cEmerald = '#047857';     // Dark Emerald
      const cTeal = '#0f766e';        // Deep Teal
      const cNavy = '#0f172a';        // Deep Slate/Navy
      const cMuted = '#475569';       // Slate-600
      const cLightMuted = '#64748b';  // Slate-500
      const cBorder = '#cbd5e1';      // Border Slate-300
      const cCardBg = '#f8fafc';      // Neutral Card Fill
      const cAccent = '#1d4ed8';      // Cobalt Accent
      const cGold = '#b45309';        // Amber/Gold Seal Accent

      // Helper function to draw a section title badge
      const drawSectionBadge = (num: string, title: string, yPos: number) => {
        doc.rect(45, yPos, 505, 24).fill('#f1f5f9');
        doc.rect(45, yPos, 4, 24).fill(cTeal);
        doc.fillColor(cTeal).fontSize(9).font('Helvetica-Bold')
          .text(`SECTION ${num}:`, 56, yPos + 6, { continued: true });
        doc.fillColor(cNavy).fontSize(10).font('Helvetica-Bold')
          .text(`  ${title.toUpperCase()}`, { continued: false });
        return yPos + 32;
      };

      // =========================================================================
      // PAGE 1: FORMAL COVER PAGE & EXECUTIVE TITLE
      // =========================================================================
      // Top Decorative Government Ribbon
      doc.rect(45, 45, 505, 6).fill(cEmerald);
      doc.rect(45, 51, 505, 2).fill(cGold);

      // Official Crest Representation
      const crestY = 72;
      doc.circle(297.5, crestY + 22, 24).lineWidth(1.5).strokeColor(cEmerald).stroke();
      doc.circle(297.5, crestY + 22, 21).lineWidth(0.75).strokeColor(cGold).stroke();
      doc.fillColor(cEmerald).fontSize(14).font('Helvetica-Bold').text('★', 293, crestY + 16);

      // Government Typography
      doc.fillColor(cNavy).fontSize(11).font('Helvetica-Bold')
        .text('GOVERNMENT OF THE PEOPLE\'S REPUBLIC OF BANGLADESH', 45, crestY + 54, { align: 'center' });
      doc.fillColor(cTeal).fontSize(10.5).font('Helvetica-Bold')
        .text('MINISTRY OF DISASTER MANAGEMENT AND RELIEF (MoDMR)', 45, crestY + 69, { align: 'center' });
      doc.fillColor(cLightMuted).fontSize(8.5).font('Helvetica')
        .text('Department of Disaster Management (DDM) • Cyclone Preparedness Programme (CPP)', 45, crestY + 83, { align: 'center' });

      // Divider
      doc.strokeColor(cBorder).lineWidth(1).moveTo(95, crestY + 100).lineTo(500, crestY + 100).stroke();

      // Major Proposal Title
      const titleY = crestY + 115;
      doc.fillColor(cEmerald).fontSize(10).font('Helvetica-Bold')
        .text('TURNKEY NATIONAL TECHNICAL SPECIFICATION & INVESTMENT PROPOSAL', 45, titleY, { align: 'center' });
      
      doc.fillColor(cNavy).fontSize(19).font('Helvetica-Bold')
        .text('GREENSIGNAL AI', 45, titleY + 16, { align: 'center' });
      
      doc.fillColor(cTeal).fontSize(11.5).font('Helvetica-Bold')
        .text('National Automated Disaster Response, Hydrometric Early Warning\n& Strategic Resource Allocation Infrastructure', 45, titleY + 40, { align: 'center', lineGap: 3 });

      doc.fillColor(cMuted).fontSize(8.5).font('Helvetica')
        .text('A Unified Multi-Agency Sovereign Ecosystem Integrating Automated IoT Hydrometric Telemetry Stations, Upazila Operations Hubs with Starlink 99% Uptime, Climate-Hardened Union Relief Buffer Warehouses & Silos, and Resilient Multi-Million User Digital Command Applications.', 70, titleY + 76, { align: 'center', lineGap: 2.5 });

      // Document Metadata Table Box
      const metaBoxY = titleY + 125;
      doc.rect(45, metaBoxY, 505, 175).fillAndStroke(cCardBg, cBorder);
      doc.rect(45, metaBoxY, 505, 22).fill(cTeal);
      doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold')
        .text('OFFICIAL PROJECT CONTROL & REGISTRATION RECORD', 55, metaBoxY + 6);

      const metaRows = [
        ['Project Title:', 'GreenSignal AI: National Automated Disaster Response Platform'],
        ['Project Code / Ref:', 'MoDMR-NDMP-2026-GS01 / GOB-Turnkey-P1'],
        ['Total Estimated Outlay:', 'BDT 100,00,00,000 (BDT 100.00 Crore / Guaranteed Financial Ceiling)'],
        ['Target Project Lifecycle:', 'Live Core Platform in 1–2 Months • Multi-Decade Expansion Horizon'],
        ['Sponsoring Ministry:', 'Ministry of Disaster Management and Relief (MoDMR)'],
        ['Lead Implementing Agency:', 'Department of Disaster Management (DDM) & GreenSignal Technical Consortium'],
        ['Strategic Key Partners:', 'CPP, BMD, FFWC (BWDB), SPARRSO, BTRC, Armed Forces Division (AFD)'],
        ['Security & Data Classification:', 'Official Public Safety Critical / Sovereign National Infrastructure'],
        ['Submission Date:', 'September 2026 • Edition 3.1 (Comprehensive National Release)']
      ];

      let mrY = metaBoxY + 28;
      metaRows.forEach(([lbl, val]) => {
        doc.fillColor(cTeal).fontSize(8).font('Helvetica-Bold').text(lbl, 55, mrY, { width: 140 });
        doc.fillColor(cNavy).fontSize(8).font(lbl.includes('Total') ? 'Helvetica-Bold' : 'Helvetica').text(val, 200, mrY, { width: 340 });
        mrY += 15.5;
      });

      // Bottom Sign-off / Review Signatures Area
      const signY = 665;
      doc.rect(45, signY, 245, 95).fillAndStroke('#ffffff', cBorder);
      doc.rect(305, signY, 245, 95).fillAndStroke('#ffffff', cBorder);

      // Left Box: Submitted By
      doc.fillColor(cTeal).fontSize(8).font('Helvetica-Bold').text('SUBMITTED BY:', 55, signY + 8);
      doc.fillColor(cNavy).fontSize(8.5).font('Helvetica-Bold').text('National Technical Architecture Consortium', 55, signY + 20);
      doc.fillColor(cMuted).fontSize(7.5).font('Helvetica').text('Chief Systems Architect & Lead Disaster Engineer\nGreenSignal AI Sovereign Delivery Group\nDhaka, Bangladesh', 55, signY + 32, { lineGap: 2 });
      doc.strokeColor(cBorder).lineWidth(0.5).moveTo(55, signY + 80).lineTo(235, signY + 80).stroke();
      doc.fillColor(cLightMuted).fontSize(6.5).text('Authorized Engineering Seal & Signature', 55, signY + 83);

      // Right Box: Reviewed By
      doc.fillColor(cTeal).fontSize(8).font('Helvetica-Bold').text('SPONSORED & ENDORSED BY:', 315, signY + 8);
      doc.fillColor(cNavy).fontSize(8.5).font('Helvetica-Bold').text('Department of Disaster Management (DDM)', 315, signY + 20);
      doc.fillColor(cMuted).fontSize(7.5).font('Helvetica').text('Joint Secretary / Director General\nMinistry of Disaster Management and Relief (MoDMR)\nBangladesh Secretariat, Dhaka', 315, signY + 32, { lineGap: 2 });
      doc.strokeColor(cBorder).lineWidth(0.5).moveTo(315, signY + 80).lineTo(495, signY + 80).stroke();
      doc.fillColor(cLightMuted).fontSize(6.5).text('Official Ministry Review & Verification Stamp', 315, signY + 83);

      // =========================================================================
      // PAGE 2: TABLE OF CONTENTS & EXECUTIVE SUMMARY
      // =========================================================================
      doc.addPage();
      let y2 = 50;

      // Header Banner
      y2 = drawSectionBadge('1.0', 'Table of Contents & Executive Strategic Summary', y2);

      // Table of Contents Card
      doc.rect(45, y2, 505, 118).fillAndStroke(cCardBg, cBorder);
      doc.fillColor(cTeal).fontSize(8.5).font('Helvetica-Bold').text('DOCUMENT STRUCTURE & SECTION INDEX', 55, y2 + 8);
      
      const tocEntries = [
        ['1.0', 'Table of Contents & Executive Strategic Summary', 'Page 2'],
        ['2.0', 'Multi-Tier Institutional & Operational Architecture', 'Page 3'],
        ['3.0', 'Digital Platform Architecture, Software Codebase & Cyber-Security', 'Page 4'],
        ['4.0', 'Network Topology, High-Throughput Cloud & Starlink Satellite Comms', 'Page 5'],
        ['5.0', 'Automated Environmental Sensor Network & Industrial IoT Datasheet', 'Page 6'],
        ['6.0', 'Comprehensive Financial Budget Breakdown (100.00 Crore BDT CapEx/OpEx)', 'Page 7'],
        ['7.0', 'Phased Implementation Horizon, Risk Mitigation & Ministerial Approval', 'Page 8']
      ];

      let tocY = y2 + 24;
      tocEntries.forEach(([num, title, p]) => {
        doc.fillColor(cEmerald).fontSize(7.5).font('Helvetica-Bold').text(num, 55, tocY);
        doc.fillColor(cNavy).fontSize(7.5).font('Helvetica').text(title, 80, tocY, { width: 390 });
        doc.fillColor(cTeal).fontSize(7.5).font('Helvetica-Bold').text(p, 480, tocY, { width: 60, align: 'right' });
        tocY += 12.5;
      });

      y2 += 128;

      // 1.1 Strategic Geographic & Humanitarian Imperative
      doc.fillColor(cTeal).fontSize(10.5).font('Helvetica-Bold').text('1.1 Strategic Humanitarian & Geographic Imperative', 45, y2);
      y2 += 15;
      doc.fillColor(cNavy).fontSize(8.2).font('Helvetica').text(
        'Bangladesh is universally recognized as one of the world\'s most climate-vulnerable deltaic nations. Spanning over 230 transboundary rivers, the Meghna, Jamuna, and Padma basins funnel an astronomical volume of monsoonal discharge into the Bay of Bengal, resulting in annual inundations across extensive portions of the national territory. Furthermore, the 710 km coastline is repeatedly impacted by intense cyclonic storm surges, while the northeastern Haor wetlands face devastatingly rapid flash floods that submerge standing crops in fewer than 6 hours.',
        45, y2, { width: 505, align: 'justify', lineGap: 2 }
      );
      y2 += 52;

      // 1.2 The Critical Last-Mile Gap
      doc.fillColor(cTeal).fontSize(10.5).font('Helvetica-Bold').text('1.2 The "Last-Mile Gap" in Conventional Disaster Management', 45, y2);
      y2 += 15;
      doc.fillColor(cNavy).fontSize(8.2).font('Helvetica').text(
        'While macroscopic forecasting by the Bangladesh Meteorological Department (BMD) and hydrologic modeling by the Flood Forecasting and Warning Centre (FFWC) have significantly advanced early awareness over past decades, an acute operational gap persists between macro-level alerts and ground-level humanitarian execution. Historical response challenges include:',
        45, y2, { width: 505, align: 'justify', lineGap: 2 }
      );
      y2 += 34;

      const gapPoints = [
        ['Manual Telemetry Latency: ', 'River gauges and rainfall data in remote areas often rely on manual reporting, resulting in delays before data reaches central decision-makers.'],
        ['Static Relief Allocation: ', 'Relief food, water purification tablets, and medical kits are frequently dispatched based on static lists rather than real-time disaster displacement density.'],
        ['Telecommunications Vulnerability: ', 'Severe cyclone landfalls and flash floods frequently disrupt terrestrial power and cellular base stations, isolating vulnerable island and char communities.'],
        ['Relief Distribution Transparency: ', 'Traditional paper manifests lack digital verification, risking misallocation and stock imbalances in isolated union warehouses.']
      ];

      gapPoints.forEach(([head, body]) => {
        doc.fillColor(cEmerald).fontSize(7.8).font('Helvetica-Bold').text('• ' + head, 55, y2, { continued: true });
        doc.fillColor(cNavy).font('Helvetica').text(body, { width: 495, lineGap: 1.5 });
        y2 = doc.y + 3;
      });

      y2 += 5;

      // 1.3 The GreenSignal AI Paradigm Shift
      doc.fillColor(cTeal).fontSize(10.5).font('Helvetica-Bold').text('1.3 The GreenSignal AI Paradigm Shift', 45, y2);
      y2 += 15;
      doc.fillColor(cNavy).fontSize(8.2).font('Helvetica').text(
        'GreenSignal AI bridges this gap through a unified sovereign ecosystem combining automated industrial IoT telemetry, edge artificial intelligence, decentralized Starlink satellite backup, and algorithmic logistical dispatch. While complete physical infrastructure rollout is a long-term national endeavor spanning decades, the core GreenSignal AI application is architected to be fully operational and connecting to existing data streams within 1 to 2 months.',
        45, y2, { width: 505, align: 'justify', lineGap: 2 }
      );
      y2 += 48;

      // Target Key Performance Indicators (KPIs) Table Card
      doc.rect(45, y2, 505, 88).fillAndStroke(cCardBg, cBorder);
      doc.rect(45, y2, 505, 18).fill(cTeal);
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold')
        .text('NATIONAL KEY PERFORMANCE TARGETS (RAPID LAUNCH & DECADAL SCALING)', 55, y2 + 5);

      const kpiItems = [
        ['Rapid Software Operationalization:', 'Core software platform live and ingesting existing BMD/FFWC data in 1–2 months.'],
        ['Early Warning Latency:', '< 30 Seconds from sensor threshold breach to automated cell broadcast & volunteer SMS.'],
        ['Mission-Critical Uptime:', '99% uptime ensured across all command centers via dedicated Starlink satellite terminals.'],
        ['Grassroots Volunteer Mobilization:', 'Seamless offline PWA connectivity for CPP unit leads and registered field responders.'],
        ['Strategic Relief Integrity:', '100% auditable QR/NID biometric verification across Union Relief Buffer Warehouses & Silos.']
      ];

      let kpiY = y2 + 22;
      kpiItems.forEach(([k, v]) => {
        doc.fillColor(cTeal).fontSize(7.5).font('Helvetica-Bold').text(k, 55, kpiY, { width: 140 });
        doc.fillColor(cNavy).fontSize(7.5).font('Helvetica').text(v, 200, kpiY, { width: 340 });
        kpiY += 12.5;
      });

      // =========================================================================
      // PAGE 3: MULTI-TIER INSTITUTIONAL & OPERATIONAL ARCHITECTURE
      // =========================================================================
      doc.addPage();
      let y3 = 50;

      y3 = drawSectionBadge('2.0', 'Multi-Tier Institutional & Operational Architecture', y3);

      doc.fillColor(cNavy).fontSize(8.2).font('Helvetica').text(
        'Disaster response in Bangladesh requires harmonious coordination across multiple administrative tiers—from the central Cabinet crisis room down to remote coastal island volunteers. GreenSignal AI establishes an integrated digital and physical hierarchy designed to align with the National Plan for Disaster Management (NPDM).',
        45, y3, { width: 505, align: 'justify', lineGap: 2 }
      );
      y3 += 32;

      // 2.1 Multi-Tier Stakeholder Integration Matrix Table
      doc.fillColor(cTeal).fontSize(10).font('Helvetica-Bold').text('2.1 Multi-Tier Stakeholder Integration Matrix', 45, y3);
      y3 += 15;

      const tierCols = [70, 105, 120, 210];
      doc.rect(45, y3, 505, 18).fill(cTeal);
      doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold');
      doc.text('Operational Tier', 50, y3 + 5, { width: tierCols[0] });
      doc.text('Primary User Groups', 125, y3 + 5, { width: tierCols[1] });
      doc.text('Platform Interface', 235, y3 + 5, { width: tierCols[2] });
      doc.text('Core Operational Responsibilities', 360, y3 + 5, { width: tierCols[3] });
      y3 += 18;

      const tierRows = [
        [
          'Tier 1: National Ministerial\n(Cabinet & DDM)',
          'Minister, Secretary, DDM Director General, Armed Forces Division (AFD)',
          'National Macro Command Portal\n(Central Executive Dashboard)',
          '• Inter-district strategic grain/medical transfers\n• National state of emergency declarations\n• Armed Forces helicopter airlift mobilization\n• International humanitarian aid coordination'
        ],
        [
          'Tier 2: Tactical Command\n(Upazila Operations)',
          'Deputy Commissioners (DC), UNOs, Project Implementation Officers (PIO)',
          'Tactical GIS Command Suite\n(GIS Platform & District Planner)',
          '• Real-time hazard mapping & sensor telemetry\n• Dynamic shelter quota & food allocation balancing\n• Transport fleet routing & rescue boat dispatch\n• Starlink-backed 99% uptime command continuity'
        ],
        [
          'Tier 3: Grassroots Field Responders\n(Union & Village)',
          'CPP Unit Leads, Red Crescent (BDRCS), Ansar-VDP, Community Responders',
          'Field Worker PWA Mobile App\n(Offline-first IndexedDB / 2G sync)',
          '• Door-to-door siren evacuation & roll-calls\n• GPS-tagged damage & casualty distress reporting\n• Relief distribution verification (NID/QR scan)\n• Survivor medical triage logging & SOS beacons'
        ],
        [
          'Tier 4: Affected Citizens\n(General Population)',
          'Rural villagers, coastal islanders, haor residents, farmers',
          'Public Cell Broadcast SMS, IVR Voice Lines, Local Warning Sirens',
          '• Automated bilingual evacuation route guidance\n• Location of nearest open, powered shelter\n• Transparent relief entitlement confirmation\n• Emergency distress and assistance requests'
        ]
      ];

      tierRows.forEach((r, idx) => {
        const rowBg = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
        const rowH = 48;
        doc.rect(45, y3, 505, rowH).fillAndStroke(rowBg, cBorder);
        doc.fillColor(cEmerald).fontSize(7).font('Helvetica-Bold').text(r[0], 50, y3 + 4, { width: tierCols[0] - 6 });
        doc.fillColor(cNavy).fontSize(7).font('Helvetica').text(r[1], 125, y3 + 4, { width: tierCols[1] - 8 });
        doc.fillColor(cAccent).fontSize(7).font('Helvetica-Bold').text(r[2], 235, y3 + 4, { width: tierCols[2] - 8 });
        doc.fillColor(cNavy).fontSize(6.8).font('Helvetica').text(r[3], 360, y3 + 3, { width: tierCols[3] - 6, lineGap: 1.5 });
        y3 += rowH;
      });

      y3 += 16;

      // 2.2 Physical Infrastructure Network
      doc.fillColor(cTeal).fontSize(10).font('Helvetica-Bold').text('2.2 Physical Infrastructure: Hubs, Warehouses & Shelters', 45, y3);
      y3 += 15;

      // Box 1: Upazila Operations Hubs
      doc.rect(45, y3, 505, 95).fillAndStroke(cCardBg, cBorder);
      doc.rect(45, y3, 505, 18).fill(cTeal);
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold')
        .text('UPAZILA OPERATIONS HUBS (TACTICAL COMMAND RETROFITS)', 55, y3 + 5);

      doc.fillColor(cNavy).fontSize(7.5).font('Helvetica').text(
        'Upazila Parishad complexes are established as dedicated Upazila Operations Hubs running the GreenSignal AI Tactical Command Suite. Key physical specifications include:\n' +
        '• Tactical monitoring video screens mirroring live GIS hydrological telemetry, water levels, and alert nodes.\n' +
        '• 10 kVA Hybrid Solar-Inverter power system with 48V Lithium Iron Phosphate (LiFePO4) storage, coupled to an automated diesel generator backup providing uncompromised continuity.\n' +
        '• Dedicated multi-band VHF/UHF tactical radio base stations linked with the Cyclone Preparedness Programme (CPP) and emergency networks.\n' +
        '• Dedicated Starlink satellite terminals equipped in each command center to guarantee 99% uptime during terrestrial fiber and grid disruptions.',
        55, y3 + 24, { width: 485, lineGap: 2 }
      );
      y3 += 105;

      // Box 2: Union Relief Buffer Warehouses & Silos
      doc.rect(45, y3, 505, 125).fillAndStroke(cCardBg, cBorder);
      doc.rect(45, y3, 505, 18).fill(cTeal);
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold')
        .text('CLIMATE-HARDENED UNION RELIEF BUFFER WAREHOUSES & SILOS', 55, y3 + 5);

      doc.fillColor(cNavy).fontSize(7.5).font('Helvetica').text(
        'Positioned across vulnerable coastal chars, riverine haor basins, and flash-flood corridors, these facilities safeguard emergency supplies and human lives:\n' +
        '• Reinforced Elevated Plinth Structures: Constructed safely above historical flood lines to prevent submersion of vital supplies.\n' +
        '• Hermetic Dry Grain Storage Silos: Airtight silos preserving emergency rice, lentils, and baby food against high humidity, water intrusion, and pest contamination without spoilage.\n' +
        '• Solar Cold-Chain Medical Vaults: WHO PQS-certified medical refrigeration units maintaining 2°C to 8°C for anti-snake venom, cholera vaccines, tetanus toxoid, and essential antibiotics powered by rooftop PV arrays.\n' +
        '• High-Capacity Solar Water Desalination & RO Pods: Autonomous solar-powered reverse osmosis systems producing certified WHO-standard drinking water directly from saline estuarine or flood sources.\n' +
        '• Automated RFID / Barcode Inventory Gates: Real-time scan-in / scan-out tracking of all arriving relief consignments and field handoffs, transmitting live stock balances to the central database.',
        55, y3 + 24, { width: 485, lineGap: 2 }
      );

      // =========================================================================
      // PAGE 4: DIGITAL PLATFORM ARCHITECTURE, SOFTWARE CODEBASE & CYBER-SECURITY
      // =========================================================================
      doc.addPage();
      let y4 = 50;

      y4 = drawSectionBadge('3.0', 'Digital Platform Architecture, Software Codebase & Security', y4);

      doc.fillColor(cNavy).fontSize(8.2).font('Helvetica').text(
        'The GreenSignal AI digital platform is built with an enterprise-grade, microservice-oriented full-stack architecture engineered for absolute high-concurrency reliability under catastrophe conditions. All codebase components are strictly typed, horizontally scalable, and sovereignly hosted.',
        45, y4, { width: 505, align: 'justify', lineGap: 2 }
      );
      y4 += 28;

      // 3.1 Software Stack & Modules Walkthrough
      doc.fillColor(cTeal).fontSize(10).font('Helvetica-Bold').text('3.1 Full-Stack Software Architecture & Core Codebase Modules', 45, y4);
      y4 += 14;

      const codeModules = [
        ['Field Worker PWA Mobile App (TypeScript / Service Workers / IndexedDB):', 'Operates with 100% offline-first resiliency. Responders can log survivor headcounts, tag localized embankment collapses, and issue emergency medical distress beacons even without cellular reception. Background sync automatically dispatches pending payloads upon establishing any 2G/EDGE or LoRa connection.'],
        ['Tactical Coordinator GIS Suite (Interactive Map & Leaflet Engine):', 'High-performance interactive geographic dashboard rendering nationwide district and upazila nodes, relief shelters, and live IoT sensor overlays. Incorporates dynamic mathematical relief allocation algorithms balancing food, drinking water, medical supplies, and shelter capacity.'],
        ['Privacy-Isolated Real-Time Messenger (src/services/messaging.ts):', 'Engineered on an event-isolated Socket.io architecture. Employs dedicated public broadcast rooms for macro situational directives alongside cryptographically segregated 1-on-1 responder channels, preventing operational confusion and preserving survivor medical confidentiality.'],
        ['Relational Database Engine & Spatial Indexing (PostgreSQL & In-Memory Fallback):', 'Rigorous normalized relational schemas governing DistrictNode, User, ReliefCenter, EnvironmentalSensor, DisasterAlert, ShelterAllocation, and ChatMessage with strict foreign-key integrity, ACID transactions, and spatial B-tree indexing for sub-millisecond query latency.']
      ];

      codeModules.forEach(([mod, desc]) => {
        doc.fillColor(cEmerald).fontSize(7.8).font('Helvetica-Bold').text(mod, 45, y4);
        y4 = doc.y + 2;
        doc.fillColor(cNavy).fontSize(7.4).font('Helvetica').text(desc, 45, y4, { width: 505, align: 'justify', lineGap: 1.5 });
        y4 = doc.y + 6;
      });

      y4 += 4;

      // 3.2 Relational Entity Schema Matrix
      doc.fillColor(cTeal).fontSize(10).font('Helvetica-Bold').text('3.2 Core Database Entities & Data Governance', 45, y4);
      y4 += 14;

      const schemaCols = [105, 110, 290];
      doc.rect(45, y4, 505, 16).fill(cTeal);
      doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold');
      doc.text('Entity Model', 50, y4 + 4, { width: schemaCols[0] });
      doc.text('Key Attributes', 160, y4 + 4, { width: schemaCols[1] });
      doc.text('Functional Role & Data Integrity Constraint', 275, y4 + 4, { width: schemaCols[2] });
      y4 += 16;

      const schemaRows = [
        ['DistrictNode', 'id, name, division, riskLevel, coordinates', 'Represents all divisions, districts & upazilas; root spatial hierarchy node.'],
        ['ReliefCenter', 'id, districtId, capacity, stockFood, stockWater', 'Maintains live grain, water, and medical inventory balances in real time.'],
        ['EnvironmentalSensor', 'id, districtId, type, reading, status, battery', 'Stores telemetry from radar water gauges, rain gauges, and piezometers.'],
        ['DisasterAlert', 'id, districtId, severity, title, active, timestamp', 'Automated event triggers pushed via WebSocket, Cell Broadcast & SMS.'],
        ['ShelterAllocation', 'id, reliefCenterId, allocatedBy, peopleHoused', 'Tracks survivor occupancy quotas to prevent life-threatening overcrowding.'],
        ['ChatMessage', 'id, senderId, receiverId, channelId, message', 'Stores historical audit log of all tactical responder and command communications.']
      ];

      schemaRows.forEach((sr, sIdx) => {
        const sBg = sIdx % 2 === 0 ? '#f8fafc' : '#ffffff';
        doc.rect(45, y4, 505, 18).fillAndStroke(sBg, cBorder);
        doc.fillColor(cTeal).fontSize(7).font('Helvetica-Bold').text(sr[0], 50, y4 + 4, { width: schemaCols[0] - 6 });
        doc.fillColor(cNavy).fontSize(6.8).font('Helvetica-Oblique').text(sr[1], 160, y4 + 4, { width: schemaCols[1] - 6 });
        doc.fillColor(cNavy).fontSize(6.8).font('Helvetica').text(sr[2], 275, y4 + 4, { width: schemaCols[2] - 6 });
        y4 += 18;
      });

      y4 += 14;

      // 3.3 Cyber-Security, Data Sovereignty & National Privacy
      doc.fillColor(cTeal).fontSize(10).font('Helvetica-Bold').text('3.3 National Data Sovereignty & Cyber-Security Framework', 45, y4);
      y4 += 14;

      doc.rect(45, y4, 505, 105).fillAndStroke(cCardBg, cBorder);
      doc.fillColor(cNavy).fontSize(7.5).font('Helvetica').text(
        '• 100% In-Country Data Sovereignty: All database instances, telemetry logs, and citizen records strictly reside inside Bangladesh within the Tier-IV National Data Center. No operational disaster data is routed through foreign cloud jurisdictions.\n' +
        '• Cryptographic Security Standards: Enforces TLS 1.3 for all data-in-transit and AES-256 for all databases, backup snapshots, and local client caches. Responders authenticate via secure JWTs backed by bcrypt password hashing with unique salts.\n' +
        '• Anonymized Citizen Entitlement Tokens: Relief allocation utilizes zero-knowledge HMAC tokens linked to national identification numbers (NID); no plaintext biometric or citizen identification files are stored on field mobile devices.\n' +
        '• Role-Based Access Control (RBAC): Strict segregation of roles (Admin, National Director, District Coordinator, Upazila Lead, Field Worker). Privileged administrative actions are logged to immutable, append-only security ledgers.\n' +
        '• Regular Penetration Testing & CIRT Compliance: Fully audited against the National Cyber Security Act and aligned with BGD e-GOV CIRT vulnerability mitigation protocols.',
        55, y4 + 10, { width: 485, lineGap: 2.5 }
      );

      // =========================================================================
      // PAGE 5: NETWORK TOPOLOGY, CLOUD & RESILIENT TELECOMMUNICATIONS
      // =========================================================================
      doc.addPage();
      let y5 = 50;

      y5 = drawSectionBadge('4.0', 'Network Topology, High-Throughput Cloud & Starlink Satellite Comms', y5);

      doc.fillColor(cNavy).fontSize(8.2).font('Helvetica').text(
        'To withstand severe cyclone landfalls and catastrophic monsoonal inundations where commercial terrestrial networks routinely collapse, GreenSignal AI integrates a tri-redundant network architecture combining Tier-IV National Data Center hosting, private telco APNs, Starlink satellite broadband terminals ensuring 99% uptime, and solar LoRaWAN mesh gateways.',
        45, y5, { width: 505, align: 'justify', lineGap: 2 }
      );
      y5 += 30;

      // 4.1 Infrastructure Scaling Diagrammatic Layout
      const netCards = [
        ['Tier-IV National Data Center (Primary Node)', 'Located at Bangladesh Computer Council (BCC), Kaliakoir, Gazipur. Features dual 2N redundant electrical feeds, earthquake-isolated seismic dampers, automated FM-200 fire suppression, and guaranteed 99.995% physical availability.'],
        ['Tier-III Disaster Recovery Center (Hot Standby)', 'Established at Jashore Software Technology Park. Continuous asynchronous block replication ensures a Recovery Point Objective (RPO) of < 5 seconds and an automated Recovery Time Objective (RTO) of < 15 seconds in the event of primary center isolation.'],
        ['BDIX Edge & Anycast Peering Fabric', 'Directly interconnected with the Bangladesh Internet Exchange (BDIX) peering fabric across Dhaka, Chattogram, and Sylhet. Delivers sub-15ms domestic network latency and absorbs DDoS floods up to 500 Gbps.'],
        ['Kubernetes Cluster & Redis Pub/Sub Grid', 'Dynamically autoscale worker pods from a baseline of 32 to 512+ compute instances within 180 seconds of disaster alert issuance. A distributed Redis Enterprise Cluster sustains 1,500,000 concurrent persistent WebSocket connections without dropped packets.']
      ];

      netCards.forEach(([head, desc]) => {
        doc.rect(45, y5, 505, 42).fillAndStroke(cCardBg, cBorder);
        doc.rect(45, y5, 4, 42).fill(cTeal);
        doc.fillColor(cTeal).fontSize(8).font('Helvetica-Bold').text(head, 56, y5 + 6);
        doc.fillColor(cNavy).fontSize(7.2).font('Helvetica').text(desc, 56, y5 + 18, { width: 485, lineGap: 1.5 });
        y5 += 48;
      });

      y5 += 6;

      // 4.2 Resilient Last-Mile Telecommunications & Failover
      doc.fillColor(cTeal).fontSize(10).font('Helvetica-Bold').text('4.2 Resilient Multi-Channel Emergency Telecommunications', 45, y5);
      y5 += 14;

      // Telecom Comparison Table
      const telcoCols = [100, 105, 120, 180];
      doc.rect(45, y5, 505, 16).fill(cTeal);
      doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold');
      doc.text('Channel', 50, y5 + 4, { width: telcoCols[0] });
      doc.text('Coverage & Providers', 155, y5 + 4, { width: telcoCols[1] });
      doc.text('Latency & Bandwidth', 265, y5 + 4, { width: telcoCols[2] });
      doc.text('Disaster Survivability & Role', 390, y5 + 4, { width: telcoCols[3] });
      y5 += 16;

      const telcoRows = [
        [
          'Dedicated Private APN\n(4G LTE / 5G)',
          'Grameenphone, Robi,\nBanglalink, Teletalk',
          'Latency: < 35 ms\nSpeed: 10–50 Mbps',
          'Prioritized QCI-1 data channels for responders. Zero-rated data billing subsidized for emergency field operations.'
        ],
        [
          'Starlink Satellite Terminals\n(LEO Low-Earth Orbit)',
          'Starlink Satellite\nIntegration Services',
          'Latency: 25–45 ms\nSpeed: 100–220 Mbps',
          'Equipped at each command center to guarantee 99% uptime during power and fiber network blackouts.'
        ],
        [
          'Solar LoRaWAN Mesh\n(868 / 915 MHz)',
          'Autonomous Upazila\nMast Gateways',
          'Latency: 1–3 sec\nSpeed: 5–50 kbps',
          'Zero-carrier dependency. Broadcasts low-bandwidth sensor telemetry & SOS packets over 15 km line-of-sight.'
        ],
        [
          'BTRC Cell Broadcast\n(SMPP High-Volume)',
          'All 4 Mobile Operators\n(Direct Tower Broadcast)',
          'Broadcast speed:\n100,000 SMS / second',
          'Geofenced emergency push notifications delivered to all mobile handsets without requiring prior app installation.'
        ]
      ];

      telcoRows.forEach((tr, tIdx) => {
        const tBg = tIdx % 2 === 0 ? '#f8fafc' : '#ffffff';
        doc.rect(45, y5, 505, 36).fillAndStroke(tBg, cBorder);
        doc.fillColor(cEmerald).fontSize(7).font('Helvetica-Bold').text(tr[0], 50, y5 + 4, { width: telcoCols[0] - 6 });
        doc.fillColor(cNavy).fontSize(7).font('Helvetica').text(tr[1], 155, y5 + 4, { width: telcoCols[1] - 6 });
        doc.fillColor(cAccent).fontSize(6.8).font('Helvetica-Bold').text(tr[2], 265, y5 + 4, { width: telcoCols[2] - 6 });
        doc.fillColor(cNavy).fontSize(6.8).font('Helvetica').text(tr[3], 390, y5 + 4, { width: telcoCols[3] - 6, lineGap: 1.5 });
        y5 += 36;
      });

      y5 += 14;

      // Disaster Blackout Protocol Card
      doc.rect(45, y5, 505, 68).fillAndStroke(cCardBg, cBorder);
      doc.fillColor(cTeal).fontSize(8).font('Helvetica-Bold').text('AUTOMATED NETWORK FAILOVER PROTOCOL (TRI-TIER RECOVERY)', 55, y5 + 8);
      doc.fillColor(cNavy).fontSize(7.2).font('Helvetica').text(
        'In the event of a terrestrial commercial telecommunications outage, the system initiates an instantaneous, rule-based cascading failover:\n' +
        '1. Detection: Edge monitoring detects loss of terrestrial 4G APN responses for > 15 seconds.\n' +
        '2. Secondary Engagement: Upazila command centers switch traffic dynamically to high-speed Starlink satellite terminals to maintain 99% uptime.\n' +
        '3. Autonomous LoRa Mesh Activation: Field sensors and handheld volunteer terminals switch to the decentralized 868 MHz LoRa mesh, routing emergency distress packets hop-by-hop to the nearest operational satellite uplink node.',
        55, y5 + 20, { width: 485, lineGap: 2 }
      );

      // =========================================================================
      // PAGE 6: AUTOMATED SENSOR NETWORK & INDUSTRIAL IOT DATASHEET
      // =========================================================================
      doc.addPage();
      let y6 = 50;

      y6 = drawSectionBadge('5.0', 'Automated Environmental Sensor Network & IoT Datasheet', y6);

      doc.fillColor(cNavy).fontSize(8.2).font('Helvetica').text(
        'Reliable early warning demands high-precision, uncompromised real-world ground truth. GreenSignal AI deploys an automated national grid of industrial-grade telemetry stations across critical river bends, barrage sluice gates, coastal polders, and flash-flood catchment zones across Bangladesh.',
        45, y6, { width: 505, align: 'justify', lineGap: 2 }
      );
      y6 += 26;

      // 5.1 Technical Hardware Datasheet Table
      doc.fillColor(cTeal).fontSize(10).font('Helvetica-Bold').text('5.1 Comprehensive Environmental Sensor Specifications', 45, y6);
      y6 += 14;

      const sCols = [110, 95, 175, 125];
      doc.rect(45, y6, 505, 16).fill(cTeal);
      doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold');
      doc.text('Sensor Category', 50, y6 + 4, { width: sCols[0] });
      doc.text('Benchmark Model', 162, y6 + 4, { width: sCols[1] });
      doc.text('Technical Specifications', 260, y6 + 4, { width: sCols[2] });
      doc.text('Target Deployment Locations', 438, y6 + 4, { width: sCols[3] });
      y6 += 16;

      const sRows = [
        [
          'Radar River Water Level Sensor',
          'OTT RLS / Vega VEGAPULS C21',
          'Non-contact 26 GHz radar, ±2 mm accuracy, 0–35 m range. Unaffected by flood debris or sediment siltation.',
          'Major river bridges, barrage sluices, and flood embankments'
        ],
        [
          'Automated Rain Gauge (ARG)',
          'Campbell Scientific TE525MM',
          'Tipping bucket mechanism, 0.1 mm orifice resolution, dual-reed switch, anti-clog debris filter, stainless steel funnel.',
          'Upazila weather stations and landslide-prone hilly zones'
        ],
        [
          'Embankment Pore Piezometer',
          'RST Instruments VW2100',
          'Vibrating wire transducer, 0–500 kPa range, 0.025% F.S. resolution. Detects subsurface pressure surges preceding levee breach.',
          'Coastal polders and high-erosion riverbank corridors'
        ],
        [
          'Tidal & Storm Surge Gauge',
          'SonTek Argonaut-XR / Aanderaa',
          'Acoustic doppler velocity + piezo-resistive hydrostatic pressure, 0–20 m depth, integrated marine anti-fouling copper cage.',
          'Coastal inlets and estuaries (Khulna, Barishal, Chittagong)'
        ],
        [
          'Ultrasonic Compact Weather Station',
          'Vaisala WXT536 Multi-Sensor',
          'Ultrasonic wind speed (0–60 m/s) and direction, barometric pressure, ambient air temp, relative humidity.',
          'Coastal cyclone tracking towers and regional airfields'
        ]
      ];

      sRows.forEach((row, idx) => {
        const rowBg = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
        const rowH = 46;
        doc.rect(45, y6, 505, rowH).fillAndStroke(rowBg, cBorder);
        doc.fillColor(cEmerald).fontSize(7.5).font('Helvetica-Bold').text(row[0], 50, y6 + 4, { width: sCols[0] - 6 });
        doc.fillColor(cNavy).fontSize(7).font('Helvetica-Bold').text(row[1], 162, y6 + 4, { width: sCols[1] - 6 });
        doc.fillColor(cNavy).fontSize(6.8).font('Helvetica').text(row[2], 260, y6 + 4, { width: sCols[2] - 6, lineGap: 1.5 });
        doc.fillColor(cMuted).fontSize(6.8).font('Helvetica').text(row[3], 438, y6 + 4, { width: sCols[3] - 6, lineGap: 1.5 });
        y6 += rowH;
      });

      y6 += 12;

      // 5.2 Industrial RTU & Power Subsystem Architecture
      doc.fillColor(cTeal).fontSize(10).font('Helvetica-Bold').text('5.2 Industrial Remote Telemetry Unit (RTU) Engineering', 45, y6);
      y6 += 14;

      doc.rect(45, y6, 505, 120).fillAndStroke(cCardBg, cBorder);
      doc.fillColor(cNavy).fontSize(7.4).font('Helvetica').text(
        'Every environmental sensor connects to a sovereign, ruggedized industrial RTU engineered specifically for tropical delta environments:\n' +
        '• Enclosure: Die-cast marine-grade aluminum housing, IP68 rated, hermetically sealed with Gore-Tex desiccant pressure equalization valves.\n' +
        '• Processing Unit: Ultra-low-power 32-bit ARM Cortex-M4 microcontroller running FreeRTOS with hardware cryptographic engine and watchdog supervisory circuits.\n' +
        '• Dual-SIM Comms Modem: Integrated 4G LTE Cat-M1 / NB-IoT modem with automatic cellular operator handover and secondary 868 MHz LoRa transceiver.\n' +
        '• Autonomous Solar Power Bank: 40W monocrystalline high-efficiency solar panel paired with a 24Ah Lithium Iron Phosphate (LiFePO4) battery pack with intelligent Battery Management System (BMS). Guarantees 21 consecutive days of autonomous operation under zero sunlight.\n' +
        '• Mast & Civil Infrastructure: 5-meter hot-dip galvanized steel tower anchored to concrete reinforced foundation pads designed to withstand 260 km/h cyclonic gusts.\n' +
        '• Lightning & Surge Protection: Certified IEC 61643-11 Class II heavy-duty surge arrestors with copper earth spike achieving < 5 ohms ground resistance.',
        55, y6 + 10, { width: 485, lineGap: 2.2 }
      );
      y6 += 132;

      // Ground Station Siting Strategy
      doc.rect(45, y6, 505, 78).fillAndStroke('#f1f5f9', cBorder);
      doc.fillColor(cTeal).fontSize(8).font('Helvetica-Bold').text('NATIONWIDE SITING & GEO-CORRIDOR ALLOCATION', 55, y6 + 8);
      doc.fillColor(cNavy).fontSize(7.2).font('Helvetica').text(
        '• Haor & Flash-Flood Basin: Sunamganj, Sylhet, Netrokona, Habiganj, Kishoreganj—monitoring mountain runoff from transboundary catchments.\n' +
        '• Major River Embankment Corridors: Kurigram, Gaibandha, Bogura, Sirajganj, Jamalpur along the Jamuna/Brahmaputra and Padma axes.\n' +
        '• Coastal Tidal & Cyclonic Belt: Barguna, Patuakhali, Bhola, Satkhira, Cox\'s Bazar, Chittagong coastlines and offshore island chars.',
        55, y6 + 20, { width: 485, lineGap: 2 }
      );

      // =========================================================================
      // PAGE 7: COMPREHENSIVE FINANCIAL BUDGET BREAKDOWN (100.00 CRORE BDT)
      // =========================================================================
      doc.addPage();
      let y7 = 50;

      y7 = drawSectionBadge('6.0', 'Comprehensive Financial Budget Breakdown (100.00 Crore BDT)', y7);

      doc.fillColor(cNavy).fontSize(8.2).font('Helvetica').text(
        'The financial framework has been rigorously structured to conform strictly with the Public Procurement Act (PPA-2006) and Public Procurement Rules (PPR-2008). The total project allocation is precisely capped at BDT 100.00 Crore (One Hundred Crore Taka), supporting immediate 1–2 month software launch and long-term phased infrastructure expansion.',
        45, y7, { width: 505, align: 'justify', lineGap: 2 }
      );
      y7 += 28;

      // 6.1 Itemized Budget Matrix Table
      doc.fillColor(cTeal).fontSize(10).font('Helvetica-Bold').text('6.1 Itemized Capital (CapEx) & Operational (OpEx) Allocation Matrix', 45, y7);
      y7 += 14;

      const bCols = [145, 175, 55, 55, 75];
      doc.rect(45, y7, 505, 18).fill(cTeal);
      doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold');
      doc.text('Expenditure Head & Scope', 50, y7 + 5, { width: bCols[0] });
      doc.text('Key Deliverables & Bill of Quantities', 198, y7 + 5, { width: bCols[1] });
      doc.text('CapEx (Cr)', 375, y7 + 5, { width: bCols[2], align: 'right' });
      doc.text('OpEx (Cr)', 433, y7 + 5, { width: bCols[3], align: 'right' });
      doc.text('Total (Cr BDT)', 490, y7 + 5, { width: bCols[4] - 8, align: 'right' });
      y7 += 18;

      const budgetRows = [
        [
          '1. Automated IoT Sensor Network\n& Hydrometric Telemetry',
          'Automated telemetry stations, OTT radars, Campbell rain gauges, RST piezometers, solar RTUs, 5m galvanized masts, civil foundations.',
          '25.50',
          '2.50',
          '28.00 Cr'
        ],
        [
          '2. Physical Upazila Hubs, Union\nWarehouses & Cold Storage',
          'Upazila Operations Hub retrofits (video screens, 10 kVA solar inverters, generators), Union relief buffer silos, cold-chain vaccine vaults, solar RO plants.',
          '23.00',
          '2.00',
          '25.00 Cr'
        ],
        [
          '3. Software Engineering, Tactical\nGIS Suite & Mobile PWAs',
          'Offline PWA for field workers, Coordinator GIS tactical suite, National Ministry Portal, AI predictive hydrology models, QR/biometric verification.',
          '11.50',
          '2.50',
          '14.00 Cr'
        ],
        [
          '4. Data Center Hosting, Cloud,\nStarlink Satellite Infrastructure',
          'Tier-IV BCC hosting, Jashore DR center, BDIX peering fabric, 4-operator private APN data peering, Starlink satellite integration ensuring 99% uptime.',
          '4.50',
          '7.50',
          '12.00 Cr'
        ],
        [
          '5. Nationwide Human Resource\nTraining & Capacity Building',
          'Comprehensive digital literacy training for field responders, CPP unit leads, Upazila Committees, simulation drills with Armed Forces Division.',
          '3.00',
          '8.00',
          '11.00 Cr'
        ],
        [
          '6. Quality Assurance, Security\nAudits & Spares Reserve',
          'BGD e-GOV CIRT security audits, ISO 27001 compliance, hardware spares stockpile, unforeseen price escalation contingency reserve.',
          '6.00',
          '4.00',
          '10.00 Cr'
        ]
      ];

      budgetRows.forEach((brow, bIdx) => {
        const bBg = bIdx % 2 === 0 ? '#f8fafc' : '#ffffff';
        const bH = 38;
        doc.rect(45, y7, 505, bH).fillAndStroke(bBg, cBorder);
        doc.fillColor(cEmerald).fontSize(7).font('Helvetica-Bold').text(brow[0], 50, y7 + 4, { width: bCols[0] - 6 });
        doc.fillColor(cNavy).fontSize(6.8).font('Helvetica').text(brow[1], 198, y7 + 4, { width: bCols[1] - 6, lineGap: 1.5 });
        doc.fillColor(cNavy).fontSize(7.5).font('Helvetica').text(brow[2], 375, y7 + 4, { width: bCols[2], align: 'right' });
        doc.fillColor(cNavy).fontSize(7.5).font('Helvetica').text(brow[3], 433, y7 + 4, { width: bCols[3], align: 'right' });
        doc.fillColor(cTeal).fontSize(8).font('Helvetica-Bold').text(brow[4], 490, y7 + 4, { width: bCols[4] - 8, align: 'right' });
        y7 += bH;
      });

      // Grand Total Highlight Row
      doc.rect(45, y7, 505, 24).fillAndStroke(cNavy, cNavy);
      doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold')
        .text('TOTAL MANDATED PROJECT OUTLAY (100.00 CRORE CAP)', 50, y7 + 7, { width: 320 });
      doc.text('73.50 Cr', 375, y7 + 7, { width: bCols[2], align: 'right' });
      doc.text('26.50 Cr', 433, y7 + 7, { width: bCols[3], align: 'right' });
      doc.fillColor('#34d399').fontSize(9).text('100.00 Crore BDT', 490, y7 + 7, { width: bCols[4] - 8, align: 'right' });
      y7 += 34;

      // 6.2 Economic Feasibility & Value-For-Money (ROI) Analysis
      doc.fillColor(cTeal).fontSize(10).font('Helvetica-Bold').text('6.2 Economic Feasibility & Projected Socio-Economic Returns', 45, y7);
      y7 += 14;

      doc.rect(45, y7, 505, 115).fillAndStroke(cCardBg, cBorder);
      doc.fillColor(cNavy).fontSize(7.5).font('Helvetica').text(
        'The implementation of GreenSignal AI generates an overwhelmingly positive benefit-cost ratio (estimated at 11.4 to 1) for the national economy over a multi-decade operational horizon:\n' +
        '• Avoided Agricultural & Relief Spoilage: Preservation of standing crops, livestock, and emergency relief food grains across hermetic Union silos over successive disaster cycles.\n' +
        '• Elimination of Relief Leakage: Transitioning from manual paper lists to digital QR/biometric verification is projected to curb relief misdirection and duplication by > 98%, saving substantial administrative overheads.\n' +
        '• Rapid Post-Disaster Economic Recovery: Autonomous water RO purification and cold-chain vaccine preservation reduce post-flood waterborne disease outbreaks (cholera, dysentery) significantly in flood-isolated communities.\n' +
        '• Life Safety Index: Advance warning of hours in flash-flood zones and storm-surge belts will virtually eliminate unheralded drownings and structural entrapment casualties.',
        55, y7 + 10, { width: 485, lineGap: 2.2 }
      );

      // =========================================================================
      // PAGE 8: ROADMAP, RISK MANAGEMENT & MINISTERIAL SIGN-OFF
      // =========================================================================
      doc.addPage();
      let y8 = 50;

      y8 = drawSectionBadge('7.0', 'Implementation Horizon, Risk Mitigation & Sign-Off', y8);

      doc.fillColor(cNavy).fontSize(8.2).font('Helvetica').text(
        'While full nationwide civil retrofitting and environmental sensor grid saturation is a multi-decade national endeavor, the core GreenSignal AI digital platform is architected to launch and connect to existing meteorological and hydrometric data streams within 1 to 2 months.',
        45, y8, { width: 505, align: 'justify', lineGap: 2 }
      );
      y8 += 26;

      // 7.1 Phased Implementation Roadmap
      doc.fillColor(cTeal).fontSize(10).font('Helvetica-Bold').text('7.1 Implementation Roadmap (Rapid Launch & Long-Term Scaling)', 45, y8);
      y8 += 14;

      const phases = [
        [
          'Phase 1 (Months 01–02): Rapid Core Launch & Data Stream Ingestion',
          'Deploy core software platform on Tier-IV cloud infrastructure. Ingest live API streams from BMD radar and FFWC river gauge networks. Operationalize flagship Upazila operations hubs with Starlink satellite backup for 99% uptime. Roll out field responder mobile PWA.'
        ],
        [
          'Phase 2 (Medium-Term Horizon): Regional Hub Expansion & Silo Rollout',
          'Progressive expansion of Upazila operations hubs and construction of flood-proof Union relief buffer warehouses and hermetic silos. Progressive installation of dedicated radar and rain gauge telemetry stations, and onboarding of grassroots responder networks.'
        ],
        [
          'Phase 3 (Multi-Decade Horizon): Complete Delta Saturation & Joint Defense Integration',
          'Decadal scaling of high-density IoT telemetry across all delta river corridors and coastal polders. AI predictive hydro-meteorological model refinements, Starlink satellite network resilience, and joint multi-agency mock drills with the Armed Forces Division and CPP.'
        ]
      ];

      phases.forEach(([pTitle, pDesc]) => {
        doc.rect(45, y8, 505, 42).fillAndStroke(cCardBg, cBorder);
        doc.rect(45, y8, 4, 42).fill(cTeal);
        doc.fillColor(cTeal).fontSize(8).font('Helvetica-Bold').text(pTitle, 56, y8 + 6);
        doc.fillColor(cNavy).fontSize(7.2).font('Helvetica').text(pDesc, 56, y8 + 18, { width: 485, lineGap: 1.5 });
        y8 += 48;
      });

      y8 += 6;

      // 7.2 Risk Management Matrix
      doc.fillColor(cTeal).fontSize(10).font('Helvetica-Bold').text('7.2 Key Program Risks & Institutional Mitigation Strategy', 45, y8);
      y8 += 14;

      const riskCols = [120, 75, 310];
      doc.rect(45, y8, 505, 16).fill(cTeal);
      doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold');
      doc.text('Risk Category', 50, y8 + 4, { width: riskCols[0] });
      doc.text('Severity', 173, y8 + 4, { width: riskCols[1] });
      doc.text('Mitigation Strategy & Safeguards', 250, y8 + 4, { width: riskCols[2] });
      y8 += 16;

      const riskRows = [
        ['Field Sensor Vandalism & Theft', 'Medium', 'Tamper-detection vibration switches; GPS geofencing; community stewardship contracts with Union Parishads.'],
        ['Catastrophic Telecom Blackout', 'High', 'Dedicated Starlink satellite terminals in each command center guaranteeing 99% uptime paired with solar LoRa mesh.'],
        ['Low Digital Literacy in Field', 'Medium', 'Icon-driven Bengali PWA UI; zero-text voice note reporting; intensive simulation drills with grassroots volunteers.']
      ];

      riskRows.forEach((r, idx) => {
        const rBg = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
        doc.rect(45, y8, 505, 20).fillAndStroke(rBg, cBorder);
        doc.fillColor(cNavy).fontSize(7).font('Helvetica-Bold').text(r[0], 50, y8 + 4, { width: riskCols[0] - 6 });
        doc.fillColor(r[1] === 'High' ? '#dc2626' : '#d97706').fontSize(7).font('Helvetica-Bold').text(r[1], 173, y8 + 4, { width: riskCols[1] - 6 });
        doc.fillColor(cNavy).fontSize(6.8).font('Helvetica').text(r[2], 250, y8 + 4, { width: riskCols[2] - 6 });
        y8 += 20;
      });

      y8 += 16;

      // 7.3 Formal Institutional Signatures & Verification Block
      doc.fillColor(cTeal).fontSize(10).font('Helvetica-Bold').text('7.3 Formal Ministerial Endorsement & Approval Block', 45, y8);
      y8 += 14;

      const blockW = 158;
      const blockH = 100;
      const bXs = [45, 218, 392];

      // Block 1: Technical Consortium
      doc.rect(bXs[0], y8, blockW, blockH).fillAndStroke('#ffffff', cBorder);
      doc.fillColor(cTeal).fontSize(7.5).font('Helvetica-Bold').text('TECHNICAL CONSORTIUM', bXs[0] + 8, y8 + 8);
      doc.fillColor(cNavy).fontSize(7).font('Helvetica').text('Prepared & Certified By:\nLead Systems Architect\nGreenSignal AI Delivery Group', bXs[0] + 8, y8 + 20, { lineGap: 2 });
      doc.strokeColor(cBorder).lineWidth(0.5).moveTo(bXs[0] + 8, y8 + 75).lineTo(bXs[0] + blockW - 8, y8 + 75).stroke();
      doc.fillColor(cLightMuted).fontSize(6.5).text('Signature & Date', bXs[0] + 8, y8 + 78);

      // Block 2: DDM Review
      doc.rect(bXs[1], y8, blockW, blockH).fillAndStroke('#ffffff', cBorder);
      doc.fillColor(cTeal).fontSize(7.5).font('Helvetica-Bold').text('DEPARTMENT OF DISASTER MGMT', bXs[1] + 8, y8 + 8);
      doc.fillColor(cNavy).fontSize(7).font('Helvetica').text('Reviewed & Recommended By:\nDirector General\nDepartment of Disaster Mgmt', bXs[1] + 8, y8 + 20, { lineGap: 2 });
      doc.strokeColor(cBorder).lineWidth(0.5).moveTo(bXs[1] + 8, y8 + 75).lineTo(bXs[1] + blockW - 8, y8 + 75).stroke();
      doc.fillColor(cLightMuted).fontSize(6.5).text('Signature & Date', bXs[1] + 8, y8 + 78);

      // Block 3: MoDMR Ministerial Approval
      doc.rect(bXs[2], y8, blockW, blockH).fillAndStroke('#ffffff', cBorder);
      doc.fillColor(cTeal).fontSize(7.5).font('Helvetica-Bold').text('MINISTRY OF DISASTER RELIEF', bXs[2] + 8, y8 + 8);
      doc.fillColor(cNavy).fontSize(7).font('Helvetica').text('Approved for Allocation:\nSecretary / Hon\'ble Minister\nMinistry of Disaster Mgmt & Relief', bXs[2] + 8, y8 + 20, { lineGap: 2 });
      doc.strokeColor(cBorder).lineWidth(0.5).moveTo(bXs[2] + 8, y8 + 75).lineTo(bXs[2] + blockW - 8, y8 + 75).stroke();
      doc.fillColor(cLightMuted).fontSize(6.5).text('Official Seal & Approval Signature', bXs[2] + 8, y8 + 78);

      // =========================================================================
      // GLOBAL PASS: RUNNING HEADERS & RUNNING FOOTERS ON ALL BUFFERED PAGES
      // =========================================================================
      const range = doc.bufferedPageRange();
      const totalPages = range.count;

      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        const pageNum = i + 1;

        const oldBottomMargin = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;

        // Running Header on Pages 2 through 8
        if (pageNum > 1) {
          doc.save();
          doc.strokeColor(cTeal).lineWidth(1.2).moveTo(45, 34).lineTo(550, 34).stroke();
          doc.fontSize(7).font('Helvetica-Bold').fillColor(cTeal)
            .text('GreenSignal AI — National Automated Disaster Response & Relief Infrastructure', 45, 22, { lineBreak: false });
          doc.fontSize(7).font('Helvetica').fillColor(cLightMuted)
            .text('MoDMR • Govt. of Bangladesh | 100 Cr Proposal', 350, 22, { width: 200, align: 'right', lineBreak: false });
          doc.restore();
        }

        // Running Footer on All Pages (1 to 8)
        doc.save();
        doc.strokeColor(cBorder).lineWidth(0.75).moveTo(45, 804).lineTo(550, 804).stroke();
        doc.fontSize(7).font('Helvetica').fillColor(cLightMuted)
          .text('Official Technical Proposal • Ministry of Disaster Management and Relief (MoDMR) • BDT 100.00 Cr', 45, 810, { lineBreak: false });
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor(cTeal)
          .text(`Page ${pageNum} of ${totalPages}`, 450, 810, { width: 100, align: 'right', lineBreak: false });
        doc.restore();

        doc.page.margins.bottom = oldBottomMargin;
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
