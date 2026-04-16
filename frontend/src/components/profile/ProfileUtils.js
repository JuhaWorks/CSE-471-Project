import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

export function cn(...args) {
    return twMerge(clsx(args));
}

export const getLevelProgress = (xp, level) => {
    const getReq = (lvl) => {
        if (lvl <= 1) return 0;
        return Math.floor(100 * Math.pow(lvl, 2.2));
    };
    
    const baseXP = getReq(level);
    const nextXP = getReq(level + 1);
    const range = nextXP - baseXP;
    const progress = range > 0 ? Math.min(100, Math.max(0, ((xp - baseXP) / range) * 100)) : 0;
    
    return { progress, nextXP };
};

export const STATUSES = ['Online', 'Away', 'Do Not Disturb', 'Offline'];

export const STATUS_CONFIG = {
    Online: { dot: 'bg-success', label: 'text-success', ring: 'ring-success/20' },
    Away: { dot: 'bg-warning', label: 'text-warning', ring: 'ring-warning/20' },
    'Do Not Disturb': { dot: 'bg-danger', label: 'text-danger', ring: 'ring-danger/20' },
    Offline: { dot: 'bg-tertiary', label: 'text-tertiary', ring: 'ring-tertiary/20' },
};

export const ROLE_CONFIG = {
    Admin: { bg: 'bg-danger/5', text: 'text-danger', border: 'border-danger/20' },
    Manager: { bg: 'bg-theme/5', text: 'text-theme', border: 'border-theme/20' },
    Developer: { bg: 'bg-theme/5', text: 'text-theme', border: 'border-theme/20' },
    Guest: { bg: 'bg-sunken', text: 'text-tertiary', border: 'border-subtle' },
};
