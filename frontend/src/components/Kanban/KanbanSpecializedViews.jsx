import React, { useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CalendarCheck2, ChevronLeft, ChevronRight, BellRing,
    Activity, Minus, Plus, Maximize2, User as UserIcon,
    CheckCircle2, AlertCircle, Link2, ZoomIn, ZoomOut, RotateCcw, ArrowRightLeft
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';
import { getOptimizedAvatar } from '../../utils/avatar';

/* ─────────────────────────────────────────────
   CalendarView
   ───────────────────────────────────────────── */
export const CalendarView = ({ tasks, onOpenTask }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [direction, setDirection] = useState(0);

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    const nextMonth = () => {
        setDirection(1);
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setDirection(-1);
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToToday = () => {
        const now = new Date();
        if (now.getMonth() === currentDate.getMonth() && now.getFullYear() === currentDate.getFullYear()) return;
        setDirection(now > currentDate ? 1 : -1);
        setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    };

    const calendarMatrix = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        const matrix = [];

        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            matrix.push({ day: daysInPrevMonth - i, month: month === 0 ? 11 : month - 1, year: month === 0 ? year - 1 : year, isGhost: true });
        }
        for (let i = 1; i <= daysInCurrentMonth; i++) {
            matrix.push({ day: i, month, year, isGhost: false });
        }
        const remainingSlots = 42 - matrix.length;
        for (let i = 1; i <= remainingSlots; i++) {
            matrix.push({ day: i, month: month === 11 ? 0 : month + 1, year: month === 11 ? year + 1 : year, isGhost: true });
        }
        return matrix;
    }, [currentDate]);

    const tasksByDate = useMemo(() => {
        const map = {};
        tasks.forEach(task => {
            if (!task.dueDate) return;
            const d = new Date(task.dueDate);
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            if (!map[key]) map[key] = [];
            map[key].push(task);
        });
        return map;
    }, [tasks]);

    const isToday = (d, m, y) => {
        const now = new Date();
        return now.getDate() === d && now.getMonth() === m && now.getFullYear() === y;
    };

    const variants = {
        enter: (direction) => ({ x: direction > 0 ? 50 : -50, opacity: 0, filter: 'blur(10px)' }),
        center: { x: 0, opacity: 1, filter: 'blur(0px)' },
        exit: (direction) => ({ x: direction < 0 ? 50 : -50, opacity: 0, filter: 'blur(10px)' })
    };

    return (
        <div className="relative bg-sunken/10 border border-white/[0.03] rounded-[3.5rem] p-10 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] backdrop-blur-3xl overflow-hidden">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-theme/5 rounded-full blur-[100px] pointer-events-none" />
            <header className="relative z-10 flex items-center justify-between mb-12">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-theme/20 to-transparent border border-theme/30 flex items-center justify-center shadow-2xl shadow-theme/10">
                        <CalendarCheck2 className="w-8 h-8 text-theme" />
                    </div>
                    <div>
                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.h2 key={currentDate.getMonth()} custom={direction} variants={variants} initial="enter" animate="center" className="text-4xl font-black text-white tracking-tighter uppercase mb-0.5">
                                {monthNames[currentDate.getMonth()]}
                            </motion.h2>
                        </AnimatePresence>
                        <span className="text-[12px] font-black text-theme tracking-[0.4em] uppercase opacity-70">{currentDate.getFullYear()}</span>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-black/40 p-2 rounded-[2rem] border border-white/5 backdrop-blur-md">
                    <button onClick={prevMonth} className="p-3 hover:bg-white/5 rounded-2xl transition-all text-gray-500 hover:text-white"><ChevronLeft className="w-6 h-6" /></button>
                    <button onClick={goToToday} className="px-6 py-2.5 text-[11px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-all bg-white/[0.02] hover:bg-white/[0.06] rounded-xl border border-white/5">Today</button>
                    <button onClick={nextMonth} className="p-3 hover:bg-white/5 rounded-2xl transition-all text-gray-500 hover:text-white"><ChevronRight className="w-6 h-6" /></button>
                </div>
            </header>
            <div className="relative z-10">
                <div className="grid grid-cols-7 gap-4 mb-6">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                        <div key={d} className="text-center"><span className="text-[10px] font-black text-tertiary uppercase tracking-[0.3em] opacity-40">{d}</span></div>
                    ))}
                </div>
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div key={currentDate.getTime()} custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ type: 'spring', damping: 25, stiffness: 120 }} className="grid grid-cols-7 gap-4">
                        {calendarMatrix.map((item, idx) => {
                            const dateTasks = tasksByDate[`${item.year}-${item.month}-${item.day}`] || [];
                            const today = isToday(item.day, item.month, item.year);
                            return (
                                <div key={idx} className={twMerge(clsx("min-h-[160px] p-4 rounded-[2.5rem] border transition-all duration-500 group relative overflow-hidden", item.isGhost ? "bg-white/[0.01] border-transparent opacity-20 grayscale" : "bg-white/[0.03] border-white/5 hover:border-theme/40 hover:bg-white/[0.06] shadow-xl", today && "border-theme bg-theme/[0.08] shadow-[inset_0_0_40px_rgba(var(--theme-rgb),0.1)]"))}>
                                    <div className="relative z-10 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className={clsx("text-2xl font-black font-mono tracking-tighter transition-all duration-500", today ? "text-theme scale-110" : "text-gray-600 group-hover:text-white")}>{item.day}</span>
                                            {dateTasks.length > 0 && <div className="flex -space-x-1">{dateTasks.slice(0, 3).map((t, i) => <div key={i} className={clsx("w-2 h-2 rounded-full border border-black", t.priority === 'Urgent' ? 'bg-danger' : (t.priority === 'High' ? 'bg-warning' : 'bg-theme'))} />)}</div>}
                                        </div>
                                        <div className="space-y-2">
                                            {dateTasks.slice(0, 3).map(task => (
                                                <button key={task._id} onClick={() => onOpenTask(task)} className="w-full text-left p-2.5 rounded-2xl bg-black/40 border border-white/5 hover:border-theme/30 transition-all flex flex-col gap-1 backdrop-blur-xl group/card shadow-lg">
                                                    <div className="flex items-center justify-between"><span className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em]">{task.type}</span>{task.priority === 'Urgent' && <BellRing className="w-2 h-2 text-danger animate-pulse" />}</div>
                                                    <p className="text-[10px] font-bold text-white leading-tight line-clamp-2 group-hover/card:text-theme">{task.title}</p>
                                                </button>
                                            ))}
                                            {dateTasks.length > 3 && <div className="text-center py-1.5 bg-theme/5 rounded-xl border border-theme/10 group-hover:bg-theme transition-all"><span className="text-[8px] font-black text-theme group-hover:text-white uppercase tracking-widest">+ {dateTasks.length - 3} Tasks</span></div>}
                                        </div>
                                    </div>
                                    {today && <div className="absolute -bottom-1 -right-1 w-12 h-12 bg-theme/20 blur-2xl rounded-full" />}
                                </div>
                            );
                        })}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────
   TimelineView
   ───────────────────────────────────────────── */
