import { useEffect, useState } from 'react';
import AgentStatusCard from './AgentStatusCard';
import { mockAgents, mockStats } from '../data/mockData';
import { useProfile } from '../context/ProfileContext';
import { userProfiles } from '../data/mockData';

const statIcons = {
  papersToday:    { icon: '◈', color: '#00F5FF', label: 'Papers Today' },
  reposScanned:   { icon: '⬡', color: '#39FF14', label: 'Repos Scanned' },
  trendsDetected: { icon: '⟁', color: '#FFB800', label: 'Trends Detected' },
  reportsSent:    { icon: '✉', color: '#FF2D55', label: 'Reports Sent' },
};

function AnimatedNumber({ target, duration = 1600 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(ease * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return <>{val.toLocaleString()}</>;
}

export default function Sidebar() {
  const { profile, setProfile } = useProfile();

  const s = {
    sidebar: {
      height: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
      padding: '16px 12px',
      borderRight: '1px solid #1a2240',
      background: 'linear-gradient(180deg, #060a14 0%, #050810 100%)',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
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
    statCard: (color) => ({
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 10px',
      borderRadius: 5,
      background: `${color}08`,
      border: `1px solid ${color}22`,
      opacity: 0,
      animation: 'revealUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.3s forwards',
    }),
    statIcon: (color) => ({
      fontSize: 18,
      color,
      textShadow: `0 0 10px ${color}`,
      fontFamily: "'Space Mono', monospace",
      lineHeight: 1,
    }),
    statVal: (color) => ({
      fontFamily: "'Space Mono', monospace",
      fontSize: 20,
      fontWeight: 700,
      color,
      lineHeight: 1,
      textShadow: `0 0 10px ${color}88`,
    }),
    statLabel: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 9,
      color: '#4a5a7a',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginTop: 2,
    },
    profileSection: {
      padding: '12px',
      borderRadius: 6,
      background: '#090d1a',
      border: '1px solid #1a2240',
      opacity: 0,
      animation: 'revealUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.5s forwards',
    },
    profileLabel: {
      fontFamily: "'Space Mono', monospace",
      fontSize: 8,
      letterSpacing: 3,
      color: '#00F5FF',
      textTransform: 'uppercase',
      paddingBottom: 6,
      borderBottom: '1px solid #1a2240',
      marginBottom: 10,
    },
    profileBtn: (active) => ({
      fontFamily: "'Space Mono', monospace",
      fontSize: 9,
      letterSpacing: 1,
      padding: '5px 10px',
      borderRadius: 3,
      border: active ? '1px solid #00F5FF55' : '1px solid #1a2240',
      background: active ? '#00F5FF15' : 'transparent',
      color: active ? '#00F5FF' : '#4a5a7a',
      cursor: 'none',
      textShadow: active ? '0 0 6px #00F5FF' : 'none',
      boxShadow: active ? '0 0 8px #00F5FF22' : 'none',
      transition: 'all 0.2s',
    }),
  };

  return (
    <div style={s.sidebar}>
      {/* AGENTS STATUS */}
      <div>
        <div style={s.sectionLabel}>◈ Agents Status</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {mockAgents.map((agent, i) => (
            <AgentStatusCard key={agent.id} agent={agent} delay={0.05 + i * 0.07} />
          ))}
        </div>
      </div>

      {/* QUICK STATS */}
      <div>
        <div style={s.sectionLabel}>⟁ Quick Stats</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Object.entries(mockStats).map(([key, val], i) => {
            const info = statIcons[key];
            return (
              <div key={key} style={{
                ...s.statCard(info.color),
                animationDelay: `${0.15 + i * 0.08}s`,
              }}>
                <div style={s.statIcon(info.color)}>{info.icon}</div>
                <div>
                  <div style={s.statVal(info.color)}>
                    <AnimatedNumber target={val} duration={1400 + i * 150} />
                  </div>
                  <div style={s.statLabel}>{info.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* USER PROFILE */}
      <div style={s.profileSection}>
        <div style={s.profileLabel}>◎ User Profile</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {userProfiles.map(p => (
            <button
              key={p}
              style={s.profileBtn(profile === p)}
              onClick={() => setProfile(p)}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
        <div style={{
          marginTop: 10,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 10,
          color: '#4a5a7a',
          lineHeight: 1.5,
        }}>
          Viewing as{' '}
          <span style={{ color: '#00F5FF', fontWeight: 500 }}>{profile}</span>.
          Recommendations tailored to your role.
        </div>
      </div>
    </div>
  );
}
