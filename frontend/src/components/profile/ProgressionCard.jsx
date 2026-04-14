import React from 'react';
import { Star, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { 
    Radar, 
    RadarChart, 
    PolarGrid, 
    PolarAngleAxis, 
    ResponsiveContainer 
} from 'recharts';
import { cn, getLevelProgress } from './ProfileUtils';
import { BadgeIcon } from './ProfileHelpers';

const ProgressionCard = ({ user }) => {
    const xp = user?.gamification?.xp || 0;
    const level = user?.gamification?.level || 1;
    const { progress } = getLevelProgress(xp, level);

    const radarData = [
        { subject: 'Bug', A: user?.gamification?.specialties?.Bug || 0, fullMark: 1500 },
        { subject: 'Feat', A: user?.gamification?.specialties?.Feature || 0, fullMark: 1500 },
        { subject: 'Main', A: user?.gamification?.specialties?.Maintenance || 0, fullMark: 1500 },
        { subject: 'Res', A: user?.gamification?.specialties?.Research || 0, fullMark: 1500 },
        { subject: 'Task', A: user?.gamification?.specialties?.Task || 0, fullMark: 1500 },
    ];

    return (
        <div className="bg-surface border border-default rounded-2xl p-6 relative group/card overflow-hidden">
            {/* Glow backdrop confined */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-theme/20 rounded-full blur-[50px] animate-pulse" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-theme/10 rounded-full blur-[40px]" />
            </div>
            
            <div className="flex flex-col mb-5">
                <span className="text-[10px] font-black text-tertiary uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                    <Star className="w-3 h-3 text-theme" /> Total Experience
                </span>
                <div className="text-3xl font-black font-mono text-primary tracking-tighter">
                    {xp.toLocaleString()} <span className="text-sm font-bold opacity-40 ml-0.5">XP</span>
                </div>
            </div>
            
            <div className="space-y-2 mb-6">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-primary flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded bg-theme/20 text-theme flex items-center justify-center text-[10px]">
                            L{level}
                        </div>
                        Progress to L{level + 1}
                    </span>
                    <span className="text-[10px] font-mono text-tertiary">
                        {progress.toFixed(0)}%
                    </span>
                </div>
                <div className="h-1.5 w-full bg-sunken rounded-full overflow-hidden border border-default/30">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className="h-full bg-theme relative"
                    >
                        <div className="absolute inset-0 bg-white/40 animate-pulse" />
                    </motion.div>
                </div>
            </div>

            {/* Specialty Radar Chart */}
            <div className="h-[200px] w-full mt-4 flex items-center justify-center overflow-visible">
                <div className="w-full h-full min-h-[200px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                            <defs>
                                <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--accent-500)" stopOpacity={0.6}/>
                                    <stop offset="95%" stopColor="var(--accent-500)" stopOpacity={0.1}/>
                                </linearGradient>
                            </defs>
                            <PolarGrid stroke="var(--border-strong)" strokeOpacity={0.5} />
                            <PolarAngleAxis 
                                dataKey="subject" 
                                tick={{ 
                                    fontSize: 10, 
                                    fontWeight: 900, 
                                    fill: 'var(--text-primary)',
                                    letterSpacing: '0.05em'
                                }} 
                            />
                            <Radar
                                name="Specialty"
                                dataKey="A"
                                stroke="var(--accent-500)"
                                strokeWidth={2}
                                fill="url(#radarGradient)"
                                fillOpacity={1}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="border-t border-glass pt-6 mt-2">
                <h3 className="text-[10px] font-black text-tertiary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-theme" /> Achievement Showcase
                </h3>
                
                {user?.gamification?.badges?.length > 0 ? (
                    <div className="grid grid-cols-4 gap-3">
                        {user.gamification.badges.map((badge, idx) => {
                            const rarity = level > 20 ? 'Legendary' : level > 10 ? 'Rare' : 'Common';
                            const rarityColor = rarity === 'Legendary' ? 'text-amber-500' : rarity === 'Rare' ? 'text-purple-500' : 'text-theme';
                            
                            return (
                                <div key={idx} className="group/badge relative">
                                    <div className="aspect-square rounded-2xl bg-sunken border border-default flex items-center justify-center cursor-help transition-all hover:scale-110 hover:border-theme/40 hover:shadow-[0_0_20px_rgba(var(--theme-rgb),0.1)] overflow-hidden">
                                        <BadgeIcon name={badge.name} className="w-10 h-10" />
                                        <div className="absolute inset-0 bg-gradient-to-tr from-theme/0 to-theme/5 opacity-0 group-hover/badge:opacity-100 transition-opacity" />
                                    </div>
                                    
                                    {/* Tooltip */}
                                    <div className={cn(
                                        "absolute bottom-full mb-3 w-56 p-4 bg-surface/95 backdrop-blur-md border border-default rounded-[24px] shadow-2xl opacity-0 invisible group-hover/badge:opacity-100 group-hover/badge:visible transition-all z-[100] pointer-events-none transform translate-y-2 group-hover/badge:translate-y-0",
                                        idx % 4 === 0 ? "left-0" : idx % 4 === 3 ? "right-0" : "left-1/2 -translate-x-1/2"
                                    )}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <BadgeIcon name={badge.name} className="w-5 h-5" />
                                                <span className="text-[11px] font-black text-primary uppercase tracking-tighter">{badge.name}</span>
                                            </div>
                                            <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-default/50", rarityColor)}>
                                                {rarity}
                                            </span>
                                        </div>
                                        <p className="text-[10px] leading-relaxed text-tertiary font-medium mb-3">
                                            {badge.description || "Earned through consistency and high-impact contributions."}
                                        </p>
                                        <div className="flex items-center justify-between pt-2 border-t border-default/50">
                                            <span className="text-[8px] font-black text-tertiary uppercase tracking-widest">Unlocked</span>
                                            <span className="text-[10px] font-black text-primary">LVL {level}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-6 border border-dashed border-glass rounded-2xl bg-sunken/50">
                        <div className="w-10 h-10 rounded-full bg-default/50 flex items-center justify-center mx-auto mb-2">
                             <Award className="w-5 h-5 text-tertiary" />
                        </div>
                        <p className="text-[10px] font-black text-tertiary uppercase tracking-widest">No badges earned yet</p>
                        <p className="text-[9px] text-zinc-500 font-medium">Complete tasks to start your legend.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProgressionCard;
