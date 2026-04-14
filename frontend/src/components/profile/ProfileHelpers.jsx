import React from 'react';
import { Shield, Award } from 'lucide-react';
import { cn } from './ProfileUtils';

export const AvatarFrame = ({ level, children, className }) => {
    const getFrameStyles = () => {
        if (level >= 25) return "ring-4 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.5)]";
        if (level >= 10) return "ring-4 ring-zinc-300 shadow-[0_0_15px_rgba(212,212,216,0.3)]";
        if (level >= 5) return "ring-4 ring-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.2)]";
        return "ring-1 ring-zinc-200 dark:ring-zinc-700";
    };

    return (
        <div className={cn("relative p-1 rounded-2xl transition-all", getFrameStyles(), className)}>
            {children}
            {level >= 5 && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-surface border border-default flex items-center justify-center shadow-lg z-10">
                    <span className="text-[10px] font-black text-primary">L{level}</span>
                </div>
            )}
        </div>
    );
};

export const SectionLabel = ({ children }) => {
    return (
        <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3">
            {children}
        </p>
    );
};

export const FieldWrapper = ({ icon: Icon, children, disabled }) => {
    return (
        <div className={cn(
            "flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all",
            disabled
                ? "bg-sunken border-subtle opacity-60 cursor-not-allowed"
                : "bg-surface border-subtle focus-within:border-theme focus-within:ring-2 focus-within:ring-theme/20"
        )}>
            {Icon && <Icon className="w-4 h-4 shrink-0 text-tertiary" />}
            {children}
        </div>
    );
};

export const BadgeIcon = ({ name, className }) => {
    switch (name) {
        case 'Bug Squasher':
            return (
                <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#EF4444" fillOpacity="0.1" />
                    <path d="M12 6V18M12 6L8 10M12 6L16 10" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 13.5C9 13.5 10.5 15 12 15C13.5 15 15 13.5 15 13.5" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="8" cy="9" r="1" fill="#EF4444" />
                    <circle cx="16" cy="9" r="1" fill="#EF4444" />
                </svg>
            );
        case 'Early Bird':
            return (
                <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#F59E0B" fillOpacity="0.1" />
                    <path d="M12 8V12L15 15" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="7" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="2 2" />
                </svg>
            );
        case 'Streak Master':
            return (
                <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#F97316" fillOpacity="0.1" />
                    <path d="M12 18C15.3137 18 18 15.3137 18 12C18 11.2312 17.8558 10.4959 17.5932 9.81977C17.0601 8.44855 16.0357 7.31959 14.733 6.64166C13.9168 6.21689 12.9863 5.97656 12 5.97656C11.0137 5.97656 10.0832 6.21689 9.26697 6.64166C7.96429 7.31959 6.93988 8.44855 6.40683 9.81977C6.14417 10.4959 6 11.2312 6 12C6 15.3137 8.68629 18 12 18Z" stroke="#F97316" strokeWidth="2" />
                    <path d="M12 15C13.6569 15 15 13.6569 15 12" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            );
        case 'Collaboration King':
            return (
                <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#3B82F6" fillOpacity="0.1" />
                    <circle cx="9" cy="10" r="3" stroke="#3B82F6" strokeWidth="1.5" />
                    <circle cx="15" cy="10" r="3" stroke="#3B82F6" strokeWidth="1.5" />
                    <path d="M12 15C12 17.5 9 17.5 9 17.5C6 17.5 6 15 6 15" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M18 15C18 17.5 15 17.5 15 17.5C12 17.5 12 15 12 15" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            );
        default:
            return <Award className={className + " text-theme"} />;
    }
};
