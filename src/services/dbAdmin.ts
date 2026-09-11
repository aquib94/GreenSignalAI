import { prisma } from '../lib/prisma';

export class DbAdminService {
  /**
   * Helper to get all available Prisma models dynamically
   */
  private static getAvailableModels(): string[] {
    const models = (prisma as any)._baseDmmf?.modelMap || (prisma as any)._dmmf?.modelMap;
    if (models) {
      return Object.keys(models);
    }
    
    return Object.keys(prisma).filter(key => {
      return !key.startsWith('_') && !key.startsWith('$') && 
             typeof (prisma as any)[key]?.findMany === 'function';
    });
  }

  /**
   * Safely map a requested table name to a Prisma model
   */
  private static getPrismaModelName(requestedName: string): string | null {
    const models = this.getAvailableModels();
    
    if (models.includes(requestedName)) return requestedName;
    
    const lowerReq = requestedName.toLowerCase().replace(/_/g, '');
    for (const model of models) {
      if (model.toLowerCase() === lowerReq) return model;
      if (model.toLowerCase() + 's' === lowerReq) return model;
    }
    
    return null;
  }

  static async getTableStats(): Promise<Record<string, number>> {
    const models = this.getAvailableModels();
    const stats: Record<string, number> = {};
    
    await Promise.all(
      models.map(async (model) => {
        try {
          stats[model] = await (prisma as any)[model].count();
        } catch (e) {
          stats[model] = 0;
        }
      })
    );
    
    return stats;
  }

  static async getTableData(tableName: string, limit: number = 100) {
    const modelName = this.getPrismaModelName(tableName);
    if (!modelName || !(prisma as any)[modelName]) {
       throw new Error(`Table '${tableName}' not found in schema`);
    }

    return await (prisma as any)[modelName].findMany({
      take: limit
    });
  }

  static async createRecord(tableName: string, data: any) {
    const modelName = this.getPrismaModelName(tableName);
    if (!modelName || !(prisma as any)[modelName]) {
       throw new Error(`Table '${tableName}' not found in schema`);
    }
    
    return await (prisma as any)[modelName].create({ data });
  }

  static async updateRecord(tableName: string, id: string, data: any) {
    const modelName = this.getPrismaModelName(tableName);
    if (!modelName || !(prisma as any)[modelName]) {
       throw new Error(`Table '${tableName}' not found in schema`);
    }
    
    try {
        return await (prisma as any)[modelName].update({
            where: { id: id },
            data: data
        });
    } catch (e: any) {
        if (!isNaN(Number(id))) {
            return await (prisma as any)[modelName].update({
                where: { id: Number(id) },
                data: data
            });
        }
        throw e;
    }
  }

  static async deleteRecord(tableName: string, id: string) {
    const modelName = this.getPrismaModelName(tableName);
    if (!modelName || !(prisma as any)[modelName]) {
       throw new Error(`Table '${tableName}' not found in schema`);
    }
    
    try {
        await (prisma as any)[modelName].delete({
            where: { id: id }
        });
    } catch (e: any) {
        if (!isNaN(Number(id))) {
            await (prisma as any)[modelName].delete({
                where: { id: Number(id) }
            });
        } else {
            throw e;
        }
    }
    return { success: true };
  }

  static async executeQuery(query: string) {
    const isSelect = query.trim().toUpperCase().startsWith('SELECT');
    if (isSelect) {
        return await prisma.$queryRawUnsafe(query);
    } else {
        const affectedRows = await prisma.$executeRawUnsafe(query);
        return { affectedRows };
    }
  }
}
