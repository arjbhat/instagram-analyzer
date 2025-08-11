'use client';

import { Card } from './card';
import { GlowingEffect } from './glowing-effect';
import { cn } from '@/lib/utils';

interface GlowingCardProps {
  className?: string;
  glow?: boolean;
  children: React.ReactNode;
}

export function GlowingCard({ className, glow = true, children }: GlowingCardProps) {
  return (
    <div className={cn("relative", className)}>
      <Card className="relative transition-all duration-300 hover:shadow-lg">
        {glow && (
          <GlowingEffect
            spread={40}
            glow={true}
            disabled={false}
            proximity={64}
            inactiveZone={0.01}
          />
        )}
        {children}
      </Card>
    </div>
  );
}