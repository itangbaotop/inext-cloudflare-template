import React from 'react';

interface BackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export const Background: React.FC<BackgroundProps> = ({ children, className = '' }) => {
  return (
    <div className={`min-h-screen w-full flex flex-col bg-gray-50 dark:bg-gray-900 ${className}`}>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default Background;