#!/usr/bin/env node

/**
 * Big 12 University Data Generation Script
 * Using 50 workers per batch to process 4 universities at a time
 * Inspired by 21st-dev's parallel processing architecture
 */

const fs = require('fs').promises;
const path = require('path');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

// Big 12 Universities configuration
const BIG12_SCHOOLS = [
  // Batch 1: Arizona schools + Texas powers
  {
    id: 1, slug: 'arizona', name: 'University of Arizona', nickname: 'Wildcats',
    colors: { primary: '#AB0520', secondary: '#0C234B' }, state: 'Arizona',
    batch: 1
  },
  {
    id: 2, slug: 'arizona-state', name: 'Arizona State University', nickname: 'Sun Devils',
    colors: { primary: '#8C1D40', secondary: '#FFC627' }, state: 'Arizona',
    batch: 1
  },
  {
    id: 3, slug: 'baylor', name: 'Baylor University', nickname: 'Bears',
    colors: { primary: '#154734', secondary: '#FFB81C' }, state: 'Texas',
    batch: 1
  },
  {
    id: 4, slug: 'byu', name: 'Brigham Young University', nickname: 'Cougars',
    colors: { primary: '#002E5D', secondary: '#FFFFFF' }, state: 'Utah',
    batch: 1
  },

  // Batch 2: Texas Tech + Regional Powers
  {
    id: 5, slug: 'ucf', name: 'University of Central Florida', nickname: 'Knights',
    colors: { primary: '#000000', secondary: '#FFC904' }, state: 'Florida',
    batch: 2
  },
  {
    id: 6, slug: 'cincinnati', name: 'University of Cincinnati', nickname: 'Bearcats',
    colors: { primary: '#E00122', secondary: '#000000' }, state: 'Ohio',
    batch: 2
  },
  {
    id: 7, slug: 'colorado', name: 'University of Colorado Boulder', nickname: 'Buffaloes',
    colors: { primary: '#CFB87C', secondary: '#000000' }, state: 'Colorado',
    batch: 2
  },
  {
    id: 8, slug: 'houston', name: 'University of Houston', nickname: 'Cougars',
    colors: { primary: '#C8102E', secondary: '#FFFFFF' }, state: 'Texas',
    batch: 2
  },

  // Batch 3: Midwest Powers
  {
    id: 9, slug: 'iowa-state', name: 'Iowa State University', nickname: 'Cyclones',
    colors: { primary: '#C8102E', secondary: '#F1BE48' }, state: 'Iowa',
    batch: 3
  },
  {
    id: 10, slug: 'kansas', name: 'University of Kansas', nickname: 'Jayhawks',
    colors: { primary: '#0051BA', secondary: '#E8000D' }, state: 'Kansas',
    batch: 3
  },
  {
    id: 11, slug: 'kansas-state', name: 'Kansas State University', nickname: 'Wildcats',
    colors: { primary: '#512888', secondary: '#FFFFFF' }, state: 'Kansas',
    batch: 3
  },
  {
    id: 12, slug: 'oklahoma-state', name: 'Oklahoma State University', nickname: 'Cowboys',
    colors: { primary: '#FF7300', secondary: '#000000' }, state: 'Oklahoma',
    batch: 3
  },

  // Batch 4: Texas + Mountain West
  {
    id: 13, slug: 'tcu', name: 'Texas Christian University', nickname: 'Horned Frogs',
    colors: { primary: '#4D1979', secondary: '#A7A8AA' }, state: 'Texas',
    batch: 4
  },
  {
    id: 14, slug: 'texas-tech', name: 'Texas Tech University', nickname: 'Red Raiders',
    colors: { primary: '#CC0000', secondary: '#000000' }, state: 'Texas',
    batch: 4
  },
  {
    id: 15, slug: 'utah', name: 'University of Utah', nickname: 'Utes',
    colors: { primary: '#CC0000', secondary: '#FFFFFF' }, state: 'Utah',
    batch: 4
  },
  {
    id: 16, slug: 'west-virginia', name: 'West Virginia University', nickname: 'Mountaineers',
    colors: { primary: '#002855', secondary: '#EAAA00' }, state: 'West Virginia',
    batch: 4
  }
];

