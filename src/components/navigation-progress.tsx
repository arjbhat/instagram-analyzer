'use client';

import { useEffect, useState } from 'react';

export function NavigationProgress() {
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const handleStart = () => {
      timeout = setTimeout(() => setLoading(true), 100);
    };
    
    const handleComplete = () => {
      clearTimeout(timeout);
      setLoading(false);
    };

    // Since we can't directly listen to Next.js 13+ router events,
    // we'll detect navigation through URL changes
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    
    window.history.pushState = function(...args) {
      handleStart();
      const result = originalPushState.apply(this, args);
      // Complete after a short delay to allow Next.js to render
      setTimeout(handleComplete, 500);
      return result;
    };
    
    window.history.replaceState = function(...args) {
      handleStart();
      const result = originalReplaceState.apply(this, args);
      setTimeout(handleComplete, 500);
      return result;
    };
    
    return () => {
      clearTimeout(timeout);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gradient-to-r from-primary/50 to-primary">
      <div className="h-full bg-gradient-to-r from-primary to-primary/80 animate-pulse" 
           style={{ 
             animation: 'loading-bar 1s ease-in-out infinite',
           }} 
      />
      <style jsx>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}