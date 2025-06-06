'use client';

import React, { useMemo } from 'react';
import { format, parseISO, eachWeekOfInterval, startOfWeek, endOfWeek, isSameWeek } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { cn } from '../../../lib/utils';
import { type Game, type Team } from '../../utils/scheduleApi';
import { BIG12_TEAMS, type TeamBranding } from '../../data/big12-teams';

interface ScheduleGanttMatrixProps {
  games: Game[];
  teams: Team[];
  className?: string;
  sport?: string;
  season?: string;
}

interface WeeklyGame {
  week: Date;
  weekLabel: string;
  games: Game[];
}

interface TeamWeekData {
  teamId: number;
  teamName: string;
  weeks: Map<string, Game[]>;
}

// Helper function to get Big 12 team branding data
const getBig12TeamData = (team: Team | undefined): TeamBranding | null => {
  if (!team) return null;
  
  // Try to match by shortName first
  const teamByShortName = Object.values(BIG12_TEAMS).find(
    t => t.shortName.toLowerCase() === (team.shortName || '').toLowerCase()
  );
  if (teamByShortName) return teamByShortName;
  
  // Try to match by name
  const teamByName = Object.values(BIG12_TEAMS).find(
    t => t.name.toLowerCase().includes((team.name || '').toLowerCase())
  );
  if (teamByName) return teamByName;
  
  return null;
};

// Helper function to get team abbreviation
const getTeamAbbreviation = (team: Team | undefined): string => {
  if (!team) return 'UNK';
  
  const big12Data = getBig12TeamData(team);
  if (big12Data) return big12Data.abbreviation;
  
  return team.shortName || team.name?.split(' ')[0] || `T${team.team_id}`;
};

// Helper function to get team short display name
const getTeamShortDisplayName = (team: Team | undefined): string => {
  if (!team) return 'Unknown';
  
  const big12Data = getBig12TeamData(team);
  if (big12Data) return big12Data.shortName;
  
  return team.shortName || team.name?.split(' ')[0] || `Team ${team.team_id}`;
};

// Helper function to get team mascot
const getTeamMascot = (team: Team | undefined): string => {
  if (!team) return 'Unknown';
  
  const big12Data = getBig12TeamData(team);
  if (big12Data) return big12Data.mascot;
  
  return 'Team';
};

// Helper function to get team logo (hydration-safe)
const getTeamLogo = (team: Team | undefined): string | null => {
  if (!team) {
    console.log('getTeamLogo: No team provided');
    return null;
  }
  
  const big12Data = getBig12TeamData(team);
  
  if (big12Data) {
    // Use the main directory logo to avoid hydration issues
    // The dark/light theme will be handled via CSS or a different approach
    const mainLogoPath = `/LOGOS/teams/${big12Data.id}.svg`;
    
    console.log(`getTeamLogo: Found Big 12 team data for ${big12Data.shortName} -> ${mainLogoPath}`);
    return mainLogoPath;
  }
  
  // Try to construct a simple logo path based on team name
  const teamName = team.shortName || team.name || '';
  if (teamName) {
    const normalizedName = teamName.toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
    
    const mainLogoPath = `/LOGOS/teams/${normalizedName}.svg`;
    
    console.log(`getTeamLogo: Constructed path for ${teamName}: ${mainLogoPath}`);
    return mainLogoPath;
  }
  
  // Fallback to existing logo field
  const fallbackLogo = team.logo ? (team.logo.startsWith('/') ? team.logo : `/logos/${team.logo}`) : null;
  console.log(`getTeamLogo: No Big 12 data found for ${team.shortName || team.name}, using fallback: ${fallbackLogo}`);
  return fallbackLogo;
};

