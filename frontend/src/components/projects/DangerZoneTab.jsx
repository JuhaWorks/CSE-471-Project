import React, { useState } from 'react';
import { Trash2, ShieldAlert, Archive, Trash, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../../api/projectApi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/BaseUI';

const DangerZoneTab = ({ project }) => {
    const [isConfirming, setIsConfirming] = useState(false);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    const isCreator = (project.createdBy ? project.createdBy === user?._id : (project.members?.[0]?.userId?._id === user?._id || project.members?.[0]?.userId === user?._id)) || user?.role === 'Admin';

    const archiveMutation = useMutation({
        mutationFn: () => projectService.deleteProject(project._id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            toast.success('Project archived successfully.');
            navigate('/projects');
        },
        onError: () => toast.error('Failed to archive project.')
    });

    return (
        <div className="max-w-4xl space-y-12">
            {/* Header - Minimalist */}
            <header className="space-y-2">
                <div className="flex items-center gap-2.5 text-red-500 font-black text-[9px] uppercase tracking-[0.4em] opacity-80">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Danger Zone</span>
                </div>
                <h2 className="text-3xl font-black text-white tracking-tighter">Workspace Termination</h2>
                <p className="text-gray-500 text-xs font-medium max-w-md leading-relaxed">
                    Sensitive operations that affect the entire project lifecycle and visibility.
                </p>
            </header>

            <div className="space-y-6">
                {isCreator ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-10 bg-red-500/[0.02] border border-red-500/10 rounded-[2.5rem] flex flex-col md:flex-row md:items-center justify-between gap-8 transition-all hover:bg-red-500/[0.04] hover:border-red-500/20"
                    >
                        <div className="space-y-2 max-w-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                                    <Archive className="w-5 h-5 text-red-400" />
                                </div>
                                <h3 className="text-lg font-black text-white tracking-tight">Archive Project</h3>
                            </div>
                            <p className="text-xs text-gray-400 leading-relaxed pl-13">
                                Moves workspace to Trash. Access becomes read-only for all members. 
                                <span className="text-red-400/60 ml-1">Restorable from Trash at any time.</span>
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-3 shrink-0">
                            <AnimatePresence mode="wait">
                                {isConfirming ? (
                                    <motion.div 
                                        key="confirming"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-red-500/20"
                                    >
                                        <button 
                                            onClick={() => setIsConfirming(false)}
                                            className="p-3 text-gray-500 hover:text-white transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <Button 
                                            variant="danger" 
                                            size="sm"
                                            onClick={() => archiveMutation.mutate()}
                                            isLoading={archiveMutation.isPending}
                                            className="rounded-xl px-6 h-11 font-black text-[10px] uppercase tracking-widest shadow-[0_10px_30px_rgba(220,38,38,0.2)]"
                                        >
                                            Confirm Archive
                                        </Button>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="idle"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                    >
                                        <Button 
                                            variant="secondary" 
                                            size="md"
                                            onClick={() => setIsConfirming(true)}
                                            className="rounded-2xl px-8 h-14 font-black text-[11px] uppercase tracking-widest hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all border-white/5"
                                        >
                                            Archive Workspace
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                ) : (
                    <div className="p-12 bg-white/[0.01] border border-dashed border-white/10 rounded-[2.5rem] text-center max-w-2xl">
                        <ShieldAlert className="w-10 h-10 text-gray-700 mx-auto mb-6 opacity-40" />
                        <h3 className="text-base font-black text-primary uppercase tracking-widest">Ownership Restricted</h3>
                        <p className="text-[11px] text-gray-500 mt-2 max-w-xs mx-auto leading-relaxed">
                            Only the project creator can initiate structural modifications or workspace termination.
                        </p>
                    </div>
                )}

                {/* Footer Note - Professional & Subtle */}
                <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center gap-6 opacity-40 hover:opacity-100 transition-opacity duration-500">
                    <div className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                        <Trash className="w-3.5 h-3.5" />
                        <span>Permanent Deletion Policy</span>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-800 hidden sm:block" />
                    <p className="text-[10px] font-medium text-gray-600">
                        Deletion is only available via the <span className="text-red-500/50">Trash</span> interface after archiving.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DangerZoneTab;