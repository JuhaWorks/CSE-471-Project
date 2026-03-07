import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../store/useAuthStore';
import { Plus, Search, Filter, Folder, Calendar, Users, MoreVertical, Settings, ExternalLink, Trash2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import ProjectCreationModal from '../components/projects/ProjectCreationModal';
import ProjectImage from '../components/projects/ProjectImage';
import { toast } from 'react-hot-toast';

const Projects = () => {
    const queryClient = useQueryClient(); // Initialize queryClient
    const [view, setView] = useState('active'); // 'active' or 'archived'
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const { data: projectsRes, isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            const res = await api.get('/projects');
            return res.data;
        }
    });

    const restoreMutation = useMutation({
        mutationFn: async (id) => {
            await api.post(`/projects/${id}/restore`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            toast.success('Project restored 🚀');
        }
    });

    const projects = projectsRes?.data || [];

    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesView = view === 'active' ? p.status !== 'Archived' : p.status === 'Archived';
        return matchesSearch && matchesView;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
            case 'Paused': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
            case 'Completed': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            case 'Archived': return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
            default: return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
        }
    };

    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-10 pb-32">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Folder className="w-8 h-8 text-violet-500" />
                        <h1 className="text-5xl font-black text-white tracking-tighter">Workspace</h1>
                    </div>
                    <p className="text-zinc-500 font-bold ml-1 tracking-tight">Manage and track your collective intellectual property.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Segmented Control */}
                    <div className="flex p-1 bg-zinc-950 border border-white/5 rounded-2xl">
                        {[
                            { id: 'active', label: 'Active', count: projects.filter(p => p.status !== 'Archived').length },
                            { id: 'archived', label: 'Trash', count: projects.filter(p => p.status === 'Archived').length, icon: Trash2 }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setView(tab.id)}
                                className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all ${view === tab.id ? 'bg-white/10 text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-400'}`}
                            >
                                {tab.label}
                                <span className={`px-2 py-0.5 rounded-md text-[9px] ${view === tab.id ? 'bg-white text-zinc-950' : 'bg-white/5 text-zinc-600'}`}>{tab.count}</span>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-white text-zinc-950 font-black hover:bg-zinc-200 transition-all active:scale-95 shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
                    >
                        <Plus className="w-5 h-5" />
                        Initialize Project
                    </button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                <div className="relative w-full md:w-[400px] group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-violet-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search workspace index..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-950/50 border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500/30 transition-all font-bold backdrop-blur-xl"
                    />
                </div>
            </div>

            {/* Projects Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-72 rounded-[40px] bg-white/[0.02] border border-white/[0.06] animate-pulse" />
                    ))}
                </div>
            ) : filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence mode="popLayout">
                        {filteredProjects.map((project, index) => (
                            <motion.div
                                key={project._id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                                className="group relative bg-zinc-950/40 border border-white/5 rounded-[40px] p-8 hover:border-violet-500/30 transition-all hover:bg-zinc-900/40 shadow-2xl overflow-hidden backdrop-blur-md"
                            >
                                <div className="relative -mx-8 -mt-8 mb-8">
                                    <ProjectImage
                                        project={project}
                                        className="rounded-t-[40px] border-b border-white/5"
                                    />
                                    <div className="absolute top-6 right-6">
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5 shadow-2xl backdrop-blur-md ${getStatusColor(project.status)}`}>
                                            {project.status || 'Active'}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-8">
                                    <h3 className="text-2xl font-black text-white tracking-tighter group-hover:text-violet-200 transition-colors line-clamp-1">{project.name}</h3>
                                    <p className="text-zinc-500 text-sm font-medium line-clamp-2 leading-relaxed h-10">{project.description}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-6 mb-8">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Deadline</span>
                                        <div className="flex items-center gap-2 text-zinc-300">
                                            <Calendar className="w-4 h-4 text-violet-500/50" />
                                            <span className="text-xs font-bold">{new Date(project.endDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Team</span>
                                        <div className="flex items-center gap-2 text-zinc-300">
                                            <Users className="w-4 h-4 text-violet-500/50" />
                                            <span className="text-xs font-bold">{project.members?.length || 0} units</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-8 border-t border-white/5">
                                    <div className="flex -space-x-3">
                                        {project.members?.slice(0, 3).map((m, i) => (
                                            <div key={i} className="w-9 h-9 rounded-2xl border-2 border-zinc-950 bg-zinc-900 flex items-center justify-center overflow-hidden">
                                                {m.userId?.avatar ? (
                                                    <img src={m.userId.avatar} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-[10px] font-black text-zinc-500">{m.userId?.name?.charAt(0)}</span>
                                                )}
                                            </div>
                                        ))}
                                        {project.members?.length > 3 && (
                                            <div className="w-9 h-9 rounded-2xl border-2 border-zinc-950 bg-zinc-900 flex items-center justify-center text-[10px] font-black text-zinc-600">
                                                +{project.members.length - 3}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {project.status === 'Archived' ? (
                                            <button
                                                onClick={() => restoreMutation.mutate(project._id)}
                                                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-violet-600 text-white font-black text-xs hover:bg-violet-500 transition-all active:scale-90"
                                            >
                                                <RefreshCw className="w-3.5 h-3.5" />
                                                Restore
                                            </button>
                                        ) : (
                                            <>
                                                <Link
                                                    to={`/projects/${project._id}/settings`}
                                                    className="p-3 bg-white/5 text-zinc-500 hover:text-white hover:bg-white/10 rounded-2xl border border-white/5 transition-all shadow-xl active:scale-90"
                                                >
                                                    <Settings className="w-5 h-5" />
                                                </Link>
                                                <Link
                                                    to={`/tasks?project=${project._id}`}
                                                    className="p-3 bg-violet-600/10 text-violet-400 hover:bg-violet-600 hover:text-white rounded-2xl border border-violet-500/20 transition-all shadow-xl active:scale-90"
                                                >
                                                    <ExternalLink className="w-5 h-5" />
                                                </Link>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center bg-zinc-950/20 border-2 border-dashed border-white/5 rounded-[60px]">
                    <div className="w-24 h-24 rounded-[40px] bg-white/[0.02] border border-white/[0.06] flex items-center justify-center mb-8">
                        <Folder className="w-10 h-10 text-zinc-800" />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-3">Workspace Empty</h2>
                    <p className="text-zinc-500 font-medium max-w-sm mb-10 leading-relaxed">Initialized but inactive. Start clear objectives by creating your first Project entry.</p>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-10 py-4 rounded-2xl bg-white text-zinc-950 font-black hover:bg-zinc-200 transition-all shadow-2xl shadow-white/10"
                    >
                        Create New Entry
                    </button>
                </div>
            )}

            <ProjectCreationModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
        </div>
    );
};

export default Projects;
