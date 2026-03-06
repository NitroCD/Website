import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { toSlug } from '../../utils/dataUtils';

function GameRow({ game }) {
  const awayWon = game.played && game.awayScore > game.homeScore;
  const homeWon = game.played && game.homeScore > game.awayScore;

  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1e293b' }}>
      <Link
        to={`/team/${toSlug(game.away)}`}
        style={{ flex: 1, textAlign: 'right', fontSize: 13, fontWeight: awayWon ? 700 : 400, color: awayWon ? '#fff' : '#94a3b8', transition: 'color 0.1s' }}
        className="hover:text-sky-400"
      >
        {game.away}
      </Link>
      <div style={{ width: 90, textAlign: 'center', flexShrink: 0 }}>
        {game.played ? (
          <span style={{ fontWeight: 700, color: '#0ea5e9', fontSize: 15 }}>
            {game.awayScore} – {game.homeScore}
          </span>
        ) : (
          <span style={{ color: '#475569', fontSize: 12 }}>vs</span>
        )}
      </div>
      <Link
        to={`/team/${toSlug(game.home)}`}
        style={{ flex: 1, textAlign: 'left', fontSize: 13, fontWeight: homeWon ? 700 : 400, color: homeWon ? '#fff' : '#94a3b8', transition: 'color 0.1s' }}
        className="hover:text-sky-400"
      >
        {game.home}
      </Link>
    </div>
  );
}

export default function TierSchedule({ tier }) {
  const { schedules, standings } = useData();
  const schedule = schedules[tier] || [];
  const [teamFilter, setTeamFilter] = useState('All Teams');

  const teams = [...new Set([
    ...schedule.flatMap(d => d.games.flatMap(g => [g.away, g.home]))
  ])].sort();

  const filteredSchedule = schedule.map(day => ({
    ...day,
    games: teamFilter === 'All Teams'
      ? day.games
      : day.games.filter(g => g.away === teamFilter || g.home === teamFilter)
  })).filter(d => d.games.length > 0);

  if (!schedule.length) {
    return <div className="text-slate-400 text-center py-10">No schedule data available.</div>;
  }

  // Group by played vs upcoming
  const playedDays = filteredSchedule.filter(d => d.games.some(g => g.played));
  const upcomingDays = filteredSchedule.filter(d => d.games.every(g => !g.played) && d.label.startsWith('Match Day'));
  const playoffDays = filteredSchedule.filter(d => d.label === 'SEMIFINALS' || d.label === 'FINALS');

  function renderDay(day) {
    return (
      <div key={day.label} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, marginBottom: 12, overflow: 'hidden' }}>
        <div style={{ padding: '8px 16px', background: '#162032', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 13 }}>{day.label}</span>
          {day.date && <span style={{ color: '#64748b', fontSize: 12 }}>{day.date}</span>}
        </div>
        <div style={{ padding: '4px 16px' }}>
          {day.games.map((g, i) => <GameRow key={i} game={g} />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Team filter */}
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <label className="text-slate-400 text-sm">Filter by team:</label>
        <select
          value={teamFilter}
          onChange={e => setTeamFilter(e.target.value)}
          style={{ background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9', borderRadius: 6, padding: '6px 10px', fontSize: 13, cursor: 'pointer' }}
        >
          <option>All Teams</option>
          {teams.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Upcoming */}
      {upcomingDays.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Upcoming</h3>
          {upcomingDays.map(renderDay)}
        </div>
      )}

      {/* Playoffs */}
      {playoffDays.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">Playoffs</h3>
          {playoffDays.map(renderDay)}
        </div>
      )}

      {/* Results */}
      {playedDays.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Results</h3>
          {[...playedDays].reverse().map(renderDay)}
        </div>
      )}
    </div>
  );
}
