// Big 12 Basketball Financial Calculators
// ROI calculation functions and interactive tools

// ROI Calculator
function calculateROI() {
    // Get input values
    const highProfileRevenue = parseFloat(document.getElementById('opponent1').value) * 1000000;
    const qualityP5Games = parseInt(document.getElementById('opponent2').value);
    const midMajorGames = parseInt(document.getElementById('opponent3').value);
    const tournamentProb = parseFloat(document.getElementById('tournamentProb').value) / 100;
    const avgRevenue = parseFloat(document.getElementById('avgRevenue').value) * 1000;
    const winRate = parseFloat(document.getElementById('winRate').value) / 100;
    const netImpact = parseFloat(document.getElementById('netImpact').value);

    // Calculate total non-conference games (assuming 13 total)
    const totalNonConfGames = 13;
    const remainingGames = totalNonConfGames - qualityP5Games - midMajorGames - 1; // -1 for high profile game

    // Revenue calculations
    const p5Revenue = qualityP5Games * 800000; // Average $800K for quality P5
    const midMajorRevenue = midMajorGames * 300000; // Average $300K for mid-major
    const buyGameRevenue = Math.max(0, remainingGames) * 125000; // $125K for buy games
    
    const totalGameRevenue = highProfileRevenue + p5Revenue + midMajorRevenue + buyGameRevenue;

    // Tournament unit calculations
    const baseUnits = 8.5; // Big 12 average
    const netBonus = Math.max(0, (netImpact / 10) * 1.5); // NET improvement bonus
    const adjustedUnits = baseUnits + netBonus;
    const tournamentRevenue = adjustedUnits * tournamentProb * 2100000; // $2.1M per unit over 6 years

    // Total revenue and costs
    const totalRevenue = totalGameRevenue + tournamentRevenue;
    const estimatedCosts = totalNonConfGames * 200000; // $200K average cost per game
    const netRevenue = totalRevenue - estimatedCosts;

    // ROI calculation
    const roi = ((netRevenue - estimatedCosts) / estimatedCosts) * 100;

    // Risk assessment
    let riskLevel = 'Low';
    let riskScore = 0;
    
    if (winRate < 0.6) {
        riskScore += 30;
    } else if (winRate < 0.7) {
        riskScore += 15;
    }
    
    if (tournamentProb < 0.7) {
        riskScore += 25;
    } else if (tournamentProb < 0.8) {
        riskScore += 10;
    }
    
    if (qualityP5Games > 6) {
        riskScore += 20;
    }
    
    if (riskScore > 40) {
        riskLevel = 'High';
    } else if (riskScore > 20) {
        riskLevel = 'Medium';
    }

    // Display results
    const resultsDiv = document.getElementById('roiResults');
    const outputDiv = document.getElementById('roiOutput');
    
    outputDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
                <h5>Revenue Breakdown</h5>
                <p><strong>High-Profile Game:</strong> $${(highProfileRevenue/1000000).toFixed(1)}M</p>
                <p><strong>Quality P5 Games:</strong> $${(p5Revenue/1000000).toFixed(1)}M</p>
                <p><strong>Mid-Major Games:</strong> $${(midMajorRevenue/1000000).toFixed(1)}M</p>
                <p><strong>Buy Games:</strong> $${(buyGameRevenue/1000000).toFixed(1)}M</p>
                <p><strong>Tournament Units:</strong> $${(tournamentRevenue/1000000).toFixed(1)}M</p>
                <p style="border-top: 1px solid #ccc; padding-top: 10px;"><strong>Total Revenue:</strong> $${(totalRevenue/1000000).toFixed(1)}M</p>
            </div>
            <div>
                <h5>Financial Analysis</h5>
                <p><strong>Total Costs:</strong> $${(estimatedCosts/1000000).toFixed(1)}M</p>
                <p><strong>Net Revenue:</strong> $${(netRevenue/1000000).toFixed(1)}M</p>
                <p><strong>ROI:</strong> ${roi.toFixed(1)}%</p>
                <p><strong>Risk Level:</strong> ${riskLevel} (${riskScore}/100)</p>
                <p><strong>Expected Units:</strong> ${adjustedUnits.toFixed(1)}</p>
                <p><strong>Tournament Probability:</strong> ${(tournamentProb * 100).toFixed(1)}%</p>
            </div>
        </div>
        <div style="margin-top: 15px; padding: 10px; background: ${roi > 200 ? '#d4edda' : roi > 100 ? '#fff3cd' : '#f8d7da'}; border-radius: 5px;">
            <strong>Recommendation:</strong> 
            ${roi > 200 ? 'Excellent schedule - high revenue with manageable risk' : 
              roi > 100 ? 'Good schedule - solid revenue potential' : 
              'Consider adjusting schedule to reduce risk or increase revenue potential'}
        </div>
    `;
    
    resultsDiv.style.display = 'block';
}

// Tournament Unit Value Calculator
function calculateTournamentValue() {
    // Get input values
    const firstRound = parseInt(document.getElementById('firstRoundWins').value);
    const secondRound = parseInt(document.getElementById('secondRoundWins').value);
    const sweetSixteen = parseInt(document.getElementById('sweetSixteenWins').value);
    const eliteEight = parseInt(document.getElementById('eliteEightWins').value);
    const finalFour = parseInt(document.getElementById('finalFourWins').value);
    const championship = parseInt(document.getElementById('championshipWins').value);

    // Unit values (each win = 1 unit, paid over 6 years)
    const unitValue = 2100000; // $2.1M per unit over 6 years
    const annualUnitValue = unitValue / 6; // $350K per year per unit

    // Calculate total units
    const totalUnits = firstRound + secondRound + sweetSixteen + eliteEight + finalFour + championship;
    
    // Calculate revenue
    const totalRevenue = totalUnits * unitValue;
    const annualRevenue = totalUnits * annualUnitValue;
    const revenuePerSchool = totalRevenue / 16; // Divided among 16 Big 12 schools
    const annualPerSchool = annualRevenue / 16;

    // Performance metrics
    const tournamentEfficiency = totalUnits / Math.max(1, firstRound); // Units per bid
    let performanceRating = 'Poor';
    
    if (tournamentEfficiency > 3) {
        performanceRating = 'Excellent';
    } else if (tournamentEfficiency > 2) {
        performanceRating = 'Good';
    } else if (tournamentEfficiency > 1.5) {
        performanceRating = 'Average';
    }

    // Historical comparison
    const big12Average = 8.5; // units per year
    const vsAverage = totalUnits - big12Average;
    const percentageDiff = ((totalUnits - big12Average) / big12Average) * 100;

    // Display results
    const resultsDiv = document.getElementById('tournamentResults');
    const outputDiv = document.getElementById('tournamentOutput');
    
    outputDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
                <h5>Tournament Performance</h5>
                <p><strong>Total Units Earned:</strong> ${totalUnits}</p>
                <p><strong>Tournament Efficiency:</strong> ${tournamentEfficiency.toFixed(1)} units/bid</p>
                <p><strong>Performance Rating:</strong> ${performanceRating}</p>
                <p><strong>vs. Big 12 Average:</strong> ${vsAverage > 0 ? '+' : ''}${vsAverage.toFixed(1)} units (${percentageDiff > 0 ? '+' : ''}${percentageDiff.toFixed(1)}%)</p>
            </div>
            <div>
                <h5>Financial Impact</h5>
                <p><strong>Total Revenue (6 years):</strong> $${(totalRevenue/1000000).toFixed(1)}M</p>
                <p><strong>Annual Revenue:</strong> $${(annualRevenue/1000000).toFixed(1)}M</p>
                <p><strong>Revenue per School (6 years):</strong> $${(revenuePerSchool/1000000).toFixed(1)}M</p>
                <p><strong>Annual per School:</strong> $${(annualPerSchool/1000).toFixed(0)}K</p>
            </div>
        </div>
        <div style="margin-top: 15px;">
            <h5>Breakdown by Round</h5>
            <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #ddd;">
                    <th style="text-align: left; padding: 5px;">Round</th>
                    <th style="text-align: right; padding: 5px;">Wins</th>
                    <th style="text-align: right; padding: 5px;">Units</th>
                    <th style="text-align: right; padding: 5px;">Revenue</th>
                </tr>
                <tr><td style="padding: 5px;">First Round</td><td style="text-align: right; padding: 5px;">${firstRound}</td><td style="text-align: right; padding: 5px;">${firstRound}</td><td style="text-align: right; padding: 5px;">$${(firstRound * unitValue / 1000000).toFixed(1)}M</td></tr>
                <tr><td style="padding: 5px;">Second Round</td><td style="text-align: right; padding: 5px;">${secondRound}</td><td style="text-align: right; padding: 5px;">${secondRound}</td><td style="text-align: right; padding: 5px;">$${(secondRound * unitValue / 1000000).toFixed(1)}M</td></tr>
                <tr><td style="padding: 5px;">Sweet 16</td><td style="text-align: right; padding: 5px;">${sweetSixteen}</td><td style="text-align: right; padding: 5px;">${sweetSixteen}</td><td style="text-align: right; padding: 5px;">$${(sweetSixteen * unitValue / 1000000).toFixed(1)}M</td></tr>
                <tr><td style="padding: 5px;">Elite 8</td><td style="text-align: right; padding: 5px;">${eliteEight}</td><td style="text-align: right; padding: 5px;">${eliteEight}</td><td style="text-align: right; padding: 5px;">$${(eliteEight * unitValue / 1000000).toFixed(1)}M</td></tr>
                <tr><td style="padding: 5px;">Final Four</td><td style="text-align: right; padding: 5px;">${finalFour}</td><td style="text-align: right; padding: 5px;">${finalFour}</td><td style="text-align: right; padding: 5px;">$${(finalFour * unitValue / 1000000).toFixed(1)}M</td></tr>
                <tr><td style="padding: 5px;">Championship</td><td style="text-align: right; padding: 5px;">${championship}</td><td style="text-align: right; padding: 5px;">${championship}</td><td style="text-align: right; padding: 5px;">$${(championship * unitValue / 1000000).toFixed(1)}M</td></tr>
                <tr style="border-top: 2px solid #333; font-weight: bold;">
                    <td style="padding: 5px;">Total</td>
                    <td style="text-align: right; padding: 5px;">${firstRound + secondRound + sweetSixteen + eliteEight + finalFour + championship}</td>
                    <td style="text-align: right; padding: 5px;">${totalUnits}</td>
                    <td style="text-align: right; padding: 5px;">$${(totalRevenue / 1000000).toFixed(1)}M</td>
                </tr>
            </table>
        </div>
        <div style="margin-top: 15px; padding: 10px; background: ${totalUnits > big12Average ? '#d4edda' : '#fff3cd'}; border-radius: 5px;">
            <strong>Analysis:</strong> 
            ${totalUnits > big12Average ? 
                `Excellent performance! This scenario generates ${vsAverage.toFixed(1)} more units than the Big 12 average, resulting in $${((vsAverage * unitValue) / 1000000).toFixed(1)}M additional revenue.` : 
                `Below average performance. Consider strategies to improve tournament success to reach the Big 12 average of ${big12Average} units.`}
        </div>
    `;
    
    resultsDiv.style.display = 'block';
}

