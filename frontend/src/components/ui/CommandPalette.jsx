import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Settings, User, LogOut, FileText, Moon, Sun, ArrowRight } from 'lucide-react';

/**
 * Global Command Palette (CmdK Menu)
 * This sits at the root of the app and listens for Cmd+K (Mac) or Ctrl+K (Windows).
 */
export default function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [theme, setTheme] = useState('light');
    const navigate = useNavigate();

    // Toggle logic for Cmd/Ctrl + K
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const runCommand = (command) => {
        setOpen(false);
        command();
    };

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        if (newTheme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    };

    return (
        <AnimatePresence>
            {open && (
                <Command.Dialog
                    open={open}
                    onOpenChange={setOpen}
                    className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm dark:bg-zinc-950/60"
                        onClick={() => setOpen(false)}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="relative w-full max-w-lg overflow-hidden bg-background text-foreground shadow-2xl ring-1 ring-border rounded-xl"
                    >
                        <Command className="flex flex-col w-full h-full max-h-[60vh] bg-transparent">

                            {/* Input Area */}
                            <div className="flex items-center px-4 py-3 border-b border-border">
                                <Search className="w-5 h-5 mr-3 text-muted-foreground shrink-0" />
                                <Command.Input
                                    placeholder="Type a command or search..."
                                    className="flex w-full h-10 bg-transparent outline-none placeholder:text-muted-foreground text-[15px] font-medium"
                                />
                            </div>

                            {/* List Area */}
                            <Command.List className="overflow-y-auto overflow-x-hidden p-2">
                                <Command.Empty className="p-6 text-center text-sm text-muted-foreground">
                                    No results found.
                                </Command.Empty>

                                <Command.Group heading="Navigation" className="px-2 text-xs font-semibold text-muted-foreground mb-1">
                                    <Command.Item
                                        onSelect={() => runCommand(() => navigate('/'))}
                                        className="flex items-center px-3 py-2.5 my-1 text-sm rounded-lg cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:opacity-50 transition-colors"
                                    >
                                        <ArrowRight className="w-4 h-4 mr-3 text-muted-foreground" />
                                        Dashboard Home
                                    </Command.Item>
                                    <Command.Item
                                        onSelect={() => runCommand(() => navigate('/settings'))}
                                        className="flex items-center px-3 py-2.5 my-1 text-sm rounded-lg cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:opacity-50 transition-colors"
                                    >
                                        <Settings className="w-4 h-4 mr-3 text-muted-foreground" />
                                        Settings & Preferences
                                    </Command.Item>
                                    <Command.Item
                                        onSelect={() => runCommand(() => navigate('/profile'))}
                                        className="flex items-center px-3 py-2.5 my-1 text-sm rounded-lg cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:opacity-50 transition-colors"
                                    >
                                        <User className="w-4 h-4 mr-3 text-muted-foreground" />
                                        Edit Profile
                                    </Command.Item>
                                </Command.Group>

                                <Command.Group heading="Appearance" className="px-2 text-xs font-semibold text-muted-foreground mt-4 mb-1">
                                    <Command.Item
                                        onSelect={() => runCommand(toggleTheme)}
                                        className="flex items-center px-3 py-2.5 my-1 text-sm rounded-lg cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:opacity-50 transition-colors"
                                    >
                                        {theme === 'light' ? (
                                            <Moon className="w-4 h-4 mr-3 text-muted-foreground" />
                                        ) : (
                                            <Sun className="w-4 h-4 mr-3 text-muted-foreground" />
                                        )}
                                        Toggle Dark Mode
                                    </Command.Item>
                                </Command.Group>

                                <Command.Group heading="Quick Actions" className="px-2 text-xs font-semibold text-muted-foreground mt-4 mb-1">
                                    <Command.Item
                                        onSelect={() => runCommand(() => console.log('Create task opened'))}
                                        className="flex items-center px-3 py-2.5 my-1 text-sm rounded-lg cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:opacity-50 transition-colors group"
                                    >
                                        <FileText className="w-4 h-4 mr-3 text-muted-foreground group-hover:text-primary transition-colors" />
                                        <span className="group-hover:text-primary transition-colors font-medium">Create New Task</span>
                                        <kbd className="ml-auto flex shrink-0 h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                                            <span className="text-xs">⌘</span>N
                                        </kbd>
                                    </Command.Item>
                                </Command.Group>

                            </Command.List>

                            {/* Footer context */}
                            <div className="border-t border-border px-4 py-3 sm:flex justify-between items-center hidden">
                                <span className="text-[11px] text-muted-foreground font-medium">
                                    Search for apps, commands, or contacts.
                                </span>
                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <span>Navigate</span>
                                    <kbd className="inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">↑↓</kbd>
                                    <span className="ml-2">Select</span>
                                    <kbd className="inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">↵</kbd>
                                </div>
                            </div>
                        </Command>
                    </motion.div>
                </Command.Dialog>
            )}
        </AnimatePresence>
    );
}
