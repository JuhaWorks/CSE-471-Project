import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Rocket, Info, Calendar } from 'lucide-react';
import Card from '../ui/Card';
import { Skeleton } from '../ui/Loading';

/**
 * Modern 2026 APOD Widget
 * Glassmorphism 2.0, Performance-first, 24h caching
 */

const FALLBACK = {
    title: 'The Pillars of Creation',
    explanation: 'The cosmos is within us. We are made of star-stuff. We are a way for the universe to know itself.',
    url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600&auto=format&fit=crop&q=80',
    media_type: 'image',
};

const ApodWidget = () => {
    const { data: apod, isLoading: apodLoading, isError } = useQuery({
        queryKey: ['apod'],
        queryFn: async () => {
            const apiKey = import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY';
            const res = await axios.get('https://api.nasa.gov/planetary/apod', {
                params: { api_key: apiKey, thumbs: true },
                timeout: 10000,
            });
            return res.data;
        },
        staleTime: 1000 * 60 * 60 * 24,
        retry: 2,
    });

    const display = isError || !apod ? FALLBACK : apod;
    const imgSrc = display.media_type === 'video'
        ? (display.thumbnail_url || FALLBACK.url)
        : (display.url || FALLBACK.url);

    return (
        <Card className="group h-full min-h-[300px] overflow-hidden" padding="p-0">
            <div className="absolute top-4 left-4 z-20 flex gap-2">
                <div className="px-3 py-1.5 rounded-xl glass-2 bg-black/40 backdrop-blur-md border-white/10 flex items-center gap-2">
                    <Rocket className="w-3 h-3 text-cyan-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Inspiration</span>
                </div>
            </div>

            <div className="relative h-full flex flex-col">
                {apodLoading ? (
                    <Skeleton className="w-full h-full" />
                ) : (
                    <>
                        <motion.img
                            initial={{ scale: 1.1, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            src={imgSrc}
                            alt={display.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                            onError={(e) => { e.target.src = FALLBACK.url; }}
                        />
                        
                        {/* 2026 Cinematic Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/20 to-transparent pointer-events-none" />
                        
                        <div className="absolute inset-0 p-8 flex flex-col justify-end">
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="space-y-3"
                            >
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Calendar className="w-3 h-3" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Temporal Log: {new Date().toLocaleDateString()}</span>
                                </div>
                                
                                <h3 className="text-xl font-black text-white tracking-tighter leading-tight">
                                    {display.title}
                                </h3>
                                
                                <p className="text-xs font-medium text-gray-400 line-clamp-2 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                    "{display.explanation}"
                                </p>
                                
                                <div className="pt-2 flex items-center gap-4">
                                    <div className="h-px flex-1 bg-white/10" />
                                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest shrink-0">NASA Segment</span>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </div>
        </Card>
    );
};

export default ApodWidget;
