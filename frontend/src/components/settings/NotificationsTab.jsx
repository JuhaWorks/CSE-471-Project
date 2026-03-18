import React, { useState } from 'react';
import { Bell, Mail, ShieldAlert, Zap, Info } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { motion } from 'framer-motion';

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
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Activity Tracking</h4>
                    <Card padding="p-0" className="overflow-hidden border-default">
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
                    </Card>
                </div>

                {/* System Section */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] ml-1">System Security</h4>
                    <Card padding="p-0" className="overflow-hidden border-default">
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
                    </Card>
                </div>
            </div>

            {/* Footer / Save */}
            <div className="pt-8 flex items-center justify-between border-t border-default">
                <div className="flex items-center gap-3">
                    <Info className="w-4 h-4 text-gray-700" />
                    <p className="text-[9px] font-black text-secondary uppercase tracking-widest max-w-[300px] leading-relaxed">
                        Some critical security notifications cannot be disabled for your account safety.
                    </p>
                </div>
                <Button className="px-12 py-5 rounded-2xl bg-amber-600 hover:bg-amber-500">
                    Save Preferences
                </Button>
            </div>
        </div>
    );
}

function NotificationItem({ title, desc, active, onToggle }) {
    return (
        <div className="flex items-center justify-between p-8 hover:bg-surface transition-colors group">
            <div className="space-y-1">
                <h5 className="text-sm font-black text-primary uppercase tracking-widest">{title}</h5>
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed">{desc}</p>
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
