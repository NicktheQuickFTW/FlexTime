/**
 * Big 12 Class Responsibilities Service
 * 
 * Manages budget class codes and responsibilities by sport/area
 * Based on the Big 12 Class responsibilities - (For Staff) FY26.csv
 */

export interface ClassResponsibility {
  id: string;
  classCode: string;
  description: string;
  primaryStaff: string;
  supervisor: string;
  category: ClassCategory;
  sportCode?: string;
  department: string;
  budgetArea: string;
  isActive: boolean;
}

export type ClassCategory = 
  | 'Member Programs'
  | 'Office Administration' 
  | 'Academic Services'
  | 'Conference Meetings'
  | 'Media & Events'
  | 'Marketing & Partnerships'
  | 'Regular Season Sports'
  | 'Conference Championships'
  | 'NCAA Postseason'
  | 'NCAA Managed Events';

export interface StaffResponsibility {
  staffName: string;
  primaryClasses: ClassResponsibility[];
  supervisedClasses: ClassResponsibility[];
  totalClasses: number;
  departments: string[];
  sports: string[];
}

export interface BudgetArea {
  id: string;
  name: string;
  category: ClassCategory;
  classes: ClassResponsibility[];
  totalClasses: number;
  primaryStaff: string[];
  supervisors: string[];
  description: string;
}

export interface ClassSummary {
  totalClasses: number;
  categoryCounts: Record<ClassCategory, number>;
  staffCounts: Record<string, number>;
  sportsCovered: string[];
  budgetAreas: BudgetArea[];
}

class ClassResponsibilitiesService {
  private classes: ClassResponsibility[] = [];
  private staffResponsibilities: Map<string, StaffResponsibility> = new Map();
  private budgetAreas: Map<string, BudgetArea> = new Map();

  constructor() {
    this.loadClassesFromCSV();
    this.buildStaffResponsibilities();
    this.buildBudgetAreas();
  }

  /**
   * Load class responsibilities from CSV data
   */
  private loadClassesFromCSV(): void {
    const csvData = this.getClassData();
    
    this.classes = csvData.map((row, index) => ({
      id: `class-${index + 1}`,
      classCode: row.CLASS,
      description: row.DESCRIPTION,
      primaryStaff: row.Primary,
      supervisor: row.Supervisor,
      category: this.categorizeClass(row.CLASS, row.DESCRIPTION),
      sportCode: this.extractSportCode(row.CLASS, row.DESCRIPTION),
      department: this.getDepartment(row.CLASS, row.DESCRIPTION),
      budgetArea: this.getBudgetArea(row.CLASS, row.DESCRIPTION),
      isActive: true
    }));
  }

  /**
   * Categorize class based on code and description
   */
  private categorizeClass(classCode: string, description: string): ClassCategory {
    const lowerDesc = description.toLowerCase();
    const code = classCode.toUpperCase();
    
    // Member Programs
    if (code.includes('N-020')) {
      return 'Member Programs';
    }
    
    // Office Administration
    if (code.includes('O-010')) {
      return 'Office Administration';
    }
    
    // Academic and Student Services
    if (code.includes('O-020')) {
      return 'Academic Services';
    }
    
    // Conference Meetings and Events
    if (code.includes('O-030')) {
      return 'Conference Meetings';
    }
    
    // Media, Events, and Communications
    if (code.includes('O-040')) {
      return 'Media & Events';
    }
    
    // Marketing, Partnerships, and Branding
    if (code.includes('O-09')) {
      return 'Marketing & Partnerships';
    }
    
    // Regular Season Sports (RS)
    if (code.includes('S-050') || lowerDesc.includes('rs -')) {
      return 'Regular Season Sports';
    }
    
    // Conference Championships (CC)
    if (code.includes('S-060') || lowerDesc.includes('cc -')) {
      return 'Conference Championships';
    }
    
    // NCAA Postseason
    if (code.includes('S-070') || lowerDesc.includes('ncaa/post season')) {
      return 'NCAA Postseason';
    }
    
    // NCAA Managed Events
    if (code.includes('S-080') || lowerDesc.includes('ncaa managed')) {
      return 'NCAA Managed Events';
    }
    
    return 'Office Administration'; // Default
  }

