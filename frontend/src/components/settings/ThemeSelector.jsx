import React, { useState, useRef, useEffect } from 'react';
import { useTheme, THEMES } from '../../store/useTheme';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Palette, ChevronDown } from 'lucide-react';

const THEME_OPTIONS = [
    { id: THEMES.EMERALD, name: 'Emerald', colors: ['#059669', '#10b981', '#34d399'] },
    { id: THEMES.VIOLET, name: 'Violet', colors: ['#7c3aed', '#8b5cf6', '#a78bfa'] },
    { id: THEMES.SKY, name: 'Sky', colors: ['#0284c7', '#0ea5e9', '#38bdf8'] },
    { id: THEMES.AMBER, name: 'Amber', colors: ['#d97706', '#f59e0b', '#fbbf24'] },
    { id: THEMES.ROSE, name: 'Rose', colors: ['#e11d48', '#f43f5e', '#fb7185'] },
    { id: THEMES.INDIGO, name: 'Indigo', colors: ['#4f46e5', '#6366f1', '#818cf8'] },
    { id: THEMES.TEAL, name: 'Teal', colors: ['#0d9488', '#14b8a6', '#2dd4bf'] },
    { id: THEMES.ORANGE, name: 'Orange', colors: ['#ea580c', '#f97316', '#fb923c'] },
    { id: THEMES.PINK, name: 'Pink', colors: ['#db2777', '#ec4899', '#f472b6'] },
    { id: THEMES.SLATE, name: 'Slate', colors: ['#475569', '#64748b', '#94a3b8'] },
];

export default function ThemeSelector() {
    const { theme, setTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const activeTheme = THEME_OPTIONS.find(t => t.id === theme) || THEME_OPTIONS[0];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                        <Palette className="w-3.5 h-3.5 text-theme" />
                        Color Atmosphere
                    </h3>
                </div>

                {/* Streamlined Dropdown */}
                <div className="relative w-full sm:w-56" ref={dropdownRef}>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="w-full h-10 px-4 flex items-center justify-between bg-surface border border-default rounded-xl hover:bg-white/[0.08] transition-all group active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-2.5">
                            <ThemeGradient colors={activeTheme.colors} size="w-3.5 h-3.5" />
                            <span className="text-[11px] font-bold text-primary uppercase tracking-wider">{activeTheme.name}</span>
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 text-tertiary transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="absolute top-12 left-0 right-0 z-[100] bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-1.5"
                            >
                                <div className="grid grid-cols-1 gap-1">
                                    {THEME_OPTIONS.map((t) => {
                                        const active = theme === t.id;
                                        return (
                                            <button
                                                key={t.id}
                                                onClick={() => {
                                                    setTheme(t.id);
                                                    setIsOpen(false);
                                                }}
                                                className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all ${active ? 'bg-white/10' : 'hover:bg-white/5'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <ThemeGradient colors={t.colors} size="w-6 h-6" rounded="rounded-md" />
                                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">{t.name}</span>
                                                </div>
                                                {active && <Check className="w-3 h-3 text-theme" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* High-density Grid Preview */}
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-3">
                {THEME_OPTIONS.map((t) => {
                    const active = theme === t.id;
                    return (
                        <button
                            key={t.id}
                            onClick={() => setTheme(t.id)}
                            className={`group relative flex flex-col items-center transition-all duration-300 ${active ? 'scale-110' : 'hover:scale-105 opacity-50 hover:opacity-100'}`}
                        >
                            <ThemeGradient 
                                colors={t.colors} 
                                size="w-8 h-8 sm:w-10 sm:h-10" 
                                active={active}
                            />
                            {active && (
                                <motion.div 
                                    layoutId="theme-active-dot"
                                    className="absolute -bottom-2.5 w-1 h-1 rounded-full bg-theme shadow-theme" 
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Minimalist Status */}
            <div className="flex items-center gap-3 py-3 px-4 bg-white/[0.02] border border-white/5 rounded-xl">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.15em]">
                    Atmosphere <span className="text-zinc-300">Synchronized</span> across workspace
                </span>
            </div>
        </div>
    );
}

function ThemeGradient({ colors, size = "w-10 h-10", rounded = "rounded-xl", active = false }) {
    return (
        <div 
            className={`${size} ${rounded} relative overflow-hidden transition-all duration-500 ${active ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950' : 'border border-white/10 shadow-lg'}`}
            style={{
                background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)`
            }}
        >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
        </div>
    );
}