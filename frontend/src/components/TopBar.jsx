import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Link } from 'react-router-dom';

const TopBar = ({ onMenuToggle }) => {
    const { user } = useAuthStore();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <header className="h-14 bg-[#0a0a12]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-4 sm:px-6 flex-shrink-0 sticky top-0 z-30">
            <div className="flex items-center gap-3 flex-1">
                <button onClick={onMenuToggle} className="lg:hidden p-2 text-gray-500 hover:text-white hover:bg-white/[0.04] rounded-xl transition-colors" aria-label="Toggle sidebar">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <div className="relative hidden sm:block max-w-sm w-full">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input type="text" placeholder="Search projects, tasks..." className="w-full pl-10 pr-4 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-[13px] text-white placeholder-gray-600 outline-none focus:border-violet-500/30 focus:ring-1 focus:ring-violet-500/10 transition-all" />
                    <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:inline-flex h-5 items-center rounded border border-white/[0.08] bg-white/[0.04] px-1.5 text-[10px] font-mono text-gray-600">⌘K</kbd>
                </div>
            </div>
            <div className="flex items-center gap-1.5">
                <button className="relative p-2 text-gray-500 hover:text-white hover:bg-white/[0.04] rounded-xl transition-colors" aria-label="Notifications">
                    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-violet-500 rounded-full ring-2 ring-[#0a0a12]" />
                </button>
                <div className="w-px h-5 bg-white/[0.06] mx-1 hidden sm:block" />
                <div className="relative" ref={dropdownRef}>
                    <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl hover:bg-white/[0.04] transition-colors" aria-expanded={dropdownOpen}>
                        <img src={user?.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt={user?.name} className="w-7 h-7 rounded-lg border border-white/[0.08] object-cover" />
                        <div className="hidden sm:block text-left">
                            <p className="text-[13px] font-semibold text-white leading-none">{user?.name || 'User'}</p>
                            <p className="text-[10px] text-gray-600 leading-none mt-0.5">{user?.role || 'Member'}</p>
                        </div>
                        <svg className={`w-3.5 h-3.5 text-gray-600 transition-transform hidden sm:block ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-52 bg-[#12121e] border border-white/[0.06] rounded-xl shadow-2xl shadow-black/50 py-1 z-50">
                            <div className="px-3.5 py-2.5 border-b border-white/[0.06]">
                                <p className="text-[13px] font-semibold text-white">{user?.name}</p>
                                <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
                            </div>
                            <Link to="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-gray-400 hover:text-white hover:bg-white/[0.04] transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                                Profile
                            </Link>
                            <Link to="/settings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-gray-400 hover:text-white hover:bg-white/[0.04] transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                Settings
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default TopBar;
