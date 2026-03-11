import React from 'react';
import { useTheme, THEMES } from '../../store/useTheme';
import { motion } from 'framer-motion';
import { Palette, Check, Zap } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

/**
 * Modern 2026 ThemeSelector
 * Spectral orchestration with Glassmorphism 2.0 aesthetics
 */
export default function ThemeSelector() {
    const { theme, setTheme } = useTheme();

    const themes = [
        {
            id: THEMES.EMERALD,
            name: 'Emerald Core',
            description: 'Hyper-vibrant flora. The OSIRIS signature sequence.',
            color: '#2db38a',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            glow: 'shadow-emerald-500/20'
        },
        {
            id: THEMES.NEON_PURPLE,
            name: 'Violet Nebula',
            description: 'Deep-space ultra-violet for high-focus neural links.',
            color: '#9b87f5',
            bg: 'bg-violet-500/10',
            border: 'border-violet-500/20',
            glow: 'shadow-violet-500/20'
        },
        {
            id: THEMES.CYBER_YELLOW,
            name: 'Amber Kinetic',
            description: 'High-contrast solar amber. Optimized for operational awareness.',
            color: '#f5be50',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            glow: 'shadow-amber-500/20'
        },
        {
            id: THEMES.CRIMSON_RED,
            name: 'Rose Reactor',
            description: 'Aggressive coral-rose. Engineered for high-stress response.',
            color: '#f06473',
            bg: 'bg-rose-500/10',
            border: 'border-rose-500/20',
            glow: 'shadow-rose-500/20'
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-700">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                        Spectral <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 uppercase">Aesthetic.</span>
                    </h3>
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Neural Interface Calibration</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-2xl shadow-xl">
                    <Palette className="w-4 h-4 text-cyan-400" />
                    <span className="text-[9px] font-black text-white uppercase tracking-widest">OSIRIS v4.2</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {themes.map((t) => {
                    const isActive = theme === t.id;
                    return (
                        <button
                            key={t.id}
                            onClick={() => setTheme(t.id)}
                            className={cn(
                                "group relative flex items-start gap-6 p-6 rounded-[2.5rem] border text-left transition-all duration-500",
                                isActive 
                                    ? "bg-white/5 border-white/20 shadow-[0_20px_40px_rgba(0,0,0,0.5)] scale-[1.02]" 
                                    : "bg-transparent border-white/5 hover:border-white/10 hover:bg-white/[0.02]"
                            )}
                        >
                            {/* Color Core */}
                            <div className="relative shrink-0">
                                <div className={cn(
                                    "w-16 h-16 rounded-[1.5rem] border transition-all duration-500 flex items-center justify-center p-4",
                                    t.border, t.bg,
                                    isActive ? "scale-110 shadow-2xl" : "group-hover:scale-105"
                                )}>
                                    <div 
                                        className={cn(
                                            "w-full h-full rounded-xl transition-transform duration-500",
                                            isActive ? "scale-100 rotate-0" : "scale-75 rotate-45 group-hover:rotate-0 group-hover:scale-100"
                                        )}
                                        style={{ backgroundColor: t.color }}
                                    />
                                </div>
                                {isActive && (
                                    <motion.div 
                                        layoutId="active-spectra"
                                        className="absolute -inset-2 border-2 border-white/20 rounded-[2rem] animate-pulse" 
                                    />
                                )}
                            </div>

                            {/* Directive Label */}
                            <div className="space-y-2 flex-1">
                                <div className="flex items-center justify-between">
                                    <h4 className={cn(
                                        "font-black text-sm uppercase tracking-widest",
                                        isActive ? "text-white" : "text-gray-500 group-hover:text-gray-300"
                                    )}>
                                        {t.name}
                                    </h4>
                                    {isActive && (
                                        <div className="w-6 h-6 rounded-lg bg-emerald-500 text-black flex items-center justify-center shadow-lg shadow-emerald-500/40">
                                            <Check className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                                    {t.description}
                                </p>
                                {isActive && (
                                    <div className="flex items-center gap-2 pt-2">
                                        <Zap className="w-3 h-3 text-cyan-400" />
                                        <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest">Active Link</span>
                                    </div>
                                )}
                            </div>

                            {/* Premium Shadow Interaction */}
                            {isActive && (
                                <div className={cn(
                                    "absolute inset-0 rounded-[2.5rem] blur-3xl opacity-20 -z-10",
                                    t.bg
                                )} />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
