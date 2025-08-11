'use client';

import { useState } from 'react';
import { CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { GlowingCard } from './glowing-card';
import { ChartToggle } from './chart-toggle';
import { TimeChart } from './time-chart';

interface TimeDataPoint {
  timestamp: number;
  [key: string]: any;
}

interface ChartCardProps {
  title: string;
  description: string;
  data: TimeDataPoint[];
  className?: string;
  groupBy?: 'day' | 'week' | 'month';
  children: React.ReactNode; // The list view content
}

export function ChartCard({ 
  title, 
  description, 
  data, 
  className, 
  groupBy = 'day',
  children 
}: ChartCardProps) {
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('list');
  const hasData = data.length > 0;

  return (
    <GlowingCard className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-semibold text-foreground">
                {description.split(' ')[0]}
              </span>
              <CardDescription className="text-sm text-muted-foreground">
                {description.split(' ').slice(1).join(' ')}
              </CardDescription>
            </div>
          </div>
          <ChartToggle 
            viewMode={viewMode} 
            onToggle={setViewMode}
            hasData={hasData}
          />
        </div>
      </CardHeader>
      <CardContent>
        <TimeChart 
          data={data} 
          chartType="line" 
          groupBy={groupBy}
          viewMode={viewMode}
        >
          {children}
        </TimeChart>
      </CardContent>
    </GlowingCard>
  );
}