import React, { useState, useEffect, useRef, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Mail, ShieldCheck, ArrowRight, X, CheckCircle, Zap, ShieldAlert, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, useAuthStore } from '../../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

/**
 * Modern 2026 EmailUpdateModal
 * Identity rotation protocol with Glassmorphism 2.0
 */
export default function EmailUpdateModal({ isOpen, onClose }) {
    const { user } = useAuthStore();
    const [step, setStep] = useState(0); // 0: Initializing, 1: OTP, 2: New Email, 3: Success
    const [otp, setOtp] = useState(Array(6).fill(''));
    const [newEmail, setNewEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const inputRefs = useRef([]);

    useEffect(() => {
        if (isOpen) {
            setStep(0);
            setOtp(Array(6).fill(''));
            setNewEmail('');

            // Initiate Identity Verification Protocol
            api.post('/users/email/request-otp')
                .then(() => setStep(1))
                .catch(err => {
                    toast.error(err.response?.data?.message || 'Verification sequence failed.');
                    onClose();
                });
        }
    }, [isOpen, onClose]);

    const handleOtpChange = (e, index) => {
        const value = e.target.value;
        if (isNaN(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleOtpKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('');
        if (!pastedData.length) return;

        const newOtp = [...otp];
        pastedData.forEach((char, i) => {
            if (i < 6) newOtp[i] = char;
        });
        setOtp(newOtp);
        const focusIndex = Math.min(pastedData.length, 5);
        inputRefs.current[focusIndex].focus();
    };

    const handleOtpSubmit = (e) => {
        e.preventDefault();
        if (otp.join('').length === 6) {
            setStep(2);
        }
    };

    const handleFinalSubmit = async (e) => {
        e.preventDefault();
        if (!newEmail || !newEmail.includes('@')) {
            toast.error('Invalid neural link (email) detected.');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/users/email/verify-otp', {
                otp: otp.join(''),
                newEmail
            });
            setStep(3);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Verification rejected.');
            if (error.response?.data?.message?.toLowerCase().includes('otp')) {
                setStep(1);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[250]" onClose={() => { if (step !== 0 && !isSubmitting) onClose(); }}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-500"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-md" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-6 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-500"
                            enterFrom="opacity-0 scale-90 translate-y-10"
                            enterTo="opacity-100 scale-100 translate-y-0"
                            leave="ease-in duration-300"
                            leaveFrom="opacity-100 scale-100 translate-y-0"
                            leaveTo="opacity-0 scale-90 translate-y-10"
                        >
                            <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-[3rem] bg-[#09090b] border border-white/10 p-10 text-left align-middle shadow-[0_50px_100px_rgba(0,0,0,0.8)] transition-all">
                                {step !== 0 && step !== 3 && (
                                    <button
                                        onClick={onClose}
                                        className="absolute top-8 right-8 p-3 rounded-2xl bg-white/5 text-gray-500 hover:text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}

                                {/* Cinematic Headers */}
                                <div className="mb-10">
                                    <div className="flex items-center gap-3 text-cyan-400 font-black text-[9px] uppercase tracking-[0.4em] mb-3">
                                        <ShieldCheck className="w-4 h-4" />
                                        <span>Identity Protocol v4</span>
                                    </div>
                                    <h2 className="text-3xl font-black text-white tracking-tighter leading-none">
                                        Email <span className="text-indigo-400">Rotation.</span>
                                    </h2>
                                </div>

                                <AnimatePresence mode="wait">
                                    {/* Step 0: Protocol Initialization */}
                                    {step === 0 && (
                                        <motion.div 
                                            key="loading"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex flex-col items-center justify-center py-12"
                                        >
                                            <div className="relative">
                                                <Loader2 className="w-16 h-16 text-cyan-500 animate-spin opacity-20" />
                                                <Zap className="absolute inset-0 m-auto w-6 h-6 text-cyan-400 animate-pulse" />
                                            </div>
                                            <p className="mt-8 text-[11px] font-black text-gray-500 uppercase tracking-widest animate-pulse">Initializing Identity Verification...</p>
                                        </motion.div>
                                    )}

                                    {/* Step 1: OTP Verification */}
                                    {step === 1 && (
                                        <motion.div 
                                            key="otp"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-8"
                                        >
                                            <div className="glass-2 bg-white/5 border border-white/5 p-6 rounded-[2rem] space-y-2">
                                                <p className="text-xs text-gray-400 font-medium leading-relaxed">
                                                    An authorization sequence has been dispatched to 
                                                    <span className="text-white bg-white/10 px-2 py-0.5 rounded-lg mx-1 font-bold">{user?.email}</span>.
                                                    Enter the 6-digit marker below.
                                                </p>
                                            </div>

                                            <div className="flex justify-center gap-4 py-4" onPaste={handlePaste}>
                                                {otp.map((digit, index) => (
                                                    <input
                                                        key={index}
                                                        ref={(el) => (inputRefs.current[index] = el)}
                                                        type="text"
                                                        maxLength={1}
                                                        value={digit}
                                                        autoFocus={index === 0}
                                                        onChange={(e) => handleOtpChange(e, index)}
                                                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                                                        className="w-14 h-18 text-center text-2xl font-black bg-white/5 border-2 border-white/5 rounded-2xl text-white focus:bg-white/10 focus:border-cyan-500/50 focus:ring-8 focus:ring-cyan-500/5 outline-none transition-all shadow-2xl"
                                                    />
                                                ))}
                                            </div>

                                            <Button
                                                onClick={() => setStep(2)}
                                                disabled={otp.join('').length !== 6}
                                                className="w-full py-6 rounded-2xl bg-cyan-600 hover:bg-cyan-500"
                                            >
                                                Validate Sequence
                                            </Button>
                                        </motion.div>
                                    )}

                                    {/* Step 2: Destination Uplink */}
                                    {step === 2 && (
                                        <motion.div 
                                            key="email"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-8"
                                        >
                                             <div className="space-y-3">
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">New Identity Marker (Email)</label>
                                                <div className="relative group">
                                                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-700 group-focus-within:text-cyan-400 transition-colors" />
                                                    <input
                                                        type="email"
                                                        autoFocus
                                                        required
                                                        value={newEmail}
                                                        onChange={(e) => setNewEmail(e.target.value)}
                                                        placeholder="nexus@identity.io"
                                                        className="w-full bg-white/5 border border-white/5 rounded-[1.5rem] pl-16 pr-8 py-5 text-white focus:outline-none focus:border-cyan-500/30 focus:ring-[12px] focus:ring-cyan-500/5 transition-all font-medium text-lg placeholder:text-gray-800"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex gap-4">
                                                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 py-5 rounded-2xl group">
                                                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                                                    Re-verify
                                                </Button>
                                                <Button
                                                    onClick={handleFinalSubmit}
                                                    isLoading={isSubmitting}
                                                    disabled={isSubmitting || !newEmail}
                                                    className="flex-[2] py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500"
                                                >
                                                    Deploy Rotation Protocol
                                                </Button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Step 3: Deployment Successful */}
                                    {step === 3 && (
                                        <motion.div 
                                            key="success"
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="flex flex-col items-center text-center py-6"
                                        >
                                            <div className="w-24 h-24 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-8 relative">
                                                <CheckCircle className="w-12 h-12 text-emerald-400" />
                                                <div className="absolute inset-x-0 bottom-0 h-4 bg-emerald-500/20 blur-xl rounded-full" />
                                            </div>
                                            <h3 className="text-2xl font-black text-white tracking-tighter mb-4">Protocol Active.</h3>
                                            <p className="text-xs text-gray-500 font-medium max-w-xs mb-10 leading-relaxed uppercase tracking-widest">
                                                An activation link has been dispatched to <span className="text-white">{newEmail}</span>. Sync terminal to complete rotation.
                                            </p>
                                            <Button
                                                onClick={onClose}
                                                className="w-full py-5 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10"
                                            >
                                                Return to Workspace
                                            </Button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Footer Security Badge */}
                                <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between opacity-30">
                                    <div className="flex items-center gap-3">
                                        <ShieldAlert className="w-4 h-4 text-gray-600" />
                                        <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest">Secure Rotation Channel Active</span>
                                    </div>
                                    <span className="text-[8px] font-mono text-gray-800 uppercase">Hash: {Math.random().toString(16).slice(2, 10)}</span>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
