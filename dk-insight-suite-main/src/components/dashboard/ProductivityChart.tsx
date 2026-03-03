import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TimelineDataPoint } from '@/types';

interface ProductivityChartProps {
  data: TimelineDataPoint[];
  title?: string;
}

export function ProductivityChart({ data, title = 'Activity Timeline' }: ProductivityChartProps) {
  const chartData = useMemo(() => {
    return data.map(d => ({
      ...d,
      activeMinutes: Math.round(d.activeSeconds / 60),
      idleMinutes: Math.round(d.idleSeconds / 60),
    }));
  }, [data]);

  return (
    <div className="chart-container">
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(175, 84%, 40%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(175, 84%, 40%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="idleGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" />
            <XAxis 
              dataKey="time" 
              tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(217, 33%, 17%)' }}
            />
            <YAxis 
              tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(217, 33%, 17%)' }}
              label={{ value: 'Minutes', angle: -90, position: 'insideLeft', fill: 'hsl(215, 20%, 55%)' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(222, 47%, 10%)',
                border: '1px solid hsl(217, 33%, 17%)',
                borderRadius: '8px',
                color: 'hsl(210, 40%, 98%)',
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey="activeMinutes"
              name="Active Time"
              stroke="hsl(175, 84%, 40%)"
              fill="url(#activeGradient)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="idleMinutes"
              name="Idle Time"
              stroke="hsl(38, 92%, 50%)"
              fill="url(#idleGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
