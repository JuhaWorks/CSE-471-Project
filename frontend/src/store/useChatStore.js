import { create } from 'zustand';
import { api, useAuthStore } from './useAuthStore';

export const useChatStore = create((set, get) => ({
    chats: [],
    activeChat: null,
    messages: {}, // { chatId: [messages] }
    isLoading: false,
    unreadTotal: 0,
    isDrawerOpen: false,
    bubbledChatIds: [],
    typingUsers: {}, // { chatId: [userIds] }

    fetchChats: async () => {
        set({ isLoading: true });
        try {
            const res = await api.get('/chats');
            const chats = res.data.data;
            const unreadTotal = chats.reduce((acc, chat) => {
                const myId = useAuthStore.getState().user?._id;
                return acc + (chat.unreadCounts?.[myId] || 0);
            }, 0);
            
            const bubbledChatIds = chats.filter(c => c.isBubbled).map(c => c._id);
            
            set({ chats, unreadTotal, bubbledChatIds, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
        }
    },

    fetchMessages: async (chatId) => {
        try {
            const res = await api.get(`/chats/${chatId}/messages`);
            const history = res.data.data;
            set((state) => ({
                messages: { ...state.messages, [chatId]: history }
            }));
            
            // Mark as read locally
            get().markChatAsRead(chatId);
        } catch (error) {
            console.error('Fetch messages error:', error);
        }
    },

    sendMessage: async (chatId, data, recipientId = null) => {
        const { content, attachments = [], replyTo = null } = typeof data === 'string' ? { content: data } : data;
        const tempId = `temp-${Date.now()}`;
        const user = useAuthStore.getState().user;
        
        // 1. Create optimistic message
        const isMedia = attachments.length > 0;
        const localPreview = isMedia && attachments[0].preview ? attachments[0].preview : null;
        const tempMessage = {
            _id: tempId,
            chat: chatId,
            sender: user,
            content: content || (isMedia ? attachments[0].name : ''),
            type: isMedia ? (attachments[0].type.startsWith('image/') ? 'image' : attachments[0].type.startsWith('video/') ? 'video' : 'file') : 'text',
            localPreview,
            metadata: isMedia ? { 
                name: attachments[0].name, 
                size: attachments[0].size,
                status: 'uploading'
            } : {},
            replyTo: replyTo ? { _id: replyTo } : null,
            createdAt: new Date().toISOString(),
            status: 'sending'
        };

        // 2. Add to UI immediately if chatId is known
        if (chatId) {
            set((state) => {
                const history = state.messages[chatId] || [];
                return {
                    messages: { ...state.messages, [chatId]: [...history, tempMessage] }
                };
            });
        }

        try {
            let mediaData = null;

            // 3. Handle File Uploads (Synchronous for now, simplest approach)
            if (isMedia) {
                const formData = new FormData();
                formData.append('file', attachments[0].file);
                const uploadRes = await api.post('/chats/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                mediaData = uploadRes.data.data;
            }

            const res = await api.post('/chats/send', { 
                chatId, 
                recipientId, 
                content: mediaData ? mediaData.url : content,
                type: tempMessage.type,
                replyTo,
                metadata: mediaData ? { ...mediaData, status: 'complete' } : {}
            });
            
            const newMessage = res.data.data;
            const actualChatId = chatId || newMessage.chat;

            set((state) => {
                const history = state.messages[actualChatId] || [];
                // 1. Remove the temp message
                const filteredHistory = history.filter(m => m._id !== tempId);
                
                // 2. Double check if the socket already added this message (received via server emit)
                const alreadyExists = filteredHistory.some(m => m._id === newMessage._id);
                if (alreadyExists) return { messages: { ...state.messages, [actualChatId]: filteredHistory } };

                return {
                    messages: {
                        ...state.messages,
                        [actualChatId]: [...filteredHistory, newMessage]
                    }
                };
            });

            if (!chatId) get().fetchChats();
            return newMessage;
        } catch (error) {
            if (chatId) {
                set((state) => {
                    const history = state.messages[chatId] || [];
                    const newHistory = history.map(m => 
                        m._id === tempId ? { ...m, status: 'error' } : m
                    );
                    return { messages: { ...state.messages, [chatId]: newHistory } };
                });
            }
            console.error('Send message error:', error);
        }
    },

    setActiveChat: (chat) => {
        set({ activeChat: chat });
        if (chat) {
            get().fetchMessages(chat._id);
            get().markChatAsRead(chat._id);
        }
    },

    markChatAsRead: (chatId) => {
        set((state) => {
            const updatedChats = state.chats.map(c => {
                if (c._id === chatId) {
                    const myId = useAuthStore.getState().user?._id;
                    const updatedUnread = { ...c.unreadCounts, [myId]: 0 };
                    return { ...c, unreadCounts: updatedUnread };
                }
                return c;
            });
            
            const newUnreadTotal = updatedChats.reduce((acc, chat) => {
                const myId = useAuthStore.getState().user?._id;
                return acc + (chat.unreadCounts?.[myId] || 0);
            }, 0);

            return { chats: updatedChats, unreadTotal: newUnreadTotal };
        });
    },

    addIncomingMessage: (chatId, message) => {
        set((state) => {
            const chatHistory = state.messages[chatId] || [];
            
            // Check for duplicates (e.g. if socket sends back our own optimistic message)
            if (chatHistory.some(m => m._id === message._id)) return state;

            const isCurrentChat = state.activeChat?._id === chatId;
            
            // 1. Update messages
            const newHistory = [...chatHistory, message];
            const newMessages = {
                ...state.messages,
                [chatId]: newHistory
            };

            // 2. Update chat list (last message and unread count)
            const updatedChats = state.chats.map(c => {
                if (c._id === chatId) {
                    const myId = useAuthStore.getState().user?._id;
                    const unread = isCurrentChat ? 0 : (c.unreadCounts?.[myId] || 0) + 1;
                    return {
                        ...c,
                        lastMessage: message,
                        unreadCounts: { ...c.unreadCounts, [myId]: unread }
                    };
                }
                return c;
            });

            // 3. Update global unread count
            const newUnreadTotal = updatedChats.reduce((acc, chat) => {
                const myId = useAuthStore.getState().user?._id;
                return acc + (chat.unreadCounts?.[myId] || 0);
            }, 0);

            return {
                messages: newMessages,
                chats: updatedChats,
                unreadTotal: newUnreadTotal
            };
        });
    },

    setTyping: (chatId, userId, isTyping) => {
        set((state) => {
            const current = state.typingUsers[chatId] || [];
            const updated = isTyping 
                ? [...new Set([...current, userId])]
                : current.filter(id => id !== userId);
            
            return {
                typingUsers: { ...state.typingUsers, [chatId]: updated }
            };
        });
    },

    setDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),

    openChatList: () => set((state) => ({
        isDrawerOpen: !state.isDrawerOpen,
        activeChat: null // Always reset to list when toggling via sidebar
    })),

    toggleBubble: async (chatId) => {
        try {
            const res = await api.patch(`/chats/${chatId}/bubble`);
            const { isBubbled } = res.data;
            
            set((state) => {
                const bubbledChatIds = isBubbled 
                    ? [...state.bubbledChatIds, chatId]
                    : state.bubbledChatIds.filter(id => id !== chatId);
                
                const chats = state.chats.map(c => 
                    c._id === chatId ? { ...c, isBubbled } : c
                );

                return { bubbledChatIds, chats };
            });
        } catch (error) {
            console.error('Toggle bubble error:', error);
        }
    },

    archiveChat: async (chatId) => {
        try {
            const res = await api.patch(`/chats/${chatId}/archive`);
            const { isArchived } = res.data;
            set((state) => ({
                chats: state.chats.map(c =>
                    c._id === chatId ? { ...c, isArchived } : c
                )
            }));
        } catch (error) {
            console.error('Archive chat error:', error);
        }
    },


    unsendMessage: async (chatId, messageId) => {
        // Optimistic update
        set((state) => {
            const history = state.messages[chatId] || [];
            return {
                messages: {
                    ...state.messages,
                    [chatId]: history.map(m =>
                        m._id === messageId
                            ? { ...m, deleted: true, content: 'This message was removed' }
                            : m
                    )
                }
            };
        });
        try {
            await api.patch(`/chats/messages/${messageId}/unsend`);
        } catch (error) {
            console.error('Unsend message error:', error);
        }
    },

    handleMessageDeleted: (chatId, messageId) => {
        set((state) => {
            const history = state.messages[chatId] || [];
            return {
                messages: {
                    ...state.messages,
                    [chatId]: history.map(m =>
                        m._id === messageId
                            ? { ...m, deleted: true, content: 'This message was removed' }
                            : m
                    )
                }
            };
        });
    },

    deleteChat: async (chatId) => {
        try {
            await api.delete(`/chats/${chatId}`);
            set((state) => ({
                chats: state.chats.filter(c => c._id !== chatId),
                activeChat: state.activeChat?._id === chatId ? null : state.activeChat
            }));
        } catch (error) {
            console.error('Delete chat error:', error);
        }
    }
}));
