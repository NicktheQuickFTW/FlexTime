/**
 * Big 12 Financial Dashboard Component
 * 
 * Comprehensive financial management dashboard with account tracking and budget responsibilities
 * Integrates Big 12 account structure and class responsibilities for complete financial oversight
 * Built with 21st-dev Magic AI design principles and glassmorphic UI
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, TrendingUp, TrendingDown, BarChart3, PieChart,
  Users, Building, Target, Calendar, Filter, Search, Download,
  ArrowUpRight, ArrowDownRight, Minus, Plus, Eye, Settings,
  CreditCard, Wallet, Receipt, FileText, AlertCircle, CheckCircle,
  ShoppingCart, Briefcase, Award, Globe, Activity, Clock
} from 'lucide-react';

import financialAccountsService, { 
  FinancialAccount, 
  AccountCategory, 
  FinancialSummary 
} from '@/services/financialAccountsService';

import classResponsibilitiesService, {
  ClassResponsibility,
  StaffResponsibility,
  BudgetArea,
  ClassCategory
} from '@/services/classResponsibilitiesService';

interface FinancialDashboardProps {
  className?: string;
}

// Financial Metric Card Component
const FinancialMetricCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  color: string;
  onClick?: () => void;
}> = ({ title, value, subtitle, icon, trend, trendValue, color, onClick }) => (
  <motion.div
    className={`ft-glass-card p-6 cursor-pointer ${onClick ? 'hover:bg-white/15' : ''}`}
    whileHover={{ scale: onClick ? 1.02 : 1 }}
    whileTap={{ scale: onClick ? 0.98 : 1 }}
    onClick={onClick}
  >
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <div className="text-gray-400 text-sm font-medium mb-2">{title}</div>
        <div className="flex items-baseline">
          <div className="text-3xl font-bold text-white">{value}</div>
          {subtitle && (
            <div className="text-gray-400 text-sm ml-2">{subtitle}</div>
          )}
        </div>
        {trend && trendValue && (
          <div className="flex items-center mt-2">
            {trend === 'up' && <ArrowUpRight className="w-4 h-4 text-green-400 mr-1" />}
            {trend === 'down' && <ArrowDownRight className="w-4 h-4 text-red-400 mr-1" />}
            {trend === 'stable' && <Minus className="w-4 h-4 text-gray-400 mr-1" />}
            <span className={`text-sm ${
              trend === 'up' ? 'text-green-400' : 
              trend === 'down' ? 'text-red-400' : 'text-gray-400'
            }`}>
              {trendValue}
            </span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        {icon}
      </div>
    </div>
  </motion.div>
);

// Account Category Card Component
const AccountCategoryCard: React.FC<{ 
  category: AccountCategory; 
  onViewDetails: (category: AccountCategory) => void;
}> = ({ category, onViewDetails }) => (
  <motion.div
    className="ft-glass-card p-4 hover:bg-white/12 cursor-pointer"
    whileHover={{ scale: 1.01 }}
    onClick={() => onViewDetails(category)}
    layout
  >
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full mr-3 ${
          category.type === 'INCOME' ? 'bg-green-400' : 'bg-red-400'
        }`} />
        <h3 className="text-white font-semibold text-sm">{category.name}</h3>
      </div>
      <div className="text-cyan-400 text-sm font-medium">{category.totalAccounts}</div>
    </div>
    
    <p className="text-gray-400 text-xs mb-3 line-clamp-2">{category.description}</p>
    
    <div className="flex justify-between items-center">
      <span className="text-gray-500 text-xs">
        {category.type === 'INCOME' ? 'Revenue' : 'Expense'} Category
      </span>
      <button className="text-cyan-400 text-xs hover:text-cyan-300 transition-colors">
        View Details →
      </button>
    </div>
  </motion.div>
);

// Budget Area Card Component
const BudgetAreaCard: React.FC<{ 
  area: BudgetArea; 
  onViewDetails: (area: BudgetArea) => void;
}> = ({ area, onViewDetails }) => (
  <motion.div
    className="ft-glass-card p-4 hover:bg-white/12 cursor-pointer"
    whileHover={{ scale: 1.01 }}
    onClick={() => onViewDetails(area)}
    layout
  >
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-white font-semibold text-sm">{area.name}</h3>
      <div className="text-purple-400 text-sm font-medium">{area.totalClasses}</div>
    </div>
    
    <p className="text-gray-400 text-xs mb-3 line-clamp-2">{area.description}</p>
    
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Users className="w-3 h-3 text-gray-500" />
        <span className="text-gray-500 text-xs">{area.primaryStaff.length} staff</span>
      </div>
      <button className="text-purple-400 text-xs hover:text-purple-300 transition-colors">
        Manage →
      </button>
    </div>
  </motion.div>
);

// Staff Responsibility Summary Component
const StaffSummaryCard: React.FC<{ 
  staff: StaffResponsibility;
  onViewDetails: (staff: StaffResponsibility) => void;
}> = ({ staff, onViewDetails }) => (
  <motion.div
    className="ft-glass-card p-4 hover:bg-white/12 cursor-pointer"
    whileHover={{ scale: 1.01 }}
    onClick={() => onViewDetails(staff)}
    layout
  >
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs mr-3">
          {staff.staffName.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <h3 className="text-white font-semibold text-sm">{staff.staffName}</h3>
      </div>
      <div className="text-blue-400 text-sm font-medium">{staff.totalClasses}</div>
    </div>
    
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">Primary:</span>
        <span className="text-green-400">{staff.primaryClasses.length}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">Supervised:</span>
        <span className="text-orange-400">{staff.supervisedClasses.length}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">Sports:</span>
        <span className="text-purple-400">{staff.sports.length}</span>
      </div>
    </div>
  </motion.div>
);

export const FinancialDashboard: React.FC<FinancialDashboardProps> = ({
  className = ""
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'budgets' | 'staff'>('overview');
  const [selectedCategory, setSelectedCategory] = useState<AccountCategory | null>(null);
  const [selectedBudgetArea, setSelectedBudgetArea] = useState<BudgetArea | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Get data from services
  const financialSummary = useMemo(() => financialAccountsService.getFinancialSummary(), []);
  const accountStats = useMemo(() => financialAccountsService.getAccountStatistics(), []);
  const classSummary = useMemo(() => classResponsibilitiesService.getClassSummary(), []);
  const staffResponsibilities = useMemo(() => classResponsibilitiesService.getStaffResponsibilities(), []);
  const budgetAreas = useMemo(() => classResponsibilitiesService.getBudgetAreas(), []);

  // Calculate financial overview metrics
  const overviewMetrics = useMemo(() => {
    return {
      totalRevenue: 485600000, // Sample data - in real app would come from transactions
      totalExpenses: 452300000,
      netIncome: 33300000,
      budgetUtilization: 93.2,
      accountsManaged: accountStats.totalAccounts,
      classesTracked: classSummary.totalClasses,
      staffInvolved: staffResponsibilities.length,
      budgetAreasActive: budgetAreas.length
    };
  }, [accountStats, classSummary, staffResponsibilities, budgetAreas]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Financial Management</h2>
          <p className="text-gray-400">
            Big 12 Conference financial oversight and budget tracking
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search accounts, classes, staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 w-64"
            />
          </div>

          <button className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-300 text-sm transition-colors flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center space-x-1 bg-white/5 rounded-xl p-1">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'accounts', label: 'Accounts', icon: CreditCard },
          { id: 'budgets', label: 'Budget Areas', icon: Target },
          { id: 'staff', label: 'Staff', icon: Users }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center px-4 py-2 rounded-lg text-sm transition-colors ${
              activeTab === tab.id 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30' 
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FinancialMetricCard
                title="Total Revenue"
                value="$485.6M"
                icon={<TrendingUp className="w-6 h-6 text-white" />}
                trend="up"
                trendValue="+8.2%"
                color="bg-green-500/20"
              />
              
              <FinancialMetricCard
                title="Total Expenses"
                value="$452.3M"
                icon={<TrendingDown className="w-6 h-6 text-white" />}
                trend="down"
                trendValue="-2.1%"
                color="bg-red-500/20"
              />
              
              <FinancialMetricCard
                title="Net Income"
                value="$33.3M"
                icon={<DollarSign className="w-6 h-6 text-white" />}
                trend="up"
                trendValue="+15.4%"
                color="bg-cyan-500/20"
              />
              
              <FinancialMetricCard
                title="Budget Utilization"
                value="93.2%"
                icon={<Target className="w-6 h-6 text-white" />}
                trend="stable"
                trendValue="On target"
                color="bg-purple-500/20"
              />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="ft-glass-card p-4 text-center">
                <div className="text-2xl font-bold text-white">{overviewMetrics.accountsManaged}</div>
                <div className="text-gray-400 text-sm">Accounts Managed</div>
                <div className="text-cyan-400 text-xs mt-1">
                  {financialSummary.totalIncomeAccounts} income / {financialSummary.totalExpenseAccounts} expense
                </div>
              </div>
              
              <div className="ft-glass-card p-4 text-center">
                <div className="text-2xl font-bold text-white">{overviewMetrics.classesTracked}</div>
                <div className="text-gray-400 text-sm">Budget Classes</div>
                <div className="text-purple-400 text-xs mt-1">
                  {classSummary.sportsCovered.length} sports covered
                </div>
              </div>
              
              <div className="ft-glass-card p-4 text-center">
                <div className="text-2xl font-bold text-white">{overviewMetrics.staffInvolved}</div>
                <div className="text-gray-400 text-sm">Staff Members</div>
                <div className="text-green-400 text-xs mt-1">
                  Active responsibilities
                </div>
              </div>
              
              <div className="ft-glass-card p-4 text-center">
                <div className="text-2xl font-bold text-white">{overviewMetrics.budgetAreasActive}</div>
                <div className="text-gray-400 text-sm">Budget Areas</div>
                <div className="text-orange-400 text-xs mt-1">
                  All departments
                </div>
              </div>
            </div>

            {/* Revenue vs Expenses Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Income Categories */}
              <div className="ft-glass-card p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 text-green-400 mr-2" />
                  Revenue Categories
                </h3>
                <div className="space-y-3">
                  {financialSummary.categories.income.slice(0, 5).map((category, index) => (
                    <div key={category.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <div className="text-white text-sm font-medium">{category.name}</div>
                        <div className="text-gray-400 text-xs">{category.totalAccounts} accounts</div>
                      </div>
                      <div className="text-green-400 text-sm font-bold">
                        ${(Math.random() * 100 + 20).toFixed(1)}M
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expense Categories */}
              <div className="ft-glass-card p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <TrendingDown className="w-5 h-5 text-red-400 mr-2" />
                  Expense Categories
                </h3>
                <div className="space-y-3">
                  {financialSummary.categories.expense.slice(0, 5).map((category, index) => (
                    <div key={category.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <div className="text-white text-sm font-medium">{category.name}</div>
                        <div className="text-gray-400 text-xs">{category.totalAccounts} accounts</div>
                      </div>
                      <div className="text-red-400 text-sm font-bold">
                        ${(Math.random() * 80 + 10).toFixed(1)}M
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Accounts Tab */}
        {activeTab === 'accounts' && (
          <motion.div
            key="accounts"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {financialSummary.categories.income.concat(financialSummary.categories.expense)
                .filter(category => 
                  !searchTerm || 
                  category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  category.description.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((category, index) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <AccountCategoryCard 
                      category={category} 
                      onViewDetails={setSelectedCategory}
                    />
                  </motion.div>
                ))}
            </div>
          </motion.div>
        )}

        {/* Budget Areas Tab */}
        {activeTab === 'budgets' && (
          <motion.div
            key="budgets"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {budgetAreas
                .filter(area => 
                  !searchTerm || 
                  area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  area.description.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((area, index) => (
                  <motion.div
                    key={area.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <BudgetAreaCard 
                      area={area} 
                      onViewDetails={setSelectedBudgetArea}
                    />
                  </motion.div>
                ))}
            </div>
          </motion.div>
        )}

        {/* Staff Tab */}
        {activeTab === 'staff' && (
          <motion.div
            key="staff"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {staffResponsibilities
                .filter(staff => 
                  !searchTerm || 
                  staff.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  staff.departments.some(d => d.toLowerCase().includes(searchTerm.toLowerCase()))
                )
                .map((staff, index) => (
                  <motion.div
                    key={staff.staffName}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <StaffSummaryCard 
                      staff={staff} 
                      onViewDetails={(staff) => console.log('View staff details:', staff)}
                    />
                  </motion.div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FinancialDashboard;