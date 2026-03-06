import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { toSlug } from '../../utils/dataUtils';

function FATable({ players }) {
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, overflow: 'hidden' }}>
      <table className="w-full" style={{ borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ color: '#64748b', fontSize: 11, background: '#162032', borderBottom: '1px solid #334155' }}>
            <th className="py-2.5 px-4 text-left">Player</th>
            <th className="py-2.5 px-3 text-center">MMR</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, i) => (
            <tr
              key={p['RSC ID'] || p['Player Name']}
              style={{ borderBottom: '1px solid #1e293b', background: i % 2 === 0 ? '#1e293b44' : 'transparent' }}
              className="hover:bg-slate-800"
            >
              <td className="py-2.5 px-4">
                <Link to={`/player/${toSlug(p['Player Name'])}`} className="text-white hover:text-sky-400 transition-colors font-medium">
                  {p['Player Name']}
                </Link>
              </td>
              <td className="py-2.5 px-3 text-center text-slate-300">{p['Base MMR'] || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TierFreeAgents({ tier }) {
  const { contracts } = useData();

  const fa = contracts
    .filter(c => c['Tier'] === tier && c['Player Name'] && c['Contract Status'] === 'Free Agent')
    .sort((a, b) => (parseFloat(b['Base MMR']) || 0) - (parseFloat(a['Base MMR']) || 0));

  const pfa = contracts
    .filter(c => c['Tier'] === tier && c['Player Name'] && (c['Contract Status'] === 'Permanent Free Agent' || c['Contract Status'] === 'Perm FA in Waiting.'))
    .sort((a, b) => (parseFloat(b['Base MMR']) || 0) - (parseFloat(a['Base MMR']) || 0));

  if (!fa.length && !pfa.length) {
    return <div className="text-slate-400 text-center py-10">No free agents for {tier}.</div>;
  }

  return (
    <div className="space-y-6">
      {fa.length > 0 && (
        <div>
          <h2 className="text-white font-bold mb-3">Free Agents <span className="text-slate-500 font-normal text-sm">({fa.length})</span></h2>
          <FATable players={fa} />
        </div>
      )}
      {pfa.length > 0 && (
        <div>
          <h2 className="text-white font-bold mb-3">Permanent Free Agents <span className="text-slate-500 font-normal text-sm">({pfa.length})</span></h2>
          <FATable players={pfa} />
        </div>
      )}
    </div>
  );
}
