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
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
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