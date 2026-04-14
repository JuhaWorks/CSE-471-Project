import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, Zap } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { cn } from './ProfileUtils';
import Button from '../ui/Button';

export const CropModal = ({ 
    cropping, 
    preview, 
    crop, 
    setCrop, 
    zoom, 
    setZoom, 
    onCropComplete, 
    cancelCrop, 
    saveCrop, 
    avatarLoading 
}) => {
    return (
        <AnimatePresence>
            {cropping && preview && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
                >
                    <motion.div
                        initial={{ scale: 0.96, opacity: 0, y: 8 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.96, opacity: 0, y: 8 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="bg-elevated dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl w-full max-w-md overflow-hidden shadow-xl"
                    >
                        {/* Modal header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                            <div>
                                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Crop photo</h3>
                                <p className="text-xs text-zinc-400 mt-0.5">Adjust and position your profile photo.</p>
                            </div>
                            <button
                                onClick={cancelCrop}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Crop area */}
                        <div className="relative w-full h-72 bg-zinc-950">
                            <Cropper
                                image={preview}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="round"
                                showGrid={false}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        </div>

                        {/* Zoom & actions */}
                        <div className="p-6 space-y-5">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-zinc-500 flex items-center gap-1.5">
                                        <ZoomIn className="w-3.5 h-3.5" />
                                        Zoom
                                    </span>
                                    <span className="text-xs text-zinc-400">{parseFloat(zoom).toFixed(1)}×</span>
                                </div>
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.05}
                                    className="w-full accent-zinc-900 dark:accent-zinc-100 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full appearance-none"
                                    onChange={e => setZoom(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={cancelCrop}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                                >
                                    Cancel
                                </button>
                                <Button
                                    onClick={saveCrop}
                                    isLoading={avatarLoading}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                                >
                                    Apply
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export const LevelUpCelebrationModal = ({ celebrating, setCelebrating }) => {
    if (!celebrating || celebrating.type !== 'level_up') return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={cn(
                    "fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl transition-colors duration-700",
                    celebrating.rollResult === 'legendary' ? "bg-amber-500/30" : "bg-theme/20"
                )}
            >
                <motion.div
                    initial={{ scale: 0.5, opacity: 0, rotate: -5 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 1.1, opacity: 0 }}
                    className={cn(
                        "bg-surface border-4 rounded-[40px] p-12 max-w-sm w-full text-center relative overflow-hidden transition-all duration-500",
                        celebrating.rollResult === 'legendary' 
                            ? "border-amber-400 shadow-[0_0_100px_rgba(251,191,36,0.5)] bg-gradient-to-b from-surface to-amber-50/10" 
                            : "border-theme shadow-[0_0_80px_rgba(var(--theme-rgb),0.4)]"
                    )}
                >
                    {/* Animated Background Confetti Elements */}
                    <div className="absolute inset-0 pointer-events-none">
                        {[...Array(celebrating.rollResult === 'legendary' ? 24 : 12)].map((_, i) => (
                            <motion.div
                                key={i}
                                animate={{
                                    y: [0, -150, 0],
                                    x: [0, (i % 2 ? 80 : -80), 0],
                                    rotate: [0, 360],
                                    scale: [0, 1, 0]
                                }}
                                transition={{ duration: 3, repeat: Infinity, delay: i * 0.1 }}
                                className={cn(
                                    "absolute top-1/2 left-1/2 w-2 h-2 rounded-full",
                                    celebrating.rollResult === 'legendary' ? "bg-amber-400" : "bg-theme"
                                )}
                                style={{ marginLeft: `${(i - (celebrating.rollResult === 'legendary' ? 12 : 6)) * 20}px` }}
                            />
                        ))}
                    </div>

                    <div className="relative z-10">
                        <motion.div
                            animate={{ 
                                y: [0, -15, 0],
                                rotate: celebrating.rollResult === 'legendary' ? [0, 10, -10, 0] : 0 
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className={cn(
                                "w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 border-2 transition-all",
                                celebrating.rollResult === 'legendary' 
                                    ? "bg-amber-400/20 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.3)]" 
                                    : "bg-theme/10 border-theme"
                            )}
                        >
                            <Zap className={cn(
                                "w-12 h-12",
                                celebrating.rollResult === 'legendary' ? "text-amber-500" : "text-theme"
                            )} />
                        </motion.div>
                        
                        <h2 className={cn(
                            "text-3xl font-black uppercase tracking-tighter mb-2",
                            celebrating.rollResult === 'legendary' ? "text-amber-600 dark:text-amber-400" : "text-primary"
                        )}>
                            {celebrating.rollResult === 'legendary' ? "Legendary Win!" : 
                             celebrating.rollResult === 'critical' ? "Critical Success!" :
                             celebrating.rollResult === 'great' ? "Great Success!" : "Level Up!"}
                        </h2>
                        
                        <p className="text-xs font-black text-tertiary uppercase tracking-widest mb-8">
                            You've reached level <span className={celebrating.rollResult === 'legendary' ? "text-amber-500" : "text-theme"}>
                                {celebrating.newLevel || 1}
                            </span>
                        </p>

                        <div className="space-y-4">
                            {celebrating.xpGained && (
                                <div className="flex flex-col items-center gap-1 mb-2">
                                    <span className="text-[10px] font-black text-tertiary uppercase tracking-widest">Total Gained</span>
                                    <span className={cn(
                                        "text-2xl font-black font-mono",
                                        celebrating.rollResult === 'legendary' ? "text-amber-500" : "text-theme"
                                    )}>
                                        +{celebrating.xpGained} XP
                                    </span>
                                    {celebrating.multiplier > 1 && (
                                        <span className="text-[9px] font-black bg-theme/10 text-theme px-2 py-0.5 rounded uppercase">
                                            {celebrating.multiplier}x Multiplier
                                        </span>
                                    )}
                                </div>
                            )}

                            <div className="p-4 bg-sunken rounded-2xl border border-default">
                                <p className="text-[10px] font-black text-tertiary uppercase tracking-widest mb-1.5">New Rewards Unlocked</p>
                                <div className="flex justify-center gap-2">
                                    <div className="px-3 py-1 bg-theme/10 border border-theme/20 rounded-full text-[10px] font-bold text-theme uppercase">
                                        New Frame
                                    </div>
                                    {celebrating.milestoneBurst > 0 && (
                                        <div className="px-3 py-1 bg-amber-400/10 border border-amber-400/20 rounded-full text-[10px] font-bold text-amber-600 uppercase">
                                            +{celebrating.milestoneBurst} Streak Bonus
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <Button 
                                onClick={() => setCelebrating(null)}
                                className={cn(
                                    "w-full py-4 rounded-2xl text-primary font-black uppercase text-xs tracking-[0.2em] transition-all",
                                    celebrating.rollResult === 'legendary' ? "bg-amber-500 hover:bg-amber-600" : "bg-theme"
                                )}
                            >
                                Seal the Legend
                            </Button>
                        </div>
                    </div>
                </motion.div>

                <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
                     {[...Array(30)].map((_, i) => (
                         <motion.div
                            key={i}
                            initial={{ top: -20, left: `${Math.random() * 100}%` }}
                            animate={{ top: '110%', rotate: 360 }}
                            transition={{ duration: Math.random() * 2 + 1, repeat: Infinity, delay: Math.random() * 2 }}
                            className={cn(
                                "absolute w-1.5 h-1.5 rounded-full opacity-60",
                                celebrating.rollResult === 'legendary' ? "bg-amber-400 shadow-[0_0_10px_#fbbf24]" : "bg-theme"
                            )}
                         />
                     ))}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
