import TrendRadar from './TrendRadar';
import KeywordChart from './KeywordChart';
import DigestCard from './DigestCard';

export default function RightPanel({ onTopicClick }) {
  const s = {
    panel: {
      height: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
      padding: '16px 14px',
      background: 'linear-gradient(180deg, #060a14 0%, #050810 100%)',
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
    },
    sectionLabel: {
      fontFamily: "'Space Mono', monospace",
      fontSize: 8,
      letterSpacing: 3,
      color: '#00F5FF',
      textTransform: 'uppercase',
      paddingBottom: 6,
      borderBottom: '1px solid #1a2240',
      marginBottom: 8,
      textShadow: '0 0 8px #00F5FF55',
    },
    radarBox: {
      background: 'linear-gradient(135deg, #090d1a 0%, #0d1225 100%)',
      border: '1px solid #1a2240',
      borderRadius: 6,
      padding: '10px',
      opacity: 0,
      animation: 'revealUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.1s forwards',
      transition: 'border-color 0.2s, box-shadow 0.2s',
    },
    chartBox: {
      background: 'linear-gradient(135deg, #090d1a 0%, #0d1225 100%)',
      border: '1px solid #1a2240',
      borderRadius: 6,
      padding: '10px 10px 4px',
      opacity: 0,
      animation: 'revealUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.2s forwards',
    },
    hint: {
      fontFamily: "'Space Mono', monospace",
      fontSize: 7,
      color: '#2a3a5a',
      letterSpacing: 1,
      textAlign: 'center',
      marginTop: 4,
    },
    digestWrap: {
      opacity: 0,
      animation: 'revealUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.3s forwards',
    },
  };

  return (
    <div style={s.panel}>
      {/* TREND RADAR */}
      <div>
        <div style={s.sectionLabel}>⟁ Trend Radar</div>
        <div
          style={s.radarBox}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#00F5FF33';
            e.currentTarget.style.boxShadow = '0 0 16px #00F5FF12';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#1a2240';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <TrendRadar onTopicClick={onTopicClick} />
          <div style={s.hint}>CLICK BUBBLE TO FILTER</div>
        </div>
      </div>

      {/* KEYWORD VELOCITY */}
      <div>
        <div style={s.sectionLabel}>◈ Keyword Velocity</div>
        <div style={s.chartBox}>
          <KeywordChart />
        </div>
      </div>

      {/* WEEKLY DIGEST */}
      <div>
        <div style={s.sectionLabel}>✉ Weekly Digest</div>
        <div style={s.digestWrap}>
          <DigestCard />
        </div>
      </div>
    </div>
  );
}
