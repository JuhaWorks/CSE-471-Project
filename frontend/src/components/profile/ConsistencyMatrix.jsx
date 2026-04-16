import React, { useState, useMemo } from 'react';
import { cn } from './ProfileUtils';

const WEEKS = 52;
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const TYPES = ['Strategic', 'Engineering', 'Sustainability', 'Operations'];
const FILTERS = ['All activity', 'Strategic', 'Engineering', 'Sustainability', 'Operations'];

function intensity(n) {
    if (!n || n === 0) return 0;
    if (n <= 4) return 1;  // Minor actions
    if (n <= 10) return 2; // Mid productivity
    if (n <= 20) return 3; // High productivity
    return 4;              // Exceptional peak
}

function formatDate(d) {
    if (!d) return 'Unknown date';
    try {
        const date = d instanceof Date ? d : new Date(d);
        if (isNaN(date.getTime())) return 'Invalid date';
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    } catch (e) {
        return 'Date error';
    }
}

const CELL_COLORS = [
    'bg-zinc-100 dark:bg-[#161b22] border border-zinc-200 dark:border-transparent',
    'bg-[#9be9a8] dark:bg-[#0e4429]',
    'bg-[#40c463] dark:bg-[#006d32]',
    'bg-[#30a14e] dark:bg-[#26a641]',
    'bg-[#216e39] dark:bg-[#39d353]',
];

function Cell({ cell, filteredCount, weekIndex }) {
    const [tooltip, setTooltip] = useState(false);
    if (!cell) return <div className="w-[13px] h-[13px] rounded-[2px] opacity-0" />;

    const c = filteredCount;
    const iv = intensity(c);
    
    // Smart Positioning: Align tooltip to the left if in the last 6 columns to prevent cut-off
    const isRightSide = weekIndex > WEEKS - 6;

    return (
        <div className="relative" onMouseEnter={() => setTooltip(true)} onMouseLeave={() => setTooltip(false)}>
            <div className={cn(
                'w-[13px] h-[13px] rounded-[2px] cursor-pointer transition-transform duration-100 hover:scale-125 hover:z-10',
                CELL_COLORS[iv]
            )} />
            {tooltip && (
                <div className={cn(
                    "absolute bottom-[calc(100%+8px)] z-50 pointer-events-none",
                    "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700",
                    "rounded-lg px-3 py-2 shadow-lg whitespace-nowrap text-left",
                    isRightSide ? "right-0" : "left-1/2 -translate-x-1/2"
                )}>
                    <p className="text-[12px] font-medium text-zinc-900 dark:text-zinc-100">
                        {c === 0 ? 'No contributions' : `${c} contribution point${c !== 1 ? 's' : ''}`}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{formatDate(cell.date)}</p>
                </div>
            )}
        </div>
    );
}

function StatCard({ value, label }) {
    return (
        <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-xl px-4 py-3 min-w-[90px]">
            <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 leading-none">{value}</div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5">{label}</div>
        </div>
    );
}

