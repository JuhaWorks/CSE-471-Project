import React, { useRef, useState, useEffect, Suspense } from 'react';
import { useAuthStore, api } from '../store/useAuthStore';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FolderKanban, CheckSquare, Zap, Plus, ChevronRight, Activity,
    Lock, Cpu, Network, RefreshCw, ArrowUpRight, Shield
} from 'lucide-react/dist/esm/lucide-react';
import ApodWidget from '../components/tools/ApodWidget';
import { useSocketStore } from '../store/useSocketStore';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

/* ─── Physics ─────────────────────────────────────────────────── */
const SPRING = { type: 'spring', stiffness: 260, damping: 22, mass: 0.6 };
const EASE = { duration: 0.45, ease: [0.22, 1, 0.36, 1] };

/* ─── Error Boundary ─────────────────────────────────────────── */
class DashboardErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { hasError: false }; }
    static getDerivedStateFromError() { return { hasError: true }; }
    render() {
        if (this.state.hasError) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center p-12 rounded-3xl border border-rose-500/15 bg-rose-500/5 text-center gap-4">
                    <RefreshCw className="w-7 h-7 text-rose-400" />
                    <p className="text-sm font-semibold text-rose-400">Dashboard failed to synchronize. Please refresh.</p>
                </div>
            );
        }
        return this.props.children;
    }
}

/* ─── Activity Skeleton ───────────────────────────────────────── */
const ActivitySkeleton = ({ delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay }}
        className="flex items-center gap-4 py-3.5 border-b border-white/[0.03]"
    >
        <div className="w-9 h-9 rounded-xl bg-white/[0.04] shrink-0 animate-pulse" />
        <div className="flex-1 space-y-2">
            <div className="h-3 w-2/3 rounded bg-white/[0.04] animate-pulse" />
            <div className="h-2 w-1/4 rounded bg-white/[0.03] animate-pulse" />
        </div>
    </motion.div>
);

