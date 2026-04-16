import React, { useRef, useState, useEffect, useMemo, memo } from 'react';
import { useAuthStore, api } from '../store/useAuthStore';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FolderKanban, CheckSquare, Users, Plus, ChevronRight,
    Activity, Lock, RefreshCw, ArrowUpRight, TrendingUp,
    Target, Clock, AlertCircle, LayoutDashboard, Search,
    ChevronDown, CheckCircle2, MoreVertical, ShieldAlert,
    Zap, Globe, Briefcase
} from 'lucide-react';
import ApodWidget from '../components/tools/Widgets/ApodWidget';
import WeatherWidget from '../components/tools/Widgets/WeatherWidget';
import GlobalClockWidget from '../components/tools/Widgets/GlobalClockWidget';
import NotificationHistoryWidget from '../components/notifications/NotificationHistoryWidget';
import QuoteWidget from '../components/tools/Widgets/QuoteWidget';
import { useSocketStore } from '../store/useSocketStore';
import Button from '../components/ui/Button';
import { DeadlinePopup } from '../components/projects/ProjectShared';
import Card from '../components/ui/Card';
import Counter from '../components/ui/Counter';
import { cn } from '../utils/cn';
import { renderActivityNarrative } from '../utils/activityNarrative';
import TaskDetailModal from '../components/Kanban/TaskDetailModal';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

const EASE = { duration: 0.4, ease: [0.22, 1, 0.36, 1] };

const ActivitySkeleton = ({ delay = 0 }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay }} className="flex items-center gap-4 p-3 rounded-2xl">
        <div className="w-10 h-10 rounded-xl bg-shimmer animate-pulse" />
        <div className="flex-1 space-y-2">
            <div className="h-3 bg-shimmer rounded-full animate-pulse w-3/4" />
            <div className="h-2 bg-shimmer rounded-full animate-pulse w-1/2" />
        </div>
    </motion.div>
);

