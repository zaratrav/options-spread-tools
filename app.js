// Scenarios
const scenarios = {
    bullish: {
        stockPrice: 100,
        impliedVolatility: 20,
        daysToExp: 45,
        riskFreeRate: 5,
        longStrike: 100,
        longPremium: 2.50,
        shortStrike: 110,
        shortPremium: 0.75
    },
    moderate: {
        stockPrice: 100,
        impliedVolatility: 25,
        daysToExp: 30,
        riskFreeRate: 5,
        longStrike: 100,
        longPremium: 2.00,
        shortStrike: 105,
        shortPremium: 0.75
    },
    conservative: {
        stockPrice: 100,
        impliedVolatility: 30,
        daysToExp: 21,
        riskFreeRate: 5,
        longStrike: 100,
        longPremium: 1.50,
        shortStrike: 102,
        shortPremium: 0.75
    }
};

let bullCallChart = null;

function loadScenario(name) {
    const scenario = scenarios[name];
    document.getElementById('stockPrice').value = scenario.stockPrice;
    document.getElementById('impliedVolatility').value = scenario.impliedVolatility;
    document.getElementById('daysToExp').value = scenario.daysToExp;
    document.getElementById('riskFreeRate').value = scenario.riskFreeRate;
    document.getElementById('longStrike').value = scenario.longStrike;
    document.getElementById('longPremium').value = scenario.longPremium;
    document.getElementById('shortStrike').value = scenario.shortStrike;
    document.getElementById('shortPremium').value = scenario.shortPremium;
    calculateBullCall();
}

// Black-Scholes Greeks Calculation (Simplified)
function calculateBlackScholesGreeks(S, K, T, r, sigma, isCall) {
    const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);
    
    const Nd1 = normalCDF(d1);
    const Nd2 = normalCDF(d2);
    const nd1 = Math.exp(-0.5 * d1 * d1) / Math.sqrt(2 * Math.PI);
    
    if (isCall) {
        return {
            delta: Nd1,
            gamma: nd1 / (S * sigma * Math.sqrt(T)),
            theta: (-S * nd1 * sigma) / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * Nd2),
            vega: S * nd1 * Math.sqrt(T) / 100
        };
    } else {
        return {
            delta: Nd1 - 1,
            gamma: nd1 / (S * sigma * Math.sqrt(T)),
            theta: (-S * nd1 * sigma) / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * (1 - Nd2)),
            vega: S * nd1 * Math.sqrt(T) / 100
        };
    }
}

// Normal CDF approximation
function normalCDF(x) {
    return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

function erf(x) {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    
    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-x * x);
    
    return sign * y;
}

