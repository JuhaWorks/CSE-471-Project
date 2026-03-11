import React, { forwardRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Plus, Loader2, Mail, Shield, Zap } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Button from '../ui/Button';

const cn = (...inputs) => twMerge(clsx(inputs));

/**
 * Modern 2026 InviteMemberDialog
 * Glassmorphism 2.0, Agentic UX, High-fidelity interactions
 */
const InviteMemberDialog = forwardRef(({
    isOpen,
    onOpenChange,
    email,
    role,
    onEmailChange,
    onRoleChange,
    onInvite,
    isLoading
}, ref) => {
    return (
        <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
            <Dialog.Trigger asChild>
                <Button
                    leftIcon={Plus}
                    size="lg"
                >
                    Expand Team
                </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] animate-in fade-in duration-500" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg glass-2 bg-[#09090b]/40 border border-white/10 p-10 rounded-[3rem] shadow-2xl z-[151] animate-in zoom-in-95 duration-500 focus:outline-none">
                    <div className="flex items-center justify-between mb-10">
                        <div className="space-y-1">
                            <h3 className="text-3xl font-black text-white tracking-tighter">Invite Agent.</h3>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                                Synchronizing Team Nodes
                            </p>
                        </div>
                        <Dialog.Close className="p-3 bg-white/5 border border-white/5 hover:bg-white/10 rounded-2xl transition-all text-gray-400 hover:text-white active:scale-90">
                            <X className="w-5 h-5" />
                        </Dialog.Close>
                    </div>

                    <form onSubmit={onInvite} className="space-y-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-1">Universal Identifier (Email)</label>
                            <div className="relative group/field">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-700 transition-colors group-focus-within/field:text-cyan-400" />
                                <input
                                    ref={ref}
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => onEmailChange(e.target.value)}
                                    placeholder="agent@klivra.network"
                                    className="w-full bg-white/5 border border-white/5 rounded-3xl pl-14 pr-6 py-5 text-white placeholder:text-gray-800 focus:outline-none focus:border-cyan-500/30 focus:ring-8 focus:ring-cyan-500/5 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Clearance Level</label>
                                <span className="text-[9px] font-black text-cyan-400 tracking-widest uppercase flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                                    <Shield className="w-3 h-3" />
                                    Access Protocol
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                {['Manager', 'Editor', 'Viewer'].map(r => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => onRoleChange(r)}
                                        className={cn(
                                            "relative px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border group overflow-hidden",
                                            role === r
                                                ? "bg-white text-black border-white shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
                                                : "bg-white/5 border-white/5 text-gray-500 hover:border-white/10 hover:text-gray-300"
                                        )}
                                    >
                                        <span className="relative z-10">{r}</span>
                                        {role === r && (
                                            <motion.div 
                                                layoutId="role-bg"
                                                className="absolute inset-0 bg-white"
                                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button
                                type="submit"
                                disabled={isLoading || !email}
                                isLoading={isLoading}
                                className="w-full py-6 text-lg tracking-tighter rounded-[2rem]"
                            >
                                Dispatch Invitation
                            </Button>
                        </div>
                        
                        <p className="text-[9px] text-center text-gray-600 font-bold uppercase tracking-widest leading-relaxed">
                            Invitation will be transmitted through the secure neural link. <br/>
                            Clearance level can be adjusted post-synchronization.
                        </p>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
});

InviteMemberDialog.displayName = 'InviteMemberDialog';

export default InviteMemberDialog;
