import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Mail, Lock, ShieldCheck, ShieldAlert, Key, Zap, Info, ChevronRight } from 'lucide-react';
import { useAuthStore, api } from '../../store/useAuthStore';
import EmailUpdateModal from './EmailUpdateModal';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { motion, AnimatePresence } from 'framer-motion';

const securitySchema = z
    .object({
        currentPassword: z.string().optional(),
        newPassword: z.string().optional(),
        confirmNewPassword: z.string().optional(),
    })
    .superRefine((data, ctx) => {
        if (data.newPassword) {
            if (data.newPassword.length < 8) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Encryption must be at least 8 segments',
                    path: ['newPassword'],
                });
            }
            if (!/[0-9]/.test(data.newPassword)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Protocol requires numerical markers',
                    path: ['newPassword'],
                });
            }
            if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(data.newPassword)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Symbolic entropy required',
                    path: ['newPassword'],
                });
            }
            if (!data.currentPassword) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Current authorization required',
                    path: ['currentPassword'],
                });
            }
            if (data.newPassword !== data.confirmNewPassword) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Neural sequences do not match',
                    path: ['confirmNewPassword'],
                });
            }
        }
    });

/**
 * Modern 2026 SecurityTab
 * High-fidelity security orchestration with Glassmorphism 2.0
 */
export default function SecurityTab() {
    const { user } = useAuthStore();
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(securitySchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmNewPassword: '',
        },
    });

    const securityMutation = useMutation({
        mutationFn: async (data) => {
            const response = await api.put('/settings/security', {
                currentPassword: data.currentPassword || undefined,
                newPassword: data.newPassword || undefined,
            });
            return response.data;
        },
        onSuccess: (data) => {
            if (data.message) {
                toast.success('Security protocols rotated.');
                reset((formValues) => ({
                    ...formValues,
                    currentPassword: '',
                    newPassword: '',
                    confirmNewPassword: '',
                }));
                useAuthStore.setState((state) => ({
                    user: { ...state.user, email: data.email || state.user.email }
                }));
            }
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Protocol rotation failed.');
        }
    });

    const onSubmit = (data) => {
        securityMutation.mutate(data);
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {/* Security Metadata */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-white/5">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Security <span className="text-indigo-400">Firewall.</span></h2>
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Neural Encryption & Access Management</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl shadow-xl">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Quantum Guard Active</span>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                {/* Email Orchestration */}
                <Card padding="p-0" className="overflow-hidden border-white/5">
                    <div className="px-10 py-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-gray-600" />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Access Identifier</span>
                        </div>
                        <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => setIsEmailModalOpen(true)}
                            className="rounded-xl border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
                        >
                            Rotate Email
                        </Button>
                    </div>
                    <div className="p-10 space-y-6">
                        <div className="relative group opacity-60">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
                            <input
                                type="email"
                                disabled
                                value={user?.email || ''}
                                className="w-full bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white font-medium text-sm cursor-not-allowed"
                            />
                        </div>
                        {user?.pendingNewEmail && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-4 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl"
                            >
                                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                    <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none">Rotation Pending</span>
                                    <span className="text-[11px] text-gray-500 font-medium">Verify confirmation at {user.pendingNewEmail}</span>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </Card>

                {/* Password Encryption */}
                <Card padding="p-0" className="overflow-hidden border-white/5">
                    <div className="px-10 py-6 border-b border-white/5 bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                            <Key className="w-4 h-4 text-gray-600" />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Neural Encryption</span>
                        </div>
                    </div>
                    <div className="p-10 space-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Current Authorization</label>
                            <div className="relative group">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700 group-focus-within:text-cyan-400 transition-colors" />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    {...register('currentPassword')}
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white focus:outline-none focus:border-cyan-500/30 focus:ring-8 focus:ring-cyan-500/5 transition-all font-medium text-sm"
                                />
                            </div>
                            {errors.currentPassword && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1">{errors.currentPassword.message}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">New Sequence</label>
                                <div className="relative group">
                                    <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700 group-focus-within:text-emerald-400 transition-colors" />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        {...register('newPassword')}
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white focus:outline-none focus:border-emerald-500/30 focus:ring-8 focus:ring-emerald-500/5 transition-all font-medium text-sm"
                                    />
                                </div>
                                {errors.newPassword && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1">{errors.newPassword.message}</p>}
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Verify Sequence</label>
                                <div className="relative group">
                                    <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700 group-focus-within:text-emerald-400 transition-colors" />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        {...register('confirmNewPassword')}
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white focus:outline-none focus:border-emerald-500/30 focus:ring-8 focus:ring-emerald-500/5 transition-all font-medium text-sm"
                                    />
                                </div>
                                {errors.confirmNewPassword && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1">{errors.confirmNewPassword.message}</p>}
                            </div>
                        </div>
                    </div>
                    <div className="px-10 py-8 border-t border-white/5 flex items-center justify-between bg-black/10">
                        <div className="flex items-center gap-3">
                            <Info className="w-4 h-4 text-gray-700" />
                            <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest leading-relaxed">
                                Sequence updates require valid current authorization for security integrity.
                            </p>
                        </div>
                        <Button
                            type="submit"
                            isLoading={securityMutation.isPending}
                            disabled={securityMutation.isPending}
                            className="px-12 py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500"
                        >
                            Rotate Protocols
                        </Button>
                    </div>
                </Card>
            </form>

            <EmailUpdateModal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} />

            {/* Account Recovery (Mock for UI) */}
            <Card padding="p-8" className="border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer group hover:border-white/10 transition-all">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                        <ShieldAlert className="w-8 h-8 text-gray-600 group-hover:text-amber-500/60 transition-colors" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-sm font-black text-white uppercase tracking-widest">Multi-Factor Synchronization</h4>
                        <p className="text-[11px] text-gray-500 font-medium">Add an additional layer of neural verification to your identity.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-indigo-400 group-hover:text-white transition-colors">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Configure</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
            </Card>
        </div>
    );
}
