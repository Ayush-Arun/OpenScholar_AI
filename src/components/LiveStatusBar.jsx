import { useState, useEffect } from 'react';
import { topicFilters } from '../data/mockData';
import { useProfile } from '../context/ProfileContext';
import { userProfiles } from '../data/mockData';

function AnimatedCounter({ target, duration = 1800 }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return <span>{value.toLocaleString()}</span>;
}

export default function LiveStatusBar({ activeTopics, onTopicToggle }) {
  const { profile, setProfile } = useProfile();

  const s = {
    bar: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 52,
      padding: '0 20px',
      background: 'linear-gradient(90deg, #090d1a 0%, #050810 50%, #090d1a 100%)',
      borderBottom: '1px solid #1a2240',
      boxShadow: '0 1px 0 #00F5FF22',
      position: 'relative',
      zIndex: 10,
      flexShrink: 0,
    },
    logo: {
      fontFamily: "'Space Mono', monospace",
      fontSize: 15,
      fontWeight: 700,
      color: '#00F5FF',
      letterSpacing: 2,
      textShadow: '0 0 12px #00F5FF88',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      userSelect: 'none',
    },
    liveDot: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: '#39FF14',
      boxShadow: '0 0 8px #39FF14',
      animation: 'blinkDot 1.2s step-start infinite',
      display: 'inline-block',
    },
    liveLabel: {
      fontFamily: "'Space Mono', monospace",
      fontSize: 9,
      color: '#39FF14',
      letterSpacing: 2,
      textShadow: '0 0 8px #39FF14',
    },
    center: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      position: 'absolute',
      left: '50%',
      transform: 'translateX(-50%)',
    },
    right: {
      display: 'flex',
      alignItems: 'center',
      gap: 18,
    },
    stat: {
      fontFamily: "'Space Mono', monospace",
      fontSize: 10,
      color: '#5a6a8a',
      letterSpacing: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: 1,
    },
    statVal: {
      color: '#c8d6f0',
      fontSize: 12,
      fontWeight: 700,
    },
    divider: {
      width: 1,
      height: 22,
      background: '#1a2240',
    },
    profileSelect: {
      fontFamily: "'Space Mono', monospace",
      fontSize: 10,
      background: '#0d1225',
      color: '#00F5FF',
      border: '1px solid #00F5FF44',
      borderRadius: 4,
      padding: '3px 8px',
      cursor: 'none',
      outline: 'none',
      letterSpacing: 1,
    },
  };

  return (
    <div style={s.bar}>
      {/* LEFT — Logo */}
      <div style={s.logo}>
        <span style={s.liveDot} />
        OPENSCHOLAR<span style={{ color: '#FFB800' }}>_</span>AI
        <span style={s.liveLabel}>LIVE</span>
      </div>

      {/* CENTER — Topic Pills */}
      <div style={s.center}>
        {topicFilters.map(t => (
          <TopicPill
            key={t}
            label={t}
            active={activeTopics.includes(t)}
            onClick={() => onTopicToggle(t)}
          />
        ))}
      </div>

      {/* RIGHT — Stats + Profile */}
      <div style={s.right}>
        <div style={s.stat}>
          <span style={{ color: '#5a6a8a', fontSize: 9, letterSpacing: 2 }}>LAST SCAN</span>
          <span style={s.statVal}>2 mins ago</span>
        </div>
        <div style={s.divider} />
        <div style={s.stat}>
          <span style={{ color: '#5a6a8a', fontSize: 9, letterSpacing: 2 }}>PAPERS</span>
          <span style={{ ...s.statVal, color: '#00F5FF' }}><AnimatedCounter target={847} /></span>
        </div>
        <div style={s.divider} />
        <div style={s.stat}>
          <span style={{ color: '#5a6a8a', fontSize: 9, letterSpacing: 2 }}>REPOS</span>
          <span style={{ ...s.statVal, color: '#FFB800' }}><AnimatedCounter target={312} /></span>
        </div>
        <div style={s.divider} />
        <select
          style={s.profileSelect}
          value={profile}
          onChange={e => setProfile(e.target.value)}
        >
          {userProfiles.map(p => (
            <option key={p} value={p}>{p.toUpperCase()}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function TopicPill({ label, active, onClick }) {
  const s = {
    pill: {
      fontFamily: "'Space Mono', monospace",
      fontSize: 9,
      letterSpacing: 2,
      padding: '4px 10px',
      borderRadius: 3,
      border: active ? '1px solid #00F5FF' : '1px solid #1a2240',
      background: active ? '#00F5FF15' : 'transparent',
      color: active ? '#00F5FF' : '#5a6a8a',
      boxShadow: active ? '0 0 10px #00F5FF44, 0 0 2px #00F5FF inset' : 'none',
      cursor: 'none',
      transition: 'all 0.2s',
      userSelect: 'none',
      textShadow: active ? '0 0 8px #00F5FF' : 'none',
    },
  };
  return (
    <button style={s.pill} onClick={onClick}>
      {label.toUpperCase()}
    </button>
  );
}
