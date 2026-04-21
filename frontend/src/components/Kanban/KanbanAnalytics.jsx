import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BarChart3, Activity, ShieldAlert, TrendingUp, Users, 
    ChevronRight, CheckCircle2 
} from 'lucide-react';
import { 
    AreaChart, Area, PieChart, Pie, Cell, LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer as RechartsResponsiveContainer
} from 'recharts';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../store/useAuthStore';
import { getOptimizedAvatar } from '../../utils/avatar';
import SpecialtyRadar from '../profile/SpecialtyRadar';
import { RADAR_SUBJECTS } from '../profile/RadarConstants';

/* ─────────────────────────────────────────────
   MiniProgressMap
   ───────────────────────────────────────────── */
export const MiniProgressMap = ({ tasks, memberId }) => {
    const data = useMemo(() => {
        const now = new Date();
        const days = 28; // 4 weeks
        const stats = new Array(days).fill(0).map((_, i) => {
            const d = new Date();
            d.setDate(now.getDate() - (days - 1 - i));
            d.setHours(0,0,0,0);
            return { date: d, count: 0 };
        });

        tasks.forEach(t => {
            if (t.assignee?._id === memberId || t.assignees?.some(a => a._id === memberId)) {
                const updatedDate = new Date(t.updatedAt || t.createdAt);
                updatedDate.setHours(0,0,0,0);
                const dayDiff = Math.floor((now - updatedDate) / (1000 * 3600 * 24));
                if (dayDiff >= 0 && dayDiff < days) {
                    stats[days - 1 - dayDiff].count++;
                }
            }
        });
        return stats;
    }, [tasks, memberId]);

    return (
        <div className="flex gap-[2px] mt-2">
            {data.map((d, i) => (
                <div 
                    key={i} 
                    className={twMerge(clsx(
                        "w-1.5 h-1.5 rounded-[1px] transition-all",
                        d.count === 0 ? "bg-sunken border border-glass/20" : 
                        (d.count < 2 ? "bg-theme/30" : (d.count < 4 ? "bg-theme/60" : "bg-theme"))
                    ))}
                    title={`${d.date.toLocaleDateString()}: ${d.count} activities`}
                />
            ))}
        </div>
    );
};

/* ─────────────────────────────────────────────
   AnalyticsSidebar
   ───────────────────────────────────────────── */