  /**
   * Extract sport code from class code
   */
  private extractSportCode(classCode: string, description: string): string | undefined {
    const sportCodes: Record<string, string> = {
      'BB-M': 'Men\'s Basketball',
      'BB-W': 'Women\'s Basketball', 
      'FB-0': 'Football',
      'BV-W': 'Beach Volleyball',
      'CC-M': 'Men\'s Cross Country',
      'CC-W': 'Women\'s Cross Country',
      'EQ-W': 'Equestrian',
      'GF-M': 'Men\'s Golf',
      'GF-W': 'Women\'s Golf',
      'GY-W': 'Gymnastics',
      'HB-0': 'Baseball',
      'IT-M': 'Men\'s Indoor Track',
      'IT-W': 'Women\'s Indoor Track',
      'LX-W': 'Lacrosse',
      'OT-M': 'Men\'s Outdoor Track',
      'OT-W': 'Women\'s Outdoor Track',
      'RW-W': 'Rowing',
      'SB-W': 'Softball',
      'SC-W': 'Soccer',
      'SD-M': 'Men\'s Swimming & Diving',
      'SD-W': 'Women\'s Swimming & Diving',
      'TN-M': 'Men\'s Tennis',
      'TN-W': 'Women\'s Tennis',
      'VB-W': 'Volleyball',
      'WW-M': 'Wrestling',
      'XX-0': 'Unallocated'
    };

    for (const [code, sport] of Object.entries(sportCodes)) {
      if (classCode.includes(code)) {
        return sport;
      }
    }

    return undefined;
  }

  /**
   * Get department based on class code and description
   */
  private getDepartment(classCode: string, description: string): string {
    const code = classCode.toUpperCase();
    const lowerDesc = description.toLowerCase();
    
    if (code.includes('N-020')) return 'Member Programs';
    if (code.includes('O-010')) return 'Administration';
    if (code.includes('O-020')) return 'Academic Affairs';
    if (code.includes('O-030')) return 'Conference Operations';
    if (code.includes('O-040')) return 'Media & Communications';
    if (code.includes('O-09')) return 'Marketing & Partnerships';
    if (code.includes('S-050')) return 'Regular Season Operations';
    if (code.includes('S-060')) return 'Championship Operations';
    if (code.includes('S-070')) return 'NCAA Relations';
    if (code.includes('S-080')) return 'NCAA Managed Events';
    
    return 'General Operations';
  }

  /**
   * Get budget area based on class information
   */
  private getBudgetArea(classCode: string, description: string): string {
    const code = classCode.toUpperCase();
    
    if (code.includes('N-020')) return 'Member Services';
    if (code.includes('O-010')) return 'Corporate Operations';
    if (code.includes('O-020')) return 'Student-Athlete Services';
    if (code.includes('O-030')) return 'Conference Governance';
    if (code.includes('O-040')) return 'Media Operations';
    if (code.includes('O-09')) return 'Revenue Generation';
    if (code.includes('S-050')) return 'Regular Season Sports';
    if (code.includes('S-060')) return 'Conference Championships';
    if (code.includes('S-070')) return 'NCAA Postseason';
    if (code.includes('S-080')) return 'NCAA Events';
    
    return 'General Budget';
  }

  /**
   * Build staff responsibilities mapping
   */
  private buildStaffResponsibilities(): void {
    this.staffResponsibilities.clear();
    
    // Track both primary and supervisory responsibilities
    const staffMap = new Map<string, { primary: ClassResponsibility[], supervised: ClassResponsibility[] }>();
    
    this.classes.forEach(classResp => {
      // Primary staff
      if (!staffMap.has(classResp.primaryStaff)) {
        staffMap.set(classResp.primaryStaff, { primary: [], supervised: [] });
      }
      staffMap.get(classResp.primaryStaff)!.primary.push(classResp);
      
      // Supervisor (if different from primary)
      if (classResp.supervisor !== classResp.primaryStaff) {
        if (!staffMap.has(classResp.supervisor)) {
          staffMap.set(classResp.supervisor, { primary: [], supervised: [] });
        }
        staffMap.get(classResp.supervisor)!.supervised.push(classResp);
      }
    });
    
    // Create staff responsibility objects
    staffMap.forEach((data, staffName) => {
      const allClasses = [...data.primary, ...data.supervised];
      const departments = [...new Set(allClasses.map(c => c.department))];
      const sports = [...new Set(allClasses.map(c => c.sportCode).filter(Boolean))];
      
      this.staffResponsibilities.set(staffName, {
        staffName,
        primaryClasses: data.primary,
        supervisedClasses: data.supervised,
        totalClasses: allClasses.length,
        departments,
        sports
      });
    });
  }

