'use client';

import React, { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { cn } from '../../../lib/utils';
import { type Game, type Team } from '../../utils/scheduleApi';

interface MatchupMatrixProps {
  games: Game[];
  teams: Team[];
  className?: string;
}

interface MatchupData {
  homeTeamId: number;
  awayTeamId: number;
  games: Game[];
  gameCount: number;
}

export function MatchupMatrix({ games, teams, className }: MatchupMatrixProps) {
  const { sortedTeams, matchupGrid } = useMemo(() => {
    if (!games || games.length === 0 || !teams || teams.length === 0) {
      return { sortedTeams: [], matchupGrid: new Map() };
    }

    // Sort teams by name for consistent display
    const sortedTeams = [...teams].sort((a, b) => {
      const nameA = a.name || a.shortName || `Team ${a.team_id}`;
      const nameB = b.name || b.shortName || `Team ${b.team_id}`;
      return nameA.localeCompare(nameB);
    });

    // Build matchup grid
    const matchupGrid = new Map<string, MatchupData>();

    // Initialize grid with empty matchups
    sortedTeams.forEach(homeTeam => {
      sortedTeams.forEach(awayTeam => {
        if (homeTeam.team_id !== awayTeam.team_id) {
          const key = `${homeTeam.team_id}-${awayTeam.team_id}`;
          matchupGrid.set(key, {
            homeTeamId: homeTeam.team_id,
            awayTeamId: awayTeam.team_id,
            games: [],
            gameCount: 0
          });
        }
      });
    });

    // Populate with actual games
    games.forEach(game => {
      const key = `${game.home_team_id}-${game.away_team_id}`;
      const existing = matchupGrid.get(key);
      if (existing) {
        existing.games.push(game);
        existing.gameCount = existing.games.length;
        matchupGrid.set(key, existing);
      }
    });

    return { sortedTeams, matchupGrid };
  }, [games, teams]);

  if (!games || games.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No Schedule Data</div>
          <div className="text-sm">Generate a schedule to see team matchups</div>
        </div>
      </div>
    );
  }

  const getMatchupData = (homeTeamId: number, awayTeamId: number): MatchupData | null => {
    if (homeTeamId === awayTeamId) return null;
    const key = `${homeTeamId}-${awayTeamId}`;
    return matchupGrid.get(key) || null;
  };

  const getMatchupDisplay = (matchup: MatchupData | null) => {
    if (!matchup || matchup.gameCount === 0) {
      return { count: 0, color: 'bg-gray-500/10 text-gray-500', status: 'none' };
    }

    const hasConflicts = matchup.games.some(g => g.status === 'conflict');
    const allConfirmed = matchup.games.every(g => g.status === 'confirmed');
    
    if (hasConflicts) {
      return { 
        count: matchup.gameCount, 
        color: 'bg-red-500/20 text-red-400 border border-red-500/30', 
        status: 'conflict' 
      };
    } else if (allConfirmed) {
      return { 
        count: matchup.gameCount, 
        color: 'bg-green-500/20 text-green-400 border border-green-500/30', 
        status: 'confirmed' 
      };
    } else {
      return { 
        count: matchup.gameCount, 
        color: 'bg-blue-500/20 text-blue-400 border border-blue-500/30', 
        status: 'scheduled' 
      };
    }
  };

  const getTeamName = (teamId: number) => {
    const team = teams.find(t => t.team_id === teamId);
    return team?.shortName || team?.name || `T${teamId}`;
  };

  const totalGames = games.length;
  const totalMatchups = Array.from(matchupGrid.values()).filter(m => m.gameCount > 0).length;

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white mb-2">Team Matchup Matrix</h3>
        <p className="text-gray-400">Home teams (rows) vs Away teams (columns) - shows number of games scheduled</p>
        <div className="flex gap-6 mt-2 text-sm text-gray-400">
          <span>{totalGames} total games</span>
          <span>{totalMatchups} unique matchups</span>
          <span>{sortedTeams.length} teams</span>
        </div>
      </div>

      <div className="border border-white/10 rounded-lg overflow-x-auto bg-black/20 backdrop-blur-sm">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow className="border-white/10">
              <TableHead className="sticky left-0 bg-black/40 backdrop-blur-sm border-r border-white/10 text-white font-semibold min-w-[120px]">
                <div className="text-center">
                  <div className="text-sm">Home ↓</div>
                  <div className="text-xs text-gray-400">Away →</div>
                </div>
              </TableHead>
              {sortedTeams.map((team) => (
                <TableHead 
                  key={team.team_id} 
                  className="text-center text-white font-medium min-w-[80px] border-r border-white/5 last:border-r-0"
                >
                  <div className="transform -rotate-45 origin-center whitespace-nowrap text-xs">
                    {getTeamName(team.team_id)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTeams.map((homeTeam) => (
              <TableRow key={homeTeam.team_id} className="border-white/10 hover:bg-white/5">
                <TableCell className="sticky left-0 bg-black/40 backdrop-blur-sm border-r border-white/10 font-medium text-white text-sm">
                  {getTeamName(homeTeam.team_id)}
                </TableCell>
                {sortedTeams.map((awayTeam) => {
                  const matchup = getMatchupData(homeTeam.team_id, awayTeam.team_id);
                  const display = getMatchupDisplay(matchup);
                  
                  return (
                    <TableCell 
                      key={awayTeam.team_id} 
                      className="border-r border-white/5 last:border-r-0 p-1 text-center"
                    >
                      {homeTeam.team_id === awayTeam.team_id ? (
                        <div className="w-8 h-8 bg-gray-800/50 border border-gray-600/30 rounded flex items-center justify-center">
                          <span className="text-xs text-gray-500">—</span>
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-all hover:scale-110 cursor-pointer",
                            display.color
                          )}
                          title={matchup && matchup.games.length > 0 ? 
                            `${getTeamName(homeTeam.team_id)} vs ${getTeamName(awayTeam.team_id)}: ${matchup.games.length} game(s)` : 
                            'No games scheduled'
                          }
                        >
                          {display.count > 0 ? display.count : ''}
                        </div>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Legend and Statistics */}
      <div className="mt-4 space-y-4">
        {/* Status Legend */}
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500/20 border border-blue-500/30"></div>
            <span className="text-gray-400">Scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30"></div>
            <span className="text-gray-400">Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/30"></div>
            <span className="text-gray-400">Has Conflicts</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-500/10 border border-gray-500/30"></div>
            <span className="text-gray-400">No Games</span>
          </div>
        </div>

        {/* Matrix Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="text-lg font-bold text-[color:var(--ft-neon)]">
              {Math.round((totalMatchups / (sortedTeams.length * (sortedTeams.length - 1))) * 100)}%
            </div>
            <div className="text-gray-400">Matchup Coverage</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="text-lg font-bold text-[color:var(--ft-neon)]">
              {totalGames > 0 ? (totalGames / sortedTeams.length).toFixed(1) : '0'}
            </div>
            <div className="text-gray-400">Games per Team</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="text-lg font-bold text-[color:var(--ft-neon)]">
              {Array.from(matchupGrid.values()).filter(m => m.gameCount > 1).length}
            </div>
            <div className="text-gray-400">Repeat Matchups</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="text-lg font-bold text-[color:var(--ft-neon)]">
              {Array.from(matchupGrid.values()).filter(m => m.games.some(g => g.status === 'conflict')).length}
            </div>
            <div className="text-gray-400">Conflicted Matchups</div>
          </div>
        </div>
      </div>
    </div>
  );
}