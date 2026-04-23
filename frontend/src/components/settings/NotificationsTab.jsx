import React, { useState, useEffect } from 'react';
import { Bell, Mail, ShieldAlert, Zap, Info, RefreshCw } from 'lucide-react';
import { useAuthStore, api } from '../../store/useAuthStore';
import { Button, Card } from '../ui/BaseUI';
import { motion } from 'framer-motion';
import { GlassSurface } from '../ui/Aesthetics';
import { toast } from 'react-hot-toast';
import { cn } from '../../utils/cn';

/**
 * NotificationsTab
 * Personalized notification orchestration.
 */
export default function NotificationsTab() {
    const { user, setUser } = useAuthStore();
    const [saving, setSaving] = useState(false);
    
    // Normalization helper to bridge legacy boolean prefs to new granular object schema
    const normalizeCategory = (cat) => {
        if (typeof cat === 'object' && cat !== null) return { 
            email: cat.email ?? true, 
            inApp: cat.inApp ?? true,
            push: cat.push ?? true 
        };
        const val = typeof cat === 'boolean' ? cat : true;
        return { email: val, inApp: val, push: val };
    };

    // Bind to the new granular schema
    const [prefs, setPrefs] = useState({
        email: user?.notificationPrefs?.email ?? true,
        inApp: user?.notificationPrefs?.inApp ?? true,
        frequency: user?.notificationPrefs?.frequency ?? 'instant',
        quietHours: {
            enabled: user?.notificationPrefs?.quietHours?.enabled ?? false,
            start: user?.notificationPrefs?.quietHours?.start ?? '22:00',
            end: user?.notificationPrefs?.quietHours?.end ?? '08:00'
        },
        categories: {
            mentions: normalizeCategory(user?.notificationPrefs?.categories?.mentions),
            assignments: normalizeCategory(user?.notificationPrefs?.categories?.assignments),
            deadlines: normalizeCategory(user?.notificationPrefs?.categories?.deadlines),
            comments: normalizeCategory(user?.notificationPrefs?.categories?.comments),
            messages: normalizeCategory(user?.notificationPrefs?.categories?.messages),
            security: normalizeCategory(user?.notificationPrefs?.categories?.security),
            statusUpdates: normalizeCategory(user?.notificationPrefs?.categories?.statusUpdates),
            updates: normalizeCategory(user?.notificationPrefs?.categories?.updates),
        }
    });

    // Sync state if user object updates from elsewhere
    useEffect(() => {
        if (user?.notificationPrefs) {
            setPrefs({
                email: user.notificationPrefs.email ?? true,
                inApp: user.notificationPrefs.inApp ?? true,
                frequency: user.notificationPrefs.frequency ?? 'instant',
                quietHours: {
                    enabled: user.notificationPrefs.quietHours?.enabled ?? false,
                    start: user.notificationPrefs.quietHours?.start ?? '22:00',
                    end: user.notificationPrefs.quietHours?.end ?? '08:00'
                },
                categories: {
                    mentions: normalizeCategory(user.notificationPrefs.categories?.mentions),
                    assignments: normalizeCategory(user.notificationPrefs.categories?.assignments),
                    deadlines: normalizeCategory(user.notificationPrefs.categories?.deadlines),
                    comments: normalizeCategory(user.notificationPrefs.categories?.comments),
                    messages: normalizeCategory(user.notificationPrefs.categories?.messages),
                    security: normalizeCategory(user.notificationPrefs.categories?.security),
                    statusUpdates: normalizeCategory(user.notificationPrefs.categories?.statusUpdates),
                    updates: normalizeCategory(user.notificationPrefs.categories?.updates),
                }
            });
        }
    }, [user?.notificationPrefs]);

    const toggleChannel = (category, channel) => {
        setPrefs(prev => {
            const currentCat = prev.categories[category];
            return {
                ...prev,
                categories: {
                    ...prev.categories,
                    [category]: {
                        ...currentCat,
                        [channel]: !currentCat[channel]
                    }
                }
            };
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Note: Route mapping fix - ensure we use the global notification preferences endpoint
            const { data } = await api.put('/notifications/preferences', prefs);
            setUser({ ...user, notificationPrefs: data.data });
            toast.success("Command Center updated successfully");
        } catch (error) {
            toast.error("Failed to sync preferences");
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const runTest = async (type) => {
        toast(`Sending test ${type}...`, { icon: '🚀' });
        try {
            await api.post('/notifications/test', { type });
            toast.success(`Test ${type} dispatched`);
        } catch (e) {
            toast.error(`Test ${type} failed`);
        }
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-default">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black text-primary tracking-tighter uppercase">Command <span className="text-amber-400">Center.</span></h2>
                    <p className="text-[10px] font-black text-tertiary uppercase tracking-[0.3em]">Advanced communication orchestration</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                        <Bell className="w-4 h-4 text-amber-400" />
                        <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Active</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* Left: Global & Schedule */}
                <div className="xl:col-span-1 space-y-6">
                    {/* Master Switches */}
                    <SectionContainer title="Master Overrides" icon={<ShieldAlert size={14} className="text-amber-400"/>}>
                        <div className="p-6 space-y-6">
                            <MasterSwitch 
                                label="Primary Email System" 
                                active={prefs.email} 
                                onToggle={() => setPrefs(p => ({...p, email: !p.email}))}
                                icon={<Mail size={14} />}
                            />
                            <MasterSwitch 
                                label="In-App Push Feed" 
                                active={prefs.inApp} 
                                onToggle={() => setPrefs(p => ({...p, inApp: !p.inApp}))}
                                icon={<Zap size={14} />}
                            />
                        </div>
                    </SectionContainer>

                    {/* Schedule */}
                    <SectionContainer title="Delivery Schedule" icon={<RefreshCw size={14} className="text-blue-400"/>}>
                        <div className="p-6 space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-tertiary uppercase tracking-widest">Notification Frequency</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['instant', 'digest'].map(f => (
                                        <button 
                                            key={f}
                                            onClick={() => setPrefs(p => ({...p, frequency: f}))}
                                            className={cn(
                                                "py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                                                prefs.frequency === f ? "bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-sm" : "bg-sunken border-default text-tertiary hover:border-primary"
                                            )}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 space-y-4 border-t border-default">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-black text-primary uppercase">Quiet Hours</p>
                                        <p className="text-[9px] text-tertiary font-medium">Auto-mute during focus time</p>
                                    </div>
                                    <button 
                                        onClick={() => setPrefs(p => ({...p, quietHours: {...p.quietHours, enabled: !p.quietHours.enabled}}))}
                                        className={cn("w-10 h-5 rounded-full transition-all relative", prefs.quietHours.enabled ? "bg-amber-500" : "bg-elevated")}
                                    >
                                        <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm", prefs.quietHours.enabled ? "right-0.5" : "left-0.5")} />
                                    </button>
                                </div>
                                {prefs.quietHours.enabled && (
                                    <div className="flex items-center gap-2 pt-2">
                                        <input type="time" value={prefs.quietHours.start} onChange={e => setPrefs(p => ({...p, quietHours: {...p.quietHours, start: e.target.value}}))} className="bg-sunken border border-default rounded-lg px-3 py-2 text-[10px] font-black text-amber-500 w-full outline-none focus:border-amber-400" />
                                        <span className="text-tertiary text-[10px]">to</span>
                                        <input type="time" value={prefs.quietHours.end} onChange={e => setPrefs(p => ({...p, quietHours: {...p.quietHours, end: e.target.value}}))} className="bg-sunken border border-default rounded-lg px-3 py-2 text-[10px] font-black text-amber-500 w-full outline-none focus:border-amber-400" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </SectionContainer>

                    {/* Diagnostics */}
                    <SectionContainer title="Diagnostics" icon={<Info size={14} className="text-tertiary"/>}>
                        <div className="p-6 grid grid-cols-2 gap-3">
                            <button onClick={() => runTest('toast')} className="flex items-center justify-center gap-2 py-3 bg-sunken border border-default rounded-xl text-[9px] font-black uppercase tracking-widest text-secondary hover:bg-surface transition-all">
                                <Zap size={10} /> Test Push
                            </button>
                            <button onClick={() => runTest('email')} className="flex items-center justify-center gap-2 py-3 bg-sunken border border-default rounded-xl text-[9px] font-black uppercase tracking-widest text-secondary hover:bg-surface transition-all">
                                <Mail size={10} /> Test Email
                            </button>
                        </div>
                    </SectionContainer>
                </div>

                {/* Right: The Matrix */}
                <div className="xl:col-span-2">
                    <SectionContainer title="Preferences Matrix" icon={<Bell size={14} className="text-amber-400"/>}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-default bg-sunken/[0.3]">
                                        <th className="px-8 py-5 text-[10px] font-black text-tertiary uppercase tracking-widest">Notification Category</th>
                                        <th className="px-6 py-5 text-center text-[10px] font-black text-tertiary uppercase tracking-widest w-24">In-App</th>
                                        <th className="px-6 py-5 text-center text-[10px] font-black text-tertiary uppercase tracking-widest w-24">Email</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    <MatrixRow title="Direct Mentions" slug="mentions" desc="When someone @labels you" prefs={prefs.categories.mentions} onToggle={(ch) => toggleChannel('mentions', ch)} />
                                    <MatrixRow title="Task Assignments" slug="assignments" desc="When new work is delegated" prefs={prefs.categories.assignments} onToggle={(ch) => toggleChannel('assignments', ch)} />
                                    <MatrixRow title="Due Date Reminders" slug="deadlines" desc="Critical timeline heartbeats" prefs={prefs.categories.deadlines} onToggle={(ch) => toggleChannel('deadlines', ch)} />
                                    <MatrixRow title="Collaboration Feedback" slug="comments" desc="Reviews on your projects" prefs={prefs.categories.comments} onToggle={(ch) => toggleChannel('comments', ch)} />
                                    <MatrixRow title="Direct Messages" slug="messages" desc="In-app chat message notifications" prefs={prefs.categories.messages} onToggle={(ch) => toggleChannel('messages', ch)} />
                                    <MatrixRow title="Security Alerts" slug="security" desc="Logins & safety audits" prefs={prefs.categories.security} onToggle={(ch) => toggleChannel('security', ch)} />
                                    <MatrixRow title="Status Updates" slug="statusUpdates" desc="Task status transitions" prefs={prefs.categories.statusUpdates} onToggle={(ch) => toggleChannel('statusUpdates', ch)} />
                                    <MatrixRow title="General Updates" slug="updates" desc="New features & announcements" prefs={prefs.categories.updates} onToggle={(ch) => toggleChannel('updates', ch)} />
                                </tbody>
                            </table>
                        </div>
                        <div className="p-6 bg-sunken/[0.1] border-t border-default flex items-start gap-3">
                            <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] leading-relaxed text-tertiary italic font-medium">
                                * Mentions and Security alerts are high-priority. Even during quiet hours, we may notify you of critical security breaches or direct tag requests.
                            </p>
                        </div>
                    </SectionContainer>

                    <div className="mt-8 flex justify-end pb-20">
                        <Button 
                            onClick={handleSave}
                            disabled={saving}
                            className="group px-10 py-5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-amber-900/40 transition-all flex items-center gap-3 active:scale-95"
                        >
                            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4 group-hover:rotate-12 transition-transform" />}
                            {saving ? 'Synchronizing...' : 'Commit Preferences'}
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
}

function SectionContainer({ title, icon, children }) {
    return (
        <div className="relative overflow-hidden border border-default rounded-2xl group bg-surface shadow-black/20 shadow-xl">
            <div className="absolute inset-0 z-0 opacity-40">
                <GlassSurface width="100%" height="100%" borderRadius={16} backgroundOpacity={0.03} />
            </div>
            <div className="relative z-10 flex flex-col">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-default bg-sunken/[0.2]">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-sunken">
                        {icon}
                    </div>
                    <span className="text-[10px] font-black text-secondary tracking-[0.2em] uppercase">
                        {title}
                    </span>
                </div>
                {children}
            </div>
        </div>
    );
}

function MasterSwitch({ label, active, onToggle, icon }) {
    return (
        <div className="flex items-center justify-between p-4 rounded-xl bg-sunken/[0.3] border border-white/5 hover:border-amber-500/30 transition-all group">
            <div className="flex items-center gap-4">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all", active ? "bg-amber-500/20 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.1)]" : "bg-elevated text-disabled")}>
                    {icon}
                </div>
                <span className={cn("text-[11px] font-black uppercase tracking-widest", active ? "text-primary" : "text-tertiary")}>{label}</span>
            </div>
            <button onClick={onToggle} className={cn("w-10 h-5 rounded-full transition-all relative", active ? "bg-amber-500" : "bg-elevated")}>
                <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm", active ? "right-0.5" : "left-0.5")} />
            </button>
        </div>
    );
}

function MatrixRow({ title, desc, prefs, onToggle }) {
    return (
        <tr className="hover:bg-sunken/[0.2] transition-colors group">
            <td className="px-8 py-5">
                <div className="space-y-0.5">
                    <p className="text-[11px] font-black text-primary uppercase tracking-wider">{title}</p>
                    <p className="text-[9px] text-tertiary font-medium">{desc}</p>
                </div>
            </td>
            <td className="px-6 py-5">
                <div className="flex justify-center">
                    <IconButton active={prefs.inApp} onClick={() => onToggle('inApp')} icon={<Zap size={12}/>} />
                </div>
            </td>
            <td className="px-6 py-5">
                <div className="flex justify-center">
                    <IconButton active={prefs.email} onClick={() => onToggle('email')} icon={<Mail size={12}/>} />
                </div>
            </td>
        </tr>
    );
}

function IconButton({ active, onClick, icon }) {
    return (
        <button 
            onClick={onClick}
            className={cn(
                "w-9 h-9 rounded-xl border flex items-center justify-center transition-all",
                active 
                    ? "bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]" 
                    : "bg-sunken border-default text-disabled hover:border-tertiary"
            )}
        >
            {icon}
        </button>
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
