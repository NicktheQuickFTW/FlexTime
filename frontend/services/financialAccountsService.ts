/**
 * Big 12 Financial Accounts Service
 * 
 * Manages the official Big 12 Conference account structure for revenue and expenses
 * Based on the Big 12 Account List (For Staff).csv
 */

export interface FinancialAccount {
  id: string;
  accountType: 'INCOME' | 'EXPENSE';
  accountNumber: string;
  fullName: string;
  description: string;
  category: string;
  isActive: boolean;
  parentCategory?: string;
}

export interface AccountCategory {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  accounts: FinancialAccount[];
  totalAccounts: number;
  description: string;
}

export interface FinancialSummary {
  totalIncomeAccounts: number;
  totalExpenseAccounts: number;
  totalAccounts: number;
  categories: {
    income: AccountCategory[];
    expense: AccountCategory[];
  };
  recentTransactions: any[];
}

class FinancialAccountsService {
  private accounts: FinancialAccount[] = [];
  private categories: Map<string, AccountCategory> = new Map();

  constructor() {
    this.loadAccountsFromCSV();
    this.buildCategories();
  }

  /**
   * Load accounts from the Big 12 Account List CSV structure
   */
  private loadAccountsFromCSV(): void {
    const csvData = this.getAccountData();
    
    this.accounts = csvData.map((row, index) => ({
      id: `account-${row.accountNumber}`,
      accountType: row.accountType as 'INCOME' | 'EXPENSE',
      accountNumber: row.accountNumber,
      fullName: row.fullName,
      description: row.description === '--' ? '' : row.description,
      category: this.categorizeAccount(row.fullName, row.accountType),
      isActive: true,
      parentCategory: this.getParentCategory(row.fullName, row.accountType)
    }));
  }

  /**
   * Categorize accounts based on their names and types
   */
  private categorizeAccount(accountName: string, accountType: string): string {
    const lowerName = accountName.toLowerCase();
    
    if (accountType === 'INCOME') {
      if (lowerName.includes('television') || lowerName.includes('digital') || lowerName.includes('radio')) {
        return 'Media Rights';
      }
      if (lowerName.includes('ncaa') || lowerName.includes('basketball pool') || lowerName.includes('academic performance')) {
        return 'NCAA Revenue';
      }
      if (lowerName.includes('ticket') || lowerName.includes('psl') || lowerName.includes('hosting')) {
        return 'Event Revenue';
      }
      if (lowerName.includes('corporate') || lowerName.includes('sponsors') || lowerName.includes('licensing')) {
        return 'Partnership Revenue';
      }
      if (lowerName.includes('bowl') || lowerName.includes('postseason')) {
        return 'Postseason Revenue';
      }
      if (lowerName.includes('member') || lowerName.includes('assessment') || lowerName.includes('reimbursement')) {
        return 'Member Revenue';
      }
      return 'Other Income';
    } else {
      if (lowerName.includes('travel') || lowerName.includes('lodging') || lowerName.includes('meals')) {
        return 'Travel & Accommodation';
      }
      if (lowerName.includes('officials') || lowerName.includes('game fees')) {
        return 'Officials & Competition';
      }
      if (lowerName.includes('professional serv') || lowerName.includes('audit') || lowerName.includes('lawyers')) {
        return 'Professional Services';
      }
      if (lowerName.includes('media') || lowerName.includes('video') || lowerName.includes('tv production') || lowerName.includes('promotion')) {
        return 'Media & Marketing';
      }
      if (lowerName.includes('hospitality') || lowerName.includes('entertainment') || lowerName.includes('awards')) {
        return 'Events & Hospitality';
      }
      if (lowerName.includes('equipment') || lowerName.includes('supplies') || lowerName.includes('technology') || lowerName.includes('internet')) {
        return 'Operations & Technology';
      }
      if (lowerName.includes('rental') || lowerName.includes('facility') || lowerName.includes('landscape')) {
        return 'Facilities & Rentals';
      }
      return 'General Operations';
    }
  }