export const AnalyticsSidebar = React.memo(({ metrics, onOpenTask, project, tasks, memberFilter, onMemberFilterChange }) => {
    const [activeTab, setActiveTab] = useState('ANALYTICS');

    // Strategic Taxonomy Mapping
    const TYPE_TO_AXIS = useMemo(() => ({
        Epic: 'Strategic', Feature: 'Strategic', Story: 'Strategic', Discovery: 'Strategic', Research: 'Strategic',
        Refactor: 'Engineering', DevOps: 'Engineering', 'Technical Debt': 'Engineering', QA: 'Engineering', Performance: 'Engineering', Engineering: 'Engineering',
        Maintenance: 'Sustainability', Hygiene: 'Sustainability', Task: 'Sustainability', Sustainability: 'Sustainability',
        Bug: 'Operations', Security: 'Operations', Compliance: 'Operations', Meeting: 'Operations', Review: 'Operations', Support: 'Operations', Operations: 'Operations'
    }), []);

    // Project Strategic Footprint Calculator
    const { projectSpecialties, totalPoints } = useMemo(() => {
        const results = RADAR_SUBJECTS.reduce((acc, sub) => ({ ...acc, [sub]: 0 }), {});
        
        const filteredByMember = (tasks || []).filter(t => 
            memberFilter === 'ALL' || t.assignees?.some(a => a._id === memberFilter) || t.assignee?._id === memberFilter
        );

        filteredByMember.forEach(task => {
            if (task.status === 'Backlog' || task.status === 'Canceled') return;

            const axis = TYPE_TO_AXIS[task.type] || 'Sustainability';
            const weight = task.status === 'Completed' ? 100 : 40;
            results[axis] += weight;

            if (task.type === 'Technical Debt') results['Engineering'] += (weight * 0.4);
            if (task.type === 'Discovery') results['Strategic'] += (weight * 0.6);
        });

        const MATURITY_BENCHMARK = 1000;
        const normalized = {};
        RADAR_SUBJECTS.forEach(sub => {
            const points = results[sub] || 0;
            const raw = Math.min(100, (points / MATURITY_BENCHMARK) * 100);
            normalized[sub] = points > 0 ? Math.max(5, Math.round(raw)) : 0;
        });

        const total = Object.values(results).reduce((a, b) => a + b, 0);
        return { projectSpecialties: normalized, totalPoints: Math.round(total) };
    }, [tasks, memberFilter, TYPE_TO_AXIS]);

    const tabs = [
        { id: 'ANALYTICS', icon: LayoutDashboard, label: 'Analytics' },
        { id: 'RISKS', icon: ShieldAlert, label: 'Risk Analysis' },
        { id: 'TIMELINE', icon: TrendingUp, label: 'History' },
        { id: 'TEAM', icon: Users, label: 'Squad Leaderboard' }
    ];

    const { data: leaderboardRes } = useQuery({
        queryKey: ['projectLeaderboard', project?._id],
        queryFn: async () => (await api.get(`/projects/${project._id}/leaderboard`)).data,
        enabled: !!project?._id && activeTab === 'TEAM',
        staleTime: 1000 * 30
    });
    const leaderboard = leaderboardRes?.data || [];

    const projectRisks = useMemo(() => {
        const now = new Date();
        return (tasks || []).filter(t => 
            t.status !== 'Completed' && 
            t.status !== 'Canceled' &&
            (
                (t.dueDate && new Date(t.dueDate) < now) || 
                (t.priority === 'Urgent' || t.priority === 'High')
            )
        ).map(t => {
            const isOverdue = t.dueDate && new Date(t.dueDate) < now;
            const breachMs = isOverdue ? (now - new Date(t.dueDate)) : 0;
            const breachDays = Math.floor(breachMs / (1000 * 60 * 60 * 24));
            const breachHours = Math.floor((breachMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            
            return {
                ...t,
                isOverdue,
                riskLabel: isOverdue ? 'LATE BREACH' : 'HIGH PRIORITY',
                breachText: isOverdue ? (breachDays > 0 ? `${breachDays}d ${breachHours}h` : `${breachHours}h`) : 'ON TIME',
                breachValue: breachMs,
                riskScore: isOverdue ? (100 + (breachMs / (1000 * 3600))) : (t.priority === 'Urgent' ? 90 : 70)
            };
        }).sort((a, b) => b.riskScore - a.riskScore);
    }, [tasks]);

    const totalDriftDays = useMemo(() => {
        const totalMs = projectRisks.reduce((sum, t) => sum + (t.isOverdue ? t.breachValue : 0), 0);
        return (totalMs / (1000 * 60 * 60 * 24)).toFixed(1);
    }, [projectRisks]);

    const priorityPieData = useMemo(() => [
        { name: 'Urgent', value: metrics.priorityBreakdown?.Urgent || 0, fill: '#ef4444' },
        { name: 'High', value: metrics.priorityBreakdown?.High || 0, fill: '#3b82f6' },
        { name: 'Medium', value: metrics.priorityBreakdown?.Medium || 0, fill: '#f59e0b' },
        { name: 'Low', value: metrics.priorityBreakdown?.Low || 0, fill: 'var(--text-tertiary)' }
    ].filter(d => d.value > 0), [metrics.priorityBreakdown]);

    const burnDownData = useMemo(() => {
        if (!metrics.timeline?.length) return [];
        return metrics.timeline.map(s => ({
            ...s,
            displayDate: new Date(s.date).toLocaleDateString([], { month: 'short', day: 'numeric' })
        }));
    }, [metrics.timeline]);

    return (
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full lg:w-[360px] shrink-0 border-l lg:border-l border-glass bg-glass-heavy backdrop-blur-3xl p-4 lg:p-8 flex flex-col gap-8 overflow-hidden"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-theme/10 border border-theme/20 flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-theme" />
                    </div>
                    <h3 className="text-[10px] font-black text-primary uppercase tracking-widest">Project Insights</h3>
                </div>
                <div className="flex items-center gap-1 bg-sunken p-1 rounded-xl border border-glass">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={twMerge(clsx(
                                "p-2 rounded-lg transition-all",
                                activeTab === tab.id ? "bg-theme text-primary shadow-lg" : "text-tertiary hover:text-primary"
                            ))}
                            title={tab.label}
                        >
                            <tab.icon className="w-4 h-4" />
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                <AnimatePresence mode="wait">
                    {activeTab === 'ANALYTICS' && (
                        <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                            <div className="bg-surface border border-glass rounded-[2rem] p-6">
                                <span className="text-[9px] font-black text-tertiary uppercase tracking-widest block mb-1">Project Maturity</span>
                                <div className="text-4xl font-black text-primary font-mono mb-6">
                                    {metrics.projectProgress?.total > 0 
                                        ? Math.floor((metrics.projectProgress.finished / metrics.projectProgress.total) * 100) 
                                        : 0}%
                                </div>
                                <div className="h-2 w-full bg-sunken rounded-full overflow-hidden border border-glass">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${metrics.projectProgress?.total > 0 ? (metrics.projectProgress.finished / metrics.projectProgress.total) * 100 : 0}%` }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                                    />
                                </div>
                            </div>

                            <div className="bg-surface border border-glass rounded-[2rem] p-6">
                                <span className="text-[9px] font-black text-tertiary uppercase tracking-widest block mb-6">Active Risk Distribution</span>
                                <div className="h-[200px] w-full min-h-[200px] flex items-center justify-center relative">
                                    <RechartsResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={priorityPieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={55}
                                                outerRadius={75}
                                                paddingAngle={4}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {priorityPieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip 
                                                contentStyle={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-glass)', borderRadius: '16px', fontSize: '11px', fontWeight: 900 }}
                                            />
                                        </PieChart>
                                    </RechartsResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-3xl font-black text-primary font-mono">{metrics.projectProgress?.total - metrics.projectProgress?.finished || 0}</span>
                                        <span className="text-[8px] font-black text-tertiary uppercase tracking-widest">Active</span>
                                    </div>
                                </div>
                            </div>

                             <div className="bg-surface border border-glass rounded-[2rem] p-6">
                                <span className="text-[9px] font-black text-tertiary uppercase tracking-widest block mb-6">Completion Speed (Hours)</span>
                                <div className="h-[200px] w-full min-h-[200px]">
                                    <RechartsResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={metrics.velocityMetrics || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorDur" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" vertical={false} />
                                            <XAxis 
                                                dataKey="date" 
                                                tickFormatter={(tick) => new Date(tick).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                tick={{ fill: 'var(--text-tertiary)', fontSize: 8, fontWeight: 900 }}
                                                axisLine={{ stroke: 'var(--border-glass)' }}
                                                tickLine={{ stroke: 'var(--border-glass)' }}
                                                minTickGap={20}
                                            />
                                            <YAxis 
                                                tick={{ fill: 'var(--text-tertiary)', fontSize: 8, fontWeight: 900 }}
                                                axisLine={{ stroke: 'var(--border-glass)' }}
                                                tickLine={{ stroke: 'var(--border-glass)' }}
                                                width={25}
                                                tickFormatter={(val) => Math.round(val)}
                                            />
                                            <RechartsTooltip 
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const d = payload[0].payload;
                                                        return (
                                                            <div className="bg-base border border-glass p-3 rounded-xl shadow-2xl">
                                                                <p className="text-[8px] font-black text-primary uppercase mb-1 truncate max-w-[120px]">{d.title}</p>
                                                                <p className="text-[9px] font-black text-[#10b981] font-mono">{d.duration} HOURS</p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Area type="monotone" dataKey="duration" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorDur)" />
                                        </AreaChart>
                                    </RechartsResponsiveContainer>
                                </div>
                             </div>
                        </motion.div>
                    )}

                    {activeTab === 'TIMELINE' && (
                        <motion.div key="timeline" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                            <div className="bg-surface border border-glass rounded-[2rem] p-6">
                                <span className="text-[9px] font-black text-tertiary uppercase tracking-widest block mb-6 px-1">Active Burn-down</span>
                                <div className="h-[200px] w-full min-h-[200px]">
                                    <RechartsResponsiveContainer width="100%" height="100%">
                                        <LineChart data={burnDownData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" vertical={false} />
                                            <XAxis 
                                                dataKey="displayDate" 
                                                tick={{ fill: 'var(--text-tertiary)', fontSize: 8, fontWeight: 900 }}
                                                axisLine={{ stroke: 'var(--border-glass)' }}
                                                tickLine={{ stroke: 'var(--border-glass)' }}
                                                minTickGap={20}
                                            />
                                            <YAxis 
                                                tick={{ fill: 'var(--text-tertiary)', fontSize: 8, fontWeight: 900 }}
                                                axisLine={{ stroke: 'var(--border-glass)' }}
                                                tickLine={{ stroke: 'var(--border-glass)' }}
                                                width={25}
                                                allowDecimals={false}
                                            />
                                            <RechartsTooltip 
                                                contentStyle={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-glass)', borderRadius: '12px', fontSize: '10px' }}
                                            />
                                            <Line type="monotone" dataKey="ideal" stroke="var(--theme)" strokeWidth={2} strokeDasharray="5 5" dot={false} opacity={0.3} name="Ideal Path" />
                                            <Line type="monotone" dataKey="remaining" stroke="#ef4444" strokeWidth={4} dot={{ r: 3, fill: '#ef4444', strokeWidth: 0 }} name="Work Remaining" />
                                        </LineChart>
                                    </RechartsResponsiveContainer>
                                </div>
                                <div className="mt-4 flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-tertiary/60">
                                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-danger" /> Tasks Left</div>
                                    <div className="flex items-center gap-1.5"><div className="w-2 h-0.5 bg-theme/30" /> Optimal Path</div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'RISKS' && (
                        <motion.div key="risks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                            <div className="bg-surface border border-danger/20 rounded-[2rem] p-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <ShieldAlert className="w-16 h-16 text-danger" />
                                </div>
                                <span className="text-[9px] font-black text-danger uppercase tracking-widest block mb-1">Cumulative Project Drift</span>
                                <div className="flex items-baseline gap-2">
                                    <div className="text-4xl font-black text-primary font-mono leading-none tracking-tighter">{totalDriftDays}</div>
                                    <span className="text-sm font-black text-danger/60 uppercase">Days Late</span>
                                </div>
                                <p className="text-[8px] font-black text-tertiary/40 uppercase tracking-widest mt-4 leading-relaxed">
                                    Aggregated delay across {projectRisks.filter(r => r.isOverdue).length} active breaches.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <span className="text-[9px] font-black text-tertiary uppercase tracking-widest block px-1">Active Risk Profile</span>
                                {projectRisks.length > 0 ? (
                                    projectRisks.map(task => (
                                        <motion.div 
                                            key={task._id}
                                            onClick={() => onOpenTask?.(task)}
                                            whileHover={{ x: 4 }}
                                            className={twMerge(clsx(
                                                "group p-4 bg-sunken/40 border border-glass rounded-2xl transition-all cursor-pointer",
                                                task.isOverdue ? "hover:border-danger/30 hover:bg-danger/5" : "hover:border-theme/30 hover:bg-theme/5"
                                            ))}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <h4 className={twMerge(clsx(
                                                        "text-[10px] font-black group-hover:text-primary truncate uppercase tracking-tight",
                                                        task.isOverdue ? "text-danger" : "text-primary"
                                                    ))}>{task.title}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[7px] font-black text-tertiary/60 uppercase">{task.assignee?.name || 'Unassigned'}</span>
                                                        <span className={twMerge(clsx(
                                                            "text-[6px] font-black px-1 py-0.5 rounded border",
                                                            task.priority === 'Urgent' ? "bg-danger/10 border-danger/20 text-danger" : 
                                                            task.priority === 'High' ? "bg-warning/10 border-warning/20 text-warning" : "bg-sunken border-glass text-tertiary"
                                                        ))}>
                                                            {task.priority || 'Medium'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className={twMerge(clsx("text-[9px] font-black font-mono", task.isOverdue ? "text-danger" : "text-theme"))}>
                                                        {task.isOverdue ? `+${task.breachText}` : 'STABLE'}
                                                    </div>
                                                    <div className="text-[6px] font-black text-tertiary/40 uppercase tracking-widest">{task.riskLabel}</div>
                                                </div>
                                            </div>
                                            <div className="h-1 w-full bg-glass rounded-full overflow-hidden">
                                                <div 
                                                    className={clsx("h-full", task.isOverdue ? 'bg-danger' : 'bg-theme')}
                                                    style={{ width: task.isOverdue ? '100%' : (task.priority === 'Urgent' ? '80%' : '50%') }}
                                                />
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="p-8 border border-dashed border-glass rounded-2xl flex flex-col items-center justify-center opacity-30 text-center">
                                        <CheckCircle2 className="w-8 h-8 text-success mb-2" />
                                        <p className="text-[8px] font-black text-tertiary uppercase tracking-widest">Workspace Analysis Clear</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'TEAM' && (
                        <motion.div key="team" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                            <div className="bg-surface border border-glass rounded-[2rem] p-6 relative overflow-hidden group/dynamics">
                                <div className="absolute inset-0 bg-gradient-to-br from-theme/5 to-transparent opacity-0 group-hover/dynamics:opacity-100 transition-opacity" />
                                
                                <div className="flex flex-col gap-5 mb-6 relative z-10">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black text-theme uppercase tracking-[0.2em]">{memberFilter === 'ALL' ? 'Squad Strategic Mix' : 'Member Tactical Mix'}</span>
                                        <TrendingUp className="w-3.5 h-3.5 text-theme/40" />
                                    </div>
                                    
                                    <div className="relative group/search">
                                        <select 
                                            value={memberFilter} 
                                            onChange={(e) => onMemberFilterChange?.(e.target.value)}
                                            className="w-full bg-sunken/50 border border-glass rounded-xl px-4 py-2.5 text-[10px] font-black text-primary uppercase appearance-none focus:ring-0 focus:border-theme/40 transition-all cursor-pointer"
                                        >
                                            <option value="ALL">All Squad Members</option>
                                            {project?.members?.map(m => (
                                                <option key={m.userId?._id || m.userId} value={m.userId?._id || m.userId}>
                                                    {m.userId?.name || 'Unknown Member'}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-tertiary/40 rotate-90 pointer-events-none" />
                                    </div>
                                </div>

                                <SpecialtyRadar specialties={projectSpecialties} isProjectView height={240} manualFullMark={100} />
                                
                                <div className="mt-4 pt-4 border-t border-glass flex items-center justify-between text-[8px] font-black text-tertiary/60 uppercase tracking-widest relative z-10">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-primary/40">Visualizer Scale</span>
                                        <span>Normalized Mix (0-100%)</span>
                                    </div>
                                    <div className="text-right flex flex-col gap-0.5">
                                        <span className="text-theme">{totalPoints.toLocaleString()}</span>
                                        <span>Strategic Volume</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-surface border border-glass rounded-[2rem] p-6">
                                <span className="text-[9px] font-black text-tertiary uppercase tracking-widest block mb-8">Workload Distribution</span>
                                <div className="h-[300px] w-full min-h-[300px]">
                                    <RechartsResponsiveContainer width="100%" height="100%">
                                        <BarChart data={metrics.memberMetrics || []} layout="vertical" margin={{ left: -10, right: 30, bottom: 0, top: 10 }}>
                                            <XAxis 
                                                type="number" 
                                                tick={{ fill: 'var(--text-tertiary)', fontSize: 8, fontWeight: 900 }} 
                                                axisLine={{ stroke: 'var(--border-glass)' }} 
                                                tickLine={{ stroke: 'var(--border-glass)' }} 
                                                allowDecimals={false}
                                                height={20}
                                            />
                                            <YAxis 
                                                dataKey="name" 
                                                type="category" 
                                                tick={{ fill: 'var(--text-tertiary)', fontSize: 9, fontWeight: 900 }} 
                                                width={80} 
                                                axisLine={{ stroke: 'var(--border-glass)' }} 
                                                tickLine={false} 
                                            />
                                            <RechartsTooltip cursor={{ fill: 'var(--bg-sunken)', opacity: 0.1 }} contentStyle={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-glass)', borderRadius: '12px', fontSize: '10px', color: 'var(--text-primary)' }} />
                                            <Bar dataKey="active" name="Load" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={12} />
                                            <Bar dataKey="completed" name="Output" fill="#10b981" radius={[0, 6, 6, 0]} barSize={12} />
                                        </BarChart>
                                    </RechartsResponsiveContainer>
                                </div>
                                <div className="flex items-center gap-4 mt-6 text-[8px] font-black uppercase tracking-widest">
                                    <div className="flex items-center gap-2 text-[#3b82f6]"><div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" /> Load</div>
                                    <div className="flex items-center gap-2 text-[#10b981]"><div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" /> Output</div>
                                </div>
                            </div>

                            <div className="bg-surface border border-glass rounded-[2rem] p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Activity className="w-16 h-16 text-theme" />
                                </div>
                                <span className="text-[9px] font-black text-theme uppercase tracking-widest block mb-4 relative z-10">Squad Leaderboard</span>
                                
                                <div className="space-y-4 relative z-10">
                                    {leaderboard.length > 0 ? leaderboard.map((user, index) => {
                                        const mStats = metrics.memberMetrics.find(m => m.id === user._id) || { active: 0, completed: 0 };
                                        const total = mStats.active + mStats.completed;
                                        const progress = total > 0 ? Math.round((mStats.completed / total) * 100) : 0;

                                        return (
                                            <motion.div 
                                                key={user._id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="flex flex-col p-4 bg-sunken/40 border border-glass rounded-[1.5rem] hover:bg-theme/5 hover:border-theme/30 transition-all group"
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            <img src={getOptimizedAvatar(user.avatar)} alt={user.name} className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/10" />
                                                            {index === 0 && (
                                                                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-black text-[8px] font-black shadow-lg">1</div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col text-left">
                                                            <span className="text-[12px] font-black text-primary truncate max-w-[120px]">{user.name}</span>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <span className="text-[9px] font-black text-theme/80 uppercase tracking-widest">Lvl {user.level}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[14px] font-black font-mono text-theme leading-none">{user.xp.toLocaleString()}</div>
                                                        <div className="text-[7px] font-black text-tertiary/60 uppercase tracking-widest mt-1">Total XP</div>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[8px] font-black text-tertiary/40 uppercase tracking-widest">Project Progress</span>
                                                        <span className="text-[9px] font-black text-primary font-mono">{progress}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-glass rounded-full overflow-hidden">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${progress}%` }}
                                                            transition={{ duration: 1, ease: "easeOut" }}
                                                            className="h-full bg-gradient-to-r from-theme to-emerald-400"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="mt-4 pt-3 border-t border-glass/40">
                                                    <span className="text-[8px] font-black text-tertiary/40 uppercase tracking-widest block mb-1">Momentum Map</span>
                                                    <MiniProgressMap tasks={tasks} memberId={user._id} />
                                                </div>
                                            </motion.div>
                                        );
                                    }) : (
                                        <div className="text-center p-4 border border-dashed border-glass rounded-xl opacity-50">
                                            <span className="text-[9px] font-black text-tertiary uppercase">No Data Yet</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
});

// Mock Icon for Sidebar
const LayoutDashboard = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
);
