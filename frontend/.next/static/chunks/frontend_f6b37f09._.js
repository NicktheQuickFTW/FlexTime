(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/frontend/src/data/big12-schools.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// Comprehensive Big 12 University Data with Team Information
// Following 21st-dev inspired design system with school-specific branding
__turbopack_context__.s({
    "getBig12UniversitiesByPerformanceLevel": (()=>getBig12UniversitiesByPerformanceLevel),
    "getBig12UniversitiesByState": (()=>getBig12UniversitiesByState),
    "getBig12UniversityById": (()=>getBig12UniversityById),
    "getBig12UniversityBySlug": (()=>getBig12UniversityBySlug),
    "getBig12UniversityData": (()=>getBig12UniversityData)
});
const BIG12_UNIVERSITIES = [
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
        notableSports: [
            'Basketball',
            'Softball',
            'Swimming'
        ],
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
                notableAchievements: [
                    'Pac-12 South Division Champions (2014)',
                    'Fiesta Bowl Champions (2014)'
                ],
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
                notableAchievements: [
                    'NCAA Championship (1997)',
                    'Sweet 16 (2024)',
                    'Pac-12 Tournament Champions (2024)'
                ],
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
                notableAchievements: [
                    'NCAA Championship Game (2021)',
                    'Pac-12 Tournament Champions (2021)'
                ],
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
                notableAchievements: [
                    'NCAA Champions (2006, 2007, 2010)',
                    'College World Series (2024)'
                ],
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
                notableAchievements: [
                    'NCAA Champions (1976, 1980, 1986, 2012)',
                    'College World Series (2022)'
                ],
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
                notableAchievements: [
                    'NCAA Champions (2008, 2016)',
                    'Pac-12 Champions (2024)'
                ],
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
                notableAchievements: [
                    'NCAA Champions (2018)',
                    'Pac-12 Champions (2024)'
                ],
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
                notableAchievements: [
                    'NCAA Regional Champions (2024)',
                    'Pac-12 Champions (2023)'
                ]
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
                notableAchievements: [
                    'NCAA Regional Qualifiers (2024)',
                    'Pac-12 Top 3 (2023)'
                ]
            },
            {
                sport: 'Track & Field',
                gender: 'men',
                performanceLevel: 'Strong',
                recentRecord: '3rd Pac-12',
                championships: 0,
                conference: 'Big 12',
                headCoach: 'Fred Harvey',
                notableAchievements: [
                    'Individual NCAA Champions',
                    'Pac-12 medalists (2024)'
                ]
            },
            {
                sport: 'Track & Field',
                gender: 'women',
                performanceLevel: 'Strong',
                recentRecord: '4th Pac-12',
                championships: 0,
                conference: 'Big 12',
                headCoach: 'Fred Harvey',
                notableAchievements: [
                    'Individual NCAA Champions',
                    'Pac-12 medalists (2024)'
                ]
            },
            {
                sport: 'Tennis',
                gender: 'men',
                performanceLevel: 'Strong',
                recentRecord: '16-10',
                championships: 0,
                conference: 'Big 12',
                headCoach: 'Clancy Shields',
                notableAchievements: [
                    'NCAA Tournament (2024)',
                    'Pac-12 Tournament (2023)'
                ]
            },
            {
                sport: 'Tennis',
                gender: 'women',
                performanceLevel: 'Strong',
                recentRecord: '14-12',
                championships: 0,
                conference: 'Big 12',
                headCoach: 'Tessa Lang',
                notableAchievements: [
                    'NCAA Tournament (2024)',
                    'Pac-12 competitors'
                ]
            },
            {
                sport: 'Volleyball',
                gender: 'women',
                performanceLevel: 'Strong',
                recentRecord: '20-12',
                championships: 0,
                conference: 'Big 12',
                headCoach: 'Rita Stubbs',
                notableAchievements: [
                    'NCAA Tournament (2023)',
                    'Pac-12 competitors'
                ],
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
                notableAchievements: [
                    'NCAA Tournament (2023)',
                    'Pac-12 competitors'
                ],
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
                notableAchievements: [
                    'NCAA Regional Finals (2024)',
                    'Pac-12 Top 5'
                ],
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
        notableSports: [
            'Wrestling',
            'Baseball',
            'Golf'
        ],
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
                notableAchievements: [
                    'Big 12 Championship Game (2024)',
                    'College Football Playoff (2024)'
                ],
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
                notableAchievements: [
                    'NCAA Tournament (2021)',
                    'Pac-12 Tournament Final (2021)'
                ],
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
                notableAchievements: [
                    'WNIT Champions (2018)',
                    'Pac-12 competitors'
                ],
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
                notableAchievements: [
                    'NCAA Team Champions (1988, 1992, 1994)',
                    'Pac-12 Champions (2024)'
                ],
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
                notableAchievements: [
                    'NCAA Champions (1965, 1967, 1969, 1977, 1981)',
                    'College World Series (2024)'
                ],
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
                notableAchievements: [
                    'NCAA Champions (1990, 1996)',
                    'NCAA Tournament (2024)'
                ]
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
                notableAchievements: [
                    'NCAA Tournament (2024)',
                    'Pac-12 Champions (2023)'
                ]
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
                notableAchievements: [
                    'Pac-12 Champions (2023)',
                    'NCAA Championships qualifiers'
                ],
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
                notableAchievements: [
                    'Pac-12 Top 3 (2024)',
                    'NCAA Championships qualifiers'
                ],
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
                notableAchievements: [
                    'Individual NCAA Champions',
                    'Pac-12 Champions (2023)'
                ]
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
                notableAchievements: [
                    'Pac-12 Champions (2024)',
                    'Individual NCAA Champions'
                ]
            },
            {
                sport: 'Softball',
                gender: 'women',
                performanceLevel: 'Strong',
                recentRecord: '31-23',
                championships: 0,
                conference: 'Big 12',
                headCoach: 'Trisha Ford',
                notableAchievements: [
                    'NCAA Tournament (2023)',
                    'Pac-12 competitors'
                ],
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
                notableAchievements: [
                    'NCAA Tournament (2022)',
                    'Pac-12 competitors'
                ],
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
                notableAchievements: [
                    'NCAA Tournament (2023)',
                    'Pac-12 competitors'
                ],
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
                notableAchievements: [
                    'NCAA Tournament (2024)',
                    'Pac-12 competitors'
                ]
            },
            {
                sport: 'Tennis',
                gender: 'women',
                performanceLevel: 'Strong',
                recentRecord: '13-13',
                championships: 0,
                conference: 'Big 12',
                headCoach: 'Sheila McInerney',
                notableAchievements: [
                    'NCAA Tournament (2023)',
                    'Pac-12 competitors'
                ]
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
        notableSports: [
            'Basketball',
            'Football',
            'Tennis'
        ],
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
                notableAchievements: [
                    'Big 12 Champions (2021)',
                    'Sugar Bowl Champions (2022)'
                ],
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
                notableAchievements: [
                    'NCAA Champions (2021)',
                    'Big 12 Champions (2024)'
                ],
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
                notableAchievements: [
                    'NCAA Champions (2005, 2012, 2019)',
                    'Elite 8 (2024)'
                ],
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
                notableAchievements: [
                    'College World Series (2005)',
                    'Big 12 Tournament (2024)'
                ],
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
                notableAchievements: [
                    'NCAA Tournament Elite 8 (2024)',
                    'Big 12 Champions (2023)'
                ]
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
                notableAchievements: [
                    'NCAA Tournament (2024)',
                    'Big 12 Champions (2023)'
                ]
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
                notableAchievements: [
                    'NCAA Champions (2022, 2024)',
                    'Big 12 Champions (2024)'
                ]
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
                notableAchievements: [
                    'Big 12 Champions (2024)',
                    'NCAA Individual Champions'
                ]
            },
            {
                sport: 'Softball',
                gender: 'women',
                performanceLevel: 'Strong',
                recentRecord: '29-25',
                championships: 0,
                conference: 'Big 12',
                headCoach: 'Glenn Moore',
                notableAchievements: [
                    'NCAA Tournament (2023)',
                    'Big 12 Tournament'
                ],
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
                notableAchievements: [
                    'NCAA Tournament (2023)',
                    'Big 12 competitors'
                ],
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
                notableAchievements: [
                    'NCAA Tournament (2024)',
                    'Big 12 competitors'
                ],
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
                notableAchievements: [
                    'NCAA Tournament (2024)',
                    'Big 12 Champions (2023)'
                ]
            },
            {
                sport: 'Golf',
                gender: 'women',
                performanceLevel: 'Strong',
                recentRecord: '4 tournament wins',
                championships: 0,
                conference: 'Big 12',
                headCoach: 'Jay Goble',
                notableAchievements: [
                    'NCAA Tournament (2024)',
                    'Big 12 competitors'
                ]
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
        notableSports: [
            'Football',
            'Cross Country',
            'Volleyball'
        ],
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
                notableAchievements: [
                    'National Champions (1984)',
                    'Big 12 Championship Game (2024)'
                ],
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
                notableAchievements: [
                    'NCAA Tournament (2024)',
                    'Big 12 Tournament'
                ],
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
                notableAchievements: [
                    'NCAA Tournament (2023)',
                    'Big 12 competitors'
                ],
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
                notableAchievements: [
                    'NCAA Final Four (2024)',
                    'Big 12 Champions (2024)'
                ],
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
                notableAchievements: [
                    'NCAA Champions (2019)',
                    'Big 12 Champions (2024)'
                ]
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
                notableAchievements: [
                    'NCAA Runners-up (2024)',
                    'Big 12 Champions (2024)'
                ]
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
                notableAchievements: [
                    'Individual NCAA Champions',
                    'Big 12 Champions (2024)'
                ]
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
                notableAchievements: [
                    'Individual NCAA Champions',
                    'Big 12 medalists (2024)'
                ]
            },
            {
                sport: 'Swimming & Diving',
                gender: 'men',
                performanceLevel: 'Strong',
                recentRecord: '8-4',
                championships: 0,
                conference: 'Big 12',
                headCoach: 'Shari Skabelund',
                notableAchievements: [
                    'Big 12 competitors',
                    'Individual champions'
                ]
            },
            {
                sport: 'Swimming & Diving',
                gender: 'women',
                performanceLevel: 'Strong',
                recentRecord: '7-5',
                championships: 0,
                conference: 'Big 12',
                headCoach: 'Shari Skabelund',
                notableAchievements: [
                    'Big 12 competitors',
                    'Individual champions'
                ]
            },
            {
                sport: 'Baseball',
                gender: 'men',
                performanceLevel: 'Strong',
                recentRecord: '31-25',
                championships: 0,
                conference: 'Big 12',
                headCoach: 'Trent Pratt',
                notableAchievements: [
                    'Big 12 Tournament (2024)',
                    'WCC Champions (2023)'
                ],
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
                notableAchievements: [
                    'Big 12 competitors',
                    'WCC Tournament'
                ],
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
                notableAchievements: [
                    'NCAA Tournament (2023)',
                    'Big 12 competitors'
                ],
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
                notableAchievements: [
                    'Big 12 Tournament (2024)',
                    'WCC Champions (2023)'
                ]
            },
            {
                sport: 'Golf',
                gender: 'men',
                performanceLevel: 'Strong',
                recentRecord: '5 tournament wins',
                championships: 0,
                conference: 'Big 12',
                headCoach: 'Bruce Brockbank',
                notableAchievements: [
                    'NCAA Tournament (2024)',
                    'Big 12 competitors'
                ]
            },
            {
                sport: 'Golf',
                gender: 'women',
                performanceLevel: 'Strong',
                recentRecord: '3 tournament wins',
                championships: 0,
                conference: 'Big 12',
                headCoach: 'Carrie Roberts',
                notableAchievements: [
                    'NCAA Tournament (2024)',
                    'Big 12 competitors'
                ]
            }
        ]
    }
];
function getBig12UniversityData() {
    return BIG12_UNIVERSITIES;
}
function getBig12UniversityBySlug(slug) {
    return BIG12_UNIVERSITIES.find((university)=>university.slug === slug) || null;
}
function getBig12UniversityById(id) {
    return BIG12_UNIVERSITIES.find((university)=>university.id === id) || null;
}
function getBig12UniversitiesByState(state) {
    return BIG12_UNIVERSITIES.filter((university)=>university.state === state);
}
function getBig12UniversitiesByPerformanceLevel(level) {
    return BIG12_UNIVERSITIES.filter((university)=>university.teams.some((team)=>team.performanceLevel === level));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/frontend/app/teams/page.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>SportsPage)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$data$2f$big12$2d$schools$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/data/big12-schools.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$FlexTimeShinyButton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/FlexTimeShinyButton.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