export const TimelineView = ({ tasks, onOpenTask }) => {
    const [zoom, setZoom] = useState(1);
    const timelineRef = useRef(null);

    const roadmapTasks = useMemo(() => tasks.filter(t => t.dueDate).sort((a,b) => new Date(a.startDate || a.dueDate) - new Date(b.startDate || b.dueDate)), [tasks]);

    const timelineRange = useMemo(() => {
        if (roadmapTasks.length === 0) return { start: new Date(), end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) };
        const start = new Date(Math.min(...roadmapTasks.map(t => new Date(t.startDate || t.dueDate))));
        const end = new Date(Math.max(...roadmapTasks.map(t => new Date(t.dueDate))));
        start.setDate(start.getDate() - 2);
        end.setDate(end.getDate() + 5);
        return { start, end };
    }, [roadmapTasks]);

    const totalDays = Math.ceil((timelineRange.end - timelineRange.start) / (24 * 60 * 60 * 1000));
    const dayWidth = 100 * zoom;

    return (
        <div className="bg-sunken/20 border border-white/[0.03] rounded-[3rem] p-8 shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col">
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-theme/10 border border-theme/20 flex items-center justify-center shadow-lg shadow-theme/5"><Activity className="w-6 h-6 text-theme" /></div>
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Roadmap Timeline</h2>
                        <p className="text-[10px] font-black text-theme tracking-[0.4em] uppercase opacity-60">Project Roadmap</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                        <button onClick={() => setZoom(Math.max(0.5, zoom - 0.2))} className="p-2 hover:bg-white/5 rounded-lg transition-all text-gray-500 hover:text-white"><Minus className="w-4 h-4" /></button>
                        <span className="text-[9px] font-black text-gray-500 uppercase px-2">{Math.round((zoom || 0) * 100)}%</span>
                        <button onClick={() => setZoom(Math.min(2, zoom + 0.2))} className="p-2 hover:bg-white/5 rounded-lg transition-all text-gray-500 hover:text-white"><Plus className="w-4 h-4" /></button>
                    </div>
                </div>
            </header>
            <div className="flex-1 overflow-x-auto custom-scrollbar pb-6" ref={timelineRef}>
                <div style={{ width: (totalDays || 1) * dayWidth }} className="relative min-h-[500px]">
                    <div className="flex border-b border-white/5 mb-8">
                        {Array.from({ length: totalDays }).map((_, i) => {
                            const date = new Date(timelineRange.start.getTime() + i * 24 * 60 * 60 * 1000);
                            return (
                                <div key={i} style={{ width: dayWidth }} className="shrink-0 py-4 text-center border-r border-white/[0.02]">
                                    <span className="text-[8px] font-black text-tertiary uppercase tracking-widest block mb-1">{date.toLocaleDateString([], { weekday: 'short' })}</span>
                                    <span className="text-sm font-black text-primary font-mono">{date.getDate()}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="space-y-4 pt-4 relative z-10">
                        {roadmapTasks.map((task, idx) => {
                            const start = task.startDate ? new Date(task.startDate) : new Date(task.dueDate);
                            const end = new Date(task.dueDate);
                            const startOffset = (start - timelineRange.start) / (24 * 60 * 60 * 1000);
                            const duration = Math.max(0.5, (end - start) / (24 * 60 * 60 * 1000));
                            const isMilestone = !task.startDate;
                            const priorityColor = task.priority === 'Urgent' ? 'rgba(239, 68, 68, 0.4)' : (task.priority === 'High' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(var(--theme-rgb), 0.4)');
                            return (
                                <motion.div key={task._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} style={{ left: startOffset * dayWidth, width: isMilestone ? 40 : duration * dayWidth, backgroundColor: isMilestone ? 'transparent' : priorityColor, borderColor: isMilestone ? 'transparent' : priorityColor.replace('0.4', '0.6') }} onClick={() => onOpenTask(task)} className={twMerge(clsx("relative h-14 flex flex-col justify-center", !isMilestone ? "rounded-2xl border-2 p-3 group cursor-pointer hover:scale-[1.02] shadow-2xl backdrop-blur-md overflow-hidden" : "cursor-pointer group"))}>
                                    {!isMilestone ? (
                                        <div className="flex items-center gap-3 relative z-10">
                                            <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center shrink-0 border border-white/10 group-hover:border-theme/40">
                                                {(task.assignees?.[0] || task.assignee) ? <img src={getOptimizedAvatar((task.assignees?.[0] || task.assignee).avatar, 'xs')} className="w-full h-full object-cover" alt="" /> : <UserIcon className="w-4 h-4 text-theme/60" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black text-white truncate leading-none mb-1">{task.title}</p>
                                                <span className="text-[7px] font-black text-white/40 uppercase tracking-widest">{task.status}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center"><div className="w-4 h-4 rounded-sm rotate-45 bg-theme border-2 border-white/20 shadow-[0_0_15px_rgba(var(--theme-rgb),0.5)]" /></div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────
   DependencyMapView
   ───────────────────────────────────────────── */
const PRIORITY_COLORS = { Urgent: '#ef4444', High: '#f59e0b', Medium: 'var(--theme)', Low: '#6b7280' };
const STATUS_RING = { Completed: '#10b981', 'In Progress': 'var(--theme)', Pending: '#6b7280', Canceled: '#374151' };

const layoutNodes = (tasks) => {
    const COLS = Math.ceil(Math.sqrt(tasks.length));
    const H_GAP = 260; const V_GAP = 140;
    return tasks.map((task, i) => ({ ...task, x: (i % COLS) * H_GAP + 80 + (Math.floor(i / COLS) % 2 === 0 ? 0 : H_GAP / 2), y: Math.floor(i / COLS) * V_GAP + 80 }));
};

const TaskNode = ({ node, isBlocked, isCompleted, onOpen }) => {
    const color = PRIORITY_COLORS[node.priority] || '#6b7280';
    const ring = STATUS_RING[node.status] || '#6b7280';
    return (
        <foreignObject x={node.x - 100} y={node.y - 36} width={200} height={72} style={{ overflow: 'visible' }}>
            <div onClick={() => onOpen(node)} className="group relative w-[200px] cursor-pointer">
                <div className="relative p-3 rounded-2xl border transition-all duration-200 hover:scale-105" style={{ background: 'rgba(13,13,16,0.95)', borderColor: isBlocked ? '#ef444440' : isCompleted ? '#10b98140' : `${color}30`, boxShadow: isBlocked ? '0 0 16px rgba(239,68,68,0.15)' : isCompleted ? '0 0 16px rgba(16,185,129,0.15)' : `0 0 16px ${color}15` }}>
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0d0d10]" style={{ backgroundColor: ring }} />
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <p className="text-[10px] font-black text-white truncate flex-1">{node.title}</p>
                    </div>
                </div>
            </div>
        </foreignObject>
    );
};

const DependencyEdge = ({ fromNode, toNode, isResolved }) => {
    if (!fromNode || !toNode) return null;
    const x1 = fromNode.x, y1 = fromNode.y, x2 = toNode.x, y2 = toNode.y;
    const mx = (x1 + x2) / 2;
    const d = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
    const color = isResolved ? '#10b981' : '#ef4444';
    return <path d={d} stroke={color} strokeWidth="1.5" strokeOpacity="0.4" fill="none" strokeDasharray={isResolved ? "none" : "6 3"} className="transition-all" />;
};

export const DependencyMapView = ({ tasks = [], onOpenTask }) => {
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const isPanning = useRef(false);
    const lastMouse = useRef({ x: 0, y: 0 });

    const layouted = useMemo(() => layoutNodes(tasks), [tasks]);
    const nodeMap = useMemo(() => Object.fromEntries(layouted.map(n => [n._id, n])), [layouted]);
    const edges = useMemo(() => {
        const res = [];
        layouted.forEach(task => { (task.dependencies?.blockedBy || []).forEach(dep => { const depId = dep._id || dep; res.push({ from: depId, to: task._id, isResolved: nodeMap[depId]?.status === 'Completed' }); }); });
        return res;
    }, [layouted, nodeMap]);

    if (tasks.length === 0) return <div className="flex-1 flex items-center justify-center p-20 opacity-30 text-tertiary uppercase tracking-widest text-[10px]">No dependencies mapping available</div>;

    return (
        <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-2 pb-3 shrink-0">
                <div className="flex items-center gap-1">
                    <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="w-7 h-7 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-tertiary"><ZoomIn className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="w-7 h-7 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-tertiary"><ZoomOut className="w-3.5 h-3.5" /></button>
                </div>
            </div>
            <div className="flex-1 overflow-hidden rounded-[2rem] bg-black/20 border border-white/5 relative cursor-grab active:cursor-grabbing" onMouseDown={(e) => { isPanning.current = true; lastMouse.current = { x: e.clientX, y: e.clientY }; }} onMouseMove={(e) => { if (isPanning.current) { const dx = e.clientX - lastMouse.current.x, dy = e.clientY - lastMouse.current.y; setPan(p => ({ x: p.x + dx, y: p.y + dy })); lastMouse.current = { x: e.clientX, y: e.clientY }; } }} onMouseUp={() => isPanning.current = false} onMouseLeave={() => isPanning.current = false}>
                <svg width="100%" height="100%" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center center' }}>
                    {edges.map((edge, i) => <DependencyEdge key={i} fromNode={nodeMap[edge.from]} toNode={nodeMap[edge.to]} isResolved={edge.isResolved} />)}
                    {layouted.map(node => <TaskNode key={node._id} node={node} isBlocked={edges.some(e => e.to === node._id)} isCompleted={node.status === 'Completed'} onOpen={onOpenTask} />)}
                </svg>
            </div>
        </div>
    );
};