export function ScheduleGanttMatrix({ games, teams, className, sport = 'Sport', season = '2024-25' }: ScheduleGanttMatrixProps) {
  // Format season based on sport type
  const formatSeasonDisplay = (sportName: string, seasonYear: string) => {
    const fallSports = ['Football'];
    const springSports = ['Baseball', 'Softball', 'Track & Field', 'Tennis', 'Golf', 'Lacrosse'];
    
    // Extract the second year from academic year format (e.g., "2024-25" -> "2025")
    const secondYear = seasonYear.includes('-') ? seasonYear.split('-')[1] : seasonYear.slice(-2);
    const fullSecondYear = secondYear.length === 2 ? `20${secondYear}` : secondYear;
    
    if (fallSports.some(fs => sportName.includes(fs))) {
      // Fall sports use just the second year (e.g., "Football 2025")
      return `${sportName} ${fullSecondYear}`;
    } else if (springSports.some(ss => sportName.includes(ss))) {
      // Spring sports use just the second year (e.g., "Baseball 2026")
      return `${sportName} ${fullSecondYear}`;
    } else {
      // Winter sports (Basketball, etc.) use academic year format (e.g., "Men's Basketball 2025-26")
      return `${sportName} ${seasonYear}`;
    }
  };
  const { weeks, teamData } = useMemo(() => {
    if (!games || games.length === 0) {
      return { weeks: [], teamData: [] };
    }

    // Get date range from games
    const gameDates = games.map(game => parseISO(game.game_date));
    const minDate = new Date(Math.min(...gameDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...gameDates.map(d => d.getTime())));

    // Generate weeks
    const weekInterval = eachWeekOfInterval(
      { start: startOfWeek(minDate), end: endOfWeek(maxDate) },
      { weekStartsOn: 1 } // Start on Monday
    );

    const weeks: WeeklyGame[] = weekInterval.map((weekStart, index) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekGames = games.filter(game => {
        const gameDate = parseISO(game.game_date);
        return isSameWeek(gameDate, weekStart, { weekStartsOn: 1 });
      });

      // Format date range as mm/dd-dd or mm/dd-mm/dd
      const startMonth = format(weekStart, 'M');
      const startDay = format(weekStart, 'd');
      const endMonth = format(weekEnd, 'M');
      const endDay = format(weekEnd, 'd');
      
      let dateRange;
      if (startMonth === endMonth) {
        dateRange = `${startMonth}/${startDay}-${endDay}`;
      } else {
        dateRange = `${startMonth}/${startDay}-${endMonth}/${endDay}`;
      }

      return {
        week: weekStart,
        weekLabel: `Week ${index + 1} (${dateRange})`,
        games: weekGames
      };
    });

    // Build team data
    const teamData: TeamWeekData[] = teams.map(team => {
      const teamWeeks = new Map<string, Game[]>();
      
      weeks.forEach(({ week, games: weekGames }) => {
        const weekKey = format(week, 'yyyy-MM-dd');
        const teamGames = weekGames.filter(
          game => game.home_team_id === team.team_id || game.away_team_id === team.team_id
        );
        teamWeeks.set(weekKey, teamGames);
      });

      return {
        teamId: team.team_id,
        teamName: getTeamAbbreviation(team),
        weeks: teamWeeks
      };
    });

    return { weeks, teamData };
  }, [games, teams]);

  if (!games || games.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No Schedule Data</div>
          <div className="text-sm">Generate a schedule to see the matrix view</div>
        </div>
      </div>
    );
  }

  const getGameDisplay = (game: Game, teamId: number) => {
    const isHome = game.home_team_id === teamId;
    const opponentId = isHome ? game.away_team_id : game.home_team_id;
    const opponent = teams.find(t => t.team_id === opponentId);
    const opponentName = getTeamAbbreviation(opponent);
    
    return {
      opponent: opponentName,
      isHome,
      status: game.status,
      time: game.game_time
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'scheduled': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'conflict': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'tentative': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Add CSS for dark mode logo handling */}
      <style jsx>{`
        .team-logo, .team-logo-small {
          filter: none;
          transition: filter 0.3s ease;
        }
        
        :global(.dark) .team-logo,
        :global(.dark) .team-logo-small {
          filter: brightness(1.2) contrast(1.1);
        }
        
        /* For teams with light logos that need inversion in dark mode */
        :global(.dark) .team-logo[alt*="BYU"],
        :global(.dark) .team-logo[alt*="Utah"],
        :global(.dark) .team-logo-small[alt*="BYU"],
        :global(.dark) .team-logo-small[alt*="Utah"] {
          filter: invert(1) brightness(0.9);
        }
      `}</style>
      
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white mb-2">Schedule Matrix</h3>
        <p className="text-gray-400">Gantt-style view showing all teams and their games across the season</p>
      </div>

      <div className="border border-white/10 rounded-lg overflow-x-auto bg-black/20 backdrop-blur-sm">
        <Table className="w-auto table-fixed">
          <TableHeader>
            <TableRow className="border-white/10">
              <TableHead className="sticky left-0 bg-black/40 backdrop-blur-sm border-r border-white/10 text-white font-semibold w-auto">
                <div className="flex items-center">
                  <span>{formatSeasonDisplay(sport, season)}</span>
                </div>
              </TableHead>
              {weeks.map(({ week, weekLabel }) => (
                <TableHead 
                  key={format(week, 'yyyy-MM-dd')} 
                  className="text-center text-white font-medium w-auto border-r border-white/5 last:border-r-0"
                >
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-medium">{`Week ${weekLabel.split(' ')[1].split(' ')[0]}`}</span>
                    <span className="text-xs text-gray-400">{weekLabel.split('(')[1].split(')')[0]}</span>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamData.map((team) => (
              <TableRow key={team.teamId} className="border-white/10 hover:bg-white/5">
                <TableCell className="sticky left-0 bg-black/40 backdrop-blur-sm border-r border-white/10 p-4">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const teamData = teams.find(t => t.team_id === team.teamId);
                      const logoSrc = getTeamLogo(teamData);
                      
                      return logoSrc ? (
                        <img 
                          src={logoSrc} 
                          alt={`${teamData?.shortName || teamData?.name} logo`}
                          className="w-10 h-10 object-contain team-logo"
                          onError={(e) => {
                            console.log(`Failed to load logo for ${teamData?.shortName || teamData?.name}: ${logoSrc}`);
                            
                            // Show letter fallback if logo fails to load
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) {
                              e.currentTarget.style.display = 'none';
                              fallback.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null;
                    })()}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold" style={{ display: 'none' }}>
                      {(() => {
                        const teamData = teams.find(t => t.team_id === team.teamId);
                        return (teamData?.shortName || teamData?.name || 'T').charAt(0).toUpperCase();
                      })()}
                    </div>
                    <div>
                      <div className="font-medium text-white">
                        {(() => {
                          const teamData = teams.find(t => t.team_id === team.teamId);
                          return getTeamShortDisplayName(teamData);
                        })()}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {(() => {
                          const teamData = teams.find(t => t.team_id === team.teamId);
                          return getTeamMascot(teamData);
                        })()}
                      </div>
                    </div>
                  </div>
                </TableCell>
                {weeks.map(({ week }) => {
                  const weekKey = format(week, 'yyyy-MM-dd');
                  const weekGames = team.weeks.get(weekKey) || [];
                  
                  return (
                    <TableCell 
                      key={weekKey} 
                      className="border-r border-white/5 last:border-r-0 p-3 vertical-align-top w-auto"
                    >
                      <div className="space-y-1">
                        {weekGames.length === 0 ? (
                          <div className="w-8 h-8 flex items-center justify-center">
                            <span className="text-xs text-gray-500">-</span>
                          </div>
                        ) : (
                          weekGames.map((game) => {
                            const gameDisplay = getGameDisplay(game, team.teamId);
                            const opponentId = gameDisplay.isHome ? game.away_team_id : game.home_team_id;
                            const opponent = teams.find(t => t.team_id === opponentId);
                            const opponentLogoSrc = getTeamLogo(opponent);
                            
                            return (
                              <div
                                key={game.id}
                                className={cn(
                                  "w-8 h-8 rounded border text-xs font-medium flex items-center justify-center",
                                  getStatusColor(gameDisplay.status)
                                )}
                              >
                                <div className="flex items-center gap-1">
                                  <span className={gameDisplay.isHome ? 'font-bold' : 'font-normal'}>
                                    {gameDisplay.isHome ? 'vs' : '@'}
                                  </span>
                                  {opponentLogoSrc && (
                                    <img 
                                      src={opponentLogoSrc} 
                                      alt={getTeamAbbreviation(opponent)} 
                                      className="w-4 h-4 object-contain flex-shrink-0 team-logo-small"
                                      onError={(e) => {
                                        console.log(`Failed to load opponent logo for ${getTeamAbbreviation(opponent)}: ${opponentLogoSrc}`);
                                        // Hide the image if it fails to load
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500/20 border border-blue-500/30"></div>
          <span className="text-gray-400">Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/30"></div>
          <span className="text-gray-400">Confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-500/20 border border-yellow-500/30"></div>
          <span className="text-gray-400">Tentative</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/30"></div>
          <span className="text-gray-400">Conflict</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-400">vs</span>
          <span className="text-gray-400">Home game</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">@</span>
          <span className="text-gray-400">Away game</span>
        </div>
      </div>
    </div>
  );
}