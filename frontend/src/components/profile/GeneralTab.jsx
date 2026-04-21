import React from 'react';
import { Settings, User, Mail, MapPin, MessageSquare, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, STATUSES, STATUS_CONFIG } from './ProfileUtils';
import { SectionLabel, FieldWrapper } from './ProfileHelpers';
import { Button } from '../ui/BaseUI';

const GeneralTab = ({ 
    user, 
    form, 
    setForm, 
    skillInput, 
    setSkillInput, 
    setStatus, 
    saveProfile, 
    profileLoading, 
    saved 
}) => {
    return (
        <div className="bg-surface border border-default rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-default flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-tertiary" />
                    <span className="text-xs font-black text-tertiary uppercase tracking-widest">General Identity</span>
                </div>
                {saved && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] font-black text-success uppercase tracking-widest">
                        Saved
                    </motion.span>
                )}
            </div>

            <form onSubmit={saveProfile} className="p-6 space-y-6">
                {/* Name & Email row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <SectionLabel>Display name</SectionLabel>
                        <FieldWrapper icon={User}>
                            <input
                                type="text"
                                value={form.name}
                                onChange={e => setForm(s => ({ ...s, name: e.target.value }))}
                                placeholder="Your name"
                                className="w-full bg-transparent text-sm text-primary placeholder-tertiary outline-none"
                            />
                        </FieldWrapper>
                    </div>
                    <div>
                        <SectionLabel>Email address</SectionLabel>
                        <FieldWrapper icon={Mail} disabled>
                            <input
                                disabled
                                value={user?.email}
                                className="w-full bg-transparent text-sm text-secondary outline-none cursor-not-allowed"
                            />
                        </FieldWrapper>
                        <p className="mt-1.5 text-[11px] text-zinc-400 ml-1">Email cannot be changed.</p>
                    </div>
                </div>

                {/* Location */}
                <div>
                    <SectionLabel>Home City</SectionLabel>
                    <FieldWrapper icon={MapPin}>
                        <input
                            type="text"
                            value={form.location}
                            onChange={e => setForm(s => ({ ...s, location: e.target.value }))}
                            placeholder="e.g. Dhaka, New York, London"
                            className="w-full bg-transparent text-sm text-primary placeholder-tertiary outline-none"
                        />
                    </FieldWrapper>
                    <p className="mt-1.5 text-[11px] text-zinc-400 ml-1">Manual location will override automatic weather detection.</p>
                </div>

                {/* Bio & Skills */}
                <div className="space-y-6">
                    <div>
                        <SectionLabel>Professional Bio</SectionLabel>
                        <div className="flex gap-3 px-4 py-3.5 rounded-xl border bg-sunken border-subtle focus-within:border-theme transition-all">
                            <MessageSquare className="w-4 h-4 shrink-0 text-tertiary mt-0.5" />
                            <textarea
                                rows={4}
                                value={form.bio}
                                onChange={e => setForm(s => ({ ...s, bio: e.target.value }))}
                                placeholder="Write a brief professional summary..."
                                className="w-full bg-transparent text-sm text-primary placeholder-tertiary outline-none resize-none"
                            />
                        </div>
                    </div>

                    <div>
                        <SectionLabel>Professional Skills</SectionLabel>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {form.skills.map((s, i) => (
                                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-theme/10 border border-theme/30 text-theme text-[11px] font-bold uppercase transition-all hover:bg-theme/20 group">
                                    {s}
                                    <button 
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, skills: f.skills.filter(sk => sk !== s) }))}
                                        className="hover:text-rose-500"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                value={skillInput}
                                onChange={e => setSkillInput(e.target.value)}
                                placeholder="Add a skill (e.g. React, Python)"
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const val = skillInput.trim();
                                        if (val && !form.skills.includes(val)) {
                                            setForm(f => ({ ...f, skills: [...f.skills, val] }));
                                            setSkillInput('');
                                        }
                                    }
                                }}
                                className="flex-1 bg-surface border border-subtle rounded-xl px-4 py-2 text-sm text-primary outline-none focus:border-theme"
                            />
                            <Button 
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    const val = skillInput.trim();
                                    if (val && !form.skills.includes(val)) {
                                        setForm(f => ({ ...f, skills: [...f.skills, val] }));
                                        setSkillInput('');
                                    }
                                }}
                            >
                                Add
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-zinc-100 dark:border-zinc-800" />

                {/* Status */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <SectionLabel>Status</SectionLabel>
                        <span className={cn("text-[11px] font-medium flex items-center gap-1.5", STATUS_CONFIG[form.status].label)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full inline-block", STATUS_CONFIG[form.status].dot)} />
                            {form.status}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                        {STATUSES.map(s => {
                            const active = form.status === s;
                            const cfg = STATUS_CONFIG[s];
                            return (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setStatus(s)}
                                    className={cn(
                                        "flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-tertiary",
                                        active
                                            ? "bg-theme text-primary border-theme"
                                            : "bg-surface border-subtle hover:border-theme hover:text-primary"
                                    )}
                                >
                                    <span className={cn("w-2 h-2 rounded-full shrink-0", cfg.dot)} />
                                    <span className="text-[12px]">{s}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-zinc-100 dark:border-zinc-800" />

                {/* Save */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <AnimatePresence>
                        {saved && (
                            <motion.span
                                initial={{ opacity: 0, x: 8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-1.5 text-sm text-theme font-medium"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Saved
                            </motion.span>
                        )}
                    </AnimatePresence>
                    <Button
                        type="submit"
                        isLoading={profileLoading}
                        disabled={profileLoading}
                        className="px-6 py-2.5 rounded-xl text-sm font-medium bg-theme text-primary hover:opacity-90 transition-opacity"
                    >
                        Save changes
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default GeneralTab;
