import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

export function cn(...args) {
    return twMerge(clsx(args));
}

export const getLevelProgress = (xp, level) => {
    const thresholds = {
        1: 0, 2: 100, 3: 300, 4: 600, 5: 1000,
        6: 1500, 7: 2100, 8: 2800, 9: 3600, 10: 4500
    };
    
    const getReq = (lvl) => {
        if (lvl <= 10) return thresholds[lvl] || 0;
        let total = thresholds[10];
        for (let i = 11; i <= lvl; i++) {
            total += (i * 500);
        }
        return total;
    };
    
    const baseXP = getReq(level);
    const nextXP = getReq(level + 1);
    const progress = Math.min(100, Math.max(0, ((xp - baseXP) / (nextXP - baseXP)) * 100));
    
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
