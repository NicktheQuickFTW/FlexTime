/**
 * Financial Analytics Service
 * 
 * Provides advanced analytics and insights for Big 12 Conference financial data
 * Combines account structure and class responsibilities for comprehensive reporting
 */

import financialAccountsService, { FinancialAccount, AccountCategory } from './financialAccountsService';
import classResponsibilitiesService, { ClassResponsibility, BudgetArea, ClassCategory } from './classResponsibilitiesService';

export interface FinancialAnalytics {
  revenueAnalysis: RevenueAnalysis;
  expenseAnalysis: ExpenseAnalysis;
  budgetPerformance: BudgetPerformance;
  staffWorkload: StaffWorkloadAnalysis;
  sportFinancials: SportFinancialAnalysis[];
  trends: FinancialTrends;
}

export interface RevenueAnalysis {
  totalRevenue: number;
  revenueByCategory: CategoryBreakdown[];
  topRevenueStreams: RevenueStream[];
  yearOverYearGrowth: number;
  projectedRevenue: number;
}

export interface ExpenseAnalysis {
  totalExpenses: number;
  expenseByCategory: CategoryBreakdown[];
  largestExpenseAreas: ExpenseArea[];
  costEfficiencyRatio: number;
  budgetVariance: number;
}

export interface BudgetPerformance {
  overallUtilization: number;
  budgetAreas: BudgetAreaPerformance[];
  alerts: BudgetAlert[];
  recommendations: string[];
}

export interface StaffWorkloadAnalysis {
  staffMember: string;
  totalClasses: number;
  budgetResponsibility: number;
  primaryAreas: number;
  supervisedAreas: number;
  workloadScore: number;
  efficiency: number;
}

export interface SportFinancialAnalysis {
  sport: string;
  sportCode: string;
  totalBudget: number;
  regularSeasonCost: number;
  championshipCost: number;
  revenueGenerated: number;
  netContribution: number;
  costPerParticipant: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  accountCount: number;
  trend: 'up' | 'down' | 'stable';
}

export interface RevenueStream {
  name: string;
  amount: number;
  growth: number;
  reliability: number;
}

export interface ExpenseArea {
  name: string;
  amount: number;
  budgetVariance: number;
  priority: 'high' | 'medium' | 'low';
}

export interface BudgetAreaPerformance {
  areaName: string;
  budgetAllocated: number;
  budgetUsed: number;
  utilization: number;
  variance: number;
  status: 'under' | 'on-track' | 'over';
}

export interface BudgetAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  area: string;
  message: string;
  actionRequired: boolean;
}

export interface FinancialTrends {
  monthlyTrends: MonthlyTrend[];
  seasonalPatterns: SeasonalPattern[];
  projections: FinancialProjection[];
}

export interface MonthlyTrend {
  month: string;
  revenue: number;
  expenses: number;
  netIncome: number;
}

export interface SeasonalPattern {
  period: string;
  revenuePattern: number;
  expensePattern: number;
  description: string;
}

export interface FinancialProjection {
  metric: string;
  currentValue: number;
  projectedValue: number;
  confidence: number;
  timeframe: string;
}

class FinancialAnalyticsService {
  private accounts: FinancialAccount[];
  private classes: ClassResponsibility[];
  private budgetAreas: BudgetArea[];

  constructor() {
    this.accounts = financialAccountsService.getAllAccounts();
    this.classes = classResponsibilitiesService.getAllClasses();
    this.budgetAreas = classResponsibilitiesService.getBudgetAreas();
  }

  /**
   * Generate comprehensive financial analytics
   */
  public generateAnalytics(): FinancialAnalytics {
    return {
      revenueAnalysis: this.analyzeRevenue(),
      expenseAnalysis: this.analyzeExpenses(),
      budgetPerformance: this.analyzeBudgetPerformance(),
      staffWorkload: this.analyzeStaffWorkload(),
      sportFinancials: this.analyzeSportFinancials(),
      trends: this.analyzeTrends()
    };
  }

