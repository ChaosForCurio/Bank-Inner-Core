'use client';

import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector, Tooltip } from 'recharts';
import { GlassCard } from '../ui/glass-card';
import { cn } from '@/lib/utils';
import { usePrivacy } from '@/context/privacy-context';
import { Lock } from 'lucide-react';

interface DataPoint {
  category: string;
  total_amount: number;
}

interface SpendingAnalysisProps {
  data: DataPoint[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

  return (
    <g>
      <text x={cx} y={cy} dy={-20} textAnchor="middle" fill="#fff" className="text-xs font-medium uppercase tracking-widest opacity-50">
        {payload.category}
      </text>
      <text x={cx} y={cy} dy={15} textAnchor="middle" fill="#fff" className="text-2xl font-bold">
        ₹{parseFloat(value).toLocaleString('en-IN')}
      </text>
      <text x={cx} y={cy} dy={40} textAnchor="middle" fill={fill} className="text-xs font-semibold">
        {(percent * 100).toFixed(1)}%
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 12}
        fill={fill}
      />
    </g>
  );
};

export const SpendingAnalysis: React.FC<SpendingAnalysisProps> = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const { isPrivate } = usePrivacy();

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  return (
    <GlassCard className="h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-widest">
          Spending Analysis
        </h3>
        <div className="flex gap-2">
          {data.slice(0, 3).map((item, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-[10px] text-white/40">{item.category}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full relative">
        <div className={cn("h-full w-full transition-all duration-700", isPrivate && "blur-2xl opacity-20 select-none grayscale")}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <PieChart>
                <Pie
                activeShape={isPrivate ? undefined : renderActiveShape}
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={100}
                dataKey="total_amount"
                onMouseEnter={onPieEnter}
                stroke="none"
                >
                {data.map((entry, index) => (
                    <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        style={{ 
                            filter: activeIndex === index ? `drop-shadow(0 0 8px ${COLORS[index % COLORS.length]}88)` : 'none',
                            transition: 'filter 0.3s ease'
                        }}
                    />
                ))}
                </Pie>
                {!isPrivate && <Tooltip content={<></>} defaultIndex={0} />}
            </PieChart>
            </ResponsiveContainer>
        </div>
        {isPrivate && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <div className="p-3 rounded-full bg-white/5 border border-white/10">
                    <Lock className="w-5 h-5 text-white/40" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Analysis Masked</p>
            </div>
        )}
      </div>
    </GlassCard>
  );
};
