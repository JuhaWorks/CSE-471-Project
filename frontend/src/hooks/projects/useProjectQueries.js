import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../../api/projectApi';
import { toast } from 'react-hot-toast';

export const useProjects = () => {
    return useQuery({
        queryKey: ['projects'],
        queryFn: projectService.getProjects,
        staleTime: 1000 * 60 * 5 // 5 minutes
    });
};

export const useProject = (id) => {
    return useQuery({
        queryKey: ['project', id],
        queryFn: () => projectService.getProject(id),
        enabled: !!id
    });
};

export const useUpdateProject = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data, version }) => projectService.updateProject(id, data, version),
        onMutate: async ({ id, data }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['project', id] });

            // Snapshot previous value
            const previousProject = queryClient.getQueryData(['project', id]);

            // Optimistically update
            queryClient.setQueryData(['project', id], (old) => ({
                ...old,
                ...data
            }));

            return { previousProject };
        },
        onError: (err, { id }, context) => {
            // Check for OCC Conflict (409)
            if (err.response?.status === 409) {
                toast.error('Concurrency Conflict: This project was updated elsewhere. Refreshing...');
            } else {
                toast.error(err.response?.data?.message || 'Update failed');
            }

            // Roll back
            if (context?.previousProject) {
                queryClient.setQueryData(['project', id], context.previousProject);
            }
        },
        onSettled: (data, error, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['project', id] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
        onSuccess: () => {
            toast.success('Project updated successfully');
        }
    });
};

export const useProjectActivity = (id) => {
    return useQuery({
        queryKey: ['projectActivity', id],
        queryFn: () => projectService.getProjectActivity(id),
        enabled: !!id
    });
};

export const useProjectInsights = (id) => {
    return useQuery({
        queryKey: ['projectInsights', id],
        queryFn: () => projectService.getProjectInsights(id),
        enabled: !!id
    });
};

// --- Member Management ---

export const useAddMember = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, email, role }) => projectService.addMember(id, email, role),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['project', id] });
            toast.success('Member invited successfully');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to invite member')
    });
};

export const useUpdateMemberRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, userId, role }) => projectService.updateMemberRole(projectId, userId, role),
        onSuccess: (_, { projectId }) => {
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
            toast.success('Role updated');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to update role')
    });
};

export const useRemoveMember = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, userId }) => projectService.removeMember(projectId, userId),
        onSuccess: (_, { projectId }) => {
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
            toast.success('Member removed');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Failed to remove member')
    });
};

export const useUploadProjectImage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, file }) => projectService.uploadProjectImage(id, file),
        onSuccess: (data, { id }) => {
            queryClient.setQueryData(['project', id], data);
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            toast.success('Project image uploaded');
        },
        onError: (err) => toast.error(err.response?.data?.message || 'Upload failed')
    });
};
