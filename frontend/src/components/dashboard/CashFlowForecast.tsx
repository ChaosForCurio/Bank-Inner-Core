'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GlassCard } from '../ui/glass-card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ForecastPoint {
  date: string;
  predicted_balance: string;
}

interface CashFlowForecastProps {
  data: ForecastPoint[];
  dailyBurnRate: string;
}

export const CashFlowForecast: React.FC<CashFlowForecastProps> = ({ data, dailyBurnRate }) => {
  const burnRate = parseFloat(dailyBurnRate);
  
  return (
    <GlassCard className="h-[300px] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-widest">
            30-Day Forecast
          </h3>
          <p className="text-[10px] text-white/30 mt-1">Based on historical burn rate and recurring bills</p>
        </div>
        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
          {burnRate > 0 ? (
            <TrendingDown size={14} className="text-red-400" />
          ) : (
            <TrendingUp size={14} className="text-green-400" />
          )}
          <span className="text-xs font-medium text-white/80">₹{Math.abs(burnRate).toFixed(0)}/day</span>
        </div>
      </div>

      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
              tickFormatter={(str) => new Date(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              minTickGap={30}
            />
            <YAxis 
              hide 
              domain={['dataMin - 1000', 'dataMax + 1000']}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#161616', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
              itemStyle={{ color: '#10b981', fontSize: '12px', fontWeight: 'bold' }}
              labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', marginBottom: '4px' }}
              formatter={(value: any) => [`₹${parseFloat(value).toLocaleString('en-IN')}`, 'Predicted Balance']}
            />
            <Area 
              type="monotone" 
              dataKey="predicted_balance" 
              stroke="#10b981" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorBalance)" 
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
};
