import { useParams, Link, useNavigate } from 'react-router-dom';
import { TIERS, TIER_COLORS, tierFromSlug } from '../utils/dataUtils';
import TierStandings from '../components/standings/TierStandings';
import TierStats from '../components/stats/TierStats';
import TierRosters from '../components/roster/TierRosters';
import TierSchedule from '../components/schedule/TierSchedule';
import TierFreeAgents from '../components/roster/TierFreeAgents';

const TABS = [
  { key: 'standings', label: 'Standings' },
  { key: 'stats', label: 'Stats' },
  { key: 'rosters', label: 'Rosters' },
  { key: 'free-agents', label: 'Free Agents' },
  { key: 'schedule', label: 'Schedule' },
];

export default function TierPage() {
  const { tier: tierSlug, tab = 'standings' } = useParams();
  const navigate = useNavigate();
  const tier = tierFromSlug(tierSlug);
  const color = TIER_COLORS[tier] || '#0ea5e9';

  if (!TIERS.includes(tier)) {
    return <div className="text-center text-slate-400 py-20">Tier not found.</div>;
  }

  function setTab(t) {
    navigate(`/tier/${tierSlug}/${t}`, { replace: true });
  }

  return (
    <div>
      {/* Tier Header */}
      <div className="mb-6 flex items-center gap-4">
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: color }} />
        <h1 className="text-2xl font-bold text-white">{tier}</h1>
        <div className="flex-1 flex items-center gap-1 flex-wrap">
          {TIERS.map(t => (
            t !== tier && (
              <Link
                key={t}
                to={`/tier/${t.toLowerCase()}`}
                style={{ fontSize: 11, color: TIER_COLORS[t], background: TIER_COLORS[t] + '22', padding: '2px 8px', borderRadius: 4 }}
                className="hover:opacity-80 transition-opacity"
              >
                {t}
              </Link>
            )
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #334155', marginBottom: 24, display: 'flex', gap: 0 }}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: tab === key ? color : '#64748b',
              borderBottom: tab === key ? `2px solid ${color}` : '2px solid transparent',
              marginBottom: -1,
              transition: 'color 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'standings' && <TierStandings tier={tier} />}
      {tab === 'stats' && <TierStats tier={tier} />}
      {tab === 'rosters' && <TierRosters tier={tier} />}
      {tab === 'free-agents' && <TierFreeAgents tier={tier} />}
      {tab === 'schedule' && <TierSchedule tier={tier} />}
    </div>
  );
}
