import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutDashboard, 
    FolderKanban, 
    CheckSquare, 
    Presentation,
    UserCircle,
    Settings
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const dockItems = [
    { label: 'Home', path: '/', icon: LayoutDashboard },
    { label: 'Projects', path: '/projects', icon: FolderKanban },
    { label: 'Tasks', path: '/tasks', icon: CheckSquare },
    { label: 'Whiteboard', path: '/whiteboard/main-workspace', icon: Presentation },
    { label: 'Profile', path: '/profile', icon: UserCircle },
];

export default function MobileDock() {
    const location = useLocation();
    const { user } = useAuthStore();

    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[60] px-4 pb-6 pt-2 pointer-events-none">
            <motion.nav 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="mx-auto max-w-md pointer-events-auto glass-2 border border-default bg-surface/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl flex items-center justify-around p-2 gap-1"
            >
                {dockItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => twMerge(clsx(
                                "relative flex flex-col items-center justify-center w-14 h-14 rounded-3xl transition-all duration-300",
                                isActive ? "text-theme" : "text-tertiary hover:text-primary"
                            ))}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="dock-active"
                                    className="absolute inset-0 bg-theme/10 rounded-3xl border border-theme/20 shadow-[0_0_20px_rgba(var(--theme-rgb),0.05)]"
                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                />
                            )}
                            
                            <Icon className={twMerge(clsx(
                                "w-6 h-6 z-10 transition-transform duration-300",
                                isActive ? "scale-110" : "group-hover:scale-110"
                            ))} />
                            
                            {isActive && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -bottom-1 w-1 h-1 rounded-full bg-theme shadow-theme z-10"
                                />
                            )}
                        </NavLink>
                    );
                })}
            </motion.nav>
        </div>
    );
}
