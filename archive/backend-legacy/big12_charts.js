// Big 12 Basketball Financial Analysis Charts
// Chart initialization and data visualization functions

// Color schemes
const big12Colors = {
    primary: '#1e3c72',
    secondary: '#2a5298',
    accent: '#667eea',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8'
};

const conferenceColors = {
    'Big 12': '#1e3c72',
    'ACC': '#8b0000',
    'SEC': '#228b22',
    'Big Ten': '#4169e1'
};

// Revenue Analysis Charts
function initializeRevenueCharts() {
    createRevenueProjectionChart();
    createNonConfRevenueChart();
    createTournamentUnitChart();
}

function createRevenueProjectionChart() {
    const ctx = document.getElementById('revenueProjectionChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['2024-25', '2025-26', '2026-27', '2027-28', '2028-29'],
            datasets: [{
                label: '18-Game Schedule Revenue',
                data: [42.2, 44.1, 46.3, 48.6, 51.0],
                borderColor: big12Colors.primary,
                backgroundColor: big12Colors.primary + '20',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }, {
                label: '20-Game Schedule Revenue',
                data: [39.6, 41.2, 43.1, 45.2, 47.4],
                borderColor: big12Colors.danger,
                backgroundColor: big12Colors.danger + '20',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }, {
                label: 'Revenue Difference',
                data: [2.6, 2.9, 3.2, 3.4, 3.6],
                borderColor: big12Colors.success,
                backgroundColor: big12Colors.success + '30',
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    min: 35,
                    title: {
                        display: true,
                        text: 'Revenue per School ($ Millions)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value + 'M';
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Academic Year'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': $' + context.parsed.y + 'M per school';
                        }
                    }
                },
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

function createNonConfRevenueChart() {
    const ctx = document.getElementById('nonConfRevenueChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Elite P5\n($1.5M-$2M)', 'Top P5\n($800K-$1.2M)', 'Mid P5\n($400K-$700K)', 'Top Mid-Major\n($200K-$400K)', 'Buy Games\n($75K-$150K)'],
            datasets: [{
                label: 'Revenue per Game',
                data: [1750, 1000, 550, 300, 112.5],
                backgroundColor: [
                    big12Colors.danger,
                    big12Colors.warning,
                    big12Colors.info,
                    big12Colors.accent,
                    big12Colors.secondary
                ],
                borderColor: big12Colors.primary,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Revenue per Game ($000)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value + 'K';
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Opponent Category'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Revenue: $' + context.parsed.y + 'K per game';
                        }
                    }
                },
                legend: {
                    display: false
                }
            }
        }
    });
}

