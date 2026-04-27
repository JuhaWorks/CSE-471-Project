import React from 'react';
import { Camera, Shield, Trash2 } from 'lucide-react';
import { cn, ROLE_CONFIG, STATUS_CONFIG } from './ProfileUtils';
import { AvatarFrame } from './ProfileHelpers';

const IdentityCard = ({ 
    user, 
    status, 
    fileRef, 
    onFile, 
    removeAvatar 
}) => {
    const role = user?.role || 'Guest';
    const roleConfig = ROLE_CONFIG[role] || ROLE_CONFIG.Guest;
    const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.Online;

    return (
        <div className="bg-surface border border-default rounded-2xl p-6 flex flex-col items-center gap-5">
            {/* Avatar */}
            <div className="relative group">
                <AvatarFrame level={user?.gamification?.level || 1}>
                    <div className="w-24 h-24 rounded-2xl overflow-hidden">
                        <img
                            src={user?.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                            alt={user?.name}
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </AvatarFrame>
                {/* Status dot */}
                <div className={cn(
                    "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-surface",
                    statusConfig.dot
                )} />
                {/* Hover overlay */}
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-5 h-5 text-primary" />
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
                </label>
            </div>

            {/* Name & email */}
            <div className="text-center space-y-1">
                <p className="font-black text-primary text-base leading-snug">
                    {user?.name}
                </p>
                <p className="text-[11px] font-medium text-tertiary">{user?.email}</p>
            </div>

            {/* Role badge */}
            <div className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border",
                roleConfig.bg, roleConfig.text, roleConfig.border
            )}>
                <Shield className="w-3 h-3" />
                {role}
            </div>

            {/* Avatar actions */}
            <div className="w-full space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-secondary hover:text-primary hover:bg-sunken rounded-lg transition-all"
                >
                    <Camera className="w-4 h-4" />
                    Upload photo
                </button>
                {user?.avatar && !user.avatar.includes('149071.png') && (
                    <button
                        onClick={removeAvatar}
                        className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
                    >
                        <Trash2 className="w-4 h-4" />
                        Remove photo
                    </button>
                )}
            </div>
        </div>
    );
};

export default IdentityCard;