  /**
   * Build budget areas mapping
   */
  private buildBudgetAreas(): void {
    this.budgetAreas.clear();
    
    // Group classes by budget area
    const areaMap = new Map<string, ClassResponsibility[]>();
    
    this.classes.forEach(classResp => {
      if (!areaMap.has(classResp.budgetArea)) {
        areaMap.set(classResp.budgetArea, []);
      }
      areaMap.get(classResp.budgetArea)!.push(classResp);
    });
    
    // Create budget area objects
    areaMap.forEach((classes, areaName) => {
      const primaryStaff = [...new Set(classes.map(c => c.primaryStaff))];
      const supervisors = [...new Set(classes.map(c => c.supervisor))];
      const category = classes[0].category; // All classes in area should have same category
      
      this.budgetAreas.set(areaName, {
        id: `area-${areaName.toLowerCase().replace(/\s+/g, '-')}`,
        name: areaName,
        category,
        classes,
        totalClasses: classes.length,
        primaryStaff,
        supervisors,
        description: this.getBudgetAreaDescription(areaName, category)
      });
    });
  }

  /**
   * Get budget area description
   */
  private getBudgetAreaDescription(areaName: string, category: ClassCategory): string {
    const descriptions: Record<string, string> = {
      'Member Services': 'Programs and services provided to member institutions',
      'Corporate Operations': 'General administrative and operational functions',
      'Student-Athlete Services': 'Academic support and student-athlete development programs',
      'Conference Governance': 'Board meetings, business meetings, and governance activities',
      'Media Operations': 'Media production, communications, and broadcast operations',
      'Revenue Generation': 'Marketing, partnerships, sponsorships, and revenue activities',
      'Regular Season Sports': 'Regular season competition management and operations',
      'Conference Championships': 'Conference championship event management',
      'NCAA Postseason': 'NCAA postseason competition support and coordination',
      'NCAA Events': 'NCAA-managed championship events and tournaments',
      'General Budget': 'Miscellaneous and general operational expenses'
    };
    
    return descriptions[areaName] || `Budget area for ${category} activities`;
  }

