import React from 'react';
import { motion } from 'framer-motion';
import { 
    Layers, 
    Calendar as CalendarIcon, 
    User as UserIcon, 
    MessageSquare, 
    CheckSquare,
    AlertCircle,
    ChevronDown,
    CheckCircle2
} from 'lucide-react';

/**
 * Professional TaskCard
 */
const TaskCard = React.memo(({ task, isSelected, onDragStart, onOpen, onSelect, onToggleSubtask }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    
    const priorityStyles = {
        Urgent: "bg-danger/10 text-danger border-danger/20 shadow-danger/5",
        High: "bg-warning/10 text-warning border-warning/20 shadow-warning/5",
        Medium: "bg-theme/10 text-theme border-theme/20 shadow-theme/5",
        Low: "bg-tertiary/10 text-tertiary border-subtle"
    };

    const isDueToday = task.dueDate && new Date(task.dueDate).toDateString() === new Date().toDateString();
    const isUrgent = task.priority === 'Urgent';
    const isBlocked = task.dependencies?.blockedBy?.length > 0;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -4, scale: 1.02, zIndex: 10 }}
            whileTap={{ scale: 0.98 }}
            whileDrag={{ 
                scale: 1.06, 
                rotateX: 12, 
                rotateY: 10,
                zIndex: 50,
                transition: { type: "spring", stiffness: 400, damping: 25 }
            }}
            draggable
            onDragStart={(e) => onDragStart(e, task._id, task.status)}
            onClick={(e) => {
                if (e.shiftKey || e.ctrlKey || e.metaKey) {
                    onSelect(e, task._id);
                } else {
                    onOpen(task);
                }
            }}
            className={twMerge(clsx(
                "group relative cursor-pointer perspective-1000",
                isSelected && "z-20"
            ))}
        >
            {/* Ambient Glows */}
            <div className={twMerge(clsx(
                "absolute -inset-1 rounded-[1.2rem] blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500",
                isUrgent && "opacity-30 animate-glow-pulse-red bg-danger/20",
                isDueToday && "opacity-30 bg-warning/20",
                isSelected && "opacity-50 bg-theme/30"
            ))} />

            <Card 
                className={twMerge(clsx(
                    "overflow-hidden border-subtle transition-all shadow-2xl bg-surface relative",
                    isSelected ? "border-theme ring-2 ring-theme/20 ring-offset-2 ring-offset-black/20" : "hover:border-theme/30",
                    isUrgent && "border-danger/30 animate-glow-pulse-red",
                    isDueToday && "border-warning/40 shadow-[0_0_15px_rgba(var(--warning-rgb),0.2)]",
                    isBlocked && "border-rose-500/30"
                ))} 
                padding="p-0"
            >
                {/* Status Overlays */}
                {isDueToday && (
                    <div className="absolute inset-0 z-0 pointer-events-none animate-shimmer-gold opacity-30" />
                )}
                {isSelected && (
                    <div className="absolute inset-x-0 top-0 h-1 bg-theme shadow-[0_0_10px_rgba(var(--theme-rgb),0.5)] z-20" />
                )}

                <div className="relative z-10 p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 overflow-hidden">
                             <div className="flex items-center gap-2">
                                <h4 className="text-sm font-black text-primary tracking-tight truncate group-hover:text-theme transition-colors">
                                    {task.title}
                                </h4>
                                {isBlocked && (
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-[7px] font-black text-rose-500 uppercase tracking-widest">
                                        <AlertCircle className="w-2 h-2" />
                                        Blocked
                                    </div>
                                )}
                             </div>
                            <p className="text-[10px] text-tertiary font-medium line-clamp-2 leading-relaxed">
                                {task.description || "No description provided."}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {task.priority && (
                            <div className={twMerge(clsx(
                                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all",
                                priorityStyles[task.priority] || priorityStyles.Low,
                                isUrgent && "animate-pulse shadow-[0_0_10px_rgba(var(--danger-rgb),0.3)]"
                            ))}>
                                <Layers className="w-3 h-3" />
                                {task.priority}
                            </div>
                        )}
                        {task.dueDate && (
                            <div className={twMerge(clsx(
                                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all",
                                isDueToday ? "bg-warning/10 text-warning border-warning/30" : 
                                (new Date(task.dueDate) < new Date() && task.status !== 'Completed' 
                                    ? "bg-danger/10 text-danger border-danger/20 animate-pulse" 
                                    : "bg-sunken border-subtle text-tertiary")
                            ))}>
                                <CalendarIcon className="w-3 h-3" />
                                {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </div>
                        )}
                    </div>

                    {/* Progress & Quick Toggle */}
                    {task.subtasks?.length > 0 && (
                        <div className="space-y-2">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                                className="w-full flex justify-between items-center group/exp"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-tertiary">Progress</span>
                                    <span className="text-[8px] font-black text-theme">{Math.round((task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100)}%</span>
                                </div>
                                <ChevronDown className={twMerge(clsx("w-3 h-3 text-tertiary transition-transform group-hover/exp:text-theme", isExpanded && "rotate-180"))} />
                            </button>
                            
                            <div className="h-1 w-full bg-sunken rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%` }}
                                    className="h-full bg-theme shadow-[0_0_8px_rgba(var(--theme-rgb),0.3)]"
                                />
                            </div>

                            {/* In-line Checklist */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden bg-black/20 rounded-xl mt-1 py-1"
                                    >
                                        {task.subtasks.map(sub => (
                                            <button 
                                                key={sub.id}
                                                onClick={(e) => { e.stopPropagation(); onToggleSubtask(task._id, sub.id); }}
                                                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/[0.04] transition-colors group/sub"
                                            >
                                                <div className={twMerge(clsx(
                                                    "w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all",
                                                    sub.completed ? "bg-theme border-theme" : "border-white/10 group-hover/sub:border-theme/40"
                                                ))}>
                                                    {sub.completed && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                                                </div>
                                                <span className={twMerge(clsx(
                                                    "text-[9px] font-bold text-left",
                                                    sub.completed ? "text-tertiary line-through" : "text-white/70 group-hover/sub:text-white"
                                                ))}>
                                                    {sub.title}
                                                </span>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {task.labels?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {task.labels.map(labelId => (
                                <div key={labelId} className="px-1.5 py-0.5 rounded-md bg-theme/10 border border-theme/20 text-[7px] font-black uppercase text-theme">
                                    {labelId}
                                </div>
                            ))}
                        </div>
                    )}

                    <footer className="pt-2 flex items-center justify-between border-t border-subtle">
                        <div className="flex items-center -space-x-2 overflow-hidden">
                            {(task.assignees?.length > 0 ? task.assignees : (task.assignee ? [task.assignee] : [])).map((assignee, idx) => (
                                <div key={assignee._id || idx} className="relative group/avatar">
                                    <div className="w-6 h-6 rounded-lg overflow-hidden bg-sunken border-2 border-surface shadow-sm transition-transform group-hover/avatar:-translate-y-1">
                                        {assignee.avatar ? (
                                            <img 
                                                src={getOptimizedAvatar(assignee.avatar, 'xs')} 
                                                alt={assignee.name} 
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[8px] font-black text-theme">
                                                {assignee.name?.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-[8px] text-white rounded opacity-0 group-hover/avatar:opacity-100 pointer-events-none whitespace-nowrap z-20">
                                        {assignee.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-3 text-tertiary opacity-40">
                             <div className="flex items-center gap-1">
                                <MessageSquare className="w-2.5 h-2.5" />
                                <span className="text-[8px] font-black">{task.commentsCount || 0}</span>
                            </div>
                             <div className="flex items-center gap-1">
                                <CheckSquare className="w-2.5 h-2.5" />
                                <span className="text-[8px] font-black">
                                    {task.subtasks?.filter(s => s.completed).length || 0}/{task.subtasks?.length || 0}
                                </span>
                            </div>
                        </div>
                    </footer>
                </div>
            </Card>
        </motion.div>
    );
});


TaskCard.displayName = 'TaskCard';

export default TaskCard;
