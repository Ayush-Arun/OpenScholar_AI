export default function ScoreBadge({ score, label }) {
  const color =
    score >= 8 ? '#39FF14' :
    score >= 5 ? '#FFB800' :
    '#FF2D55';

  const bg =
    score >= 8 ? '#39FF1420' :
    score >= 5 ? '#FFB80020' :
    '#FF2D5520';

  const glow =
    score >= 8 ? '#39FF1444' :
    score >= 5 ? '#FFB80044' :
    '#FF2D5544';

  return (
    <div style={{
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
      padding: '3px 8px',
      borderRadius: 4,
      background: bg,
      border: `1px solid ${glow}`,
      boxShadow: `0 0 8px ${glow}`,
    }}>
      <span style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 13,
        fontWeight: 700,
        color,
        lineHeight: 1,
        textShadow: `0 0 8px ${color}`,
      }}>
        {score.toFixed(1)}
      </span>
      <span style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 8,
        color,
        opacity: 0.8,
        letterSpacing: 1,
        textTransform: 'uppercase',
      }}>
        {label}
      </span>
    </div>
  );
}
