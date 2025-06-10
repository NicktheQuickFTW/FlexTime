import React from 'react';
import { motion } from 'framer-motion';
import { TeamBranding } from '../../data/big12Teams';
import { useThemeContext } from '../../contexts/ThemeContext';
import './Big12TeamCard.css';

interface Big12TeamCardProps {
  team: TeamBranding;
  variant?: 'default' | 'compact' | 'detailed';
  showVenue?: boolean;
  onSelect?: (team: TeamBranding) => void;
  isSelected?: boolean;
  className?: string;
}

export const Big12TeamCard: React.FC<Big12TeamCardProps> = ({
  team,
  variant = 'default',
  showVenue = false,
  onSelect,
  isSelected = false,
  className = ''
}) => {
  const { theme } = useThemeContext();
  const isDarkTheme = theme.mode === 'dark';
  
  const teamStyles = {
    '--team-primary': team.colors.primary,
    '--team-primary-rgb': team.colors.primaryRGB,
    '--team-secondary': team.colors.secondary,
    '--team-secondary-rgb': team.colors.secondaryRGB,
    '--team-accent': team.colors.accent || team.colors.secondary,
    '--team-accent-rgb': team.colors.accentRGB || team.colors.secondaryRGB,
  } as React.CSSProperties;
  
  const handleClick = () => {
    if (onSelect) {
      onSelect(team);
    }
  };
  
  return (
    <motion.div
      className={`
        ft-team-card 
        ft-team-card-${variant} 
        ft-team-${team.id}
        ${isSelected ? 'ft-team-card-selected' : ''}
        ${onSelect ? 'ft-team-card-clickable' : ''}
        ${className}
      `}
      style={teamStyles}
      onClick={handleClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onSelect ? { scale: 1.02 } : {}}
      whileTap={onSelect ? { scale: 0.98 } : {}}
    >
      <div className="ft-team-card-header">
        <div className="ft-team-logo-container">
          <img 
            src={team.logos[isDarkTheme ? 'dark' : 'light']} 
            alt={`${team.name} logo`}
            className="ft-team-logo"
            loading="lazy"
          />
        </div>
        
        {variant !== 'compact' && (
          <div className="ft-team-info">
            <h3 className="ft-team-name">{team.shortName}</h3>
            <p className="ft-team-mascot">{team.mascot}</p>
          </div>
        )}
      </div>
      
      {variant === 'detailed' && (
        <div className="ft-team-details">
          <div className="ft-team-location">
            <span className="ft-detail-label">Location:</span>
            <span className="ft-detail-value">{team.location.city}, {team.location.state}</span>
          </div>
          
          {showVenue && (
            <div className="ft-team-venues">
              {team.venues.football && (
                <div className="ft-venue-item">
                  <span className="ft-venue-icon">🏈</span>
                  <span className="ft-venue-name">{team.venues.football}</span>
                </div>
              )}
              {team.venues.basketball && (
                <div className="ft-venue-item">
                  <span className="ft-venue-icon">🏀</span>
                  <span className="ft-venue-name">{team.venues.basketball}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      <div className="ft-team-color-bar">
        <div className="ft-color-primary" />
        <div className="ft-color-secondary" />
        {team.colors.accent && <div className="ft-color-accent" />}
      </div>
    </motion.div>
  );
};

// Team Grid Component for displaying multiple teams
interface Big12TeamGridProps {
  teams: TeamBranding[];
  variant?: 'default' | 'compact' | 'detailed';
  onSelectTeam?: (team: TeamBranding) => void;
  selectedTeamId?: string;
  columns?: number;
}

export const Big12TeamGrid: React.FC<Big12TeamGridProps> = ({
  teams,
  variant = 'default',
  onSelectTeam,
  selectedTeamId,
  columns = 4
}) => {
  const gridStyle = {
    '--grid-columns': columns
  } as React.CSSProperties;
  
  return (
    <motion.div 
      className="ft-team-grid" 
      style={gridStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.05 }}
    >
      {teams.map((team, index) => (
        <motion.div
          key={team.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Big12TeamCard
            team={team}
            variant={variant}
            onSelect={onSelectTeam}
            isSelected={selectedTeamId === team.id}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default Big12TeamCard;