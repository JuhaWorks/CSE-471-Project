import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api, useAuthStore } from '../store/useAuthStore';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Circular countdown ring ──────────────────────────────────────────────────

function CountdownRing({ seconds, total = 3 }) {
    const r = 16;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - seconds / total);
    return (
        <svg width="44" height="44" viewBox="0 0 44 44" className="rotate-[-90deg]">
            <circle cx="22" cy="22" r={r} fill="none" strokeWidth="2.5"
                className="stroke-zinc-100 dark:stroke-zinc-800" />
            <circle cx="22" cy="22" r={r} fill="none" strokeWidth="2.5"
                strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round"
                className="stroke-zinc-900 dark:stroke-zinc-100 transition-all duration-1000 ease-linear" />
        </svg>
    );
}

// ─── Animated loading dots ────────────────────────────────────────────────────

function LoadingDots() {
    return (
        <div className="flex items-center gap-1.5">
            {[0, 1, 2].map(i => (
                <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
                />
            ))}
        </div>
    );
}

// ─── Step progress dots ───────────────────────────────────────────────────────

function StepDot({ active, done }) {
    return (
        <motion.div
            animate={{
                scale: active ? 1.3 : 1,
                backgroundColor: done || active ? undefined : undefined,
            }}
            transition={{ duration: 0.3 }}
            className={[
                'w-1.5 h-1.5 rounded-full transition-colors duration-500',
                done || active
                    ? 'bg-zinc-900 dark:bg-zinc-100'
                    : 'bg-zinc-200 dark:bg-zinc-700',
            ].join(' ')}
        />
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const TOTAL = 3;

const cardVariants = {
    initial: { opacity: 0, scale: 0.97, y: 16 },
    animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
    exit: { opacity: 0, scale: 0.97, y: -8, transition: { duration: 0.2, ease: 'easeIn' } },
};

const stagger = (i) => ({
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
});

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    const { checkAuth } = useAuthStore();

    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('');
    const [countdown, setCountdown] = useState(TOTAL);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('This link is invalid or has already been used.');
            return;
        }
        (async () => {
            try {
                const res = await api.get(`/auth/verify-email/${token}`);
                await checkAuth();
                setMessage(res.data.message || 'Your email address has been confirmed.');
                setStatus('success');
            } catch (err) {
                setMessage(
                    err?.response?.data?.message ||
                    'We could not verify your email. The link may have expired or already been used.'
                );
                setStatus('error');
            }
        })();
    }, [token, checkAuth]);

    useEffect(() => {
        if (status !== 'success') return;
        const t = setInterval(() => {
            setCountdown(c => {
                if (c <= 1) { clearInterval(t); navigate('/'); return 0; }
                return c - 1;
            });
        }, 1000);
        return () => clearInterval(t);
    }, [status, navigate]);

    const stepIndex = status === 'success' ? 2 : status === 'error' ? 1 : 0;

    const accentBar = {
        loading: 'bg-zinc-200 dark:bg-zinc-700',
        success: 'bg-emerald-400 dark:bg-emerald-500',
        error: 'bg-rose-400   dark:bg-rose-500',
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 gap-8">

            {/* Brand */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-2.5"
            >
                <div className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-white dark:text-zinc-900" />
                </div>
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 tracking-tight">
                    Email verification
                </span>
            </motion.div>

            {/* Card */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={status}
                    variants={cardVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-sm"
                >
                    {/* Status bar */}
                    <div className={`h-0.5 w-full transition-colors duration-700 ${accentBar[status]}`} />

                    <div className="px-8 py-8 flex flex-col items-center text-center gap-6">

                        {/* Icon */}
                        <motion.div {...stagger(0)}>
                            {status === 'loading' && (
                                <div className="w-14 h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center">
                                    <LoadingDots />
                                </div>
                            )}
                            {status === 'success' && (
                                <motion.div
                                    initial={{ scale: 0.4, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                                    className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center"
                                >
                                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                </motion.div>
                            )}
                            {status === 'error' && (
                                <motion.div
                                    initial={{ scale: 0.4, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                                    className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-900/60 flex items-center justify-center"
                                >
                                    <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                                </motion.div>
                            )}
                        </motion.div>

                        {/* Heading + message */}
                        <motion.div {...stagger(1)} className="space-y-1.5">
                            <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                                {status === 'loading' ? 'Verifying your email' :
                                    status === 'success' ? 'Email confirmed' :
                                        'Verification failed'}
                            </h1>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                {status === 'loading'
                                    ? 'Checking your verification link…'
                                    : message}
                            </p>
                        </motion.div>

                        {/* Actions */}
                        <AnimatePresence>
                            {status === 'success' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                    className="w-full space-y-3"
                                >
                                    <div className="flex items-center justify-between px-0.5">
                                        <span className="text-xs text-zinc-400">Redirecting automatically</span>
                                        <div className="relative flex items-center justify-center">
                                            <CountdownRing seconds={countdown} total={TOTAL} />
                                            <span className="absolute text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 leading-none">
                                                {countdown}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate('/')}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 active:scale-[0.98] transition-all"
                                    >
                                        Go to dashboard
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            )}

                            {status === 'error' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                    className="w-full flex flex-col gap-2"
                                >
                                    <Link
                                        to="/resend-verification"
                                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 active:scale-[0.98] transition-all"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        Resend verification email
                                    </Link>
                                    <Link
                                        to="/"
                                        className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all"
                                    >
                                        Back to home
                                    </Link>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Step dots */}
                    <div className="pb-6 flex items-center justify-center gap-2">
                        {[0, 1, 2].map(i => (
                            <StepDot
                                key={i}
                                active={stepIndex === i}
                                done={stepIndex > i || status === 'success'}
                            />
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Help link */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-xs text-zinc-400 dark:text-zinc-600"
            >
                Need help?{' '}
                <a
                    href="mailto:support@yourapp.com"
                    className="text-zinc-500 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline underline-offset-2 transition-colors"
                >
                    Contact support
                </a>
            </motion.p>
        </div>
    );
}