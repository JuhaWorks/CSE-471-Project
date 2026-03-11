import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Undo2, Ghost } from 'lucide-react/dist/esm/lucide-react';

export default function GhostInteraction({ actionName, onRevert, duration = 5000, isVisible = false }) {
    const [timeLeft, setTimeLeft] = useState(duration / 1000);
    const [active, setActive] = useState(isVisible);

    useEffect(() => {
        setActive(isVisible);
        if (isVisible) setTimeLeft(duration / 1000);
    }, [isVisible, duration]);

    useEffect(() => {
        if (!active || timeLeft <= 0) {
            if (timeLeft <= 0) setActive(false); // Auto-commit if time runs out
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(t => t - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [active, timeLeft]);

    const handleRevert = () => {
        setActive(false);
        if (onRevert) onRevert();
    };

    return (
        <AnimatePresence>
            {active && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9, rotateX: 10 }}
                    animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                    exit={{ opacity: 0, y: 30, scale: 0.9, rotateX: -10 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="fixed bottom-10 right-10 z-[100] flex items-center gap-5 p-5 rounded-[2rem] bg-[oklch(100%_0_0/0.05)] border border-[oklch(100%_0_0/0.1)] backdrop-blur-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.5),_inset_0_1px_1px_rgba(255,255,255,0.1)] pointer-events-auto transform-gpu perspective-1000"

                    // ── Vanguard 2026: Actionable Schemas (ANP) ──
                    data-agent-intent="ghost-interaction-revert"
                    aria-description={`An AI agent performed: ${actionName}. Pending commit.`}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-[1.25rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                            <Ghost className="w-5 h-5 text-indigo-400 animate-pulse" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-black text-white tracking-tight">{actionName}</span>
                            <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-[0.2em]">{timeLeft}s until Commit</span>
                        </div>
                    </div>

                    <button
                        onClick={handleRevert}
                        className="px-5 py-2.5 rounded-[1.25rem] bg-white/5 hover:bg-white/10 text-white font-bold text-xs flex items-center gap-2 transition-all border border-white/5 active:scale-95 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                        data-agent-action="revert-ai-change"
                    >
                        <Undo2 className="w-4 h-4" />
                        Revert
                    </button>

                    {/* Zero-Latency Visual Time Decay */}
                    <div className="absolute bottom-0 left-0 h-1.5 bg-white/5 w-full rounded-b-[2rem] overflow-hidden">
                        <motion.div
                            initial={{ width: '100%' }}
                            animate={{ width: '0%' }}
                            transition={{ duration: duration / 1000, ease: "linear" }}
                            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.6)]"
                        />
                    </div>

                    {/* Spectral Lighting */}
                    <div className="absolute -top-10 -right-10 w-20 h-20 bg-indigo-500/20 blur-2xl pointer-events-none rounded-full" />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