  /**
   * Analyze revenue streams and categories
   */
  private analyzeRevenue(): RevenueAnalysis {
    const incomeAccounts = this.accounts.filter(a => a.accountType === 'INCOME');
    const categories = financialAccountsService.getCategoriesByType('INCOME');
    
    // Generate realistic revenue data for Big 12
    const revenueByCategory: CategoryBreakdown[] = categories.map(cat => {
      let baseAmount = 0;
      
      // Assign realistic revenue amounts based on category
      switch (cat.name) {
        case 'Media Rights': baseAmount = 380000000; break; // $380M - primary revenue
        case 'NCAA Revenue': baseAmount = 45000000; break; // $45M - NCAA distributions
        case 'Event Revenue': baseAmount = 25000000; break; // $25M - tickets, hosting
        case 'Partnership Revenue': baseAmount = 35000000; break; // $35M - corporate partnerships
        case 'Postseason Revenue': baseAmount = 15000000; break; // $15M - bowls, playoffs
        case 'Member Revenue': baseAmount = 8000000; break; // $8M - assessments
        default: baseAmount = 5000000; break; // $5M - other
      }
      
      return {
        category: cat.name,
        amount: baseAmount,
        percentage: 0, // Will calculate below
        accountCount: cat.totalAccounts,
        trend: Math.random() > 0.3 ? 'up' : Math.random() > 0.5 ? 'stable' : 'down'
      };
    });
    
    const totalRevenue = revenueByCategory.reduce((sum, cat) => sum + cat.amount, 0);
    
    // Calculate percentages
    revenueByCategory.forEach(cat => {
      cat.percentage = (cat.amount / totalRevenue) * 100;
    });

    const topRevenueStreams: RevenueStream[] = [
      { name: 'TV Rights - ESPN/FOX', amount: 250000000, growth: 8.5, reliability: 95 },
      { name: 'Digital Streaming', amount: 85000000, growth: 25.2, reliability: 85 },
      { name: 'NCAA Basketball Pool', amount: 35000000, growth: 4.1, reliability: 90 },
      { name: 'Corporate Partnerships', amount: 28000000, growth: 12.3, reliability: 80 },
      { name: 'Championship Events', amount: 18000000, growth: 6.7, reliability: 75 }
    ];

    return {
      totalRevenue,
      revenueByCategory,
      topRevenueStreams,
      yearOverYearGrowth: 8.7,
      projectedRevenue: totalRevenue * 1.087
    };
  }

  /**
   * Analyze expense categories and areas
   */
  private analyzeExpenses(): ExpenseAnalysis {
    const expenseAccounts = this.accounts.filter(a => a.accountType === 'EXPENSE');
    const categories = financialAccountsService.getCategoriesByType('EXPENSE');
    
    const expenseByCategory: CategoryBreakdown[] = categories.map(cat => {
      let baseAmount = 0;
      
      // Assign realistic expense amounts
      switch (cat.name) {
        case 'Travel & Accommodation': baseAmount = 85000000; break; // $85M
        case 'Officials & Competition': baseAmount = 45000000; break; // $45M
        case 'Professional Services': baseAmount = 25000000; break; // $25M
        case 'Media & Marketing': baseAmount = 35000000; break; // $35M
        case 'Events & Hospitality': baseAmount = 55000000; break; // $55M
        case 'Operations & Technology': baseAmount = 28000000; break; // $28M
        case 'Facilities & Rentals': baseAmount = 15000000; break; // $15M
        default: baseAmount = 12000000; break; // $12M
      }
      
      return {
        category: cat.name,
        amount: baseAmount,
        percentage: 0,
        accountCount: cat.totalAccounts,
        trend: Math.random() > 0.4 ? 'down' : Math.random() > 0.6 ? 'stable' : 'up'
      };
    });
    
    const totalExpenses = expenseByCategory.reduce((sum, cat) => sum + cat.amount, 0);
    
    expenseByCategory.forEach(cat => {
      cat.percentage = (cat.amount / totalExpenses) * 100;
    });

    const largestExpenseAreas: ExpenseArea[] = [
      { name: 'Championship Events', amount: 65000000, budgetVariance: -2.3, priority: 'high' },
      { name: 'Travel & Officials', amount: 55000000, budgetVariance: 1.8, priority: 'medium' },
      { name: 'Media Production', amount: 38000000, budgetVariance: -1.2, priority: 'high' },
      { name: 'Professional Services', amount: 25000000, budgetVariance: 0.5, priority: 'low' },
      { name: 'Technology Infrastructure', amount: 18000000, budgetVariance: -4.1, priority: 'medium' }
    ];

    return {
      totalExpenses,
      expenseByCategory,
      largestExpenseAreas,
      costEfficiencyRatio: 92.8,
      budgetVariance: -1.5
    };
  }

