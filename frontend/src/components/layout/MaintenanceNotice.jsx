import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Zap, Cpu, Lock } from 'lucide-react';
import { api, useAuthStore } from '../../store/useAuthStore';
import { useSocketStore } from '../../store/useSocketStore';

/**
 * Hook: Manages high-precision system status and clock synchronization
 */
const useSystemStability = () => {
    const queryClient = useQueryClient();
    const { socket } = useSocketStore();
    const [timeLeft, setTimeLeft] = useState(0);
    const [serverOffset, setServerOffset] = useState(0);

    const { data: statusRes } = useQuery({
        queryKey: ['systemStatus'],
        queryFn: async () => {
            const start = Date.now();
            const response = (await api.get('/admin/system/status')).data;
            // Calculate latency and clock skew
            const serverTime = new Date(response.timestamp || Date.now()).getTime();
            setServerOffset(serverTime - (start + (Date.now() - start) / 2));
            return response;
        },
        refetchInterval: (query) => (query.state.data?.data?.isMaintenance ? 15000 : 60000),
        staleTime: 5000,
    });

    const status = statusRes?.data;
    const isMaintenance = !!status?.isMaintenance;
    const endTime = status?.endTime ? new Date(status.endTime).getTime() : null;

    // Real-time synchronization via WebSockets
    useEffect(() => {
        if (!socket) return;
        const sync = () => queryClient.invalidateQueries({ queryKey: ['systemStatus'] });

        socket.on('maintenance:start', sync);
        socket.on('maintenance:end', () => {
            sync();
            setTimeout(() => window.location.reload(), 1000);
        });

        return () => {
            socket.off('maintenance:start');
            socket.off('maintenance:end');
        };
    }, [socket, queryClient]);

    // High-precision ticker
    useEffect(() => {
        if (!endTime || !isMaintenance) return;

        const updateTimer = () => {
            const adjustedNow = Date.now() + serverOffset;
            const diff = endTime - adjustedNow;

            if (diff <= 0) {
                setTimeLeft(0);
                queryClient.invalidateQueries({ queryKey: ['systemStatus'] });
            } else {
                setTimeLeft(diff);
            }
        };

        const timer = setInterval(updateTimer, 1000);
        updateTimer();
        return () => clearInterval(timer);
    }, [endTime, isMaintenance, serverOffset, queryClient]);

    return { isMaintenance, timeLeft, status };
};

const MaintenanceNotice = () => {
    const { user } = useAuthStore();
    const location = useLocation();
    const { isMaintenance, timeLeft } = useSystemStability();

    const isAdmin = user?.role === 'Admin';
    const isAuthPath = useMemo(() =>
        ['/login', '/register', '/verify-email'].some(p => location.pathname.startsWith(p)),
        [location.pathname]);

    // Prevent scrolling when maintenance is active for users
    useEffect(() => {
        if (isMaintenance && !isAdmin && !isAuthPath) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isMaintenance, isAdmin, isAuthPath]);

    if (!isMaintenance || isAuthPath) return null;

    const formatCountdown = (ms) => {
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        return `${h > 0 ? `${h}h ` : ''}${m}m ${s}s`;
    };

    return (
        <AnimatePresence>
            {isAdmin ? (
                /* ADVANDED ADMIN BANNER */
                <motion.div
                    initial={{ y: -100 }}
                    animate={{ y: 0 }}
                    exit={{ y: -100 }}
                    className="fixed top-0 left-0 right-0 z-[10001] h-12 bg-black border-b border-emerald-500/30 backdrop-blur-md flex items-center px-6"
                >
                    <div className="flex items-center gap-6 w-full max-w-7xl mx-auto">
                        <div className="flex items-center gap-2 text-emerald-500">
                            <Cpu size={16} className="animate-spin-slow" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Maintenance Mode Enabled</span>
                        </div>
                        <div className="h-4 w-px bg-white/10" />
                        <span className="text-[9px] text-gray-400 font-bold uppercase italic">Global Restricted Access</span>
                        <div className="ml-auto flex items-center gap-4">
                            {timeLeft > 0 && (
                                <div className="text-[10px] font-mono text-emerald-500/80 bg-emerald-500/5 px-3 py-1 rounded-full border border-emerald-500/10">
                                    EST: {formatCountdown(timeLeft)}
                                </div>
                            )}
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500 text-black text-[9px] font-black uppercase">
                                <Lock size={10} /> Admin Session
                            </div>
                        </div>
                    </div>
                </motion.div>
            ) : (
                /* ADVANCED USER OVERLAY */
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[10000] bg-[#020202] flex items-center justify-center p-8 overflow-hidden"
                >
                    {/* Animated Grid Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

                    <div className="relative flex flex-col items-center max-w-2xl w-full">
                        <motion.div
                            animate={{
                                scale: [1, 1.05, 1],
                                opacity: [0.5, 1, 0.5]
                            }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="absolute -top-24 w-64 h-64 bg-emerald-500/20 blur-[100px] rounded-full"
                        />

                        <div className="relative z-10 space-y-12 text-center">
                            <div className="flex flex-col items-center space-y-4">
                                <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                                    <ShieldAlert size={48} className="text-emerald-500" />
                                </div>
                                <h1 className="text-6xl md:text-8xl font-black text-white tracking-[calc(-0.05em)]">
                                    CORE<span className="text-emerald-500">.</span>UPDATE
                                </h1>
                            </div>

                            <p className="text-gray-400 text-lg md:text-xl font-medium max-w-md mx-auto leading-relaxed opacity-80">
                                Infrastructure maintenance in progress. We are hardening the core systems for better performance.
                            </p>

                            {timeLeft > 0 && (
                                <div className="grid grid-cols-1 gap-2 pt-4">
                                    <span className="text-[10px] font-black text-emerald-500/40 uppercase tracking-[0.4em]">Expected Restoration</span>
                                    <div className="text-5xl md:text-6xl font-mono font-bold text-white tabular-nums tracking-tighter">
                                        {formatCountdown(timeLeft)}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col items-center gap-8 pt-12">
                                <div className="w-48 h-1 bg-white/[0.03] rounded-full overflow-hidden relative">
                                    <motion.div
                                        animate={{ x: [-200, 200] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"
                                    />
                                </div>
                                <div className="flex items-center gap-4 text-[9px] font-bold text-gray-600 uppercase tracking-[0.3em]">
                                    <span className="p-1 rounded bg-gray-800">Node_01</span>
                                    <span className="p-1 rounded bg-gray-800">Primary_DB</span>
                                    <span className="p-1 rounded bg-emerald-500/20 text-emerald-500">Synchronizing</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MaintenanceNotice;