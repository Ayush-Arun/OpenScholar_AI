export default function RepoCard({ repo, delay = 0 }) {
  const verdict = repo.buildStatus;
  const verdictStyle =
    verdict === 'BUILDABLE' ? { color: '#39FF14', bg: '#39FF1420', border: '#39FF1444', icon: '✓', glow: '#39FF14' } :
    verdict === 'PARTIAL'   ? { color: '#FFB800', bg: '#FFB80020', border: '#FFB80044', icon: '⚠', glow: '#FFB800' } :
                              { color: '#FF2D55', bg: '#FF2D5520', border: '#FF2D5544', icon: '✗', glow: '#FF2D55' };

  const langColors = {
    Python: '#3572A5', 'C++': '#f34b7d', JavaScript: '#f1e05a',
    TypeScript: '#3178c6', Rust: '#dea584', Go: '#00ADD8',
  };
  const langColor = langColors[repo.language] || '#8a9abf';

  const starsDisplay = repo.stars >= 1000
    ? `${(repo.stars / 1000).toFixed(1)}k`
    : repo.stars;

  const s = {
    card: {
      background: 'linear-gradient(135deg, #090d1a 0%, #0d1225 100%)',
      border: '1px solid #1a2240',
      borderRadius: 6,
      padding: '12px 14px',
      position: 'relative',
      overflow: 'hidden',
      opacity: 0,
      transform: 'translateY(22px)',
      animation: `revealUp 0.55s cubic-bezier(0.22,1,0.36,1) ${delay}s forwards`,
      transition: 'border-color 0.2s, box-shadow 0.2s',
      marginBottom: 10,
    },
    top: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 },
    name: {
      fontFamily: "'Syne', sans-serif",
      fontSize: 14,
      fontWeight: 700,
      color: '#e8f0ff',
    },
    chip: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '4px 12px',
      borderRadius: 4,
      background: verdictStyle.bg,
      border: `1px solid ${verdictStyle.border}`,
      color: verdictStyle.color,
      fontFamily: "'Space Mono', monospace",
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: 2,
      textShadow: `0 0 8px ${verdictStyle.glow}`,
      boxShadow: `0 0 12px ${verdictStyle.glow}30`,
    },
    desc: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 11,
      color: '#6a7a9a',
      lineHeight: 1.55,
      marginBottom: 10,
    },
    meta: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap',
    },
    metaItem: {
      fontFamily: "'Space Mono', monospace",
      fontSize: 9,
      color: '#4a5a7a',
      display: 'flex',
      alignItems: 'center',
      gap: 4,
    },
    langBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '2px 7px',
      borderRadius: 3,
      background: `${langColor}20`,
      border: `1px solid ${langColor}44`,
      color: langColor,
      fontFamily: "'Space Mono', monospace",
      fontSize: 8,
      letterSpacing: 1,
    },
    langDot: {
      width: 7, height: 7, borderRadius: '50%',
      background: langColor,
      boxShadow: `0 0 5px ${langColor}`,
    },
    frameBadge: {
      display: 'inline-flex',
      padding: '2px 6px',
      borderRadius: 3,
      background: '#1a2240',
      border: '1px solid #2a3460',
      color: '#8a9abf',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 9,
    },
  };

  return (
    <div
      style={s.card}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = `${verdictStyle.border}`;
        e.currentTarget.style.boxShadow = `0 0 16px ${verdictStyle.glow}18`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#1a2240';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={s.top}>
        <div>
          <div style={s.name}>{repo.name}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            <div style={s.langBadge}>
              <span style={s.langDot} />
              {repo.language}
            </div>
            {repo.frameworks.map(f => (
              <div key={f} style={s.frameBadge}>{f}</div>
            ))}
          </div>
        </div>
        <div style={s.chip}>
          <span>{verdictStyle.icon}</span>
          <span>{verdict}</span>
        </div>
      </div>

      <div style={s.desc}>{repo.description}</div>

      <div style={s.meta}>
        <div style={s.metaItem}>
          <span style={{ color: '#FFB800' }}>⭐</span>
          <span style={{ color: '#c8d6f0', fontWeight: 700 }}>{starsDisplay}</span>
        </div>
        <div style={s.metaItem}>
          <span style={{ color: '#5a6a8a' }}>⟳</span>
          <span>{repo.lastCommit}</span>
        </div>
      </div>

      {/* Freshness indicator bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${verdictStyle.glow}88, ${verdictStyle.glow})`,
        boxShadow: `0 0 6px ${verdictStyle.glow}`,
        width: verdict === 'BUILDABLE' ? '100%' : verdict === 'PARTIAL' ? '55%' : '25%',
        transition: 'width 1.2s',
      }} />
    </div>
  );
}
