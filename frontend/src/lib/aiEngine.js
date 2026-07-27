/**
 * RaithuPalu Self-Contained AI & Statistical Insights Engine
 * Provides production-grade business forecasts, churn predictions, and anomaly detection
 * using actual historical dairy data from the database.
 */

/**
 * 1. Demand & Production Forecasting (Linear Regression / Trend Analysis)
 * Forecasts the next 7 days of milk production based on historical daily entries.
 */
export function forecastNextWeek(milkEntries) {
  if (!milkEntries || milkEntries.length < 3) {
    return {
      forecast: [],
      trend: 'stable',
      confidence: 'low',
      avgDailyQty: 0
    };
  }

  // Aggregate milk by date (YYYY-MM-DD)
  const dailyTotals = {};
  milkEntries.forEach(entry => {
    if (!entry.date) return;
    const dateStr = new Date(entry.date).toISOString().split('T')[0];
    dailyTotals[dateStr] = (dailyTotals[dateStr] || 0) + (Number(entry.quantity) || 0);
  });

  const dates = Object.keys(dailyTotals).sort();
  const quantities = dates.map(d => dailyTotals[d]);

  if (dates.length < 2) {
    return {
      forecast: [],
      trend: 'stable',
      confidence: 'low',
      avgDailyQty: quantities[0] || 0
    };
  }

  // Simple Linear Regression: y = mx + c
  // x: day index, y: milk quantity
  const n = quantities.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += quantities[i];
    sumXY += i * quantities[i];
    sumXX += i * i;
  }

  const denominator = (n * sumXX - sumX * sumX);
  const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
  const intercept = (sumY - slope * sumX) / n;

  // Generate 7-day forecast
  const forecast = [];
  const lastDateObj = new Date(dates[dates.length - 1]);
  const avgDailyQty = sumY / n;

  for (let i = 1; i <= 7; i++) {
    const nextDate = new Date(lastDateObj);
    nextDate.setDate(lastDateObj.getDate() + i);
    const dateStr = nextDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
    
    // Predicted value cap to avoid negative predictions or extreme spikes
    let predictedQty = slope * (n + i - 1) + intercept;
    if (predictedQty < 0) predictedQty = avgDailyQty * 0.8; // Fallback to safe lower bound
    if (predictedQty > avgDailyQty * 2) predictedQty = avgDailyQty * 1.2; // Fallback to safe upper bound

    forecast.push({
      date: dateStr,
      predictedQty: Number(predictedQty.toFixed(1))
    });
  }

  let trend = 'stable';
  if (slope > 0.1) trend = 'increasing';
  else if (slope < -0.1) trend = 'declining';

  const confidence = n > 14 ? 'high' : n > 7 ? 'medium' : 'low';

  return {
    forecast,
    trend,
    confidence,
    avgDailyQty: Number(avgDailyQty.toFixed(1)),
    slope: Number(slope.toFixed(2))
  };
}

/**
 * 2. Customer Churn Risk Prediction
 * Detects customers at risk of churn based on inactive milk records.
 */
export function predictCustomerChurn(customers, milkEntries) {
  if (!customers || customers.length === 0) return [];

  const activeCustomers = customers.filter(u => u.role === 'customer' && u.isActive);
  const now = new Date();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  // Map latest milk entry date per customer
  const latestEntryPerCustomer = {};
  milkEntries.forEach(entry => {
    const customerId = entry.userId?._id || entry.userId;
    if (!customerId) return;
    const entryDate = new Date(entry.date);
    if (!latestEntryPerCustomer[customerId] || entryDate > latestEntryPerCustomer[customerId]) {
      latestEntryPerCustomer[customerId] = entryDate;
    }
  });

  const churnRisks = [];

  activeCustomers.forEach(customer => {
    const lastSeenDate = latestEntryPerCustomer[customer._id];
    
    if (!lastSeenDate) {
      // Registered but has never taken milk deliveries
      churnRisks.push({
        customer,
        daysInactive: -1,
        riskLevel: 'medium',
        reason: 'New signup — no delivery entries recorded yet.'
      });
      return;
    }

    const diffDays = Math.floor((now - lastSeenDate) / ONE_DAY_MS);

    if (diffDays >= 7) {
      let riskLevel = 'medium';
      let reason = `Inactive for ${diffDays} days. Deliveries paused recently.`;
      
      if (diffDays >= 14) {
        riskLevel = 'high';
        reason = `Highly critical: Inactive for ${diffDays} days without vacation pause.`;
      }

      churnRisks.push({
        customer,
        daysInactive: diffDays,
        riskLevel,
        reason,
        lastActiveDate: lastSeenDate.toLocaleDateString('en-IN')
      });
    }
  });

  // Sort by highest risk
  return churnRisks.sort((a, b) => b.daysInactive - a.daysInactive);
}

