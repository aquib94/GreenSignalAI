export interface TimeSeriesPoint {
  timestamp: string;
  dateLabel: string;
  value: number;
  secondaryValue?: number;
  unit: string;
  pressureHpa?: number;
  windKmh?: number;
  tempC?: number;
  rainMm?: number;
  magnitude?: number;
  salinityPpt?: number;
}

export interface ForecastPoint {
  timestamp: string;
  dateLabel: string;
  predictedValue: number;
  confidenceLow: number;
  confidenceHigh: number;
  isForecast: boolean;
  riskTag: 'SAFE' | 'WATCH' | 'WARNING' | 'DANGER_SURPASS';
  probabilityPct?: number;
  secondaryPredicted?: number;
}

export interface SensorTimeSeriesPackage {
  metricValue: string;
  currentValue: number;
  unit: string;
  warningThreshold: number;
  dangerThreshold: number;
  timeSeries: TimeSeriesPoint[];
  forecastSeries: ForecastPoint[];
  analytics: Record<string, any>;
}

/**
 * Generates realistic chronological historical and predictive time series data for any sensor type in Bangladesh.
 */
export function generateSensorTimeSeries(
  type: 'WATER' | 'WIND' | 'SALINITY' | 'SEISMOGRAPH' | 'RAINFALL',
  districtName: string,
  upazilaName: string,
  divisionName?: string
): SensorTimeSeriesPackage {
  const now = new Date();
  const district = (districtName || '').toLowerCase();
  const upazila = (upazilaName || '').toLowerCase();
  const division = (divisionName || '').toLowerCase();

  // Regional hazard contextual multipliers
  const isSylhetFlashFloodZone = division.includes('sylhet') || district.includes('sunamganj') || district.includes('sylhet') || district.includes('netrokona') || district.includes('habiganj');
  const isCoastalCycloneZone = division.includes('chattogram') || division.includes('barishal') || district.includes('cox') || district.includes('barguna') || district.includes('patuakhali') || district.includes('bhola') || district.includes('khulna') || district.includes('bagerhat');
  const isSeismicFaultZone = division.includes('sylhet') || division.includes('chattogram') || district.includes('dhaka') || district.includes('bogura') || district.includes('mymensingh');
  const isNorthMonsoonRiverZone = division.includes('rangpur') || division.includes('rajshahi') || district.includes('kurigram') || district.includes('gaibandha') || district.includes('bogura') || district.includes('sirajganj');

  if (type === 'WATER') {
    // Water Level Radar Gauge (meters)
    const danger = isSylhetFlashFloodZone ? 6.8 : isNorthMonsoonRiverZone ? 6.2 : 5.5;
    const warning = danger - 0.8;
    const base = isSylhetFlashFloodZone ? 5.6 : isNorthMonsoonRiverZone ? 4.6 : 3.2;
    const riseRate = isSylhetFlashFloodZone ? 0.14 : isNorthMonsoonRiverZone ? 0.08 : 0.03; // m/hr

    const history: TimeSeriesPoint[] = [];
    // 8 points in past (every 3h for past 24h)
    for (let i = 8; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3 * 3600 * 1000);
      const val = Math.max(1.5, Number((base - (i * riseRate * 3) + (Math.sin(i * 0.8) * 0.08)).toFixed(2)));
      history.push({
        timestamp: d.toISOString(),
        dateLabel: formatDateLabel(d),
        value: val,
        unit: 'm'
      });
    }

    const currentVal = history[history.length - 1].value;
    const forecast: ForecastPoint[] = [];
    // 8 points in future (every 3h for +24h)
    let curPred = currentVal;
    for (let j = 1; j <= 8; j++) {
      const d = new Date(now.getTime() + j * 3 * 3600 * 1000);
      const stepRise = j <= 5 ? (riseRate * 3 * (1 - j * 0.08)) : -(riseRate * 1.5); // Crests around +15h
      curPred = Number((curPred + stepRise).toFixed(2));
      const spread = Number((0.15 + (j * 0.04)).toFixed(2));
      const confLow = Number(Math.max(1.0, curPred - spread).toFixed(2));
      const confHigh = Number((curPred + spread).toFixed(2));

      let riskTag: 'SAFE' | 'WATCH' | 'WARNING' | 'DANGER_SURPASS' = 'SAFE';
      if (curPred >= danger) riskTag = 'DANGER_SURPASS';
      else if (curPred >= warning) riskTag = 'WARNING';
      else if (curPred >= warning - 0.4) riskTag = 'WATCH';

      forecast.push({
        timestamp: d.toISOString(),
        dateLabel: formatDateLabel(d),
        predictedValue: curPred,
        confidenceLow: confLow,
        confidenceHigh: confHigh,
        isForecast: true,
        riskTag,
        probabilityPct: Math.min(96, Math.max(10, Math.round((curPred / danger) * 90)))
      });
    }

    const maxPred = Math.max(...forecast.map(f => f.predictedValue));
    const crestPoint = forecast.find(f => f.predictedValue === maxPred) || forecast[forecast.length - 1];
    const hoursToDanger = currentVal >= danger ? 0 : Number(((danger - currentVal) / (riseRate > 0 ? riseRate : 0.05)).toFixed(1));

    return {
      metricValue: `${currentVal} m`,
      currentValue: currentVal,
      unit: 'm',
      warningThreshold: warning,
      dangerThreshold: danger,
      timeSeries: history,
      forecastSeries: forecast,
      analytics: {
        rateOfRisePerHour: `+${(riseRate).toFixed(2)} m/hr`,
        hoursToDangerLevel: hoursToDanger <= 24 && hoursToDanger > 0 ? hoursToDanger : 'Safe (>24h)',
        projectedCrestM: maxPred,
        crestTime: crestPoint.dateLabel,
        floodRisk: currentVal >= danger ? 'CRITICAL_FLOODING' : maxPred >= danger ? 'DANGER_WATCH_SURGE' : maxPred >= warning ? 'MODERATE_WATCH' : 'NORMAL_FLOW',
        dangerLevelM: danger,
        warningLevelM: warning,
        riverBasin: isSylhetFlashFloodZone ? 'Surma-Kushiyara Basin' : isNorthMonsoonRiverZone ? 'Jamuna-Brahmaputra Basin' : 'Padma-Meghna Basin'
      }
    };
  }

  if (type === 'WIND') {
    // Wind Speed (km/h) & Barometric Pressure (hPa)
    const isStormActive = isCoastalCycloneZone;
    const baseWind = isStormActive ? 64 : 22; // km/h
    const basePressure = isStormActive ? 993.5 : 1011.0; // hPa
    const dangerWind = 75; // km/h
    const warningWind = 50;

    const history: TimeSeriesPoint[] = [];
    for (let i = 8; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3 * 3600 * 1000);
      const windVal = Math.max(10, Math.round(baseWind - (isStormActive ? i * 3.5 : 0) + (Math.sin(i) * 3)));
      const pressVal = Number((basePressure + (isStormActive ? i * 1.8 : 0) + (Math.cos(i) * 0.8)).toFixed(1));
      history.push({
        timestamp: d.toISOString(),
        dateLabel: formatDateLabel(d),
        value: windVal,
        pressureHpa: pressVal,
        unit: 'km/h'
      });
    }

    const currentWind = history[history.length - 1].value;
    const currentPressure = history[history.length - 1].pressureHpa!;

    const forecast: ForecastPoint[] = [];
    let curWindPred = currentWind;
    let curPressPred = currentPressure;
    for (let j = 1; j <= 8; j++) {
      const d = new Date(now.getTime() + j * 3 * 3600 * 1000);
      const deltaWind = isStormActive ? (j <= 4 ? 6 : -4) : (Math.sin(j) * 2);
      const deltaPress = isStormActive ? (j <= 4 ? -2.2 : 1.5) : (Math.cos(j) * 0.5);
      curWindPred = Math.max(12, Math.round(curWindPred + deltaWind));
      curPressPred = Number((curPressPred + deltaPress).toFixed(1));

      let riskTag: 'SAFE' | 'WATCH' | 'WARNING' | 'DANGER_SURPASS' = 'SAFE';
      if (curWindPred >= dangerWind || curPressPred <= 990) riskTag = 'DANGER_SURPASS';
      else if (curWindPred >= warningWind || curPressPred <= 1000) riskTag = 'WARNING';
      else if (curWindPred >= 38) riskTag = 'WATCH';

      const stormProb = isStormActive ? Math.min(94, Math.max(45, 60 + j * 4)) : Math.min(25, Math.max(5, 10 + j));

      forecast.push({
        timestamp: d.toISOString(),
        dateLabel: formatDateLabel(d),
        predictedValue: curWindPred,
        confidenceLow: Math.max(10, curWindPred - 8),
        confidenceHigh: curWindPred + 12,
        secondaryPredicted: curPressPred,
        isForecast: true,
        riskTag,
        probabilityPct: stormProb
      });
    }

    const stormChance = isStormActive ? 82 : 18;
    const maxGusts = Math.round(currentWind * 1.45);
    const pressDrop3h = Number((history[history.length - 1].pressureHpa! - history[Math.max(0, history.length - 2)].pressureHpa!).toFixed(1));

    return {
      metricValue: `${currentWind} km/h • ${currentPressure} hPa`,
      currentValue: currentWind,
      unit: 'km/h',
      warningThreshold: warningWind,
      dangerThreshold: dangerWind,
      timeSeries: history,
      forecastSeries: forecast,
      analytics: {
        currentPressureHpa: currentPressure,
        pressureDrop3hHpa: pressDrop3h,
        stormProbabilityPct: stormChance,
        cycloneCategoryPredicted: isStormActive ? 'Severe Cyclonic Storm (Cat 2-3 Risk)' : 'Standard Atmospheric Gradient',
        maxGustsPredictedKmh: maxGusts,
        stormSurgeExpectedM: isStormActive ? (currentWind > 65 ? 2.6 : 1.8) : 0.4,
        barometerStatus: currentPressure < 1000 ? 'RAPID_FALL_CYCLONIC' : 'STEADY_FAIR'
      }
    };
  }

  if (type === 'SEISMOGRAPH') {
    // Seismograph Magnitude (Richter Scale M) & Foreshock / Mainshock Probability (Omori Model)
    const hasRecentForeshock = isSeismicFaultZone;
    const foreshockMag = hasRecentForeshock ? 3.9 : 1.4;
    const danger = 5.0; // M 5.0+ Structural damage threshold
    const warning = 3.5;

    const history: TimeSeriesPoint[] = [];
    for (let i = 8; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3 * 3600 * 1000);
      let magVal = 1.1 + Math.random() * 0.4;
      if (hasRecentForeshock && i === 2) {
        magVal = foreshockMag; // Foreshock spike ~6h ago
      } else if (hasRecentForeshock && i < 2) {
        magVal = 2.1 + (i === 1 ? 0.6 : 0.2); // micro-aftershocks
      }
      magVal = Number(magVal.toFixed(1));
      history.push({
        timestamp: d.toISOString(),
        dateLabel: formatDateLabel(d),
        value: magVal,
        unit: 'M'
      });
    }

    const currentVal = history[history.length - 1].value;
    const forecast: ForecastPoint[] = [];
    // Omori foreshock probability curve
    for (let j = 1; j <= 8; j++) {
      const d = new Date(now.getTime() + j * 3 * 3600 * 1000);
      // Omori decay rate P(M >= M0) = a - b*log(t)
      const probBiggerQuake = hasRecentForeshock ? Math.max(8, Math.round(48 * Math.exp(-0.12 * j))) : Math.max(2, Math.round(5 * Math.exp(-0.1 * j)));
      const expectedMag = Number((1.5 + (hasRecentForeshock ? 1.8 * Math.exp(-0.15 * j) : 0.2)).toFixed(1));

      let riskTag: 'SAFE' | 'WATCH' | 'WARNING' | 'DANGER_SURPASS' = 'SAFE';
      if (probBiggerQuake >= 40) riskTag = 'WARNING';
      else if (probBiggerQuake >= 20) riskTag = 'WATCH';

      forecast.push({
        timestamp: d.toISOString(),
        dateLabel: formatDateLabel(d),
        predictedValue: expectedMag,
        confidenceLow: 1.0,
        confidenceHigh: hasRecentForeshock ? 5.2 : 2.5,
        isForecast: true,
        riskTag,
        probabilityPct: probBiggerQuake
      });
    }

    const probBigger = hasRecentForeshock ? 44 : 6;
    const faultName = division.includes('sylhet') ? 'Dauki Fault Line (Shillong Plateau)'
      : division.includes('chattogram') ? 'Indo-Burma Megathrust Subduction Zone'
      : district.includes('dhaka') || district.includes('bogura') ? 'Madhupur Blind Thrust'
      : 'Bengal Basin Intraplate Matrix';

    return {
      metricValue: hasRecentForeshock ? `${foreshockMag} M (Foreshock)` : `${currentVal} M`,
      currentValue: currentVal,
      unit: 'Richter M',
      warningThreshold: warning,
      dangerThreshold: danger,
      timeSeries: history,
      forecastSeries: forecast,
      analytics: {
        foreshockDetected: hasRecentForeshock,
        foreshockMagnitude: foreshockMag,
        foreshockRecordedAt: '6 hours ago',
        probabilityBiggerEarthquakePct: probBigger,
        aftershockCountPredicted: hasRecentForeshock ? 16 : 1,
        faultZone: faultName,
        focalDepthKm: hasRecentForeshock ? 14.5 : 22.0,
        seismicHazardStatus: probBigger > 30 ? 'ELEVATED_FORESHOCK_ALERT' : 'STABLE_TECTONIC_BASELINE',
        structuralPrecautionAdvice: probBigger > 30 ? 'Evacuate unreinforced masonry shelters; initiate rapid structural integrity inspect.' : 'Normal operational baseline.'
      }
    };
  }

  if (type === 'RAINFALL') {
    // Rainfall Precipitation (mm) & Temperature (°C)
    const isHeavyMonsoon = isSylhetFlashFloodZone || isCoastalCycloneZone;
    const baseRain24h = isHeavyMonsoon ? 112 : 28; // mm
    const baseTemp = 29.5; // °C
    const dangerRain = 100.0; // mm/24h heavy downpour threshold
    const warningRain = 50.0;

    const history: TimeSeriesPoint[] = [];
    for (let i = 8; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3 * 3600 * 1000);
      const rainInc = isHeavyMonsoon ? Math.round(8 + Math.sin(i) * 6 + Math.random() * 5) : Math.round(2 + Math.random() * 3);
      const tempVal = Number((baseTemp + Math.sin(i * 0.7) * 2.5).toFixed(1));
      history.push({
        timestamp: d.toISOString(),
        dateLabel: formatDateLabel(d),
        value: rainInc,
        rainMm: rainInc,
        tempC: tempVal,
        unit: 'mm/3h'
      });
    }

    const forecast: ForecastPoint[] = [];
    for (let j = 1; j <= 8; j++) {
      const d = new Date(now.getTime() + j * 3 * 3600 * 1000);
      const predRain = isHeavyMonsoon ? Math.round(14 + Math.cos(j * 0.6) * 8) : Math.round(3 + Math.random() * 2);
      const predTemp = Number((baseTemp + Math.sin(j * 0.7) * 2.2).toFixed(1));
      const downpourProb = isHeavyMonsoon ? Math.min(96, 75 + j * 2) : Math.min(35, 15 + j);

      let riskTag: 'SAFE' | 'WATCH' | 'WARNING' | 'DANGER_SURPASS' = 'SAFE';
      if (predRain >= 18) riskTag = 'DANGER_SURPASS';
      else if (predRain >= 10) riskTag = 'WARNING';
      else if (predRain >= 5) riskTag = 'WATCH';

      forecast.push({
        timestamp: d.toISOString(),
        dateLabel: formatDateLabel(d),
        predictedValue: predRain,
        confidenceLow: Math.max(0, predRain - 5),
        confidenceHigh: predRain + 8,
        secondaryPredicted: predTemp,
        isForecast: true,
        riskTag,
        probabilityPct: downpourProb
      });
    }

    const totalPast24hRain = history.reduce((acc, h) => acc + (h.rainMm || 0), 0);
    const totalForecast24hRain = forecast.reduce((acc, f) => acc + f.predictedValue, 0);
    const currentTemp = history[history.length - 1].tempC || 29.5;

    return {
      metricValue: `${totalPast24hRain}mm • ${currentTemp}°C`,
      currentValue: totalPast24hRain,
      unit: 'mm/24h',
      warningThreshold: warningRain,
      dangerThreshold: dangerRain,
      timeSeries: history,
      forecastSeries: forecast,
      analytics: {
        past24hRainMm: totalPast24hRain,
        forecast24hRainMm: totalForecast24hRain,
        downpourProbabilityPct: isHeavyMonsoon ? 89 : 22,
        heavyRainfallWarning: totalForecast24hRain >= 80,
        tempCurrentC: currentTemp,
        tempMaxC: Number((currentTemp + 4.2).toFixed(1)),
        heatIndexC: Number((currentTemp + 7.8).toFixed(1)),
        flashFloodRiskIndex: isHeavyMonsoon ? 'VERY_HIGH' : 'LOW_MODERATE'
      }
    };
  }

  // SALINITY Default
  const isCoastal = isCoastalCycloneZone;
  const baseSalinity = isCoastal ? 6.8 : 1.2; // ppt
  const dangerSalinity = 5.0; // ppt
  const warningSalinity = 3.0;

  const history: TimeSeriesPoint[] = [];
  for (let i = 8; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 3 * 3600 * 1000);
    const salVal = Number((baseSalinity + (isCoastal ? Math.sin(i * 0.9) * 1.2 : Math.sin(i) * 0.2)).toFixed(2));
    history.push({
      timestamp: d.toISOString(),
      dateLabel: formatDateLabel(d),
      value: salVal,
      unit: 'ppt'
    });
  }

  const currentSalinity = history[history.length - 1].value;
  const forecast: ForecastPoint[] = [];
  for (let j = 1; j <= 8; j++) {
    const d = new Date(now.getTime() + j * 3 * 3600 * 1000);
    const predSal = Number((currentSalinity + (isCoastal ? (j * 0.25) : 0.05)).toFixed(2));
    let riskTag: 'SAFE' | 'WATCH' | 'WARNING' | 'DANGER_SURPASS' = 'SAFE';
    if (predSal >= dangerSalinity) riskTag = 'DANGER_SURPASS';
    else if (predSal >= warningSalinity) riskTag = 'WARNING';
    else if (predSal >= 2.0) riskTag = 'WATCH';

    forecast.push({
      timestamp: d.toISOString(),
      dateLabel: formatDateLabel(d),
      predictedValue: predSal,
      confidenceLow: Number(Math.max(0.5, predSal - 0.4).toFixed(2)),
      confidenceHigh: Number((predSal + 0.6).toFixed(2)),
      isForecast: true,
      riskTag,
      probabilityPct: isCoastal ? 76 : 12
    });
  }

  return {
    metricValue: `${currentSalinity} ppt`,
    currentValue: currentSalinity,
    unit: 'ppt',
    warningThreshold: warningSalinity,
    dangerThreshold: dangerSalinity,
    timeSeries: history,
    forecastSeries: forecast,
    analytics: {
      salinityIntrusionLevel: isCoastal ? 'ELEVATED_ESTUARINE_INTRUSION' : 'SAFE_FRESHWATER',
      drinkingWaterViability: currentSalinity < 1.0 ? 'POTABLE_SAFE' : currentSalinity < 3.0 ? 'TREATMENT_REQUIRED' : 'BRACKISH_UNFIT',
      irrigationSafety: currentSalinity < 2.0 ? 'SAFE_FOR_CROPS' : 'SOIL_SALINIZATION_RISK'
    }
  };
}

function formatDateLabel(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}
