'use client';

import React, { useMemo } from 'react';
import { format, parseISO, eachWeekOfInterval, startOfWeek, endOfWeek, isSameWeek } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { cn } from '../../../lib/utils';
import { type Game, type Team } from '../../utils/scheduleApi';

interface ScheduleGanttMatrixProps {
  games: Game[];
  teams: Team[];
  className?: string;
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

export function ScheduleGanttMatrix({ games, teams, className }: ScheduleGanttMatrixProps) {
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

    const weeks: WeeklyGame[] = weekInterval.map(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekGames = games.filter(game => {
        const gameDate = parseISO(game.game_date);
        return isSameWeek(gameDate, weekStart, { weekStartsOn: 1 });
      });

      return {
        week: weekStart,
        weekLabel: format(weekStart, 'MMM d'),
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
        teamName: team.name || team.shortName || `Team ${team.team_id}`,
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
    const opponentName = opponent?.shortName || opponent?.name || `T${opponentId}`;
    
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
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white mb-2">Schedule Matrix</h3>
        <p className="text-gray-400">Gantt-style view showing all teams and their games across the season</p>
      </div>

      <div className="border border-white/10 rounded-lg overflow-x-auto bg-black/20 backdrop-blur-sm">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow className="border-white/10">
              <TableHead className="sticky left-0 bg-black/40 backdrop-blur-sm border-r border-white/10 text-white font-semibold min-w-[200px]">
                Team
              </TableHead>
              {weeks.map(({ week, weekLabel }) => (
                <TableHead 
                  key={format(week, 'yyyy-MM-dd')} 
                  className="text-center text-white font-medium min-w-[120px] border-r border-white/5 last:border-r-0"
                >
                  <div className="flex flex-col">
                    <span className="text-sm">{weekLabel}</span>
                    <span className="text-xs text-gray-400 font-normal">
                      Week {format(week, 'w')}
                    </span>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamData.map((team) => (
              <TableRow key={team.teamId} className="border-white/10 hover:bg-white/5">
                <TableCell className="sticky left-0 bg-black/40 backdrop-blur-sm border-r border-white/10">
                  <div className="font-medium text-white">
                    {team.teamName}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    ID: {team.teamId}
                  </div>
                </TableCell>
                {weeks.map(({ week }) => {
                  const weekKey = format(week, 'yyyy-MM-dd');
                  const weekGames = team.weeks.get(weekKey) || [];
                  
                  return (
                    <TableCell 
                      key={weekKey} 
                      className="border-r border-white/5 last:border-r-0 p-1 vertical-align-top"
                    >
                      <div className="space-y-1">
                        {weekGames.length === 0 ? (
                          <div className="h-8 flex items-center justify-center">
                            <span className="text-xs text-gray-500">-</span>
                          </div>
                        ) : (
                          weekGames.map((game) => {
                            const gameDisplay = getGameDisplay(game, team.teamId);
                            return (
                              <div
                                key={game.id}
                                className={cn(
                                  "px-2 py-1 rounded border text-xs font-medium",
                                  getStatusColor(gameDisplay.status)
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <span className={gameDisplay.isHome ? 'font-bold' : 'font-normal'}>
                                    {gameDisplay.isHome ? 'vs' : '@'} {gameDisplay.opponent}
                                  </span>
                                </div>
                                <div className="text-xs opacity-75 mt-0.5">
                                  {gameDisplay.time}
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