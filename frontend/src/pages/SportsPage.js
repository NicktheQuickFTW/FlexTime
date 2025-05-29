import React from 'react';
import { useParams } from 'react-router-dom';
import SportsNavigation from '../components/SportsNavigation';

const SportsPage = () => {
  const { sportId } = useParams();

  // If a specific sport is selected, show its details
  if (sportId) {
    return (
      <div className="sport-detail-page">
        <h1>Sport Details: {sportId}</h1>
        {/* Sport-specific content will go here */}
      </div>
    );
  }

  // Otherwise, show the sports navigation
  return (
    <div className="sports-page">
      <SportsNavigation />
    </div>
  );
};

export default SportsPage;
