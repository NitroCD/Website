import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { toSlug, getFranchiseLogo, getFranchiseForTeam } from '../../utils/dataUtils';

function PlayerRow({ contract }) {
  const isIR = contract['Contract Status'] === 'Inactive Reserve' || contract['Contract Status'] === 'AGM IR';
  const isAGMIR = contract['Contract Status'] === 'AGM IR';
  const isCaptain = contract['Captain'] === 'TRUE';

  return (
    <tr style={{ borderBottom: '1px solid #1e293b', fontSize: 13 }} className="hover:bg-slate-700">
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-2">
          <Link to={`/player/${toSlug(contract['Player Name'])}`} className="text-white hover:text-sky-400 transition-colors font-medium">
            {contract['Player Name']}
          </Link>
          {isCaptain && (
            <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: '#b4530033', color: '#f59e0b', fontWeight: 700 }}>C</span>
          )}
          {isIR && (
            <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: '#ef444422', color: '#f87171', fontWeight: 700 }}>{isAGMIR ? 'AGM IR' : 'IR'}</span>
          )}
        </div>
      </td>
      <td className="py-2.5 px-2 text-center text-slate-300">{contract['Base MMR'] || '—'}</td>
    </tr>
  );
}

function TeamCard({ teamName, players, franchise }) {
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, overflow: 'hidden' }}>
      <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-3">
        {franchise && (
          <img
            src={getFranchiseLogo(franchise)}
            alt=""
            style={{ width: 24, height: 24, objectFit: 'contain' }}
            onError={e => e.target.style.display = 'none'}
          />
        )}
        <div>
          <Link to={`/team/${toSlug(teamName)}`} className="font-bold text-white hover:text-sky-400 transition-colors">
            {teamName}
          </Link>
          {franchise && (
            <div className="text-xs text-slate-400">
              <Link to={`/franchise/${toSlug(franchise.name)}`} className="hover:text-slate-200 transition-colors">
                {franchise.name}
              </Link>
            </div>
          )}
        </div>
      </div>
      <table className="w-full" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ color: '#64748b', fontSize: 11, background: '#162032' }}>
            <th className="py-2 px-3 text-left">Player</th>
            <th className="py-2 px-2 text-center">MMR</th>
          </tr>
        </thead>
        <tbody>
          {players.map(c => (
            <PlayerRow key={c['RSC ID'] || c['Player Name']} contract={c} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TierRosters({ tier }) {
  const { franchises, contracts } = useData();

  // Filter contracts for this tier with active players
  const tierContracts = contracts.filter(c =>
    c['Tier'] === tier && c['Player Name'] && c['Contract Status'] !== 'FreeAgent' && c['Contract Status'] !== ''
  );

  // Group by team
  const teamMap = {};
  for (const c of tierContracts) {
    const team = c['Team'] || 'Unassigned';
    if (!teamMap[team]) teamMap[team] = [];
    teamMap[team].push(c);
  }

  const teams = Object.entries(teamMap)
    .filter(([name]) => name !== 'Unassigned')
    .sort(([a], [b]) => a.localeCompare(b));

  if (!teams.length) {
    return <div className="text-slate-400 text-center py-10">No roster data available for {tier}.</div>;
  }

  return (
    <div>
      <p className="text-slate-400 text-sm mb-4">{teams.length} teams · <span style={{ color: '#f59e0b' }}>C</span> = Captain · <span style={{ color: '#f87171' }}>IR</span> = Injured Reserve · <span style={{ color: '#f87171' }}>AGM IR</span> = AGM Injured Reserve</p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {teams.map(([teamName, players]) => {
          const franchise = getFranchiseForTeam(franchises, teamName);
          return (
            <TeamCard key={teamName} teamName={teamName} players={players} franchise={franchise} />
          );
        })}
      </div>
    </div>
  );
}
