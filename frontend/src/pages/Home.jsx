import React, { useRef, useState, useEffect, useMemo, memo } from 'react';
import { useAuthStore, api } from '../store/useAuthStore';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FolderKanban, CheckSquare, Users, Plus, ChevronRight,
    Activity, Lock, RefreshCw, ArrowUpRight, Shield, TrendingUp
} from 'lucide-react';
import ApodWidget from '../components/tools/ApodWidget';
import { useSocketStore } from '../store/useSocketStore';
import Button from '../components/ui/Button';
import DecryptedText from '../components/ui/DecryptedText';
import DeadlinePopup from '../components/projects/DeadlinePopup';
import Card from '../components/ui/Card';
import GlassSurface from '../components/ui/GlassSurface';
import { cn } from '../utils/cn';


const EASE = { duration: 0.4, ease: [0.22, 1, 0.36, 1] };

/* ─── Error Boundary ─────────────────────────────────────────── */
class DashboardErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { hasError: false }; }
    static getDerivedStateFromError() { return { hasError: true }; }
    render() {
        if (this.state.hasError) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center p-12 rounded-2xl border border-danger/15 bg-danger/5 text-center gap-3">
                    <RefreshCw className="w-5 h-5 text-danger" />
                    <p className="text-sm text-danger">Something went wrong. Please refresh the page.</p>
                </div>
            );
        }
        return this.props.children;
    }
}

/* ─── Skeleton ───────────────────────────────────────────────── */
const ActivitySkeleton = ({ delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay }}
        className="flex items-center gap-3 py-3 border-b border-default"
    >
        <div className="w-8 h-8 rounded-lg bg-surface shrink-0 animate-pulse" />
        <div className="flex-1 space-y-1.5">
            <div className="h-2.5 w-2/3 rounded bg-surface animate-pulse" />
            <div className="h-2 w-1/4 rounded bg-surface-lighter animate-pulse" />
        </div>
    </motion.div>
);

/* ─── Animated Counter (High-Performance) ───────────────────── */
const Counter = memo(({ value, delay = 0 }) => {
    const textRef = useRef(null);
    
    useEffect(() => {
        let start = 0;
        const end = Number(value) || 0;
        if (end === 0) { 
            if (textRef.current) textRef.current.textContent = '0'; 
            return; 
        }
        
        const duration = 900;
        const step = end / (duration / 16);
        
        const timer = setTimeout(() => {
            const tick = () => {
                start = Math.min(start + step, end);
                if (textRef.current) {
                    textRef.current.textContent = Math.round(start).toLocaleString();
                }
                if (start < end) requestAnimationFrame(tick);
            };
            tick();
        }, delay);
        
        return () => clearTimeout(timer);
    }, [value, delay]);

    return <span ref={textRef}>0</span>;
});

/* ─── Status Dot ─────────────────────────────────────────────── */
const StatusDot = ({ active }) => (
    <span className="relative inline-flex w-1.5 h-1.5">
        {active && <span className="absolute inset-0 rounded-full bg-theme animate-ping opacity-50" />}
        <span className={`relative rounded-full w-1.5 h-1.5 ${active ? 'bg-theme' : 'bg-disabled'}`} />
    </span>
);