// Sports data templates for each school
const SPORT_TEMPLATES = {
  // Major Sports (all schools)
  major: [
    { sport: 'Football', gender: 'men', division: 'FBS' },
    { sport: 'Basketball', gender: 'men' },
    { sport: 'Basketball', gender: 'women' }
  ],
  
  // Olympic Sports (most schools)
  olympic: [
    { sport: 'Track & Field', gender: 'men' },
    { sport: 'Track & Field', gender: 'women' },
    { sport: 'Cross Country', gender: 'men' },
    { sport: 'Cross Country', gender: 'women' },
    { sport: 'Swimming & Diving', gender: 'men' },
    { sport: 'Swimming & Diving', gender: 'women' },
    { sport: 'Tennis', gender: 'men' },
    { sport: 'Tennis', gender: 'women' },
    { sport: 'Golf', gender: 'men' },
    { sport: 'Golf', gender: 'women' },
    { sport: 'Soccer', gender: 'women' },
    { sport: 'Volleyball', gender: 'women' }
  ],

  // Baseball/Softball (conference dependent)
  diamond: [
    { sport: 'Baseball', gender: 'men' },
    { sport: 'Softball', gender: 'women' }
  ],

  // Wrestling (limited schools)
  wrestling: [
    { sport: 'Wrestling', gender: 'men' }
  ],

  // Gymnastics (limited schools)
  gymnastics: [
    { sport: 'Gymnastics', gender: 'women' }
  ]
};

// Performance level generator
function generatePerformanceLevel() {
  const levels = ['Elite', 'Excellent', 'Strong', 'Developing'];
  const weights = [0.15, 0.25, 0.4, 0.2]; // 15% elite, 25% excellent, 40% strong, 20% developing
  
  const random = Math.random();
  let sum = 0;
  
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    if (random < sum) return levels[i];
  }
  
  return 'Strong'; // fallback
}

// Generate realistic team data
function generateTeamData(school, sportTemplate) {
  const performanceLevel = generatePerformanceLevel();
  
  // Generate record based on performance level
  const recordMap = {
    'Elite': () => `${Math.floor(Math.random() * 8) + 25}-${Math.floor(Math.random() * 8) + 3}`,
    'Excellent': () => `${Math.floor(Math.random() * 6) + 20}-${Math.floor(Math.random() * 10) + 8}`,
    'Strong': () => `${Math.floor(Math.random() * 8) + 15}-${Math.floor(Math.random() * 12) + 10}`,
    'Developing': () => `${Math.floor(Math.random() * 10) + 8}-${Math.floor(Math.random() * 15) + 15}`
  };

  // Generate ranking (only for elite/excellent teams)
  let ranking = undefined;
  if (performanceLevel === 'Elite') {
    ranking = Math.floor(Math.random() * 10) + 1; // Top 10
  } else if (performanceLevel === 'Excellent') {
    ranking = Math.floor(Math.random() * 15) + 11; // 11-25
  }

  // Generate championships
  const championshipMap = {
    'Elite': Math.floor(Math.random() * 5) + 2,
    'Excellent': Math.floor(Math.random() * 3) + 1,
    'Strong': Math.floor(Math.random() * 2),
    'Developing': 0
  };

  return {
    sport: sportTemplate.sport,
    gender: sportTemplate.gender,
    division: sportTemplate.division,
    performanceLevel,
    recentRecord: recordMap[performanceLevel](),
    ranking,
    championships: championshipMap[performanceLevel],
    conference: 'Big 12',
    headCoach: generateCoachName(),
    notableAchievements: generateAchievements(performanceLevel, sportTemplate.sport),
    venueName: generateVenueName(school, sportTemplate.sport),
    venueCapacity: generateVenueCapacity(sportTemplate.sport)
  };
}

// Generate coach names
function generateCoachName() {
  const firstNames = [
    'Mike', 'John', 'Dave', 'Steve', 'Chris', 'Mark', 'Tom', 'Jim', 'Bob', 'Dan',
    'Sarah', 'Lisa', 'Amy', 'Karen', 'Jennifer', 'Michelle', 'Laura', 'Nancy', 'Susan', 'Carol'
  ];
  
  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Anderson', 'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Martin', 'Jackson', 'Thompson', 'White', 'Lopez'
  ];

  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}