const Home = () => {
    const { user } = useAuthStore();
    const { socket } = useSocketStore();
    const queryClient = useQueryClient();
    const canViewActivity = !!user;

    const [liveActivity, setLiveActivity] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [expandedTaskId, setExpandedTaskId] = useState(null);
    const [feedFilter, setFeedFilter] = useState('All');
    const [intelMode, setIntelMode] = useState('workspace');

    useEffect(() => {
        if (!socket) return;
        const handleRealTimeActivity = (event) => setLiveActivity(prev => [event, ...prev].slice(0, 50));
        socket.on('workspace_activity', handleRealTimeActivity);
        return () => socket.off('workspace_activity', handleRealTimeActivity);
    }, [socket]);

    const [greeting, setGreeting] = useState('');
    useEffect(() => {
        const h = new Date().getHours();
        if (h < 12) setGreeting('Daily Briefing');
        else if (h < 17) setGreeting('Workspace Overview');
        else setGreeting('Executive Summary');
    }, []);

    const dateString = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    const { data: actRes, isLoading: actLoading } = useQuery({
        queryKey: ['activityFeed'],
        queryFn: async ({ signal }) => (await api.get('/audit?limit=50', { signal })).data,
        staleTime: 1000 * 60 * 5,
        enabled: canViewActivity,
    });

    const { data: projRes } = useQuery({
        queryKey: ['projects'],
        queryFn: async ({ signal }) => (await api.get('/projects', { signal })).data,
        staleTime: 1000 * 60 * 5,
    });
    const projects = projRes?.data || [];

    const { data: taskRes } = useQuery({
        queryKey: ['myTasks'],
        queryFn: async ({ signal }) => (await api.get('/tasks', { signal })).data,
        staleTime: 1000 * 60 * 2,
    });
    const allTasks = taskRes?.data || [];

    const { data: wsAnalytics } = useQuery({
        queryKey: ['workspaceAnalytics'],
        queryFn: async () => (await api.get('/analytics/workspace')).data,
        staleTime: 1000 * 60 * 10
    });

    // Fallback logic for NaN safety
    const ws = useMemo(() => {
        const d = wsAnalytics?.data || {};
        return {
            phi: d.phi ?? 100,
            chaosIndex: d.chaosIndex ?? 0,
            completionPct: d.completionPct ?? 0,
            activeProjects: d.activeProjects ?? 0,
            completedTasks: d.completedTasks ?? 0,
            totalTasks: d.totalTasks ?? 0,
            bottlenecks: d.bottlenecks || []
        };
    }, [wsAnalytics]);

    const initialActivity = actRes?.data || [];
    const activity = useMemo(() => {
        const combined = [...liveActivity, ...initialActivity];
        const unique = Array.from(new Map(combined.map(item => [item._id, item])).values());
        let filtered = unique.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        if (feedFilter === 'Tasks') filtered = filtered.filter(a => a.action?.startsWith('TASK_'));
        else if (feedFilter === 'Security') filtered = filtered.filter(a => a.action?.includes('BANNED') || a.action?.includes('LOGIN') || a.action?.includes('ROLE'));
        else if (feedFilter === 'Projects') filtered = filtered.filter(a => a.action?.startsWith('PROJECT_'));
        return filtered;
    }, [liveActivity, initialActivity, feedFilter]);

    const myFocusTasks = useMemo(() => {
        const userId = user?._id;
        return allTasks
            .filter(t => t.status !== 'Completed' && t.status !== 'Canceled' &&
                (t.assignee?._id === userId || t.assignees?.some(a => a._id === userId)))
            .sort((a, b) => {
                const pMap = { 'Urgent': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
                if (pMap[b.priority] !== pMap[a.priority]) return pMap[b.priority] - pMap[a.priority];
                return (a.dueDate && b.dueDate) ? new Date(a.dueDate) - new Date(b.dueDate) : 0;
            })
            .slice(0, 8);
    }, [allTasks, user]);

    const updateTaskMutation = useMutation({
        mutationFn: async ({ id, updates }) => (await api.put(`/tasks/${id}`, updates)).data,
        onSuccess: () => queryClient.invalidateQueries(['myTasks'])
    });

    const STATS = [
        { label: 'Health', value: ws.phi, icon: Target, accent: 'var(--accent-500)', sub: 'Workspace Maturity' },
        { label: 'Stability', value: 100 - ws.chaosIndex, icon: Activity, accent: '#60a5fa', sub: 'Project Cohesion' },
        { label: 'Units', value: ws.completedTasks, icon: Zap, accent: '#10b981', sub: 'Completed Work' },
        { label: 'Projects', value: ws.activeProjects, icon: Briefcase, accent: '#f59e0b', sub: 'Active Tracks' },
    ];

    return (
        <div className="min-h-screen flex flex-col pb-12 px-6 lg:px-12 max-w-[1800px] mx-auto w-full animate-in fade-in duration-1000">
            <DeadlinePopup projects={projects} user={user} />

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 10px; }
            `}</style>

            {/* HEADER & EXECUTIVE BAR */}
            <header className="py-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-theme/10 border border-theme/20 text-[9px] font-black text-theme uppercase tracking-widest">{greeting}</span>
                        <span className="text-[9px] font-bold text-tertiary uppercase tracking-widest opacity-40">{dateString}</span>
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-black text-primary tracking-tighter">
                        Welcome, <span className="text-theme">{user?.name?.split(' ')[0] || 'Member'}.</span>
                    </h1>
                </div>

                {/* Compact Stats Grid */}
                {/* Seamless Executive Status Bar */}
                <div className="flex flex-wrap items-center gap-6 bg-surface/5 backdrop-blur-2xl rounded-[2.5rem] px-8 py-3.5 shadow-panel overflow-x-auto no-scrollbar">
                    {STATS.map((s, i) => (
                        <div key={s.label} className="flex items-center gap-4 min-w-fit">
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: `${s.accent}08` }}>
                                    <s.icon className="w-4 h-4" style={{ color: s.accent }} />
                                </div>
                                <div className="min-w-0 pr-4">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xl font-black text-primary tracking-tighter truncate">
                                            <Counter value={s.value} delay={i * 50} />
                                        </span>
                                        {s.label !== 'Projects' && s.label !== 'Units' && <span className="text-[9px] font-black text-tertiary opacity-40">%</span>}
                                    </div>
                                    <p className="text-[8px] font-black text-tertiary uppercase tracking-[0.22em] truncate opacity-40">{s.label}</p>
                                </div>
                            </div>
                            {i < STATS.length - 1 && <div className="hidden md:block w-px h-6 bg-glass/5" />}
                        </div>
                    ))}
                    <div className="ml-auto flex items-center pl-6 border-l border-glass/10 h-10">
                        <Button variant="primary" leftIcon={Plus} as={Link} to="/projects" className="rounded-2xl h-11 px-8 shadow-glow-sm shadow-theme/10 font-black uppercase text-[10px] tracking-[0.2em] transition-all hover:scale-105 active:scale-95">
                            New Project
                        </Button>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                {/* PRIMARY BENTO BLOCK */}
                <div className="col-span-12 lg:col-span-8 space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-theme shadow-glow-sm" />
                                <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Critical Objects</h2>
                            </div>
                            <span className="text-[8px] font-black text-tertiary/40 uppercase tracking-widest">{myFocusTasks.length} Live Signals</span>
                        </div>

                        {myFocusTasks.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {myFocusTasks.map((t, i) => (
                                    <Card key={t._id} variant="glass" padding="p-4" compact hideBorder className="group cursor-pointer bg-surface/5 hover:bg-surface/10 hover:shadow-panel transition-all duration-500 rounded-2xl"
                                        onClick={() => setSelectedTask(t)}>
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className={cn("w-2 h-2 rounded-full shrink-0 shadow-sm", t.priority === 'Urgent' ? 'bg-danger animate-pulse' : 'bg-theme/40')} />
                                                <div className="truncate">
                                                    <p className="text-[14px] font-black text-primary truncate tracking-tight group-hover:text-theme transition-colors">{t.title}</p>
                                                    <p className="text-[9px] font-bold text-tertiary uppercase tracking-widest mt-1 opacity-40">{t.project?.name}</p>
                                                </div>
                                            </div>
                                            <div className="w-9 h-9 rounded-xl bg-sunken/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                <ArrowUpRight size={14} className="text-theme" />
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="py-10 flex items-center justify-center gap-6 bg-surface/5 backdrop-blur-md rounded-[2.5rem] shadow-panel relative overflow-hidden group border-none">
                                <div className="absolute inset-0 bg-gradient-to-r from-theme/5 via-transparent to-transparent opacity-30 pointer-events-none" />
                                <div className="w-12 h-12 rounded-full bg-theme/5 flex items-center justify-center">
                                    <CheckCircle2 className="w-6 h-6 text-theme/40 group-hover:text-theme transition-colors" />
                                </div>
                                <span className="text-[11px] font-black text-theme uppercase tracking-[0.6em] opacity-30 group-hover:opacity-60 transition-opacity">Signals Clear // Stable Runway</span>
                            </div>
                        )}
                    </div>

                    {/* INTELLIGENCE FEED */}
                    <Card variant="glass" padding="p-0" hideBorder className="rounded-[2.5rem] overflow-hidden bg-surface/5 backdrop-blur-3xl shadow-panel">
                        <div className="px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface/5">
                            <div className="flex items-center gap-6">
                                <div>
                                    <h3 className="text-lg font-black text-primary tracking-tight uppercase">Intelligence Center</h3>
                                    <p className="text-[9px] font-black text-tertiary uppercase tracking-widest mt-1 opacity-30">Live Workspace Audit</p>
                                </div>
                                <div className="flex items-center gap-1 bg-sunken/30 p-1 rounded-xl shadow-inner">
                                    {['WORKSPACE', 'PERSONAL'].map(m => (
                                        <button key={m} onClick={() => setIntelMode(m.toLowerCase())}
                                            className={cn("px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                                intelMode === m.toLowerCase() ? "bg-theme text-primary shadow-glow-sm shadow-theme/20" : "text-tertiary hover:text-primary")}>
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {['All', 'Tasks', 'Security'].map(f => (
                                    <button key={f} onClick={() => setFeedFilter(f)}
                                        className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                            feedFilter === f ? "bg-theme/10 text-theme" : "text-tertiary hover:text-primary")}>
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-[420px] overflow-y-auto custom-scrollbar p-5 space-y-2.5">
                            {actLoading ? (
                                <div className="space-y-2">{[...Array(6)].map((_, i) => <ActivitySkeleton key={i} delay={i * 0.1} />)}</div>
                            ) : activity.length > 0 ? (
                                <div className="space-y-3">
                                    {activity.map((a, i) => (
                                        <motion.div key={a._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.01 }}
                                            className="group flex items-center justify-between p-3.5 rounded-2xl bg-surface/5 hover:bg-surface/10 hover:shadow-sm transition-all duration-500 cursor-default">
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-9 h-9 rounded-xl bg-sunken border border-glass/10 flex items-center justify-center font-black text-[10px] text-theme group-hover:bg-theme/5 transition-all shrink-0 shadow-sm">
                                                    {a.user?.name?.charAt(0) || 'S'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[13px] text-secondary font-medium group-hover:text-primary transition-colors truncate">
                                                        {renderActivityNarrative(a)}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Clock size={10} className="text-tertiary opacity-40" />
                                                        <p className="text-[9px] font-bold text-tertiary uppercase tracking-widest opacity-20">
                                                            {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 ml-4">
                                                <div className="px-2 py-0.5 rounded-md bg-theme/5 border border-theme/10 text-[7px] font-black text-theme uppercase tracking-widest">
                                                    {a.action?.split('_')[0]}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                                    <Activity size={40} className="mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Zero Signals Detected</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* SIDEBAR UTILITY BENTO GRID */}
                <aside className="col-span-12 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6 lg:sticky lg:top-8">
                    {/* FRONT VISIBLE INSPIRATION */}
                    {user?.interfacePrefs?.showQuote !== false && <QuoteWidget />}

                    {/* Team Locator */}
                    {user?.interfacePrefs?.showTeamClock !== false && (
                        <div className="space-y-1">
                            <h3 className="text-[9px] font-black text-primary uppercase tracking-[0.4em] px-2 opacity-30">Timeline</h3>
                            <GlobalClockWidget />
                        </div>
                    )}

                    <Card variant="glass" padding="p-5" className="rounded-2xl border-danger/10 bg-danger/5">
                        <div className="flex items-center gap-2.5 mb-5">
                            <ShieldAlert className="w-4 h-4 text-danger" />
                            <h4 className="text-[10px] font-black text-primary uppercase tracking-widest">Strategic Threats</h4>
                        </div>
                        <div className="space-y-2.5">
                            {ws.bottlenecks?.slice(0, 3).map((task) => (
                                <div key={task._id} onClick={() => setSelectedTask(task)}
                                    className="p-2.5 rounded-xl bg-sunken border border-glass hover:border-danger/40 transition-all cursor-pointer group">
                                    <p className="text-[11px] font-bold text-primary truncate group-hover:text-danger">{task.title}</p>
                                    <div className="flex items-center justify-between mt-1.5">
                                        <span className="text-[7px] font-black text-danger uppercase tracking-widest bg-danger/10 px-1.5 py-0.5 rounded">Critical Risk</span>
                                        <span className="text-[7px] font-black text-tertiary uppercase tracking-widest opacity-30">{task.project?.name}</span>
                                    </div>
                                </div>
                            ))}
                            {ws.bottlenecks?.length === 0 && <p className="text-[8px] font-black text-tertiary opacity-30 text-center py-2 uppercase tracking-widest">No threats detected</p>}
                        </div>
                    </Card>

                    <Card variant="glass" padding="p-3" hideBorder className="rounded-[2rem] bg-surface/5 backdrop-blur-3xl shadow-panel">
                        <div className="flex items-center justify-between gap-3 mb-3 px-1">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-3 h-3 text-theme" />
                                <h4 className="text-[9px] font-black text-primary uppercase tracking-widest opacity-60">Performance</h4>
                            </div>
                            <div className="text-lg font-black text-primary tracking-tighter tabular-nums flex items-baseline gap-0.5">
                                <Counter value={ws.completionPct} />
                                <span className="text-[8px] text-theme">%</span>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 rounded-xl bg-surface/5 flex items-center justify-between px-3">
                                <span className="text-[7px] font-black text-tertiary uppercase tracking-widest opacity-40">Done</span>
                                <span className="text-xs font-black text-primary leading-none">{ws.completedTasks || 0}</span>
                            </div>
                            <div className="p-2 rounded-xl bg-surface/5 flex items-center justify-between px-3">
                                <span className="text-[7px] font-black text-tertiary uppercase tracking-widest opacity-40">Wait</span>
                                <span className="text-xs font-black text-primary leading-none">{(ws.totalTasks || 0) - (ws.completedTasks || 0)}</span>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 gap-5">
                        {user?.interfacePrefs?.showWeather !== false && <WeatherWidget />}
                        {user?.interfacePrefs?.showApod !== false && <ApodWidget />}
                    </div>
                </aside>
            </div>

            <AnimatePresence>
                {selectedTask && (
                    <TaskDetailModal
                        task={selectedTask}
                        projectId={selectedTask.project?._id || selectedTask.project}
                        onClose={() => setSelectedTask(null)}
                        onUpdate={(id, updates) => updateTaskMutation.mutate({ id, updates })}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default memo(Home);