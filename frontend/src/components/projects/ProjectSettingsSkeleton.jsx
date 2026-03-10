import React from 'react';

const ProjectSettingsSkeleton = () => {
    return (
        <div className="max-w-6xl mx-auto p-6 sm:p-10 space-y-10">
            {/* Header Skeleton */}
            <div className="flex items-center gap-5 animate-pulse">
                <div className="w-11 h-11 bg-white/5 rounded-2xl" />
                <div className="space-y-2">
                    <div className="h-10 w-48 bg-white/5 rounded-xl" />
                    <div className="h-4 w-32 bg-white/5 rounded-lg" />
                </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="flex gap-2 p-1.5 bg-zinc-950/80 border border-white/5 rounded-2xl w-fit animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 w-24 bg-white/5 rounded-xl" />
                ))}
            </div>

            {/* Content Skeleton */}
            <div className="space-y-6 animate-pulse">
                <div className="h-64 bg-white/5 rounded-[32px] border border-white/5" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-32 bg-white/5 rounded-[32px] border border-white/5" />
                    <div className="h-32 bg-white/5 rounded-[32px] border border-white/5" />
                </div>
            </div>
        </div>
    );
};

export default ProjectSettingsSkeleton;
