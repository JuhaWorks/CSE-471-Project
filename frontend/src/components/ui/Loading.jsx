import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

/**
 * GlobalLoadingScreen
 * Full-page loader for initial auth checks
 */
export const GlobalLoadingScreen = () => (
    <div className="fixed inset-0 z-[9999] bg-base flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-8">
            <div className="absolute inset-0 bg-theme/20 blur-3xl rounded-full animate-pulse" />
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="relative z-10 w-24 h-24 rounded-[2.5rem] bg-surface border-2 border-theme/20 flex items-center justify-center shadow-2xl shadow-theme/10"
            >
                <img src="/logo.png?v=2" alt="klvira" className="w-12 h-12 grayscale opacity-50" />
            </motion.div>
        </div>
        
        <div className="space-y-2">
            <h2 className="text-xl font-black text-primary tracking-tighter">Initializing Klivra Core</h2>
            <div className="flex items-center justify-center gap-2 text-tertiary">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Synchronizing Session...</span>
            </div>
        </div>
        
        <div className="fixed bottom-12 left-0 right-0 px-12">
            <div className="max-w-xs mx-auto h-[2px] bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="h-full bg-gradient-to-r from-transparent via-theme to-transparent opacity-60"
                />
            </div>
        </div>
    </div>
);

/**
 * PageLoader
 * Subtle loader for route transitions
 */
export const PageLoader = () => (
    <div className="w-full h-full min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-3xl bg-theme/5 border border-theme/10">
                <RefreshCw className="w-6 h-6 text-theme animate-spin" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-tertiary opacity-50">Loading Node</span>
        </div>
    </div>
);
