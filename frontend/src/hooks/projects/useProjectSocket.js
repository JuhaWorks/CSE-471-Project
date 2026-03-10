import { useEffect, useRef } from 'react';
import { useSocketStore } from '../../store/useSocketStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

export const useProjectSocket = (projectId) => {
    const { socket, connect, isConnected } = useSocketStore();
    const { accessToken } = useAuthStore();
    const queryClient = useQueryClient();
    const hasJoined = useRef(false);

    useEffect(() => {
        if (accessToken && !socket) {
            connect(accessToken);
        }
    }, [accessToken, socket, connect]);

    useEffect(() => {
        if (!socket || !projectId) return;

        const handleUpdate = (data) => {
            // Silently invalidate to get fresh data
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });

            // Optional: User-friendly notification for specific changes
            if (data.type === 'MEMBER_REMOVED') {
                toast('Team members updated', { icon: '👥' });
            }
        };

        // Reconnection logic: Ensure we re-join the room on reconnect
        const handleConnect = () => {
            socket.emit('joinProject', projectId);
            hasJoined.current = true;
        };

        socket.on('projectUpdated', handleUpdate);

        if (socket.connected && !hasJoined.current) {
            socket.emit('joinProject', projectId);
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

    return { isConnected };
};
