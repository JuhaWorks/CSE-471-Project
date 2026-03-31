import React from 'react';
import { motion } from 'framer-motion';

const NetworkingSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div 
          key={i} 
          className="relative overflow-hidden rounded-2xl bg-sunken border border-default p-4 h-[100px]"
        >
          {/* Shimmer Effect */}
          <motion.div 
            className="absolute inset-0 z-0"
            animate={{ 
              background: [
                'linear-gradient(90deg, transparent, rgba(var(--theme-rgb), 0.05), transparent)', 
                'linear-gradient(90deg, transparent, rgba(var(--theme-rgb), 0.05), transparent)'
              ],
              x: ['-100%', '100%']
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          />
          
          <div className="relative z-10 flex items-center gap-4">
            {/* Avatar skeleton */}
            <div className="w-12 h-12 rounded-xl bg-default/50 animate-pulse" />
            
            <div className="flex-1 space-y-2">
              {/* Name skeleton */}
              <div className="h-4 w-1/2 bg-default/50 rounded-lg animate-pulse" />
              {/* Role/Stats skeleton */}
              <div className="h-3 w-1/3 bg-default/50 rounded-md animate-pulse" />
            </div>
            
            {/* Action button skeleton */}
            <div className="w-20 h-8 rounded-xl bg-default/50 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default NetworkingSkeleton;