function createTournamentUnitChart() {
    const ctx = document.getElementById('tournamentUnitChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['First Round', 'Second Round', 'Sweet 16', 'Elite 8', 'Final Four', 'Championship'],
            datasets: [{
                data: [8, 4, 2, 1, 0.5, 0.5],
                backgroundColor: [
                    big12Colors.info,
                    big12Colors.accent,
                    big12Colors.primary,
                    big12Colors.warning,
                    big12Colors.danger,
                    big12Colors.success
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const revenue = (value * 2.1).toFixed(1);
                            return context.label + ': ' + value + ' units ($' + revenue + 'M)';
                        }
                    }
                },
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Performance Metrics Charts
function initializePerformanceCharts() {
    createTournamentSuccessChart();
    createQualityWinsChart();
    createNetRankingChart();
}

function createTournamentSuccessChart() {
    const ctx = document.getElementById('tournamentSuccessChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['2020-21', '2021-22', '2022-23', '2023-24', '2024-25'],
            datasets: [{
                label: 'Tournament Bids',
                data: [6, 8, 8, 8, 9],
                backgroundColor: big12Colors.primary,
                yAxisID: 'y'
            }, {
                label: 'Sweet 16 Teams',
                data: [2, 3, 4, 2, 3],
                backgroundColor: big12Colors.accent,
                yAxisID: 'y'
            }, {
                label: 'Elite 8 Teams',
                data: [1, 1, 2, 0, 1],
                backgroundColor: big12Colors.warning,
                yAxisID: 'y'
            }, {
                label: 'Final Four Teams',
                data: [1, 1, 0, 0, 1],
                backgroundColor: big12Colors.success,
                yAxisID: 'y'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    max: 10,
                    title: {
                        display: true,
                        text: 'Number of Teams'
                    }
                }
            },
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false
                },
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

function createQualityWinsChart() {
    const ctx = document.getElementById('qualityWinsChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Q1 Wins', 'Q2 Wins', 'Home Wins', 'Neutral Wins', 'Road Wins', 'Conference Wins'],
            datasets: [{
                label: '18-Game Schedule',
                data: [8.2, 6.4, 12.1, 4.3, 3.8, 11.5],
                borderColor: big12Colors.primary,
                backgroundColor: big12Colors.primary + '30',
                borderWidth: 2
            }, {
                label: '20-Game Schedule',
                data: [6.8, 5.1, 11.2, 3.9, 3.2, 13.8],
                borderColor: big12Colors.danger,
                backgroundColor: big12Colors.danger + '30',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 15
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

function createNetRankingChart() {
    const ctx = document.getElementById('netRankingChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: '18-Game Schedule',
                data: [
                    {x: 68, y: 15}, {x: 72, y: 22}, {x: 75, y: 28}, {x: 78, y: 35},
                    {x: 82, y: 42}, {x: 85, y: 48}, {x: 88, y: 55}, {x: 91, y: 62}
                ],
                backgroundColor: big12Colors.primary,
                borderColor: big12Colors.primary,
                borderWidth: 2,
                pointRadius: 6
            }, {
                label: '20-Game Schedule',
                data: [
                    {x: 65, y: 18}, {x: 68, y: 26}, {x: 71, y: 33}, {x: 74, y: 41},
                    {x: 78, y: 49}, {x: 81, y: 56}, {x: 84, y: 64}, {x: 87, y: 72}
                ],
                backgroundColor: big12Colors.danger,
                borderColor: big12Colors.danger,
                borderWidth: 2,
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Tournament Probability (%)'
                    },
                    min: 60,
                    max: 95
                },
                y: {
                    title: {
                        display: true,
                        text: 'Average NET Ranking'
                    },
                    min: 10,
                    max: 80,
                    reverse: true
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': NET ' + context.parsed.y + ', ' + context.parsed.x + '% probability';
                        }
                    }
                },
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

// Conference Benchmarking Charts
function initializeBenchmarkingCharts() {
    createConferenceFormatChart();
    createBidSuccessChart();
    createRevenuePerSchoolChart();
}

function createConferenceFormatChart() {
    const ctx = document.getElementById('conferenceFormatChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Big 12', 'ACC', 'SEC', 'Big Ten', 'Pac-12', 'Big East'],
            datasets: [{
                label: 'Conference Games',
                data: [18, 18, 18, 20, 20, 20],
                backgroundColor: [
                    conferenceColors['Big 12'],
                    conferenceColors['ACC'],
                    conferenceColors['SEC'],
                    conferenceColors['Big Ten'],
                    big12Colors.warning,
                    big12Colors.info
                ],
                yAxisID: 'y'
            }, {
                label: 'Non-Conference Games',
                data: [13, 13, 13, 11, 11, 11],
                backgroundColor: [
                    conferenceColors['Big 12'] + '60',
                    conferenceColors['ACC'] + '60',
                    conferenceColors['SEC'] + '60',
                    conferenceColors['Big Ten'] + '60',
                    big12Colors.warning + '60',
                    big12Colors.info + '60'
                ],
                yAxisID: 'y'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    stacked: true,
                    beginAtZero: true,
                    max: 35,
                    title: {
                        display: true,
                        text: 'Number of Games'
                    }
                },
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Conference'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

function createBidSuccessChart() {
    const ctx = document.getElementById('bidSuccessChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['2020', '2021', '2022', '2023', '2024', '2025'],
            datasets: [{
                label: 'Big 12',
                data: [53, 60, 73, 73, 73, 78],
                borderColor: conferenceColors['Big 12'],
                backgroundColor: conferenceColors['Big 12'] + '20',
                borderWidth: 3,
                tension: 0.4
            }, {
                label: 'ACC',
                data: [60, 55, 52, 48, 45, 42],
                borderColor: conferenceColors['ACC'],
                backgroundColor: conferenceColors['ACC'] + '20',
                borderWidth: 3,
                tension: 0.4
            }, {
                label: 'SEC',
                data: [65, 68, 70, 68, 65, 68],
                borderColor: conferenceColors['SEC'],
                backgroundColor: conferenceColors['SEC'] + '20',
                borderWidth: 3,
                tension: 0.4
            }, {
                label: 'Big Ten',
                data: [58, 62, 59, 56, 58, 59],
                borderColor: conferenceColors['Big Ten'],
                backgroundColor: conferenceColors['Big Ten'] + '20',
                borderWidth: 3,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    min: 35,
                    max: 85,
                    title: {
                        display: true,
                        text: 'Tournament Bid Success Rate (%)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Year'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y + '% success rate';
                        }
                    }
                },
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

function createRevenuePerSchoolChart() {
    const ctx = document.getElementById('revenuePerSchoolChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Big 12', 'SEC', 'Big Ten', 'ACC', 'Pac-12', 'Big East'],
            datasets: [{
                label: 'Media Rights',
                data: [31.2, 42.8, 54.3, 36.1, 30.0, 4.8],
                backgroundColor: big12Colors.primary,
                stack: 'revenue'
            }, {
                label: 'Tournament Units',
                data: [8.2, 6.4, 5.8, 4.2, 3.1, 5.2],
                backgroundColor: big12Colors.accent,
                stack: 'revenue'
            }, {
                label: 'Other Revenue',
                data: [2.8, 3.2, 4.1, 2.9, 2.4, 1.8],
                backgroundColor: big12Colors.secondary,
                stack: 'revenue'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    stacked: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Revenue per School ($ Millions)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value + 'M';
                        }
                    }
                },
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Conference'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': $' + context.parsed.y + 'M';
                        }
                    }
                },
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

// Strategic Planning Charts
function initializeStrategicCharts() {
    createOpponentMatrixChart();
    createRevenueTemplatesChart();
}

function createOpponentMatrixChart() {
    const ctx = document.getElementById('opponentMatrixChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'bubble',
        data: {
            datasets: [{
                label: 'Elite Power 5',
                data: [{x: 35, y: 1750, r: 15}],
                backgroundColor: big12Colors.danger + '60',
                borderColor: big12Colors.danger,
                borderWidth: 2
            }, {
                label: 'Top Power 5',
                data: [{x: 55, y: 1000, r: 20}],
                backgroundColor: big12Colors.warning + '60',
                borderColor: big12Colors.warning,
                borderWidth: 2
            }, {
                label: 'Mid Power 5',
                data: [{x: 72, y: 550, r: 18}],
                backgroundColor: big12Colors.info + '60',
                borderColor: big12Colors.info,
                borderWidth: 2
            }, {
                label: 'Top Mid-Major',
                data: [{x: 78, y: 300, r: 12}],
                backgroundColor: big12Colors.accent + '60',
                borderColor: big12Colors.accent,
                borderWidth: 2
            }, {
                label: 'Buy Games',
                data: [{x: 95, y: 112, r: 8}],
                backgroundColor: big12Colors.secondary + '60',
                borderColor: big12Colors.secondary,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Win Probability (%)'
                    },
                    min: 20,
                    max: 100
                },
                y: {
                    title: {
                        display: true,
                        text: 'Revenue per Game ($000)'
                    },
                    min: 50,
                    max: 2000
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.x + '% win rate, $' + context.parsed.y + 'K revenue';
                        }
                    }
                },
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

function createRevenueTemplatesChart() {
    const ctx = document.getElementById('revenueTemplatesChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: ['Conservative', 'Balanced', 'Aggressive', 'Elite Focus', 'Mid-Major Heavy'],
            datasets: [{
                data: [8.2, 10.1, 12.5, 11.8, 7.9],
                backgroundColor: [
                    big12Colors.info + '80',
                    big12Colors.primary + '80',
                    big12Colors.danger + '80',
                    big12Colors.warning + '80',
                    big12Colors.accent + '80'
                ],
                borderColor: [
                    big12Colors.info,
                    big12Colors.primary,
                    big12Colors.danger,
                    big12Colors.warning,
                    big12Colors.accent
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': $' + context.parsed + 'M total revenue';
                        }
                    }
                },
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Calculator Charts
function initializeCalculatorCharts() {
    createOptimizationChart();
}

function createOptimizationChart() {
    const ctx = document.getElementById('optimizationChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Conservative', 'Balanced', 'Aggressive', 'Elite-Heavy', 'Risk-Adverse'],
            datasets: [{
                label: 'Revenue Potential',
                data: [8.2, 10.1, 12.5, 11.8, 7.9],
                borderColor: big12Colors.primary,
                backgroundColor: big12Colors.primary + '20',
                borderWidth: 3,
                tension: 0.4,
                yAxisID: 'y'
            }, {
                label: 'Tournament Probability',
                data: [85, 75, 65, 72, 88],
                borderColor: big12Colors.success,
                backgroundColor: big12Colors.success + '20',
                borderWidth: 3,
                tension: 0.4,
                yAxisID: 'y1'
            }, {
                label: 'Risk Score',
                data: [25, 45, 75, 65, 15],
                borderColor: big12Colors.danger,
                backgroundColor: big12Colors.danger + '20',
                borderWidth: 3,
                tension: 0.4,
                yAxisID: 'y1'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Revenue ($ Millions)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value + 'M';
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Percentage / Risk Score'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false
                },
                legend: {
                    position: 'top'
                }
            }
        }
    });
}