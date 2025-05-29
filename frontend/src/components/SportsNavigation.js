import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/SportsNavigation.css';

const sports = [
  { 
    id: 'football', 
    sport_name: 'Football', 
    icon: '🏈',
    gender: 'Men\'s'
  },
  { 
    id: 'mens-basketball', 
    sport_name: 'Men\'s Basketball', 
    icon: '🏀',
    gender: 'Men\'s'
  },
  { 
    id: 'womens-basketball', 
    sport_name: 'Women\'s Basketball', 
    icon: '🏀',
    gender: 'Women\'s'
  },
  { 
    id: 'baseball', 
    sport_name: 'Baseball', 
    icon: '⚾',
    gender: 'Men\'s'
  },
  { 
    id: 'softball', 
    sport_name: 'Softball', 
    icon: '🥎',
    gender: 'Women\'s'
  },
  { 
    id: 'volleyball', 
    sport_name: 'Volleyball', 
    icon: '🏐',
    gender: 'Women\'s'
  },
  { 
    id: 'soccer', 
    sport_name: 'Soccer', 
    icon: '⚽',
    gender: 'Women\'s'
  },
  { 
    id: 'gymnastics', 
    sport_name: 'Gymnastics', 
    icon: '🤸',
    gender: 'Women\'s'
  },
  { 
    id: 'wrestling', 
    sport_name: 'Wrestling', 
    icon: '🤼',
    gender: 'Men\'s'
  },
  { 
    id: 'mens-tennis', 
    sport_name: 'Men\'s Tennis', 
    icon: '🎾',
    gender: 'Men\'s'
  },
  { 
    id: 'womens-tennis', 
    sport_name: 'Women\'s Tennis', 
    icon: '🎾',
    gender: 'Women\'s'
  },
  { 
    id: 'lacrosse', 
    sport_name: 'Lacrosse', 
    icon: '🥍',
    gender: 'Women\'s'
  },
  { 
    id: 'rowing', 
    sport_name: 'Rowing', 
    icon: '🚣',
    gender: 'Women\'s'
  },
  { 
    id: 'equestrian', 
    sport_name: 'Equestrian', 
    icon: '🏇',
    gender: 'Women\'s'
  }
];

const SportsNavigation = () => {
  // Group sports by gender for better organization
  const sportsByGender = sports.reduce((acc, sport) => {
    if (!acc[sport.gender]) {
      acc[sport.gender] = [];
    }
    acc[sport.gender].push(sport);
    return acc;
  }, {});

  // Sort gender groups: Men's first, then Women's
  const sortedGenders = Object.entries(sportsByGender).sort(([genderA], [genderB]) => {
    if (genderA === "Men's") return -1;
    if (genderB === "Men's") return 1;
    return 0;
  });

  return (
    <div className="sports-container">
      <h1>Big 12 Conference Sports</h1>
      
      {sortedGenders.map(([gender, genderSports]) => (
        <div key={gender} className="sports-gender-group">
          <h2>{gender} Sports</h2>
          <div className="sports-grid">
            {genderSports
              .sort((a, b) => a.sport_name.localeCompare(b.sport_name))
              .map((sport) => (
                <div key={sport.id} className="sport-card">
                  <Link to={`/sports/${sport.id}`} className="sport-link">
                    <div className="sport-icon">{sport.icon}</div>
                    <div className="sport-name">
                      {sport.sport_name.replace(/^(Men's|Women's)\s+/, '')}
                    </div>
                    <div className="sport-meta">
                      <span className="sport-gender">{sport.gender}</span>
                    </div>
                  </Link>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SportsNavigation;
