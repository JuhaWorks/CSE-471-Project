import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../store/useAuthStore';
import Button from '../ui/Button';

const DeadlinePopup = ({ projects, user }) => {
    const queryClient = useQueryClient();
    const [dismissing, setDismissing] = useState(false);
    const [hidden, setHidden] = useState(false);

    if (!user || !projects || projects.length === 0) return null;

    let alertInfo = null;
    for (const p of projects) {
        if (p.status === 'Completed' || p.status === 'Archived') continue;
        
        // Ensure user is manager
        const isManager = p.members.some(m => typeof m.userId === 'object' ? m.userId._id === user._id && m.role === 'Manager' : m.userId === user._id && m.role === 'Manager');
        if (!isManager) continue;

        const notif = p.deadlineNotified || {};
        const timeDiff = new Date(p.endDate).getTime() - new Date().getTime();
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

        // Has exceeded
        if (timeDiff < 0) {
            if (!notif.exceededDismissedBy?.includes(user._id)) {
                alertInfo = { project: p, type: 'exceeded' };
                break;
            }
        } 
        // Is approaching
        else if (timeDiff <= threeDaysMs) {
            if (!notif.approachingDismissedBy?.includes(user._id)) {
                alertInfo = { project: p, type: 'approaching' };
                break;
            }
        }
    }


    if (!alertInfo || hidden) return null;

    const handleDismiss = async () => {
        setDismissing(true);
        try {
            await api.post(`/projects/${alertInfo.project._id}/dismiss-alert`, { type: alertInfo.type });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            setHidden(true);
        } catch (err) {
            console.error(err);
        }
        setDismissing(false);
    };

    const isExceeded = alertInfo.type === 'exceeded';

    return (
        <AnimatePresence>
            {!hidden && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-[420px] px-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="w-full bg-surface/90 backdrop-blur-xl border border-default rounded-full py-2.5 px-3 shadow-xl flex items-center gap-3 overflow-hidden"
                    >
                        <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${isExceeded ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>
                            {isExceeded ? <Shield className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <p className="text-secondary text-xs truncate">
                                <strong className="text-primary tracking-tight mr-1">{alertInfo.project.name}</strong>
                                {isExceeded ? 'deadline exceeded.' : 'deadline approaching.'}
                            </p>
                        </div>
                        
                        <div className="flex gap-2 shrink-0 pr-1">
                            <button 
                                onClick={handleDismiss} 
                                disabled={dismissing}
                                className="text-[11px] font-semibold text-tertiary hover:text-primary transition-colors px-2 py-1.5 rounded-lg"
                            >
                                Dismiss
                            </button>
                            <Link 
                                to={`/projects/${alertInfo.project._id}/settings`}
                                onClick={() => setHidden(true)}
                                className="text-[11px] font-bold text-theme bg-theme/10 hover:bg-theme/20 transition-colors px-3 py-1.5 rounded-lg"
                            >
                                Manage
                            </Link>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default DeadlinePopup;