  /**
   * Get CSV data based on actual class responsibilities
   */
  private getClassData() {
    return [
      { CLASS: 'N-020-31-00-0', DESCRIPTION: 'Member Program Administration', Primary: 'Catrina', Supervisor: 'Catrina' },
      { CLASS: 'O-010-00-00-0', DESCRIPTION: 'Office - General & Administrative', Primary: 'Anna', Supervisor: 'Catrina' },
      { CLASS: 'O-010-10-00-0', DESCRIPTION: 'Office - Salaries & Benefits', Primary: 'Derek', Supervisor: 'Catrina' },
      { CLASS: 'O-010-14-00-0', DESCRIPTION: 'Office - FSA/HRA/Ins. Deductions', Primary: 'Derek', Supervisor: 'Catrina' },
      { CLASS: 'O-010-20-00-0', DESCRIPTION: 'Legal Services', Primary: 'Jessica', Supervisor: 'Jessica' },
      { CLASS: 'O-010-25-00-0', DESCRIPTION: 'Building Occupancy', Primary: 'Anna', Supervisor: 'Catrina' },
      { CLASS: 'O-010-30-00-0', DESCRIPTION: 'Office Technology', Primary: 'Catrina', Supervisor: 'Catrina' },
      { CLASS: 'O-020-22-00-0', DESCRIPTION: 'Academics', Primary: 'Nicole', Supervisor: 'Jenn H' },
      { CLASS: 'O-020-24-CM-0', DESCRIPTION: 'Compliance & Governance', Primary: 'Andy', Supervisor: 'Jessica' },
      { CLASS: 'O-020-24-SS-0', DESCRIPTION: 'Athletic Student Services', Primary: 'Nicole', Supervisor: 'Jenn H' },
      { CLASS: 'O-020-30-00-0', DESCRIPTION: 'Diversity Program Administration', Primary: 'Jenn H', Supervisor: 'Jenn H' },
      { CLASS: 'O-030-31-00-0', DESCRIPTION: 'Spring Business Meeting', Primary: 'Bob', Supervisor: 'Bob' },
      { CLASS: 'O-030-32-00-0', DESCRIPTION: 'Athletics Directors Meeting', Primary: 'Bob', Supervisor: 'Bob' },
      { CLASS: 'O-030-33-00-0', DESCRIPTION: 'Board of Directors Meeting', Primary: 'Bob', Supervisor: 'Bob' },
      { CLASS: 'O-030-36-00-0', DESCRIPTION: 'Conference meetings (all other)', Primary: 'Bob', Supervisor: 'Bob' },
      { CLASS: 'O-030-39-00-0', DESCRIPTION: 'Community', Primary: 'Jenn H', Supervisor: 'Jenn H' },
      { CLASS: 'O-040-42-BB-M', DESCRIPTION: 'Media Day - basketball - men', Primary: 'Brian', Supervisor: 'Brian' },
      { CLASS: 'O-040-42-BB-W', DESCRIPTION: 'Media Day - basketball - women', Primary: 'Dayna', Supervisor: 'Dayna' },
      { CLASS: 'O-040-42-FB-0', DESCRIPTION: 'Media Day - football', Primary: 'Scott', Supervisor: 'Scott' },
      { CLASS: 'O-040-44-00-0', DESCRIPTION: 'Conference Events', Primary: 'Anna', Supervisor: 'Catrina' },
      { CLASS: 'O-040-44-00-1', DESCRIPTION: 'Big 12 Homecoming', Primary: 'Jenn/Katie', Supervisor: 'Jenn H' },
      { CLASS: 'O-040-44-00-3', DESCRIPTION: 'Pro Day', Primary: 'Scott', Supervisor: 'Scott' },
      { CLASS: 'O-040-44-00-4', DESCRIPTION: 'Business Summit', Primary: 'Katie', Supervisor: 'Tyrel' },
      { CLASS: 'O-040-44-00-6', DESCRIPTION: 'Health & Wellbeing Summit', Primary: 'Scott', Supervisor: 'Scott' },
      { CLASS: 'O-040-45-00-0', DESCRIPTION: 'Broadcast, production & emerging platforms', Primary: 'Kauri', Supervisor: 'Tyrel' },
      { CLASS: 'O-040-46-00-0', DESCRIPTION: 'Communications services', Primary: 'Clark', Supervisor: 'Clark' },
      { CLASS: 'O-040-49-00-0', DESCRIPTION: 'Football video replay', Primary: 'Scott', Supervisor: 'Scott' },
      { CLASS: 'O-092-00-00-0', DESCRIPTION: 'Conference initiatives', Primary: 'Catrina', Supervisor: 'Catrina' },
      { CLASS: 'O-093-00-00-0', DESCRIPTION: 'Conference Branding', Primary: 'Katie', Supervisor: 'Tyrel' },
      { CLASS: 'O-093-10-00-0', DESCRIPTION: 'Conference Marketing', Primary: 'Katie', Supervisor: 'Tyrel' },
      { CLASS: 'O-093-20-00-0', DESCRIPTION: 'Content & Digital', Primary: 'Keena', Supervisor: 'Katie' },
      { CLASS: 'O-094-00-00-0', DESCRIPTION: 'Partnership Sales', Primary: 'Sean', Supervisor: 'Sean' },
      { CLASS: 'O-095-00-00-0', DESCRIPTION: 'PSL Program', Primary: 'Sean', Supervisor: 'Sean' },
      { CLASS: 'O-098-00-00-0', DESCRIPTION: 'Member distribution', Primary: 'Catrina', Supervisor: 'Catrina' },
      
      // Regular Season Sports
      { CLASS: 'S-050-00-BB-M', DESCRIPTION: 'RS - Basketball - M', Primary: 'Brian', Supervisor: 'Brian' },
      { CLASS: 'S-050-00-BB-W', DESCRIPTION: 'RS - Basketball - W', Primary: 'Dayna', Supervisor: 'Dayna' },
      { CLASS: 'S-050-00-BV-W', DESCRIPTION: 'RS - Beach Volleyball - W', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-050-00-CC-M', DESCRIPTION: 'RS - Cross Country - M', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-050-00-CC-W', DESCRIPTION: 'RS - Cross Country - W', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-050-00-EQ-W', DESCRIPTION: 'RS - Equestrian - W', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-050-00-FB-0', DESCRIPTION: 'RS - Football', Primary: 'Scott', Supervisor: 'Scott' },
      { CLASS: 'S-050-00-GF-M', DESCRIPTION: 'RS - Golf - M', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-050-00-GF-W', DESCRIPTION: 'RS - Golf - W', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-050-00-GY-W', DESCRIPTION: 'RS - Gymnastics -W', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-050-00-HB-0', DESCRIPTION: 'RS - Baseball', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-050-00-IT-M', DESCRIPTION: 'RS - Indoor Track & Field - M', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-050-00-IT-W', DESCRIPTION: 'RS - Indoor Track & Field - W', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-050-00-LX-W', DESCRIPTION: 'RS - Lacrosse - W', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-050-00-OT-M', DESCRIPTION: 'RS - Outdoor Track & Field - M', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-050-00-OT-W', DESCRIPTION: 'RS - Outdoor Track & Field - W', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-050-00-RW-W', DESCRIPTION: 'RS - Rowing - W', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-050-00-SB-W', DESCRIPTION: 'RS - Softball - W', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-050-00-SC-W', DESCRIPTION: 'RS - Soccer', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-050-00-SD-M', DESCRIPTION: 'RS - Swimming & Diving - M', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-050-00-SD-W', DESCRIPTION: 'RS - Swimming & Diving - W', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-050-00-TN-M', DESCRIPTION: 'RS - Tennis - M', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-050-00-TN-W', DESCRIPTION: 'RS - Tennis - W', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-050-00-VB-W', DESCRIPTION: 'RS - Volleyball', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-050-00-WW-M', DESCRIPTION: 'RS - Wrestling', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-050-00-XX-0', DESCRIPTION: 'RS - Unallocated', Primary: 'Lizzie', Supervisor: 'Scott' },
      
      // Conference Championships
      { CLASS: 'S-060-00-BB-M', DESCRIPTION: 'CC - Basketball - M', Primary: 'Brian', Supervisor: 'Brian' },
      { CLASS: 'S-060-00-BB-W', DESCRIPTION: 'CC - Basketball - W', Primary: 'Dayna', Supervisor: 'Dayna' },
      { CLASS: 'S-060-00-BV-W', DESCRIPTION: 'CC - Beach Volleyball - W', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-060-00-CC-M', DESCRIPTION: 'CC - Cross Country - M', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-060-00-CC-W', DESCRIPTION: 'CC - Cross Country - W', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-060-00-EQ-W', DESCRIPTION: 'CC - Equestrian - W', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-060-00-FB-0', DESCRIPTION: 'CC - Football', Primary: 'Scott', Supervisor: 'Scott' },
      { CLASS: 'S-060-00-GF-M', DESCRIPTION: 'CC - Golf - M', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-060-00-GF-W', DESCRIPTION: 'CC - Golf - W', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-060-00-GY-W', DESCRIPTION: 'CC - Gymnastics -W', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-060-00-HB-0', DESCRIPTION: 'CC - Baseball', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-060-00-IT-M', DESCRIPTION: 'CC - Indoor Track & Field - M', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-060-00-IT-W', DESCRIPTION: 'CC - Indoor Track & Field - W', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-060-00-LX-W', DESCRIPTION: 'CC - Lacrosse - W', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-060-00-OT-M', DESCRIPTION: 'CC - Outdoor Track & Field - M', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-060-00-OT-W', DESCRIPTION: 'CC - Outdoor Track & Field - W', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-060-00-RW-W', DESCRIPTION: 'CC - Rowing - W', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-060-00-SB-W', DESCRIPTION: 'CC - Softball', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-060-00-SC-W', DESCRIPTION: 'CC - Soccer', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-060-00-SD-M', DESCRIPTION: 'CC - Swimming & Diving - M', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-060-00-SD-W', DESCRIPTION: 'CC - Swimming & Diving - W', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-060-00-TN-M', DESCRIPTION: 'CC - Tennis - M', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-060-00-TN-W', DESCRIPTION: 'CC - Tennis - W', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-060-00-WW-M', DESCRIPTION: 'CC - Wrestling', Primary: 'Lizzie', Supervisor: 'Scott' },
      { CLASS: 'S-060-00-XX-0', DESCRIPTION: 'CC - Unallocated', Primary: 'Lizzie', Supervisor: 'Scott' },
      
      // NCAA Postseason
      { CLASS: 'S-070-00-BB-M', DESCRIPTION: 'NCAA/Post season basketball-men', Primary: 'Anna', Supervisor: 'Catrina' },
      { CLASS: 'S-070-00-BB-W', DESCRIPTION: 'NCAA/Post season basketball-women', Primary: 'Anna', Supervisor: 'Catrina' },
      { CLASS: 'S-070-00-FB-0', DESCRIPTION: 'NCAA/Post season football', Primary: 'Anna', Supervisor: 'Catrina' },
      { CLASS: 'S-070-00-OS-0', DESCRIPTION: 'NCAA/Post season other sports', Primary: 'Anna', Supervisor: 'Catrina' },
      
      // NCAA Managed Events
      { CLASS: 'S-080-00-BB-M', DESCRIPTION: 'NCAA managed basketball - M', Primary: 'Brian', Supervisor: 'Brian' },
      { CLASS: 'S-080-00-BB-W', DESCRIPTION: 'NCAA managed basketball - W', Primary: 'Dayna', Supervisor: 'Dayna' }
    ];
  }

