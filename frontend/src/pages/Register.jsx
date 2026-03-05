import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

const Register = () => {
    const navigate = useNavigate();
    const { register: registerAction, isLoading, error, clearError, user } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);

    const { register, handleSubmit, formState: { errors, isValid }, watch } = useForm({ resolver: zodResolver(registerSchema), mode: 'onChange' });
    const pw = watch('password', '');

    const getStrength = (p) => {
        if (!p) return { s: 0, l: '', c: '' };
        let s = 0;
        if (p.length >= 8) s++; if (p.length >= 12) s++; if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++;
        if (s <= 1) return { s: 1, l: 'Weak', c: 'bg-red-500' };
        if (s <= 2) return { s: 2, l: 'Fair', c: 'bg-orange-500' };
        if (s <= 3) return { s: 3, l: 'Good', c: 'bg-yellow-500' };
        if (s <= 4) return { s: 4, l: 'Strong', c: 'bg-emerald-500' };
        return { s: 5, l: 'Excellent', c: 'bg-emerald-400' };
    };
    const str = getStrength(pw);

    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => { if (user) navigate('/'); }, [user, navigate]);
    useEffect(() => { clearError(); }, [clearError]);

    // Show success banner then redirect
    if (successMsg) {
        return (
            <div className="min-h-screen bg-[#05050a] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 className="text-xl font-bold text-white">Account created!</h2>
                    <p className="text-gray-500 text-sm">Redirecting you to login...</p>
                    <div className="w-32 h-0.5 bg-gray-800 mx-auto rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 animate-[widthGrow_1.5s_ease-in-out_forwards]" style={{ animation: 'width 1.5s linear forwards', width: '100%' }} />
                    </div>
                </div>
            </div>
        );
    }

    const onSubmit = async (data) => {
        clearError();
        try {
            await registerAction({ name: data.name, email: data.email, password: data.password, role: 'Developer' });
            setSuccessMsg('Account created!');
            setTimeout(() => {
                window.location.href = '/login'; // Hard redirect — most reliable
            }, 1500);
        } catch (err) {
            // Error is already in the store via useAuthStore, it will render in the {error && ...} block
            console.error('Registration failed:', err?.response?.data?.message || err?.message);
        }
    };

    const inputCls = (err) => `w-full px-4 py-3 rounded-xl bg-white/[0.03] border text-white placeholder-gray-600 outline-none transition-all text-sm ${err ? 'border-red-500/40 focus:ring-2 focus:ring-red-500/10' : 'border-white/[0.06] hover:border-white/[0.12] focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10'}`;

    return (
        <div className="min-h-screen flex flex-row-reverse bg-[#05050a] text-white font-sans selection:bg-emerald-500/30">
            {/* Right Brand Panel */}
            <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden items-center justify-center bg-gradient-to-br from-[#0d0d1a] via-[#0f1828] to-[#05050a]">
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                <div className="absolute top-1/4 right-1/3 w-[400px] h-[400px] bg-emerald-600 rounded-full opacity-[0.07] blur-[150px]" />
                <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-blue-500 rounded-full opacity-[0.05] blur-[120px]" />
                <div className="relative z-10 text-center px-14 max-w-md">
                    <div className="mx-auto mb-8 w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">Klivra</h1>
                    <p className="text-gray-500 text-[15px] leading-relaxed mt-4 mb-10">Build impossible things, together. Join an elite ecosystem of asynchronous collaboration.</p>
                    <div className="flex items-center justify-center gap-3">
                        <div className="flex -space-x-2">
                            {['from-violet-400 to-violet-600', 'from-blue-400 to-blue-600', 'from-emerald-400 to-emerald-600', 'from-amber-400 to-amber-600'].map((g, i) => (
                                <div key={i} className={`w-7 h-7 rounded-full border-2 border-[#0d0d1a] bg-gradient-to-br ${g}`} />
                            ))}
                        </div>
                        <span className="text-gray-500 text-xs font-medium">Join 2,400+ developers</span>
                    </div>
                </div>
            </div>

            {/* Left Form */}
            <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-12 lg:p-20 relative">
                <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-emerald-600 rounded-full opacity-[0.03] blur-[100px] pointer-events-none" />
                <div className="w-full max-w-[420px]">
                    <div className="lg:hidden text-center mb-10">
                        <h1 className="text-2xl font-black tracking-tight">Klivra</h1>
                    </div>
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold tracking-tight mb-1.5">Create your account</h2>
                        <p className="text-gray-500 text-sm">Already have access? <Link to="/login" className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors">Sign in</Link></p>
                    </div>
                    <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-7 shadow-2xl shadow-black/20">
                        {error && (
                            <div className="mb-5 flex items-center gap-3 p-3.5 rounded-xl bg-red-500/[0.08] border border-red-500/15 text-red-400" role="alert">
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span className="text-sm font-medium flex-1">{error}</span>
                                <button onClick={clearError} className="p-1 hover:bg-red-500/20 rounded-lg transition-colors" aria-label="Dismiss"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                            </div>
                        )}
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                            <div>
                                <label htmlFor="r-name" className="block text-[13px] font-semibold mb-2 text-gray-400">Full name</label>
                                <input id="r-name" type="text" autoComplete="name" {...register('name')} className={inputCls(errors.name)} placeholder="John Doe" />
                                {errors.name && <p className="text-red-400 text-xs mt-1.5 font-medium">{errors.name.message}</p>}
                            </div>
                            <div>
                                <label htmlFor="r-email" className="block text-[13px] font-semibold mb-2 text-gray-400">Email</label>
                                <input id="r-email" type="email" autoComplete="email" {...register('email')} className={inputCls(errors.email)} placeholder="you@company.com" />
                                {errors.email && <p className="text-red-400 text-xs mt-1.5 font-medium">{errors.email.message}</p>}
                            </div>
                            <div>
                                <label htmlFor="r-pass" className="block text-[13px] font-semibold mb-2 text-gray-400">Password</label>
                                <div className="relative">
                                    <input id="r-pass" type={showPassword ? 'text' : 'password'} autoComplete="new-password" {...register('password')} className={`${inputCls(errors.password)} pr-12`} placeholder="••••••••" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-600 hover:text-gray-300 rounded transition-colors" tabIndex={-1}>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={showPassword ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} /></svg>
                                    </button>
                                </div>
                                {errors.password && <p className="text-red-400 text-xs mt-1.5 font-medium">{errors.password.message}</p>}
                                {pw && (
                                    <div className="mt-2.5">
                                        <div className="flex gap-1 mb-1"><div />{[1, 2, 3, 4, 5].map(i => (<div key={i} className={`h-0.5 flex-1 rounded-full transition-all ${i <= str.s ? str.c : 'bg-gray-800'}`} />))}</div>
                                        <p className="text-[11px] text-gray-500">Strength: <span className={`font-semibold ${str.s <= 2 ? 'text-red-400' : str.s <= 3 ? 'text-yellow-400' : 'text-emerald-400'}`}>{str.l}</span></p>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label htmlFor="r-confirm" className="block text-[13px] font-semibold mb-2 text-gray-400">Confirm password</label>
                                <input id="r-confirm" type="password" autoComplete="new-password" {...register('confirmPassword')} className={inputCls(errors.confirmPassword)} placeholder="••••••••" />
                                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1.5 font-medium">{errors.confirmPassword.message}</p>}
                            </div>
                            <button type="submit" disabled={isLoading || !isValid}
                                className={`w-full py-3 mt-1 rounded-xl font-semibold text-sm transition-all duration-300 flex justify-center items-center gap-2 ${isLoading || !isValid ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:opacity-90 shadow-lg shadow-emerald-500/20 active:scale-[0.98]'}`}>
                                {isLoading ? (<><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Creating...</>) : 'Create Account'}
                            </button>
                        </form>
                    </div>
                    <p className="text-center text-[11px] text-gray-600 mt-6">By creating an account, you agree to our <a href="#" className="text-gray-500 hover:text-white underline underline-offset-2 transition-colors">Terms</a> & <a href="#" className="text-gray-500 hover:text-white underline underline-offset-2 transition-colors">Privacy</a>.</p>
                </div>
            </div>
        </div>
    );
};
export default Register;
