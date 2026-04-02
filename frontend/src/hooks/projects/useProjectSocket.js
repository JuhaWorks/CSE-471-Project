import { useEffect, useRef } from 'react';
import { useSocketStore } from '../../store/useSocketStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

export const useProjectSocket = (projectId) => {
    // Layout.jsx now manages the global socket connection.
    // This hook only handles joining/leaving the project-specific room.
    const { socket } = useSocketStore();
    const queryClient = useQueryClient();
    const hasJoined = useRef(false);

    useEffect(() => {
        if (!socket || !projectId) return;

        const handleUpdate = (data) => {
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
            if (data.type === 'MEMBER_REMOVED') {
                toast('Team members updated', { icon: '👥' });
            }
        };

        const handleConnect = () => {
            socket.emit('joinProject', projectId);
            // Re-request presence sync on reconnect so all online users are visible
            socket.emit('requestPresenceSync');
            hasJoined.current = true;
        };

        socket.on('projectUpdated', handleUpdate);

        if (socket.connected && !hasJoined.current) {
            socket.emit('joinProject', projectId);
            // Request fresh global presence snapshot immediately on join
            socket.emit('requestPresenceSync');
            hasJoined.current = true;
        } else {
            socket.on('connect', handleConnect);
        }

        return () => {
            socket.off('projectUpdated', handleUpdate);
            socket.off('connect', handleConnect);
            socket.emit('leaveProject', projectId);
            hasJoined.current = false;
        };
    }, [socket, projectId, queryClient]);

    return { isConnected: useSocketStore.getState().isConnected };
};

