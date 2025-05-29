# FlexTime Travel Cost Formula Framework for Collegiate Athletics

## Core Formula Structure

**Total Travel Cost = Base Transportation Cost + Accommodation Cost + Meal Cost + Equipment Cost + Variable Adjustments**

---

## 1. Base Transportation Cost Calculation

### Mode Selection Logic
```
IF Distance ≤ 200 miles THEN Charter Bus
IF Distance > 200 miles AND ≤ 800 miles THEN Regional Charter Flight OR Charter Bus
IF Distance > 800 miles THEN Charter Flight
```

### Charter Bus Pricing Formula
```
Bus Cost = (Hourly Rate × Hours) + (Per Mile Rate × Distance) + Driver Expenses

Where:
- Hourly Rate = $120-150/hour (5-hour minimum)
- Per Mile Rate = $2.50-3.50/mile for distances >200 miles
- Driver Expenses = Lodging ($150/night) + Meals ($75/day) if overnight
```

**Bus Size Factors:**
- Minibus (≤20 passengers): Base Rate × 0.7
- Standard Coach (21-45): Base Rate × 1.0  
- Large Coach (46-56): Base Rate × 1.3

### Charter Flight Pricing Formula
```
Flight Cost = (Aircraft Hourly Rate × Flight Hours) + Repositioning + Crew Expenses + Airport Fees

Aircraft Hourly Rates (2024 data):
- Embraer 145 (≤50 passengers): $7,000/hour
- Boeing 737-400/800 (≤150 passengers): $9,000-11,000/hour
- Boeing 757 (≤180 passengers): $15,000/hour
- Boeing 767 (≤200+ passengers): $18,000/hour

Repositioning Cost = Base Rate × 0.5 × (Deadhead Hours)
Crew Expenses = $200/night per crew member if overnight
Airport Fees = $500-2,000 per airport (varies by facility)
```

---

## 2. Team Size and Sport-Specific Variables

### Passenger Counts by Sport
```
Football: 85-105 total (players + staff + equipment crew)
Men's Basketball: 25-35 total
Women's Basketball: 25-35 total  
Baseball: 35-45 total
Softball: 25-35 total
Olympic Sports: 15-30 total
```

### Equipment Transportation Multipliers
```
Football: Base Cost × 1.4 (extensive equipment)
Baseball/Softball: Base Cost × 1.2 (bats, gear)
Basketball: Base Cost × 1.1 (minimal equipment)
Olympic Sports: Base Cost × 1.0-1.3 (varies by sport)
```

---

## 3. Accommodation Cost Formula

### Hotel Calculations
```
Hotel Cost = (Rooms Required × Nightly Rate × Nights) + Taxes + Incidentals

Rooms Required = CEILING(Total Travelers ÷ Occupancy Rate)
- Standard Occupancy: 2 per room
- Coaches/Staff: Often single occupancy
- Equipment Crew: 2 per room

Nightly Rates by Market:
- Tier 1 Markets (NYC, LA, CHI): $200-350/night
- Tier 2 Markets (Regional hubs): $120-200/night  
- Tier 3 Markets (College towns): $80-150/night

Taxes: Rate × 0.12-0.18 (varies by location)
```

### Accommodation Decision Matrix
```
IF Trip Duration ≤ 6 hours THEN No hotel needed
IF Trip Duration > 6 hours AND < 18 hours THEN Day rooms optional
IF Trip Duration ≥ 18 hours THEN Overnight required
IF Departure Time ≤ 6:00 AM THEN Pre-trip hotel required
```

---

## 4. Meal Cost Calculations

### Per Diem Rates by Trip Type
```
Day Trip Meals = Travelers × $45-65/person
- Breakfast: $15-20
- Lunch: $20-25  
- Dinner: $25-35

Overnight Trip Meals = Travelers × $75-95/person/day
- Includes all meals plus snacks
- Premium for special dietary requirements: +$15/person

Team Dinner (Pre-game): $35-50/person
Airport/Travel Meals: $25-35/person
```

---

## 5. Variable Adjustment Factors

### Seasonal Multipliers
```
Peak Season (March-June): Base Cost × 1.2-1.4
Regular Season (Sept-Feb): Base Cost × 1.0
Off-Season (July-Aug): Base Cost × 0.8-0.9
```