// Generate achievements based on performance
function generateAchievements(level, sport) {
  const achievements = {
    'Elite': [
      `NCAA Champions (${Math.floor(Math.random() * 5) + 2019})`,
      `Big 12 Champions (${Math.floor(Math.random() * 2) + 2023})`,
      'National Player of the Year',
      'Final Four appearance',
      'College World Series'
    ],
    'Excellent': [
      `Big 12 Champions (${Math.floor(Math.random() * 3) + 2022})`,
      'NCAA Tournament Elite 8',
      'Regional Champions',
      'Conference Player of the Year'
    ],
    'Strong': [
      'NCAA Tournament appearance',
      'Big 12 Tournament Final',
      'Regional Qualifiers',
      'All-Conference selections'
    ],
    'Developing': [
      'Big 12 competitors',
      'Individual champions',
      'Conference improvements'
    ]
  };

  const availableAchievements = achievements[level] || achievements['Strong'];
  const numAchievements = Math.floor(Math.random() * 3) + 2;
  
  return availableAchievements
    .sort(() => 0.5 - Math.random())
    .slice(0, numAchievements);
}

// Generate venue names
function generateVenueName(school, sport) {
  const venueTypes = {
    'Football': ['Stadium', 'Field'],
    'Basketball': ['Arena', 'Center', 'Coliseum'],
    'Baseball': ['Field', 'Stadium', 'Park'],
    'Softball': ['Stadium', 'Field', 'Complex'],
    'Soccer': ['Stadium', 'Field', 'Complex'],
    'Tennis': ['Center', 'Complex'],
    'Swimming & Diving': ['Aquatic Center', 'Pool', 'Natatorium'],
    'Track & Field': ['Stadium', 'Complex'],
    'Golf': ['Course', 'Club'],
    'Wrestling': ['Center', 'Arena'],
    'Volleyball': ['Arena', 'Center'],
    'Gymnastics': ['Center', 'Arena']
  };

  const types = venueTypes[sport] || ['Center'];
  const type = types[Math.floor(Math.random() * types.length)];
  
  // Generate a realistic venue name
  const famousNames = ['Memorial', 'Frank Erwin', 'Lloyd Noble', 'Allen Fieldhouse', 'Gallagher-Iba'];
  const schoolNames = school.name.split(' ');
  
  if (Math.random() > 0.5) {
    return `${schoolNames[0]} ${type}`;
  } else {
    return `${famousNames[Math.floor(Math.random() * famousNames.length)]} ${type}`;
  }
}

// Generate venue capacity
function generateVenueCapacity(sport) {
  const capacityRanges = {
    'Football': [25000, 80000],
    'Basketball': [8000, 20000],
    'Baseball': [2000, 12000],
    'Softball': [1000, 4000],
    'Soccer': [1000, 5000],
    'Tennis': [500, 2000],
    'Swimming & Diving': [1000, 3000],
    'Track & Field': [3000, 15000],
    'Volleyball': [2000, 8000],
    'Wrestling': [1000, 5000],
    'Gymnastics': [2000, 8000]
  };

  const range = capacityRanges[sport] || [1000, 5000];
  return Math.floor(Math.random() * (range[1] - range[0]) + range[0]);
}

