import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { formatWP, toSlug, getFranchiseLogo, getFranchiseForTeam, groupByConference, TIER_COLORS, PLAYOFF_CUTOFF } from '../../utils/dataUtils';

function StandingsTable({ teams, franchises, tier, showConf = true, playoffCutoff = null }) {
  const tierColor = TIER_COLORS[tier] || '#0ea5e9';
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="w-full" style={{ borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #334155', color: '#64748b' }}>
            <th className="py-2 px-3 text-left w-8">#</th>
            <th className="py-2 px-3 text-left">Team</th>
            {showConf && <th className="py-2 px-2 text-center hidden sm:table-cell">CONF</th>}
            <th className="py-2 px-2 text-center">W</th>
            <th className="py-2 px-2 text-center">L</th>
            <th className="py-2 px-2 text-center">WP</th>
            <th className="py-2 px-2 text-center hidden md:table-cell">GB</th>
            <th className="py-2 px-2 text-center hidden md:table-cell">L20</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team, i) => {
            const franchise = getFranchiseForTeam(franchises, team.name);
            const isCutoff = playoffCutoff !== null && i === playoffCutoff - 1;
            return (
              <tr
                key={team.name}
                style={{
                  borderBottom: isCutoff
                    ? `2px solid ${tierColor}88`
                    : '1px solid #1e293b',
                  background: i % 2 === 0 ? '#1e293b44' : 'transparent',
                  transition: 'background 0.1s',
                }}
                className="hover:bg-slate-800"
              >
                <td className="py-2.5 px-3 text-slate-500 text-center">{team.overallRank ?? i + 1}</td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    {franchise && (
                      <img
                        src={getFranchiseLogo(franchise)}
                        alt=""
                        style={{ width: 20, height: 20, objectFit: 'contain' }}
                        onError={e => e.target.style.display = 'none'}
                      />
                    )}
                    <div>
                      <Link to={`/team/${toSlug(team.name)}`} className="text-white hover:text-sky-400 transition-colors font-medium">
                        {team.name}
                      </Link>
                      {franchise && (
                        <div className="text-xs text-slate-500">
                          <Link to={`/franchise/${toSlug(franchise.name)}`} className="hover:text-slate-300 transition-colors">
                            {franchise.name}
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                {showConf && (
                  <td className="py-2.5 px-2 text-center hidden sm:table-cell">
                    {team.conference && team.conference !== 'N/A' && (
                      <span style={{
                        fontSize: 10, padding: '2px 6px', borderRadius: 4,
                        background: team.conference.includes('Solar') ? '#b4530022' : '#4c1d9522',
                        color: team.conference.includes('Solar') ? '#f59e0b' : '#818cf8',
                        fontWeight: 600,
                      }}>
                        {team.conference}
                      </span>
                    )}
                  </td>
                )}
                <td className="py-2.5 px-2 text-center text-white font-medium">{team.w ?? '—'}</td>
                <td className="py-2.5 px-2 text-center text-slate-400">{team.l ?? '—'}</td>
                <td className="py-2.5 px-2 text-center text-slate-300">{formatWP(team.wp)}</td>
                <td className="py-2.5 px-2 text-center text-slate-500 hidden md:table-cell">{team.gb || '—'}</td>
                <td className="py-2.5 px-2 text-center text-slate-400 hidden md:table-cell">{team.last20 || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function TierStandings({ tier }) {
  const { standings, franchises } = useData();
  const teams = standings[tier] || [];

  const cutoffRule = PLAYOFF_CUTOFF[tier];
  const hasConferences = teams.some(t => t.conference && t.conference !== 'N/A' && t.conference !== '');
  const conferences = hasConferences ? groupByConference(teams) : null;

  if (!teams.length) {
    return <div className="text-slate-400 text-center py-10">No standings data available.</div>;
  }

  const overallCutoff = cutoffRule?.type === 'overall' ? cutoffRule.count : null;
  const confCutoff = cutoffRule?.type === 'conference' ? cutoffRule.count : null;

  if (hasConferences && conferences) {
    return (
      <div className="space-y-8">
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, overflow: 'hidden' }}>
          <div className="px-4 py-3 border-b border-slate-700">
            <h2 className="font-bold text-white">Overall Standings</h2>
          </div>
          <StandingsTable teams={teams} franchises={franchises} tier={tier} showConf={true} playoffCutoff={overallCutoff} />
        </div>

        {Object.entries(conferences).sort(([a], [b]) => a.localeCompare(b)).map(([conf, confTeams]) => (
          <div key={conf} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, overflow: 'hidden' }}>
            <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: conf.includes('Solar') ? '#f59e0b' : '#818cf8' }} />
              <h2 className="font-bold text-white">{conf} Conference</h2>
              <span className="text-slate-500 text-sm">{confTeams.length} teams</span>
              {confCutoff && <span className="text-slate-600 text-xs ml-auto">Top {confCutoff} advance</span>}
            </div>
            <StandingsTable teams={confTeams} franchises={franchises} tier={tier} showConf={false} playoffCutoff={confCutoff} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, overflow: 'hidden' }}>
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-white">{tier} Standings</h2>
          <p className="text-slate-400 text-sm">{teams.length} teams</p>
        </div>
        {overallCutoff && <span className="text-slate-600 text-xs">Top {overallCutoff} advance to playoffs</span>}
      </div>
      <StandingsTable teams={teams} franchises={franchises} tier={tier} showConf={false} playoffCutoff={overallCutoff} />
    </div>
  );
}