// Schedule Optimization Functions
function optimizeSchedule(strategy = 'balanced') {
    const strategies = {
        conservative: {
            highProfile: 1,
            qualityP5: 3,
            midMajor: 4,
            buyGames: 5,
            revenue: 8200000,
            tournamentProb: 0.85,
            risk: 25
        },
        balanced: {
            highProfile: 1,
            qualityP5: 4,
            midMajor: 3,
            buyGames: 5,
            revenue: 10100000,
            tournamentProb: 0.75,
            risk: 45
        },
        aggressive: {
            highProfile: 2,
            qualityP5: 6,
            midMajor: 2,
            buyGames: 3,
            revenue: 12500000,
            tournamentProb: 0.65,
            risk: 75
        },
        eliteHeavy: {
            highProfile: 3,
            qualityP5: 4,
            midMajor: 3,
            buyGames: 3,
            revenue: 11800000,
            tournamentProb: 0.72,
            risk: 65
        },
        riskAdverse: {
            highProfile: 0,
            qualityP5: 2,
            midMajor: 5,
            buyGames: 6,
            revenue: 7900000,
            tournamentProb: 0.88,
            risk: 15
        }
    };

    return strategies[strategy] || strategies.balanced;
}

// Advanced Analytics Functions
function calculateStrengthOfSchedule(opponents) {
    // SOS calculation based on opponent quality
    let totalSOS = 0;
    let gameCount = 0;

    opponents.forEach(opponent => {
        totalSOS += opponent.ranking || 150; // Default ranking if not provided
        gameCount++;
    });

    return gameCount > 0 ? totalSOS / gameCount : 150;
}

function calculateNetRankingImpact(schedule) {
    // NET ranking impact based on quality wins and losses
    let netImpact = 0;
    
    schedule.forEach(game => {
        if (game.result === 'win') {
            if (game.opponentRanking <= 30) {
                netImpact += 3; // Q1 win
            } else if (game.opponentRanking <= 75) {
                netImpact += 2; // Q2 win
            } else {
                netImpact += 1; // Q3/Q4 win
            }
        } else if (game.result === 'loss') {
            if (game.opponentRanking > 100) {
                netImpact -= 5; // Bad loss penalty
            } else if (game.opponentRanking > 75) {
                netImpact -= 2; // Q3 loss penalty
            }
        }
    });

    return netImpact;
}

// Export functions for potential use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateROI,
        calculateTournamentValue,
        optimizeSchedule,
        calculateStrengthOfSchedule,
        calculateNetRankingImpact
    };
}