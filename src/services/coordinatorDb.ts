import { prisma } from '../lib/prisma';

export interface StockQuantityMap {
  beds: number;
  food_packs: number;
  medical_kits: number;
  vehicles: number;
  tents: number;
  [key: string]: number;
}

export interface BOQItem {
  itemName: string;
  unit: string;
  policyQty: number;
  currentQty: number;
  emergencyQty: number;
  restockingQty: number;
  estimatedUnitPriceBDT: number;
  totalRestockCostBDT: number;
}

export interface BOQReport {
  reliefCenterId: string;
  centerName: string;
  centerCode: string;
  generatedAt: string;
  items: BOQItem[];
  totalProjectedCostBDT: number;
}

export class CoordinatorDbService {
  /**
   * Fetch all relief centers and sensors within the coordinator's administrative scope
   */
  static async getCoordinatorScopeData(userNodeId: string) {
    const userNode = await prisma.administrativeNode.findUnique({
      where: { id: userNodeId },
      include: {
        children: {
          include: {
            children: true
          }
        }
      }
    });

    if (!userNode) throw new Error('Coordinator administrative node not found.');

    // Collect all child node IDs in scope
    const scopedNodeIds: string[] = [userNode.id];

    if (userNode.children) {
      for (const child of userNode.children) {
        scopedNodeIds.push(child.id);
        if (child.children) {
          for (const grandChild of child.children) {
            scopedNodeIds.push(grandChild.id);
          }
        }
      }
    }

    // Fetch relief centers and sensors for all nodes in scope
    const reliefCenters = await prisma.reliefCenter.findMany({
      where: { districtNodeId: { in: scopedNodeIds } },
      include: { districtNode: true }
    });

    const sensors = await prisma.sensorNode.findMany({
      where: { districtNodeId: { in: scopedNodeIds } },
      include: { districtNode: true }
    });

    const coordinatorContact = await prisma.user.findFirst({
      where: { districtNodeId: userNodeId, role: 'COORDINATOR' },
      select: { fullName: true, phone: true, username: true }
    });

    return {
      scopeNode: userNode,
      reliefCenters,
      sensors,
      coordinatorContact: coordinatorContact || { fullName: userNode.name + ' Officer', phone: '+8801700000000', username: 'Coordinator' }
    };
  }

  /**
   * Update relief center stock policy, current stock, and emergency requirements.
   * Automatically calculates restockingRequirement = stockPolicy - currentStock
   */
  static async updateReliefCenterStock(
    centerId: string,
    stockPolicy: StockQuantityMap,
    currentStock: StockQuantityMap,
    emergencyRequirement: StockQuantityMap
  ) {
    // Compute restocking requirement delta
    const restockingRequirement: StockQuantityMap = {
      beds: Math.max(0, (stockPolicy.beds || 0) - (currentStock.beds || 0)),
      food_packs: Math.max(0, (stockPolicy.food_packs || 0) - (currentStock.food_packs || 0)),
      medical_kits: Math.max(0, (stockPolicy.medical_kits || 0) - (currentStock.medical_kits || 0)),
      vehicles: Math.max(0, (stockPolicy.vehicles || 0) - (currentStock.vehicles || 0)),
      tents: Math.max(0, (stockPolicy.tents || 0) - (currentStock.tents || 0))
    };

    return await prisma.reliefCenter.update({
      where: { id: centerId },
      data: {
        stockPolicy: stockPolicy as any,
        currentStock: currentStock as any,
        emergencyRequirement: emergencyRequirement as any,
        restockingRequirement: restockingRequirement as any
      }
    });
  }

  /**
   * Generate Bill of Quantities (BOQ) for procurement & restocking
   */
  static async generateBOQ(centerId: string): Promise<BOQReport> {
    const center = await prisma.reliefCenter.findUnique({
      where: { id: centerId }
    });

    if (!center) throw new Error('Relief center not found');

    const policy = (center.stockPolicy as unknown as StockQuantityMap) || {};
    const current = (center.currentStock as unknown as StockQuantityMap) || {};
    const emergency = (center.emergencyRequirement as unknown as StockQuantityMap) || {};
    const restock = (center.restockingRequirement as unknown as StockQuantityMap) || {};

    const priceCatalog: Record<string, { unit: string; price: number }> = {
      beds: { unit: 'Units', price: 3500 },
      food_packs: { unit: 'Packs', price: 1200 },
      medical_kits: { unit: 'Kits', price: 4500 },
      vehicles: { unit: 'Rental/Day', price: 15000 },
      tents: { unit: 'Units', price: 8500 }
    };

    const items: BOQItem[] = Object.keys(priceCatalog).map(key => {
      const pQty = policy[key] || 0;
      const cQty = current[key] || 0;
      const eQty = emergency[key] || 0;
      const rQty = restock[key] || Math.max(0, pQty - cQty);
      const unitPrice = priceCatalog[key].price;

      return {
        itemName: key.replace('_', ' ').toUpperCase(),
        unit: priceCatalog[key].unit,
        policyQty: pQty,
        currentQty: cQty,
        emergencyQty: eQty,
        restockingQty: rQty,
        estimatedUnitPriceBDT: unitPrice,
        totalRestockCostBDT: rQty * unitPrice
      };
    });

    const totalProjectedCostBDT = items.reduce((sum, item) => sum + item.totalRestockCostBDT, 0);

    return {
      reliefCenterId: center.id,
      centerName: center.name,
      centerCode: center.centerCode,
      generatedAt: new Date().toISOString(),
      items,
      totalProjectedCostBDT
    };
  }
}