export default function ConsistencyMatrix({ heatmapData: externalData }) {
    const [activeFilter, setActiveFilter] = useState('All activity');

    const today = useMemo(() => {
        const d = new Date(); d.setHours(0, 0, 0, 0); return d;
    }, []);

    const start = useMemo(() => {
        const d = new Date(today);
        // Start from exactly 52 weeks ago (aligned to start of that week)
        d.setDate(today.getDate() - (WEEKS * 7 - 1));
        return d;
    }, [today]);

    // Data Transformer: Convert flat API list into 52x7 matrix
    const data = useMemo(() => {
        const matrix = [];
        const externalMap = new Map();
        
        if (Array.isArray(externalData)) {
            externalData.forEach(day => {
                externalMap.set(day.date, day);
            });
        }

        for (let w = 0; w < WEEKS; w++) {
            const week = [];
            for (let d = 0; d < 7; d++) {
                const date = new Date(start);
                date.setDate(start.getDate() + (w * 7 + d));
                
                if (date > today) {
                    week.push(null);
                    continue;
                }

                const iso = date.toISOString().split('T')[0];
                const dayData = externalMap.get(iso);
                
                week.push({
                    date: date,
                    count: dayData?.count || 0,
                    items: dayData?.items || []
                });
            }
            matrix.push(week);
        }
        return matrix;
    }, [externalData, start, today]);

    const getFilteredCount = (cell) => {
        if (!cell || !cell.items) return 0;
        if (activeFilter === 'All activity') return cell.count;
        // Count specific item types if filtered
        return cell.items.filter(t => t === activeFilter).length;
    };

    const stats = useMemo(() => {
        const flat = data.flat().filter(Boolean);
        let total = 0, activeDays = 0;
        
        for (const cell of flat) {
            const c = getFilteredCount(cell);
            total += c;
            if (c > 0) activeDays++;
        }

        let maxStreak = 0, curStreak = 0, trailingStreak = 0;
        for (const cell of flat) {
            if (getFilteredCount(cell) > 0) { 
                curStreak++; 
                maxStreak = Math.max(maxStreak, curStreak); 
            } else {
                curStreak = 0;
            }
        }
        
        // Calculate current streak (backwards from today)
        for (let i = flat.length - 1; i >= 0; i--) {
            if (!flat[i]) continue;
            const c = getFilteredCount(flat[i]);
            if (c > 0) trailingStreak++;
            else if (trailingStreak > 0) break; // Finished current active run
            // If it's today and 0, we don't break yet, might be yesterday
            if (c === 0 && i < flat.length - 2) break;
        }

        const avg = activeDays > 0 ? Math.round((total / activeDays) * 10) / 10 : 0;
        return { total, activeDays, maxStreak, trailingStreak, avg };
    }, [data, activeFilter]);

    const typeLabel = activeFilter === 'All activity' ? 'contributions' : `${activeFilter.toLowerCase()} tasks`;

    return (
        <div className="bg-surface border border-default rounded-2xl p-6 overflow-visible">

            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
                <div>
                    <h3 className="text-sm font-semibold text-primary">Contribution activity</h3>
                    <p className="text-[11px] text-tertiary mt-1">
                        {stats.total} {typeLabel} in the last year
                    </p>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                    {FILTERS.map(f => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={cn(
                                'text-[11px] font-medium px-3 py-1.5 rounded-lg border transition-all',
                                activeFilter === f
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                    : 'bg-transparent text-tertiary border-subtle hover:border-default hover:text-secondary'
                            )}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats row */}
            <div className="flex gap-2 flex-wrap mb-5">
                <StatCard value={stats.total} label={`Total ${typeLabel}`} />
                <StatCard value={stats.activeDays} label="Active days" />
                <StatCard value={stats.maxStreak} label="Longest streak" />
                <StatCard value={stats.trailingStreak} label="Current streak" />
                <StatCard value={stats.avg} label="Avg per active day" />
            </div>

            {/* Grid */}
            <div className="overflow-x-auto pt-10 pb-4 scrollbar-hide overflow-y-visible">
                <div className="flex gap-0 min-w-max relative">

                    {/* Day labels */}
                    <div className="flex flex-col gap-0 pr-2 pt-5 flex-shrink-0">
                        {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((label, i) => (
                            <div key={i} className="h-[13px] mb-[3px] w-7 text-right text-[10px] text-tertiary leading-[13px]">
                                {label}
                            </div>
                        ))}
                    </div>

                    {/* Weeks */}
                    <div className="flex flex-col">
                        <div className="flex gap-[3px] h-5">
                            {Array.from({ length: WEEKS }, (_, w) => {
                                const firstDay = new Date(start);
                                firstDay.setDate(start.getDate() + w * 7);
                                const m = firstDay.getMonth();
                                const prevFirstDay = new Date(start);
                                prevFirstDay.setDate(start.getDate() + (w - 1) * 7);
                                const showLabel = w === 0 || m !== prevFirstDay.getMonth();
                                return (
                                    <div key={w} className="w-[13px] flex-shrink-0 flex items-center">
                                        {showLabel && (
                                            <span className="text-[10px] text-tertiary whitespace-nowrap -ml-0.5">
                                                {MONTH_NAMES[m]}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex gap-[3px]">
                            {Array.from({ length: WEEKS }, (_, w) => (
                                <div key={w} className="flex flex-col gap-[3px]">
                                    {Array.from({ length: 7 }, (_, d) => {
                                        const cell = data[w]?.[d];
                                        return (
                                            <Cell
                                                key={d}
                                                cell={cell}
                                                filteredCount={cell ? getFilteredCount(cell) : 0}
                                                weekIndex={w}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                <div className="flex items-center gap-3 text-[11px] text-tertiary flex-wrap">
                    <span>{stats.trailingStreak} day current streak</span>
                    <span className="text-default">·</span>
                    <span>{stats.maxStreak} day longest streak</span>
                    <span className="text-default">·</span>
                    <span>{stats.activeDays} active of {WEEKS * 7} days</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-tertiary">
                    <span>Less</span>
                    <div className="flex gap-[3px]">
                        {CELL_COLORS.map((cls, i) => (
                            <div key={i} className={cn('w-[13px] h-[13px] rounded-[2px]', cls)} />
                        ))}
                    </div>
                    <span>More</span>
                </div>
            </div>
        </div>
    );
}