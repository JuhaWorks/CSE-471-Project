import React, { useState } from 'react';
import { Bell, Mail, ShieldAlert, Zap, Info, RefreshCw } from 'lucide-react';
import { useAuthStore, api } from '../../store/useAuthStore';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { motion } from 'framer-motion';
import GlassSurface from '../ui/GlassSurface';
import { toast } from 'react-hot-toast';
import { cn } from '../../utils/cn';

/**
 * NotificationsTab
 * Personalized notification orchestration.
 */
export default function NotificationsTab() {
    const { user, setUser } = useAuthStore();
    const [saving, setSaving] = useState(false);
    
    // Bind to actual user preferences from the store
    const [prefs, setPrefs] = useState({
        email: user?.notificationPrefs?.email ?? true,
        inApp: user?.notificationPrefs?.inApp ?? true,
        // Map backend categories to local flat state for the UI
        mentions: user?.notificationPrefs?.categories?.mentions ?? true,
        assignments: user?.notificationPrefs?.categories?.assignments ?? true,
        comments: user?.notificationPrefs?.categories?.comments ?? true,
        security: user?.notificationPrefs?.categories?.security ?? true,
        updates: user?.notificationPrefs?.categories?.updates ?? true,
    });

    const togglePref = (key) => {
        setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Reconstruct the nested schema for the backend
            const payload = {
                email: prefs.email,
                inApp: prefs.inApp,
                categories: {
                    mentions: prefs.mentions,
                    assignments: prefs.assignments,
                    comments: prefs.comments,
                    security: prefs.security,
                    updates: prefs.updates,
                    deadlines: user?.notificationPrefs?.categories?.deadlines ?? true,
                    statusUpdates: user?.notificationPrefs?.categories?.statusUpdates ?? true
                }
            };
            
            const { data } = await api.put('/notifications/preferences', payload);
            setUser({ ...user, notificationPrefs: data.data });
            toast.success("Preferences saved successfully");
        } catch (error) {
            toast.error("Failed to synchronize preferences");
            console.error(error);
        } finally {
            setSaving(false);
        }
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
                {/* 0. Communication Channels (Email System) */}
                <div className="relative overflow-hidden border border-amber-500/20 rounded-xl group bg-amber-500/[0.02]">
                    <div className="absolute inset-0 z-0">
                        <GlassSurface width="100%" height="100%" borderRadius={12} displace={0.5} distortionScale={-60} backgroundOpacity={0.06} opacity={0.93} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 px-8 py-5">
                            <div className="w-7 h-7 rounded-md flex items-center justify-center bg-amber-500/10 border border-amber-500/20">
                                <Mail size={13} className="text-amber-500" />
                            </div>
                            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-amber-500 font-bold">
                                Communication Channels
                            </span>
                        </div>
                        <div className="relative h-px bg-amber-500/10" />

                        <NotificationItem 
                            title="Global Email System" 
                            desc="Receive updates, digests, and mentions via email. High priority alerts bypass this."
                            active={prefs.email}
                            onToggle={() => togglePref('email')}
                        />
                    </div>
                </div>

                {/* 1. Activity Section */}
                <div className={cn("relative overflow-hidden border border-default rounded-xl group transition-opacity", !prefs.email && "opacity-60")}>
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
                                active={prefs.mentions}
                                onToggle={() => togglePref('mentions')}
                            />
                            <NotificationItem 
                                title="Task Assignments" 
                                desc="Get notified when tasks are assigned or updated."
                                active={prefs.assignments}
                                onToggle={() => togglePref('assignments')}
                            />
                            <NotificationItem 
                                title="Comments on Work" 
                                desc="Feedback and annotations on files you own."
                                active={prefs.comments}
                                onToggle={() => togglePref('comments')}
                            />
                        </div>
                    </div>
                </div>

                {/* 2. System Section */}
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
                                active={prefs.security}
                                onToggle={() => togglePref('security')}
                            />
                            <NotificationItem 
                                title="Platform Updates" 
                                desc="New features, platform announcements, and releases."
                                active={prefs.updates}
                                onToggle={() => togglePref('updates')}
                            />
                        </div>
                    </div>
                </div>

            </div>

            {/* Footer / Save */}
            <div className="pt-8 flex items-center justify-between border-t border-default gap-4 pb-12">
                <div className="flex items-center gap-2">
                    <Info size={12} className="text-disabled shrink-0" />
                    <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-disabled max-w-[300px]">
                        Some critical security notifications cannot be disabled for your account safety.
                    </span>
                </div>
                <Button 
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-black uppercase tracking-widest shrink-0 shadow-lg shadow-amber-600/20 active:scale-95 transition-all flex items-center gap-2"
                >
                    {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    {saving ? 'Saving...' : 'Save Preferences'}
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
