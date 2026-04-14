import React, { useState, useRef } from 'react';
import { Camera, Link2, Trash2, Upload } from 'lucide-react';
import { cn } from './ProfileUtils';

const ProfileBanner = ({
    user,
    coverFileRef,
    handleCoverFile,
    handleCoverPrompt,
    onRemoveCover,
}) => {
    const [showActions, setShowActions] = useState(false);
    const hasCover = !!user?.coverImage;

    return (
        <div
            className="relative w-full h-52 rounded-2xl overflow-hidden group"
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            {/* Background */}
            {hasCover ? (
                <img
                    src={user.coverImage}
                    className="absolute inset-0 w-full h-full object-cover"
                    alt="Cover"
                />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-theme/30 via-theme/10 to-sunken" />
            )}

            {/* Scrim — only on hover so the clean state stays clean */}
            <div className={cn(
                'absolute inset-0 bg-black/0 transition-all duration-200',
                showActions && 'bg-black/30'
            )} />

            {/* Corner badge — always visible, shows cover is customizable */}
            {!hasCover && (
                <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 bg-surface/30 backdrop-blur-md border border-white/10 rounded-lg">
                    <Camera className="w-3 h-3 text-white/70" />
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Cover photo</span>
                </div>
            )}

            {/* Action bar — hover on desktop, always visible on touch */}
            <div className={cn(
                'absolute bottom-0 inset-x-0 flex items-center justify-end gap-2 px-4 py-3',
                'transition-all duration-200',
                showActions ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1',
                'sm:opacity-0 sm:translate-y-1 group-hover:opacity-100 group-hover:translate-y-0',
            )}>
                {/* Upload file */}
                <button
                    onClick={() => coverFileRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5
                        bg-black/50 backdrop-blur-md border border-white/15
                        rounded-lg text-[11px] font-semibold text-white
                        hover:bg-black/70 active:scale-95 transition-all"
                >
                    <Upload className="w-3 h-3" />
                    Upload photo
                </button>

                {/* Use URL */}
                <button
                    onClick={handleCoverPrompt}
                    className="flex items-center gap-1.5 px-3 py-1.5
                        bg-black/50 backdrop-blur-md border border-white/15
                        rounded-lg text-[11px] font-semibold text-white
                        hover:bg-black/70 active:scale-95 transition-all"
                >
                    <Link2 className="w-3 h-3" />
                    Use URL
                </button>

                {/* Remove — only if a cover is set */}
                {hasCover && onRemoveCover && (
                    <button
                        onClick={onRemoveCover}
                        className="flex items-center gap-1.5 px-3 py-1.5
                            bg-black/50 backdrop-blur-md border border-white/15
                            rounded-lg text-[11px] font-semibold text-rose-400
                            hover:bg-black/70 hover:text-rose-300 active:scale-95 transition-all"
                    >
                        <Trash2 className="w-3 h-3" />
                        Remove
                    </button>
                )}
            </div>

            {/* Hidden file input */}
            <input
                ref={coverFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverFile}
            />
        </div>
    );
};

export default ProfileBanner;