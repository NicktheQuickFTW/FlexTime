# Travel Costs Framework Documentation

This directory contains documentation, frameworks, and information related to travel cost optimization for collegiate athletic scheduling.

## Directory Structure

```
travel/
├── README.md                    # This file
├── frameworks/                  # Cost calculation frameworks
│   ├── base-cost-model.md      # Fundamental cost calculation methods
│   ├── distance-algorithms.md   # Distance calculation approaches
│   └── optimization-strategies.md # Cost optimization frameworks
├── data/                       # Travel cost data and datasets
│   ├── mileage-rates.json      # IRS/institutional mileage rates
│   ├── airline-costs.json      # Average airline cost data
│   └── lodging-rates.json      # Per diem and lodging rates by city
├── case-studies/               # Real-world examples and analysis
│   ├── big12-analysis.md       # Big 12 Conference travel analysis
│   └── optimization-results.md  # Results from implemented optimizations
└── integration/                # Integration guides
    ├── api-integration.md      # How to integrate with travel APIs
    └── scheduling-integration.md # Integration with scheduling algorithms
```

## Quick Links

- [Travel Cost Calculation Framework](frameworks/base-cost-model.md)
- [Distance Algorithm Documentation](frameworks/distance-algorithms.md)
- [Big 12 Travel Analysis](case-studies/big12-analysis.md)
- [API Integration Guide](integration/api-integration.md)

## Related Components

This documentation supports the following FlexTime components:
- `/backend/algorithms/travel-optimizer.js`
- `/backend/algorithms/travel-distance-calculator.js`
- `/backend/agents/specialized/travel_optimization_agent.js`