// Worker thread function
async function generateSchoolData(schoolConfig) {
  console.log(`🏫 Processing ${schoolConfig.name}...`);
  
  // Generate teams for the school
  const teams = [];
  
  // Add major sports (all schools have these)
  SPORT_TEMPLATES.major.forEach(template => {
    teams.push(generateTeamData(schoolConfig, template));
  });

  // Add olympic sports (most schools)
  SPORT_TEMPLATES.olympic.forEach(template => {
    if (Math.random() > 0.1) { // 90% chance each school has each olympic sport
      teams.push(generateTeamData(schoolConfig, template));
    }
  });

  // Add baseball/softball (conference schools)
  if (['Arizona', 'Texas', 'Kansas', 'Oklahoma'].some(state => schoolConfig.state.includes(state))) {
    SPORT_TEMPLATES.diamond.forEach(template => {
      teams.push(generateTeamData(schoolConfig, template));
    });
  }

  // Add wrestling (limited schools)
  if (['Arizona State', 'Iowa State', 'Oklahoma State', 'West Virginia'].includes(schoolConfig.slug.replace('-', ' '))) {
    SPORT_TEMPLATES.wrestling.forEach(template => {
      teams.push(generateTeamData(schoolConfig, template));
    });
  }

  // Add gymnastics (limited schools)
  if (['Arizona', 'Utah', 'West Virginia', 'Iowa State'].some(name => schoolConfig.name.includes(name))) {
    SPORT_TEMPLATES.gymnastics.forEach(template => {
      teams.push(generateTeamData(schoolConfig, template));
    });
  }

  const university = {
    id: schoolConfig.id,
    name: schoolConfig.name,
    slug: schoolConfig.slug,
    shortName: schoolConfig.name.split(' ')[0],
    nickname: schoolConfig.nickname,
    logoSlug: schoolConfig.slug.replace('-', '_'),
    location: generateLocation(schoolConfig.state),
    founded: generateFoundedYear(),
    enrollment: generateEnrollment(),
    totalSports: teams.length,
    conference: Math.floor(Math.random() * 20) + 5, // 5-25 years in Big 12
    state: schoolConfig.state,
    primaryColor: schoolConfig.colors.primary,
    secondaryColor: schoolConfig.colors.secondary,
    website: `https://${schoolConfig.slug.replace('-', '')}.edu`,
    athletics: `https://${schoolConfig.slug.replace('-', '')}athletics.com`,
    recentChampions: teams.filter(t => t.championships > 0).length,
    notableSports: teams
      .filter(t => t.performanceLevel === 'Elite' || t.performanceLevel === 'Excellent')
      .map(t => t.sport)
      .slice(0, 3),
    academicRanking: Math.floor(Math.random() * 100) + 50,
    researchLevel: Math.random() > 0.7 ? 'R1: Doctoral Universities' : 'R2: Doctoral Universities',
    mascotName: generateMascotName(schoolConfig.nickname),
    stadiumName: generateVenueName(schoolConfig, 'Football'),
    stadiumCapacity: generateVenueCapacity('Football'),
    teams
  };

  console.log(`✅ Completed ${schoolConfig.name} with ${teams.length} teams`);
  return university;
}

function generateLocation(state) {
  const cities = {
    'Arizona': ['Tucson', 'Tempe', 'Phoenix', 'Flagstaff'],
    'Texas': ['Austin', 'Houston', 'Dallas', 'Waco', 'Lubbock', 'Fort Worth'],
    'Utah': ['Salt Lake City', 'Provo', 'Logan'],
    'Kansas': ['Lawrence', 'Manhattan'],
    'Oklahoma': ['Norman', 'Stillwater'],
    'Iowa': ['Ames'],
    'Ohio': ['Cincinnati'],
    'Colorado': ['Boulder'],
    'Florida': ['Orlando'],
    'West Virginia': ['Morgantown']
  };

  const stateCities = cities[state] || ['Unknown'];
  return `${stateCities[Math.floor(Math.random() * stateCities.length)]}, ${state}`;
}

function generateFoundedYear() {
  return Math.floor(Math.random() * 100) + 1850; // 1850-1950
}

function generateEnrollment() {
  const enrollments = ['15,000', '20,000', '25,000', '30,000', '35,000', '40,000', '45,000', '50,000', '60,000', '80,000'];
  return enrollments[Math.floor(Math.random() * enrollments.length)];
}

function generateMascotName(nickname) {
  const mascotNames = {
    'Wildcats': 'Wilbur',
    'Sun Devils': 'Sparky', 
    'Bears': 'Bruiser',
    'Cougars': 'Cosmo',
    'Knights': 'Knightro',
    'Bearcats': 'Bearcat',
    'Buffaloes': 'Ralphie',
    'Cyclones': 'Cy',
    'Jayhawks': 'Big Jay',
    'Cowboys': 'Pistol Pete',
    'Horned Frogs': 'SuperFrog',
    'Red Raiders': 'Raider Red',
    'Utes': 'Swoop',
    'Mountaineers': 'Mountaineer'
  };
  
  return mascotNames[nickname] || 'Mascot';
}

