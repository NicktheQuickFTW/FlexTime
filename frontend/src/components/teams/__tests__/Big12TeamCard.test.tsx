import React from 'react';
import { Big12TeamCard, Big12TeamGrid } from '../Big12TeamCard';
import { BIG12_TEAMS } from '../../../data/big12Teams';
import { render, screen, userEvent } from '../../../utils/testUtils';
import { vi } from '@jest/globals';

describe('Big12TeamCard', () => {
  const mockTeam = BIG12_TEAMS.kansas;
  const mockOnSelect = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Rendering', () => {
    it('should render team information correctly', () => {
      render(<Big12TeamCard team={mockTeam} />);
      
      expect(screen.getByText('Kansas')).toBeInTheDocument();
      expect(screen.getByText('Jayhawks')).toBeInTheDocument();
      expect(screen.getByAltText('University of Kansas logo')).toBeInTheDocument();
    });
    
    it('should render compact variant without text', () => {
      render(<Big12TeamCard team={mockTeam} variant="compact" />);
      
      expect(screen.queryByText('Kansas')).not.toBeInTheDocument();
      expect(screen.queryByText('Jayhawks')).not.toBeInTheDocument();
      expect(screen.getByAltText('University of Kansas logo')).toBeInTheDocument();
    });
    
    it('should render detailed variant with location and venues', () => {
      render(<Big12TeamCard team={mockTeam} variant="detailed" showVenue />);
      
      expect(screen.getByText('Location:')).toBeInTheDocument();
      expect(screen.getByText('Lawrence, KS')).toBeInTheDocument();
      expect(screen.getByText('Allen Fieldhouse')).toBeInTheDocument();
      expect(screen.getByText('David Booth Kansas Memorial Stadium')).toBeInTheDocument();
    });
    
    it('should apply team-specific CSS variables', () => {
      const { container } = render(<Big12TeamCard team={mockTeam} />);
      const card = container.querySelector('.ft-team-kansas');
      
      expect(card).toHaveStyle({
        '--team-primary': '#0051BA',
        '--team-primary-rgb': '0, 81, 186',
        '--team-secondary': '#E8000D',
        '--team-secondary-rgb': '232, 0, 13',
      });
    });
  });
  
  describe('Theme Support', () => {
    it('should use dark logo in dark theme', () => {
      render(<Big12TeamCard team={mockTeam} />, { theme: 'dark' });
      
      const logo = screen.getByAltText('University of Kansas logo') as HTMLImageElement;
      expect(logo.src).toContain('/assets/logos/teams/dark/kansas.svg');
    });
    
    it('should use light logo in light theme', () => {
      render(<Big12TeamCard team={mockTeam} />, { theme: 'light' });
      
      const logo = screen.getByAltText('University of Kansas logo') as HTMLImageElement;
      expect(logo.src).toContain('/assets/logos/teams/light/kansas.svg');
    });
  });
  
  describe('Interactions', () => {
    it('should call onSelect when clicked', async () => {
      render(<Big12TeamCard team={mockTeam} onSelect={mockOnSelect} />);
      const user = userEvent.setup();
      
      const card = screen.getByText('Kansas').closest('.ft-team-card');
      await user.click(card!);
      
      expect(mockOnSelect).toHaveBeenCalledWith(mockTeam);
    });
    
    it('should show selected state', () => {
      render(<Big12TeamCard team={mockTeam} isSelected />);
      
      const card = screen.getByText('Kansas').closest('.ft-team-card');
      expect(card).toHaveClass('ft-team-card-selected');
    });
    
    it('should have cursor pointer when clickable', () => {
      render(<Big12TeamCard team={mockTeam} onSelect={mockOnSelect} />);
      
      const card = screen.getByText('Kansas').closest('.ft-team-card');
      expect(card).toHaveClass('ft-team-card-clickable');
    });
  });
  
  describe('Color Bar', () => {
    it('should display all team colors', () => {
      const { container } = render(<Big12TeamCard team={mockTeam} />);
      
      const primaryColor = container.querySelector('.ft-color-primary');
      const secondaryColor = container.querySelector('.ft-color-secondary');
      const accentColor = container.querySelector('.ft-color-accent');
      
      expect(primaryColor).toBeInTheDocument();
      expect(secondaryColor).toBeInTheDocument();
      expect(accentColor).toBeInTheDocument();
    });
    
    it('should not show accent color if not defined', () => {
      const teamWithoutAccent = { 
        ...mockTeam, 
        colors: { 
          ...mockTeam.colors, 
          accent: undefined,
          accentRGB: undefined 
        } 
      };
      
      const { container } = render(<Big12TeamCard team={teamWithoutAccent} />);
      const accentColor = container.querySelector('.ft-color-accent');
      
      expect(accentColor).not.toBeInTheDocument();
    });
  });
  
  describe('Animation', () => {
    it('should animate on mount', () => {
      const { container } = render(<Big12TeamCard team={mockTeam} />);
      const card = container.querySelector('.ft-team-card');
      
      // Framer Motion adds inline styles for animations
      expect(card).toHaveStyle({ opacity: '1' });
    });
  });
});

