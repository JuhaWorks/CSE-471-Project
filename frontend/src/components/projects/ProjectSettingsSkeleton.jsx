import React from 'react';
import { Skeleton } from '../ui/PremiumLoaders';

const ProjectSettingsSkeleton = () => {
    return (
        <div className="max-w-6xl mx-auto p-6 sm:p-10 space-y-10">
            {/* Header Skeleton */}
            <div className="flex items-center gap-5">
                <Skeleton className="w-11 h-11 rounded-2xl" opacity={0.2} />
                <div className="space-y-2">
                    <Skeleton className="h-10 w-48 rounded-xl" opacity={0.3} />
                    <Skeleton className="h-4 w-32 rounded-lg" opacity={0.15} />
                </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="flex gap-2 p-1.5 bg-zinc-950/80 border border-white/5 rounded-2xl w-fit">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-10 w-24 rounded-xl" opacity={0.1} />
                ))}
            </div>

            {/* Content Skeleton */}
            <div className="space-y-6">
                <Skeleton className="h-64 w-full rounded-[32px]" opacity={0.05} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-48 w-full rounded-[32px]" opacity={0.05} />
                    <Skeleton className="h-48 w-full rounded-[32px]" opacity={0.05} />
                </div>
            </div>
        </div>
    );
};

export default ProjectSettingsSkeleton;

