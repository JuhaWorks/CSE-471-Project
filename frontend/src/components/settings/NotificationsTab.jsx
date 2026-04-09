import React, { useState } from 'react';
import { Bell, Mail, ShieldAlert, Zap, Info } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { motion } from 'framer-motion';
import GlassSurface from '../ui/GlassSurface';

/**
 * NotificationsTab
 * Personalized notification orchestration.
 */
export default function NotificationsTab() {
    const { user } = useAuthStore();
    
    // Mock state for now as billing isn't implemented
    const [preferences, setPreferences] = useState({
        mentions: true,
        assignments: true,
        comments: false,
        security: true,
        updates: true,
    });

    const togglePref = (key) => {
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-default">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black text-primary tracking-tighter uppercase">Notifications <span className="text-amber-400">Hub.</span></h2>
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Configure how you receive updates</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">System Active</span>
                </div>
            </div>

            <div className="space-y-8">
                {/* Activity Section */}
                <div className="relative overflow-hidden border border-default rounded-xl group">
                    <div className="absolute inset-0 z-0">
                        <GlassSurface width="100%" height="100%" borderRadius={12} displace={0.5} distortionScale={-60} backgroundOpacity={0.06} opacity={0.93} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 px-8 py-5">
                            <div className="w-7 h-7 rounded-md flex items-center justify-center bg-surface border border-default">
                                <Bell size={13} className="text-tertiary" />
                            </div>
                            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-secondary font-semibold">
                                Activity Tracking
                            </span>
                        </div>
                        <div className="relative h-px bg-surface" />

                        <div className="divide-y divide-white/5">
                            <NotificationItem 
                                title="Mentions & Replies" 
                                desc="Direct alerts when someone mentions or replies to you."
                                active={preferences.mentions}
                                onToggle={() => togglePref('mentions')}
                            />
                            <NotificationItem 
                                title="Task Assignments" 
                                desc="Get notified when tasks are assigned or updated."
                                active={preferences.assignments}
                                onToggle={() => togglePref('assignments')}
                            />
                            <NotificationItem 
                                title="Comments on Work" 
                                desc="Feedback and annotations on files you own."
                                active={preferences.comments}
                                onToggle={() => togglePref('comments')}
                            />
                        </div>
                    </div>
                </div>

                {/* System Section */}
                <div className="relative overflow-hidden border border-default rounded-xl group">
                    <div className="absolute inset-0 z-0">
                        <GlassSurface width="100%" height="100%" borderRadius={12} displace={0.5} distortionScale={-60} backgroundOpacity={0.06} opacity={0.93} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 px-8 py-5">
                            <div className="w-7 h-7 rounded-md flex items-center justify-center bg-surface border border-default">
                                <ShieldAlert size={13} className="text-tertiary" />
                            </div>
                            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-secondary font-semibold">
                                System Security
                            </span>
                        </div>
                        <div className="relative h-px bg-surface" />

                        <div className="divide-y divide-white/5">
                            <NotificationItem 
                                title="Security Alerts" 
                                desc="Sign-ins from new devices or suspicious locations."
                                active={preferences.security}
                                onToggle={() => togglePref('security')}
                            />
                            <NotificationItem 
                                title="Platform Updates" 
                                desc="New features, platform announcements, and releases."
                                active={preferences.updates}
                                onToggle={() => togglePref('updates')}
                            />
                        </div>
                    </div>
                </div>

            </div>

            {/* Footer / Save */}
            <div className="pt-8 flex items-center justify-between border-t border-default gap-4">
                <div className="flex items-center gap-2">
                    <Info size={12} className="text-disabled shrink-0" />
                    <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-disabled max-w-[300px]">
                        Some critical security notifications cannot be disabled for your account safety.
                    </span>
                </div>
                <Button className="px-6 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold tracking-wide shrink-0">
                    Save Preferences
                </Button>
            </div>

        </div>
    );
}

function NotificationItem({ title, desc, active, onToggle }) {
    return (
        <div className="flex items-center justify-between px-8 py-6 hover:bg-surface transition-colors group">
            <div className="space-y-1">
                <h5 className="text-[13px] font-black text-primary uppercase tracking-widest">{title}</h5>
                <p className="text-[11px] text-tertiary font-medium leading-relaxed">{desc}</p>
            </div>

            <button 
                onClick={onToggle}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${active ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-elevated'}`}
            >
                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-elevated shadow-sm transition-transform duration-300 ${active ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
        </div>
    );
}
