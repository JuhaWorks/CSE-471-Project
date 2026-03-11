import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutDashboard, 
    FolderKanban, 
    CheckSquare, 
    Presentation, 
    ShieldAlert, 
    Activity, 
    Settings, 
    LogOut, 
    X,
    ChevronRight,
    Sun,
    Moon,
    UserCircle
} from 'lucide-react';
import { useAuthStore, api } from '../../store/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme, MODES } from '../../store/useTheme';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Projects', path: '/projects', icon: FolderKanban },
    { label: 'Tasks', path: '/tasks', icon: CheckSquare },
    { label: 'Whiteboard', path: '/whiteboard/team-alpha', icon: Presentation },
];

const SidebarItem = ({ item, isActive, onClose, onPrefetch }) => {
    const Icon = item.icon;
    
    return (
        <NavLink
            to={item.path}
            end={item.path === '/'}
            onClick={onClose}
            onMouseEnter={() => onPrefetch(item.path)}
            className={({ isActive: linkActive }) => cn(
                "group relative flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300",
                "hover:bg-white/[0.04] active:scale-[0.98]",
                linkActive ? "text-cyan-400" : "text-gray-400 hover:text-gray-200"
            )}
        >
            {isActive && (
                <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-cyan-500/10 rounded-2xl border border-cyan-500/20"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
            )}
            
            <Icon className={cn(
                "w-5 h-5 transition-colors z-10",
                isActive ? "text-cyan-400" : "group-hover:text-cyan-300"
            )} />
            
            <span className="font-bold text-sm tracking-tight z-10">{item.label}</span>
            
            {isActive && (
                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)] z-10"
                />
            )}
        </NavLink>
    );
};

const SidebarComponent = ({ isOpen, onClose }) => {
    const { logout, user } = useAuthStore();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { mode, setMode } = useTheme();

    const handlePrefetch = (path) => {
        if (path === '/projects') {
            queryClient.prefetchQuery({
                queryKey: ['projects'],
                queryFn: async () => {
                    const res = await api.get('/projects');
                    return res.data;
                },
                staleTime: 1000 * 60 * 5
            });
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 lg:hidden" 
                        onClick={onClose} 
                    />
                )}
            </AnimatePresence>

            <aside className={cn(
                "fixed top-0 left-0 h-full z-50 w-[280px] glass-2 border-r border-white/5",
                "flex flex-col transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
                "lg:relative lg:translate-x-0 rounded-none",
                isOpen ? 'translate-x-0' : '-translate-x-full'
            )}>
                {/* 2026 Ambient Light Effect */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-cyan-500/10 to-transparent pointer-events-none" />

                {/* Brand */}
                <div className="h-20 flex items-center gap-4 px-6 relative z-10">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-xl shadow-cyan-500/10">
                        <span className="text-white font-black text-xl">K</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-black tracking-tighter text-white">Klivra</span>
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Enterprise</span>
                    </div>
                    <button onClick={onClose} className="lg:hidden ml-auto p-2 text-gray-500 hover:text-white rounded-xl transition-all hover:bg-white/5">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto relative z-10">
                    <p className="px-4 mb-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Platform Nav</p>

                    {user?.role === 'Admin' && (
                        <div className="mb-6 space-y-2">
                             <NavLink
                                to="/admin"
                                onClick={onClose}
                                className={({ isActive }) => cn(
                                    "flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300",
                                    isActive 
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                        : "text-emerald-400/60 hover:text-emerald-300 hover:bg-emerald-500/5 border border-emerald-500/5"
                                )}
                            >
                                <ShieldAlert className="w-5 h-5" />
                                <span>Platform Admin</span>
                                <motion.span 
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="ml-auto w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                                />
                            </NavLink>
                            
                            <NavLink
                                to="/admin/security"
                                onClick={onClose}
                                className={({ isActive }) => cn(
                                    "flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300",
                                    isActive 
                                        ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                                        : "text-red-400/60 hover:text-red-300 hover:bg-red-500/5 border border-red-500/5"
                                )}
                            >
                                <Activity className="w-5 h-5" />
                                <span>Security Feed</span>
                            </NavLink>
                        </div>
                    )}

                    <div className="space-y-1">
                        {navItems.map((item) => (
                            <SidebarItem 
                                key={item.path} 
                                item={item} 
                                onClose={onClose} 
                                onPrefetch={handlePrefetch}
                            />
                        ))}
                    </div>
                </nav>

                {/* Footer Section */}
                <div className="p-4 border-t border-white/5 bg-white/[0.01] relative z-10">
                    <div className="flex flex-col gap-1">
                        <NavLink
                            to="/settings"
                            onClick={onClose}
                            className={({ isActive }) => cn(
                                "flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300",
                                isActive ? "bg-white/5 text-white" : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                            )}
                        >
                            <Settings className="w-5 h-5" />
                            <span>Settings</span>
                        </NavLink>

                        <div className="grid grid-cols-2 gap-2 mt-2">
                             <button
                                onClick={() => setMode(mode === MODES.DARK ? MODES.LIGHT : MODES.DARK)}
                                className="flex items-center justify-center gap-2 h-11 px-3 rounded-2xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                            >
                                {mode === MODES.DARK ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                                <span className="text-xs font-bold leading-none">{mode === MODES.DARK ? 'Light' : 'Dark'}</span>
                            </button>
                            
                            <button
                                onClick={handleLogout}
                                className="flex items-center justify-center gap-2 h-11 px-3 rounded-2xl bg-red-500/5 text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-all border border-red-500/10"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="text-xs font-bold leading-none">Logout</span>
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center gap-3 px-3 py-3 rounded-3xl bg-white/5 border border-white/5">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                            <UserCircle className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-white truncate">{user?.name}</span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter truncate">{user?.role}</span>
                        </div>
                        <ChevronRight className="ml-auto w-4 h-4 text-gray-600" />
                    </div>
                </div>
            </aside>
        </>
    );
};

export default SidebarComponent;
