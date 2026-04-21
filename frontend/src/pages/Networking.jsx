import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useVirtualizer, useWindowVirtualizer } from '@tanstack/react-virtual';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Users2, UserPlus, UserCheck, UserX, Clock,
    Send, ChevronRight, X, Filter, Tag, MoreHorizontal,
    Sparkles, ArrowRight, Loader2, MessageSquare, Trash2
} from 'lucide-react';
import { api } from '../store/useAuthStore';
import { useAuthStore } from '../store/useAuthStore';
import { useSocketStore } from '../store/useSocketStore';
import { Card, Counter, Button } from '../components/ui/BaseUI';
import toast from 'react-hot-toast';
import NetworkingSkeleton from '../components/networking/NetworkingSkeleton';
import UserProfileModal from '../components/networking/UserProfileModal';
import { API_BASE } from '../components/auth/AuthLayout';
import { getOptimizedAvatar } from '../utils/avatar';

const EASE = { duration: 0.4, ease: [0.22, 1, 0.36, 1] };

// ── Tab Configuration ────────────────────────────────────────────────────────
const TABS = [
    { key: 'network', label: 'My Network', icon: Users2 },
    { key: 'pending', label: 'Received', icon: UserPlus },
    { key: 'sent', label: 'Sent', icon: Send },
    { key: 'discover', label: 'Discover', icon: Sparkles },
];

// ── Status Badge ─────────────────────────────────────────────────────────────
const StatusDot = ({ status }) => {
    const colors = {
        Online: 'bg-emerald-400',
        Away: 'bg-amber-400',
        'Do Not Disturb': 'bg-rose-400',
        Offline: 'bg-zinc-500',
    };
    return (
        <span className="relative inline-flex w-2.5 h-2.5">
            {status === 'Online' && <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-40" />}
            <span className={`relative rounded-full w-2.5 h-2.5 ${colors[status] || colors.Offline}`} />
        </span>
    );
};

// ── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ user, size = 'md' }) => {
    const [isError, setIsError] = useState(false);
    const sizes = { sm: 'w-9 h-9', md: 'w-12 h-12', lg: 'w-16 h-16' };
    const pxSizes = { sm: 36, md: 48, lg: 64 };
    const textSizes = { sm: 'text-[10px]', md: 'text-sm', lg: 'text-lg' };
    
    const avatarUrl = useMemo(() => {
        if (!user?.avatar) return null;
        return getOptimizedAvatar(user.avatar);
    }, [user?.avatar]);

    const initials = useMemo(() => {
        if (!user?.name) return '?';
        const parts = user.name.split(' ');
        if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
        return user.name.charAt(0).toUpperCase();
    }, [user?.name]);

    return (
        <div className="relative">
            <div className={`${sizes[size]} rounded-2xl bg-gradient-to-br from-theme/10 to-theme/20 border border-default flex-shrink-0 flex items-center justify-center overflow-hidden relative`}>
                {avatarUrl && !isError ? (
                    <img 
                        src={avatarUrl} 
                        alt="" 
                        width={pxSizes[size]}
                        height={pxSizes[size]}
                        referrerPolicy="no-referrer"
                        onError={() => setIsError(true)}
                        className="w-full h-full object-cover" 
                        loading="lazy" 
                        decoding="async" 
                    />
                ) : (
                    <span className={`${textSizes[size]} font-black text-theme tracking-tight`}>
                        {initials}
                    </span>
                )}
            </div>
            {user?.gamification?.level && size !== 'sm' && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-lg bg-base border border-default flex items-center justify-center shadow-lg">
                    <span className="text-[8px] font-black text-primary">L{user.gamification.level}</span>
                </div>
            )}
        </div>
    );
};

