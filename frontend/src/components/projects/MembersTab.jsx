import React, { useRef } from 'react';
import { useProjectMembers } from '../../hooks/projects/useProjectMembers';
import InviteMemberDialog from './InviteMemberDialog';
import MemberRow from './MemberRow';
import Card from '../ui/Card';
import { Users, ShieldCheck, Zap } from 'lucide-react';

/**
 * Modern 2026 MembersTab
 * High-performance team management with Glassmorphism 2.0
 */
const MembersTab = ({ project, currentUser }) => {
    const emailInputRef = useRef(null);

    const {
        state,
        actions,
        status,
        auth
    } = useProjectMembers(project, currentUser);

    return (
        <div className="space-y-8">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-cyan-400 font-black text-[10px] uppercase tracking-[0.4em]">
                        <Users className="w-3.5 h-3.5" />
                        <span>Personnel Management</span>
                    </div>
                    <h2 className="text-4xl font-black text-white tracking-tighter">Team Node Roster.</h2>
                    <p className="text-gray-500 font-medium text-sm max-w-lg">
                        Manage clearance levels, access protocols, and operational roles for all agents assigned to this project segment.
                    </p>
                </div>
                {auth.isManager && (
                    <div className="flex shrink-0">
                        <InviteMemberDialog
                            ref={emailInputRef}
                            isOpen={state.isInviteOpen}
                            onOpenChange={actions.setIsInviteOpen}
                            email={state.inviteEmail}
                            role={state.inviteRole}
                            onEmailChange={actions.setInviteEmail}
                            onRoleChange={actions.setInviteRole}
                            onInvite={actions.handleInvite}
                            isLoading={status.isAdding}
                        />
                    </div>
                )}
            </header>

            <Card className="overflow-hidden" padding="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.01]">
                                <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Agent Profile</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Protocol Role</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Sync Date</th>
                                <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] text-right">Directives</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {project.members.map((member) => (
                                <MemberRow
                                    key={member.userId?._id}
                                    member={member}
                                    currentUser={currentUser}
                                    managerCount={auth.managerCount}
                                    isViewer={auth.isViewer}
                                    onUpdateRole={actions.handleUpdateRole}
                                    onRemove={actions.handleRemoveMember}
                                    isUpdating={status.isUpdating}
                                    isRemoving={status.isRemoving}
                                    canManage={auth.isManager}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>

                {project.members.length === 0 && (
                    <div className="py-24 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                            <Users className="w-8 h-8 text-gray-700" />
                        </div>
                        <h3 className="text-xl font-black text-white tracking-tight">Segment Vacant</h3>
                        <p className="text-gray-500 text-sm mt-1 max-w-xs">No personnel have been synchronized with this operational domain.</p>
                    </div>
                )}

                <footer className="px-10 py-6 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-4 h-4 text-emerald-500/60" />
                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                            Secure Personnel Network Active
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                            {project.members.length} Agents Assigned
                        </span>
                    </div>
                </footer>
            </Card>
        </div>
    );
};

export default MembersTab;
