import React from 'react';
import SportPage from './SportPage';

/**
 * Women's Basketball Sport Page (sport_id: 3)
 * Code: WBB
 * Gender: Women's
 * Season: Winter
 * Teams: 14
 * Championship: Tournament (Kansas City, MO)
 */
const WomensBasketballPage: React.FC = () => {
  return <SportPage sportId={3} />;
};

export default WomensBasketballPage;