  /**
   * Get parent category for hierarchical organization
   */
  private getParentCategory(accountName: string, accountType: string): string {
    if (accountType === 'INCOME') {
      return 'Revenue Operations';
    } else {
      return 'Conference Operations';
    }
  }

  /**
   * Build category mappings
   */
  private buildCategories(): void {
    this.categories.clear();
    
    // Group accounts by category
    const categoryMap = new Map<string, FinancialAccount[]>();
    
    this.accounts.forEach(account => {
      if (!categoryMap.has(account.category)) {
        categoryMap.set(account.category, []);
      }
      categoryMap.get(account.category)!.push(account);
    });
    
    // Create category objects
    categoryMap.forEach((accounts, categoryName) => {
      const accountType = accounts[0].accountType;
      const category: AccountCategory = {
        id: `category-${categoryName.toLowerCase().replace(/\s+/g, '-')}`,
        name: categoryName,
        type: accountType,
        accounts: accounts,
        totalAccounts: accounts.length,
        description: this.getCategoryDescription(categoryName, accountType)
      };
      
      this.categories.set(categoryName, category);
    });
  }

  /**
   * Get description for account category
   */
  private getCategoryDescription(categoryName: string, accountType: string): string {
    const descriptions: Record<string, string> = {
      'Media Rights': 'Television, digital, radio, and data revenue streams',
      'NCAA Revenue': 'NCAA distributions including basketball pool and academic performance funds',
      'Event Revenue': 'Ticket sales, PSL sales, and hosting enhancement fees',
      'Partnership Revenue': 'Corporate partnerships, sponsorships, and licensing deals',
      'Postseason Revenue': 'Bowl games and postseason competition revenue',
      'Member Revenue': 'Member assessments, reimbursements, and institutional contributions',
      'Other Income': 'Interest, gifts in kind, and miscellaneous revenue',
      'Travel & Accommodation': 'Staff travel, lodging, meals, and accommodation expenses',
      'Officials & Competition': 'Officials fees, game expenses, and competition costs',
      'Professional Services': 'Legal, audit, lobbying, and professional consulting services',
      'Media & Marketing': 'Video production, advertising, and promotional activities',
      'Events & Hospitality': 'Conference events, hospitality, awards, and entertainment',
      'Operations & Technology': 'Equipment, supplies, technology, and operational infrastructure',
      'Facilities & Rentals': 'Facility rentals, equipment leasing, and property services',
      'General Operations': 'Administrative expenses, dues, subscriptions, and general operations'
    };
    
    return descriptions[categoryName] || `${accountType.toLowerCase()} related to ${categoryName.toLowerCase()}`;
  }

