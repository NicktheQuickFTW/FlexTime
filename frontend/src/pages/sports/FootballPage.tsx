import React from 'react';
import SportPage from './SportPage';

/**
 * Football Sport Page (sport_id: 8)
 * Code: FB
 * Gender: Men's
 * Season: Fall
 * Teams: 16
 * Championship: Playoff (Dallas, TX)
 */
const FootballPage: React.FC = () => {
  return <SportPage sportId={8} />;
};

export default FootballPage;