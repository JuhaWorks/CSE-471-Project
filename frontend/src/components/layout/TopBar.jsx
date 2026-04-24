import React, { useState, useRef, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
    Search, Bell, Menu, User, Settings, LogOut, Command, ChevronDown, Users2
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { useTheme, MODES } from '../../store/useTheme';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GlassSurface } from '../ui/Aesthetics';
import { API_BASE } from '../auth/AuthLayout';
import { getOptimizedAvatar } from '../../utils/avatar';
import NotificationInbox from '../notifications/NotificationInbox';
import api from '../../utils/api';
import { useSocketStore } from '../../store/useSocketStore';

const STATUS_COLOR = {
    Online: 'text-success',
    Away: 'text-warning',
    'Do Not Disturb': 'text-danger',
    Offline: 'text-tertiary',
};


const TopBar = () => {
    const { user, logout } = useAuthStore();
    const { setSidebarExpanded, isSidebarExpanded } = useUIStore();
    const { mode } = useTheme();
    const isDark = mode === MODES.DARK;
    const isMobile = useMediaQuery('(max-width: 1024px)');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const toggleSidebar = () => {
        setSidebarExpanded(!isSidebarExpanded);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="h-16 transition-colors duration-300 relative z-50 rounded-b-[3.15rem]">
            <div className="absolute inset-0 z-0 overflow-hidden rounded-b-[3.15rem] backdrop-blur-xl bg-base/40">
                <GlassSurface width="100%" height="100%" borderRadius="0 0 3.15rem 3.15rem" displace={0.5} distortionScale={-20} backgroundOpacity={isDark ? 0.04 : 0.3} opacity={0.93} />
            </div>

            <div className="relative z-10 h-full px-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={toggleSidebar}
                            className={twMerge(clsx(
                                "p-2.5 text-tertiary hover:text-primary rounded-xl transition-colors duration-200 active:scale-95",
                                isMobile ? "bg-theme/10 text-theme" : "hover:bg-sunken",
                                isMobile && isSidebarExpanded && "opacity-0 pointer-events-none"
                            ))}
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    </div>

                    <Link to="/" className="flex items-center gap-3 group shrink-0 mr-4">
                        <motion.div 
                            whileHover={{ scale: 1.05 }}
                            whileActive={{ scale: 0.95 }}
                            className="w-10 h-8 relative flex items-center justify-center"
                        >
                            <img 
                                src="/logo.png" alt="Klivra logo" 
                                fetchPriority="high" 
                                decoding="async"
                                width={64}
                                height={44}
                                className={twMerge(clsx(
                                    "w-full h-full object-contain transition-opacity duration-300",
                                    isDark ? "invert" : ""
                                ))}
                            />
                        </motion.div>
                        <div className="flex flex-col min-w-0">
                            <motion.span 
                                animate={{ opacity: [1, 0.7, 1] }}
                                transition={{ repeat: Infinity, duration: 3, delay: 0.5 }}
                                className="text-2xl font-black tracking-tight text-primary leading-none mt-0.5 transition-colors duration-200 group-hover:text-theme"
                            >
                                klivra
                            </motion.span>
                        </div>
                    </Link>

                    {/* Search Field */}
                    <div className="relative hidden md:flex max-w-sm w-full group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary group-focus-within:text-theme transition-colors duration-200" />
                        <input
                            type="text"
                            placeholder="Search workspace..."
                            className={twMerge(clsx(
                                "w-full pl-11 pr-4 py-2 bg-sunken border border-default rounded-2xl text-sm text-primary placeholder-tertiary outline-none font-medium",
                                "focus:border-theme/30 focus:ring-4 focus:ring-theme/5 transition-colors duration-200"
                            ))}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1 px-1.5 py-0.5 rounded-lg border border-default bg-surface text-[10px] font-black text-tertiary">
                            <Command className="w-2.5 h-2.5" />
                            <span>K</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button 
                        onClick={() => setNotificationsOpen(true)}
                        className="relative p-2.5 text-tertiary hover:text-primary hover:bg-sunken rounded-2xl transition-colors duration-200 group"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-theme rounded-full border-2 border-base shadow-theme" />
                        )}
                    </button>

                    <NotificationInbox 
                        isOpen={notificationsOpen} 
                        onClose={() => setNotificationsOpen(false)} 
                        onUnreadCountChange={setUnreadCount}
                    />

                    <div className="w-px h-6 bg-default mx-1 hidden sm:block" />

                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className={twMerge(clsx(
                                "flex items-center gap-3 p-1 rounded-2xl transition-colors duration-200",
                                dropdownOpen ? "bg-sunken" : "hover:bg-sunken"
                            ))}
                        >
                            <div className="relative">
                                <img
                                    src={getOptimizedAvatar(user?.avatar, 'xs')}
                                    alt=""
                                    width={36}
                                    height={36}
                                    referrerPolicy="no-referrer"
                                    decoding="async"
                                    className="w-9 h-9 rounded-xl border border-default object-cover"
                                />
                                <div className={twMerge(clsx(
                                    "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-base bg-current",
                                    STATUS_COLOR[user?.status] || 'text-theme'
                                ))} />
                            </div>
                            <div className="hidden sm:block text-left mr-1">
                                <p className="text-sm font-bold text-primary leading-none">{user?.name || 'User'}</p>
                                <p className="text-[10px] font-bold text-tertiary uppercase tracking-tighter mt-1">{user?.role || 'Engineer'}</p>
                            </div>
                            <ChevronDown className={twMerge(clsx(
                                "w-4 h-4 text-gray-500 transition-transform hidden sm:block",
                                dropdownOpen && "rotate-180"
                            ))} />
                        </button>

                        <AnimatePresence>
                            {dropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    className="absolute right-0 mt-2 w-64 glass-2 bg-base/90 backdrop-blur-3xl border border-default rounded-3xl p-2 shadow-2xl overflow-hidden"
                                >
                                    <div className="p-3 mb-2 bg-sunken/40 rounded-2xl">
                                        <p className="text-xs font-black text-primary truncate mb-0.5">{user?.name}</p>
                                        <p className="text-[10px] font-bold text-tertiary truncate">{user?.email}</p>
                                    </div>

                                    <div className="space-y-1">
                                        <Link
                                            to="/profile"
                                            onClick={() => setDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-tertiary hover:text-primary hover:bg-sunken transition-colors duration-200 group"
                                        >
                                            <div className="w-8 h-8 rounded-xl bg-sunken flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                                                <User className="w-4 h-4 group-hover:text-cyan-500 transition-colors" />
                                            </div>
                                            Profile
                                        </Link>
                                        <Link
                                            to="/settings"
                                            onClick={() => setDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-tertiary hover:text-primary hover:bg-sunken transition-colors duration-200 group"
                                        >
                                            <div className="w-8 h-8 rounded-xl bg-sunken flex items-center justify-center group-hover:bg-theme/20 transition-colors">
                                                <Settings className="w-4 h-4 group-hover:text-theme transition-colors" />
                                            </div>
                                            Settings
                                        </Link>

                                        <div className="h-px bg-default mx-2 my-1" />

                                        <button
                                            onClick={() => { logout(); setDropdownOpen(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10 transition-colors duration-200 group"
                                        >
                                            <div className="w-8 h-8 rounded-xl bg-rose-500/5 flex items-center justify-center group-hover:bg-rose-500/20 transition-colors">
                                                <LogOut className="w-4 h-4" />
                                            </div>
                                            Sign Out
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default memo(TopBar);
