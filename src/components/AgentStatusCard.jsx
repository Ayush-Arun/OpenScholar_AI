import { useEffect, useState } from 'react';

export default function AgentStatusCard({ agent, delay = 0 }) {
  const isRunning = agent.status === 'RUNNING';
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setTick(t => (t + 1) % agent.activity.length), 600);
    return () => clearInterval(id);
  }, [isRunning, agent.activity.length]);

  const s = {
    card: {
      background: 'linear-gradient(135deg, #090d1a 0%, #0d1225 100%)',
      border: `1px solid ${isRunning ? '#39FF1444' : '#1a2240'}`,
      borderRadius: 5,
      padding: '8px 10px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      opacity: 0,
      transform: 'translateY(22px)',
      animation: `revealUp 0.55s cubic-bezier(0.22,1,0.36,1) ${delay}s forwards`,
      transition: 'box-shadow 0.3s',
      boxShadow: isRunning ? '0 0 12px #39FF1418' : 'none',
    },
    row: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    name: {
      fontFamily: "'Space Mono', monospace",
      fontSize: 10,
      fontWeight: 700,
      color: isRunning ? '#c8d6f0' : '#5a6a8a',
      letterSpacing: 1,
    },
    role: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 9,
      color: '#3a4a6a',
      marginTop: 1,
    },
    badge: {
      fontFamily: "'Space Mono', monospace",
      fontSize: 8,
      letterSpacing: 2,
      padding: '2px 6px',
      borderRadius: 2,
      background: isRunning ? '#39FF1420' : '#FFB80020',
      color: isRunning ? '#39FF14' : '#FFB800',
      border: `1px solid ${isRunning ? '#39FF1444' : '#FFB80044'}`,
      textShadow: isRunning ? '0 0 6px #39FF14' : '0 0 6px #FFB800',
      animation: isRunning ? 'glowPulse 2s ease-in-out infinite' : 'none',
    },
    bars: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: 2,
      height: 14,
    },
  };

  return (
    <div style={s.card}>
      <div style={s.row}>
        <div>
          <div style={s.name}>{agent.name.toUpperCase()}</div>
          <div style={s.role}>{agent.role}</div>
        </div>
        <div style={s.badge}>{agent.status}</div>
      </div>
      {/* Mini activity sparkbar */}
      <div style={s.bars}>
        {agent.activity.map((v, i) => (
          <div
            key={i}
            style={{
              width: 4,
              borderRadius: 1,
              background: isRunning
                ? (i === tick % agent.activity.length ? '#39FF14' : '#39FF1444')
                : '#1a2240',
              height: `${Math.max(2, (v / 10) * 14)}px`,
              transition: 'height 0.3s, background 0.3s',
              boxShadow: isRunning && i === tick % agent.activity.length
                ? '0 0 6px #39FF14' : 'none',
            }}
          />
        ))}
      </div>
    </div>
  );
}
