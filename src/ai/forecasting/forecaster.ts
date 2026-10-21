import { Product, StockMovement } from '@/domain/types';
import { roundDecimal } from '@/domain/units';
import { DailyForecastPoint, ProductDemandForecast } from '../types';

interface DailySaleBucket {
  dateKey: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 (Sun) to 6 (Sat)
  totalQuantity: number;
}

const DAY_NAMES_HI = ['रवि (Sun)', 'सोम (Mon)', 'मंगल (Tue)', 'बुध (Wed)', 'गुरु (Thu)', 'शुक्र (Fri)', 'शनि (Sat)'];
const DAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Formats epoch timestamp to YYYY-MM-DD date key in local time
 */
function toDateKey(timestamp: number): string {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Builds continuous daily time series between start timestamp and end timestamp.
 */
function buildDailyTimeSeries(
  sales: StockMovement[],
  startTimestamp: number,
  endTimestamp: number
): DailySaleBucket[] {
  // Aggregate sales by dateKey
  const salesMap = new Map<string, number>();
  for (const s of sales) {
    const key = toDateKey(s.timestamp);
    salesMap.set(key, (salesMap.get(key) || 0) + s.quantity);
  }

  const series: DailySaleBucket[] = [];
  const oneDayMs = 24 * 3600 * 1000;

  // Normalize start to midnight
  const cur = new Date(startTimestamp);
  cur.setHours(0, 0, 0, 0);

  const end = new Date(endTimestamp);
  end.setHours(23, 59, 59, 999);

  let currentMs = cur.getTime();
  while (currentMs <= end.getTime()) {
    const d = new Date(currentMs);
    const key = toDateKey(currentMs);
    series.push({
      dateKey: key,
      dayOfWeek: d.getDay(),
      totalQuantity: salesMap.get(key) || 0,
    });
    currentMs += oneDayMs;
  }

  return series;
}

/**
 * Chronologically evaluates a Day-of-Week + EMA baseline model on a held-out test window.
 * Strictly guarantees NO future data leakage into the training phase.
 */
export function evaluateChronologicalForecast(
  daySeries: DailySaleBucket[]
): {
  mae: number;
  wape: number;
  dowMultipliers: number[];
  overallMean: number;
  testSize: number;
} {
  const n = daySeries.length;
  // Use last 3 days as held-out test partition, prior days for training
  const testSize = Math.min(3, Math.floor(n * 0.3));
  const trainSize = n - testSize;

  const trainSeries = daySeries.slice(0, trainSize);
  const testSeries = daySeries.slice(trainSize);

  // 1. Compute overall train mean
  const trainTotal = trainSeries.reduce((acc, d) => acc + d.totalQuantity, 0);
  const overallMean = trainSize > 0 ? trainTotal / trainSize : 0;

  // 2. Day-of-Week Seasonality Multipliers on training data
  const dowSums = new Array(7).fill(0);
  const dowCounts = new Array(7).fill(0);

  for (const day of trainSeries) {
    dowSums[day.dayOfWeek] += day.totalQuantity;
    dowCounts[day.dayOfWeek] += 1;
  }

  const dowMultipliers = new Array(7).fill(1.0);
  for (let dow = 0; dow < 7; dow++) {
    if (dowCounts[dow] > 0 && overallMean > 0) {
      const avgForDow = dowSums[dow] / dowCounts[dow];
      dowMultipliers[dow] = avgForDow / overallMean;
    } else {
      dowMultipliers[dow] = 1.0;
    }
  }

  // 3. Compute EMA on training data (alpha = 0.3)
  const alpha = 0.3;
  let ema = overallMean;
  for (const day of trainSeries) {
    ema = alpha * day.totalQuantity + (1 - alpha) * ema;
  }

  // 4. Chronological Out-of-Sample Predictions on held-out test window
  let sumAbsError = 0;
  let sumActual = 0;

  for (const testDay of testSeries) {
    const dowMultiplier = dowMultipliers[testDay.dayOfWeek] || 1.0;
    const predicted = Math.max(0, ema * dowMultiplier);
    const actual = testDay.totalQuantity;

    sumAbsError += Math.abs(actual - predicted);
    sumActual += actual;
  }

  const mae = testSize > 0 ? roundDecimal(sumAbsError / testSize, 2) : 0;
  const wape = sumActual > 0 ? roundDecimal(sumAbsError / sumActual, 2) : (sumAbsError === 0 ? 0 : 1.0);

  return {
    mae,
    wape,

    
    dowMultipliers,
    overallMean,
    testSize,
  };
}

/**
 * Generates an explainable 7-day demand forecast for a single product.
 * Strictly isolates units and guarantees honest insufficient-data handling.
 */
export function generateProductForecast(
  product: Product,
  allMovements: StockMovement[],
  nowTimestamp: number = Date.now(),
  language: 'hi' | 'en' = 'hi'
): ProductDemandForecast {
  // 1. Filter movements strictly for this product and movement type === 'sale'
  const sales = allMovements
    .filter((m) => m.productId === product.id && m.type === 'sale')
    .sort((a, b) => a.timestamp - b.timestamp);

  const totalSaleEvents = sales.length;

  // 2. Insufficient data guards:
  // Requires at least 3 sale events and at least 7 days of historical date span
  if (totalSaleEvents < 3) {
    return {
      productId: product.id,
      productName: language === 'hi' ? product.nameHi || product.name : product.name,
      unit: product.unit,
      status: 'insufficient_data',
      modelIdentifier: 'insufficient_history',
      reason: language === 'hi'
        ? `बिक्री का इतिहास बहुत कम है (${totalSaleEvents} बिक्री मिली, कम से कम 3 आवश्यक हैं)`
        : `Sparse sales history (${totalSaleEvents} sales found; at least 3 required)`,
      historicalDaysAnalyzed: 0,
      averageDailySales: 0,
      sevenDayForecast: [],
      totalForecastedDemand: 0,
      currentStock: product.stockQty,
      suggestedReorderQty: 0,
    };
  }

  const firstTimestamp = sales[0].timestamp;
  const lastTimestamp = sales[sales.length - 1].timestamp;
  const spanDays = (lastTimestamp - firstTimestamp) / (24 * 3600 * 1000);

  if (spanDays < 6.0) {
    return {
      productId: product.id,
      productName: language === 'hi' ? product.nameHi || product.name : product.name,
      unit: product.unit,
      status: 'insufficient_data',
      modelIdentifier: 'insufficient_history',
      reason: language === 'hi'
        ? `समय सीमा अपर्याप्त है (${Math.round(spanDays)} दिन का डेटा मिला, कम से कम 7 दिन आवश्यक हैं)`
        : `History window too short (${Math.round(spanDays)} days of data; at least 7 days required)`,
      historicalDaysAnalyzed: Math.round(spanDays),
      averageDailySales: 0,
      sevenDayForecast: [],
      totalForecastedDemand: 0,
      currentStock: product.stockQty,
      suggestedReorderQty: 0,
    };
  }

  // 3. Build chronological daily time series
  const daySeries = buildDailyTimeSeries(sales, firstTimestamp, nowTimestamp);
  const totalDays = daySeries.length;
  const totalQuantitySold = daySeries.reduce((acc, d) => acc + d.totalQuantity, 0);
  const averageDailySales = roundDecimal(totalQuantitySold / totalDays, 2);

  // 4. Chronological model training & evaluation
  const evalResult = evaluateChronologicalForecast(daySeries);

  // 5. Compute forward 7-day forecast
  const sevenDayForecast: DailyForecastPoint[] = [];
  const oneDayMs = 24 * 3600 * 1000;

  // Exponential moving average over full series up to now
  const alpha = 0.3;
  let currentEma = evalResult.overallMean;
  for (const day of daySeries) {
    currentEma = alpha * day.totalQuantity + (1 - alpha) * currentEma;
  }

  let totalForecastDemand = 0;

  for (let offset = 1; offset <= 7; offset++) {
    const futureDate = new Date(nowTimestamp + offset * oneDayMs);
    const futureDow = futureDate.getDay();
    const dowMultiplier = evalResult.dowMultipliers[futureDow] || 1.0;

    const rawPred = Math.max(0, currentEma * dowMultiplier);
    const predictedQty = roundDecimal(rawPred, 1);

    const dayName = language === 'hi' ? DAY_NAMES_HI[futureDow] : DAY_NAMES_EN[futureDow];
    const dateStr = toDateKey(futureDate.getTime());

    sevenDayForecast.push({
      dayOffset: offset,
      dayName,
      dateString: dateStr,
      predictedQuantity: predictedQty,
    });

    totalForecastDemand += predictedQty;
  }

  const totalDemandRounded = roundDecimal(totalForecastDemand, 1);
  const suggestedReorder = roundDecimal(Math.max(0, totalDemandRounded - product.stockQty), 1);

  return {
    productId: product.id,
    productName: language === 'hi' ? product.nameHi || product.name : product.name,
    unit: product.unit,
    status: 'sufficient_data',
    modelIdentifier: 'chronological_ema_dow_v1',
    historicalDaysAnalyzed: totalDays,
    averageDailySales,
    sevenDayForecast,
    totalForecastedDemand: totalDemandRounded,
    currentStock: product.stockQty,
    suggestedReorderQty: suggestedReorder,
    mae: evalResult.mae,
    wape: evalResult.wape,
  };
}
