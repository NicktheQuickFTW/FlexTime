# 🧭 Big 12 Sport Research & Analysis Scripts

## **Primary Analysis Systems**

### **🧭 Big 12 Sport Compass Data** *(Primary System)*
**File:** `big12-sport-compass-data.js`

The definitive consolidated system for comprehensive Big 12 sports analysis combining transfer portal data, recruiting rankings, and predictive modeling across all 12 scheduled sports.

**Features:**
- 🎯 **Unified Sport Data**: Single system handles all 12 sports
- 📊 **Transfer Portal Analytics**: Summer 2025 portal data and rankings
- 📈 **Recruiting Data**: Complete recruiting class rankings and analysis  
- 🧭 **COMPASS Ratings**: Advanced predictive projections and competitive positioning
- 🏆 **Master Execution**: Complete Big 12 ecosystem analysis

**Usage:**
```bash
# Single sport analysis
node big12-sport-compass-data.js single football
node big12-sport-compass-data.js single basketball mens
node big12-sport-compass-data.js single tennis womens

# Complete Big 12 analysis (all 12 sports)
node big12-sport-compass-data.js master
```

### **🎯 Unified Sport Pipeline Analysis** *(Secondary System)*
**File:** `run-unified-sport-pipeline-analysis.js`

Alternative unified methodology for sport-specific pipeline assessment with dynamic configuration.

**Usage:**
```bash
node run-unified-sport-pipeline-analysis.js football
node run-unified-sport-pipeline-analysis.js basketball mens
node run-unified-sport-pipeline-analysis.js volleyball
```

### **🏆 All Unified Sports Analysis** *(Legacy System)*
**File:** `run-all-unified-sports-analysis.js`

Legacy master execution script for all sports using unified methodology.

---

## **🎯 The 12 Sports We Schedule:**

1. **🏈 Football** (16 teams)
2. **🏀 Men's Basketball** (16 teams) 
3. **🏀 Women's Basketball** (16 teams)
4. **🏐 Volleyball** (15 teams)
5. **⚽ Soccer** (16 teams)  
6. **🎾 Men's Tennis** (9 teams)
7. **🎾 Women's Tennis** (16 teams)
8. **🤸 Gymnastics** (7 teams)
9. **🤼 Wrestling** (14 teams)
10. **🥎 Softball** (11 teams)
11. **🥍 Lacrosse** (6 teams)
12. **⚾ Baseball** (14 teams)

---

## **🚀 Recommended Workflow**

### **For Individual Sport Analysis:**
```bash
# Use the primary Compass Data system
node big12-sport-compass-data.js single <sport> [gender]
```

### **For Complete Big 12 Analysis:**
```bash
# Execute master data analysis
node big12-sport-compass-data.js master
```

### **System Capabilities:**
- ✅ **Complete 2025-26 season preparation data**
- ✅ **Advanced transfer portal rankings and impact analysis**
- ✅ **Comprehensive recruiting class data with pipeline analysis**
- ✅ **Dynamic COMPASS ratings with predictive projections**
- ✅ **Real-time competitive positioning and championship probability**
- ✅ **Advanced roster construction and depth analysis**

---

## **📊 Output & Results**

**Data Directory:** `/data/compass_data/`

**Files Generated:**
- Individual sport: `compass_data_{sport}_{date}.json`
- Master analysis: `master_compass_data_{date}.json`

**Analysis Components:**
- Transfer Portal Data
- COMPASS Ratings Projections  
- Sport Configuration Data
- Execution Metrics & Performance Analysis

---

*Last Updated: May 29, 2025*  
*Primary System: Big 12 Sport Compass Data v2.0.0*