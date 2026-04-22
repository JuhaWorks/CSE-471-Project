import { useQuery } from '@tanstack/react-query';
import { api } from '../../../store/useAuthStore';
import { Calendar, Rocket } from 'lucide-react';
import { Card } from '../../ui/BaseUI';
import { Skeleton } from '../../ui/Loaders';
import { memo } from 'react';

/**
 * Modern 2026 APOD Widget - Grand Editorial Edition
 * Fills dashboard whitespace gorgeously with NASA imagery.
 */

const ApodWidget = () => {

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
            className="relative group border-none overflow-hidden flex flex-col transition-all duration-500 bg-cyan-500/[0.02]"
        >
            {/* Header Badge */}
            <div className="absolute top-3 left-3 z-30">
                <div className="px-2 py-1 rounded-lg glass-2 bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-2">
                    <Rocket className="w-2.5 h-2.5 text-cyan-400" />
                </div>
            </div>

            {/* Image Aperture - Grand Visual Intelligence */}
            <div className="relative h-[250px] sm:h-[350px] lg:h-[450px] shrink-0 overflow-hidden bg-sunken">
                <img
                    src={display.url}
                    alt={display.title}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tighter leading-tight drop-shadow-xl">
                        {display.title}
                    </h3>
                    <div className="flex items-center gap-2 text-white/60 mt-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{display.date}</span>
                    </div>
                </div>
            </div>

            {/* Content Section - Professional Briefing */}
            <div className="px-6 py-5 flex flex-col gap-2 bg-surface">
                <p className="text-[13px] sm:text-[14px] font-medium text-secondary leading-relaxed pl-4 border-l-2 border-cyan-500/40">
                    {display.explanation}
                </p>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-glass">
                    {display.author ? (
                        <p className="text-[9px] font-black text-tertiary uppercase tracking-widest italic opacity-60">
                            Captured by: {display.author}
                        </p>
                    ) : <div />}
                    
                    <div className="flex items-center gap-3 opacity-40">
                        <span className="text-[8px] font-black uppercase tracking-[0.3em]">Operational Update Complete</span>
                        <div className="w-12 h-px bg-glass" />
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default memo(ApodWidget);
