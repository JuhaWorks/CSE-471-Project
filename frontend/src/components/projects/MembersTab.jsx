import React, { useState } from 'react';
import { User, Shield, UserMinus, Plus, Loader2, X } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Dialog from '@radix-ui/react-dialog';
import { useAddMember, useUpdateMemberRole, useRemoveMember } from '../../hooks/projects/useProjectQueries';

const MembersTab = ({ project, currentUser }) => {
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('Editor');
    const [isInviteOpen, setIsInviteOpen] = useState(false);

    const addMemberMutation = useAddMember();
    const updateRoleMutation = useUpdateMemberRole();
    const removeMemberMutation = useRemoveMember();

    // RBAC logic
    const userRole = project.members.find(m => m.userId?._id === currentUser?._id)?.role || 'Viewer';
    const isManager = userRole === 'Manager' || currentUser?.role === 'Admin';
    const isViewer = userRole === 'Viewer';

    const managerCount = project.members.filter(m => m.role === 'Manager').length;

    const handleInvite = (e) => {
        e.preventDefault();
        addMemberMutation.mutate({ id: project._id, email: inviteEmail, role: inviteRole }, {
            onSuccess: () => {
                setInviteEmail('');
                setIsInviteOpen(false);
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Project Members</h2>
                    <p className="text-zinc-500 text-sm mt-1">Manage team access and roles.</p>
                </div>
                {isManager && (
                    <Dialog.Root open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                        <Dialog.Trigger asChild>
                            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-500 transition-all shadow-lg shadow-violet-600/20 active:scale-95">
                                <Plus className="w-4 h-4" />
                                Invite Member
                            </button>
                        </Dialog.Trigger>
                        <Dialog.Portal>
                            <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] animate-in fade-in duration-300" />
                            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-zinc-950 border border-white/10 p-8 rounded-[32px] shadow-2xl z-[151] animate-in zoom-in-95 duration-300 focus:outline-none">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-black text-white tracking-tight underline decoration-violet-500 decoration-2">Invite Collaborator</h3>
                                    <Dialog.Close className="p-2 hover:bg-white/5 rounded-full transition-all text-zinc-500 hover:text-white">
                                        <X className="w-5 h-5" />
                                    </Dialog.Close>
                                </div>
                                <form onSubmit={handleInvite} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-zinc-500 uppercase ml-1 tracking-widest">Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            placeholder="colleague@klivra.com"
                                            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-violet-500/50 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-zinc-500 uppercase ml-1 tracking-widest">Initial Role</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['Manager', 'Editor', 'Viewer'].map(role => (
                                                <button
                                                    key={role}
                                                    type="button"
                                                    onClick={() => setInviteRole(role)}
                                                    className={`px-3 py-2 rounded-xl text-[10px] font-black transition-all border ${inviteRole === role ? 'bg-violet-600 border-violet-500 text-white' : 'bg-white/5 border-white/5 text-zinc-500 hover:border-white/10'}`}
                                                >
                                                    {role}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        disabled={addMemberMutation.isPending}
                                        className="w-full py-4 bg-white text-zinc-950 font-black rounded-2xl hover:bg-zinc-200 transition-all active:scale-95 shadow-xl shadow-white/5 flex items-center justify-center gap-2"
                                    >
                                        {addMemberMutation.isPending && <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />}
                                        Send Invite
                                    </button>
                                </form>
                            </Dialog.Content>
                        </Dialog.Portal>
                    </Dialog.Root>
                )}
            </div>

            <div className="bg-zinc-950/50 border border-white/5 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-6 py-4 text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em]">Member</th>
                                <th className="px-6 py-4 text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em]">Role</th>
                                <th className="px-6 py-4 text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em]">Joined At</th>
                                <th className="px-6 py-4 text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {project.members.map((member) => (
                                <tr key={member.userId?._id} className="group hover:bg-white/[0.01] transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden">
                                                {member.userId?.avatar ? (
                                                    <img src={member.userId.avatar} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-5 h-5 text-zinc-600" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white leading-none">
                                                    {member.userId?.name}
                                                    {member.userId?._id === currentUser?._id && <span className="ml-2 text-[10px] text-violet-400 font-medium bg-violet-400/10 px-2 py-0.5 rounded-full border border-violet-400/20 uppercase tracking-tighter">You</span>}
                                                </p>
                                                <p className="text-xs text-zinc-500 mt-1">{member.userId?.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <DropdownMenu.Root>
                                            <DropdownMenu.Trigger
                                                disabled={isViewer || (member.userId?._id === currentUser?._id && member.role === 'Manager' && managerCount === 1) || updateRoleMutation.isPending}
                                                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/5 bg-zinc-900/50 text-xs font-bold text-zinc-300 hover:border-violet-500/30 hover:text-white transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Shield className="w-3.5 h-3.5 text-violet-400" />
                                                {member.role}
                                            </DropdownMenu.Trigger>

                                            <DropdownMenu.Portal>
                                                <DropdownMenu.Content className="z-[100] min-w-[140px] bg-zinc-900 border border-white/10 rounded-2xl p-1 shadow-2xl animate-in fade-in zoom-in duration-200">
                                                    {['Manager', 'Editor', 'Viewer'].map((role) => (
                                                        <DropdownMenu.Item
                                                            key={role}
                                                            onClick={() => updateRoleMutation.mutate({ projectId: project._id, userId: member.userId._id, role })}
                                                            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold ${member.role === role ? 'text-violet-400' : 'text-zinc-400'} hover:text-white hover:bg-violet-600 rounded-xl cursor-pointer outline-none transition-all`}
                                                        >
                                                            {role}
                                                        </DropdownMenu.Item>
                                                    ))}
                                                </DropdownMenu.Content>
                                            </DropdownMenu.Portal>
                                        </DropdownMenu.Root>
                                    </td>
                                    <td className="px-6 py-5 text-xs text-zinc-500">
                                        {new Date(member.joinedAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        {isManager && member.userId?._id !== currentUser?._id && (
                                            <button
                                                onClick={() => removeMemberMutation.mutate({ projectId: project._id, userId: member.userId._id })}
                                                disabled={removeMemberMutation.isPending}
                                                className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all disabled:opacity-20"
                                            >
                                                <UserMinus className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MembersTab;