  /**
   * Get all class responsibilities
   */
  public getAllClasses(): ClassResponsibility[] {
    return [...this.classes];
  }

  /**
   * Get classes by category
   */
  public getClassesByCategory(category: ClassCategory): ClassResponsibility[] {
    return this.classes.filter(c => c.category === category);
  }

  /**
   * Get classes by sport
   */
  public getClassesBySport(sportCode: string): ClassResponsibility[] {
    return this.classes.filter(c => c.sportCode === sportCode);
  }

  /**
   * Get classes by staff member
   */
  public getClassesByStaff(staffName: string): ClassResponsibility[] {
    return this.classes.filter(c => 
      c.primaryStaff === staffName || c.supervisor === staffName
    );
  }

  /**
   * Get staff responsibilities
   */
  public getStaffResponsibilities(): StaffResponsibility[] {
    return Array.from(this.staffResponsibilities.values());
  }

  /**
   * Get staff responsibility by name
   */
  public getStaffResponsibility(staffName: string): StaffResponsibility | undefined {
    return this.staffResponsibilities.get(staffName);
  }

  /**
   * Get budget areas
   */
  public getBudgetAreas(): BudgetArea[] {
    return Array.from(this.budgetAreas.values());
  }

  /**
   * Get budget area by name
   */
  public getBudgetArea(areaName: string): BudgetArea | undefined {
    return this.budgetAreas.get(areaName);
  }