  /**
   * Get CSV data based on the actual Big 12 Account List
   */
  private getAccountData() {
    return [
      // INCOME ACCOUNTS
      { accountType: 'INCOME', accountNumber: '3010', fullName: 'Television', description: '--' },
      { accountType: 'INCOME', accountNumber: '3015', fullName: 'Digital', description: '--' },
      { accountType: 'INCOME', accountNumber: '3016', fullName: 'Data', description: '--' },
      { accountType: 'INCOME', accountNumber: '3020', fullName: 'Radio', description: '--' },
      { accountType: 'INCOME', accountNumber: '3030', fullName: 'Bowl games', description: '--' },
      { accountType: 'INCOME', accountNumber: '3040', fullName: 'NCAA - basketball pool', description: '--' },
      { accountType: 'INCOME', accountNumber: '3041', fullName: 'NCAA - Academic Performance Fund', description: '--' },
      { accountType: 'INCOME', accountNumber: '3045', fullName: 'NCAA - Grant-in-aid & Spt Spnr', description: '--' },
      { accountType: 'INCOME', accountNumber: '3046', fullName: 'NCAA - Student Athlete Funds', description: '--' },
      { accountType: 'INCOME', accountNumber: '3050', fullName: 'Ticket sales', description: '--' },
      { accountType: 'INCOME', accountNumber: '3051', fullName: 'PSL sales', description: '--' },
      { accountType: 'INCOME', accountNumber: '3060', fullName: 'Corporate partners', description: '--' },
      { accountType: 'INCOME', accountNumber: '3070', fullName: 'Licensing', description: '--' },
      { accountType: 'INCOME', accountNumber: '3080', fullName: 'Hosting enhancements', description: '--' },
      { accountType: 'INCOME', accountNumber: '3090', fullName: 'Other sponsors', description: '--' },
      { accountType: 'INCOME', accountNumber: '3100', fullName: 'Interest', description: '--' },
      { accountType: 'INCOME', accountNumber: '3200', fullName: 'NCAA grant', description: '--' },
      { accountType: 'INCOME', accountNumber: '3300', fullName: 'Other', description: '--' },
      { accountType: 'INCOME', accountNumber: '3400', fullName: 'Member assessments', description: '--' },
      { accountType: 'INCOME', accountNumber: '3500', fullName: 'Member reimbursements', description: '--' },
      { accountType: 'INCOME', accountNumber: '3600', fullName: 'Outside reimbursements', description: '--' },
      { accountType: 'INCOME', accountNumber: '3800', fullName: 'Gift in kind', description: '--' },
      
      // EXPENSE ACCOUNTS
      { accountType: 'EXPENSE', accountNumber: '4105', fullName: 'Awards', description: '--' },
      { accountType: 'EXPENSE', accountNumber: '4110', fullName: 'Charitable donations', description: '--' },
      { accountType: 'EXPENSE', accountNumber: '4115', fullName: 'Clinics', description: '--' },
      { accountType: 'EXPENSE', accountNumber: '4135', fullName: 'Contract labor - supr of offcl', description: '--' },
      { accountType: 'EXPENSE', accountNumber: '4150', fullName: 'Dues', description: '--' },
      { accountType: 'EXPENSE', accountNumber: '4155', fullName: 'Hospitality / entertainment', description: 'receptions, meals for entertaining or meals before a meeting and hospitality for events etc' },
      { accountType: 'EXPENSE', accountNumber: '4158', fullName: 'Landscape services', description: '--' },
      { accountType: 'EXPENSE', accountNumber: '4165', fullName: 'Leased office equipment', description: '--' },
      { accountType: 'EXPENSE', accountNumber: '4170', fullName: 'Lodging and meals', description: 'in-meeting meals, snacks, beverages, direct billed staff hotel rooms, and meeting spaces' },
      { accountType: 'EXPENSE', accountNumber: '4175', fullName: 'Miscellaneous', description: '--' },
      { accountType: 'EXPENSE', accountNumber: '4180', fullName: 'New employee recruitment/relocation', description: '--' },
      { accountType: 'EXPENSE', accountNumber: '4185', fullName: 'Officials game fees & expense', description: '--' },
      { accountType: 'EXPENSE', accountNumber: '4220', fullName: 'Postage - shipping - courier', description: '--' },
      { accountType: 'EXPENSE', accountNumber: '4225', fullName: 'Printing - general', description: '--' },
      { accountType: 'EXPENSE', accountNumber: '4230', fullName: 'Professional serv - audit & tx', description: '--' },
      { accountType: 'EXPENSE', accountNumber: '4231', fullName: 'Professional serv - lobbying', description: 'Professional serv - lobbying' },
      { accountType: 'EXPENSE', accountNumber: '4235', fullName: 'Professional serv - PC', description: '--' },
      { accountType: 'EXPENSE', accountNumber: '4240', fullName: 'Professional serv - lawyers', description: '--' },
      { accountType: 'EXPENSE', accountNumber: '4245', fullName: 'Professional serv - other', description: '--' },
      { accountType: 'EXPENSE', accountNumber: '4250', fullName: 'Promotion item - logo etc.', description: '--' },
      { accountType: 'EXPENSE', accountNumber: '4251', fullName: 'Promotion item - player gifts', description: '--' },
      { accountType: 'EXPENSE', accountNumber: '4256', fullName: 'Promotion - advertising', description: '--' },
      { accountType: 'EXPENSE', accountNumber: '4262', fullName: 'Rental - event facility', description: '--' },
      { accountType: 'EXPENSE', accountNumber: '4263', fullName: 'Rental - equipment', description: '--' },
      { accountType: 'EXPENSE', accountNumber: '4265', fullName: 'Repairs and maintenance', description: '--' },
      { accountType: 'EXPENSE', accountNumber: '4270', fullName: 'Member administered expense', description: '--' },
      { accountType: 'EXPENSE', accountNumber: '4275', fullName: 'Subscriptions', description: '--' },
      { accountType: 'EXPENSE', accountNumber: '4285', fullName: 'Supplies & non capital equipment', description: '--' },
      { accountType: 'EXPENSE', accountNumber: '4287', fullName: 'Signage and banners', description: '--' },
      { accountType: 'EXPENSE', accountNumber: '4290', fullName: 'Telephone', description: '--' },
      { accountType: 'EXPENSE', accountNumber: '4300', fullName: 'Internet - Fiber optics', description: '--' },
      { accountType: 'EXPENSE', accountNumber: '4304', fullName: 'Travel', description: 'individual travel expenses (staff and other)' },
      { accountType: 'EXPENSE', accountNumber: '4325', fullName: 'Video and TV production', description: '--' },
      { accountType: 'EXPENSE', accountNumber: '4980', fullName: 'Gift-In-Kind Expense', description: '--' }
    ];
  }

