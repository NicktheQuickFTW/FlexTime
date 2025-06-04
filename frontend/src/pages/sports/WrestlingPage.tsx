import React from 'react';
import SportPage from './SportPage';

/**
 * Wrestling Sport Page (sport_id: 25)
 * Code: WRES
 * Gender: Men's
 * Season: Winter
 * Teams: 6
 * Championship: Championship (Tulsa, OK)
 */
const WrestlingPage: React.FC = () => {
  return <SportPage sportId={25} />;
};

export default WrestlingPage;