### Timing Multipliers
```
Weekend Premium: +15-25%
Holiday Premium: +25-50%
Conference Tournament: +20-30%
Last-Minute Booking (<14 days): +25-40%
```

### Regional Cost Adjustments
```
West Coast: Base Cost × 1.15
Northeast Corridor: Base Cost × 1.20
Major Metropolitan Areas: Base Cost × 1.10-1.25
Rural/Small Markets: Base Cost × 0.85-0.95
```

### Weather/Emergency Contingencies
```
Weather Buffer: +5-10% of total cost
Emergency Rebooking Reserve: +$10,000-25,000 per trip
Charter Flight Weather Alternative: +$50,000-75,000
```

---

## 6. Implementation Algorithm for FlexTime

### Step 1: Basic Cost Calculation
```python
def calculate_base_travel_cost(origin, destination, team_size, sport, date):
    distance = get_distance(origin, destination)
    transport_mode = select_transport_mode(distance, team_size, budget_tier)
    
    if transport_mode == "bus":
        base_cost = calculate_bus_cost(distance, team_size, sport)
    else:
        base_cost = calculate_flight_cost(distance, team_size, sport)
    
    return base_cost
```

### Step 2: Add Accommodation & Meals
```python
def add_accommodation_meals(base_cost, trip_duration, destination_tier, team_size):
    if requires_overnight(trip_duration):
        hotel_cost = calculate_hotel_cost(team_size, destination_tier)
        meal_cost = calculate_meal_cost(team_size, trip_duration, "overnight")
    else:
        hotel_cost = 0
        meal_cost = calculate_meal_cost(team_size, trip_duration, "day")
    
    return base_cost + hotel_cost + meal_cost
```

### Step 3: Apply Adjustments
```python
def apply_cost_adjustments(base_cost, date, booking_notice, destination):
    seasonal_factor = get_seasonal_multiplier(date)
    timing_factor = get_timing_multiplier(date, booking_notice)
    regional_factor = get_regional_multiplier(destination)
    
    adjusted_cost = base_cost * seasonal_factor * timing_factor * regional_factor
    contingency = adjusted_cost * 0.08  # 8% buffer
    
    return adjusted_cost + contingency
```

---

## 7. Real-World Validation Data Points

### Benchmarking Examples (2024 Prices)
- **West Virginia to Texas**: $812,000 season total (football)
- **Nebraska average**: $175,000 per charter flight
- **Ohio State total**: $10.7M annually all sports
- **Day trip bus rental**: $1,050-3,500 depending on distance
- **Regional charter flight**: $7,000-11,000/hour

### Cost Per Mile Benchmarks
- **Charter Bus**: $3.50-5.50 per mile (all-in cost)
- **Regional Flight**: $25-45 per mile
- **Major Charter Flight**: $15-25 per mile (longer distances more efficient)

---

## 8. FlexTime Integration Features

### Real-Time Cost Optimization
- **Weather Alternative Costing**: Automatic bus backup pricing for flight delays
- **Multi-Team Coordination**: Shared charter costs when multiple teams travel similar routes
- **Flexible Date Modeling**: Show cost variations for ±3 days scheduling flexibility

### Budget Management Tools
- **Cost Cap Enforcement**: Block schedules that exceed budget thresholds
- **Season Budget Tracking**: Running total across all sports with alerts
- **Savings Identification**: Flag opportunities for shared travel or alternative timing

### Reporting and Analytics
- **Cost Per Mile Analysis**: Track efficiency across all transportation modes
- **Seasonal Trend Analysis**: Identify optimal booking windows
- **Sport-Specific Benchmarking**: Compare costs against industry standards

---

## 9. Formula Accuracy and Calibration

### Validation Process
1. **Historical Data Comparison**: Test formula against 2+ years of actual costs
2. **Market Rate Updates**: Quarterly updates from transportation partners
3. **Seasonal Recalibration**: Annual adjustment for inflation and market changes
4. **Conference Benchmarking**: Validate against peer conference spending

### Accuracy Targets
- **±8% for Charter Bus**: Account for route variations and seasonal factors
- **±12% for Charter Flights**: Account for fuel prices and availability
- **±5% for Accommodations**: Account for rate fluctuations and group discounts

This formula framework provides FlexTime with the foundation for accurate, consistent travel cost calculations that can optimize scheduling decisions while maintaining budget discipline across all Big 12 Conference sports programs.