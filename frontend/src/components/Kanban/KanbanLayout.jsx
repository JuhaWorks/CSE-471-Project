import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BarChart3, Activity, Plus, Layers, X, LayoutGrid, ChevronDown
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';
import TaskCard from './TaskCard';

/* ─────────────────────────────────────────────
   Stat card
   ───────────────────────────────────────────── */
export const StatCard = React.memo(({ label, value, accent, isFirst }) => {
    return (
        <div className={twMerge(clsx(
            'flex items-center gap-6 px-6 py-2.5 relative',
            !isFirst && 'before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-[1px] before:bg-white/[0.12]',
            'shrink-0'
        ))}>
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-tertiary uppercase tracking-[0.25em] opacity-80 leading-none mb-2">
                    {label}
                </span>
                <div className="flex items-center gap-3">
                    <span className="text-[20px] font-black text-primary leading-none tabular-nums font-mono tracking-tighter">
                        {value}
                    </span>
                    <div
                        className="w-1.5 h-1.5 rounded-full opacity-100"
                        style={{ backgroundColor: accent }}
                    />
                </div>
            </div>
        </div>
    );
});

/* ─────────────────────────────────────────────
   Column header
   ───────────────────────────────────────────── */
export const ColumnHeader = React.memo(({ col, onQuickAdd, isCompact, onToggleCompact }) => {
    return (
        <div className="flex items-center justify-between px-1 mb-2 shrink-0">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: col.color }} />
                <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.16em]">
                    {col.title}
                </h3>
                <span className={twMerge(clsx(
                    'px-1.5 py-0.5 rounded-md text-[9px] font-semibold tabular-nums',
                    'bg-white/[0.04] border border-white/[0.06] text-zinc-500',
                    col.isOverLimit && 'bg-red-500/10 border-red-500/20 text-red-400 animate-pulse'
                ))}>
                    {col.taskCount}{col.wipLimit > 0 ? `\u00a0/\u00a0${col.wipLimit}` : ''}
                </span>
            </div>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onToggleCompact(col.id)}
                    title={isCompact ? 'Expand column' : 'Stack column'}
                    className={twMerge(clsx(
                        'p-1 rounded-lg transition-all',
                        isCompact 
                            ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20' 
                            : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04]'
                    ))}
                >
                    <Layers className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={() => onQuickAdd(col.id)}
                    className="p-1 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04] transition-all"
                >
                    <Plus className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
});

/* ─────────────────────────────────────────────
   Quick-add form
   ───────────────────────────────────────────── */
