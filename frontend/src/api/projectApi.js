import { api } from '../store/useAuthStore';

export const projectService = {
    getProjects: async () => {
        const response = await api.get('/projects');
        return response.data.data;
    },

    getProject: async (id) => {
        const response = await api.get(`/projects/${id}`);
        return response.data.data;
    },

    createProject: async (projectData) => {
        const response = await api.post('/projects', projectData);
        return response.data.data;
    },

    updateProject: async (id, projectData, version) => {
        // Enforce OCC by sending the version if provided
        const response = await api.put(`/projects/${id}`, {
            ...projectData,
            __v: version
        });
        return response.data.data;
    },

    deleteProject: async (id) => {
        const response = await api.delete(`/projects/${id}`);
        return response.data;
    },

    restoreProject: async (id) => {
        const response = await api.post(`/projects/${id}/restore`);
        return response.data.data;
    },

    getProjectActivity: async (id) => {
        const response = await api.get(`/projects/${id}/activity`);
        return response.data.data;
    },

    getProjectInsights: async (id) => {
        const response = await api.get(`/projects/${id}/insights`);
        return response.data.data;
    },

    // Member Management
    addMember: async (id, email, role) => {
        const response = await api.post(`/projects/${id}/members`, { email, role });
        return response.data.data;
    },

    updateMemberRole: async (projectId, userId, role) => {
        const response = await api.put(`/projects/${projectId}/members/${userId}`, { role });
        return response.data.data;
    },

    removeMember: async (projectId, userId) => {
        const response = await api.delete(`/projects/${projectId}/members/${userId}`);
        return response.data;
    },

    uploadProjectImage: async (id, file) => {
        const formData = new FormData();
        formData.append('coverImage', file);
        const response = await api.post(`/projects/${id}/image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data.data;
    }
};
