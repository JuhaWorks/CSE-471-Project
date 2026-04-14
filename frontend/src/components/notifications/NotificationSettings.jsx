import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Mail, Clock, Shield, Moon, Zap, Save, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';
import { useAuthStore } from '../../store/useAuthStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const NotificationSettings = () => {
    const { user, setUser } = useAuthStore();
    const [prefs, setPrefs] = useState(user?.notificationPrefs || {
        email: true,
        inApp: true,
        categories: { assignments: true, mentions: true, deadlines: true, statusUpdates: true },
        frequency: 'instant',
        quietHours: { enabled: false, start: '22:00', end: '08:00', timezone: 'UTC' }
    });
    const [saving, setSaving] = useState(false);

    const handleToggle = (key, path = null) => {
        setPrefs(prev => {
            if (path) {
                return { ...prev, [path]: { ...prev[path], [key]: !prev[path][key] } };
            }
            return { ...prev, [key]: !prev[key] };
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { data } = await api.put('/notifications/preferences', prefs);
            setUser({ ...user, notificationPrefs: data.data });
            toast.success("Notification preferences updated");
        } catch (error) {
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter">Notification Control</h2>
                    <p className="text-tertiary font-bold mt-1">Manage focus, delivery frequency, and quiet hours.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-3 bg-theme text-black font-black rounded-2xl flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50 active:scale-95"
                >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Global Channels */}
                <div className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-theme/10 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-theme" />
                        </div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">Main Channels</h3>
                    </div>

                    <div className="space-y-4">
                        <ChannelToggle 
                            icon={Bell} 
                            label="In-App Notifications" 
                            desc="Real-time alerts and inbox updates" 
                            active={prefs.inApp} 
                            onToggle={() => handleToggle('inApp')} 
                        />
                        <ChannelToggle 
                            icon={Mail} 
                            label="Email Notifications" 
                            desc="Assignment and mention alerts via mail" 
                            active={prefs.email} 
                            onToggle={() => handleToggle('email')} 
                        />
                    </div>
                </div>

                {/* 2. Delivery Frequency (BATCHING) */}
                <div className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-amber-500" />
                        </div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">Delivery Frequency</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <FreqButton 
                            active={prefs.frequency === 'instant'} 
                            onClick={() => setPrefs({...prefs, frequency: 'instant'})}
                            label="Instant"
                            desc="Get notified as it happens"
                        />
                        <FreqButton 
                            active={prefs.frequency === 'digest'} 
                            onClick={() => setPrefs({...prefs, frequency: 'digest'})}
                            label="Batching"
                            desc="Daily digest of activity"
                        />
                    </div>
                    <p className="text-[10px] text-tertiary font-bold px-2 italic">Note: Mentions and urgent deadlines always bypass batching.</p>
                </div>

                {/* 3. Quiet Hours */}
                <div className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 space-y-6 md:col-span-1">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                                <Moon className="w-5 h-5 text-indigo-500" />
                            </div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">Quiet Hours</h3>
                        </div>
                        <Switch 
                            enabled={prefs.quietHours.enabled} 
                            onChange={() => handleToggle('enabled', 'quietHours')} 
                        />
                    </div>

                    <div className={twMerge(clsx("space-y-4 transition-all", !prefs.quietHours.enabled && "opacity-30 pointer-events-none scale-95 origin-top"))}>
                        <div className="grid grid-cols-2 gap-4">
                            <TimeInput 
                                label="From" 
                                value={prefs.quietHours.start} 
                                onChange={(val) => setPrefs({...prefs, quietHours: {...prefs.quietHours, start: val}})} 
                            />
                            <TimeInput 
                                label="To" 
                                value={prefs.quietHours.end} 
                                onChange={(val) => setPrefs({...prefs, quietHours: {...prefs.quietHours, end: val}})} 
                            />
                        </div>
                        <p className="text-xs text-tertiary font-bold">Email notifications will be held during this window.</p>
                    </div>
                </div>

                {/* 4. Filter Categories */}
                <div className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 space-y-6 md:col-span-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-rose-500" />
                        </div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">Topic Alerts</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                        <CategoryToggle label="Assignments" active={prefs.categories.assignments} onToggle={() => handleToggle('assignments', 'categories')} />
                        <CategoryToggle label="Mentions (@)" active={prefs.categories.mentions} onToggle={() => handleToggle('mentions', 'categories')} />
                        <CategoryToggle label="Deadlines" active={prefs.categories.deadlines} onToggle={() => handleToggle('deadlines', 'categories')} />
                        <CategoryToggle label="Status Updates" active={prefs.categories.statusUpdates} onToggle={() => handleToggle('statusUpdates', 'categories')} />
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Sub-components ---

const ChannelToggle = ({ icon: Icon, label, desc, active, onToggle }) => (
    <button 
        onClick={onToggle}
        className={twMerge(clsx(
            "w-full flex items-center justify-between p-4 rounded-2xl border transition-all",
            active ? "bg-white/10 border-white/10" : "bg-transparent border-white/5 opacity-50"
        ))}
    >
        <div className="flex items-center gap-4">
            <Icon className={twMerge(clsx("w-5 h-5", active ? "text-theme" : "text-tertiary"))} />
            <div className="text-left">
                <p className="text-sm font-black text-white leading-none">{label}</p>
                <p className="text-[10px] text-tertiary font-bold mt-1 line-clamp-1">{desc}</p>
            </div>
        </div>
        <Switch enabled={active} onChange={onToggle} />
    </button>
);

const FreqButton = ({ active, onClick, label, desc }) => (
    <button 
        onClick={onClick}
        className={twMerge(clsx(
            "flex flex-col items-center justify-center p-5 rounded-3xl border transition-all text-center",
            active ? "bg-theme/10 border-theme/40" : "bg-white/5 border-white/5 opacity-60 hover:opacity-100"
        ))}
    >
        <span className={twMerge(clsx("text-sm font-black uppercase tracking-widest", active ? "text-theme" : "text-white"))}>{label}</span>
        <span className="text-[9px] text-tertiary font-bold mt-1 uppercase tracking-tighter">{desc}</span>
    </button>
);

const TimeInput = ({ label, value, onChange }) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-black text-tertiary uppercase tracking-widest ml-1">{label}</label>
        <input 
            type="time" 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-sunken border border-white/5 text-sm font-black text-white outline-none focus:border-theme/30 transition-all"
        />
    </div>
);

const CategoryToggle = ({ label, active, onToggle }) => (
    <div className="flex items-center justify-between group cursor-pointer" onClick={onToggle}>
        <span className={twMerge(clsx("text-xs font-bold transition-colors", active ? "text-white" : "text-tertiary"))}>{label}</span>
        <Switch enabled={active} onChange={onToggle} small />
    </div>
);

const Switch = ({ enabled, onChange, small = false }) => (
    <div 
        onClick={(e) => { e.stopPropagation(); onChange(); }}
        className={twMerge(clsx(
            "rounded-full transition-all cursor-pointer relative shrink-0",
            small ? "w-8 h-4.5" : "w-12 h-7",
            enabled ? "bg-theme" : "bg-white/10"
        ))}
    >
        <div className={twMerge(clsx(
            "absolute top-1/2 -translate-y-1/2 rounded-full bg-white transition-all shadow-lg",
            small ? "w-3 h-3" : "w-5 h-5",
            enabled ? (small ? "left-[calc(100%-15px)]" : "left-[calc(100%-24px)]") : "left-1"
        ))} />
    </div>
);

export default NotificationSettings;