describe('Big12TeamGrid', () => {
  const mockTeams = Object.values(BIG12_TEAMS).slice(0, 4);
  const mockOnSelectTeam = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Rendering', () => {
    it('should render all teams', () => {
      render(<Big12TeamGrid teams={mockTeams} />);
      
      mockTeams.forEach(team => {
        expect(screen.getByText(team.shortName)).toBeInTheDocument();
      });
    });
    
    it('should apply custom column count', () => {
      const { container } = render(<Big12TeamGrid teams={mockTeams} columns={2} />);
      const grid = container.querySelector('.ft-team-grid');
      
      expect(grid).toHaveStyle({ '--grid-columns': '2' });
    });
    
    it('should pass variant to team cards', () => {
      render(<Big12TeamGrid teams={mockTeams} variant="compact" />);
      
      mockTeams.forEach(team => {
        expect(screen.queryByText(team.mascot)).not.toBeInTheDocument();
      });
    });
  });
  
  describe('Selection', () => {
    it('should highlight selected team', () => {
      render(
        <Big12TeamGrid 
          teams={mockTeams} 
          selectedTeamId="kansas" 
          onSelectTeam={mockOnSelectTeam}
        />
      );
      
      const kansasCard = screen.getByText('Kansas').closest('.ft-team-card');
      expect(kansasCard).toHaveClass('ft-team-card-selected');
    });
    
    it('should call onSelectTeam when team is clicked', async () => {
      render(
        <Big12TeamGrid 
          teams={mockTeams} 
          onSelectTeam={mockOnSelectTeam}
        />
      );
      const user = userEvent.setup();
      
      const baylorCard = screen.getByText('Baylor').closest('.ft-team-card');
      await user.click(baylorCard!);
      
      expect(mockOnSelectTeam).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'baylor' })
      );
    });
  });
  
  describe('Stagger Animation', () => {
    it('should animate teams with stagger effect', () => {
      const { container } = render(<Big12TeamGrid teams={mockTeams} />);
      const cards = container.querySelectorAll('.ft-team-card');
      
      // Each card should be wrapped in a motion div
      expect(cards).toHaveLength(mockTeams.length);
    });
  });
  
  describe('Responsive Behavior', () => {
    it('should render with default 4 columns', () => {
      const { container } = render(<Big12TeamGrid teams={mockTeams} />);
      const grid = container.querySelector('.ft-team-grid');
      
      expect(grid).toHaveStyle({ '--grid-columns': '4' });
    });
  });
  
  describe('Performance', () => {
    it('should handle all 16 teams efficiently', () => {
      const allTeams = Object.values(BIG12_TEAMS);
      
      const start = performance.now();
      render(<Big12TeamGrid teams={allTeams} />);
      const end = performance.now();
      
      expect(end - start).toBeLessThan(500); // Should render in under 500ms
      expect(screen.getAllByText(/University/i)).toHaveLength(16);
    });
  });
});