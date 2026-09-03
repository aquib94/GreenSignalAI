import { prisma } from '../lib/prisma';
import { AlertSeverity } from '@prisma/client';

export class AlertsService {
  /**
   * Get active broadcast alerts for a specific district or nationwide
   */
  static async getActiveAlerts(districtName?: string) {
    return await prisma.disasterAlert.findMany({
      where: {
        isActive: true,
        OR: [
          { district: 'NATIONWIDE' },
          ...(districtName ? [{ district: { equals: districtName, mode: 'insensitive' as const } }] : [])
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Create new broadcast alert
   */
  static async createAlert(title: string, description: string, district: string, severity: AlertSeverity) {
    return await prisma.disasterAlert.create({
      data: {
        title,
        description,
        district,
        severity,
        isActive: true
      }
    });
  }

  /**
   * Check sensor thresholds for an Upazila node and raise warnings if critical
   */
  static async evaluateSensorThresholds(upazilaNodeId: string) {
    const sensors = await prisma.sensorNode.findMany({
      where: { districtNodeId: upazilaNodeId }
    });

    const triggerAlerts = [];

    for (const sensor of sensors) {
      if (sensor.type === 'WATER') {
        const waterVal = parseFloat(sensor.metricValue.replace('m', ''));
        if (waterVal > 4.0) {
          triggerAlerts.push({
            title: `CRITICAL WATER LEVEL: ${sensor.sensorCode}`,
            description: `River height reached ${sensor.metricValue}. Potential flash flooding imminent!`,
            severity: AlertSeverity.CRITICAL
          });
        }
      } else if (sensor.type === 'WIND') {
        const windVal = parseFloat(sensor.metricValue.replace('km/h', ''));
        if (windVal > 60.0) {
          triggerAlerts.push({
            title: `HIGH WIND WARNING: ${sensor.sensorCode}`,
            description: `Wind speeds recorded at ${sensor.metricValue}. Secure outdoor stock immediately.`,
            severity: AlertSeverity.WARNING
          });
        }
      }
    }

    return triggerAlerts;
  }
}