/**
 * 3. Anomalies & Yield Dropping Detection
 * Highlights sudden production drops or delivery discrepancies.
 */
export function detectAnomalies(milkEntries) {
  if (!milkEntries || milkEntries.length < 5) return [];

  // Group by date
  const dailyTotals = {};
  milkEntries.forEach(entry => {
    if (!entry.date) return;
    const dateStr = new Date(entry.date).toISOString().split('T')[0];
    dailyTotals[dateStr] = (dailyTotals[dateStr] || 0) + (Number(entry.quantity) || 0);
  });

  const dates = Object.keys(dailyTotals).sort();
  const quantities = dates.map(d => dailyTotals[d]);

  if (dates.length < 5) return [];

  const anomalies = [];
  
  // Calculate running 5-day moving average and standard deviation
  for (let i = 4; i < dates.length; i++) {
    const history = quantities.slice(i - 4, i); // past 4 days
    const avg = history.reduce((sum, q) => sum + q, 0) / 4;
    const current = quantities[i];

    // Check if current day drops by more than 40% from 4-day average
    if (avg > 10 && current < avg * 0.6) {
      const dropPct = ((avg - current) / avg) * 100;
      anomalies.push({
        date: new Date(dates[i]).toLocaleDateString('en-IN'),
        currentYield: current.toFixed(1),
        avgYield: avg.toFixed(1),
        dropPercentage: dropPct.toFixed(0),
        severity: dropPct > 50 ? 'high' : 'medium',
        type: 'production_drop',
        message: `Milk supply dropped suddenly by ${dropPct.toFixed(0)}% from average (${current.toFixed(1)}L vs avg ${avg.toFixed(1)}L).`
      });
    }
  }

  return anomalies.reverse();
}

/**
 * 4. Revenue Forecasting
 * Projects next month's earnings using linear trend or current run-rate.
 */
export function forecastRevenue(payments) {
  if (!payments || payments.length === 0) {
    return { predictedNextMonth: 0, currentRunRate: 0, deltaPercentage: 0 };
  }

  // Parse payment months & totals
  const monthlyTotals = {};
  payments.forEach(p => {
    if (!p.month || !p.totalAmount) return;
    monthlyTotals[p.month] = (monthlyTotals[p.month] || 0) + Number(p.totalAmount);
  });

  const months = Object.keys(monthlyTotals);
  const amounts = months.map(m => monthlyTotals[m]);

  if (amounts.length === 0) {
    return { predictedNextMonth: 0, currentRunRate: 0, deltaPercentage: 0 };
  }

  const currentRunRate = amounts[amounts.length - 1] || 0;
  let predictedNextMonth = currentRunRate;
  let deltaPercentage = 0;

  if (amounts.length >= 2) {
    const prevMonth = amounts[amounts.length - 2];
    if (prevMonth > 0) {
      deltaPercentage = ((currentRunRate - prevMonth) / prevMonth) * 100;
      // Simple projection factoring in the delta
      predictedNextMonth = currentRunRate * (1 + (deltaPercentage / 100) * 0.5);
    }
  }

  return {
    predictedNextMonth: Number(predictedNextMonth.toFixed(0)),
    currentRunRate: Number(currentRunRate.toFixed(0)),
    deltaPercentage: Number(deltaPercentage.toFixed(1))
  };
}