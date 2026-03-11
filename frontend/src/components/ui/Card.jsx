import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Modern 2026 Vite-Optimized Card
 * Glassmorphism 2.0, Anti-grid tendencies, and subtle spring interactions.
 */

const cn = (...inputs) => twMerge(clsx(inputs));

const Card = ({
    children,
    className,
    hoverable = true,
    padding = 'p-6',
    variant = 'glass', // 'glass' | 'solid' | 'outline'
    ...props
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={hoverable ? { 
                y: -5, 
                transition: { type: 'spring', stiffness: 400, damping: 25 } 
            } : {}}
            className={cn(
                'relative flex flex-col overflow-hidden rounded-[2rem] transition-all duration-500',
                variant === 'glass' && 'glass-2 border-white/5 bg-white/[0.02]',
                variant === 'solid' && 'bg-[#13151c] border border-white/5',
                variant === 'outline' && 'bg-transparent border border-white/10',
                padding,
                className
            )}
            {...props}
        >
            {/* 2026 Structural Reinforcement Glow */}
            <span className="absolute inset-0 rounded-[inherit] pointer-events-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]" aria-hidden />
            
            <div className="relative z-10 flex flex-col h-full">
                {children}
            </div>

            {/* Subtle Texture Layer */}
            <div className="absolute inset-0 opacity-[0.015] pointer-events-none grayscale bg-[url('https://grainy-gradients.vercel.app/noise.svg')] blend-overlay" />
        </motion.div>
    );
};

export default Card;
