import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Clock, ExternalLink, Archive, CheckCircle2, ShieldAlert, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useSocketStore } from '../../store/useSocketStore';
import { cn } from '../../utils/cn';
import { GlassSurface } from '../ui/Aesthetics';

const formatRelativeTime = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    if (diffInSeconds < 3600) return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
    if (diffInSeconds < 8400) return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const PRIORITY_STYLES = {
    Urgent: { 
        glow: 'shadow-[0_0_20px_rgba(239,68,68,0.2)]', 
        border: 'border-danger/30', 
        bg: 'bg-danger/10',
        text: 'text-danger',
        icon: ShieldAlert
    },
    High: { 
        glow: 'shadow-[0_0_15px_rgba(245,158,11,0.1)]', 
        border: 'border-amber-500/30', 
        bg: 'bg-amber-500/10',
        text: 'text-amber-500',
        icon: Zap
    },
    Medium: { 
        glow: '', 
        border: 'border-theme/20', 
        bg: 'bg-theme/5',
        text: 'text-theme',
        icon: Bell
    },
    Low: { 
        glow: '', 
        border: 'border-glass', 
        bg: 'bg-sunken',
        text: 'text-tertiary',
        icon: Clock
    }
};

const NotificationHistoryWidget = ({ className, limit = 5, variant = 'card' }) => {
    const isPlain = variant === 'plain';
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const { socket } = useSocketStore();

    const fetchNotifications = async () => {
        try {
            const { data } = await api.get(`/notifications?limit=${limit}`);
            setNotifications(data.data);
        } catch (error) {
            console.error("Failed to fetch notification history:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    useEffect(() => {
        if (socket) {
            const handleNew = (notify) => {
                setNotifications(prev => [notify, ...prev].slice(0, limit));
            };
            socket.on('newNotification', handleNew);
            return () => socket.off('newNotification', handleNew);
        }
    }, [socket]);

    const archiveNotification = async (id) => {
        try {
            await api.patch(`/notifications/${id}/archive`);
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (error) {
            console.error("Failed to archive notification:", error);
        }
    };

    return (
        <div className={cn("relative group", !isPlain && "p-6", className)}>
            {!isPlain && (
                <div className="absolute inset-0 z-0">
                    <GlassSurface width="100%" height="100%" borderRadius={32} backgroundOpacity={0.03} />
                </div>
            )}
            
            <div className={cn("relative z-10 flex flex-col h-full", !isPlain && "p-0")}>
                {!isPlain && (
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-theme/10 border border-theme/20 flex items-center justify-center">
                                <Zap className="w-4 h-4 text-theme" />
                            </div>
                            <div>
                                <h3 className="text-xs font-black text-primary uppercase tracking-widest leading-none">Intelligence Feed</h3>
                                <p className="text-[8px] font-black text-tertiary uppercase tracking-widest mt-1 opacity-40">Direct Telemetry</p>
                            </div>
                        </div>
                        <Link to="/settings?tab=notifications" className="p-2 rounded-lg hover:bg-white/5 text-tertiary transition-colors">
                            <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                )}

                <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
                        ))
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 opacity-20">
                            <Bell className="w-8 h-8 mb-2" />
                            <p className="text-[10px] font-black uppercase tracking-widest">No Alerts</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {notifications.map((n, i) => {
                                const style = PRIORITY_STYLES[n.priority] || PRIORITY_STYLES.Medium;
                                const Icon = style.icon;
                                
                                return (
                                    <motion.div
                                        key={n._id}
                                        layout
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: i * 0.05 }}
                                        className={cn(
                                            "relative p-4 rounded-2xl border bg-white/[0.02] group/item transition-all",
                                            style.border,
                                            style.glow,
                                            !n.isRead && "bg-white/[0.04]"
                                        )}
                                    >
                                        <div className="flex gap-3">
                                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", style.bg)}>
                                                <Icon className={cn("w-4 h-4", style.text)} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className={cn("text-[8px] font-black uppercase tracking-widest", style.text)}>
                                                        {n.priority} • {n.type}
                                                    </span>
                                                    <span className="text-[8px] font-bold text-tertiary">
                                                        {formatRelativeTime(new Date(n.createdAt))}
                                                    </span>
                                                </div>
                                                <h4 className="text-[11px] font-black text-primary leading-tight truncate">
                                                    {n.title}
                                                </h4>
                                                <p className="text-[10px] text-tertiary mt-1 line-clamp-1 leading-normal">
                                                    {n.message}
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => archiveNotification(n._id)}
                                                className="opacity-0 group-hover/item:opacity-100 p-2 text-tertiary hover:text-danger hover:bg-danger/10 rounded-lg transition-all shrink-0"
                                            >
                                                <Archive className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        
                                        {n.link && (
                                            <Link to={n.link} className="absolute inset-0 z-0" />
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    ) }
                </div>

                {!isPlain && (
                    <div className="mt-4 pt-4 border-t border-glass flex items-center justify-center">
                        <Link to="/" className="text-[9px] font-black text-theme hover:underline uppercase tracking-[0.2em]">
                            View Full History
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationHistoryWidget;
