import { mockDigest } from '../data/mockData';

export default function DigestCard() {
  const d = mockDigest;

  const btnBase = {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    letterSpacing: 2,
    padding: '6px 12px',
    borderRadius: 4,
    border: 'none',
    cursor: 'none',
    fontWeight: 700,
    transition: 'box-shadow 0.2s, transform 0.15s',
  };

  function handleHover(e, color) {
    e.currentTarget.style.boxShadow = `0 0 16px ${color}88`;
    e.currentTarget.style.transform = 'translateY(-1px)';
  }
  function handleLeave(e) {
    e.currentTarget.style.boxShadow = '';
    e.currentTarget.style.transform = '';
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #090d1a 0%, #0d1225 100%)',
      border: '1px solid #FFB80033',
      borderRadius: 6,
      padding: '12px 14px',
      boxShadow: '0 0 20px #FFB80015',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Corner accent */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 40, height: 40,
        background: 'linear-gradient(225deg, #FFB80022, transparent)',
        borderBottomLeftRadius: 40,
      }} />

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 12,
          fontWeight: 700,
          color: '#FFB800',
          letterSpacing: 1,
          textShadow: '0 0 8px #FFB80088',
        }}>
          WEEKLY DIGEST
        </div>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 8,
          color: '#5a6a8a',
          letterSpacing: 1,
        }}>
          {d.weekStart} → {d.weekEnd}
        </div>
      </div>

      {/* Counts */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
        {[
          { label: 'Papers', val: d.paperCount, color: '#00F5FF' },
          { label: 'Repos',  val: d.repoCount,  color: '#39FF14' },
        ].map(({ label, val, color }) => (
          <div key={label} style={{
            background: `${color}10`,
            border: `1px solid ${color}33`,
            borderRadius: 4,
            padding: '4px 10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <span style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 16,
              fontWeight: 700,
              color,
              textShadow: `0 0 8px ${color}`,
              lineHeight: 1.1,
            }}>{val}</span>
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 8,
              color: '#5a6a8a',
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 10.5,
        color: '#7a8aaa',
        lineHeight: 1.6,
        marginBottom: 10,
        borderLeft: '2px solid #FFB80044',
        paddingLeft: 8,
      }}>
        {d.summary}
      </div>

      {/* Top Pick */}
      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 8,
        color: '#39FF14',
        letterSpacing: 1,
        background: '#39FF1410',
        border: '1px solid #39FF1433',
        borderRadius: 4,
        padding: '4px 8px',
        marginBottom: 12,
        textShadow: '0 0 6px #39FF14',
      }}>
        ★ TOP PICK · {d.topPick}
      </div>

      {/* Download buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button
          style={{ ...btnBase, background: '#FFB80020', color: '#FFB800', border: '1px solid #FFB80055', flex: 1 }}
          onMouseEnter={e => handleHover(e, '#FFB800')}
          onMouseLeave={handleLeave}
        >
          ↓ PDF
        </button>
        <button
          style={{ ...btnBase, background: '#FFB80020', color: '#FFB800', border: '1px solid #FFB80055', flex: 1 }}
          onMouseEnter={e => handleHover(e, '#FFB800')}
          onMouseLeave={handleLeave}
        >
          ↓ DOCX
        </button>
      </div>

      {/* Email button */}
      <button
        style={{
          ...btnBase,
          width: '100%',
          background: '#00F5FF18',
          color: '#00F5FF',
          border: '1px solid #00F5FF55',
          boxShadow: '0 0 10px #00F5FF22',
          textShadow: '0 0 8px #00F5FF',
        }}
        onMouseEnter={e => handleHover(e, '#00F5FF')}
        onMouseLeave={handleLeave}
      >
        📧 SEND TO EMAIL
      </button>
    </div>
  );
}
