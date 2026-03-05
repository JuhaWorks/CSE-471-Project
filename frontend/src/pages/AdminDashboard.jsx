import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore, api } from '../store/useAuthStore';
import { Navigate } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    // Secure the Route: If not Admin, bounce immediately
    if (user?.role !== 'Admin') {
        return <Navigate to="/" replace />;
    }

    // 1. Fetch Users
    const { data: usersData, isLoading } = useQuery({
        queryKey: ['adminUsers', page, search],
        queryFn: async () => {
            const res = await api.get(`/admin/users?page=${page}&limit=10&search=${search}`);
            return res.data;
        },
        keepPreviousData: true, // Smooth pagination UI
    });

    const users = usersData?.data || [];
    const meta = usersData?.meta || { page: 1, pages: 1, total: 0 };

    // 2. Role Update Mutation
    const updateRoleMutation = useMutation({
        mutationFn: async ({ id, newRole }) => {
            const res = await api.put(`/admin/users/${id}/role`, { role: newRole });
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(`Role updated to ${data.data.role} successfully`);
            queryClient.invalidateQueries(['adminUsers']);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update role');
        }
    });

    // 3. Ban Toggle Mutation
    const toggleBanMutation = useMutation({
        mutationFn: async (id) => {
            const res = await api.put(`/admin/users/${id}/ban`);
            return res.data;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries(['adminUsers']);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update ban status');
        }
    });

    // Sub-component: Status Badge
    const StatusBadge = ({ isBanned }) => {
        if (isBanned) {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    Banned
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Active
            </span>
        );
    };

    // Sub-component: Role Badge
    const RoleBadge = ({ role }) => {
        const styles = {
            Admin: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
            Manager: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            Developer: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
        };
        return (
            <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${styles[role] || styles['Developer']}`}>
                {role}
            </span>
        );
    };

    return (
        <div className="p-5 sm:p-7 lg:p-8 max-w-[1400px] mx-auto space-y-7">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                        <svg className="w-6 h-6 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        Security & Access Control
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Manage user roles, permissions, and platform security flags.</p>
                </div>

                {/* Search Input */}
                <div className="relative max-w-xs w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="block w-full pl-9 pr-3 py-2 border border-white/[0.08] rounded-xl leading-5 bg-white/[0.02] text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 sm:text-sm transition-all shadow-inner"
                    />
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/[0.06]">
                        <thead className="bg-black/20">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Joined</th>
                                <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="inline-flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-violet-500"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-500">
                                        No users found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                users.map((u) => (
                                    <tr key={u._id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <img className="h-10 w-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-violet-500/30 transition-all" src={u.avatar} alt="" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-200">{u.name}</div>
                                                    <div className="text-sm text-gray-500">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <RoleBadge role={u.role} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge isBanned={u.isBanned} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                            {new Date(u.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <DropdownMenu.Root>
                                                <DropdownMenu.Trigger asChild>
                                                    <button className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-white/10 transition-colors focus:outline-none">
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                                                    </button>
                                                </DropdownMenu.Trigger>
                                                <DropdownMenu.Portal>
                                                    <DropdownMenu.Content className="w-48 bg-zinc-900 border border-zinc-700/50 rounded-xl p-1 shadow-2xl z-50 animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-2" sideOffset={5} align="end">

                                                        {/* Role Updates */}
                                                        <DropdownMenu.Label className="px-2 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Change Role</DropdownMenu.Label>
                                                        {['Admin', 'Manager', 'Developer'].map(r => (
                                                            <DropdownMenu.Item
                                                                key={r}
                                                                disabled={u.role === r}
                                                                onSelect={() => updateRoleMutation.mutate({ id: u._id, newRole: r })}
                                                                className={`flex items-center px-2 py-2 text-xs rounded-md cursor-pointer outline-none transition-colors
                                                                ${u.role === r ? 'opacity-50 cursor-not-allowed bg-white/5 text-gray-400' : 'text-gray-200 focus:bg-violet-600 focus:text-white'}`}
                                                            >
                                                                Make {r}
                                                            </DropdownMenu.Item>
                                                        ))}

                                                        <DropdownMenu.Separator className="h-px bg-zinc-800 my-1 -mx-1" />

                                                        {/* Danger Zone */}
                                                        <DropdownMenu.Label className="px-2 py-1.5 text-[10px] font-semibold text-red-500 uppercase tracking-wider">Danger Zone</DropdownMenu.Label>
                                                        <DropdownMenu.Item
                                                            disabled={u._id === user._id}
                                                            onSelect={(e) => {
                                                                e.preventDefault(); // Prevent direct action, require confirmation naturally
                                                                if (window.confirm(`Are you absolutely sure you want to ${u.isBanned ? 'UNBAN' : 'BAN'} ${u.name}?`)) {
                                                                    toggleBanMutation.mutate(u._id);
                                                                }
                                                            }}
                                                            className={`flex items-center px-2 py-2 text-xs rounded-md cursor-pointer outline-none transition-colors 
                                                            ${u._id === user._id ? 'opacity-50 cursor-not-allowed' : 'text-red-400 focus:bg-red-500 focus:text-white'}`}
                                                        >
                                                            {u.isBanned ? 'Unban User' : 'Ban User'}
                                                        </DropdownMenu.Item>

                                                    </DropdownMenu.Content>
                                                </DropdownMenu.Portal>
                                            </DropdownMenu.Root>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!isLoading && meta.pages > 1 && (
                    <div className="bg-black/20 px-6 py-4 flex items-center justify-between border-t border-white/[0.06]">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="relative inline-flex items-center px-4 py-2 border border-white/10 text-sm font-medium rounded-md text-gray-300 bg-white/5 hover:bg-white/10 disabled:opacity-50">Previous</button>
                            <button onClick={() => setPage(p => Math.min(meta.pages, p + 1))} disabled={page === meta.pages} className="ml-3 relative inline-flex items-center px-4 py-2 border border-white/10 text-sm font-medium rounded-md text-gray-300 bg-white/5 hover:bg-white/10 disabled:opacity-50">Next</button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-400">
                                    Showing <span className="font-semibold text-gray-200">{((page - 1) * 10) + 1}</span> to <span className="font-semibold text-gray-200">{Math.min(page * 10, meta.total)}</span> of <span className="font-semibold text-gray-200">{meta.total}</span> users
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-white/10 bg-white/5 text-sm font-medium text-gray-400 hover:bg-white/10 disabled:opacity-50">
                                        <span className="sr-only">Previous</span>
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                    </button>
                                    <button onClick={() => setPage(p => Math.min(meta.pages, p + 1))} disabled={page === meta.pages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-white/10 bg-white/5 text-sm font-medium text-gray-400 hover:bg-white/10 disabled:opacity-50">
                                        <span className="sr-only">Next</span>
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