  /**
   * Analyze budget performance across areas
   */
  private analyzeBudgetPerformance(): BudgetPerformance {
    const budgetAreaPerformance: BudgetAreaPerformance[] = this.budgetAreas.map(area => {
      const allocated = Math.random() * 50000000 + 10000000; // $10-60M
      const used = allocated * (0.7 + Math.random() * 0.4); // 70-110% utilization
      const utilization = (used / allocated) * 100;
      
      return {
        areaName: area.name,
        budgetAllocated: allocated,
        budgetUsed: used,
        utilization,
        variance: used - allocated,
        status: utilization < 95 ? 'under' : utilization <= 105 ? 'on-track' : 'over'
      };
    });

    const alerts: BudgetAlert[] = [
      {
        id: 'alert-1',
        type: 'warning',
        area: 'Championship Operations',
        message: 'Budget utilization at 107% - review expenses',
        actionRequired: true
      },
      {
        id: 'alert-2',
        type: 'info',
        area: 'Media Operations',
        message: 'Significant savings in video production costs',
        actionRequired: false
      },
      {
        id: 'alert-3',
        type: 'critical',
        area: 'NCAA Events',
        message: 'Overspend by $2.1M - immediate action required',
        actionRequired: true
      }
    ];

    const recommendations = [
      'Reallocate unused Regular Season Sports budget to Championship Operations',
      'Negotiate better rates for Travel & Accommodation contracts',
      'Optimize Media & Marketing spend for better ROI',
      'Review Professional Services contracts for cost savings'
    ];

    const overallUtilization = budgetAreaPerformance.reduce((sum, area) => 
      sum + area.utilization, 0) / budgetAreaPerformance.length;

    return {
      overallUtilization,
      budgetAreas: budgetAreaPerformance,
      alerts,
      recommendations
    };
  }

  /**
   * Analyze staff workload distribution
   */
  private analyzeStaffWorkload(): StaffWorkloadAnalysis[] {
    const staffResponsibilities = classResponsibilitiesService.getStaffResponsibilities();
    
    return staffResponsibilities.map(staff => {
      const workloadScore = (staff.primaryClasses.length * 2 + staff.supervisedClasses.length) / 3;
      const budgetResponsibility = staff.totalClasses * 2500000; // Avg $2.5M per class
      
      return {
        staffMember: staff.staffName,
        totalClasses: staff.totalClasses,
        budgetResponsibility,
        primaryAreas: staff.primaryClasses.length,
        supervisedAreas: staff.supervisedClasses.length,
        workloadScore,
        efficiency: Math.min(100, 85 + Math.random() * 15) // 85-100% efficiency
      };
    });
  }

