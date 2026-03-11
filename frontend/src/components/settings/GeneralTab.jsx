import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { User, FileText, BadgeCheck, Zap, Info } from 'lucide-react';
import { useAuthStore, api } from '../../store/useAuthStore';
import ThemeSelector from './ThemeSelector';
import ModeSelector from './ModeSelector';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { motion } from 'framer-motion';

const generalSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    customMessage: z.string().max(250, 'Bio cannot exceed 250 characters').optional(),
});

/**
 * Modern 2026 GeneralTab
 * Platform identity orchestration with Glassmorphism 2.0
 */
export default function GeneralTab() {
    const { user, updateProfile } = useAuthStore();

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(generalSchema),
        defaultValues: {
            name: user?.name || '',
            customMessage: user?.customMessage || '',
        },
    });

    const bioValue = watch('customMessage') || '';

    const updateMutation = useMutation({
        mutationFn: async (data) => {
            const response = await api.put('/settings/profile', data);
            return response.data;
        },
        onSuccess: (data) => {
            useAuthStore.setState((state) => ({ user: { ...state.user, ...data.data } }));
            toast.success('Identity protocols synchronized.');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Synchronization failed.');
        }
    });

    const onSubmit = (data) => {
        updateMutation.mutate(data);
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {/* Component Metadata Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-white/5">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Platform <span className="text-cyan-400">Identity.</span></h2>
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Core Persona Orchestration</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl shadow-xl">
                    <BadgeCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Verified Nexus Link</span>
                </div>
            </div>

            {/* Core Synchronization Form */}
            <Card padding="p-0" className="overflow-hidden border-white/5">
                <div className="px-10 py-6 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-gray-600" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Attribute Calibration</span>
                    </div>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="p-10 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Name Field */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Full Identifier</label>
                            <div className="relative group">
                                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700 group-focus-within:text-cyan-400 transition-colors" />
                                <input
                                    id="name"
                                    type="text"
                                    placeholder="Neural Identifier"
                                    {...register('name')}
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white focus:outline-none focus:border-cyan-500/30 focus:ring-8 focus:ring-cyan-500/5 transition-all font-medium text-sm"
                                />
                            </div>
                            {errors.name && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1">{errors.name.message}</p>}
                        </div>

                        {/* Status Message Field */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Operational Directive</label>
                                <span className={cn(
                                    "text-[9px] font-black uppercase tracking-widest",
                                    bioValue.length >= 250 ? 'text-rose-500' : 'text-gray-700'
                                )}>
                                    {bioValue.length} / 250
                                </span>
                            </div>
                            <div className="relative group">
                                <FileText className="absolute top-5 left-5 w-4 h-4 text-gray-700 group-focus-within:text-cyan-400 transition-colors" />
                                <textarea
                                    id="customMessage"
                                    rows={1}
                                    placeholder="Neural broadcast message..."
                                    {...register('customMessage')}
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white focus:outline-none focus:border-cyan-500/30 focus:ring-8 focus:ring-cyan-500/5 transition-all font-medium text-sm resize-none h-[54px] align-middle pt-4"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-between border-t border-white/5">
                        <div className="flex items-center gap-3">
                            <Info className="w-4 h-4 text-gray-700" />
                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest max-w-[300px] leading-relaxed">
                                Changes to your identity markers will propagate to all connected neural segments in real-time.
                            </p>
                        </div>
                        <Button
                            type="submit"
                            isLoading={updateMutation.isPending}
                            disabled={updateMutation.isPending}
                            className="px-12 py-5 rounded-2xl"
                        >
                            Commit Protocols
                        </Button>
                    </div>
                </form>
            </Card>

            {/* Sub-orchestration Systems */}
            <div className="grid grid-cols-1 gap-12 pt-10">
                <ModeSelector />
                <div className="w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent shadow-2xl shadow-cyan-500/10" />
                <ThemeSelector />
            </div>

            {/* Feedback Loops */}
            <div className="flex items-center gap-4 p-8 glass-2 bg-cyan-500/5 border border-cyan-500/10 rounded-[2.5rem] mt-20">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-black text-white uppercase tracking-[0.2em]">Neural Sync Active</span>
                    <span className="text-[10px] text-gray-500 font-medium tracking-wide">All identity markers are now synchronized with Phase 4 core protocols.</span>
                </div>
            </div>
        </div>
    );
}
