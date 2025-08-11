'use client';

import { Button } from './button';
import { BarChart3, List } from 'lucide-react';

interface ChartToggleProps {
  viewMode: 'list' | 'chart';
  onToggle: (mode: 'list' | 'chart') => void;
  hasData?: boolean;
}

export function ChartToggle({ viewMode, onToggle, hasData = true }: ChartToggleProps) {
  if (!hasData) return null;

  return (
    <div className="flex gap-1 bg-muted p-1 rounded-lg">
      <Button
        variant={viewMode === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onToggle('list')}
        className="h-6 w-6 p-0"
      >
        <List size={12} />
      </Button>
      <Button
        variant={viewMode === 'chart' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onToggle('chart')}
        className="h-6 w-6 p-0"
      >
        <BarChart3 size={12} />
      </Button>
    </div>
  );
}