// ── Shared UI Patterns (matching Home Dashboard) ─────────────────────────
const HeaderMetric = ({ label, value, unit, color1, color2 }) => (
    <div className="flex flex-col items-start px-8 border-r border-default last:border-r-0">
        <span className="text-[9px] font-black uppercase tracking-widest text-tertiary mb-1">{label}</span>
        <div className="flex items-baseline gap-1.5">
            <span style={{ 
                fontFamily: 'var(--ent-mono)', 
                fontSize: 22, 
                fontWeight: 700, 
                background: `linear-gradient(to bottom right, ${color1}, ${color2})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
            }}>
                <Counter value={value} />
            </span>
            {unit && <span className="text-[10px] font-medium text-tertiary/60">{unit}</span>}
        </div>
    </div>
);

const BackgroundGlow = () => (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div className="glow-blob" style={{ background: 'var(--v-blue)', top: '-15%', left: '-5%', width: '40vw', height: '40vw', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.05 }} />
        <div className="glow-blob" style={{ background: 'var(--v-cyan)', top: '10%', right: '10%', width: '35vw', height: '35vw', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.03 }} />
        <div className="glow-blob" style={{ background: 'var(--v-rose)', top: '40%', right: '-5%', width: '30vw', height: '30vw', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.04 }} />
    </div>
);

const RoleBadge = ({ role }) => {
    const styles = {
        Admin: 'text-rose-500/80 border-rose-500/10 bg-rose-500/[0.02]',
        Manager: 'text-amber-500/80 border-amber-500/10 bg-amber-500/[0.02]',
        Developer: 'text-theme/70 border-theme/10 bg-theme/[0.02]',
    };
    return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${styles[role] || styles.Developer}`}>
            {role}
        </span>
    );
};

const SocialStats = ({ count }) => {
    if (count === undefined || count === null) return null;
    const displayCount = Math.max(0, count);
    return (
        <div className="flex items-center gap-1.5 mt-0.5 opacity-40">
            <Users2 className="w-2.5 h-2.5" />
            <span className="text-[9px] font-bold uppercase tracking-widest">
                {displayCount}
            </span>
        </div>
    );
};

