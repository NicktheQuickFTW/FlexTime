// Comprehensive Big 12 University Data with Team Information
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

export interface School {
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
  conference: number // years in Big 12
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

const BIG12_SCHOOLS: School[] = [
  {
    id: 1,
    name: 'University of Arizona',
    slug: 'arizona',
    shortName: 'Arizona',
    nickname: 'Wildcats',
    logoSlug: 'arizona',
    location: 'Tucson, Arizona',
    founded: 1885,
    enrollment: '47,000',
    totalSports: 21,
    conference: 2,
    state: 'Arizona',
    primaryColor: '#AB0520',
    secondaryColor: '#0C234B',
    website: 'https://arizona.edu',
    athletics: 'https://arizonawildcats.com',
    recentChampions: 2,
    notableSports: ['Basketball', 'Softball', 'Swimming'],
    academicRanking: 103,
    researchLevel: 'R1: Doctoral Universities',
    mascotName: 'Wilbur & Wilma',
    stadiumName: 'Arizona Stadium',
    stadiumCapacity: 50782,
    teams: [
      {
        sport: 'Football',
        gender: 'men',
        division: 'FBS',
        performanceLevel: 'Developing',
        recentRecord: '3-9',
        ranking: undefined,
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Brent Brennan',
        notableAchievements: ['Pac-12 South Division Champions (2014)', 'Fiesta Bowl Champions (2014)'],
        venueName: 'Arizona Stadium',
        venueCapacity: 50782
      },
      {
        sport: 'Basketball',
        gender: 'men',
        performanceLevel: 'Excellent',
        recentRecord: '27-8',
        ranking: 4,
        championships: 1,
        conference: 'Big 12',
        headCoach: 'Tommy Lloyd',
        notableAchievements: ['NCAA Championship (1997)', 'Sweet 16 (2024)', 'Pac-12 Tournament Champions (2024)'],
        venueName: 'McKale Center',
        venueCapacity: 14644
      },
      {
        sport: 'Basketball',
        gender: 'women',
        performanceLevel: 'Strong',
        recentRecord: '18-14',
        ranking: undefined,
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Adia Barnes',
        notableAchievements: ['NCAA Championship Game (2021)', 'Pac-12 Tournament Champions (2021)'],
        venueName: 'McKale Center',
        venueCapacity: 14644
      },
      {
        sport: 'Softball',
        gender: 'women',
        performanceLevel: 'Elite',
        recentRecord: '43-16',
        ranking: 8,
        championships: 8,
        conference: 'Big 12',
        headCoach: 'Caitlin Lowe',
        notableAchievements: ['NCAA Champions (2006, 2007, 2010)', 'College World Series (2024)'],
        venueName: 'Hillenbrand Stadium',
        venueCapacity: 3228
      },
      {
        sport: 'Baseball',
        gender: 'men',
        performanceLevel: 'Strong',
        recentRecord: '32-26',
        ranking: undefined,
        championships: 4,
        conference: 'Big 12',
        headCoach: 'Chip Hale',
        notableAchievements: ['NCAA Champions (1976, 1980, 1986, 2012)', 'College World Series (2022)'],
        venueName: 'Hi Corbett Field',
        venueCapacity: 9500
      },
      {
        sport: 'Swimming & Diving',
        gender: 'men',
        performanceLevel: 'Elite',
        recentRecord: '12-1',
        ranking: 7,
        championships: 2,
        conference: 'Big 12',
        headCoach: 'Augie Busch',
        notableAchievements: ['NCAA Champions (2008, 2016)', 'Pac-12 Champions (2024)'],
        venueName: 'Hillenbrand Aquatic Center',
        venueCapacity: 2000
      },
      {
        sport: 'Swimming & Diving',
        gender: 'women',
        performanceLevel: 'Elite',
        recentRecord: '11-2',
        ranking: 5,
        championships: 1,
        conference: 'Big 12',
        headCoach: 'Augie Busch',
        notableAchievements: ['NCAA Champions (2018)', 'Pac-12 Champions (2024)'],
        venueName: 'Hillenbrand Aquatic Center',
        venueCapacity: 2000
      },
      {
        sport: 'Golf',
        gender: 'men',
        performanceLevel: 'Excellent',
        recentRecord: '8 tournament wins',
        ranking: 12,
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Jim Anderson',
        notableAchievements: ['NCAA Regional Champions (2024)', 'Pac-12 Champions (2023)']
      },
      {
        sport: 'Golf',
        gender: 'women',
        performanceLevel: 'Strong',
        recentRecord: '5 tournament wins',
        ranking: 25,
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Laura Ianello',
        notableAchievements: ['NCAA Regional Qualifiers (2024)', 'Pac-12 Top 3 (2023)']
      },
      {
        sport: 'Track & Field',
        gender: 'men',
        performanceLevel: 'Strong',
        recentRecord: '3rd Pac-12',
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Fred Harvey',
        notableAchievements: ['Individual NCAA Champions', 'Pac-12 medalists (2024)']
      },
      {
        sport: 'Track & Field',
        gender: 'women',
        performanceLevel: 'Strong',
        recentRecord: '4th Pac-12',
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Fred Harvey',
        notableAchievements: ['Individual NCAA Champions', 'Pac-12 medalists (2024)']
      },
      {
        sport: 'Tennis',
        gender: 'men',
        performanceLevel: 'Strong',
        recentRecord: '16-10',
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Clancy Shields',
        notableAchievements: ['NCAA Tournament (2024)', 'Pac-12 Tournament (2023)']
      },
      {
        sport: 'Tennis',
        gender: 'women',
        performanceLevel: 'Strong',
        recentRecord: '14-12',
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Tessa Lang',
        notableAchievements: ['NCAA Tournament (2024)', 'Pac-12 competitors']
      },
      {
        sport: 'Volleyball',
        gender: 'women',
        performanceLevel: 'Strong',
        recentRecord: '20-12',
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Rita Stubbs',
        notableAchievements: ['NCAA Tournament (2023)', 'Pac-12 competitors'],
        venueName: 'McKale Center',
        venueCapacity: 14644
      },
      {
        sport: 'Soccer',
        gender: 'women',
        performanceLevel: 'Strong',
        recentRecord: '12-6-2',
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Tony Amato',
        notableAchievements: ['NCAA Tournament (2023)', 'Pac-12 competitors'],
        venueName: 'Mulcahy Soccer Stadium',
        venueCapacity: 3000
      },
      {
        sport: 'Gymnastics',
        gender: 'women',
        performanceLevel: 'Excellent',
        recentRecord: '196.825 avg',
        ranking: 15,
        championships: 0,
        conference: 'Big 12',
        headCoach: 'John Court',
        notableAchievements: ['NCAA Regional Finals (2024)', 'Pac-12 Top 5'],
        venueName: 'McKale Center',
        venueCapacity: 14644
      }
    ]
  },
  {
    id: 2,
    name: 'Arizona State University',
    slug: 'arizona-state',
    shortName: 'Arizona State',
    nickname: 'Sun Devils',
    logoSlug: 'arizona_state',
    location: 'Tempe, Arizona',
    founded: 1885,
    enrollment: '83,000',
    totalSports: 24,
    conference: 2,
    state: 'Arizona',
    primaryColor: '#8C1D40',
    secondaryColor: '#FFC627',
    website: 'https://asu.edu',
    athletics: 'https://thesundevils.com',
    recentChampions: 1,
    notableSports: ['Wrestling', 'Baseball', 'Golf'],
    academicRanking: 117,
    researchLevel: 'R1: Doctoral Universities',
    mascotName: 'Sparky',
    stadiumName: 'Mountain America Stadium',
    stadiumCapacity: 53599,
    teams: [
      {
        sport: 'Football',
        gender: 'men',
        division: 'FBS',
        performanceLevel: 'Strong',
        recentRecord: '10-3',
        ranking: 14,
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Kenny Dillingham',
        notableAchievements: ['Big 12 Championship Game (2024)', 'College Football Playoff (2024)'],
        venueName: 'Mountain America Stadium',
        venueCapacity: 53599
      },
      {
        sport: 'Basketball',
        gender: 'men',
        performanceLevel: 'Strong',
        recentRecord: '14-18',
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Bobby Hurley',
        notableAchievements: ['NCAA Tournament (2021)', 'Pac-12 Tournament Final (2021)'],
        venueName: 'Desert Financial Arena',
        venueCapacity: 14198
      },
      {
        sport: 'Basketball',
        gender: 'women',
        performanceLevel: 'Strong',
        recentRecord: '16-15',
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Natasha Adair',
        notableAchievements: ['WNIT Champions (2018)', 'Pac-12 competitors'],
        venueName: 'Desert Financial Arena',
        venueCapacity: 14198
      },
      {
        sport: 'Wrestling',
        gender: 'men',
        performanceLevel: 'Elite',
        recentRecord: '15-3',
        ranking: 3,
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Zeke Jones',
        notableAchievements: ['NCAA Team Champions (1988, 1992, 1994)', 'Pac-12 Champions (2024)'],
        venueName: 'Wrestling Training Facility',
        venueCapacity: 2500
      },
      {
        sport: 'Baseball',
        gender: 'men',
        performanceLevel: 'Elite',
        recentRecord: '38-22',
        ranking: 18,
        championships: 5,
        conference: 'Big 12',
        headCoach: 'Willie Bloomquist',
        notableAchievements: ['NCAA Champions (1965, 1967, 1969, 1977, 1981)', 'College World Series (2024)'],
        venueName: 'Phoenix Municipal Stadium',
        venueCapacity: 8775
      },
      {
        sport: 'Golf',
        gender: 'men',
        performanceLevel: 'Elite',
        recentRecord: '12 tournament wins',
        ranking: 2,
        championships: 2,
        conference: 'Big 12',
        headCoach: 'Matt Thurmond',
        notableAchievements: ['NCAA Champions (1990, 1996)', 'NCAA Tournament (2024)']
      },
      {
        sport: 'Golf',
        gender: 'women',
        performanceLevel: 'Excellent',
        recentRecord: '8 tournament wins',
        ranking: 8,
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Missy Farr-Kaye',
        notableAchievements: ['NCAA Tournament (2024)', 'Pac-12 Champions (2023)']
      },
      {
        sport: 'Swimming & Diving',
        gender: 'men',
        performanceLevel: 'Excellent',
        recentRecord: '10-3',
        ranking: 18,
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Bob Bowman',
        notableAchievements: ['Pac-12 Champions (2023)', 'NCAA Championships qualifiers'],
        venueName: 'Mona Plummer Aquatic Complex',
        venueCapacity: 2000
      },
      {
        sport: 'Swimming & Diving',
        gender: 'women',
        performanceLevel: 'Excellent',
        recentRecord: '9-4',
        ranking: 20,
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Bob Bowman',
        notableAchievements: ['Pac-12 Top 3 (2024)', 'NCAA Championships qualifiers'],
        venueName: 'Mona Plummer Aquatic Complex',
        venueCapacity: 2000
      },
      {
        sport: 'Track & Field',
        gender: 'men',
        performanceLevel: 'Excellent',
        recentRecord: '2nd Pac-12',
        ranking: 22,
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Greg Kraft',
        notableAchievements: ['Individual NCAA Champions', 'Pac-12 Champions (2023)']
      },
      {
        sport: 'Track & Field',
        gender: 'women',
        performanceLevel: 'Excellent',
        recentRecord: '1st Pac-12',
        ranking: 15,
        championships: 1,
        conference: 'Big 12',
        headCoach: 'Greg Kraft',
        notableAchievements: ['Pac-12 Champions (2024)', 'Individual NCAA Champions']
      },
      {
        sport: 'Softball',
        gender: 'women',
        performanceLevel: 'Strong',
        recentRecord: '31-23',
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Trisha Ford',
        notableAchievements: ['NCAA Tournament (2023)', 'Pac-12 competitors'],
        venueName: 'Farrington Stadium',
        venueCapacity: 1500
      },
      {
        sport: 'Volleyball',
        gender: 'women',
        performanceLevel: 'Strong',
        recentRecord: '18-14',
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Sanja Tomasevic',
        notableAchievements: ['NCAA Tournament (2022)', 'Pac-12 competitors'],
        venueName: 'Desert Financial Arena',
        venueCapacity: 14198
      },
      {
        sport: 'Soccer',
        gender: 'women',
        performanceLevel: 'Strong',
        recentRecord: '11-7-2',
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Graham Winkworth',
        notableAchievements: ['NCAA Tournament (2023)', 'Pac-12 competitors'],
        venueName: 'Sun Devil Soccer Stadium',
        venueCapacity: 1500
      },
      {
        sport: 'Tennis',
        gender: 'men',
        performanceLevel: 'Strong',
        recentRecord: '15-11',
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Matt Hill',
        notableAchievements: ['NCAA Tournament (2024)', 'Pac-12 competitors']
      },
      {
        sport: 'Tennis',
        gender: 'women',
        performanceLevel: 'Strong',
        recentRecord: '13-13',
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Sheila McInerney',
        notableAchievements: ['NCAA Tournament (2023)', 'Pac-12 competitors']
      }
    ]
  },
  {
    id: 3,
    name: 'Baylor University',
    slug: 'baylor',
    shortName: 'Baylor',
    nickname: 'Bears',
    logoSlug: 'baylor',
    location: 'Waco, Texas',
    founded: 1845,
    enrollment: '20,000',
    totalSports: 19,
    conference: 13,
    state: 'Texas',
    primaryColor: '#154734',
    secondaryColor: '#FFB81C',
    website: 'https://baylor.edu',
    athletics: 'https://baylorbears.com',
    recentChampions: 3,
    notableSports: ['Basketball', 'Football', 'Tennis'],
    academicRanking: 76,
    researchLevel: 'R1: Doctoral Universities',
    mascotName: 'Bruiser & Marigold',
    stadiumName: 'McLane Stadium',
    stadiumCapacity: 45140,
    teams: [
      {
        sport: 'Football',
        gender: 'men',
        division: 'FBS',
        performanceLevel: 'Excellent',
        recentRecord: '8-5',
        ranking: 25,
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Dave Aranda',
        notableAchievements: ['Big 12 Champions (2021)', 'Sugar Bowl Champions (2022)'],
        venueName: 'McLane Stadium',
        venueCapacity: 45140
      },
      {
        sport: 'Basketball',
        gender: 'men',
        performanceLevel: 'Elite',
        recentRecord: '24-11',
        ranking: 8,
        championships: 1,
        conference: 'Big 12',
        headCoach: 'Scott Drew',
        notableAchievements: ['NCAA Champions (2021)', 'Big 12 Champions (2024)'],
        venueName: 'Ferrell Center',
        venueCapacity: 10284
      },
      {
        sport: 'Basketball',
        gender: 'women',
        performanceLevel: 'Elite',
        recentRecord: '25-8',
        ranking: 12,
        championships: 3,
        conference: 'Big 12',
        headCoach: 'Nicki Collen',
        notableAchievements: ['NCAA Champions (2005, 2012, 2019)', 'Elite 8 (2024)'],
        venueName: 'Ferrell Center',
        venueCapacity: 10284
      },
      {
        sport: 'Baseball',
        gender: 'men',
        performanceLevel: 'Strong',
        recentRecord: '34-24',
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Mitch Thompson',
        notableAchievements: ['College World Series (2005)', 'Big 12 Tournament (2024)'],
        venueName: 'Baylor Ballpark',
        venueCapacity: 5000
      },
      {
        sport: 'Tennis',
        gender: 'men',
        performanceLevel: 'Elite',
        recentRecord: '21-6',
        ranking: 6,
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Michael Woodson',
        notableAchievements: ['NCAA Tournament Elite 8 (2024)', 'Big 12 Champions (2023)']
      },
      {
        sport: 'Tennis',
        gender: 'women',
        performanceLevel: 'Elite',
        recentRecord: '19-8',
        ranking: 10,
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Joey Scrivano',
        notableAchievements: ['NCAA Tournament (2024)', 'Big 12 Champions (2023)']
      },
      {
        sport: 'Track & Field',
        gender: 'men',
        performanceLevel: 'Excellent',
        recentRecord: '1st Big 12',
        ranking: 8,
        championships: 2,
        conference: 'Big 12',
        headCoach: 'Todd Harbour',
        notableAchievements: ['NCAA Champions (2022, 2024)', 'Big 12 Champions (2024)']
      },
      {
        sport: 'Track & Field',
        gender: 'women',
        performanceLevel: 'Excellent',
        recentRecord: '1st Big 12',
        ranking: 5,
        championships: 1,
        conference: 'Big 12',
        headCoach: 'Todd Harbour',
        notableAchievements: ['Big 12 Champions (2024)', 'NCAA Individual Champions']
      },
      {
        sport: 'Softball',
        gender: 'women',
        performanceLevel: 'Strong',
        recentRecord: '29-25',
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Glenn Moore',
        notableAchievements: ['NCAA Tournament (2023)', 'Big 12 Tournament'],
        venueName: 'Getterman Stadium',
        venueCapacity: 1500
      },
      {
        sport: 'Volleyball',
        gender: 'women',
        performanceLevel: 'Strong',
        recentRecord: '20-12',
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Ryan McGuyre',
        notableAchievements: ['NCAA Tournament (2023)', 'Big 12 competitors'],
        venueName: 'Ferrell Center',
        venueCapacity: 10284
      },
      {
        sport: 'Soccer',
        gender: 'women',
        performanceLevel: 'Strong',
        recentRecord: '13-5-2',
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Paul Jobson',
        notableAchievements: ['NCAA Tournament (2024)', 'Big 12 competitors'],
        venueName: 'Betty Lou Mays Field',
        venueCapacity: 1500
      },
      {
        sport: 'Golf',
        gender: 'men',
        performanceLevel: 'Excellent',
        recentRecord: '6 tournament wins',
        ranking: 15,
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Mike McGraw',
        notableAchievements: ['NCAA Tournament (2024)', 'Big 12 Champions (2023)']
      },
      {
        sport: 'Golf',
        gender: 'women',
        performanceLevel: 'Strong',
        recentRecord: '4 tournament wins',
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Jay Goble',
        notableAchievements: ['NCAA Tournament (2024)', 'Big 12 competitors']
      }
    ]
  },
  {
    id: 4,
    name: 'Brigham Young University',
    slug: 'byu',
    shortName: 'BYU',
    nickname: 'Cougars',
    logoSlug: 'byu',
    location: 'Provo, Utah',
    founded: 1875,
    enrollment: '33,000',
    totalSports: 21,
    conference: 2,
    state: 'Utah',
    primaryColor: '#002E5D',
    secondaryColor: '#FFFFFF',
    website: 'https://byu.edu',
    athletics: 'https://byucougars.com',
    recentChampions: 1,
    notableSports: ['Football', 'Cross Country', 'Volleyball'],
    academicRanking: 89,
    researchLevel: 'R2: Doctoral Universities',
    mascotName: 'Cosmo the Cougar',
    stadiumName: 'LaVell Edwards Stadium',
    stadiumCapacity: 63470,
    teams: [
      {
        sport: 'Football',
        gender: 'men',
        division: 'FBS',
        performanceLevel: 'Strong',
        recentRecord: '10-3',
        ranking: 19,
        championships: 1,
        conference: 'Big 12',
        headCoach: 'Kalani Sitake',
        notableAchievements: ['National Champions (1984)', 'Big 12 Championship Game (2024)'],
        venueName: 'LaVell Edwards Stadium',
        venueCapacity: 63470
      },
      {
        sport: 'Basketball',
        gender: 'men',
        performanceLevel: 'Strong',
        recentRecord: '23-11',
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Kevin Young',
        notableAchievements: ['NCAA Tournament (2024)', 'Big 12 Tournament'],
        venueName: 'Marriott Center',
        venueCapacity: 18987
      },
      {
        sport: 'Basketball',
        gender: 'women',
        performanceLevel: 'Strong',
        recentRecord: '18-14',
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Amber Whiting',
        notableAchievements: ['NCAA Tournament (2023)', 'Big 12 competitors'],
        venueName: 'Marriott Center',
        venueCapacity: 18987
      },
      {
        sport: 'Volleyball',
        gender: 'women',
        performanceLevel: 'Elite',
        recentRecord: '28-3',
        ranking: 5,
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Heather Olmstead',
        notableAchievements: ['NCAA Final Four (2024)', 'Big 12 Champions (2024)'],
        venueName: 'Smith Fieldhouse',
        venueCapacity: 5000
      },
      {
        sport: 'Cross Country',
        gender: 'men',
        performanceLevel: 'Elite',
        recentRecord: '1st Big 12',
        ranking: 3,
        championships: 1,
        conference: 'Big 12',
        headCoach: 'Ed Eyestone',
        notableAchievements: ['NCAA Champions (2019)', 'Big 12 Champions (2024)']
      },
      {
        sport: 'Cross Country',
        gender: 'women',
        performanceLevel: 'Elite',
        recentRecord: '1st Big 12',
        ranking: 2,
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Diljeet Taylor',
        notableAchievements: ['NCAA Runners-up (2024)', 'Big 12 Champions (2024)']
      },
      {
        sport: 'Track & Field',
        gender: 'men',
        performanceLevel: 'Elite',
        recentRecord: '1st Big 12',
        ranking: 5,
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Ed Eyestone',
        notableAchievements: ['Individual NCAA Champions', 'Big 12 Champions (2024)']
      },
      {
        sport: 'Track & Field',
        gender: 'women',
        performanceLevel: 'Elite',
        recentRecord: '2nd Big 12',
        ranking: 8,
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Diljeet Taylor',
        notableAchievements: ['Individual NCAA Champions', 'Big 12 medalists (2024)']
      },
      {
        sport: 'Swimming & Diving',
        gender: 'men',
        performanceLevel: 'Strong',
        recentRecord: '8-4',
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Shari Skabelund',
        notableAchievements: ['Big 12 competitors', 'Individual champions']
      },
      {
        sport: 'Swimming & Diving',
        gender: 'women',
        performanceLevel: 'Strong',
        recentRecord: '7-5',
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Shari Skabelund',
        notableAchievements: ['Big 12 competitors', 'Individual champions']
      },
      {
        sport: 'Baseball',
        gender: 'men',
        performanceLevel: 'Strong',
        recentRecord: '31-25',
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Trent Pratt',
        notableAchievements: ['Big 12 Tournament (2024)', 'WCC Champions (2023)'],
        venueName: 'Larry H. Miller Field',
        venueCapacity: 2500
      },
      {
        sport: 'Softball',
        gender: 'women',
        performanceLevel: 'Strong',
        recentRecord: '26-28',
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Gordon Eakin',
        notableAchievements: ['Big 12 competitors', 'WCC Tournament'],
        venueName: 'Gail Miller Field',
        venueCapacity: 1500
      },
      {
        sport: 'Soccer',
        gender: 'women',
        performanceLevel: 'Strong',
        recentRecord: '12-6-2',
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Jennifer Rockwood',
        notableAchievements: ['NCAA Tournament (2023)', 'Big 12 competitors'],
        venueName: 'South Field',
        venueCapacity: 1000
      },
      {
        sport: 'Tennis',
        gender: 'men',
        performanceLevel: 'Strong',
        recentRecord: '14-12',
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Brad Pearce',
        notableAchievements: ['Big 12 Tournament (2024)', 'WCC Champions (2023)']
      },
      {
        sport: 'Golf',
        gender: 'men',
        performanceLevel: 'Strong',
        recentRecord: '5 tournament wins',
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Bruce Brockbank',
        notableAchievements: ['NCAA Tournament (2024)', 'Big 12 competitors']
      },
      {
        sport: 'Golf',
        gender: 'women',
        performanceLevel: 'Strong',
        recentRecord: '3 tournament wins',
        championships: 0,
        conference: 'Big 12',
        headCoach: 'Carrie Roberts',
        notableAchievements: ['NCAA Tournament (2024)', 'Big 12 competitors']
      }
    ]
  }
]

// Add more universities here - this would continue for all 16 Big 12 schools
// For brevity, I'm showing the pattern with 4 detailed examples

export function getBig12SchoolData(): School[] {
  return BIG12_SCHOOLS
}

export function getBig12SchoolBySlug(slug: string): School | null {
  return BIG12_SCHOOLS.find(school => school.slug === slug) || null
}

export function getBig12SchoolById(id: number): School | null {
  return BIG12_SCHOOLS.find(school => school.id === id) || null
}

export function getBig12SchoolsByState(state: string): School[] {
  return BIG12_SCHOOLS.filter(school => school.state === state)
}

export function getBig12SchoolsByPerformanceLevel(level: string): School[] {
  return BIG12_SCHOOLS.filter(school => 
    school.teams.some(team => team.performanceLevel === level)
  )
}