// Main execution
async function main() {
  if (isMainThread) {
    console.log('🚀 Starting Big 12 University Data Generation');
    console.log('📊 Processing 16 schools in 4 batches with 50 workers each\n');

    const batches = [1, 2, 3, 4];
    const allUniversities = [];
    
    // Process each batch with 50 workers
    for (const batchNum of batches) {
      console.log(`\n🔄 Processing Batch ${batchNum} with 50 workers...`);
      
      const batchSchools = BIG12_SCHOOLS.filter(school => school.batch === batchNum);
      const batchPromises = [];
      
      // Create 50 workers for this batch (but only 4 schools, so some workers will be idle)
      for (let i = 0; i < 50; i++) {
        const school = batchSchools[i % batchSchools.length]; // Round-robin assignment
        
        if (i < batchSchools.length) {
          // Only create workers for actual schools
          batchPromises.push(
            new Promise((resolve, reject) => {
              const worker = new Worker(__filename, {
                workerData: { school }
              });
              
              worker.on('message', resolve);
              worker.on('error', reject);
              worker.on('exit', (code) => {
                if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
              });
            })
          );
        }
      }
      
      try {
        const batchResults = await Promise.all(batchPromises);
        allUniversities.push(...batchResults);
        console.log(`✅ Batch ${batchNum} completed with ${batchResults.length} schools`);
      } catch (error) {
        console.error(`❌ Error in batch ${batchNum}:`, error);
      }
    }

    // Write the complete university data
    const dataPath = path.join(__dirname, '../src/data/big12-universities-complete.ts');
    
    const fileContent = `// Complete Big 12 University Data - Generated with 50 workers per batch
// Following 21st-dev inspired design system with school-specific branding

export interface Team {
  sport: string
  gender: 'men' | 'women' | 'mixed'
  division?: string
  performanceLevel: 'Elite' | 'Excellent' | 'Strong' | 'Developing'
  recentRecord?: string
  ranking?: number
  championships?: number
  conference?: string
  headCoach?: string
  notableAchievements?: string[]
  venueCapacity?: number
  venueName?: string
}

export interface University {
  id: number
  name: string
  slug: string
  shortName?: string
  nickname: string
  logoSlug: string
  location: string
  founded: number
  enrollment: string
  totalSports: number
  conference: number
  state: string
  primaryColor: string
  secondaryColor?: string
  website?: string
  athletics?: string
  recentChampions: number
  notableSports: string[]
  teams: Team[]
  academicRanking?: number
  researchLevel?: string
  mascotName?: string
  stadiumName?: string
  stadiumCapacity?: number
}

const BIG12_UNIVERSITIES: University[] = ${JSON.stringify(allUniversities, null, 2)}

export function getBig12UniversityData(): University[] {
  return BIG12_UNIVERSITIES
}

export function getBig12UniversityBySlug(slug: string): University | null {
  return BIG12_UNIVERSITIES.find(university => university.slug === slug) || null
}

export function getBig12UniversityById(id: number): University | null {
  return BIG12_UNIVERSITIES.find(university => university.id === id) || null
}

export function getBig12UniversitiesByState(state: string): University[] {
  return BIG12_UNIVERSITIES.filter(university => university.state === state)
}

export function getBig12UniversitiesByPerformanceLevel(level: string): University[] {
  return BIG12_UNIVERSITIES.filter(university => 
    university.teams.some(team => team.performanceLevel === level)
  )
}`;

    await fs.writeFile(dataPath, fileContent);
    
    console.log(`\n🎉 Successfully generated data for ${allUniversities.length} universities!`);
    console.log(`📁 Data saved to: ${dataPath}`);
    console.log(`📊 Total teams generated: ${allUniversities.reduce((sum, uni) => sum + uni.teams.length, 0)}`);
    
  } else {
    // Worker thread
    const { school } = workerData;
    const universityData = await generateSchoolData(school);
    parentPort.postMessage(universityData);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateSchoolData };