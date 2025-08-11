'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface TimeDataPoint {
  timestamp: number;
  [key: string]: any;
}

interface TimeChartProps {
  data: TimeDataPoint[];
  children: React.ReactNode; // The list view content
  chartType?: 'line' | 'bar';
  groupBy?: 'day' | 'week' | 'month';
  viewMode: 'list' | 'chart';
}

export function TimeChart({ 
  data, 
  children, 
  chartType = 'line',
  groupBy = 'day',
  viewMode
}: TimeChartProps) {

  // Process data for chart
  const processChartData = () => {
    if (data.length === 0) return [];

    // Group data by time period
    const grouped = data.reduce((acc, item) => {
      const date = new Date(item.timestamp * 1000);
      let key: string;
      
      switch (groupBy) {
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default: // day
          key = date.toISOString().split('T')[0];
          break;
      }

      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Convert to chart format and sort by date
    return Object.entries(grouped)
      .map(([date, count]) => ({
        date: formatDateLabel(date, groupBy),
        count,
        rawDate: date
      }))
      .sort((a, b) => a.rawDate.localeCompare(b.rawDate))
      .slice(-30); // Last 30 periods
  };

  const formatDateLabel = (dateStr: string, period: string) => {
    const date = new Date(dateStr);
    switch (period) {
      case 'week':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      default:
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const chartData = processChartData();
  const hasData = data.length > 0;

  if (!hasData) {
    return <>{children}</>;
  }

  return (
    <>
      {viewMode === 'list' ? (
        children
      ) : (
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11 }}
                  className="fill-muted-foreground"
                  interval="preserveStartEnd"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  className="fill-muted-foreground"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    color: 'hsl(var(--popover-foreground))'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                  activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11 }}
                  className="fill-muted-foreground"
                  interval="preserveStartEnd"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  className="fill-muted-foreground"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    color: 'hsl(var(--popover-foreground))'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--primary))"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </>
  );
}