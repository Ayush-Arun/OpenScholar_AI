import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { mockTrends } from '../data/mockData';

const COLORS = [
  '#00F5FF','#39FF14','#FFB800','#00F5FF',
  '#FFB800','#39FF14','#FF2D55','#00F5FF',
];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{
      background: '#0d1225',
      border: `1px solid ${d.fill}55`,
      borderRadius: 4,
      padding: '6px 10px',
      fontFamily: "'Space Mono', monospace",
      fontSize: 10,
      color: d.fill,
      boxShadow: `0 0 12px ${d.fill}33`,
    }}>
      <div style={{ color: '#c8d6f0', marginBottom: 2 }}>{d.payload.keyword}</div>
      <div>VELOCITY <span style={{ fontWeight: 700 }}>{d.value}</span></div>
    </div>
  );
}

export default function KeywordChart() {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ width: '100%' }}>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart
          data={mockTrends}
          layout="vertical"
          margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
          barCategoryGap="22%"
        >
          <XAxis
            type="number"
            domain={[0, 100]}
            hide
          />
          <YAxis
            type="category"
            dataKey="keyword"
            width={90}
            tick={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 8,
              fill: '#5a6a8a',
              letterSpacing: 0,
            }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,245,255,0.04)' }} />
          <Bar
            dataKey="score"
            radius={[0, 2, 2, 0]}
            isAnimationActive={animated}
            animationDuration={1200}
            animationEasing="ease-out"
          >
            {mockTrends.map((_, i) => (
              <Cell
                key={i}
                fill={COLORS[i % COLORS.length]}
                style={{ filter: `drop-shadow(0 0 4px ${COLORS[i % COLORS.length]}88)` }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
