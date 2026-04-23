import { create } from 'zustand';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { useAuthStore } from './useAuthStore';
import { useChatStore } from './useChatStore';
import { startTransition } from 'react';
import { getOptimizedAvatar } from '../utils/avatar';
import { Bell } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || 
                    import.meta.env.VITE_BACKEND_URL || 
                    import.meta.env.VITE_API_URL || 
                    (import.meta.env.PROD ? 'https://syncforge-io.onrender.com' : 'http://127.0.0.1:5000');

export const useSocketStore = create((set, get) => ({
    socket: null,
    isConnected: false,
    activeViewers: [], // [{ userId, name, avatar, status }]
    onlineUsers: [], // Global presence tracking
    fieldLocks: {}, // { fieldId: { userId, userName } }
    globalPresenceOpen: false,
    currentProjectId: null,
    presenceUsers: [], // Contextual users (e.g., project members)

    connect: (token) => {
        if (get().socket?.connected) return;
        // Don't create a second socket if one is already being set up
        if (get().socket) return;

        const socket = io(BACKEND_URL, {
            auth: { token },
            // WebSocket-only: skip HTTP long-polling entirely for instant connection
            transports: ['websocket'],
            reconnectionAttempts: 10,
            reconnectionDelay: 500,
            reconnectionDelayMax: 3000,
            timeout: 5000,
        });

        // Heartbeat interval reference — cleared on disconnect
        let syncInterval = null;

        const startHeartbeat = () => {
            if (syncInterval) clearInterval(syncInterval);
            // Re-request presence every 20s but only when the tab is visible
            syncInterval = setInterval(() => {
                if (socket.connected && !document.hidden) {
                    socket.emit('requestPresenceSync');
                }
            }, 20000);
        };

        const joinAllChats = () => {
            const chats = useChatStore.getState().chats || [];
            chats.forEach(chat => socket.emit('join_chat', chat._id));
        };

        socket.on('connect', () => {
            const user = useAuthStore.getState().user;
            set({ isConnected: true });
            
            // Immediately request fresh presence on every (re)connect
            socket.emit('requestPresenceSync');
            
            // Join personal room and all chat rooms
            if (user?._id) {
                socket.emit('join_chat', `user_${user._id}`);
            }
            joinAllChats();
            
            startHeartbeat();
            console.log('🚀 Socket connected and rooms joined');
        });

        socket.on('reconnect', () => {
            const { currentProjectId } = get();
            if (currentProjectId) {
                socket.emit('joinProject', currentProjectId);
            }
            socket.emit('requestPresenceSync');
            joinAllChats();
            console.log('🔄 Socket reconnected — presence synced');
        });

        socket.on('disconnect', (reason) => {
            set({ isConnected: false, activeViewers: [] });
            if (syncInterval) { clearInterval(syncInterval); syncInterval = null; }
            console.log('🔌 Socket disconnected:', reason);
        });

        socket.on('locksUpdated', (locks) => {
            set({ fieldLocks: locks });
        });

        socket.on('presenceUpdate', (viewers) => {
            // Non-urgent background update — defer if user is interacting
            startTransition(() => set({ activeViewers: viewers }));
        });

        socket.on('globalPresenceUpdate', (users) => {
            // Non-urgent background update — defer if user is interacting
            startTransition(() => set({ onlineUsers: users }));
        });

        socket.on('project_activity', (populated) => {
            const queryClient = get().queryClient;
            if (queryClient) {
                queryClient.invalidateQueries({ queryKey: ['projectActivity', populated.entityId] });
                queryClient.invalidateQueries({ queryKey: ['taskActivity', populated.entityId] });
            }

            // Humanize action name
            const actionMap = {
                'CommentAdded': 'added a comment',
                'TaskCreated': 'created a task',
                'TaskUpdated': 'updated a task',
                'StatusChanged': 'changed task status',
                'AssignmentChanged': 'updated assignments',
                'DeadlineUpdated': 'changed a deadline',
                'MetadataUpdated': 'updated task details'
            };

            const actionLabel = actionMap[populated.action] || populated.action.toLowerCase();
            const userName = populated.user?.name || 'Teammate';

            toast(`${userName} ${actionLabel}`, {
                icon: '🚀',
                style: {
                    borderRadius: '16px',
                    background: '#09090b',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '13px',
                    fontWeight: '500',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                },
                position: 'bottom-right'
            });
        });

        socket.on('workspace_activity', (populated) => {
            const queryClient = get().queryClient;
            if (queryClient) {
                queryClient.invalidateQueries({ queryKey: ['workspaceActivity'] });
            }
        });

        socket.on('commentAdded', ({ taskId, comment }) => {
            const queryClient = get().queryClient;
            if (queryClient) {
                queryClient.invalidateQueries({ queryKey: ['taskComments', taskId] });
                queryClient.invalidateQueries({ queryKey: ['taskActivity', taskId] });
            }
        });

        socket.on('typing', ({ chat, userId, isTyping }) => {
            useChatStore.getState().setTyping(chat, userId, isTyping);
        });

        socket.on('statusUpdated', (newStatus) => {
            const { user } = useAuthStore.getState();
            if (user && user.status !== newStatus) {
                useAuthStore.setState((state) => ({
                    user: state.user ? { ...state.user, status: newStatus } : null
                }));
            }
        });

        // ── GLOBAL DYNAMIC CACHE SYNCHRONIZATION ──
        // This eliminates the need for manual reloads by automatically refreshing 
        // relevant data when socket events arrive from teammates.
        
        socket.on('taskUpdated', (task) => {
            const queryClient = get().queryClient;
            if (queryClient) {
                queryClient.invalidateQueries({ queryKey: ['tasks'] });
                queryClient.invalidateQueries({ queryKey: ['workspace-stats'] });
                if (task?._id) {
                    queryClient.invalidateQueries({ queryKey: ['task', task._id] });
                    queryClient.invalidateQueries({ queryKey: ['taskActivity', task._id] });
                }
            }
        });

        socket.on('taskDeleted', () => {
            const queryClient = get().queryClient;
            if (queryClient) {
                queryClient.invalidateQueries({ queryKey: ['tasks'] });
                queryClient.invalidateQueries({ queryKey: ['workspace-stats'] });
            }
        });

        socket.on('projectUpdated', () => {
            const queryClient = get().queryClient;
            if (queryClient) {
                queryClient.invalidateQueries({ queryKey: ['projects'] });
                queryClient.invalidateQueries({ queryKey: ['project-detail'] });
                queryClient.invalidateQueries({ queryKey: ['workspace-stats'] });
                queryClient.invalidateQueries({ queryKey: ['projectActivity'] });
            }
        });

        // ── WHITEBOARD GRANULAR SYNC ──
        // This surgical approach avoids full refetches, preventing flickering 
        // and cursor jumps while teammates are collaborating.
        
        socket.on('whiteboard:noteMoved', ({ noteId, projectId, x, y }) => {
            const queryClient = get().queryClient;
            if (!queryClient) return;
            
            // Surgically update the coordinate in the cache
            queryClient.setQueryData(['whiteboard-notes', projectId], (oldNotes) => {
                if (!oldNotes) return [];
                return oldNotes.map(n => n._id === noteId ? { ...n, x, y } : n);
            });
        });

        socket.on('whiteboard:noteCreated', (newNote) => {
            const queryClient = get().queryClient;
            if (!queryClient) return;
            
            queryClient.setQueryData(['whiteboard-notes', newNote.projectId], (oldNotes) => {
                if (!oldNotes) return [newNote];
                // Avoid duplicates if we created it locally first
                if (oldNotes.some(n => n._id === newNote._id)) return oldNotes;
                return [...oldNotes, newNote];
            });
        });

        socket.on('whiteboard:noteUpdated', (updatedNote) => {
            const queryClient = get().queryClient;
            if (!queryClient) return;

            queryClient.setQueryData(['whiteboard-notes', updatedNote.projectId], (oldNotes) => {
                if (!oldNotes) return [updatedNote];
                return oldNotes.map(n => n._id === updatedNote._id ? updatedNote : n);
            });
        });

        socket.on('whiteboard:noteDeleted', (noteId) => {
            const queryClient = get().queryClient;
            if (!queryClient) return;

            // Note: noteDeleted event needs to know which project it belonged to, 
            // but we can look through all whiteboard caches or just rely on the fact 
            // that we have the projekt ID from the current navigation state
            // For now, we'll look for any cache that contains this note ID.
            const queryCache = queryClient.getQueryCache();
            const whiteboardQueries = queryCache.findAll({ queryKey: ['whiteboard-notes'] });
            
            whiteboardQueries.forEach(query => {
                queryClient.setQueryData(query.queryKey, (oldNotes) => {
                    if (!oldNotes) return [];
                    return oldNotes.filter(n => n._id !== noteId);
                });
            });
        });

        socket.on('typing', ({ chat, userId, isTyping }) => {
            useChatStore.getState().setTyping(chat, userId, isTyping);
        });
        
        // --- REAL-TIME CHAT SYNCHRONIZATION ---
        socket.on('newMessage', ({ chat, message }) => {
            console.log('📬 New real-time message received:', chat);
            const chatStore = useChatStore.getState();
            const authStore = useAuthStore.getState();
            const user = authStore.user;

            chatStore.addIncomingMessage(chat, message);

            // Chat Notification Logic
            const isFromMe = message.sender?._id === user?._id || message.sender === user?._id;
            const isCurrentChatOpen = chatStore.activeChat?._id === chat && chatStore.isDrawerOpen;

            if (!isFromMe && !isCurrentChatOpen) {
                const chatObj = chatStore.chats.find(c => c._id === chat);
                const chatName = chatObj?.type === 'group' ? chatObj.name : (message.sender?.name || 'Someone');
                const preview = (message.content || '').slice(0, 50);

                // Use centralized toast for chat messages too
                toast(`${chatName}: ${preview}`, {
                    icon: '💬',
                    style: {
                        borderRadius: '16px',
                        background: '#09090b',
                        color: '#fff',
                        border: '1px solid rgba(34,211,238,0.2)',
                        fontSize: '13px',
                        fontWeight: '600'
                    },
                    position: 'bottom-right',
                    onClick: () => {
                        chatStore.setDrawerOpen(true);
                        if (chatObj) chatStore.setActiveChat(chatObj);
                    }
                });

                // Browser notification
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification(chatName, { body: preview, icon: message.sender?.avatar || '/icon.png' });
                }
            }
        });

        socket.on('messageDeleted', ({ chat, messageId }) => {
            console.log('🗑️ Message unsend event received:', messageId);
            useChatStore.getState().handleMessageDeleted(chat, messageId);
        });

        socket.on('chatCleared', ({ chat, userId }) => {
            const user = useAuthStore.getState().user;
            if (userId === user?._id) {
                useChatStore.getState().fetchChats();
                if (useChatStore.getState().activeChat?._id === chat) {
                    useChatStore.getState().fetchMessages(chat);
                }
            }
        });

        socket.on('newNotification', (notification) => {
            const queryClient = get().queryClient;
            if (queryClient) {
                queryClient.invalidateQueries({ queryKey: ['notifications'] });
                queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
            }

            // Centralized Notification Toast
            toast(notification.message, {
                icon: notification.priority === 'High' ? '🔥' : '🔔',
                style: {
                    borderRadius: '16px',
                    background: '#09090b',
                    color: '#fff',
                    border: notification.priority === 'High' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.1)',
                    fontSize: '13px',
                    fontWeight: '600',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.6)'
                },
                position: 'top-right',
                duration: 5000
            });
        });

        // ── NETWORKING EVENTS ──
        socket.on('connection:received', () => {
            const queryClient = get().queryClient;
            if (queryClient) {
                queryClient.invalidateQueries({ queryKey: ['pending-connections'] });
                queryClient.invalidateQueries({ queryKey: ['networking-stats'] });
            }
        });

        socket.on('connection:status_updated', () => {
            const queryClient = get().queryClient;
            if (queryClient) {
                queryClient.invalidateQueries({ queryKey: ['connections'] });
                queryClient.invalidateQueries({ queryKey: ['networking-stats'] });
            }
        });

        set({ socket });
    },

    setQueryClient: (queryClient) => set({ queryClient }),


    toggleGlobalPresence: (visible, context = null) => {
        const isCurrentlyVisible = get().globalPresenceOpen;
        const nextVisible = visible ?? !isCurrentlyVisible;

        // "context" can be an array of members or a projectId string
        const newState = { globalPresenceOpen: nextVisible };
        if (Array.isArray(context)) {
            newState.presenceUsers = context;
            newState.currentProjectId = null;
        } else if (typeof context === 'string') {
            newState.currentProjectId = context;
            newState.presenceUsers = [];
        } else if (!nextVisible) {
            // Reset context on close
            newState.currentProjectId = null;
            newState.presenceUsers = [];
        }

        set(newState);
    },

    joinProject: (projectId) => {
        const { socket } = get();
        if (socket) {
            socket.emit('joinProject', projectId);
            set({ currentProjectId: projectId });
        }
    },

    leaveProject: (projectId) => {
        const { socket } = get();
        if (socket) {
            socket.emit('leaveProject', projectId);
            set({ currentProjectId: null });
        }
    },

    disconnect: () => {
        get().socket?.disconnect();
        set({ socket: null, isConnected: false, activeViewers: [], onlineUsers: [], globalPresenceOpen: false, currentProjectId: null, presenceUsers: [] });
    }
}));
