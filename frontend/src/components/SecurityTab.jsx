import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Mail, Lock } from 'lucide-react';
import { useAuthStore, api } from '../store/useAuthStore';

const securitySchema = z
    .object({
        email: z.string().email('Please enter a valid email address'),
        currentPassword: z.string().optional(),
        newPassword: z.string().optional(),
        confirmNewPassword: z.string().optional(),
    })
    .superRefine((data, ctx) => {
        if (data.newPassword) {
            if (data.newPassword.length < 8) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Password must be at least 8 characters long',
                    path: ['newPassword'],
                });
            }
            if (!/[0-9]/.test(data.newPassword)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Password must contain at least one number',
                    path: ['newPassword'],
                });
            }
            if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(data.newPassword)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Password must contain at least one special character',
                    path: ['newPassword'],
                });
            }
            if (!data.currentPassword) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Current password is required to set a new password',
                    path: ['currentPassword'],
                });
            }
            if (data.newPassword !== data.confirmNewPassword) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Passwords do not match',
                    path: ['confirmNewPassword'],
                });
            }
        }
    });

export default function SecurityTab() {
    const { user } = useAuthStore();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(securitySchema),
        defaultValues: {
            email: user?.email || '',
            currentPassword: '',
            newPassword: '',
            confirmNewPassword: '',
        },
    });

    const securityMutation = useMutation({
        mutationFn: async (data) => {
            const response = await api.put('/settings/security', {
                email: data.email,
                currentPassword: data.currentPassword || undefined,
                newPassword: data.newPassword || undefined,
            });
            return response.data;
        },
        onSuccess: (data) => {
            if (data.message) {
                toast.success(data.message);
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
            toast.error(error.response?.data?.message || 'Failed to update security settings');
        }
    });

    const onSubmit = (data) => {
        securityMutation.mutate(data);
    };

    return (
        <div>
            <div className="mb-6 pb-6 border-b border-white/[0.06]">
                <h2 className="text-[17px] font-bold text-white tracking-tight">Security Information</h2>
                <p className="text-[13px] text-gray-500 mt-1">Update your email and manage your password.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Email Section */}
                <div className="pb-6 border-b border-white/[0.06]">
                    <label htmlFor="email" className="block text-[13px] font-semibold text-gray-300 mb-1.5">
                        Email Address
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Mail className="h-4 w-4 text-gray-500" />
                        </div>
                        <input
                            id="email"
                            type="email"
                            placeholder="juhayer@example.com"
                            {...register('email')}
                            className="block w-full pl-10 px-3.5 py-2.5 border border-white/[0.06] rounded-xl text-[13px] bg-white/[0.02] text-gray-200 placeholder-gray-600 focus:bg-white/[0.04] focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 outline-none transition-all duration-200 shadow-inner shadow-black/20"
                        />
                    </div>
                    {errors.email && <p className="text-xs text-red-400 mt-1.5">{errors.email.message}</p>}
                </div>

                {/* Password Section */}
                <div className="space-y-5 pt-2">
                    <h3 className="text-[14px] font-bold text-white tracking-tight">Change Password</h3>

                    <div className="space-y-1.5">
                        <label htmlFor="currentPassword" className="block text-[13px] font-semibold text-gray-300">
                            Current Password
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <Lock className="h-4 w-4 text-gray-500" />
                            </div>
                            <input
                                id="currentPassword"
                                type="password"
                                placeholder="••••••••"
                                {...register('currentPassword')}
                                className="block w-full pl-10 px-3.5 py-2.5 border border-white/[0.06] rounded-xl text-[13px] bg-white/[0.02] text-gray-200 placeholder-gray-600 focus:bg-white/[0.04] focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 outline-none transition-all duration-200 shadow-inner shadow-black/20"
                            />
                        </div>
                        {errors.currentPassword && <p className="text-xs text-red-400 mt-1.5">{errors.currentPassword.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label htmlFor="newPassword" className="block text-[13px] font-semibold text-gray-300">
                                New Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 text-gray-500" />
                                </div>
                                <input
                                    id="newPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    {...register('newPassword')}
                                    className="block w-full pl-10 px-3.5 py-2.5 border border-white/[0.06] rounded-xl text-[13px] bg-white/[0.02] text-gray-200 placeholder-gray-600 focus:bg-white/[0.04] focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 outline-none transition-all duration-200 shadow-inner shadow-black/20"
                                />
                            </div>
                            {errors.newPassword && <p className="text-xs text-red-400 mt-1.5">{errors.newPassword.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="confirmNewPassword" className="block text-[13px] font-semibold text-gray-300">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 text-gray-500" />
                                </div>
                                <input
                                    id="confirmNewPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    {...register('confirmNewPassword')}
                                    className="block w-full pl-10 px-3.5 py-2.5 border border-white/[0.06] rounded-xl text-[13px] bg-white/[0.02] text-gray-200 placeholder-gray-600 focus:bg-white/[0.04] focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 outline-none transition-all duration-200 shadow-inner shadow-black/20"
                                />
                            </div>
                            {errors.confirmNewPassword && <p className="text-xs text-red-400 mt-1.5">{errors.confirmNewPassword.message}</p>}
                        </div>
                    </div>
                </div>

                <div className="pt-2 flex justify-end">
                    <button
                        type="submit"
                        disabled={securityMutation.isPending}
                        className="inline-flex items-center justify-center px-4 py-2.5 text-[13px] font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-xl transition-all shadow-lg shadow-violet-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {securityMutation.isPending ? 'Saving...' : 'Update Security'}
                    </button>
                </div>
            </form>
        </div>
    );
}