// ── Connection Card (Compact) ────────────────────────────────────────────────
const ConnectionCard = ({ connection, onRemove, onViewProfile }) => {
    const user = connection.user;
    return (
        <motion.div layout initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={EASE}>
            <div className="group relative flex items-start gap-4 p-4 rounded-[2rem] hover:bg-white/[0.02] border border-transparent hover:border-white/5 transition-all duration-300">
                <div className="relative shrink-0 cursor-pointer" onClick={() => onViewProfile && onViewProfile(user._id)}>
                    <Avatar user={user} size="sm" />
                    <div className="absolute -bottom-0.5 -right-0.5">
                        <StatusDot status={user?.status} />
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                        <h4 
                            className="text-[13px] font-bold text-primary truncate cursor-pointer hover:text-theme transition-colors tracking-tight"
                            onClick={() => onViewProfile && onViewProfile(user._id)}
                        >
                            {user?.name}
                        </h4>
                        <RoleBadge role={user?.role} />
                    </div>
                    <p className="text-[11px] text-tertiary truncate font-medium mb-1.5 opacity-60 tracking-tight">{user?.email}</p>
                    <SocialStats count={user?.totalConnections} />

                    {connection.labels?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                            {connection.labels.map((label, i) => (
                                <span key={i} className="px-2 py-0.5 rounded-md bg-theme/5 text-[8px] font-black text-theme/40 border border-theme/10 uppercase tracking-widest">
                                    {label}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                <button
                    onClick={() => onRemove(connection._id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-tertiary/20 hover:text-danger hover:bg-danger/5 transition-all self-start mt-1"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </motion.div>
    );
};

// ── Request Card (Incoming) ──────────────────────────────────────────────────
const IncomingRequestCard = ({ request, onRespond }) => {
    const user = request.requester;
    const [loading, setLoading] = useState(null);

    const handleRespond = async (action) => {
        setLoading(action);
        await onRespond(request._id, action);
        setLoading(null);
    };

    return (
        <motion.div layout initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={EASE}>
            <div className="group relative flex flex-col p-4 rounded-[2rem] hover:bg-white/[0.02] border border-transparent hover:border-white/5 transition-all duration-300">
                <div className="flex items-start gap-4">
                    <Avatar user={user} size="sm" />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-[13px] font-bold text-primary truncate tracking-tight">{user?.name}</h4>
                            <RoleBadge role={user?.role} />
                        </div>
                        <p className="text-[11px] text-tertiary truncate font-medium opacity-60 mb-1">{user?.email}</p>
                        <SocialStats count={user?.totalConnections} />
                    </div>
                    <span className="text-[9px] text-tertiary/40 font-mono">
                        {new Date(request.createdAt).toLocaleDateString()}
                    </span>
                </div>
                {request.note && (
                    <div className="mt-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                        <div className="flex items-center gap-2 mb-1">
                            <MessageSquare className="w-2.5 h-2.5 text-theme/60" />
                            <span className="text-[8px] font-black text-tertiary/60 uppercase tracking-widest">Note</span>
                        </div>
                        <p className="text-[11px] text-secondary leading-relaxed line-clamp-2">"{request.note}"</p>
                    </div>
                )}
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={() => handleRespond('accept')}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-[11px] font-black bg-theme text-white hover:bg-theme/90 transition-all active:scale-[0.98]"
                    >
                        {loading === 'accept' ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                        Accept
                    </button>
                    <button
                        onClick={() => handleRespond('decline')}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-[11px] font-bold text-tertiary hover:text-primary bg-white/[0.03] hover:bg-white/[0.06] transition-all active:scale-[0.98]"
                    >
                        {loading === 'decline' ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
                        Decline
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

// ── Sent Request Card ────────────────────────────────────────────────────────
const SentRequestCard = ({ request, onWithdraw }) => {
    const user = request.recipient;
    return (
        <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={EASE}>
            <div className="group relative flex items-center gap-4 p-4 rounded-[2rem] hover:bg-white/[0.02] border border-transparent hover:border-white/5 transition-all duration-300">
                <Avatar user={user} size="sm" />
                <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] font-bold text-primary truncate tracking-tight">{user?.name}</h4>
                    <p className="text-[11px] text-tertiary truncate opacity-60">{user?.email}</p>
                    <SocialStats count={user?.totalConnections} />
                </div>
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-[9px] text-amber-500/60 font-black uppercase tracking-widest">
                        <Clock className="w-2.5 h-2.5" /> Pending
                    </span>
                    <button
                        onClick={() => onWithdraw(request._id)}
                        className="p-1.5 rounded-lg text-tertiary/20 hover:text-danger transition-all"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

// ── Discovery / Search Card ──────────────────────────────────────────────────
const DiscoverCard = ({ user, onConnect, onViewProfile }) => {
    const [showNote, setShowNote] = useState(false);
    const [note, setNote] = useState('');
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        setSending(true);
        try {
            await onConnect(user._id, note);
            setShowNote(false);
            setNote('');
        } catch (err) {
            console.error('Failed to connect:', err);
        } finally {
            setSending(false);
        }
    };

    const getActionButton = () => {
        if (user.connectionStatus === 'accepted') {
            return (
                <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[9px] font-black text-theme bg-theme/10 border border-theme/20 uppercase tracking-tight">
                    <UserCheck className="w-3 h-3" /> Connected
                </span>
            );
        }
        if (user.connectionStatus === 'pending') {
            return (
                <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[9px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 uppercase tracking-tight">
                    <Clock className="w-3 h-3" /> {user.direction === 'sent' ? 'Sent' : 'Received'}
                </span>
            );
        }
        return (
            <button
                onClick={() => setShowNote(!showNote)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black bg-theme text-white hover:bg-theme/90 shadow-lg shadow-theme/15 active:scale-[0.98] transition-all"
            >
                <UserPlus className="w-2.5 h-2.5" /> Connect
            </button>
        );
    };

    return (
        <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={EASE}>
            <div className="group relative flex flex-col p-4 rounded-[2rem] hover:bg-white/[0.02] border border-transparent hover:border-white/5 transition-all duration-300">
                <div className="flex items-start gap-4">
                    <div className="relative shrink-0 cursor-pointer" onClick={() => onViewProfile && onViewProfile(user._id)}>
                        <Avatar user={user} size="sm" />
                        <div className="absolute -bottom-0.5 -right-0.5">
                            <StatusDot status={user?.status} />
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 
                                className="text-[13px] font-bold text-primary truncate cursor-pointer hover:text-theme transition-colors tracking-tight"
                                onClick={() => onViewProfile && onViewProfile(user._id)}
                            >
                                {user?.name}
                            </h4>
                            <RoleBadge role={user?.role} />
                        </div>
                        <p className="text-[11px] text-tertiary truncate font-medium opacity-60 mb-1">{user?.email}</p>
                        <SocialStats count={user?.totalConnections} />

                        {user?.reason && (
                            <div className="mt-2.5 text-[9px] text-theme/60 font-black uppercase tracking-widest">
                                {user.reason}
                            </div>
                        )}
                    </div>
                    {getActionButton()}
                </div>

                    <AnimatePresence>
                        {showNote && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-3.5 space-y-2.5">
                                    <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        placeholder="Add a personal note (optional)..."
                                        maxLength={300}
                                        rows={2}
                                        className="w-full px-3 py-2.5 rounded-xl bg-sunken border border-default text-[11px] text-primary placeholder-tertiary resize-none outline-none focus:border-theme focus:ring-2 focus:ring-theme/10 transition-all font-medium"
                                    />
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] text-tertiary font-mono">{note.length}/300</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => { setShowNote(false); setNote(''); }}
                                                className="px-3 py-1.5 rounded-xl text-[9px] font-bold text-secondary border border-default bg-sunken hover:bg-default transition-all uppercase tracking-tight"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSend}
                                                disabled={sending}
                                                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[10px] font-black bg-theme text-white hover:bg-theme/90 disabled:opacity-50 shadow-lg shadow-theme/15 active:scale-[0.98] transition-all"
                                            >
                                                {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-2.5 h-2.5" />}
                                                Send
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
            </div>
        </motion.div>
    );
};

// ── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = ({ icon: Icon, title, subtitle }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={EASE} className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-[2rem] bg-theme/5 border border-theme/10 flex items-center justify-center mb-5">
            <Icon className="w-7 h-7 text-theme/50" />
        </div>
        <h3 className="text-base font-black text-primary mb-1">{title}</h3>
        <p className="text-sm text-tertiary max-w-xs">{subtitle}</p>
    </motion.div>
);

// ══════════════════════════════════════════════════════════════════════════════
// ██  MAIN PAGE COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

const Networking = () => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('network');
    const [searchQuery, setSearchQuery] = useState('');
    const [skillQuery, setSkillQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [selectedUserForModal, setSelectedUserForModal] = useState(null);
    const { socket } = useSocketStore();

    // ── Real-time Listeners ──────────────────────────────────────────────────
    useEffect(() => {
        if (!socket) return;

        const handleReceived = (data) => {
            toast(data.message, { icon: '👋', duration: 4000 });
            invalidateAll();
        };

        const handleStatusUpdate = (data) => {
            if (data.status === 'accepted') {
                toast.success(data.message, { icon: '🤝', duration: 5000 });
            } else {
                toast(data.message, { icon: '❌' });
            }
            invalidateAll();
        };

        const handleWithdrawn = () => {
            invalidateAll();
        };

        const handleRemoved = () => {
            toast('A connection was removed', { icon: '🗑️' });
            invalidateAll();
        };

        socket.on('connection:received', handleReceived);
        socket.on('connection:status_updated', handleStatusUpdate);
        socket.on('connection:withdrawn', handleWithdrawn);
        socket.on('connection:removed', handleRemoved);

        return () => {
            socket.off('connection:received', handleReceived);
            socket.off('connection:status_updated', handleStatusUpdate);
            socket.off('connection:withdrawn', handleWithdrawn);
            socket.off('connection:removed', handleRemoved);
        };
    }, [socket]);

    // Admin users cannot access the Networking page
    if (user?.role === 'Admin') {
        return <Navigate to="/" replace />;
    }

    // ── Queries ──────────────────────────────────────────────────────────────
    const { 
        data: connectionsRes, 
        fetchNextPage: fetchNextConnections, 
        hasNextPage: hasMoreConnections, 
        isFetchingNextPage: loadingMoreConnections,
        isLoading: loadingConns 
    } = useInfiniteQuery({
        queryKey: ['connections'],
        queryFn: async ({ pageParam, signal }) => {
            const url = pageParam ? `/connections?cursor=${pageParam}` : '/connections';
            return (await api.get(url, { signal })).data;
        },
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        staleTime: 1000 * 60 * 3,
    });

    const { 
        data: pendingRes, 
        fetchNextPage: fetchNextPending, 
        hasNextPage: hasMorePending,
        isFetchingNextPage: loadingMorePending,
        isLoading: loadingPending 
    } = useInfiniteQuery({
        queryKey: ['connections', 'pending'],
        queryFn: async ({ pageParam, signal }) => {
            const url = pageParam ? `/connections/pending?cursor=${pageParam}` : '/connections/pending';
            return (await api.get(url, { signal })).data;
        },
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        staleTime: 1000 * 60 * 2,
    });

    const { 
        data: sentRes,
        fetchNextPage: fetchNextSent,
        hasNextPage: hasMoreSent,
        isFetchingNextPage: loadingMoreSent
    } = useInfiniteQuery({
        queryKey: ['connections', 'sent'],
        queryFn: async ({ pageParam, signal }) => {
            const url = pageParam ? `/connections/sent?cursor=${pageParam}` : '/connections/sent';
            return (await api.get(url, { signal })).data;
        },
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        staleTime: 1000 * 60 * 2,
    });

    const { data: statsRes } = useQuery({
        queryKey: ['connections', 'stats'],
        queryFn: async ({ signal }) => (await api.get('/connections/stats', { signal })).data,
        staleTime: 1000 * 60 * 2,
    });

    const { data: suggestionsRes } = useQuery({
        queryKey: ['connections', 'suggestions'],
        queryFn: async ({ signal }) => (await api.get('/connections/suggestions', { signal })).data,
        staleTime: 1000 * 60 * 5,
        enabled: activeTab === 'discover' && !searchQuery,
    });

    const { data: searchRes, isFetching: searching } = useQuery({
        queryKey: ['connections', 'search', searchQuery, skillQuery, roleFilter],
        queryFn: async ({ signal }) => {
            const params = new URLSearchParams({ q: searchQuery });
            if (roleFilter) params.append('role', roleFilter);
            if (skillQuery) params.append('skill', skillQuery);
            return (await api.get(`/connections/search?${params}`, { signal })).data;
        },
        staleTime: 1000 * 30,
        enabled: activeTab === 'discover' && (searchQuery.length >= 2 || skillQuery.length >= 2),
    });

    const connections = useMemo(() => connectionsRes?.pages?.flatMap(page => page.data) || [], [connectionsRes]);
    const pending = useMemo(() => pendingRes?.pages?.flatMap(page => page.data) || [], [pendingRes]);
    const sent = useMemo(() => sentRes?.pages?.flatMap(page => page.data) || [], [sentRes]);
    const stats = statsRes?.data || { connectionCount: 0, pendingCount: 0, sentCount: 0 };
    const suggestions = suggestionsRes?.data || [];
    const searchResults = searchRes?.data || [];

    const isSearching = searchQuery.length >= 2 || skillQuery.length >= 2;

    // ── Mutations ────────────────────────────────────────────────────────────
    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: ['connections'] });
        queryClient.invalidateQueries({ queryKey: ['connections', 'stats'] });
    };

    const connectMutation = useMutation({
        mutationFn: async ({ recipientId, note }) => {
            return (await api.post('/connections/request', { recipientId, note })).data;
        },
        onMutate: async ({ recipientId }) => {
            // Cancel outgoing queries
            await queryClient.cancelQueries({ queryKey: ['connections'] });
            // Snapshot previous value
            const previoussuggestions = queryClient.getQueryData(['connections', 'suggestions']);
            const previousSearch = queryClient.getQueryData(['connections', 'search']);
            
            // Optimistically update
            queryClient.setQueryData(['connections', 'suggestions'], old => ({
                ...old,
                data: old?.data?.map(u => u._id === recipientId ? { ...u, connectionStatus: 'pending', direction: 'sent' } : u)
            }));

            return { previoussuggestions, previousSearch };
        },
        onSuccess: (data) => {
            toast.success(data.message);
            invalidateAll();
        },
        onError: (err, variables, context) => {
            toast.error(err.response?.data?.message || 'Failed to send request');
            if (context?.previoussuggestions) queryClient.setQueryData(['connections', 'suggestions'], context.previoussuggestions);
        },
    });

    const respondMutation = useMutation({
        mutationFn: async ({ connectionId, action }) => {
            return (await api.put('/connections/respond', { connectionId, action })).data;
        },
        onMutate: async ({ connectionId, action }) => {
            await queryClient.cancelQueries({ queryKey: ['connections'] });
            const previousPending = queryClient.getQueryData(['connections', 'pending']);
            
            // Optimistically remove from pending if accepted or declined
            queryClient.setQueryData(['connections', 'pending'], old => ({
                ...old,
                pages: old?.pages?.map(page => ({
                    ...page,
                    data: page.data.filter(req => req._id !== connectionId)
                }))
            }));

            // Optimistically update connection count if accepted
            if (action === 'accept') {
                queryClient.setQueryData(['connections', 'stats'], old => {
                    if (!old?.data) return old;
                    return {
                        ...old,
                        data: {
                            ...old.data,
                            connectionCount: (old.data.connectionCount || 0) + 1,
                            pendingCount: Math.max(0, (old.data.pendingCount || 0) - 1)
                        }
                    };
                });
            } else {
                queryClient.setQueryData(['connections', 'stats'], old => {
                    if (!old?.data) return old;
                    return {
                        ...old,
                        data: {
                            ...old.data,
                            pendingCount: Math.max(0, (old.data.pendingCount || 0) - 1)
                        }
                    };
                });
            }

            return { previousPending };
        },
        onSuccess: (data) => {
            toast.success(data.message);
            invalidateAll();
        },
        onError: (err, variables, context) => {
            toast.error(err.response?.data?.message || 'Failed to respond');
            if (context?.previousPending) queryClient.setQueryData(['connections', 'pending'], context.previousPending);
        },
    });

    const withdrawMutation = useMutation({
        mutationFn: async (connectionId) => {
            return (await api.delete(`/connections/withdraw/${connectionId}`)).data;
        },
        onSuccess: () => {
            toast.success('Request withdrawn');
            invalidateAll();
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to withdraw'),
    });

    const removeMutation = useMutation({
        mutationFn: async (connectionId) => {
            return (await api.delete(`/connections/${connectionId}`)).data;
        },
        onMutate: async (connectionId) => {
            await queryClient.cancelQueries({ queryKey: ['connections', 'stats'] });
            const previousStats = queryClient.getQueryData(['connections', 'stats']);
            
            queryClient.setQueryData(['connections', 'stats'], old => {
                if (!old?.data) return old;
                return {
                    ...old,
                    data: {
                        ...old.data,
                        connectionCount: Math.max(0, (old.data.connectionCount || 0) - 1)
                    }
                };
            });

            return { previousStats };
        },
        onSuccess: () => {
            toast.success('Connection removed');
            invalidateAll();
        },
        onError: (err, variables, context) => {
            toast.error(err.response?.data?.message || 'Failed to remove');
            if (context?.previousStats) queryClient.setQueryData(['connections', 'stats'], context.previousStats);
        },
    });

    const handleConnect = useCallback(async (recipientId, note) => {
        await connectMutation.mutateAsync({ recipientId, note });
    }, [connectMutation]);

    const handleRespond = useCallback(async (connectionId, action) => {
        await respondMutation.mutateAsync({ connectionId, action });
    }, [respondMutation]);


    const discoverData = isSearching ? searchResults : suggestions;

    // ── Virtualization for My Network ────────────────────────────────────────
    const parentRef = React.useRef(null);
    const rowVirtualizer = useWindowVirtualizer({
        count: Math.ceil(connections.length / 2),
        estimateSize: () => 180,
        overscan: 5,
        scrollMargin: parentRef.current?.offsetTop || 0,
    });

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
                
                :root {
                   --ent-text-1: hsl(0, 0%, 98%);
                   --ent-text-2: hsl(0, 0%, 85%);
                   --ent-text-3: hsl(0, 0%, 65%);
                   --ent-border: hsl(0, 0%, 25%);
                   --ent-mono: 'JetBrains Mono', monospace;
                   --v-emerald: hsl(150, 70%, 55%);
                   --v-rose: hsl(10, 80%, 60%);
                   --v-cyan: hsl(200, 65%, 55%);
                   --v-amber: hsl(70, 75%, 65%);
                   --v-blue: hsl(250, 70%, 55%);
                 }

                .net-root { font-family: 'Sora', system-ui, sans-serif; --mono: 'JetBrains Mono', monospace; }
                .ent-label {
                  font-family: var(--ent-mono);
                  font-size: 9px;
                  font-weight: 800;
                  text-transform: uppercase;
                  letter-spacing: 0.2em;
                  color: var(--ent-text-3);
                }
                .ent-h-metric {
                  padding-right: 64px;
                  border-right: 1px solid var(--ent-border);
                  margin-right: -1px; /* overlap border edges */
                }
                .ent-h-metric:last-child {
                  border-right: none;
                }
                .net-scroll::-webkit-scrollbar { width: 3px; }
                .net-scroll::-webkit-scrollbar-track { background: transparent; }
                .net-scroll::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 2px; }

                @media (max-width: 1024px) {
                  .ent-header-hud { 
                    display: flex !important; 
                    flex-wrap: wrap; 
                    gap: 16px;
                    margin-top: 24px;
                  }
                  .ent-h-metric { border: none !important; padding: 0 !important; }
                  .ent-greeting-area { flex-direction: column !important; align-items: flex-start !important; }
                }
            `}</style>

            <article className="net-root min-h-[calc(100vh-120px)] flex flex-col pb-10 relative max-w-[2000px] mx-auto w-full px-10 ent-animate">
                <BackgroundGlow />

                <div className="relative z-10 w-full">
                    {/* Header with Integrated HUD */}
                    <header style={{
                        padding: '32px 0 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid var(--ent-border)',
                        marginBottom: 40,
                        gap: 32,
                    }}>
                        <div className="flex items-center gap-12 flex-wrap">
                            <div className="pr-12 border-r border-default">
                                <div className="flex items-center gap-2 mb-2">
                                    <Users2 className="w-3.5 h-3.5 text-theme/60" />
                                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-tertiary/60">Registry</span>
                                </div>
                                <h1 style={{ fontSize: 28, fontWeight: 650, color: 'var(--ent-text-1)', margin: 0, letterSpacing: '-0.04em' }}>
                                    Networking
                                </h1>
                            </div>

                            <div className="flex items-center">
                                <HeaderMetric label="Connections" value={stats.connectionCount ?? 0} color1="var(--v-emerald)" color2="var(--v-cyan)" />
                                <HeaderMetric label="Received" value={stats.pendingCount ?? 0} color1="var(--v-rose)" color2="var(--v-orange)" />
                                <HeaderMetric label="Sent Requests" value={stats.sentCount ?? 0} color1="var(--v-blue)" color2="var(--v-indigo)" />
                            </div>
                        </div>
                    </header>



                    {/* Minimalist Tabs */}
                    <div className="flex flex-wrap items-center gap-10 mb-10 px-2 border-b border-default w-full">
                        {TABS.map((tab) => {
                            const isActive = activeTab === tab.key;
                            const count = tab.key === 'pending' ? pending.length : tab.key === 'sent' ? sent.length : tab.key === 'network' ? connections.length : 0;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`relative flex items-center gap-2 pb-5 text-[10px] font-black transition-all duration-300 uppercase tracking-[0.25em] ${
                                        isActive ? 'text-primary' : 'text-tertiary hover:text-secondary'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <tab.icon className={`w-3.5 h-3.5 transition-colors ${isActive ? 'text-theme' : 'text-tertiary/60'}`} />
                                        <span>{tab.label}</span>
                                        {count > 0 && tab.key !== 'discover' && (
                                            <span className={`text-[9px] font-mono font-medium opacity-40 ml-1`}>
                                                ({count})
                                            </span>
                                        )}
                                    </div>
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTabUnderline"
                                            className="absolute bottom-[-1.5px] left-0 right-0 h-[1.5px] bg-theme"
                                            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Search (visible in discover tab) */}
                    {activeTab === 'discover' && (
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={EASE} className="mb-10">
                            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                                <div className="flex-1 flex items-center gap-4 px-6 py-4 rounded-[2rem] bg-sunken/50 border border-subtle focus-within:border-theme/30 focus-within:ring-4 focus-within:ring-theme/5 transition-all shadow-inner group">
                                    <Search className="w-5 h-5 text-tertiary group-focus-within:text-theme transition-colors shrink-0" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search by name..."
                                        className="w-full bg-transparent text-sm font-black text-primary placeholder-tertiary outline-none"
                                    />
                                    {searchQuery && (
                                        <button onClick={() => setSearchQuery('')} className="p-1.5 rounded-xl text-tertiary hover:text-primary transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <div className="flex-1 flex items-center gap-4 px-6 py-4 rounded-[2rem] bg-sunken/50 border border-subtle focus-within:border-theme/30 focus-within:ring-4 focus-within:ring-theme/5 transition-all shadow-inner group">
                                    <Filter className="w-5 h-5 text-tertiary group-focus-within:text-theme transition-colors shrink-0" />
                                    <input
                                        type="text"
                                        value={skillQuery}
                                        onChange={(e) => setSkillQuery(e.target.value)}
                                        placeholder="Filter by skill..."
                                        className="w-full bg-transparent text-sm font-black text-primary placeholder-tertiary outline-none"
                                    />
                                    {searching && <Loader2 className="w-5 h-5 text-theme animate-spin shrink-0" />}
                                    {skillQuery && (
                                        <button onClick={() => setSkillQuery('')} className="p-1.5 rounded-xl text-tertiary hover:text-primary transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <select
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className="px-8 py-4 rounded-[2rem] bg-sunken/50 border border-subtle text-xs font-black uppercase tracking-widest text-secondary outline-none focus:border-theme/30 transition-all cursor-pointer shadow-inner min-w-[200px]"
                                >
                                    <option value="">All Roles</option>
                                    <option value="Manager">Managers</option>
                                    <option value="Developer">Developers</option>
                                </select>
                            </div>
                        </motion.div>
                    )}

                    {/* Tab Content */}
                    <AnimatePresence mode="wait">
                        {/* My Network */}
                        {activeTab === 'network' && (
                            <motion.div 
                                key="network" 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }} 
                                transition={EASE}
                                ref={parentRef}
                            >
                                {loadingConns ? (
                                    <NetworkingSkeleton />
                                ) : connections.length === 0 ? (
                                    <EmptyState icon={Users2} title="No connections yet" subtitle="Start building your professional network by discovering and connecting with teammates." />
                                ) : (
                                    <div 
                                        className="relative w-full"
                                        style={{ height: `${rowVirtualizer.getTotalSize() - rowVirtualizer.options.scrollMargin}px` }}
                                    >
                                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                            const startIndex = virtualRow.index * 3;
                                            const rowItems = connections.slice(startIndex, startIndex + 3);
                                            
                                            return (
                                                        <div
                                                            key={virtualRow.key}
                                                            className="absolute top-0 left-0 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                                                    style={{ 
                                                        transform: `translateY(${virtualRow.start - rowVirtualizer.options.scrollMargin}px)`,
                                                        height: `${virtualRow.size}px`
                                                    }}
                                                >
                                                    {rowItems.map(conn => (
                                                        <ConnectionCard key={conn._id} connection={conn} onRemove={(id) => removeMutation.mutate(id)} onViewProfile={setSelectedUserForModal} />
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                {hasMoreConnections && !loadingConns && (
                                    <div className="flex justify-center mt-6">
                                        <Button 
                                            variant="ghost" 
                                            onClick={() => fetchNextConnections()} 
                                            loading={loadingMoreConnections}
                                            className="px-8"
                                        >
                                            Load More Connections
                                        </Button>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Received Requests */}
                        {activeTab === 'pending' && (
                            <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={EASE}>
                                {loadingPending ? (
                                    <NetworkingSkeleton />
                                ) : pending.length === 0 ? (
                                    <EmptyState icon={UserPlus} title="No pending requests" subtitle="When someone sends you a connection request, it will appear here." />
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 relative">
                                            <AnimatePresence mode="popLayout">
                                                {pending.map(req => (
                                                    <IncomingRequestCard key={req._id} request={req} onRespond={handleRespond} />
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                        {hasMorePending && (
                                            <div className="flex justify-center mt-6">
                                                <Button 
                                                    variant="ghost" 
                                                    onClick={() => fetchNextPending()} 
                                                    loading={loadingMorePending}
                                                    className="px-8"
                                                >
                                                    Load More Requests
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </motion.div>
                        )}

                        {/* Sent Requests */}
                        {activeTab === 'sent' && (
                            <motion.div key="sent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={EASE}>
                                {loadingMoreSent ? (
                                     <NetworkingSkeleton />
                                ) : sent.length === 0 ? (
                                    <EmptyState icon={Send} title="No sent requests" subtitle="Requests you've sent will appear here until they're accepted or declined." />
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 relative">
                                            <AnimatePresence mode="popLayout">
                                                {sent.map(req => (
                                                    <SentRequestCard key={req._id} request={req} onWithdraw={(id) => withdrawMutation.mutate(id)} />
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                        {hasMoreSent && (
                                            <div className="flex justify-center mt-6">
                                                <Button 
                                                    variant="ghost" 
                                                    onClick={() => fetchNextSent()} 
                                                    loading={loadingMoreSent}
                                                    className="px-8"
                                                >
                                                    Load More Requests
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </motion.div>
                        )}

                        {/* Discover */}
                        {activeTab === 'discover' && (
                            <motion.div key="discover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={EASE}>
                                {!searchQuery && suggestions.length > 0 && (
                                    <div className="flex items-center gap-2 mb-4">
                                        <Sparkles className="w-4 h-4 text-theme" />
                                        <span className="text-xs font-black text-primary uppercase tracking-widest">People You May Know</span>
                                    </div>
                                )}
                                {searchQuery && searchQuery.length < 2 && (
                                    <p className="text-sm text-tertiary text-center py-8">Type at least 2 characters to search...</p>
                                )}
                                {discoverData.length === 0 && (searchQuery.length >= 2 || (!searchQuery && suggestions.length === 0)) ? (
                                    <EmptyState icon={Search} title="No users found" subtitle={searchQuery ? "Try a different search term or filter." : "No suggestions available right now."} />
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 relative">
                                        <AnimatePresence mode="popLayout">
                                            {discoverData.map(u => (
                                                <DiscoverCard key={u._id} user={u} onConnect={handleConnect} onViewProfile={setSelectedUserForModal} />
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </article>

            <UserProfileModal 
                isOpen={!!selectedUserForModal} 
                onClose={() => setSelectedUserForModal(null)} 
                userId={selectedUserForModal} 
            />
        </>
    );
};

export default Networking;
