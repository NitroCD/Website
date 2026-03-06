import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { toSlug, TIERS, TIER_COLORS, getFranchiseLogo } from '../utils/dataUtils';

function TeamCard({ teamName, players }) {
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, overflow: 'hidden' }}>
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <Link to={`/team/${toSlug(teamName)}`} className="font-bold text-white hover:text-sky-400 transition-colors">
          {teamName}
        </Link>
        <span className="text-slate-500 text-xs">{players.length} players</span>
      </div>
      <div className="p-3">
        <div className="space-y-1">
          {players.map(p => {
            const isIR = p['Contract Status'] === 'IR' || p['Contract Status'] === 'AR';
            const isCaptain = p['Captain'] === 'TRUE';
            return (
              <div key={p['RSC ID'] || p['Player Name']} className="flex items-center gap-2 py-1">
                <Link to={`/player/${toSlug(p['Player Name'])}`} className="flex-1 text-sm text-slate-200 hover:text-sky-400 transition-colors">
                  {p['Player Name']}
                </Link>
                {isCaptain && (
                  <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: '#b4530033', color: '#f59e0b', fontWeight: 700 }}>C</span>
                )}
                {isIR && (
                  <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: '#ef444422', color: '#f87171', fontWeight: 700 }}>IR</span>
                )}
                <span className="text-xs text-slate-500">{p['Base MMR']}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function FranchisePage() {
  const { franchiseName } = useParams();
  const { franchises, contracts } = useData();

  const franchise = franchises.find(f => toSlug(f.name) === franchiseName);

  if (!franchise) {
    return <div className="text-center text-slate-400 py-20">Franchise not found.</div>;
  }

  const agms = franchise.agms || [];

  // Use contracts to build teams grouped by tier
  const franchiseContracts = contracts.filter(
    c => c['Franchise'] === franchise.name && c['Player Name'] && c['Contract Status'] !== ''
  );

  // Group by tier then team
  const teamsByTier = {};
  for (const c of franchiseContracts) {
    const tier = c['Tier'];
    const team = c['Team'];
    if (!tier || !team) continue;
    if (!teamsByTier[tier]) teamsByTier[tier] = {};
    if (!teamsByTier[tier][team]) teamsByTier[tier][team] = [];
    teamsByTier[tier][team].push(c);
  }

  const orderedTiers = TIERS.filter(t => teamsByTier[t]);

  return (
    <div>
      {/* Franchise Header */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 28, marginBottom: 24 }}>
        <div className="flex items-start gap-6">
          <img
            src={getFranchiseLogo(franchise)}
            alt={franchise.name}
            style={{ width: 80, height: 80, objectFit: 'contain' }}
            onError={e => e.target.style.display = 'none'}
          />
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white">{franchise.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-slate-400 text-sm">{franchise.teams?.length} teams</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-4">
              <div style={{ background: '#0f172a', borderRadius: 8, padding: '10px 16px' }}>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">General Manager</div>
                <Link to={`/player/${toSlug(franchise.gm?.rsc_name)}`} className="text-white font-semibold hover:text-sky-400 transition-colors">
                  {franchise.gm?.rsc_name || '—'}
                </Link>
              </div>
              {agms.length > 0 && (
                <div style={{ background: '#0f172a', borderRadius: 8, padding: '10px 16px' }}>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                    {agms.length === 1 ? 'AGM' : 'AGMs'}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {agms.map((agm, i) => (
                      <Link key={i} to={`/player/${toSlug(agm.rsc_name || agm)}`} className="text-white font-semibold hover:text-sky-400 transition-colors">
                        {agm.rsc_name || agm}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {orderedTiers.map(tier => (
                <Link
                  key={tier}
                  to={`/tier/${toSlug(tier)}`}
                  style={{ background: TIER_COLORS[tier] + '22', border: `1px solid ${TIER_COLORS[tier]}44`, borderRadius: 6, padding: '4px 10px', fontSize: 12, color: TIER_COLORS[tier], fontWeight: 600 }}
                  className="hover:opacity-80 transition-opacity"
                >
                  {tier}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Teams by Tier */}
      <div className="space-y-6">
        {orderedTiers.map(tier => (
          <div key={tier}>
            <div className="flex items-center gap-2 mb-3">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: TIER_COLORS[tier] }} />
              <h2 className="font-bold text-white">{tier}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(teamsByTier[tier]).map(([teamName, players]) => (
                <TeamCard key={teamName} teamName={teamName} players={players} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