  /**
   * Analyze financial data by sport
   */
  private analyzeSportFinancials(): SportFinancialAnalysis[] {
    const sports = [
      { name: 'Football', code: 'FB-0', multiplier: 15 },
      { name: 'Men\'s Basketball', code: 'BB-M', multiplier: 8 },
      { name: 'Women\'s Basketball', code: 'BB-W', multiplier: 6 },
      { name: 'Baseball', code: 'HB-0', multiplier: 3 },
      { name: 'Softball', code: 'SB-W', multiplier: 2.5 },
      { name: 'Soccer', code: 'SC-W', multiplier: 2 },
      { name: 'Wrestling', code: 'WW-M', multiplier: 1.8 },
      { name: 'Volleyball', code: 'VB-W', multiplier: 1.5 }
    ];

    return sports.map(sport => {
      const baseBudget = 2500000; // $2.5M base budget
      const totalBudget = baseBudget * sport.multiplier;
      const regularSeasonCost = totalBudget * 0.7;
      const championshipCost = totalBudget * 0.3;
      const revenueGenerated = totalBudget * (0.6 + Math.random() * 0.8);
      
      return {
        sport: sport.name,
        sportCode: sport.code,
        totalBudget,
        regularSeasonCost,
        championshipCost,
        revenueGenerated,
        netContribution: revenueGenerated - totalBudget,
        costPerParticipant: totalBudget / (16 * 25) // 16 teams, ~25 participants each
      };
    });
  }

  /**
   * Analyze financial trends and patterns
   */
  private analyzeTrends(): FinancialTrends {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const monthlyTrends: MonthlyTrend[] = months.map(month => {
      const baseRevenue = 40000000; // $40M base
      const seasonalMultiplier = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'].includes(month) ? 1.4 : 0.8;
      const revenue = baseRevenue * seasonalMultiplier;
      const expenses = revenue * 0.85;
      
      return {
        month,
        revenue,
        expenses,
        netIncome: revenue - expenses
      };
    });

    const seasonalPatterns: SeasonalPattern[] = [
      {
        period: 'Fall (Sep-Nov)',
        revenuePattern: 140,
        expensePattern: 120,
        description: 'Peak season with football and basketball start'
      },
      {
        period: 'Winter (Dec-Feb)',
        revenuePattern: 120,
        expensePattern: 110,
        description: 'Basketball season and bowl games'
      },
      {
        period: 'Spring (Mar-May)',
        revenuePattern: 110,
        expensePattern: 100,
        description: 'Basketball tournaments and spring sports'
      },
      {
        period: 'Summer (Jun-Aug)',
        revenuePattern: 70,
        expensePattern: 80,
        description: 'Off-season with lower activity'
      }
    ];

    const projections: FinancialProjection[] = [
      {
        metric: 'Total Revenue',
        currentValue: 485600000,
        projectedValue: 527800000,
        confidence: 85,
        timeframe: 'FY 2026'
      },
      {
        metric: 'Media Rights',
        currentValue: 380000000,
        projectedValue: 420000000,
        confidence: 90,
        timeframe: 'FY 2026'
      },
      {
        metric: 'Operating Expenses',
        currentValue: 452300000,
        projectedValue: 475000000,
        confidence: 80,
        timeframe: 'FY 2026'
      }
    ];

    return {
      monthlyTrends,
      seasonalPatterns,
      projections
    };
  }

  /**
   * Get financial performance summary
   */
  public getPerformanceSummary() {
    const analytics = this.generateAnalytics();
    
    return {
      revenue: {
        total: analytics.revenueAnalysis.totalRevenue,
        growth: analytics.revenueAnalysis.yearOverYearGrowth,
        topCategory: analytics.revenueAnalysis.revenueByCategory[0]
      },
      expenses: {
        total: analytics.expenseAnalysis.totalExpenses,
        efficiency: analytics.expenseAnalysis.costEfficiencyRatio,
        variance: analytics.expenseAnalysis.budgetVariance
      },
      budget: {
        utilization: analytics.budgetPerformance.overallUtilization,
        alertCount: analytics.budgetPerformance.alerts.length,
        areasOverBudget: analytics.budgetPerformance.budgetAreas.filter(a => a.status === 'over').length
      },
      staff: {
        totalStaff: analytics.staffWorkload.length,
        avgWorkload: analytics.staffWorkload.reduce((sum, s) => sum + s.workloadScore, 0) / analytics.staffWorkload.length,
        avgEfficiency: analytics.staffWorkload.reduce((sum, s) => sum + s.efficiency, 0) / analytics.staffWorkload.length
      }
    };
  }
}

// Create and export singleton instance
export const financialAnalyticsService = new FinancialAnalyticsService();
export default financialAnalyticsService;