  /**
   * Get all financial accounts
   */
  public getAllAccounts(): FinancialAccount[] {
    return [...this.accounts];
  }

  /**
   * Get accounts by type
   */
  public getAccountsByType(type: 'INCOME' | 'EXPENSE'): FinancialAccount[] {
    return this.accounts.filter(account => account.accountType === type);
  }

  /**
   * Get accounts by category
   */
  public getAccountsByCategory(categoryName: string): FinancialAccount[] {
    return this.accounts.filter(account => account.category === categoryName);
  }

  /**
   * Get account by number
   */
  public getAccountByNumber(accountNumber: string): FinancialAccount | undefined {
    return this.accounts.find(account => account.accountNumber === accountNumber);
  }

  /**
   * Search accounts
   */
  public searchAccounts(query: string): FinancialAccount[] {
    const lowerQuery = query.toLowerCase();
    return this.accounts.filter(account =>
      account.fullName.toLowerCase().includes(lowerQuery) ||
      account.accountNumber.includes(lowerQuery) ||
      account.description.toLowerCase().includes(lowerQuery) ||
      account.category.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get all categories
   */
  public getCategories(): AccountCategory[] {
    return Array.from(this.categories.values());
  }

  /**
   * Get categories by type
   */
  public getCategoriesByType(type: 'INCOME' | 'EXPENSE'): AccountCategory[] {
    return Array.from(this.categories.values()).filter(category => category.type === type);
  }

  /**
   * Get financial summary
   */
  public getFinancialSummary(): FinancialSummary {
    const incomeAccounts = this.getAccountsByType('INCOME');
    const expenseAccounts = this.getAccountsByType('EXPENSE');
    const incomeCategories = this.getCategoriesByType('INCOME');
    const expenseCategories = this.getCategoriesByType('EXPENSE');

    return {
      totalIncomeAccounts: incomeAccounts.length,
      totalExpenseAccounts: expenseAccounts.length,
      totalAccounts: this.accounts.length,
      categories: {
        income: incomeCategories,
        expense: expenseCategories
      },
      recentTransactions: [] // This would be populated with actual transaction data
    };
  }

  /**
   * Get account statistics
   */
  public getAccountStatistics() {
    const stats = {
      totalAccounts: this.accounts.length,
      incomeAccounts: this.getAccountsByType('INCOME').length,
      expenseAccounts: this.getAccountsByType('EXPENSE').length,
      activeAccounts: this.accounts.filter(a => a.isActive).length,
      categoriesCount: this.categories.size,
      accountsPerCategory: {} as Record<string, number>
    };

    // Calculate accounts per category
    this.categories.forEach((category, name) => {
      stats.accountsPerCategory[name] = category.totalAccounts;
    });

    return stats;
  }
}

// Create and export singleton instance
export const financialAccountsService = new FinancialAccountsService();
export default financialAccountsService;