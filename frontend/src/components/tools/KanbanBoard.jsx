import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { api, useAuthStore } from '../../store/useAuthStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSocketSync } from '../../hooks/useSocketSync';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Clock, 
    CheckCircle2, 
    Plus,
    Search,
    BarChart3,
    ShieldCheck,
    Layers,
    Activity,
    Filter,
    History
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Card from '../ui/Card';
import { Skeleton } from '../ui/PremiumLoaders';
import { toast } from 'react-hot-toast';

// Modular Components
import TaskCard from './Kanban/TaskCard';
import TaskDetailModal from './Kanban/TaskDetailModal';
import CalendarView from './Kanban/CalendarView';
import TimelineView from './Kanban/TimelineView';

/**
 * Interactive Kanban Board
 * Refactored from monolithic structure for high performance and maintainability.
 */
const KanbanBoard = ({ projectId, searchQuery = '', triggerQuickAdd, quickFilter = 'All' }) => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [selectedTask, setSelectedTask] = useState(null);
    const [viewMode, setViewMode] = useState('Board'); // Board, Calendar, Timeline
    const [celebrationActive, setCelebrationActive] = useState(false);
    const [dragOverCol, setDragOverCol] = useState(null);
    const [quickAddCol, setQuickAddCol] = useState(null);
    const [quickAddTitle, setQuickAddTitle] = useState('');
    const [selectedTaskIds, setSelectedTaskIds] = useState([]);


    // Filters
    const [filterPriority, setFilterPriority] = useState('All');
    const [filterAssignee, setFilterAssignee] = useState('All');
    const [filterDeadline, setFilterDeadline] = useState('All');
    const [swimlane, setSwimlane] = useState('None'); // None, Assignee, Priority

    // Socket Synchronization
    useSocketSync(projectId);

    // Initial Create Trigger
    const handleInitCreate = useCallback(() => {
        setSelectedTask({
            _id: undefined,
            title: '',
            description: '',
            status: 'Pending',
            priority: 'Medium',
            type: 'Task',
            assignee: null,
            subtasks: []
        });
    }, []);

    useEffect(() => {
        if (triggerQuickAdd > 0) {
            handleInitCreate();
        }
    }, [triggerQuickAdd, handleInitCreate]);

    // Data Fetching
    const { data: project } = useQuery({
        queryKey: ['project', projectId],
        queryFn: async () => (await api.get(`/projects/${projectId}`)).data.data,
        enabled: !!projectId
    });

    const members = useMemo(() => project?.members || [], [project]);

    const { data: rawTasks = [], isLoading } = useQuery({
        queryKey: ['tasks', projectId],
        queryFn: async () => {
            const url = projectId ? `/projects/${projectId}/tasks` : '/tasks';
            const res = await api.get(url);
            return res.data.data;
        },
        enabled: true, // Always enabled now
    });

    // Mutations
    const createTaskMutation = useMutation({
        mutationFn: async (data) => {
            const res = await api.post(`/projects/${projectId}/tasks`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
            toast.success('Task created successfully');
        },
        onError: (err) => {
            const msg = err.response?.data?.message || 'Failed to create task';
            toast.error(msg, { duration: 4000 });
        }
    });

    const updateTaskMutation = useMutation({
        mutationFn: async ({ id, updates }) => {
            const res = await api.put(`/tasks/${id}`, updates);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
        }
    });

    const bulkUpdateTaskMutation = useMutation({
        mutationFn: async ({ taskIds, updates }) => {
            const res = await api.patch('/tasks/bulk-update', { taskIds, updates });
            return res.data;
        },
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
            setSelectedTaskIds([]);
            toast.success(`Moved ${res.count} tasks successfully`);
        }
    });

    const deleteTaskMutation = useMutation({
        mutationFn: async (taskId) => {
            await api.delete(`/tasks/${taskId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
            setSelectedTask(null);
            toast.success('Task removed');
        },
        onError: () => toast.error('Failed to remove task')
    });

    // Board Configuration
    const allColumns = useMemo(() => {
        const customCols = project?.kanbanConfig?.columns;
        if (customCols && customCols.length > 0) return customCols;

        return [
            { id: 'Pending', name: 'Backlog', title: 'Backlog', color: '#6B7280', wipLimit: 0 },
            { id: 'In Progress', name: 'In Progress', title: 'In Progress', color: '#1B73E8', wipLimit: 5 },
            { id: 'Completed', name: 'Done', title: 'Done', color: '#10B981', wipLimit: 0 },
            { id: 'Canceled', name: 'Canceled', title: 'Canceled', color: '#EF4444', wipLimit: 0 }
        ];
    }, [project]);

    const filteredTasksByView = useMemo(() => {
        let filtered = rawTasks;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(t => t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
        }
        if (quickFilter === 'Active') {
            filtered = filtered.filter(t => t.status !== 'Completed' && t.status !== 'Canceled');
        } else if (quickFilter === 'Risk') {
            filtered = filtered.filter(t => 
                (t.status !== 'Completed' && t.status !== 'Canceled') && 
                (t.priority === 'Urgent' || t.priority === 'High' || 
                 (t.dueDate && new Date(t.dueDate) < new Date()) ||
                 (t.dependencies?.blockedBy?.length > 0))
            );
        }

        if (filterPriority !== 'All') filtered = filtered.filter(t => t.priority === filterPriority);
        if (filterAssignee !== 'All') filtered = filtered.filter(t => (t.assignees && t.assignees.some(a => a._id === filterAssignee)) || t.assignee?._id === filterAssignee);
        if (filterDeadline !== 'All') {
            const now = new Date();
            if (filterDeadline === 'Overdue') {
                filtered = filtered.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'Completed');
            } else if (filterDeadline === 'Due Soon') {
                const soon = new Date(now.getTime() + 48 * 60 * 60 * 1000);
                filtered = filtered.filter(t => t.dueDate && new Date(t.dueDate) >= now && new Date(t.dueDate) <= soon);
            }
        }
        
        const priorityScore = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
        filtered.sort((a, b) => (priorityScore[b.priority] || 0) - (priorityScore[a.priority] || 0));

        // Grouping by columns
        const grouped = {};
        const colIds = allColumns.map(c => c.id || c._id?.toString());
        colIds.forEach(id => grouped[id] = []);

        filtered.forEach(task => {
            // Priority 1: Match exactly on current task status
            if (grouped[task.status]) {
                grouped[task.status].push(task);
            } 
            // Priority 2: Match by some common status mappings if not perfectly aligned
            else {
                const normalizedStatus = task.status?.toLowerCase().trim();
                const matchedId = colIds.find(id => {
                    const idLower = String(id).toLowerCase().trim();
                    return idLower === normalizedStatus || 
                           (idLower === 'pending' && normalizedStatus === 'backlog') ||
                           (idLower === 'backlog' && normalizedStatus === 'pending');
                });

                if (matchedId && grouped[matchedId]) {
                    grouped[matchedId].push(task);
                } 
                // Priority 3: Fallback to the first available column so it's visible somewhere
                else if (colIds.length > 0) {
                    grouped[colIds[0]].push(task);
                }
            }
        });

        // Apply Swimlanes if active
        if (swimlane !== 'None') {
            const swimlanes = {};
            if (swimlane === 'Assignee') {
                project?.members.forEach(m => swimlanes[m.userId?._id] = { label: m.userId?.name, tasks: JSON.parse(JSON.stringify(grouped)) });
                swimlanes['Unassigned'] = { label: 'Unassigned', tasks: JSON.parse(JSON.stringify(grouped)) };
                
                Object.keys(grouped).forEach(status => {
                    grouped[status].forEach(task => {
                        if (task.assignees?.length > 0) {
                            task.assignees.forEach(a => {
                                if (swimlanes[a._id]) swimlanes[a._id].tasks[status].push(task);
                            });
                        } else if (task.assignee) {
                            if (swimlanes[task.assignee._id]) swimlanes[task.assignee._id].tasks[status].push(task);
                        } else {
                            swimlanes['Unassigned'].tasks[status].push(task);
                        }
                    });
                });
            } else if (swimlane === 'Priority') {
                ['Urgent', 'High', 'Medium', 'Low'].forEach(p => swimlanes[p] = { label: p, tasks: JSON.parse(JSON.stringify(grouped)) });
                Object.keys(grouped).forEach(status => {
                    grouped[status].forEach(task => {
                        if (swimlanes[task.priority]) swimlanes[task.priority].tasks[status].push(task);
                    });
                });
            }
            return { type: 'swimlane', data: swimlanes };
        }

        return { type: 'standard', data: grouped };
    }, [rawTasks, searchQuery, filterPriority, filterAssignee, filterDeadline, swimlane, project, quickFilter, allColumns]);

    const boardColumns = useMemo(() => {
        return allColumns.map(col => ({
            ...col,
            taskCount: filteredTasksByView.data[col.id]?.length || 0,
            isOverLimit: col.wipLimit > 0 && (filteredTasksByView.data[col.id]?.length || 0) > col.wipLimit
        }));
    }, [allColumns, filteredTasksByView.data]);

    const handleDragStart = (e, taskId, currentStatus) => {
        // Multi-select drag logic
        const idsToDrag = selectedTaskIds.includes(taskId) ? selectedTaskIds : [taskId];
        e.dataTransfer.setData('taskIds', idsToDrag.join(','));
        e.dataTransfer.setData('currentStatus', currentStatus);
    };

    const handleDrop = async (e, targetStatus) => {
        const taskIdsStr = e.dataTransfer.getData('taskIds');
        const taskIds = taskIdsStr.split(',').filter(Boolean);
        const sourceStatus = e.dataTransfer.getData('currentStatus');

        setDragOverCol(null);
        if (sourceStatus === targetStatus || !taskIds.length) return;

        if (taskIds.length === 1) {
            updateTaskMutation.mutate({ id: taskIds[0], updates: { status: targetStatus } });
        } else {
            bulkUpdateTaskMutation.mutate({ taskIds, updates: { status: targetStatus } });
        }

        if (targetStatus === 'Completed') {
            setCelebrationActive(true);
            setTimeout(() => setCelebrationActive(false), 3000);
        }
    };

    const handleTaskSelect = useCallback((e, taskId) => {
        if (e.ctrlKey || e.metaKey) {
            setSelectedTaskIds(prev => prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]);
        } else {
            setSelectedTaskIds([taskId]);
        }
    }, []);

    const toggleSubtask = async (taskId, subtaskId) => {
        const task = rawTasks.find(t => t._id === taskId);
        if (!task) return;
        
        const newSubtasks = task.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s);
        updateTaskMutation.mutate({ id: taskId, updates: { subtasks: newSubtasks } });
    };

    const handleQuickAdd = async (e, status) => {
        e.preventDefault();
        if (!projectId) {
            toast.error('Please select a project to add tasks');
            return;
        }
        
        if (project && project.endDate && new Date() > new Date(project.endDate)) {
            toast.error('Cannot add tasks; project deadline has passed.');
            return;
        }

        if (!quickAddTitle.trim()) return;
        await createTaskMutation.mutateAsync({ title: quickAddTitle, status });
        setQuickAddTitle('');
        setQuickAddCol(null);
    };

    const completionRate = useMemo(() => {
        const total = rawTasks.length;
        if (total === 0) return 0;
        const completed = rawTasks.filter(t => t.status === 'Completed').length;
        return Math.round((completed / total) * 100);
    }, [rawTasks]);

    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col min-h-0 space-y-6 h-full p-1">
                <div className="flex flex-col xl:flex-row items-center justify-between gap-6 bg-sunken/20 p-3 rounded-[2rem] border border-white/5">
                     <div className="flex gap-2">
                        <Skeleton className="h-8 w-24 rounded-lg" opacity={0.2} noBorder />
                        <Skeleton className="h-8 w-24 rounded-lg" opacity={0.1} noBorder />
                        <Skeleton className="h-8 w-24 rounded-lg" opacity={0.1} noBorder />
                     </div>
                     <div className="flex gap-3">
                        <Skeleton className="h-10 w-32 rounded-xl" opacity={0.1} noBorder />
                        <Skeleton className="h-10 w-32 rounded-xl" opacity={0.1} noBorder />
                     </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                    {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-20 w-full rounded-2xl" opacity={0.1} />
                    ))}
                </div>
                <div className="flex-1 flex gap-6 overflow-hidden">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex flex-col min-w-[320px] max-w-[320px] shrink-0 space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <Skeleton className="h-4 w-32 rounded-md" opacity={0.2} noBorder />
                                <Skeleton className="h-5 w-5 rounded-md" opacity={0.1} noBorder />
                            </div>
                            <div className="flex-1 border-2 border-dashed border-white/[0.03] rounded-[2rem] p-3 space-y-4">
                                <Skeleton className="h-32 w-full rounded-2xl" opacity={0.15} noBorder />
                                <Skeleton className="h-24 w-full rounded-2xl" opacity={0.1} noBorder />
                                <Skeleton className="h-40 w-full rounded-2xl" opacity={0.05} noBorder />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 space-y-6 h-full">
            <AnimatePresence>
                {celebrationActive && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
                        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: [1, 1.2, 1], opacity: [0, 1, 0] }} transition={{ duration: 1.5 }} className="w-[600px] h-[600px] bg-theme/20 rounded-full blur-[120px]" />
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="absolute bg-surface/80 backdrop-blur-3xl border border-theme/30 px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4">
                            <ShieldCheck className="w-8 h-8 text-theme" />
                            <span className="text-xl font-black text-primary tracking-tighter uppercase">Task Completed</span>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col xl:flex-row items-center justify-between gap-6 bg-sunken/20 border border-white/[0.02] p-3 rounded-[2rem]">
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                    {['Board', 'Calendar', 'Timeline'].map(v => (
                        <button 
                            key={v}
                            onClick={() => setViewMode(v)}
                            className={twMerge(clsx(
                                "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                viewMode === v ? "bg-theme text-white shadow-lg shadow-theme/30" : "text-gray-500 hover:text-white"
                            ))}
                        >
                            {v}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 w-full xl:w-auto">
                    <div className="flex items-center gap-2 px-4 py-2 bg-black/20 border border-white/5 rounded-xl">
                        <Layers className="w-3.5 h-3.5 text-tertiary" />
                        <span className="text-[9px] font-black text-gray-500 uppercase">Group By</span>
                        <select value={swimlane} onChange={(e) => setSwimlane(e.target.value)} className="bg-transparent text-[10px] font-black text-theme uppercase outline-none cursor-pointer">
                            <option value="None" className="bg-[#0c0c0e]">Columns</option>
                            <option value="Assignee" className="bg-[#0c0c0e]">Assignee</option>
                            <option value="Priority" className="bg-[#0c0c0e]">Priority</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-black/20 border border-white/5 rounded-xl">
                        <Filter className="w-3.5 h-3.5 text-tertiary" />
                        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="bg-transparent text-[10px] font-black text-white uppercase outline-none cursor-pointer">
                            <option value="All" className="bg-[#0c0c0e]">All Priorities</option>
                            <option value="Urgent" className="bg-[#0c0c0e]">Urgent</option>
                            <option value="High" className="bg-[#0c0c0e]">High</option>
                            <option value="Medium" className="bg-[#0c0c0e]">Medium</option>
                            <option value="Low" className="bg-[#0c0c0e]">Low</option>
                        </select>
                    </div>
                </div>
            </div>

            {viewMode === 'Board' && (
                <div className="space-y-6 flex-1 flex flex-col min-h-0">
                     <header className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                        <Card className="bg-sunken/40 border-subtle relative overflow-hidden" padding="p-4">
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="w-10 h-10 rounded-xl bg-theme/10 flex items-center justify-center"><BarChart3 className="w-5 h-5 text-theme" /></div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-tertiary uppercase tracking-widest leading-none">Overall Progress</span>
                                    <span className="text-xl font-black text-primary font-mono">{completionRate}%</span>
                                </div>
                            </div>
                        </Card>
                        {boardColumns.map(col => (
                            <Card key={col.id} className="bg-sunken/40 border-subtle" padding="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-sunken border border-subtle flex items-center justify-center" style={{ color: col.color }}><Activity className="w-5 h-5" /></div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-tertiary uppercase tracking-widest leading-none">{col.title || col.name}</span>
                                        <span className="text-xl font-black text-primary font-mono">{col.taskCount}</span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </header>

                    <div className="relative flex-1 flex flex-col min-h-0">
                        {filteredTasksByView.type === 'standard' ? (
                            <div className="flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar items-stretch h-full">
                                {boardColumns.map(col => (
                                    <div key={col.id} className="flex flex-col h-full min-w-[300px] max-w-[400px]">
                                        <div className="flex items-center justify-between px-3 py-2 mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: col.color }} />
                                                <h3 className="text-[10px] font-black text-primary uppercase tracking-widest">{col.title || col.name}</h3>
                                                <span className={twMerge(clsx(
                                                    "px-1.5 py-0.5 rounded bg-sunken border border-subtle text-[8px] font-black text-tertiary",
                                                    col.isOverLimit && "bg-danger/20 text-danger border-danger/40 animate-pulse"
                                                ))}>
                                                    {col.taskCount}{col.wipLimit > 0 ? ` / ${col.wipLimit}` : ''}
                                                </span>
                                            </div>
                                            <button onClick={() => setQuickAddCol(col.id)} className="p-1.5 text-tertiary hover:text-primary transition-colors"><Plus className="w-4 h-4" /></button>
                                        </div>
                                        <div 
                                            onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.id); }}
                                            onDragLeave={() => setDragOverCol(null)}
                                            onDrop={(e) => handleDrop(e, col.id)}
                                            className={twMerge(clsx(
                                                "flex-1 space-y-4 min-h-[180px] p-2 rounded-[2rem] transition-all duration-300 perspective-1000", 
                                                dragOverCol === col.id ? "bg-theme/5 border-theme/20 shadow-inner" : "bg-white/[0.01] border-white/[0.03] border-2",
                                                col.isOverLimit && "border-danger/20 bg-danger/[0.02]"
                                            ))}
                                        >
                                            <AnimatePresence mode="popLayout">
                                                {filteredTasksByView.data[col.id]?.map(task => (
                                                    <TaskCard 
                                                        key={task._id} 
                                                        task={task} 
                                                        isSelected={selectedTaskIds.includes(task._id)}
                                                        onDragStart={handleDragStart} 
                                                        onOpen={setSelectedTask} 
                                                        onSelect={handleTaskSelect}
                                                        onToggleSubtask={toggleSubtask}
                                                    />
                                                ))}
                                            </AnimatePresence>
                                            <AnimatePresence>
                                                {quickAddCol === col.id && (
                                                    <motion.form key={`q-${col.id}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} onSubmit={(e) => handleQuickAdd(e, col.id)} className="p-1">
                                                        <div className="p-4 bg-surface border-2 border-theme rounded-2xl shadow-2xl">
                                                            <input autoFocus value={quickAddTitle} onChange={(e) => setQuickAddTitle(e.target.value)} placeholder="Enter task title..." className="w-full bg-transparent border-none text-xs font-bold text-white focus:outline-none" />
                                                            <div className="flex justify-end gap-2 mt-3"><button type="submit" className="px-3 py-1 bg-theme text-[9px] font-black uppercase text-white rounded-md">Create</button></div>
                                                        </div>
                                                    </motion.form>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {Object.entries(filteredTasksByView.data).map(([id, row]) => (
                                    <div key={id} className="space-y-4">
                                        <div className="flex items-center gap-4 px-2">
                                            <div className="h-0.5 flex-1 bg-white/5 rounded-full" />
                                            <h3 className="text-[10px] font-black text-theme uppercase tracking-[0.4em] bg-theme/5 px-4 py-1.5 rounded-full border border-theme/20">
                                                {row.label}
                                            </h3>
                                            <div className="h-0.5 flex-1 bg-white/5 rounded-full" />
                                        </div>
                                        <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
                                            {boardColumns.map(col => (
                                                <div key={`${id}-${col.id}`} className="flex flex-col min-w-[320px] max-w-[320px] shrink-0" onDragOver={(e) => handleDragOver(e, col.id)} onDrop={(e) => handleDrop(e, col.id)}>
                                                    <div className={twMerge(clsx("space-y-3 p-2 rounded-2xl transition-all duration-300", dragOverCol === col.id ? "bg-theme/5 border-theme/20" : "bg-white/[0.01] border-white/[0.03] border"))}>
                                                        <AnimatePresence mode="popLayout">
                                                            {row.tasks[col.id]?.map(task => <TaskCard key={task._id} task={task} onDragStart={handleDragStart} onOpen={setSelectedTask} />)}
                                                        </AnimatePresence>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {viewMode === 'Calendar' && (
                <CalendarView tasks={rawTasks} onOpenTask={setSelectedTask} />
            )}

            {viewMode === 'Timeline' && (
                <TimelineView tasks={rawTasks} onOpenTask={setSelectedTask} />
            )}

            {/* Modals */}
            <AnimatePresence>
                {selectedTask && (
                    <TaskDetailModal 
                        task={selectedTask}
                        projectId={projectId}
                        project={project}
                        projectMembers={members}
                        onClose={() => setSelectedTask(null)}
                        onUpdate={(id, updates) => id ? updateTaskMutation.mutate({ id, updates }) : createTaskMutation.mutate(updates)}
                        onDelete={(id) => deleteTaskMutation.mutate(id)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default KanbanBoard;