const Home = () => {
    const { logout, user } = useAuthStore();
    const { onlineUsers } = useSocketStore();
    const queryClient = useQueryClient();
    const canViewActivity = !!(user && ['Admin', 'Manager'].includes(user.role));
    const parentRef = useRef(null);

    const [greeting, setGreeting] = useState('');
    useEffect(() => {
        const h = new Date().getHours();
        if (h < 5) setGreeting('Good Evening');
        else if (h < 12) setGreeting('Good Morning');
        else if (h < 17) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');
    }, []);

    const firstName = user?.name?.split(' ')[0] || 'there';
    const roleLabel = user?.role === 'Admin' ? 'Administrator' : user?.role === 'Manager' ? 'Manager' : 'Developer';
    const dateString = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    /* ── Queries ── */
    const { data: actRes, isLoading: actLoading } = useQuery({
        queryKey: ['activityFeed'],
        queryFn: async ({ signal }) => (await api.get('/audit?limit=100', { signal })).data,
        staleTime: 1000 * 60 * 5,
        enabled: canViewActivity,
    });
    const activity = actRes?.data || [];

    const { data: statsRes } = useQuery({
        queryKey: ['workspaceStats'],
        queryFn: async ({ signal }) => (await api.get('/projects/workspace/stats', { signal })).data,
        staleTime: 1000 * 60 * 5,
    });

    const { data: projRes } = useQuery({
        queryKey: ['projects'],
        queryFn: async ({ signal }) => (await api.get('/projects', { signal })).data,
        staleTime: 1000 * 60 * 5,
    });
    const projects = projRes?.data || [];

    const { data: platformStatsRes } = useQuery({
        queryKey: ['platformStats'],
        queryFn: async ({ signal }) => (await api.get('/admin/stats', { signal })).data,
        enabled: user?.role === 'Admin',
        staleTime: 1000 * 60 * 5,
    });

    const statsData = user?.role === 'Admin'
        ? {
            activeProjects: platformStatsRes?.data?.projects.total || 0,
            totalTasks: platformStatsRes?.data?.tasks.total || 0,
            completedTasks: platformStatsRes?.data?.tasks.completed || 0,
            pendingTasks: platformStatsRes?.data?.tasks.pending || 0,
            completionPct: platformStatsRes?.data?.tasks.completionPct || 0,
            totalProjects: platformStatsRes?.data?.projects.total || 0,
        }
        : statsRes?.data || { activeProjects: 0, totalTasks: 0, completedTasks: 0, pendingTasks: 0, completionPct: 0 };

    const handlePrefetch = (path) => {
        if (path === '/projects') {
            queryClient.prefetchQuery({
                queryKey: ['projects'],
                queryFn: async () => (await api.get('/projects')).data,
                staleTime: 1000 * 60 * 5
            });
        }
        if (path === '/tasks') {
             queryClient.prefetchQuery({
                queryKey: ['tasks', 'all'],
                queryFn: async () => (await api.get('/tasks/all')).data, // Assuming a global task fetch exists or adjust to your route
                staleTime: 1000 * 60 * 5
            });
        }
    };

    const STATS = useMemo(() => [
        {
            label: 'Active Projects',
            value: statsData.activeProjects,
            sub: `${statsData.totalProjects || 0} total`,
            icon: FolderKanban,
            accent: 'var(--accent-500)',
            glow: 'var(--accent-bg)',
        },
        {
            label: 'Total Tasks',
            value: statsData.totalTasks,
            sub: `${statsData.pendingTasks} pending`,
            icon: CheckSquare,
            accent: 'oklch(0.70 0.15 240)',
            glow: 'oklch(0.70 0.15 240 / 0.10)',
        },
        {
            label: 'Completed Tasks',
            value: statsData.completedTasks,
            sub: `${statsData.completionPct}% completion rate`,
            icon: TrendingUp,
            accent: 'var(--color-success)',
            glow: 'oklch(0.72 0.18 142 / 0.10)',
        },
        {
            label: 'Online Now',
            value: onlineUsers.filter(u => u.status !== 'Offline').length,
            sub: 'Active members',
            icon: Users,
            accent: 'var(--accent-500)',
            glow: 'var(--accent-bg)',
        },
    ], [statsData, onlineUsers]);

    const virt = useVirtualizer({
        count: activity.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 60,
        overscan: 6,
    });

    const actionLabel = (action) => {
        const map = {
            'created': 'created',
            'updated': 'updated',
            'deleted': 'deleted',
            'assigned': 'assigned',
            'completed': 'completed',
        };
        for (const [k, v] of Object.entries(map)) {
            if (action?.toLowerCase().includes(k)) return v;
        }
        return action;
    };

    const [isAuditExpanded, setIsAuditExpanded] = useState(false);

    return (
        <>
            <DeadlinePopup projects={projects} user={user} />
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

                .h-root { font-family: 'Sora', system-ui, sans-serif; --mono: 'JetBrains Mono', monospace; }
                .h-scroll::-webkit-scrollbar { width: 3px; }
                .h-scroll::-webkit-scrollbar-track { background: transparent; }
                .h-scroll::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 2px; }

                .stat-card {
                    border: none;
                    border-radius: 3.15rem;
                    padding: 32px;
                    background: var(--bg-surface);
                    transition: border-color 0.2s, transform 0.2s;
                    cursor: default;
                }
                .stat-card:hover {
                    transform: translateY(-4px);
                    border-color: var(--border-strong);
                }

                .act-row {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 12px 10px;
                    border-radius: 1.25rem;
                    transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
                    cursor: default;
                }
                .act-row:hover { 
                    background: var(--bg-sunken);
                    transform: translateX(4px);
                }

                .nav-link {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 12px;
                    border-radius: 1.25rem;
                    text-decoration: none;
                    transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
                    color: var(--text-secondary);
                }
                .nav-link:hover {
                    background: var(--bg-sunken);
                    color: var(--text-primary);
                    transform: translateX(4px);
                }
            `}</style>

            <article className="h-root min-h-[calc(100vh-120px)] flex flex-col pb-6 relative max-w-[2000px] mx-auto w-full">
                {/* Subtle ambient glow — no GlassSurface overlay */}
                <div className="fixed top-0 left-0 right-0 h-[220px] pointer-events-none z-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-base/20 pointer-events-none" />
                    <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-[1000px] h-[300px] bg-theme/10 rounded-full blur-[120px] opacity-40" />
                </div>

                <div className="px-1 relative z-10">
                    <DashboardErrorBoundary>
                        <motion.header
                            className="mb-10"
                        >
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <StatusDot active />
                                        <span className="text-[10px] sm:text-[11px] text-tertiary uppercase tracking-widest font-mono">
                                            {dateString}
                                        </span>
                                    </div>
                                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary tracking-tight leading-tight m-0">
                                        {greeting}, <DecryptedText
                                            text={firstName}
                                            animateOn="view"
                                            revealDirection="center"
                                            useOriginalCharsOnly={true}
                                            className="text-theme"
                                            encryptedClassName="text-theme opacity-50"
                                            speed={20}
                                            maxIterations={5}
                                            sequential={false}
                                        />
                                    </h1>
                                    <p className="text-sm sm:text-base text-secondary max-w-xl leading-relaxed opacity-80">
                                        {user?.role === 'Admin'
                                            ? 'Platform oversight and operational metrics are live. Control center ready.'
                                            : 'Your creative workspace is operational. Explore your active projects.'}
                                    </p>
                                </div>
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...EASE, delay: 0.15 }}>
                                    <Button 
                                        variant="primary" 
                                        size="lg" 
                                        leftIcon={Plus} 
                                        as={Link} 
                                        to="/projects"
                                        onMouseEnter={() => handlePrefetch('/projects')}
                                        className="rounded-2xl sm:rounded-3xl shadow-xl shadow-theme/10 h-14"
                                    >
                                        New Project
                                    </Button>
                                </motion.div>
                            </div>
                        </motion.header>

                        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6 gap-4 sm:gap-6 mb-10">
                            {STATS.map((s, i) => (
                                <Card
                                    key={s.label}
                                    variant="glass"
                                    performance="premium"
                                    hideBorder={true}
                                    padding="p-6 sm:p-8"
                                    className="cursor-default rounded-[2.5rem] sm:rounded-[3.15rem]"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ ...EASE, delay: i * 0.06 }}
                                >
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center mb-6 sm:mb-8"
                                         style={{ background: s.glow, border: `1px solid ${s.accent}20` }}>
                                        <s.icon className="w-5 h-5" style={{ color: s.accent }} />
                                    </div>
                                    <div className="text-3xl sm:text-4xl font-bold tracking-tighter text-primary leading-none mb-2">
                                        <Counter value={s.value} delay={i * 60 + 180} />
                                    </div>
                                    <div className="text-[10px] sm:text-[11px] font-bold tracking-widest text-tertiary uppercase font-mono mb-4 sm:mb-6">
                                        {s.label}
                                    </div>
                                    <div className="h-0.5 sm:h-1 bg-sunken rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, (s.value / Math.max(statsData.totalProjects || 1, s.value)) * 100)}%` }}
                                            transition={{ duration: 1, delay: i * 0.06 + 0.35, ease: 'easeOut' }}
                                            style={{ height: '100%', background: s.accent, borderRadius: 2, opacity: 0.7 }}
                                        />
                                    </div>
                                    <div className="mt-3 text-[10px] text-tertiary font-mono">{s.sub}</div>
                                </Card>
                            ))}
                        </section>

                        <section className="grid grid-cols-1 lg:grid-cols-[1fr_340px] 3xl:grid-cols-[1fr_400px] gap-6 sm:gap-8 items-start">
                            <Card
                                variant="glass"
                                performance="premium"
                                padding="p-0"
                                hideBorder={true}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ ...EASE, delay: 0.2 }}
                                className="rounded-[2.5rem] sm:rounded-[3.15rem] overflow-hidden"
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    height: isAuditExpanded ? 700 : 440,
                                    transition: 'height 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
                                }}
                            >
                                <div className="p-6 sm:p-8 border-b border-subtle flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-theme/5 border border-theme/10 flex items-center justify-center">
                                            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-theme" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm sm:text-base font-bold text-primary m-0">Recent Activity</h3>
                                            <p className="text-[10px] text-tertiary font-mono m-0 uppercase tracking-widest">Neural Operational Log</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsAuditExpanded(!isAuditExpanded)}
                                        className="flex items-center gap-2 text-xs font-bold text-tertiary hover:text-primary transition-colors outline-none"
                                    >
                                        {isAuditExpanded ? 'Show less' : 'View all'}
                                        <ArrowUpRight className={cn("w-3.5 h-3.5 transition-transform duration-300", isAuditExpanded && "rotate-180")} />
                                    </button>
                                </div>

                                <div className="flex-1 min-height-0 overflow-y-auto custom-scrollbar">
                                    {!canViewActivity ? (
                                        <div className="h-full flex flex-col items-center justify-center p-12 text-center gap-6">
                                            <div className="w-14 h-14 rounded-2xl bg-theme/5 border border-theme/10 flex items-center justify-center">
                                                <Lock className="w-6 h-6 text-theme" />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-base font-bold text-primary">Access Restricted</p>
                                                <p className="text-sm text-tertiary max-w-xs leading-relaxed">The audit log is available to Managers and Administrators only.</p>
                                            </div>
                                        </div>
                                    ) : actLoading ? (
                                        <div className="p-6 sm:p-8 space-y-4">{[0, .07, .14, .21, .28].map((d, i) => <ActivitySkeleton key={i} delay={d} />)}</div>
                                    ) : activity.length === 0 ? (
                                        <div className="h-full flex items-center justify-center p-12">
                                            <p className="text-sm text-tertiary font-mono tracking-wider">No recent operations detected.</p>
                                        </div>
                                    ) : (
                                        <div ref={parentRef} className="h-full overflow-y-auto px-4 sm:px-6 py-4">
                                            <div style={{ height: virt.getTotalSize(), position: 'relative' }}>
                                                {virt.getVirtualItems().map(vi => {
                                                    const a = activity[vi.index];
                                                    const t = new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                                    const initial = a.user?.name?.charAt(0)?.toUpperCase() || '?';
                                                    return (
                                                        <div
                                                            key={vi.key} 
                                                            className="flex items-center gap-4 p-3 rounded-2xl hover:bg-sunken transition-all group pointer-events-none"
                                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: vi.size, transform: `translateY(${vi.start}px)` }}
                                                        >
                                                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sunken border border-subtle flex items-center justify-center text-xs font-bold text-tertiary shrink-0 group-hover:border-theme/30 transition-colors">
                                                                {initial}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="m-0 text-sm sm:text-base text-secondary truncate leading-tight">
                                                                    <span className="font-bold text-primary">{a.user?.name}</span>
                                                                    {' '}<span className="opacity-80">{actionLabel(a.action)}</span>
                                                                    {a.details?.title && (
                                                                        <> <span className="text-theme font-medium">"{a.details.title}"</span></>
                                                                    )}
                                                                </p>
                                                                <p className="m-0 mt-1 text-[10px] text-tertiary font-mono uppercase tracking-tighter">{t}</p>
                                                            </div>
                                                            <ChevronRight className="w-4 h-4 text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            <div className="flex flex-col gap-6 sm:gap-8">
                                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...EASE, delay: 0.28 }}>
                                    <ApodWidget />
                                </motion.div>

                                <Card
                                    variant="glass"
                                    padding="p-6 sm:p-8"
                                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ ...EASE, delay: 0.34 }}
                                    className="rounded-[2.5rem] sm:rounded-[3.15rem]"
                                >
                                    <p className="text-[10px] font-black tracking-widest text-tertiary uppercase font-mono mb-6">Milestones</p>
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-baseline">
                                                <span className="text-sm sm:text-base font-bold text-secondary">Overall Progress</span>
                                                <span className="text-sm sm:text-base font-black text-theme font-mono">92%</span>
                                            </div>
                                            <div className="h-1.5 sm:h-2 bg-sunken rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }} animate={{ width: '92%' }}
                                                    transition={{ duration: 1.1, delay: 0.55, ease: 'easeOut' }}
                                                    className="h-full bg-gradient-to-r from-theme to-theme/60 rounded-full"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-xs sm:text-sm text-tertiary leading-relaxed">Neural synchronization on track for end of week milestone.</p>
                                        <div className="space-y-4">
                                            {[
                                                { label: 'Design Review', pct: 100, done: true },
                                                { label: 'Backend API', pct: 88, done: false },
                                                { label: 'QA & Staging', pct: 45, done: false },
                                            ].map((m, i) => (
                                                <div key={i} className="space-y-2">
                                                    <div className="flex justify-between items-center text-[11px] font-bold">
                                                        <span className="text-secondary">{m.label}</span>
                                                        <span className={m.done ? 'text-success' : 'text-tertiary font-mono'}>
                                                            {m.done ? 'COMPLETED' : `${m.pct}%`}
                                                        </span>
                                                    </div>
                                                    <div className="h-1 sm:h-1.5 bg-sunken rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }} animate={{ width: `${m.pct}%` }}
                                                            transition={{ duration: 0.9, delay: 0.65 + i * 0.1, ease: 'easeOut' }}
                                                            className={cn("h-full rounded-full transition-colors", m.done ? 'bg-success' : 'bg-theme/40')}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>

                                <Card
                                    variant="glass"
                                    padding="p-6 sm:p-8"
                                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ ...EASE, delay: 0.42 }}
                                    className="rounded-[2.5rem] sm:rounded-[3.15rem]"
                                >
                                    <p className="text-[10px] font-black tracking-widest text-tertiary uppercase font-mono mb-4">Quick Links</p>
                                    <div className="space-y-2">
                                        {[
                                            { label: 'Projects', to: '/projects', icon: FolderKanban },
                                            { label: 'Tasks', to: '/tasks', icon: CheckSquare },
                                            ...(canViewActivity ? [{ label: 'Admin Panel', to: '/admin', icon: Shield }] : []),
                                        ].map((link, i) => (
                                            <Link 
                                                key={i} 
                                                to={link.to} 
                                                className="flex items-center gap-4 p-3 rounded-2xl hover:bg-sunken text-secondary hover:text-primary transition-all group"
                                                onMouseEnter={() => handlePrefetch(link.to)}
                                            >
                                                <div className="w-8 h-8 rounded-xl bg-sunken flex items-center justify-center group-hover:bg-theme/10 group-hover:text-theme transition-all">
                                                    <link.icon className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm font-bold">{link.label}</span>
                                                <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
                                            </Link>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        </section>

                        <motion.footer
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
                            className="mt-12 pt-12 flex flex-wrap items-center gap-6 pb-6 border-t border-subtle"
                        >
                            <div className="flex items-center gap-2">
                                <StatusDot active />
                                <span className="text-[10px] font-mono text-tertiary uppercase tracking-widest">All systems operational</span>
                            </div>
                            <span className="hidden sm:inline text-tertiary opacity-30">·</span>
                            <span className="text-[10px] font-mono text-tertiary uppercase tracking-widest">{roleLabel} ACCESS LEVEL</span>
                            <span className="hidden sm:inline text-tertiary opacity-30">·</span>
                            <span className="text-[10px] font-mono text-tertiary uppercase tracking-widest truncate">{user?.email}</span>
                        </motion.footer>
                    </DashboardErrorBoundary>
                </div>
            </article>
        </>
    );
};

export default Home;