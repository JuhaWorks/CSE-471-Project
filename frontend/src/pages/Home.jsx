import { useRef } from 'react';
import { useAuthStore, api } from '../store/useAuthStore';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import ApodWidget from '../components/tools/ApodWidget';
import { useSocketStore } from '../store/useSocketStore';

// ─── Config ──────────────────────────────────────────────────────────────────

const STATS = [
    { label: 'Active Projects', value: '4', sub: '+2 this week', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z', g: ['#5b4cf5', '#4f6ef7'], glow: 'rgba(91,76,245,.18)' },
    { label: 'Total Tasks', value: '28', sub: '6 due today', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', g: ['#4f6ef7', '#38b2f5'], glow: 'rgba(79,110,247,.18)' },
    { label: 'Completed', value: '15', sub: '54% complete', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', g: ['#1a9e75', '#22c88a'], glow: 'rgba(26,158,117,.18)' },
    { label: 'Team Members', value: '8', sub: '3 online now', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', g: ['#c97a1a', '#f59e2a'], glow: 'rgba(201,122,26,.18)' },
];

const TASKS = [
    { status: 'To Do', count: 8, pct: '30%', color: '#464878' },
    { status: 'In Progress', count: 5, pct: '18%', color: '#4f6ef7' },
    { status: 'Completed', count: 15, pct: '52%', color: '#22c88a' },
];

// ─── Shared primitives (mirror Login.jsx design tokens) ──────────────────────

const card = {
    background: 'rgba(7,8,16,.6)',
    border: '1px solid rgba(255,255,255,.06)',
    borderRadius: 16,
    backdropFilter: 'blur(20px)',
};

const Ico = ({ d, size = 16, sw = 1.5, stroke = 'currentColor', fill = 'none' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
        strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d={d} />
    </svg>
);

const Tag = ({ children }) => (
    <span style={{
        fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase',
        padding: '3px 9px', borderRadius: 20,
        background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)',
        color: 'rgba(205,208,236,.35)',
    }}>{children}</span>
);

const SectionHead = ({ title, badge, action }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#cdd0ec' }}>{title}</span>
            {badge !== undefined && (
                <span style={{ fontSize: 11, color: 'rgba(205,208,236,.3)', fontWeight: 400 }}>({badge})</span>
            )}
        </div>
        {action}
    </div>
);

// ─── Home ─────────────────────────────────────────────────────────────────────

const Home = () => {
    const { user } = useAuthStore();
    const { onlineUsers } = useSocketStore();
    const canViewActivity = user && ['Admin', 'Manager'].includes(user.role);
    const parentRef = useRef();

    const { data: actRes, isLoading: actLoading } = useQuery({
        queryKey: ['activityFeed'],
        queryFn: async () => (await api.get('/audit?limit=100')).data,
        staleTime: 1000 * 60 * 5,
        enabled: canViewActivity,
    });

    const activity = actRes?.data || [];

    const virt = useVirtualizer({
        count: activity.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 60,
        overscan: 5,
    });

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const firstName = user?.name?.split(' ')[0] || 'there';

    return (
        <div style={{ padding: '28px 32px', maxWidth: 1380, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* ── Header ── */}
            <header className="au" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 'clamp(20px,2.2vw,24px)', fontWeight: 700, letterSpacing: '-.025em', color: '#cdd0ec', lineHeight: 1.2 }}>
                        {greeting},{' '}
                        <span style={{ background: 'linear-gradient(120deg,#9ab0ff,#7b96ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            {firstName}
                        </span>{' '}
                        <span style={{ WebkitTextFillColor: 'initial' }}>👋</span>
                    </h1>
                    <p style={{ fontSize: 13, color: 'rgba(205,208,236,.35)', marginTop: 5, fontWeight: 400 }}>
                        Here's what's happening across your workspace.
                    </p>
                </div>

                <Link to="/whiteboard/team-alpha"
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                        background: 'linear-gradient(110deg,#3350c8,#4f6ef7)', color: '#fff',
                        textDecoration: 'none', flexShrink: 0,
                        boxShadow: '0 4px 18px rgba(79,110,247,.22)',
                        transition: 'opacity .14s, transform .14s cubic-bezier(.34,1.56,.64,1), box-shadow .14s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '.88'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 7px 24px rgba(79,110,247,.3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(79,110,247,.22)'; }}>
                    <Ico d="M12 4v16m8-8H4" size={14} sw={2.2} />
                    Open Whiteboard
                </Link>
            </header>

            {/* ── Stats ── */}
            <div className="au d2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
                {STATS.map((s, i) => (
                    <div key={i} style={{ ...card, padding: 22, transition: 'border-color .18s, transform .18s cubic-bezier(.34,1.56,.64,1)', position: 'relative', overflow: 'hidden' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}>

                        {/* subtle bg glow */}
                        <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: s.glow, filter: 'blur(28px)', pointerEvents: 'none' }} />

                        <div style={{
                            width: 34, height: 34, borderRadius: 10, marginBottom: 16,
                            background: `linear-gradient(135deg,${s.g[0]},${s.g[1]})`,
                            boxShadow: `0 4px 14px ${s.glow}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Ico d={s.icon} size={16} stroke="rgba(255,255,255,.9)" sw={1.5} />
                        </div>

                        <div style={{ fontSize: 26, fontWeight: 700, color: '#cdd0ec', letterSpacing: '-.03em', lineHeight: 1 }}>
                            {s.label === 'Team Members' ? onlineUsers.filter(u => u.status !== 'Offline').length : s.value}
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(205,208,236,.4)', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
                        <div style={{ fontSize: 11, color: 'rgba(205,208,236,.22)', marginTop: 8 }}>
                            {s.label === 'Team Members' ? `${onlineUsers.filter(u => u.status !== 'Offline').length} online now` : s.sub}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Widgets row ── */}
            <div className="au d3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>

                {/* Task Overview */}
                <div style={{ ...card, padding: 24 }}>
                    <SectionHead title="Task Overview" badge={null} action={<Tag>Sprint</Tag>} />

                    {/* Stacked progress bar */}
                    <div style={{ display: 'flex', height: 4, borderRadius: 4, overflow: 'hidden', background: 'rgba(255,255,255,.04)', marginBottom: 22, gap: 1 }}>
                        {TASKS.map((t, i) => (
                            <div key={i} style={{ width: t.pct, background: t.color, transition: 'width .6s cubic-bezier(.22,1,.36,1)', borderRadius: i === 0 ? '4px 0 0 4px' : i === TASKS.length - 1 ? '0 4px 4px 0' : 0 }} />
                        ))}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {TASKS.map((t, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                                    <span style={{ fontSize: 13, color: 'rgba(205,208,236,.5)', fontWeight: 400 }}>{t.status}</span>
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#cdd0ec' }}>{t.count}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.05)' }}>
                        <p style={{ fontSize: 11, color: 'rgba(205,208,236,.25)' }}>
                            Total: <span style={{ color: '#cdd0ec', fontWeight: 600 }}>28 tasks</span> across 4 projects
                        </p>
                    </div>
                </div>

                {/* Activity Feed */}
                <div style={{ ...card, padding: 24, display: 'flex', flexDirection: 'column', height: 400 }}>
                    <SectionHead
                        title="Recent Activity"
                        badge={canViewActivity ? activity.length : null}
                        action={
                            canViewActivity && (
                                <button style={{ fontSize: 11, color: '#7b96ff', fontWeight: 600, background: 'none', border: 'none', transition: 'color .14s' }}
                                    onMouseEnter={e => { e.currentTarget.style.color = '#9ab0ff'; }}
                                    onMouseLeave={e => { e.currentTarget.style.color = '#7b96ff'; }}>
                                    View all
                                </button>
                            )
                        }
                    />

                    {!canViewActivity ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 16px' }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                                <Ico d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" size={18} stroke="rgba(205,208,236,.28)" sw={1.5} />
                            </div>
                            <p style={{ fontSize: 13, color: 'rgba(205,208,236,.5)', fontWeight: 500 }}>Restricted access</p>
                            <p style={{ fontSize: 11, color: 'rgba(205,208,236,.25)', marginTop: 5, lineHeight: 1.6 }}>Admin or Manager role required to view the audit trail.</p>
                        </div>
                    ) : actLoading ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid transparent', borderTopColor: '#4f6ef7', borderBottomColor: '#4f6ef7', animation: 'spin .7s linear infinite' }} />
                        </div>
                    ) : (
                        <div ref={parentRef} style={{ flex: 1, overflowY: 'auto', contain: 'strict' }}>
                            <div style={{ height: virt.getTotalSize(), width: '100%', position: 'relative' }}>
                                {virt.getVirtualItems().map(vi => {
                                    const a = activity[vi.index];
                                    const date = new Date(a.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                                    const initial = a.user?.name?.charAt(0) || '?';
                                    return (
                                        <div key={vi.key} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: vi.size, transform: `translateY(${vi.start}px)`, display: 'flex', gap: 11, padding: '8px 2px', alignItems: 'flex-start' }}>
                                            {/* avatar + line */}
                                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#3350c8,#4f6ef7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>
                                                    {initial}
                                                </div>
                                                {vi.index < activity.length - 1 && (
                                                    <div style={{ position: 'absolute', top: 28, left: '50%', transform: 'translateX(-50%)', width: 1, height: 'calc(100% + 16px)', background: 'rgba(255,255,255,.04)' }} />
                                                )}
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <p style={{ fontSize: 12.5, color: 'rgba(205,208,236,.55)', lineHeight: 1.5 }}>
                                                    <span style={{ fontWeight: 600, color: 'rgba(205,208,236,.85)' }}>{a.user?.name || 'Unknown'}</span>
                                                    {' '}{a.action}{' '}
                                                    <span style={{ fontWeight: 500, color: 'rgba(205,208,236,.7)' }}>"{a.details?.title || a.entityType}"</span>
                                                </p>
                                                <p style={{ fontSize: 11, color: 'rgba(205,208,236,.22)', marginTop: 2 }}>{date}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Space widget */}
                <ApodWidget />
            </div>

        </div>
    );
};

export default Home;