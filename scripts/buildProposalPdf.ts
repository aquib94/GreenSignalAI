import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

/**
 * Generates the official GreenSignal AI Project Proposal PDF.
 * Matches the turnkey specification proposal:
 * - Cover page (unnumbered)
 * - Pages 1 through 8 (Headers: "Official Technical Proposal | MoDMR | BDT 100.00 Crore" & "Page X of 8")
 * Total 9 pages.
 */
export function createExactProposalPdf(outputPaths: string[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4', // 595.28 x 841.89 pt
        margins: { top: 32, bottom: 24, left: 45, right: 45 },
        bufferPages: true,
        info: {
          Title: 'GreenSignal AI: National Automated Disaster Response Platform - Turnkey Technical Proposal',
          Author: 'GreenSignal AI Consortium & Ministry of Disaster Management and Relief (MoDMR)',
          Subject: 'Turnkey National Technical Specification & Investment Proposal (BDT 100.00 Crore)',
          Keywords: 'Bangladesh, MoDMR, DDM, CPP, Disaster Management, 100 Crore, Starlink, IoT Sensors, Early Warning',
          CreationDate: new Date('2026-09-01T00:00:00Z')
        }
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        outputPaths.forEach(p => {
          try {
            fs.mkdirSync(path.dirname(p), { recursive: true });
            fs.writeFileSync(p, pdfData);
            console.log(`Saved proposal PDF to: ${p} (${pdfData.length} bytes)`);
          } catch (e) {
            console.error(`Error writing PDF to ${p}:`, e);
          }
        });
        resolve(pdfData);
      });

      // Palette
      const cDarkGreen = '#064e3b';
      const cGreenDark = '#047857';
      const cEmerald = '#059669';
      const cLightGreen = '#d1fae5';
      const cNavy = '#0f172a';
      const cMuted = '#475569';
      const cLightMuted = '#64748b';
      const cBorder = '#cbd5e1';
      const cCardBg = '#f8fafc';
      const cRowAlt = '#f8fafc';
      const cBluePillBg = '#e0f2fe';
      const cBluePillBorder = '#bae6fd';
      const cBluePillText = '#0369a1';

      // Section header drawer
      const drawSectionHeader = (title: string, topY: number) => {
        doc.roundedRect(45, topY, 505, 24, 3).fill(cDarkGreen);
        doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold')
          .text(title, 55, topY + 7.5);
        return topY + 34;
      };

      // =========================================================================
      // PAGE 1: COVER PAGE
      // =========================================================================
      
      // Top Government Banner (rounded rectangle)
      doc.roundedRect(45, 38, 505, 50, 4).fill(cDarkGreen);
      doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold')
        .text("GOVERNMENT OF THE PEOPLE'S REPUBLIC OF BANGLADESH", 45, 47, { width: 505, align: 'center' });
      doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica')
        .text('Ministry of Disaster Management and Relief (MoDMR)', 45, 61, { width: 505, align: 'center' });
      doc.fillColor('#a7f3d0').fontSize(7.5).font('Helvetica')
        .text('Department of Disaster Management (DDM) • Cyclone Preparedness Programme (CPP)', 45, 73, { width: 505, align: 'center' });

      // Blue Badge
      const badgeY = 100;
      doc.roundedRect(105, badgeY, 385, 18, 9).fillAndStroke(cBluePillBg, cBluePillBorder);
      doc.fillColor(cBluePillText).fontSize(7.5).font('Helvetica-Bold')
        .text('TURNKEY NATIONAL TECHNICAL SPECIFICATION & INVESTMENT PROPOSAL', 105, badgeY + 4.5, { width: 385, align: 'center' });

      // Big Title
      const titleY = 126;
      doc.fillColor(cNavy).fontSize(17).font('Helvetica-Bold')
        .text('GREENSIGNAL AI: Automated National Infrastructure', 45, titleY, { width: 505, align: 'center' });
      doc.fillColor(cGreenDark).fontSize(9.5).font('Helvetica-Bold')
        .text('National Automated Disaster Response, Hydrometric Early Warning & Strategic Resource Allocation Platform', 45, titleY + 22, { width: 505, align: 'center' });

      // Project Control Table Box
      const tableBoxY = 166;
      doc.roundedRect(45, tableBoxY, 505, 182, 3).fillAndStroke('#ffffff', cBorder);
      doc.roundedRect(45, tableBoxY, 505, 20, 3).fill(cDarkGreen);
      doc.rect(45, tableBoxY + 10, 505, 10).fill(cDarkGreen); // Square off bottom
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold')
        .text('OFFICIAL PROJECT CONTROL & REGISTRATION RECORD', 55, tableBoxY + 6);

      const tableRows = [
        ['Project Title', 'GreenSignal AI: National Automated Disaster Response Platform'],
        ['Project Code / Reference', 'MoDMR-NDMP-2026-GS01 / GOB-Turnkey-P1'],
        ['Total Estimated Outlay', 'BDT 100,00,00,000 (BDT 100.00 Crore / Guaranteed Financial Ceiling)'],
        ['Target Project Lifecycle', 'Live Core Platform in 1–2 Months | Multi-Decade National Expansion Horizon'],
        ['Sponsoring Ministry', 'Ministry of Disaster Management and Relief (MoDMR)'],
        ['Lead Implementing Agency', 'Department of Disaster Management (DDM) & GreenSignal Technical Consortium'],
        ['Strategic Key Partners', 'CPP, BMD, FFWC (BWDB), SPARRSO, BTRC, Armed Forces Division (AFD)'],
        ['Security & Data Classification', 'Official Public Safety Critical / Sovereign National Infrastructure'],
        ['Submission Date', 'September 2026 Edition 3.1 (Comprehensive National Release)']
      ];

      let tY = tableBoxY + 20;
      const rowH = 18;
      tableRows.forEach(([label, value], idx) => {
        const bg = idx % 2 === 0 ? cRowAlt : '#ffffff';
        doc.rect(45, tY, 505, rowH).fillAndStroke(bg, cBorder);
        doc.fillColor(cNavy).fontSize(7.5).font('Helvetica-Bold')
          .text(label, 54, tY + 5, { width: 155 });
        doc.fillColor(cNavy).fontSize(7.5).font(label.includes('Outlay') ? 'Helvetica-Bold' : 'Helvetica')
          .text(value, 215, tY + 5, { width: 325 });
        tY += rowH;
      });

      // Signature Boxes
      const sigY = 360;
      const sigW = 245;
      const sigH = 72;

      // Left: SUBMITTED BY
      doc.roundedRect(45, sigY, sigW, sigH, 4).fillAndStroke('#ffffff', cBorder);
      doc.fillColor(cGreenDark).fontSize(7.5).font('Helvetica-Bold')
        .text('SUBMITTED BY', 45, sigY + 6, { width: sigW, align: 'center' });
      doc.save().strokeColor(cBorder).lineWidth(0.5).dash(3, { space: 3 })
        .moveTo(65, sigY + 28).lineTo(45 + sigW - 20, sigY + 28).stroke().restore();
      doc.fillColor(cNavy).fontSize(7.5).font('Helvetica-Bold')
        .text('National Technical Architecture Consortium', 45, sigY + 32, { width: sigW, align: 'center' });
      doc.fillColor(cMuted).fontSize(6.8).font('Helvetica')
        .text('Chief Systems Architect & Lead Engineer', 45, sigY + 44, { width: sigW, align: 'center' })
        .text('GreenSignal AI Delivery Group, Dhaka', 45, sigY + 54, { width: sigW, align: 'center' });

      // Right: SPONSORED & ENDORSED BY
      const rSigX = 305;
      doc.roundedRect(rSigX, sigY, sigW, sigH, 4).fillAndStroke('#ffffff', cBorder);
      doc.fillColor(cGreenDark).fontSize(7.5).font('Helvetica-Bold')
        .text('SPONSORED & ENDORSED BY', rSigX, sigY + 6, { width: sigW, align: 'center' });
      doc.save().strokeColor(cBorder).lineWidth(0.5).dash(3, { space: 3 })
        .moveTo(rSigX + 20, sigY + 28).lineTo(rSigX + sigW - 20, sigY + 28).stroke().restore();
      doc.fillColor(cNavy).fontSize(7.5).font('Helvetica-Bold')
        .text('Department of Disaster Management (DDM)', rSigX, sigY + 32, { width: sigW, align: 'center' });
      doc.fillColor(cMuted).fontSize(6.8).font('Helvetica')
        .text('Joint Secretary / Director General', rSigX, sigY + 44, { width: sigW, align: 'center' })
        .text('Ministry of Disaster Management & Relief', rSigX, sigY + 54, { width: sigW, align: 'center' });

      // Executive Institutional Summary (Exact Text)
      const sumY = 444;
      const sumH = 68;
      doc.roundedRect(45, sumY, 505, sumH, 4).fillAndStroke('#f0fdf4', '#bbf7d0');
      doc.rect(45, sumY, 3.5, sumH).fill(cGreenDark);
      doc.fillColor(cGreenDark).fontSize(8.5).font('Helvetica-Bold')
        .text('Executive Institutional Summary', 56, sumY + 8);
      doc.fillColor(cNavy).fontSize(7.2).font('Helvetica')
        .text(
          'This technical and financial document details the turnkey implementation of GreenSignal AI for the People\'s Republic of Bangladesh. With a guaranteed capital and operational ceiling of BDT 100.00 Crore, the platform bridges the fatal last-mile gap in flood, cyclone, and seismic disaster response through automated hydrometric sensor networks, autonomous satellite communications, offline-first progressive web applications, and biometric relief dispatching.',
          56, sumY + 22, { width: 485, lineGap: 2.2, align: 'justify' }
        );

      // =========================================================================
      // PAGE 2 (Header: Page 1 of 8): TOC & EXECUTIVE STRATEGIC SUMMARY
      // =========================================================================
      doc.addPage();
      let y2 = drawSectionHeader('SECTION 1.0: TABLE OF CONTENTS & EXECUTIVE STRATEGIC SUMMARY', 50);

      // Subheading: Document Structure & Section Index
      doc.fillColor(cGreenDark).fontSize(9).font('Helvetica-Bold')
        .text('Document Structure & Section Index', 45, y2);
      y2 += 13;

      // TOC Table
      const tocCols = [45, 395, 65];
      doc.rect(45, y2, 505, 16).fill(cDarkGreen);
      doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold')
        .text('Sec.', 50, y2 + 4.5, { width: tocCols[0] })
        .text('Section Name & Scope', 95, y2 + 4.5, { width: tocCols[1] })
        .text('Location', 490, y2 + 4.5, { width: tocCols[2], align: 'right' });
      y2 += 16;

      const tocItems = [
        ['1.0', 'Table of Contents & Executive Strategic Summary', 'Page 2'],
        ['2.0', 'Multi-Tier Institutional & Operational Architecture', 'Page 3'],
        ['3.0', 'Digital Platform Architecture, Software Codebase & Cyber-Security', 'Page 4'],
        ['4.0', 'Network Topology, High-Throughput Cloud & Starlink Satellite Communications', 'Page 5'],
        ['5.0', 'Automated Environmental Sensor Network & Industrial IoT Datasheet', 'Page 6'],
        ['6.0', 'Comprehensive Financial Budget Breakdown (100.00 Crore BDT CapEx/OpEx)', 'Page 7'],
        ['7.0', 'Phased Implementation Horizon, Risk Mitigation & Ministerial Approval', 'Page 8']
      ];

      tocItems.forEach(([sec, name, loc], idx) => {
        const bg = idx % 2 === 0 ? cRowAlt : '#ffffff';
        doc.rect(45, y2, 505, 14.5).fillAndStroke(bg, cBorder);
        doc.fillColor(cNavy).fontSize(7.2).font('Helvetica-Bold').text(sec, 50, y2 + 3.5, { width: tocCols[0] });
        doc.fillColor(cNavy).fontSize(7.2).font('Helvetica').text(name, 95, y2 + 3.5, { width: tocCols[1] });
        doc.fillColor(cNavy).fontSize(7.2).font('Helvetica').text(loc, 490, y2 + 3.5, { width: tocCols[2], align: 'right' });
        y2 += 14.5;
      });

      y2 += 11;

      // 1.1 Strategic Humanitarian & Geographic Imperative
      doc.fillColor(cGreenDark).fontSize(9).font('Helvetica-Bold')
        .text('1.1 Strategic Humanitarian & Geographic Imperative', 45, y2);
      y2 += 12;
      doc.fillColor(cNavy).fontSize(7.2).font('Helvetica')
        .text('Bangladesh stands universally recognized as one of the world\'s most vulnerable deltaic nations in the face of escalating climate volatility. The massive river networks of the Meghna, Jamuna, and Padma basins drain vast volumes of monsoonal discharge into the Bay of Bengal every year. Heavy seasonal rainfall regularly causes catastrophic inundations that disrupt millions of lives. The 710-kilometer coastline remains exposed to severe cyclonic surges, while the northeastern Haor wetlands endure flash floods that submerge standing crops within hours. Comprehensive disaster resilience requires proactive and automated technology across all levels of government.', 45, y2, { width: 505, align: 'justify', lineGap: 1.8 });
      y2 = doc.y + 10;

      // 1.2 Addressing the "Last-Mile Gap" in Conventional Disaster Operations
      doc.fillColor(cGreenDark).fontSize(9).font('Helvetica-Bold')
        .text('1.2 Addressing the "Last-Mile Gap" in Conventional Disaster Operations', 45, y2);
      y2 += 12;
      doc.fillColor(cNavy).fontSize(7.2).font('Helvetica')
        .text('Traditional forecasting systems provide valuable macro-level warnings, but an operational gap persists between central intelligence and local execution. Historical response efforts have faced persistent systemic challenges:', 45, y2, { width: 505, lineGap: 1.8 });
      y2 = doc.y + 6;

      const gapBullets = [
        ['Manual Telemetry Latency: ', 'Remote gauge readings rely on manual measurements, introducing delays that impede timely central analysis and emergency response decisions.'],
        ['Static Relief Allocation: ', 'Supply distribution relies on outdated demographic lists rather than real-time flood maps and dynamic displaced population movements.'],
        ['Telecommunications Vulnerability: ', 'Extreme cyclonic events disable ground-level cell towers and power networks, isolating vulnerable coastal and island communities.'],
        ['Relief Distribution Transparency: ', 'Paper manifests lack modern verification mechanisms, which increases the risk of supply imbalances across field warehouses.']
      ];

      gapBullets.forEach(([title, body]) => {
        doc.fillColor(cNavy).fontSize(7.2).font('Helvetica-Bold').text('•  ' + title, 50, y2, { continued: true });
        doc.font('Helvetica').text(body, { width: 495, lineGap: 1.5 });
        y2 = doc.y + 3;
      });

      y2 += 6;

      // 1.3 The GreenSignal AI Paradigm Shift
      doc.fillColor(cGreenDark).fontSize(9).font('Helvetica-Bold')
        .text('1.3 The GreenSignal AI Paradigm Shift', 45, y2);
      y2 += 12;
      doc.fillColor(cNavy).fontSize(7.2).font('Helvetica')
        .text('The GreenSignal AI platform bridges operational gaps by linking automated industrial telemetry, edge computing, Starlink satellite backups, and dynamic logistical dispatch algorithms into a unified network. Complete physical rollout will expand over several years, but the core software platform is fully engineered for immediate activation. Connection to existing meteorological data streams will take place within 1 to 2 months of authorization.', 45, y2, { width: 505, align: 'justify', lineGap: 1.8 });
      y2 = doc.y + 9;

      // National Key Performance Targets Card
      const kpiH = 75;
      doc.roundedRect(45, y2, 505, kpiH, 4).fillAndStroke(cCardBg, cBorder);
      doc.rect(45, y2, 3.5, kpiH).fill(cGreenDark);
      doc.fillColor(cGreenDark).fontSize(8).font('Helvetica-Bold')
        .text('National Key Performance Targets (Rapid Launch & Decadal Scaling)', 56, y2 + 6);

      const kpis = [
        ['Rapid Software Operationalization: ', 'Core software platform live and ingesting existing BMD/FFWC data in 1–2 months.'],
        ['Early Warning Latency: ', 'Sub-30-second broadcast triggers from sensor threshold breach to automated SMS.'],
        ['Mission-Critical Uptime: ', '99% uptime guaranteed across command centers via dedicated Starlink terminals.'],
        ['Grassroots Mobilization: ', 'Offline PWA functionality for all CPP leads and registered field responders.'],
        ['Strategic Relief Integrity: ', 'Complete NID/QR biometric verification across Union Buffer Warehouses.']
      ];

      let kY = y2 + 18;
      kpis.forEach(([boldText, regText]) => {
        doc.fillColor(cNavy).fontSize(7).font('Helvetica-Bold').text('•  ' + boldText, 56, kY, { continued: true });
        doc.font('Helvetica').text(regText, { width: 485, lineGap: 1.2 });
        kY = doc.y + 1.8;
      });

      // =========================================================================
      // PAGE 3 (Header: Page 2 of 8): MULTI-TIER INSTITUTIONAL ARCHITECTURE
      // =========================================================================
      doc.addPage();
      let y3 = drawSectionHeader('SECTION 2.0: MULTI-TIER INSTITUTIONAL & OPERATIONAL ARCHITECTURE', 50);

      doc.fillColor(cNavy).fontSize(7.2).font('Helvetica')
        .text('Effective disaster mitigation demands seamless interoperability between ministerial decision-makers, regional tactical commanders, grassroots union responders, and the general public. GreenSignal AI provides a unified operational picture across four distinct administrative tiers:', 45, y3, { width: 505, align: 'justify', lineGap: 1.8 });
      y3 = doc.y + 10;

      // 2.1 Multi-Tier Stakeholder Integration Matrix
      doc.fillColor(cGreenDark).fontSize(9).font('Helvetica-Bold')
        .text('2.1 Multi-Tier Stakeholder Integration Matrix', 45, y3);
      y3 += 12;

      const tCols = [95, 125, 125, 160];
      doc.rect(45, y3, 505, 16).fill(cDarkGreen);
      doc.fillColor('#ffffff').fontSize(7.2).font('Helvetica-Bold')
        .text('Operational Tier', 50, y3 + 4.5, { width: tCols[0] })
        .text('Primary User Groups', 145, y3 + 4.5, { width: tCols[1] })
        .text('Platform Interface', 270, y3 + 4.5, { width: tCols[2] })
        .text('Core Operational Responsibilities', 395, y3 + 4.5, { width: tCols[3] });
      y3 += 16;

      const tRows = [
        [
          'Tier 1: National Executive (Cabinet & DDM)',
          "Hon'ble Prime Minister, Disaster Management Minister, Secretary, DDM DG",
          'National Executive War-Room (Biometric Desktop & Large-Display Wall)',
          'Strategic resource clearance, macro-level emergency declarations, armed forces liaison, international aid coordination.'
        ],
        [
          'Tier 2: Tactical Command (Upazila Operations)',
          'UNO (Upazila Nirbahi Officer), Upazila Project Implementation Officer (PIO), Armed Forces Field Commanders',
          'Tactical GIS Coordinator Suite (Desktop & Tablet Web Console)',
          'District-level triage dispatch, buffer warehouse logistics, sensor threshold calibration, emergency transport routing.'
        ],
        [
          'Tier 3: Grassroots Field (Union & Village)',
          'CPP Volunteers, Union Parishad Members, Ansar/VDP, Local Health Workers',
          'Field Worker PWA (Offline-First Mobile PWA with IndexedDB)',
          'Last-mile SMS relays, shelter headcount audits, biometric QR relief scanning, ground-truth visual reports.'
        ],
        [
          'Tier 4: Affected Citizens (General Population)',
          'Rural and coastal households, vulnerable farmers, coastal fishermen',
          'Multi-Channel Citizen Gateway (Cell Broadcast, Voice IVR, Telegram/SMS)',
          'Real-time evacuation routing to nearest shelter, emergency SOS pings, missing family inquiries, verified relief depot hours.'
        ]
      ];

      tRows.forEach((r, idx) => {
        const bg = idx % 2 === 0 ? cRowAlt : '#ffffff';
        const h = idx === 0 ? 38 : (idx === 1 ? 40 : 38);
        doc.rect(45, y3, 505, h).fillAndStroke(bg, cBorder);
        doc.fillColor(cNavy).fontSize(7).font('Helvetica-Bold').text(r[0], 50, y3 + 4, { width: tCols[0] - 6 });
        doc.fillColor(cNavy).fontSize(6.8).font('Helvetica').text(r[1], 145, y3 + 4, { width: tCols[1] - 6, lineGap: 1.2 });
        doc.fillColor(cNavy).fontSize(6.8).font('Helvetica-Bold').text(r[2], 270, y3 + 4, { width: tCols[2] - 6, lineGap: 1.2 });
        doc.fillColor(cNavy).fontSize(6.8).font('Helvetica').text(r[3], 395, y3 + 4, { width: tCols[3] - 6, lineGap: 1.2 });
        y3 += h;
      });

      y3 += 12;

      // 2.2 Physical Infrastructure: Operational Hubs, Buffer Warehouses & Shelters
      doc.fillColor(cGreenDark).fontSize(9).font('Helvetica-Bold')
        .text('2.2 Physical Infrastructure: Operational Hubs, Buffer Warehouses & Shelters', 45, y3);
      y3 += 12;

      doc.fillColor(cNavy).fontSize(7.2).font('Helvetica-Bold')
        .text('Upazila Operations Hubs (Tactical Command Retrofits): ', 45, y3, { continued: true });
      doc.font('Helvetica')
        .text('Existing Upazila Parishad complexes will serve as primary tactical command centers running the GreenSignal AI Suite. Technical specifications include:', { lineGap: 1.5 });
      y3 = doc.y + 4;

      const hubBullets = [
        'Monitoring walls featuring live GIS mapping, hydrological telemetry, and active alert status nodes.',
        'A 10 kVA Hybrid Solar-Inverter system backed by 48V LiFePO4 batteries and automated diesel generator failover.',
        'Multi-band VHF/UHF tactical base stations connected directly to the Cyclone Preparedness Programme network.',
        'Dedicated Starlink satellite terminals to guarantee 99% uptime during power and commercial fiber outages.'
      ];

      hubBullets.forEach(b => {
        doc.fillColor(cNavy).fontSize(7.2).font('Helvetica').text('•  ' + b, 52, y3, { width: 495, lineGap: 1.2 });
        y3 = doc.y + 2;
      });

      y3 += 5;

      doc.fillColor(cNavy).fontSize(7.2).font('Helvetica-Bold')
        .text('Climate-Hardened Union Relief Buffer Warehouses & Silos: ', 45, y3, { continued: true });
      doc.font('Helvetica')
        .text('Specialized facilities located in high-risk zones safeguard community resources and emergency supplies:', { lineGap: 1.5 });
      y3 = doc.y + 4;

      const whBullets = [
        ['Elevated Concrete Plinths: ', 'Structures built above historical high-water levels to prevent flooding of stockpiles.'],
        ['Hermetic Storage Silos: ', 'Airtight grain units designed to protect rice, legumes, and emergency food from moisture and pests.'],
        ['Solar Cold-Chain Vaults: ', 'WHO-compliant refrigeration systems keeping vaccines and medicines within 2°C to 8°C.'],
        ['Solar Water Desalination Units: ', 'High-capacity reverse osmosis systems producing fresh drinking water in flood zones.'],
        ['Automated RFID Gates: ', 'Real-time inventory scanning systems tracking supplies entering and leaving warehouses.']
      ];

      whBullets.forEach(([bTitle, bDesc]) => {
        doc.fillColor(cNavy).fontSize(7.2).font('Helvetica-Bold').text('•  ' + bTitle, 52, y3, { continued: true });
        doc.font('Helvetica').text(bDesc, { width: 495, lineGap: 1.2 });
        y3 = doc.y + 2.5;
      });

      // =========================================================================
      // PAGE 4 (Header: Page 3 of 8): DIGITAL PLATFORM ARCHITECTURE & SCHEMAS
      // =========================================================================
      doc.addPage();
      let y4 = drawSectionHeader('SECTION 3.0: DIGITAL PLATFORM ARCHITECTURE, SOFTWARE CODEBASE & CYBER-SECURITY', 50);

      doc.fillColor(cNavy).fontSize(7.2).font('Helvetica')
        .text('GreenSignal AI operates on a modern, event-driven web and edge computing stack designed for high concurrency, zero latency, and resilient offline execution in disconnected disaster zones.', 45, y4, { width: 505, align: 'justify', lineGap: 1.8 });
      y4 = doc.y + 10;

      // 3.1 Software Architecture & Module Specifications
      doc.fillColor(cGreenDark).fontSize(9).font('Helvetica-Bold')
        .text('3.1 Software Architecture & Module Specifications', 45, y4);
      y4 += 12;

      const sModules = [
        ['Field Worker PWA Mobile App (TypeScript / Service Workers / IndexedDB): ', 'Designed for frontline volunteers operating without cellular connectivity. Utilizes local cache storage and service workers to capture victim counts, shelter check-ins, and biometric supply receipts. Data automatically syncs via background sync APIs once network connectivity is restored.'],
        ['Tactical Coordinator GIS Suite (Interactive Map & Leaflet Engine): ', 'High-performance interactive map dashboards display nationwide district nodes, active shelters, and real-time IoT feeds. Mathematical dispatch algorithms assist commanders by calculating optimal distribution routes for food, drinking water, and medical resources based on real-time occupancy.'],
        ['Privacy-Isolated Real-Time Messenger (src/services/messaging.ts): ', 'An event-driven Socket.io architecture provides secure broadcast channels for macro-level directives while isolating direct team communications to protect operational data and survivor privacy.'],
        ['Relational Database Engine & Spatial Indexing (PostgreSQL & In-Memory Cache): ', 'Normalized schemas manage system records for administrative units, user roles, relief stocks, and sensor logs. Spatial indexing supports sub-millisecond query responses across complex geographic layers.']
      ];

      sModules.forEach(([mName, mDesc]) => {
        doc.fillColor(cNavy).fontSize(7.2).font('Helvetica-Bold').text(mName, 45, y4, { continued: true });
        doc.font('Helvetica').text(mDesc, { width: 505, lineGap: 1.4 });
        y4 = doc.y + 4.5;
      });

      y4 += 5;

      // 3.2 Core Database Schema Summary
      doc.fillColor(cGreenDark).fontSize(9).font('Helvetica-Bold')
        .text('3.2 Core Database Schema Summary', 45, y4);
      y4 += 12;

      const scCols = [95, 125, 285];
      doc.rect(45, y4, 505, 16).fill(cDarkGreen);
      doc.fillColor('#ffffff').fontSize(7.2).font('Helvetica-Bold')
        .text('Entity Model', 50, y4 + 4.5, { width: scCols[0] })
        .text('Key Data Attributes', 150, y4 + 4.5, { width: scCols[1] })
        .text('Functional Role & Integrity Constraints', 280, y4 + 4.5, { width: scCols[2] });
      y4 += 16;

      const scRows = [
        ['DistrictNode', 'id, name, division, riskLevel, coordinates', 'Defines primary spatial hierarchy across national divisions and districts.'],
        ['ReliefCenter', 'id, districtId, capacity, stockFood, stockWater', 'Tracks real-time stock balances for food, water, and emergency supplies.'],
        ['EnvironmentalSensor', 'id, districtId, type, reading, status, battery', 'Stores continuous telemetry from radar gauges, rain gauges, and piezometers.'],
        ['DisasterAlert', 'id, districtId, severity, title, active, timestamp', 'Manages automated system triggers across WebSockets, SMS, and broadcasts.'],
        ['ShelterAllocation', 'id, reliefCenterId, allocatedBy, peopleHoused', 'Monitors occupancy levels across emergency shelters to manage capacity.'],
        ['ChatMessage', 'id, senderId, receiverId, channelId, message', 'Logs tactical team communications for operational records and auditing.']
      ];

      scRows.forEach((sr, idx) => {
        const bg = idx % 2 === 0 ? cRowAlt : '#ffffff';
        doc.rect(45, y4, 505, 16.5).fillAndStroke(bg, cBorder);
        doc.fillColor(cNavy).fontSize(7).font('Helvetica-Bold').text(sr[0], 50, y4 + 4, { width: scCols[0] - 6 });
        doc.fillColor(cNavy).fontSize(6.8).font('Helvetica-Oblique').text(sr[1], 150, y4 + 4, { width: scCols[1] - 6 });
        doc.fillColor(cNavy).fontSize(6.8).font('Helvetica').text(sr[2], 280, y4 + 4, { width: scCols[2] - 6 });
        y4 += 16.5;
      });

      y4 += 11;

      // 3.3 Data Sovereignty & Cybersecurity Framework
      doc.fillColor(cGreenDark).fontSize(9).font('Helvetica-Bold')
        .text('3.3 Data Sovereignty & Cybersecurity Framework', 45, y4);
      y4 += 12;

      const secBullets = [
        ['In-Country Hosting: ', 'Primary databases and user logs remain housed inside Bangladesh within the Tier-IV National Data Center.'],
        ['Cryptographic Standards: ', 'System configurations enforce TLS 1.3 for data transmission and AES-256 encryption for stored data.'],
        ['Identity Verification: ', 'Biometric verification utilizes zero-knowledge HMAC tokens linked to national NID records without storing raw personal data on mobile devices.'],
        ['Role-Based Access Control (RBAC): ', 'Access permissions strictly match user authorizations, with administrative actions recorded in secure, immutable system ledgers.']
      ];

      secBullets.forEach(([bT, rT]) => {
        doc.fillColor(cNavy).fontSize(7.2).font('Helvetica-Bold').text('•  ' + bT, 52, y4, { continued: true });
        doc.font('Helvetica').text(rT, { width: 495, lineGap: 1.2 });
        y4 = doc.y + 2.5;
      });

      // =========================================================================
      // PAGE 5 (Header: Page 4 of 8): NETWORK TOPOLOGY & STARLINK INFRASTRUCTURE
      // =========================================================================
      doc.addPage();
      let y5 = drawSectionHeader('SECTION 4.0: NETWORK TOPOLOGY & STARLINK SATELLITE INFRASTRUCTURE', 50);

      doc.fillColor(cNavy).fontSize(7.2).font('Helvetica')
        .text('Terrestrial telecommunications networks in coastal and riverine Bangladesh frequently fail during cyclonic landfall and flash flooding. GreenSignal AI introduces a redundant tri-tier network architecture to maintain continuous operations during catastrophic disruptions.', 45, y5, { width: 505, align: 'justify', lineGap: 1.8 });
      y5 = doc.y + 10;

      // 4.1 Multi-Layer Host & Network Infrastructure
      doc.fillColor(cGreenDark).fontSize(9).font('Helvetica-Bold')
        .text('4.1 Multi-Layer Host & Network Infrastructure', 45, y5);
      y5 += 12;

      const hostBullets = [
        ['Tier-IV National Data Center (Primary Host): ', 'Cloud infrastructure hosted in Kaliakair, Gazipur, delivering 99.995% uptime, dual redundant utility feeds, and strict hardware-level data sovereignty.'],
        ['Tier-III Disaster Recovery Center (Hot Standby): ', 'Disaster recovery facility in Jashore maintains live transactional database replication, enabling sub-minute failover during primary datacenter outages.'],
        ['BDIX Peering & Edge Network: ', 'Direct peering via the Bangladesh Internet Exchange (BDIX) ensures rapid low-latency routing across all domestic Internet Service Providers.'],
        ['Scalable Cloud Architecture: ', 'Containerized microservices automatically scale to manage sudden traffic spikes during major national flood emergencies.']
      ];

      hostBullets.forEach(([hT, hD]) => {
        doc.fillColor(cNavy).fontSize(7.2).font('Helvetica-Bold').text('•  ' + hT, 52, y5, { continued: true });
        doc.font('Helvetica').text(hD, { width: 495, lineGap: 1.2 });
        y5 = doc.y + 2.5;
      });

      y5 += 8;

      // 4.2 Telecommunications Channel Architecture
      doc.fillColor(cGreenDark).fontSize(9).font('Helvetica-Bold')
        .text('4.2 Telecommunications Channel Architecture', 45, y5);
      y5 += 12;

      const chCols = [105, 125, 115, 160];
      doc.rect(45, y5, 505, 16).fill(cDarkGreen);
      doc.fillColor('#ffffff').fontSize(7.2).font('Helvetica-Bold')
        .text('Channel Type', 50, y5 + 4.5, { width: chCols[0] })
        .text('Coverage & Providers', 155, y5 + 4.5, { width: chCols[1] })
        .text('Latency & Bandwidth', 280, y5 + 4.5, { width: chCols[2] })
        .text('Operational Role & Resilience', 395, y5 + 4.5, { width: chCols[3] });
      y5 += 16;

      const chRows = [
        ['Dedicated Private APN (4G LTE / 5G)', 'Grameenphone, Robi, Banglalink, Teletalk', 'Latency: < 35 ms\nSpeed: 10–50 Mbps', 'Prioritized data lanes for emergency responders with zero-rated billing for official operations.'],
        ['Starlink Terminals (LEO Satellite)', 'Starlink Satellite Integration Services', 'Latency: 25–45 ms\nSpeed: 100–220 Mbps', 'Installed at command hubs to guarantee 99% operational uptime during terrestrial grid failures.'],
        ['Solar LoRaWAN Mesh (868 / 915 MHz)', 'Autonomous Upazila Mast Network', 'Latency: 1–3 sec\nSpeed: 5–50 kbps', 'Carrier-independent local network transmitting basic telemetry and SOS alerts up to 15 km.'],
        ['BTRC Cell Broadcast (High-Volume SMPP)', 'All National Mobile Operators', 'Broadcast Capacity:\n100,000 SMS / sec', 'Geofenced emergency broadcasts sent directly to mobile handsets without requiring an app.']
      ];

      chRows.forEach((cr, idx) => {
        const bg = idx % 2 === 0 ? cRowAlt : '#ffffff';
        doc.rect(45, y5, 505, 30).fillAndStroke(bg, cBorder);
        doc.fillColor(cNavy).fontSize(7).font('Helvetica-Bold').text(cr[0], 50, y5 + 4, { width: chCols[0] - 6 });
        doc.fillColor(cNavy).fontSize(6.8).font('Helvetica').text(cr[1], 155, y5 + 4, { width: chCols[1] - 6, lineGap: 1.2 });
        doc.fillColor(cNavy).fontSize(6.8).font('Helvetica-Bold').text(cr[2], 280, y5 + 4, { width: chCols[2] - 6, lineGap: 1.2 });
        doc.fillColor(cNavy).fontSize(6.8).font('Helvetica').text(cr[3], 395, y5 + 4, { width: chCols[3] - 6, lineGap: 1.2 });
        y5 += 30;
      });

      y5 += 12;

      // Failover Protocol Callout Card
      const fCardH = 68;
      doc.roundedRect(45, y5, 505, fCardH, 4).fillAndStroke(cCardBg, cBorder);
      doc.rect(45, y5, 3.5, fCardH).fill(cGreenDark);
      doc.fillColor(cGreenDark).fontSize(8).font('Helvetica-Bold')
        .text('Automated Network Failover Protocol (Tri-Tier Recovery)', 56, y5 + 6);

      const fSteps = [
        ['1. Outage Detection: ', 'System monitoring identifies standard cellular network loss lasting longer than 15 seconds.'],
        ['2. Satellite Handover: ', 'Upazila command centers switch traffic to high-speed Starlink terminals to maintain 99% uptime.'],
        ['3. Mesh Activation: ', 'Field sensors and handheld radios switch to local 868 MHz LoRa channels, passing emergency alerts node-by-node to active satellite uplinks.']
      ];

      let fY = y5 + 18;
      fSteps.forEach(([sT, sD]) => {
        doc.fillColor(cNavy).fontSize(7).font('Helvetica-Bold').text(sT, 56, fY, { continued: true });
        doc.font('Helvetica').text(sD, { width: 485, lineGap: 1.2 });
        fY = doc.y + 2;
      });

      // =========================================================================
      // PAGE 6 (Header: Page 5 of 8): AUTOMATED ENVIRONMENTAL SENSORS & IOT
      // =========================================================================
      doc.addPage();
      let y6 = drawSectionHeader('SECTION 5.0: AUTOMATED ENVIRONMENTAL SENSORS & IOT DATASHEET', 50);

      doc.fillColor(cNavy).fontSize(7.2).font('Helvetica')
        .text('Accurate early warning depends on reliable hydrological and meteorological sensor feeds. The GreenSignal AI sensor suite is purpose-built to endure continuous submersion, high humidity, and severe cyclonic forces.', 45, y6, { width: 505, align: 'justify', lineGap: 1.8 });
      y6 = doc.y + 10;

      // 5.1 Sensor Hardware Specifications
      doc.fillColor(cGreenDark).fontSize(9).font('Helvetica-Bold')
        .text('5.1 Sensor Hardware Specifications', 45, y6);
      y6 += 12;

      const senCols = [105, 115, 150, 135];
      doc.rect(45, y6, 505, 16).fill(cDarkGreen);
      doc.fillColor('#ffffff').fontSize(7.2).font('Helvetica-Bold')
        .text('Sensor Equipment', 50, y6 + 4.5, { width: senCols[0] })
        .text('Model Reference', 160, y6 + 4.5, { width: senCols[1] })
        .text('Technical Performance', 275, y6 + 4.5, { width: senCols[2] })
        .text('Primary Deployment Locations', 425, y6 + 4.5, { width: senCols[3] });
      y6 += 16;

      const senRows = [
        ['Radar River Gauge', 'OTT RLS / Vega VEGAPULS C21', '26 GHz radar, ±2 mm accuracy, 0–35 m range. Operates reliably without debris interference.', 'Bridge piers, barrage sluices, and major river channels.'],
        ['Automated Rain Gauge', 'Campbell Scientific TE525MM', 'Tipping bucket mechanism, 0.1 mm resolution, stainless steel collection funnel.', 'Upazila weather stations and hilly landslide-prone areas.'],
        ['Pore Piezometer', 'RST Instruments VW2100', 'Vibrating wire sensor, 0–500 kPa range. Detects water pressure increases inside levees.', 'Coastal polders and vulnerable river embankment structures.'],
        ['Surge & Tidal Gauge', 'SonTek Argonaut-XR / Aanderaa', 'Acoustic velocity and pressure measurement, 0–20 m depth range with protective casing.', 'Estuaries, coastal inlets, and island monitoring sites.'],
        ['Compact Weather Station', 'Vaisala WXT536 Multi-Sensor', 'Ultrasonic wind measurement (0–60 m/s), temperature, pressure, and humidity sensors.', 'Coastal tracking towers and regional airfield installations.']
      ];

      senRows.forEach((sr, idx) => {
        const bg = idx % 2 === 0 ? cRowAlt : '#ffffff';
        doc.rect(45, y6, 505, 33).fillAndStroke(bg, cBorder);
        doc.fillColor(cNavy).fontSize(7).font('Helvetica-Bold').text(sr[0], 50, y6 + 4, { width: senCols[0] - 6 });
        doc.fillColor(cNavy).fontSize(6.8).font('Helvetica').text(sr[1], 160, y6 + 4, { width: senCols[1] - 6 });
        doc.fillColor(cNavy).fontSize(6.8).font('Helvetica').text(sr[2], 275, y6 + 4, { width: senCols[2] - 6, lineGap: 1.2 });
        doc.fillColor(cNavy).fontSize(6.8).font('Helvetica').text(sr[3], 425, y6 + 4, { width: senCols[3] - 6, lineGap: 1.2 });
        y6 += 33;
      });

      y6 += 12;

      // 5.2 Industrial Remote Telemetry Unit (RTU) Construction
      doc.fillColor(cGreenDark).fontSize(9).font('Helvetica-Bold')
        .text('5.2 Industrial Remote Telemetry Unit (RTU) Construction', 45, y6);
      y6 += 12;
      doc.fillColor(cNavy).fontSize(7.2).font('Helvetica')
        .text('Sensors connect to industrial-grade RTUs engineered specifically for harsh tropical conditions:', 45, y6);
      y6 = doc.y + 4;

      const rtuBullets = [
        ['Protection Enclosure: ', 'Marine-grade aluminum housing rated at IP68 with internal desiccant pressure valves.'],
        ['Processing Core: ', 'Low-power 32-bit ARM Cortex-M4 microcontroller running FreeRTOS with hardware encryption support.'],
        ['Communications Modems: ', 'Dual-SIM 4G LTE Cat-M1 / NB-IoT modems with automatic signal switching and backup LoRa transceivers.'],
        ['Solar Power Architecture: ', 'A 40W monocrystalline solar panel coupled with a 24Ah LiFePO4 battery pack providing 21 days of continuous operation without direct sunlight.'],
        ['Structural Masts: ', 'Galvanized 5-meter steel towers anchored in reinforced concrete pads designed to withstand cyclonic winds up to 260 km/h.'],
        ['Surge Suppression: ', 'Heavy-duty IEC 61643-11 Class II surge arrestors connected to copper grounding rods achieving under 5 ohms resistance.']
      ];

      rtuBullets.forEach(([bT, rT]) => {
        doc.fillColor(cNavy).fontSize(7.2).font('Helvetica-Bold').text('•  ' + bT, 52, y6, { continued: true });
        doc.font('Helvetica').text(rT, { width: 495, lineGap: 1.2 });
        y6 = doc.y + 2;
      });

      y6 += 6;

      // 5.3 Priority Geographic Placement Zones
      doc.fillColor(cGreenDark).fontSize(9).font('Helvetica-Bold')
        .text('5.3 Priority Geographic Placement Zones', 45, y6);
      y6 += 12;

      const geoZones = [
        ['Haor Flash-Flood Basins: ', 'Sunamganj, Sylhet, Netrokona, Habiganj, and Kishoreganj for tracking mountain runoff.'],
        ['Major River Corridors: ', 'Kurigram, Gaibandha, Bogura, Sirajganj, and Jamalpur along the Jamuna, Brahmaputra, and Padma rivers.'],
        ['Coastal Tidal Belts: ', 'Barguna, Patuakhali, Bhola, Satkhira, Cox\'s Bazar, and Chittagong coastal areas and offshore islands.']
      ];

      geoZones.forEach(([gT, gD]) => {
        doc.fillColor(cNavy).fontSize(7.2).font('Helvetica-Bold').text('•  ' + gT, 45, y6, { continued: true });
        doc.font('Helvetica').text(gD, { width: 505, lineGap: 1.2 });
        y6 = doc.y + 3;
      });

      // =========================================================================
      // PAGE 7 (Header: Page 6 of 8): FINANCIAL BUDGET BREAKDOWN (100.00 CRORE)
      // =========================================================================
      doc.addPage();
      let y7 = drawSectionHeader('SECTION 6.0: FINANCIAL BUDGET BREAKDOWN (100.00 CRORE BDT CAPEX/OPEX)', 50);

      doc.fillColor(cNavy).fontSize(7.2).font('Helvetica')
        .text('The financial architecture complies fully with the Public Procurement Act (PPA-2006) and Public Procurement Rules (PPR-2008). Total project allocations remain strictly capped at BDT 100.00 Crore (One Hundred Crore Taka), structuring long-term investments alongside essential operational funding.', 45, y7, { width: 505, align: 'justify', lineGap: 1.8 });
      y7 = doc.y + 10;

      // 6.1 Detailed Capital and Operational Allocation Structure
      doc.fillColor(cGreenDark).fontSize(9).font('Helvetica-Bold')
        .text('6.1 Detailed Capital and Operational Allocation Structure', 45, y7);
      y7 += 12;

      const bCols = [140, 195, 50, 50, 70];
      doc.rect(45, y7, 505, 16).fill(cDarkGreen);
      doc.fillColor('#ffffff').fontSize(7.2).font('Helvetica-Bold')
        .text('Expenditure Head & Scope', 50, y7 + 4.5, { width: bCols[0] })
        .text('Deliverables & Bill of Quantities', 195, y7 + 4.5, { width: bCols[1] })
        .text('CapEx', 395, y7 + 4.5, { width: bCols[2], align: 'right' })
        .text('OpEx', 445, y7 + 4.5, { width: bCols[3], align: 'right' })
        .text('Total', 500, y7 + 4.5, { width: bCols[4] - 8, align: 'right' });
      y7 += 16;

      const bRows = [
        ['1. Automated IoT Sensor Network & Hydrometric Telemetry', 'Telemetry stations, OTT radar units, rain gauges, piezometers, solar RTUs, 5m steel towers, civil works.', '25.50', '2.50', '28.00'],
        ['2. Physical Command Hubs, Buffer Warehouses & Cold Storage', 'Upazila hub retrofits, monitoring walls, solar inverters, generators, relief silos, cold vaults, water RO units.', '23.00', '2.00', '25.00'],
        ['3. Software Architecture, GIS Suite & Mobile PWAs', 'Offline field apps, GIS coordinator dashboards, ministry command software, predictive models, NID tools.', '11.50', '2.50', '14.00'],
        ['4. Data Center Hosting, Cloud & Satellite Infrastructure', 'Tier-IV BCC hosting, Jashore DR center, BDIX connectivity, private cellular APNs, Starlink satellite integration.', '4.50', '7.50', '12.00'],
        ['5. Field Human Resource Training & Operations', 'Digital literacy training for field responders, CPP teams, Upazila officers, joint simulations with Armed Forces.', '3.00', '8.00', '11.00'],
        ['6. Security Audits, Quality Control & Reserve Stock', 'BGD e-GOV CIRT security audits, ISO 27001 checks, hardware reserve stock, price contingency funds.', '6.00', '4.00', '10.00']
      ];

      bRows.forEach((br, idx) => {
        const bg = idx % 2 === 0 ? cRowAlt : '#ffffff';
        doc.rect(45, y7, 505, 27).fillAndStroke(bg, cBorder);
        doc.fillColor(cNavy).fontSize(6.8).font('Helvetica-Bold').text(br[0], 50, y7 + 4, { width: bCols[0] - 6 });
        doc.fillColor(cNavy).fontSize(6.8).font('Helvetica').text(br[1], 195, y7 + 4, { width: bCols[1] - 6, lineGap: 1.2 });
        doc.fillColor(cNavy).fontSize(7).font('Helvetica').text(br[2], 395, y7 + 4, { width: bCols[2], align: 'right' });
        doc.fillColor(cNavy).fontSize(7).font('Helvetica').text(br[3], 445, y7 + 4, { width: bCols[3], align: 'right' });
        doc.fillColor(cGreenDark).fontSize(7.2).font('Helvetica-Bold').text(br[4], 500, y7 + 4, { width: bCols[4] - 8, align: 'right' });
        y7 += 27;
      });

      // Total Row
      doc.rect(45, y7, 505, 18).fillAndStroke(cRowAlt, cBorder);
      doc.fillColor(cNavy).fontSize(7.5).font('Helvetica-Bold')
        .text('TOTAL MANDATED PROJECT BUDGET (BDT 100.00 CRORE CAP)', 50, y7 + 4.5, { width: 335 });
      doc.text('73.50', 395, y7 + 4.5, { width: bCols[2], align: 'right' });
      doc.text('26.50', 445, y7 + 4.5, { width: bCols[3], align: 'right' });
      doc.fillColor(cGreenDark).text('100.00', 500, y7 + 4.5, { width: bCols[4] - 8, align: 'right' });
      y7 += 28;

      // 6.2 Economic Justification & Expected Socio-Economic Value
      doc.fillColor(cGreenDark).fontSize(9).font('Helvetica-Bold')
        .text('6.2 Economic Justification & Expected Socio-Economic Value', 45, y7);
      y7 += 12;
      doc.fillColor(cNavy).fontSize(7.2).font('Helvetica')
        .text('Implementation of GreenSignal AI generates strong projected economic returns (estimated at an 11.4 to 1 benefit-cost ratio) across long-term operations:', 45, y7, { width: 505, lineGap: 1.8 });
      y7 = doc.y + 6;

      const econBullets = [
        ['Agricultural Loss Reduction: ', 'Sealed storage silos protect food grains, crops, and seeds from moisture damage and flooding.'],
        ['Relief Distribution Efficiency: ', 'Biometric NID tracking minimizes duplicate distribution and administrative overheads, ensuring aid reaches intended households.'],
        ['Health Security Support: ', 'Clean drinking water generation and temperature-controlled medical storage help control waterborne diseases following severe floods.'],
        ['Life Safety Enhancements: ', 'Timely warnings provided hours in advance help save lives and protect vulnerable livestock during sudden flood events.']
      ];

      econBullets.forEach(([eT, eD]) => {
        doc.fillColor(cNavy).fontSize(7.2).font('Helvetica-Bold').text('•  ' + eT, 52, y7, { continued: true });
        doc.font('Helvetica').text(eD, { width: 495, lineGap: 1.2 });
        y7 = doc.y + 3;
      });

      // =========================================================================
      // PAGE 8 (Header: Page 7 of 8): IMPLEMENTATION HORIZON & ROADMAP
      // =========================================================================
      doc.addPage();
      let y8 = drawSectionHeader('SECTION 7.0: IMPLEMENTATION HORIZON, RISKS & SIGN-OFF', 50);

      doc.fillColor(cNavy).fontSize(7.2).font('Helvetica')
        .text('Complete physical deployment of sensor stations and regional facilities will continue across multi-year development cycles. However, the primary GreenSignal AI digital platform is designed to launch and connect with existing national meteorological streams within 1 to 2 months.', 45, y8, { width: 505, align: 'justify', lineGap: 1.8 });
      y8 = doc.y + 14;

      // 7.1 Phased Implementation Roadmap
      doc.fillColor(cGreenDark).fontSize(9.5).font('Helvetica-Bold')
        .text('7.1 Phased Implementation Roadmap', 45, y8);
      y8 += 14;

      const pRoadmap = [
        [
          'Phase 1 (Months 01–02): Rapid Core Software Launch & Data Integration',
          'Core platform deployment takes place on Tier-IV cloud infrastructure. System connections ingest live API data from BMD radar and FFWC river networks. Key Upazila operational hubs initialize with Starlink backup to ensure 99% uptime, while field teams receive mobile application access.'
        ],
        [
          'Phase 2 (Medium-Term Horizon): Regional Command & Warehouse Expansion',
          'Upazila operational hubs will expand while construction begins on flood-resistant Union buffer warehouses and storage silos. Deployment teams will install specialized radar and rainfall sensors while expanding volunteer onboarding programs.'
        ],
        [
          'Phase 3 (Multi-Decade Horizon): Delta Network Saturation & Joint Defense Work',
          'Long-term expansion will expand sensor density across river networks and coastal levees. Refinement of predictive hydrological models will continue alongside joint operational drills involving the Cyclone Preparedness Programme and the Armed Forces Division.'
        ]
      ];

      pRoadmap.forEach(([pT, pD]) => {
        doc.roundedRect(45, y8, 505, 54, 4).fillAndStroke(cCardBg, cBorder);
        doc.rect(45, y8, 3.5, 54).fill(cGreenDark);
        doc.fillColor(cGreenDark).fontSize(8).font('Helvetica-Bold').text(pT, 56, y8 + 7);
        doc.fillColor(cNavy).fontSize(7.2).font('Helvetica').text(pD, 56, y8 + 20, { width: 485, lineGap: 1.5, align: 'justify' });
        y8 += 62;
      });

      // =========================================================================
      // PAGE 9 (Header: Page 8 of 8): RISKS, MINISTERIAL ENDORSEMENT & SIGN-OFF
      // =========================================================================
      doc.addPage();
      let y9 = 50;

      // 7.2 Strategic Risk Management Matrix
      doc.fillColor(cGreenDark).fontSize(9.5).font('Helvetica-Bold')
        .text('7.2 Strategic Risk Management Matrix', 45, y9);
      y9 += 13;

      const rCols = [120, 75, 310];
      doc.rect(45, y9, 505, 16).fill(cDarkGreen);
      doc.fillColor('#ffffff').fontSize(7.2).font('Helvetica-Bold')
        .text('Risk Category', 50, y9 + 4.5, { width: rCols[0] })
        .text('Impact Level', 175, y9 + 4.5, { width: rCols[1] })
        .text('Mitigation Plan & Structural Safeguards', 255, y9 + 4.5, { width: rCols[2] });
      y9 += 16;

      const rRows = [
        ['Field Sensor Security', 'Medium', 'Vibration tamper switch alarms, GPS tracking, and community oversight agreements with local Union Parishads.'],
        ['Network Infrastructure Loss', 'High', 'Starlink terminals installed at command centers ensure 99% uptime, supported by autonomous local LoRa mesh networks.'],
        ['Technical User Adoption', 'Medium', 'Icon-focused mobile application interface, Bengali language options, voice reporting features, and regular field training drills.']
      ];

      rRows.forEach((rr, idx) => {
        const bg = idx % 2 === 0 ? cRowAlt : '#ffffff';
        doc.rect(45, y9, 505, 22).fillAndStroke(bg, cBorder);
        doc.fillColor(cNavy).fontSize(7).font('Helvetica-Bold').text(rr[0], 50, y9 + 5, { width: rCols[0] - 6 });
        doc.fillColor(rr[1] === 'High' ? '#dc2626' : '#d97706').fontSize(7).font('Helvetica-Bold').text(rr[1], 175, y9 + 5, { width: rCols[1] - 6 });
        doc.fillColor(cNavy).fontSize(6.8).font('Helvetica').text(rr[2], 255, y9 + 5, { width: rCols[2] - 6 });
        y9 += 22;
      });

      y9 += 18;

      // 7.3 Formal Ministerial Endorsement & Approval Sign-Off
      doc.fillColor(cGreenDark).fontSize(9.5).font('Helvetica-Bold')
        .text('7.3 Formal Ministerial Endorsement & Approval Sign-Off', 45, y9);
      y9 += 13;

      const soW = 158;
      const soH = 82;
      const soXs = [45, 218, 392];

      // Sign-off 1: Technical Consortium
      doc.roundedRect(soXs[0], y9, soW, soH, 4).fillAndStroke('#ffffff', cBorder);
      doc.fillColor(cGreenDark).fontSize(7.5).font('Helvetica-Bold')
        .text('TECHNICAL CONSORTIUM', soXs[0], y9 + 7, { width: soW, align: 'center' });
      doc.fillColor(cNavy).fontSize(6.8).font('Helvetica')
        .text('Prepared & Certified By:', soXs[0], y9 + 19, { width: soW, align: 'center' });
      doc.save().strokeColor(cBorder).lineWidth(0.5).dash(3, { space: 3 })
        .moveTo(soXs[0] + 15, y9 + 52).lineTo(soXs[0] + soW - 15, y9 + 52).stroke().restore();
      doc.fillColor(cNavy).fontSize(7.2).font('Helvetica-Bold')
        .text('Lead Systems Architect', soXs[0], y9 + 56, { width: soW, align: 'center' });
      doc.fillColor(cMuted).fontSize(6.5).font('Helvetica')
        .text('GreenSignal AI Delivery Group', soXs[0], y9 + 67, { width: soW, align: 'center' });

      // Sign-off 2: DDM
      doc.roundedRect(soXs[1], y9, soW, soH, 4).fillAndStroke('#ffffff', cBorder);
      doc.fillColor(cGreenDark).fontSize(7.5).font('Helvetica-Bold')
        .text('DEPARTMENT OF DISASTER MGMT', soXs[1], y9 + 7, { width: soW, align: 'center' });
      doc.fillColor(cNavy).fontSize(6.8).font('Helvetica')
        .text('Reviewed & Recommended By:', soXs[1], y9 + 19, { width: soW, align: 'center' });
      doc.save().strokeColor(cBorder).lineWidth(0.5).dash(3, { space: 3 })
        .moveTo(soXs[1] + 15, y9 + 52).lineTo(soXs[1] + soW - 15, y9 + 52).stroke().restore();
      doc.fillColor(cNavy).fontSize(7.2).font('Helvetica-Bold')
        .text('Director General', soXs[1], y9 + 56, { width: soW, align: 'center' });
      doc.fillColor(cMuted).fontSize(6.5).font('Helvetica')
        .text('Department of Disaster Management', soXs[1], y9 + 67, { width: soW, align: 'center' });

      // Sign-off 3: MoDMR
      doc.roundedRect(soXs[2], y9, soW, soH, 4).fillAndStroke('#ffffff', cBorder);
      doc.fillColor(cGreenDark).fontSize(7.5).font('Helvetica-Bold')
        .text('MINISTRY OF DISASTER RELIEF', soXs[2], y9 + 7, { width: soW, align: 'center' });
      doc.fillColor(cNavy).fontSize(6.8).font('Helvetica')
        .text('Approved for Allocation:', soXs[2], y9 + 19, { width: soW, align: 'center' });
      doc.save().strokeColor(cBorder).lineWidth(0.5).dash(3, { space: 3 })
        .moveTo(soXs[2] + 15, y9 + 52).lineTo(soXs[2] + soW - 15, y9 + 52).stroke().restore();
      doc.fillColor(cNavy).fontSize(7.2).font('Helvetica-Bold')
        .text('Secretary / Hon\'ble Minister', soXs[2], y9 + 56, { width: soW, align: 'center' });
      doc.fillColor(cMuted).fontSize(6.5).font('Helvetica')
        .text('Ministry of Disaster Management & Relief', soXs[2], y9 + 67, { width: soW, align: 'center' });

      y9 += soH + 18;

      // Statutory & Sovereign Verification Block
      doc.roundedRect(45, y9, 505, 52, 4).fillAndStroke(cCardBg, cBorder);
      doc.rect(45, y9, 3.5, 52).fill(cDarkGreen);
      doc.fillColor(cGreenDark).fontSize(7.5).font('Helvetica-Bold')
        .text('Statutory Compliance & National Data Sovereignty Assurance', 56, y9 + 6);
      doc.fillColor(cNavy).fontSize(6.8).font('Helvetica')
        .text(
          'This turnkey project proposal has been evaluated in full accordance with the National Disaster Management Act, the Public Procurement Act (PPA-2006), and the Bangladesh Cyber Security Act. All cryptographic keys, database ledgers, telemetry logs, and biometric NID verification tokens remain strictly housed within sovereign Tier-IV data centers located within the national territory of the People\'s Republic of Bangladesh. System failover architecture mandates 99% uptime via dedicated LEO Starlink satellite uplinks for tactical disaster response.',
          56, y9 + 18, { width: 485, lineGap: 1.8, align: 'justify' }
        );

      // Bottom Stamp Note
      const stampY = y9 + 62;
      doc.fillColor(cLightMuted).fontSize(7).font('Helvetica')
        .text('Official Ministry Seal & Registration Stamp • MoDMR Government of Bangladesh • Final Release', 45, stampY, { width: 505, align: 'center' });

      // =========================================================================
      // RUNNING HEADERS: Page 2 to 9 have:
      // "Official Technical Proposal | MoDMR | BDT 100.00 Crore" & "Page X of 8"
      // =========================================================================
      const range = doc.bufferedPageRange();
      for (let i = 1; i < range.count; i++) {
        doc.switchToPage(i);
        const subPageNum = i; // Page 2 is "Page 1 of 8", ..., Page 9 is "Page 8 of 8"
        
        doc.save();
        doc.strokeColor(cBorder).lineWidth(0.5).moveTo(45, 42).lineTo(550, 42).stroke();
        doc.fontSize(7.5).font('Helvetica').fillColor(cLightMuted)
          .text('Official Technical Proposal | MoDMR | BDT 100.00 Crore', 45, 30, { lineBreak: false });
        doc.fontSize(7.5).font('Helvetica').fillColor(cLightMuted)
          .text(`Page ${subPageNum} of 8`, 450, 30, { width: 100, align: 'right', lineBreak: false });
        doc.restore();
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// If run directly via node/tsx
if (require.main === module) {
  const target1 = path.join(process.cwd(), 'src', 'GreenSignal_AI_Project_Proposal.pdf');
  const target2 = path.join(process.cwd(), 'public', 'GreenSignal_AI_Project_Proposal.pdf');
  createExactProposalPdf([target1, target2])
    .then(() => console.log('Successfully generated exact proposal PDF!'))
    .catch(console.error);
}