function calculateBullCall() {
    // Get inputs
    const S = parseFloat(document.getElementById('stockPrice').value);
    const sigma = parseFloat(document.getElementById('impliedVolatility').value) / 100;
    const T = parseInt(document.getElementById('daysToExp').value) / 365;
    const r = parseFloat(document.getElementById('riskFreeRate').value) / 100;
    const longStrike = parseFloat(document.getElementById('longStrike').value);
    const longPremium = parseFloat(document.getElementById('longPremium').value);
    const shortStrike = parseFloat(document.getElementById('shortStrike').value);
    const shortPremium = parseFloat(document.getElementById('shortPremium').value);

    // Validate
    if (!S || !longStrike || !shortStrike || !longPremium || !shortPremium) {
        alert('Please fill in all fields');
        return;
    }

    if (longStrike >= shortStrike) {
        alert('Long strike must be less than short strike');
        return;
    }

    // Calculate key metrics
    const netDebit = longPremium - shortPremium;
    const strikeWidth = shortStrike - longStrike;
    const maxProfit = strikeWidth - netDebit;
    const maxLoss = netDebit;
    const breakeven = longStrike + netDebit;

    // Profit at current price
    const longValue = Math.max(S - longStrike, 0);
    const shortValue = Math.max(S - shortStrike, 0);
    const currentProfit = (longValue - shortValue) - netDebit;

    // Risk/reward
    const riskReward = (maxProfit / maxLoss).toFixed(2);
    const roi = ((maxProfit / (netDebit * 100)) * 100).toFixed(2);
    const probProfit = calculateProbProfit(S, shortStrike, T, sigma);

    // Calculate Greeks for the spread (long - short)
    const longCallGreeks = calculateBlackScholesGreeks(S, longStrike, T, r, sigma, true);
    const shortCallGreeks = calculateBlackScholesGreeks(S, shortStrike, T, r, sigma, true);
    
    const spreadDelta = (longCallGreeks.delta - shortCallGreeks.delta).toFixed(3);
    const spreadGamma = (longCallGreeks.gamma - shortCallGreeks.gamma).toFixed(4);
    const spreadTheta = ((longCallGreeks.theta - shortCallGreeks.theta) / 365).toFixed(3); // per day
    const spreadVega = (longCallGreeks.vega - shortCallGreeks.vega).toFixed(3);

    // Display results
    document.getElementById('netDebit').textContent = '$' + netDebit.toFixed(2);
    document.getElementById('maxProfit').textContent = '$' + maxProfit.toFixed(2);
    document.getElementById('maxProfitStrike').textContent = `at ${shortStrike}+`;
    document.getElementById('maxLoss').textContent = '$' + maxLoss.toFixed(2);
    document.getElementById('breakeven').textContent = '$' + breakeven.toFixed(2);

    document.getElementById('riskReward').textContent = `${riskReward}:1 (profit:loss ratio)`;
    document.getElementById('roiRisk').textContent = `${roi}% ROI on risk`;
    document.getElementById('probProfit').textContent = `~${probProfit}% (estimated)`;

    const profitText = currentProfit >= 0 ? 
        `+$${currentProfit.toFixed(2)} profit` : 
        `-$${Math.abs(currentProfit).toFixed(2)} loss`;
    document.getElementById('currentProfit').textContent = profitText;

    // Display Greeks
    document.getElementById('deltaValue').textContent = spreadDelta + ' (directionality)';
    document.getElementById('gammaValue').textContent = spreadGamma + ' (delta change)';
    document.getElementById('thetaValue').textContent = '$' + spreadTheta + '/day';
    document.getElementById('vegaValue').textContent = '$' + spreadVega + ' per 1% IV';

    // Generate payoff table
    generatePayoffTable(longStrike, longPremium, shortStrike, shortPremium, netDebit, strikeWidth);

    // Draw chart
    drawBullCallChart(longStrike, longPremium, shortStrike, shortPremium, netDebit, maxProfit, maxLoss);

    // Generate tips
    generateStrategyTips(maxProfit, maxLoss, riskReward, netDebit, strikeWidth, spreadVega, spreadTheta);

    // Show results
    document.getElementById('bullCallResults').style.display = 'block';
    document.getElementById('bullCallResults').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function generatePayoffTable(longStrike, longPremium, shortStrike, shortPremium, netDebit, strikeWidth) {
    const tbody = document.getElementById('payoffBody');
    tbody.innerHTML = '';

    const minPrice = Math.floor(Math.min(longStrike, shortStrike) - strikeWidth) - 5;
    const maxPrice = Math.floor(shortStrike + 5);

    for (let price = minPrice; price <= maxPrice; price += 1) {
        const longValue = Math.max(price - longStrike, 0);
        const shortValue = Math.max(price - shortStrike, 0);
        const spreadPL = (longValue - shortValue) - netDebit;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>$${price.toFixed(2)}</td>
            <td>$${longValue.toFixed(2)}</td>
            <td>$${shortValue.toFixed(2)}</td>
            <td style="font-weight: 600; color: ${spreadPL >= 0 ? '#10b981' : '#dc2626'};">
                ${spreadPL >= 0 ? '+' : ''}$${spreadPL.toFixed(2)}
            </td>
        `;
        tbody.appendChild(row);
    }
}

function drawBullCallChart(longStrike, longPremium, shortStrike, shortPremium, netDebit, maxProfit, maxLoss) {
    const labels = [];
    const data = [];

    const minPrice = Math.floor(Math.min(longStrike, shortStrike) - 10);
    const maxPrice = Math.floor(shortStrike + 10);

    for (let price = minPrice; price <= maxPrice; price += 0.5) {
        labels.push('$' + price.toFixed(2));
        
        const longValue = Math.max(price - longStrike, 0);
        const shortValue = Math.max(price - shortStrike, 0);
        const spreadPL = (longValue - shortValue) - netDebit;
        
        data.push(spreadPL);
    }

    const ctx = document.getElementById('bullCallChart').getContext('2d');
    if (bullCallChart) bullCallChart.destroy();

    bullCallChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Profit/Loss',
                data: data,
                borderColor: '#1e40af',
                backgroundColor: 'rgba(30, 64, 175, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointRadius: 0,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    labels: { font: { size: 12 } }
                }
            },
            scales: {
                y: {
                    title: { display: true, text: 'Profit/Loss ($)' },
                    beginAtZero: true
                },
                x: {
                    title: { display: true, text: 'Stock Price at Expiration' }
                }
            }
        }
    });
}

function generateStrategyTips(maxProfit, maxLoss, riskReward, netDebit, strikeWidth, vega, theta) {
    const tips = [];

    if (riskReward >= 2) {
        tips.push('Great risk/reward ratio (2:1+). This is a favorable setup.');
    } else if (riskReward < 1) {
        tips.push('Poor risk/reward ratio (<1:1). You risk more than you can make. Consider wider strikes.');
    }

    if (maxProfit < netDebit * 2) {
        tips.push('Max profit is less than 2x your cost. Consider wider strikes for better returns.');
    } else {
        tips.push('Max profit is at least 2x your cost. Good risk/reward setup.');
    }

    if (theta > 0) {
        tips.push('Positive theta: time decay works in your favor. Spread value increases daily (if stock is stable).');
    } else {
        tips.push('Negative theta: time decay works against you. Sell spreads to capitalize on theta.');
    }

    if (vega < 0) {
        tips.push('Negative vega: benefits from IV decline. Close if IV spikes.');
    } else {
        tips.push('Positive vega: benefits from IV increase. Hold if you expect volatility to rise.');
    }

    tips.push('Close at 50% max profit to lock in gains and avoid 0 DTE slippage.');
    tips.push('Monitor Greeks as expiration approaches - gamma increases significantly.');

    const tipsList = document.getElementById('strategyTips');
    tipsList.innerHTML = tips.map(tip => `<li>${tip}</li>`).join('');
}

function calculateProbProfit(S, shortStrike, T, sigma) {
    // Probability that stock stays below short strike (ITM for long call profit)
    const d2 = (Math.log(S / shortStrike) + (-0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
    const probProfit = Math.max(20, Math.min(90, 50 + normalCDF(d2) * 40));
    return Math.round(probProfit);
}

// Initialize with default scenario
document.addEventListener('DOMContentLoaded', function() {
    loadScenario('moderate');
});
