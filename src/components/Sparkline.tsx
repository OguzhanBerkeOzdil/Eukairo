import React, { useState } from 'react';

interface SparklineProps {
  data: number[];
}

export const Sparkline: React.FC<SparklineProps> = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (data.length === 0) return null;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 20 - val * 10;
    return { x, y, value: val };
  });

  return (
    <div className="relative">
      <svg className="w-32 h-16" viewBox="0 0 100 40" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-primary"
          points={points.map(p => `${p.x},${p.y}`).join(' ')}
        />
        <line 
          x1="0" 
          y1="20" 
          x2="100" 
          y2="20" 
          stroke="currentColor" 
          strokeWidth="1" 
          className="text-gray-500 opacity-30" 
        />
        {points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="3"
            fill="#34D399"
            className="cursor-pointer hover:r-5 transition-all"
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          />
        ))}
      </svg>
      {hoveredIndex !== null && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap">
          Session {hoveredIndex + 1}: {points[hoveredIndex].value > 0 ? '+' : ''}{points[hoveredIndex].value.toFixed(2)}
        </div>
      )}
    </div>
  );
};