export const QuickAddForm = React.memo(({ onSubmit, onCancel, value, onChange, type, onTypeChange }) => {
    const types = [
        { id: 'Task', color: 'text-slate-500' },
        { id: 'Story', color: 'text-indigo-500' },
        { id: 'Bug', color: 'text-rose-500' },
        { id: 'Security', color: 'text-rose-600' }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="rounded-xl bg-[#1a1a1e] border border-white/10 shadow-lg overflow-hidden mb-2 shadow-2xl"
        >
            <form onSubmit={onSubmit} className="p-2.5 flex flex-col gap-2.5">
                <input
                    autoFocus
                    value={value}
                    onChange={onChange}
                    placeholder="Task title…"
                    className="w-full bg-transparent text-[11px] font-bold text-white placeholder-zinc-600 focus:outline-none px-1 uppercase tracking-tight"
                />
                <div className="flex items-center justify-between gap-1.5 px-0.5">
                    <div className="flex items-center gap-1.5">
                        {types.map(t => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => onTypeChange(t.id)}
                                className={twMerge(clsx(
                                    "px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest transition-all",
                                    type === t.id ? `bg-theme/20 ${t.color}` : "text-zinc-600 hover:text-zinc-400"
                                ))}
                            >
                                {t.id}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="p-1 rounded-lg text-zinc-600 hover:text-zinc-400 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </form>
        </motion.div>
    );
});

/* ─────────────────────────────────────────────
   KanbanColumn
   ───────────────────────────────────────────── */
export const KanbanColumn = React.memo(({
    col, tasks, isCompact, isDragOver,
    onDragOver, onDragLeave, onDrop,
    onDragStart, onOpenTask, onSelectTask,
    onToggleSubtask, blockedTaskIds, selectedTaskIds,
    quickAddCol, quickAddTitle, onQuickAddTitle,
    quickAddType, onQuickAddType,
    onQuickAddSubmit, onQuickAddOpen, onQuickAddCancel,
    onToggleCompact, isMobile,
}) => {
    return (
        <div className="flex flex-col h-full" style={{ minWidth: isMobile ? '100%' : 280, flex: 1 }}>
            <ColumnHeader 
                col={col} 
                onQuickAdd={onQuickAddOpen} 
                isCompact={isCompact}
                onToggleCompact={onToggleCompact}
            />

            <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={twMerge(clsx(
                    'flex-1 min-h-[200px] transition-all duration-300',
                    'flex flex-col',
                    isDragOver && 'bg-theme/5 rounded-2xl ring-1 ring-theme/20',
                    col.isOverLimit && !isDragOver && 'bg-danger/[0.02] rounded-2xl ring-1 ring-danger/10',
                ))}
            >
                <div
                    className={twMerge(clsx(
                        'flex-1 p-2.5 overflow-y-auto',
                        isCompact ? 'flex flex-col pt-4' : 'flex flex-col gap-2.5',
                    ))}
                >
                    <AnimatePresence>
                        {quickAddCol && (
                            <QuickAddForm
                                value={quickAddTitle}
                                onChange={(e) => onQuickAddTitle(e.target.value)}
                                type={quickAddType}
                                onTypeChange={onQuickAddType}
                                onSubmit={onQuickAddSubmit}
                                onCancel={onQuickAddCancel}
                            />
                        )}
                    </AnimatePresence>

                    <AnimatePresence mode="popLayout">
                        {tasks.map((task, idx) => (
                            <div
                                key={task._id}
                                className={twMerge(clsx(
                                    "transition-all duration-300",
                                    isCompact && "hover:z-[100] hover:-translate-y-1"
                                ))}
                                style={isCompact ? {
                                    marginTop: idx > 0 ? '-115px' : 0,
                                    zIndex: idx + 1,
                                    position: 'relative',
                                } : undefined}
                            >
                                <TaskCard
                                    task={task}
                                    isSelected={selectedTaskIds.includes(task._id)}
                                    isBlocked={blockedTaskIds.has(task._id)}
                                    onDragStart={onDragStart}
                                    onOpen={onOpenTask}
                                    onSelect={onSelectTask}
                                    onToggleSubtask={onToggleSubtask}
                                    isCompact={isCompact}
                                />
                            </div>
                        ))}
                    </AnimatePresence>

                    {tasks.length === 0 && !quickAddCol && (
                        <div className="flex-1 flex items-center justify-center py-8">
                            <span className="text-[10px] font-medium text-zinc-700 tracking-wide">
                                Drop tasks here
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

/* ─────────────────────────────────────────────
   SelectControl
   ───────────────────────────────────────────── */
export const SelectControl = ({ icon: Icon, label, value, onChange, options }) => {
    return (
        <div className="relative group shrink-0">
            <label className={clsx(
                'flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer h-10',
                'bg-sunken/40 border border-subtle group-hover:border-theme/40 group-hover:bg-sunken/60',
            )}>
                {Icon && <Icon className="w-4 h-4 text-tertiary/60 shrink-0 group-hover:text-theme/70 transition-colors" />}
                {label && <span className="text-[10px] font-black text-tertiary/40 uppercase tracking-[0.18em] shrink-0">{label}</span>}
                <div className="relative flex items-center min-w-0">
                    <select
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="bg-transparent text-[11px] font-black text-primary uppercase tracking-[0.2em] outline-none cursor-pointer appearance-none pr-7 min-w-0 truncate"
                    >
                        {options.map(o => (
                            <option key={o.value} value={o.value} className="bg-[#0c0c0e] normal-case font-normal text-sm">
                                {o.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-0 w-3.5 h-3.5 text-tertiary/40 pointer-events-none transition-transform group-hover:text-theme/70 group-hover:translate-y-0.5" />
                </div>
            </label>
        </div>
    );
}
