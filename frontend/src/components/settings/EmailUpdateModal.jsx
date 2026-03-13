import React, { useState, useEffect, useRef, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Mail, ShieldCheck, X, CheckCircle2, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, useAuthStore } from '../../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = ['Verify identity', 'New email', 'Done'];

// ─── Step progress bar ────────────────────────────────────────────────────────

function StepBar({ current }) {
    return (
        <div className="flex items-center gap-2 mb-7">
            {STEPS.map((label, i) => {
                const done = i < current;
                const active = i === current;
                return (
                    <React.Fragment key={i}>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <div className={[
                                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold transition-all duration-300',
                                done ? 'bg-emerald-500 text-white' :
                                    active ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-300 dark:ring-emerald-700' :
                                        'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                            ].join(' ')}>
                                {done ? '✓' : i + 1}
                            </div>
                            <span className={[
                                'text-[11px] font-medium hidden sm:block transition-colors',
                                active ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-600'
                            ].join(' ')}>
                                {label}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800 relative overflow-hidden rounded-full">
                                <div
                                    className="absolute inset-y-0 left-0 bg-emerald-400 transition-all duration-500"
                                    style={{ width: done ? '100%' : '0%' }}
                                />
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

// ─── OTP input group ──────────────────────────────────────────────────────────

function OtpInput({ otp, setOtp, inputRefs }) {
    const handleChange = (e, index) => {
        const val = e.target.value;
        if (!/^\d*$/.test(val)) return;
        const next = [...otp];
        next[index] = val.slice(-1);
        setOtp(next);
        if (val && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0)
            inputRefs.current[index - 1]?.focus();
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('');
        if (!digits.length) return;
        const next = [...otp];
        digits.forEach((d, i) => { if (i < 6) next[i] = d; });
        setOtp(next);
        inputRefs.current[Math.min(digits.length, 5)]?.focus();
    };

    return (
        <div className="flex justify-center gap-2.5" onPaste={handlePaste}>
            {otp.map((digit, i) => (
                <input
                    key={i}
                    ref={el => (inputRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    autoFocus={i === 0}
                    onChange={e => handleChange(e, i)}
                    onKeyDown={e => handleKeyDown(e, i)}
                    className={[
                        'w-11 h-13 text-center text-lg font-semibold rounded-xl border transition-all outline-none',
                        'bg-zinc-50 dark:bg-zinc-800/60',
                        digit
                            ? 'border-emerald-400 dark:border-emerald-600 text-zinc-900 dark:text-zinc-100 ring-2 ring-emerald-100 dark:ring-emerald-900/40'
                            : 'border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100',
                        'focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/40',
                    ].join(' ')}
                />
            ))}
        </div>
    );
}

// ─── Slide variants ───────────────────────────────────────────────────────────

const slide = (dir) => ({
    initial: { opacity: 0, x: dir * 18 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } },
    exit: { opacity: 0, x: dir * -12, transition: { duration: 0.18, ease: 'easeIn' } },
});

// ─── Main component ───────────────────────────────────────────────────────────

export default function EmailUpdateModal({ isOpen, onClose }) {
    const { user } = useAuthStore();

    const [step, setStep] = useState(0);
    const [otp, setOtp] = useState(Array(6).fill(''));
    const [newEmail, setNewEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [direction, setDirection] = useState(1);

    const inputRefs = useRef([]);

    // Request OTP on open
    useEffect(() => {
        if (!isOpen) return;
        setStep(0); setOtp(Array(6).fill('')); setNewEmail(''); setDirection(1);

        api.post('/users/email/request-otp')
            .then(() => setStep(1))
            .catch(err => {
                toast.error(err.response?.data?.message || 'Could not send verification code.');
                onClose();
            });
    }, [isOpen, onClose]);

    const advance = () => { setDirection(1); };
    const back = () => { setDirection(-1); };

    const handleOtpSubmit = (e) => {
        e?.preventDefault();
        if (otp.join('').length !== 6) return;
        advance();
        setStep(2);
    };

    const handleFinalSubmit = async (e) => {
        e?.preventDefault();
        if (!newEmail || !newEmail.includes('@')) {
            toast.error('Please enter a valid email address.');
            return;
        }
        setSubmitting(true);
        try {
            await api.post('/users/email/verify-otp', { otp: otp.join(''), newEmail });
            advance();
            setStep(3);
        } catch (err) {
            const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
            toast.error(msg);
            if (msg.toLowerCase().includes('otp')) {
                back(); setStep(1);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const canClose = step !== 0 && step !== 3 && !submitting;
    const stepBarIndex = step === 0 ? 0 : step === 1 ? 0 : step === 2 ? 1 : 2;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => canClose && onClose()}>

                {/* Backdrop */}
                <Transition.Child
                    as={Fragment}
                    enter="duration-200 ease-out" enterFrom="opacity-0" enterTo="opacity-100"
                    leave="duration-150 ease-in" leaveFrom="opacity-100" leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Transition.Child
                        as={Fragment}
                        enter="duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                        enterFrom="opacity-0 scale-95 translate-y-4"
                        enterTo="opacity-100 scale-100 translate-y-0"
                        leave="duration-200 ease-in"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <Dialog.Panel className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden">

                            {/* Emerald top bar */}
                            <div className="h-0.5 bg-emerald-400 dark:bg-emerald-500 w-full" />

                            <div className="px-7 py-6">

                                {/* Header row */}
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                                                Secure
                                            </span>
                                        </div>
                                        <Dialog.Title className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                                            Update email address
                                        </Dialog.Title>
                                    </div>
                                    {canClose && (
                                        <button
                                            onClick={onClose}
                                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Step bar (steps 1–2) */}
                                {step >= 1 && step < 3 && (
                                    <StepBar current={stepBarIndex} />
                                )}

                                {/* Step panels */}
                                <div className="overflow-hidden">
                                    <AnimatePresence mode="wait" custom={direction}>

                                        {/* Step 0 — Loading */}
                                        {step === 0 && (
                                            <motion.div key="init" {...slide(1)} className="flex flex-col items-center py-10 gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center">
                                                    <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                                                </div>
                                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                                    Sending verification code…
                                                </p>
                                            </motion.div>
                                        )}

                                        {/* Step 1 — OTP */}
                                        {step === 1 && (
                                            <motion.div key="otp" {...slide(direction)} className="space-y-5">
                                                <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-xl px-4 py-3">
                                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                                        We sent a 6-digit code to{' '}
                                                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{user?.email}</span>.
                                                        Enter it below to continue.
                                                    </p>
                                                </div>

                                                <OtpInput otp={otp} setOtp={setOtp} inputRefs={inputRefs} />

                                                <button
                                                    onClick={handleOtpSubmit}
                                                    disabled={otp.join('').length !== 6}
                                                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
                                                >
                                                    Continue
                                                    <ArrowRight className="w-4 h-4" />
                                                </button>

                                                <p className="text-center text-xs text-zinc-400">
                                                    Didn't receive it?{' '}
                                                    <button
                                                        className="text-emerald-600 dark:text-emerald-400 hover:underline"
                                                        onClick={() => api.post('/users/email/request-otp').catch(() => { })}
                                                    >
                                                        Resend code
                                                    </button>
                                                </p>
                                            </motion.div>
                                        )}

                                        {/* Step 2 — New email */}
                                        {step === 2 && (
                                            <motion.form key="email" {...slide(direction)} onSubmit={handleFinalSubmit} className="space-y-5">
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                                                        New email address
                                                    </label>
                                                    <div className={[
                                                        'flex items-center gap-3 px-4 py-3 rounded-xl border transition-all',
                                                        'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700',
                                                        'focus-within:border-emerald-400 dark:focus-within:border-emerald-600',
                                                        'focus-within:ring-2 focus-within:ring-emerald-100 dark:focus-within:ring-emerald-900/40',
                                                    ].join(' ')}>
                                                        <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
                                                        <input
                                                            type="email"
                                                            autoFocus
                                                            required
                                                            value={newEmail}
                                                            onChange={e => setNewEmail(e.target.value)}
                                                            placeholder="you@example.com"
                                                            className="w-full bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none"
                                                        />
                                                    </div>
                                                    <p className="text-[11px] text-zinc-400 ml-1">
                                                        A confirmation link will be sent to this address.
                                                    </p>
                                                </div>

                                                <div className="flex gap-2.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => { back(); setStep(1); }}
                                                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all"
                                                    >
                                                        <ArrowLeft className="w-3.5 h-3.5" />
                                                        Back
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={submitting || !newEmail}
                                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
                                                    >
                                                        {submitting
                                                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</>
                                                            : <>Update email <ArrowRight className="w-4 h-4" /></>
                                                        }
                                                    </button>
                                                </div>
                                            </motion.form>
                                        )}

                                        {/* Step 3 — Success */}
                                        {step === 3 && (
                                            <motion.div
                                                key="success"
                                                initial={{ opacity: 0, scale: 0.96 }}
                                                animate={{ opacity: 1, scale: 1, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }}
                                                className="flex flex-col items-center text-center py-8 gap-5"
                                            >
                                                <motion.div
                                                    initial={{ scale: 0.4, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    transition={{ type: 'spring', stiffness: 420, damping: 18, delay: 0.05 }}
                                                    className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center"
                                                >
                                                    <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                                                </motion.div>

                                                <div className="space-y-1.5">
                                                    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                                                        Check your inbox
                                                    </h3>
                                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-[260px]">
                                                        A confirmation link has been sent to{' '}
                                                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{newEmail}</span>.
                                                        Click it to complete the change.
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={onClose}
                                                    className="mt-1 w-full py-2.5 px-4 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all"
                                                >
                                                    Done
                                                </button>
                                            </motion.div>
                                        )}

                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Footer */}
                            {step < 3 && (
                                <div className="px-7 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    <span className="text-[11px] text-zinc-400 dark:text-zinc-600">
                                        Secured with end-to-end encryption
                                    </span>
                                </div>
                            )}
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    );
}