  /**
   * Search classes
   */
  public searchClasses(query: string): ClassResponsibility[] {
    const lowerQuery = query.toLowerCase();
    return this.classes.filter(c =>
      c.classCode.toLowerCase().includes(lowerQuery) ||
      c.description.toLowerCase().includes(lowerQuery) ||
      c.primaryStaff.toLowerCase().includes(lowerQuery) ||
      c.supervisor.toLowerCase().includes(lowerQuery) ||
      c.sportCode?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get class summary statistics
   */
  public getClassSummary(): ClassSummary {
    const categoryCounts = {} as Record<ClassCategory, number>;
    const staffCounts = {} as Record<string, number>;
    const sportsSet = new Set<string>();

    this.classes.forEach(c => {
      // Category counts
      categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
      
      // Staff counts
      staffCounts[c.primaryStaff] = (staffCounts[c.primaryStaff] || 0) + 1;
      if (c.supervisor !== c.primaryStaff) {
        staffCounts[c.supervisor] = (staffCounts[c.supervisor] || 0) + 1;
      }
      
      // Sports
      if (c.sportCode) {
        sportsSet.add(c.sportCode);
      }
    });

    return {
      totalClasses: this.classes.length,
      categoryCounts,
      staffCounts,
      sportsCovered: Array.from(sportsSet),
      budgetAreas: this.getBudgetAreas()
    };
  }
}

// Create and export singleton instance
export const classResponsibilitiesService = new ClassResponsibilitiesService();
export default classResponsibilitiesService;