// API client function
const fetchSchoolsFromAPI = async ()=>{
    try {
        // Add a timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(()=>controller.abort(), 3000);
        const response = await fetch('/api/scheduling-service/schools', {
            signal: controller.signal
        }).finally(()=>clearTimeout(timeoutId));
        if (!response.ok) throw new Error('Failed to fetch schools');
        const data = await response.json();
        return data.schools || [];
    } catch (error) {
        console.error('Error fetching schools from API:', error);
        return [];
    }
};
// Convert school API data to school display format
const convertSchoolToSchool = (school)=>{
    const sportsMapping = {
        'Arizona': [
            'Football',
            'Basketball',
            'Baseball'
        ],
        'Arizona State': [
            'Football',
            'Basketball',
            'Baseball'
        ],
        'Baylor': [
            'Football',
            'Basketball',
            'Baseball'
        ],
        'BYU': [
            'Football',
            'Basketball',
            'Baseball'
        ],
        'UCF': [
            'Football',
            'Basketball',
            'Baseball'
        ],
        'Cincinnati': [
            'Football',
            'Basketball',
            'Soccer'
        ],
        'Colorado': [
            'Football',
            'Basketball',
            'Soccer'
        ],
        'Houston': [
            'Football',
            'Basketball',
            'Baseball'
        ],
        'Iowa State': [
            'Football',
            'Basketball',
            'Wrestling'
        ],
        'Kansas': [
            'Football',
            'Basketball',
            'Baseball'
        ],
        'Kansas State': [
            'Football',
            'Basketball',
            'Baseball'
        ],
        'Oklahoma State': [
            'Football',
            'Basketball',
            'Wrestling'
        ],
        'TCU': [
            'Football',
            'Basketball',
            'Baseball'
        ],
        'Texas Tech': [
            'Football',
            'Basketball',
            'Baseball'
        ],
        'Utah': [
            'Football',
            'Basketball',
            'Gymnastics'
        ],
        'West Virginia': [
            'Football',
            'Basketball',
            'Wrestling'
        ]
    };
    const getSlug = (name)=>{
        return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    };
    const getLogoSlug = (name)=>{
        // Mapping for logos (which use hyphens for some and underscores for others)
        const mapping = {
            'Arizona': 'arizona',
            'Arizona State': 'arizona_state',
            'Baylor': 'baylor',
            'BYU': 'byu',
            'UCF': 'ucf',
            'Cincinnati': 'cincinnati',
            'Colorado': 'colorado',
            'Houston': 'houston',
            'Iowa State': 'iowa_state',
            'Kansas': 'kansas',
            'Kansas State': 'kansas_state',
            'Oklahoma State': 'oklahoma_state',
            'TCU': 'tcu',
            'Texas Tech': 'texas_tech',
            'Utah': 'utah',
            'West Virginia': 'west_virginia'
        };
        return mapping[name] || getSlug(name);
    };
    return {
        id: school.school_id.toString(),
        name: school.school,
        shortName: school.short_display,
        nickname: school.mascot,
        location: school.location,
        founded: school.founded_year,
        primaryColor: school.primary_color,
        secondaryColor: school.secondary_color,
        slug: getSlug(school.school),
        logoSlug: getLogoSlug(school.school),
        totalSports: 16,
        recentChampions: 3,
        notableSports: sportsMapping[school.school] || [
            'Football',
            'Basketball',
            'Baseball'
        ]
    };
};
function SportsPage() {
    _s();
    const [schools, setSchools] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    // Function to determine logo source based on school name
    const getLogoSrc = (school)=>{
        // Use dark logos for Cincinnati and Baylor, light logos for everyone else
        if (school.name === 'Cincinnati' || school.name === 'Baylor') {
            return `/logos/teams/dark/${school.logoSlug}-dark.svg`;
        }
        return `/logos/teams/light/${school.logoSlug}-light.svg`;
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SportsPage.useEffect": ()=>{
            // Start with static data immediately to ensure page always loads
            setSchools((0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$data$2f$big12$2d$schools$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getBig12UniversityData"])());
            setLoading(false);
            // Then try to fetch from API in the background
            const loadSchools = {
                "SportsPage.useEffect.loadSchools": async ()=>{
                    try {
                        const schoolsData = await fetchSchoolsFromAPI();
                        if (schoolsData.length > 0) {
                            // Use API data - convert to school format
                            const convertedSchools = schoolsData.map(convertSchoolToSchool);
                            setSchools(convertedSchools);
                        }
                    } catch (err) {
                        console.error('Error loading schools:', err);
                    // We already have the fallback data loaded
                    }
                }
            }["SportsPage.useEffect.loadSchools"];
            // Don't wait for the API - try to load in background
            loadSchools();
        }
    }["SportsPage.useEffect"], []);
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "sports-page-container",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "sports-page-header",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: "sports-page-title ft-font-brand bg-gradient-to-r from-white to-[color:var(--ft-neon)] bg-clip-text text-transparent",
                            children: "BIG 12 CONFERENCE"
                        }, void 0, false, {
                            fileName: "[project]/frontend/app/teams/page.tsx",
                            lineNumber: 170,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "sports-page-subtitle",
                            children: "Loading school data..."
                        }, void 0, false, {
                            fileName: "[project]/frontend/app/teams/page.tsx",
                            lineNumber: 173,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/app/teams/page.tsx",
                    lineNumber: 169,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-center items-center h-64",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"
                    }, void 0, false, {
                        fileName: "[project]/frontend/app/teams/page.tsx",
                        lineNumber: 176,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/frontend/app/teams/page.tsx",
                    lineNumber: 175,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/app/teams/page.tsx",
            lineNumber: 168,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "sports-page-container",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "sports-page-header",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "sports-page-title ft-font-brand bg-gradient-to-r from-white to-[color:var(--ft-neon)] bg-clip-text text-transparent",
                        children: "A DIFFERENT LEAGUE"
                    }, void 0, false, {
                        fileName: "[project]/frontend/app/teams/page.tsx",
                        lineNumber: 186,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "sports-page-subtitle text-sm tracking-tight text-slate-400 font-secondary max-w-3xl mx-auto leading-relaxed",
                        children: "Discover the powerhouse schools driving collegiate athletics excellence. Choose your school to explore teams, stats, and championship legacy."
                    }, void 0, false, {
                        fileName: "[project]/frontend/app/teams/page.tsx",
                        lineNumber: 189,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/app/teams/page.tsx",
                lineNumber: 185,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "universities-grid",
                children: schools.map((school)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        href: `/schools/${school.slug}`,
                        className: "university-card",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "university-card-header",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "university-logo",
                                        style: {
                                            backgroundColor: school.primaryColor + '20'
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                src: getLogoSrc(school),
                                                alt: `${school.name} logo`,
                                                className: "w-12 h-12 object-contain mx-auto",
                                                "data-component-name": "SportsPage",
                                                onError: (e)=>{
                                                    // Fallback to primary logo if specific logo fails to load
                                                    const target = e.target;
                                                    target.src = `/logos/teams/${school.logoSlug}.svg`;
                                                    target.onerror = ()=>{
                                                        // Final fallback to initials if both logos fail
                                                        target.style.display = 'none';
                                                        const fallback = target.nextElementSibling;
                                                        if (fallback) fallback.style.display = 'block';
                                                    };
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/app/teams/page.tsx",
                                                lineNumber: 201,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-2xl font-bold text-white hidden",
                                                style: {
                                                    display: 'none'
                                                },
                                                children: school.name.charAt(0)
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/app/teams/page.tsx",
                                                lineNumber: 218,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/app/teams/page.tsx",
                                        lineNumber: 200,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "university-name",
                                        "data-component-name": "SportsPage",
                                        children: school.shortName ? school.shortName.toUpperCase() : school.name.toUpperCase()
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/teams/page.tsx",
                                        lineNumber: 225,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "university-nickname",
                                        children: school.nickname
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/teams/page.tsx",
                                        lineNumber: 228,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/app/teams/page.tsx",
                                lineNumber: 199,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "university-card-body",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "university-stats",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "university-stat",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "university-stat-value",
                                                        children: school.totalSports
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/app/teams/page.tsx",
                                                        lineNumber: 236,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "university-stat-label",
                                                        children: "Sports"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/app/teams/page.tsx",
                                                        lineNumber: 237,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/app/teams/page.tsx",
                                                lineNumber: 235,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "university-stat",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "university-stat-value",
                                                        children: school.recentChampions
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/app/teams/page.tsx",
                                                        lineNumber: 240,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "university-stat-label",
                                                        children: "Championships"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/app/teams/page.tsx",
                                                        lineNumber: 241,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/app/teams/page.tsx",
                                                lineNumber: 239,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/app/teams/page.tsx",
                                        lineNumber: 234,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-center mb-4 mt-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-sm text-slate-400 mb-1",
                                                children: school.location
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/app/teams/page.tsx",
                                                lineNumber: 247,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xs text-slate-500",
                                                children: [
                                                    "Founded ",
                                                    school.founded
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/app/teams/page.tsx",
                                                lineNumber: 248,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/app/teams/page.tsx",
                                        lineNumber: 246,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "university-weather",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "weather-widget",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center justify-center gap-2 text-sm",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-blue-400",
                                                        children: "☀️"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/app/teams/page.tsx",
                                                        lineNumber: 255,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-slate-300",
                                                        children: "72°F"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/app/teams/page.tsx",
                                                        lineNumber: 256,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-slate-400",
                                                        children: "Sunny"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/app/teams/page.tsx",
                                                        lineNumber: 257,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/app/teams/page.tsx",
                                                lineNumber: 254,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/app/teams/page.tsx",
                                            lineNumber: 253,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/teams/page.tsx",
                                        lineNumber: 252,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/app/teams/page.tsx",
                                lineNumber: 232,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "university-card-footer",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$FlexTimeShinyButton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FlexTimeShinyButton"], {
                                    variant: "neon",
                                    className: "university-view-button",
                                    children: "EXPLORE TEAMS"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/teams/page.tsx",
                                    lineNumber: 265,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/teams/page.tsx",
                                lineNumber: 264,
                                columnNumber: 13
                            }, this)
                        ]
                    }, school.id, true, {
                        fileName: "[project]/frontend/app/teams/page.tsx",
                        lineNumber: 198,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/frontend/app/teams/page.tsx",
                lineNumber: 196,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/app/teams/page.tsx",
        lineNumber: 183,
        columnNumber: 5
    }, this);
}
_s(SportsPage, "UQ9EWo5pRbT4fn3KXBKIFwpR1UM=");
_c = SportsPage;
var _c;
__turbopack_context__.k.register(_c, "SportsPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=frontend_f6b37f09._.js.map