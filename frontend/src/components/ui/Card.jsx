import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

/**
 * Standard Vanguard Card v2.1
 * Premium Glassmorphism without Liquid Distortions
 */
const Card = ({
    children,
    className,
    hoverable = true,
    padding = 'p-6',
    variant = 'glass', // 'glass' | 'solid' | 'outline'
    interactive = true,
    ...props
}) => {
    const variants = {
        glass: 'bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl',
        solid: 'bg-[var(--bg-surface)] border-default shadow-card',
        outline: 'bg-transparent border-default'
    };

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
                variants[variant],
                padding,
                className
            )}
            {...props}
        >
            {/* Inner Glow/Highlight */}
            <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" aria-hidden />
            
            <div className="relative z-10 flex flex-col h-full">
                {children}
            </div>
        </motion.div>
    );
};

export default Card;