/* ─── Animated Counter ───────────────────────────────────────── */
const Counter = ({ value, delay = 0 }) => {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        let start = 0;
        const end = Number(value) || 0;
        if (end === 0) { setDisplay(0); return; }
        const duration = 900;
        const step = end / (duration / 16);
        const timer = setTimeout(() => {
            const tick = () => {
                start = Math.min(start + step, end);
                setDisplay(Math.round(start));
                if (start < end) requestAnimationFrame(tick);
            };
            tick();
        }, delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return <span>{display.toLocaleString()}</span>;
};

/* ─── Inline Status Pip ──────────────────────────────────────── */
const StatusPip = ({ active }) => (
    <span className="relative inline-flex w-2 h-2">
        {active && <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />}
        <span className={`relative rounded-full w-2 h-2 ${active ? 'bg-emerald-400' : 'bg-slate-600'}`} />
    </span>
);

/* ═══════════════════════════════════════════════════════════════
   HOME DASHBOARD
═══════════════════════════════════════════════════════════════ */
const Home = () => {
    const { user } = useAuthStore();
    const { onlineUsers } = useSocketStore();
    const canViewActivity = user && ['Admin', 'Manager'].includes(user.role);
    const parentRef = useRef(null);

    const [greeting, setGreeting] = useState('');
    useEffect(() => {
        const h = new Date().getHours();
        if (h < 5) setGreeting('Working Late');
        else if (h < 12) setGreeting('Good Morning');
        else if (h < 17) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');
    }, []);

    const firstName = user?.name?.split(' ')[0] || 'Operator';
    const roleLabel = user?.role === 'Admin' ? 'Administrator' : user?.role === 'Manager' ? 'Manager' : 'Developer';
    const timeString = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

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

    const STATS = [
        {
            label: 'Active Projects',
            value: statsData.activeProjects,
            sub: `${statsData.totalProjects || 0} total`,
            icon: FolderKanban,
            accent: '#22d3ee', /* cyan */
            ring: 'rgba(34,211,238,0.12)',
        },
        {
            label: 'Total Tasks',
            value: statsData.totalTasks,
            sub: `${statsData.pendingTasks} pending`,
            icon: CheckSquare,
            accent: '#818cf8', /* indigo */
            ring: 'rgba(129,140,248,0.12)',
        },
        {
            label: 'Completed Tasks',
            value: statsData.completedTasks,
            sub: `${statsData.completionPct}% completion`,
            icon: Zap,
            accent: '#34d399', /* emerald */
            ring: 'rgba(52,211,153,0.12)',
        },
        {
            label: 'Online Users',
            value: onlineUsers.filter(u => u.status !== 'Offline').length,
            sub: 'Connected now',
            icon: Network,
            accent: '#e879f9', /* fuchsia */
            ring: 'rgba(232,121,249,0.12)',
        },
    ];

    /* ── Virtualizer ── */
    const virt = useVirtualizer({
        count: activity.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 68,
        overscan: 6,
    });

    /* ── Action keyword map ── */
    const actionLabel = (action) => {
        const map = {
            'created': 'created',
            'updated': 'updated',
            'deleted': 'removed',
            'assigned': 'assigned',
            'completed': 'marked complete',
        };
        for (const [k, v] of Object.entries(map)) {
            if (action?.toLowerCase().includes(k)) return v;
        }
        return action;
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');

                .h-root {
                    --sans:   "Switzer", system-ui, sans-serif;
                    --mono:   "Geist Mono", monospace;
                    --bg:     var(--bg-base);
                    --surface: var(--bg-surface);
                    --border:  var(--border-subtle);
                    --muted:   var(--text-tertiary);
                    --text:    var(--text-primary);
                    --dim:     var(--text-secondary);
                    font-family: var(--sans);
                }

                /* scrollbar */
                .h-scroll::-webkit-scrollbar       { width: 4px; }
                .h-scroll::-webkit-scrollbar-track  { background: transparent; }
                .h-scroll::-webkit-scrollbar-thumb  { background: var(--border-subtle); border-radius: 2px; }
                .h-scroll::-webkit-scrollbar-thumb:hover { background: var(--border-default); }

                /* stat card */
                .stat-card {
                    position: relative;
                    border: 1px solid var(--border-subtle);
                    border-radius: 18px;
                    padding: 28px 26px 22px;
                    background: var(--bg-surface);
                    overflow: hidden;
                    transition: all .3s var(--ease-fluid);
                    cursor: default;
                }
                .stat-card:hover { 
                    transform: translateY(-4px);
                    border-color: var(--accent-border);
                    box-shadow: 0 12px 32px -8px var(--accent-glow);
                }

                /* activity item */
                .act-row {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 12px 8px;
                    border-radius: 12px;
                    transition: background .15s;
                    cursor: default;
                }
                .act-row:hover { background: var(--bg-sunken); }

                /* progress bar */
                @keyframes prog-in {
                    from { width: 0; }
                }

                /* grid line bg */
                .h-bg-grid {
                    background-image:
                        linear-gradient(var(--border-subtle) 1px, transparent 1px),
                        linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px);
                    background-size: 44px 44px;
                }
            `}</style>

            <article className="h-root h-bg-grid min-h-full pb-20 space-y-10 relative">

                {/* Ambient top glow */}
                <div className="fixed top-[-180px] left-1/2 -translate-x-1/2 w-[700px] h-[380px] bg-[radial-gradient(ellipse,rgba(34,211,238,0.055)_0%,transparent_70%)] pointer-events-none z-0" />

                <div className="max-w-[1300px] mx-auto px-6 md:px-8 pt-8 relative z-20">
                    <DashboardErrorBoundary>

                        {/* ── HEADER ────────────────────────────────── */}
                        <motion.header
                            initial={{ opacity: 0, y: -12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={EASE}
                            className="mb-10"
                        >
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                <div>
                                    {/* system status chip */}
                                        <motion.div
                                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                        transition={{ ...EASE, delay: .08 }}
                                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 bg-white/[0.02] mb-5"
                                    >
                                        <StatusPip active />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-tertiary font-mono">
                                            All systems operational
                                        </span>
                                        <span className="text-[10px] text-strong font-mono">·</span>
                                        <span className="text-[10px] text-tertiary font-mono">{timeString}</span>
                                    </motion.div>

                                    {/* greeting */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ ...SPRING, delay: .06 }}
                                    >
                                        <h1 className="text-3xl md:text-5xl font-bold text-primary tracking-tight leading-[1.15] m-0">
                                            {greeting},{' '}
                                            <span className="text-theme">{firstName}</span>
                                            <span className="text-theme">.</span>
                                        </h1>
                                        <p className="mt-2 text-sm text-secondary leading-relaxed max-w-md">
                                            {user?.role === 'Admin'
                                                ? 'Your workspace is active. Below is a summary of current platform activity and project status.'
                                                : 'Your project environment is ready. All services are running within expected parameters.'}
                                        </p>
                                    </motion.div>
                                </div>

                                {/* CTA */}
                                <motion.div initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...SPRING, delay: .18 }}>
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        leftIcon={Plus}
                                        as={Link}
                                        to="/projects"
                                        className="shadow-[0_12px_28px_rgba(34,211,238,0.18),inset_0_1px_0_rgba(255,255,255,0.15)]"
                                    >
                                        New Project
                                    </Button>
                                </motion.div>
                            </div>
                        </motion.header>

                        {/* ── STAT CARDS ────────────────────────────── */}
                        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10" aria-label="Workspace overview">
                            {STATS.map((s, i) => (
                                <motion.div
                                    key={s.label}
                                    className="stat-card"
                                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ ...EASE, delay: i * .07 }}
                                    style={{ '--hover-border': s.accent + '33' }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = s.accent + '33'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                                >
                                    {/* corner glow */}
                                    <div style={{ position: 'absolute', top: 0, right: 0, width: 110, height: 110, background: `radial-gradient(circle at top right, ${s.ring}, transparent 70%)`, pointerEvents: 'none' }} />

                                    {/* icon */}
                                    <div style={{ width: 38, height: 38, borderRadius: 12, background: s.ring, border: `1px solid ${s.accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                                        <s.icon style={{ width: 17, height: 17, color: s.accent }} />
                                    </div>

                                    {/* value */}
                                    <div style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-1.5px', color: 'var(--text-primary)', lineHeight: 1, marginBottom: 6 }}>
                                        <Counter value={s.value} delay={i * 70 + 200} />
                                    </div>

                                    {/* label */}
                                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--mono)', marginBottom: 14 }}>
                                        {s.label}
                                    </div>

                                    {/* progress track */}
                                    <div style={{ height: 2, background: 'var(--bg-sunken)', borderRadius: 2, overflow: 'hidden' }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, (s.value / Math.max(statsData.totalProjects || 1, s.value)) * 100)}%` }}
                                            transition={{ duration: 1.1, delay: i * .07 + .4, ease: 'easeOut' }}
                                            style={{ height: '100%', background: s.accent, borderRadius: 2 }}
                                        />
                                    </div>
                                    <div style={{ marginTop: 7, fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--mono)' }}>{s.sub}</div>
                                </motion.div>
                            ))}
                        </section>

                        {/* ── MAIN CONTENT GRID ─────────────────────── */}
                        <section className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">

                            {/* ── ACTIVITY FEED ── */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ ...EASE, delay: .22 }}
                                style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, background: 'rgba(255,255,255,0.015)', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 520 }}
                            >
                                {/* feed header */}
                                <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.01)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ width: 36, height: 36, borderRadius: 11, background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Activity style={{ width: 16, height: 16, color: '#22d3ee' }} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', margin: 0, letterSpacing: '-0.2px' }}>Activity Feed</h3>
                                            <p style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--mono)', margin: '2px 0 0', letterSpacing: '.12em', textTransform: 'uppercase' }}>Real-time audit log</p>
                                        </div>
                                    </div>
                                    {canViewActivity && (
                                        <Link
                                            to="/admin/security"
                                            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textDecoration: 'none', letterSpacing: '.05em', transition: 'color .15s' }}
                                            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-500)'}
                                            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
                                        >
                                            View full log
                                            <ArrowUpRight style={{ width: 12, height: 12 }} />
                                        </Link>
                                    )}
                                </div>

                                {/* feed body */}
                                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }} className="h-scroll">
                                    {!canViewActivity ? (
                                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32, textAlign: 'center' }}>
                                            <div style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Lock style={{ width: 18, height: 18, color: '#f87171' }} />
                                            </div>
                                            <div>
                                                <p style={{ fontSize: 14, fontWeight: 600, color: '#d1d5db', margin: '0 0 5px' }}>Restricted Access</p>
                                                <p style={{ fontSize: 12, color: 'var(--dim)', margin: 0, maxWidth: 260, lineHeight: 1.6 }}>
                                                    Audit log visibility is limited to Administrators and Managers.
                                                </p>
                                            </div>
                                        </div>
                                    ) : actLoading ? (
                                        <div style={{ padding: '16px 24px' }}>
                                            {[0, .08, .16, .24, .32].map((d, i) => <ActivitySkeleton key={i} delay={d} />)}
                                        </div>
                                    ) : activity.length === 0 ? (
                                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>No recent activity</p>
                                        </div>
                                    ) : (
                                        <div ref={parentRef} style={{ height: '100%', overflowY: 'auto', padding: '8px 16px' }} className="h-scroll" aria-live="polite">
                                            <div style={{ height: virt.getTotalSize(), position: 'relative' }}>
                                                {virt.getVirtualItems().map(vi => {
                                                    const a = activity[vi.index];
                                                    const t = new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                                    const initial = a.user?.name?.charAt(0)?.toUpperCase() || '?';
                                                    return (
                                                        <div
                                                            key={vi.key}
                                                            className="act-row"
                                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: vi.size, transform: `translateY(${vi.start}px)` }}
                                                        >
                                                            {/* avatar */}
                                                            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#94a3b8', flexShrink: 0 }}>
                                                                {initial}
                                                            </div>

                                                            {/* text */}
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <p style={{ margin: 0, fontSize: 12.5, color: '#94a3b8', lineHeight: 1.45, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    <span style={{ fontWeight: 600, color: '#cbd5e1' }}>{a.user?.name}</span>
                                                                    {' '}
                                                                    <span style={{ color: 'var(--dim)' }}>{actionLabel(a.action)}</span>
                                                                    {a.details?.title && (
                                                                        <>
                                                                            {' '}
                                                                            <span style={{ color: '#e1e4ed', fontStyle: 'italic' }}>"{a.details.title}"</span>
                                                                        </>
                                                                    )}
                                                                </p>
                                                                <p style={{ margin: '3px 0 0', fontSize: 10, color: '#374151', fontFamily: 'var(--mono)', letterSpacing: '.06em' }}>{t}</p>
                                                            </div>

                                                            <ChevronRight style={{ width: 13, height: 13, color: '#1e2130', flexShrink: 0 }} />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* ── RIGHT COLUMN ── */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                                {/* APOD widget */}
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...EASE, delay: .3 }}>
                                    <ApodWidget />
                                </motion.div>

                                {/* Milestone card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ ...EASE, delay: .38 }}
                                    style={{ border: '1px solid var(--accent-border)', borderRadius: 18, background: 'var(--accent-bg)', padding: '22px 22px 20px', overflow: 'hidden', position: 'relative' }}
                                >
                                    <div style={{ position: 'absolute', top: -40, right: -40, width: 130, height: 130, background: 'radial-gradient(circle, rgba(129,140,248,0.08), transparent 70%)', pointerEvents: 'none' }} />

                                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--mono)', marginBottom: 16 }}>Milestone Tracking</p>

                                    <div style={{ marginBottom: 10 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Project Completion</span>
                                            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-500)', fontFamily: 'var(--mono)' }}>92%</span>
                                        </div>
                                        <div style={{ height: 3, background: 'var(--bg-sunken)', borderRadius: 2, overflow: 'hidden' }}>
                                            <motion.div
                                                initial={{ width: 0 }} animate={{ width: '92%' }}
                                                transition={{ duration: 1.2, delay: .6, ease: 'easeOut' }}
                                                style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent-400), var(--accent-600))', borderRadius: 2, boxShadow: '0 0 10px var(--accent-glow)' }}
                                            />
                                        </div>
                                    </div>

                                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.55, margin: '12px 0 0' }}>
                                        On track to reach the next milestone by end of week.
                                    </p>

                                    {/* mini milestones */}
                                    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 9 }}>
                                        {[
                                            { label: 'Design Review', pct: 100, done: true },
                                            { label: 'Backend API', pct: 88, done: false },
                                            { label: 'QA & Staging', pct: 45, done: false },
                                        ].map((m, i) => (
                                            <div key={i}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                    <span style={{ fontSize: 11, color: m.done ? '#4a5568' : '#6b7280' }}>{m.label}</span>
                                                    <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: m.done ? '#34d399' : '#374151' }}>{m.done ? '✓' : `${m.pct}%`}</span>
                                                </div>
                                                <div style={{ height: 2, background: 'rgba(255,255,255,0.04)', borderRadius: 1, overflow: 'hidden' }}>
                                                    <motion.div
                                                        initial={{ width: 0 }} animate={{ width: `${m.pct}%` }}
                                                        transition={{ duration: 1, delay: .7 + i * .1, ease: 'easeOut' }}
                                                        style={{ height: '100%', background: m.done ? '#34d399' : '#818cf8', borderRadius: 1 }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>

                                {/* Quick links */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ ...EASE, delay: .46 }}
                                    style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: 18, background: 'rgba(255,255,255,0.015)', padding: '18px 20px' }}
                                >
                                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--mono)', marginBottom: 12 }}>Quick Navigation</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        {[
                                            { label: 'Projects', to: '/projects', icon: FolderKanban },
                                            { label: 'Tasks', to: '/tasks', icon: CheckSquare },
                                            ...(canViewActivity ? [{ label: 'Security & Access', to: '/admin', icon: Shield }] : []),
                                        ].map((link, i) => (
                                            <Link key={i} to={link.to}
                                                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, textDecoration: 'none', transition: 'background .15s', color: 'var(--text-secondary)' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-sunken)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                            >
                                                <link.icon style={{ width: 14, height: 14, flexShrink: 0 }} />
                                                <span style={{ fontSize: 13, fontWeight: 500 }}>{link.label}</span>
                                                <ChevronRight style={{ width: 12, height: 12, marginLeft: 'auto', opacity: .5 }} />
                                            </Link>
                                        ))}
                                    </div>
                                </motion.div>
                            </div>
                        </section>

                        {/* ── FOOTER STATUS BAR ─────────────────────── */}
                        <motion.footer
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .6 }}
                            className="mt-10 flex flex-wrap items-center gap-4 pb-4"
                        >
                            <div className="flex items-center gap-2">
                                <StatusPip active />
                                <span className="text-[10px] font-mono text-tertiary">Platform operational</span>
                            </div>
                            <span className="text-[10px] text-subtle">·</span>
                            <span className="text-[10px] font-mono text-tertiary uppercase tracking-wider">{roleLabel}</span>
                            <span className="text-[10px] text-subtle">·</span>
                            <span className="text-[10px] font-mono text-tertiary">{user?.email}</span>
                        </motion.footer>

                    </DashboardErrorBoundary>
                </div>
            </article>
        </>
    );
};

export default Home;