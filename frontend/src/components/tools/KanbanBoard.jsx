import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { api } from '../../store/useAuthStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSocketSync } from '../../hooks/useSocketSync';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
    Clock, 
    AlertCircle, 
    CheckCircle2, 
    MoreVertical, 
    GripVertical, 
    Plus,
    Calendar,
    User as UserIcon,
    Flame,
    Zap,
    MessageSquare,
    Link as LinkIcon
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Card from '../ui/Card';


/**
 * Modern 2026 TaskCard
 * High-vibrance interactions with Glassmorphism 2.0
 */
const TaskCard = React.memo(({ task, onDragStart }) => {
    const priorityStyles = {
        Urgent: "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/5",
        High: "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/5",
        Medium: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-cyan-500/5",
        Low: "bg-gray-500/10 text-gray-400 border-white/5"
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98, rotate: -1 }}
            draggable
            onDragStart={(e) => onDragStart(e, task._id, task.status)}
            className="group relative cursor-grab active:cursor-grabbing"
        >
            <Card className="overflow-hidden border-white/5 hover:border-white/10 transition-colors shadow-2xl" padding="p-5">
                <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 overflow-hidden">
                             <h4 className="text-sm font-black text-white tracking-tight truncate group-hover:text-cyan-400 transition-colors">
                                {task.title}
                            </h4>
                            <p className="text-[10px] text-gray-500 font-medium line-clamp-2 leading-relaxed">
                                {task.description || "Operational directive parameters pending definition."}
                            </p>
                        </div>
                        <button className="p-2 -mr-2 text-gray-700 hover:text-white transition-colors">
                            <MoreVertical className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {task.priority && (
                            <div className={twMerge(clsx(
                                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all",
                                priorityStyles[task.priority] || priorityStyles.Low
                            ))}>
                                <Flame className="w-3 h-3" />
                                {task.priority}
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/5 rounded-lg text-[9px] font-black text-gray-500 uppercase tracking-widest">
                            <Clock className="w-3 h-3" />
                            {new Date(task.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </div>
                    </div>

                    <footer className="pt-2 flex items-center justify-between border-t border-white/5">
                        <div className="flex -space-x-2">
                            {[1, 2].map(i => (
                                <div key={i} className="w-6 h-6 rounded-lg bg-[#09090b] border border-white/10 flex items-center justify-center overflow-hidden shadow-lg">
                                    <UserIcon className="w-3 h-3 text-gray-700" />
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-3 text-gray-700">
                             <div className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                <span className="text-[9px] font-black">4</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <LinkIcon className="w-3 h-3" />
                                <span className="text-[9px] font-black">1</span>
                            </div>
                        </div>
                    </footer>
                </div>

                {/* Ambient Interaction Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </Card>
        </motion.div>
    );
});

TaskCard.displayName = 'TaskCard';

const KanbanBoard = ({ projectId, searchQuery = '' }) => {
    const queryClient = useQueryClient();
    const socketRef = useRef(null);

    useSocketSync(projectId);

    const { data: rawTasks = [], isLoading } = useQuery({
        queryKey: ['tasks', projectId],
        queryFn: async () => {
            const res = await api.get(`/projects/${projectId}/tasks`);
            return res.data.data;
        },
        enabled: !!projectId,
    });

    const updateTaskMutation = useMutation({
        mutationFn: async ({ taskId, newStatus }) => {
            await api.put(`/tasks/${taskId}`, { status: newStatus });
        },
        onMutate: async ({ taskId, newStatus }) => {
            await queryClient.cancelQueries({ queryKey: ['tasks', projectId] });
            const previousTasks = queryClient.getQueryData(['tasks', projectId]);

            queryClient.setQueryData(['tasks', projectId], (old) => {
                if (!old) return [];
                return old.map(t => t._id === taskId ? { ...t, status: newStatus } : t);
            });

            return { previousTasks };
        },
        onError: (err, variables, context) => {
            if (context?.previousTasks) {
                queryClient.setQueryData(['tasks', projectId], context.previousTasks);
            }
        }
    });

    const filteredTasks = useMemo(() => {
        let filtered = rawTasks;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = rawTasks.filter(t => 
                t.title.toLowerCase().includes(q) || 
                t.description?.toLowerCase().includes(q)
            );
        }

        const grouped = { Pending: [], 'In Progress': [], Completed: [] };
        filtered.forEach(task => {
            if (grouped[task.status]) grouped[task.status].push(task);
        });
        return grouped;
    }, [rawTasks, searchQuery]);

    const handleDragStart = useCallback((e, taskId, currentStatus) => {
        e.dataTransfer.setData('taskId', taskId);
        e.dataTransfer.setData('currentStatus', currentStatus);
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
    }, []);

    const handleDrop = useCallback(async (e, newStatus) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        const currentStatus = e.dataTransfer.getData('currentStatus');

        if (currentStatus === newStatus) return;

        updateTaskMutation.mutate({ taskId, newStatus });
        // Socket emission happens via the backend usually or direct if client-side emit is set up
    }, [updateTaskMutation]);

    const columns = [
        { id: 'Pending', label: 'Backlog', icon: Clock, color: 'text-gray-500' },
        { id: 'In Progress', label: 'Active Sync', icon: Zap, color: 'text-cyan-400' },
        { id: 'Completed', label: 'Finalized', icon: CheckCircle2, color: 'text-emerald-400' }
    ];

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 h-[600px]">
                {[1, 2, 3].map(i => (
                    <div key={i} className="glass-2 bg-white/[0.02] border border-white/5 rounded-[3rem] animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {columns.map(col => (
                <div
                    key={col.id}
                    className="flex flex-col min-w-0"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.id)}
                >
                    <div className="flex items-center justify-between mb-6 px-4">
                        <div className="flex items-center gap-3">
                            <div className={twMerge(clsx("p-2 rounded-xl bg-white/5 border border-white/5 shadow-xl", col.color))}>
                                <col.icon className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-sm font-black text-white uppercase tracking-widest">{col.label}</h2>
                                <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">{filteredTasks[col.id].length} Node(s)</span>
                            </div>
                        </div>
                        <button className="p-2 text-gray-700 hover:text-white transition-colors">
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-5 min-h-[400px] p-2 rounded-[3.5rem] bg-black/10 border border-white/[0.02] flex flex-col">
                        <AnimatePresence mode="popLayout">
                            {filteredTasks[col.id].map(task => (
                                <TaskCard
                                    key={task._id}
                                    task={task}
                                    onDragStart={handleDragStart}
                                />
                            ))}
                        </AnimatePresence>
                        {filteredTasks[col.id].length === 0 && (
                            <div className="flex-1 flex flex-col items-center justify-center py-10 opacity-20 group">
                                <col.icon className="w-8 h-8 text-gray-600 mb-3 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-700">Empty Segment</span>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default KanbanBoard;
