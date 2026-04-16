import { useQuery } from '@tanstack/react-query';
import { api } from '../../../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Info, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import Card from '../../ui/Card';
import { Skeleton } from '../../ui/PremiumLoaders';
import { useState, memo } from 'react';

/**
 * Modern 2026 APOD Widget - Compact Command Center Edition
 * Optimized for Sidebar | Snappy Explanations | Minimized Footprint
 */

const ApodWidget = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const { data: apodData, isLoading, isError } = useQuery({
        queryKey: ['apod'],
        queryFn: async () => {
            const res = await api.get('/tools/apod');
            return res.data.data;
        },
        staleTime: 1000 * 60 * 60 * 6, // 6h cache to match backend
        retry: 1,
        refetchOnWindowFocus: false,
    });

    const display = isError || !apodData ? {
        title: 'System Insight',
        explanation: 'Waiting for NASA telemetry...',
        author: 'System',
        url: `https://picsum.photos/seed/system/600/400`,
        date: new Date().toISOString().split('T')[0],
    } : apodData;

    if (isLoading) {
        return (
            <Card variant="glass" compact padding="p-0" className="overflow-hidden min-h-[160px]">
                <Skeleton className="h-[100px] w-full" noBorder />
                <div className="p-4 space-y-2">
                    <Skeleton className="h-3 w-1/2" opacity={0.3} />
                    <Skeleton className="h-2 w-full" opacity={0.1} />
                </div>
            </Card>
        );
    }

    return (
        <Card 
            variant="glass" 
            compact 
            padding="p-0" 
            className="group overflow-hidden flex flex-col transition-all duration-500 bg-cyan-500/[0.02]"
        >
            {/* Header Badge */}
            <div className="absolute top-3 left-3 z-30">
                <div className="px-2 py-1 rounded-lg glass-2 bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-2">
                    <Rocket className="w-2.5 h-2.5 text-cyan-400" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/80">NASA APOD</span>
                </div>
            </div>

            {/* Image Aperture - Significantly Slimmer */}
            <div className="relative h-[110px] shrink-0 overflow-hidden bg-sunken">
                <img
                    src={display.url}
                    alt={display.title}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <h3 className="absolute bottom-3 left-4 right-4 text-[13px] font-black text-white tracking-tight leading-tight line-clamp-2">
                    {display.title}
                </h3>
            </div>

            {/* Content Section - Compact Quick-View */}
            <div className="px-5 py-4 flex flex-col gap-2 bg-surface/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-tertiary opacity-40">
                        <Calendar className="w-2.5 h-2.5" />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em]">{display.date}</span>
                    </div>
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1 rounded-md bg-sunken border border-glass hover:text-cyan-400 transition-all flex items-center gap-1.5"
                    >
                        <span className="text-[7px] font-black uppercase tracking-widest px-1">Details</span>
                        {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                    </button>
                </div>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-2 border-t border-glass mt-2">
                                <p className="text-[11px] font-medium text-secondary leading-relaxed pl-3 border-l border-cyan-500/30">
                                    {display.explanation}
                                </p>
                                {display.author && (
                                    <p className="text-[8px] font-black text-tertiary uppercase tracking-widest mt-3 text-right italic opacity-40">
                                        — {display.author}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {!isExpanded && (
                    <div className="pt-1 flex items-center gap-4 opacity-20 pointer-events-none">
                        <div className="h-px flex-1 bg-glass" />
                        <span className="text-[7px] font-black uppercase tracking-[0.3em]">Operational Update Complete</span>
                        <div className="h-px flex-1 bg-glass" />
                    </div>
                )}
            </div>
        </Card>
    );
};

export default memo(ApodWidget);
