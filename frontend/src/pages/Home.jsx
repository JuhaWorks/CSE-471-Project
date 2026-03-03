import { useAuthStore } from '../store/useAuthStore';
import { Link } from 'react-router-dom';

const Home = () => {
    const { user } = useAuthStore();

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    const stats = [
        { label: 'Active Projects', value: '4', sub: '+2 this week', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z', gradient: 'from-violet-600 to-blue-600', glow: 'shadow-violet-500/15' },
        { label: 'Total Tasks', value: '28', sub: '6 due today', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', gradient: 'from-blue-600 to-cyan-600', glow: 'shadow-blue-500/15' },
        { label: 'Completed', value: '15', sub: '54% done', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', gradient: 'from-emerald-600 to-teal-600', glow: 'shadow-emerald-500/15' },
        { label: 'Team Members', value: '8', sub: '3 online', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', gradient: 'from-amber-500 to-orange-600', glow: 'shadow-amber-500/15' },
    ];

    const activity = [
        { user: 'Sarah K.', action: 'completed task', target: 'Fix authentication bug', time: '2m ago', color: 'bg-emerald-500' },
        { user: 'Alex M.', action: 'commented on', target: 'UI redesign proposal', time: '15m ago', color: 'bg-blue-500' },
        { user: 'You', action: 'moved task to', target: 'In Progress', time: '1h ago', color: 'bg-violet-500' },
        { user: 'David L.', action: 'created project', target: 'Backend API v2', time: '3h ago', color: 'bg-amber-500' },
    ];

    const tasks = [
        { status: 'To Do', count: 8, color: 'bg-gray-600', w: '30%' },
        { status: 'In Progress', count: 5, color: 'bg-blue-500', w: '18%' },
        { status: 'Completed', count: 15, color: 'bg-emerald-500', w: '52%' },
    ];

    return (
        <div className="p-5 sm:p-7 lg:p-8 max-w-[1400px] mx-auto space-y-7">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">{user?.name?.split(' ')[0] || 'User'}</span> 👋
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Here's what's happening across your workspace.</p>
                </div>
                <Link to="/whiteboard/team-alpha" className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-[13px] font-semibold rounded-xl transition-all shadow-lg shadow-violet-500/15 active:scale-[0.98]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    Open Whiteboard
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.10] transition-all group">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg ${s.glow} mb-4 group-hover:scale-105 transition-transform`}>
                            <svg className="w-[18px] h-[18px] text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d={s.icon} /></svg>
                        </div>
                        <h3 className="text-2xl font-bold text-white">{s.value}</h3>
                        <p className="text-[13px] text-gray-500 mt-0.5">{s.label}</p>
                        <p className="text-[11px] text-gray-600 mt-2">{s.sub}</p>
                    </div>
                ))}
            </div>

            {/* Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Task Overview */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-[15px] font-bold text-white">Task Overview</h2>
                        <span className="text-[10px] text-gray-500 bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/[0.06] uppercase tracking-wider font-medium">Sprint</span>
                    </div>
                    <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-800/50 mb-5">
                        {tasks.map((t, i) => (<div key={i} className={`${t.color} transition-all duration-700`} style={{ width: t.w }} />))}
                    </div>
                    <div className="space-y-3.5">
                        {tasks.map((t, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5"><div className={`w-2.5 h-2.5 rounded-full ${t.color}`} /><span className="text-[13px] text-gray-400">{t.status}</span></div>
                                <span className="text-[13px] font-bold text-white">{t.count}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-5 pt-4 border-t border-white/[0.06]">
                        <p className="text-[11px] text-gray-600">Total: <span className="text-white font-semibold">28 tasks</span> across 4 projects</p>
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-[15px] font-bold text-white">Recent Activity</h2>
                        <button className="text-[11px] text-violet-400 hover:text-violet-300 font-semibold transition-colors">View all</button>
                    </div>
                    <div className="space-y-4">
                        {activity.map((a, i) => (
                            <div key={i} className="flex gap-3">
                                <div className="relative mt-0.5">
                                    <div className={`w-7 h-7 rounded-full ${a.color} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>{a.user.charAt(0)}</div>
                                    {i < activity.length - 1 && <div className="absolute top-7 left-1/2 -translate-x-1/2 w-px h-4 bg-white/[0.04]" />}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[13px] text-gray-400 leading-snug"><span className="font-semibold text-gray-200">{a.user}</span> {a.action} <span className="font-medium text-gray-300">"{a.target}"</span></p>
                                    <p className="text-[11px] text-gray-600 mt-0.5">{a.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Space Widget */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden flex flex-col">
                    <div className="p-6 pb-0">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-[15px] font-bold text-white">Inspiration</h2>
                            <span className="text-gray-600 text-xs">🚀</span>
                        </div>
                    </div>
                    <div className="relative flex-1 min-h-[200px]">
                        <img src="https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600&auto=format&fit=crop&q=80" alt="Deep space nebula" className="w-full h-full object-cover" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a12] via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-5">
                            <p className="text-[13px] font-medium text-gray-200 leading-relaxed">"The cosmos is within us. We are made of star-stuff."</p>
                            <p className="text-[11px] text-gray-500 mt-1">— Carl Sagan</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
