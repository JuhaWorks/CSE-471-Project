import { useAuthStore } from '../store/useAuthStore';

const Profile = () => {
    const { user } = useAuthStore();

    const fields = [
        { label: 'Full Name', value: user?.name, icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z' },
        { label: 'Email Address', value: user?.email, icon: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75' },
        { label: 'Account ID', value: user?._id, icon: 'M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33' },
    ];

    const roleColors = {
        Admin: 'from-red-500 to-orange-500',
        Manager: 'from-blue-500 to-cyan-500',
        Developer: 'from-violet-500 to-blue-500',
        Guest: 'from-gray-500 to-gray-600',
    };

    return (
        <div className="p-5 sm:p-7 lg:p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold tracking-tight mb-6">Profile</h1>

            {/* Avatar Card */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-7 mb-5 flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                    <img
                        src={user?.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                        alt={user?.name}
                        className="w-20 h-20 rounded-2xl border-2 border-white/[0.08] object-cover shadow-xl"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[#0a0a12]" title="Online" />
                </div>
                <div className="text-center sm:text-left">
                    <h2 className="text-xl font-bold text-white">{user?.name || 'User'}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{user?.email}</p>
                    <span className={`inline-block mt-3 px-3 py-1 rounded-full text-[11px] font-bold text-white bg-gradient-to-r ${roleColors[user?.role] || roleColors.Guest} uppercase tracking-wider`}>
                        {user?.role || 'Guest'}
                    </span>
                </div>
            </div>

            {/* Details */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl divide-y divide-white/[0.04]">
                {fields.map((f, i) => (
                    <div key={i} className="flex items-center gap-4 px-6 py-4">
                        <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                            <svg className="w-[18px] h-[18px] text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d={f.icon} /></svg>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] text-gray-600 uppercase tracking-wider font-medium">{f.label}</p>
                            <p className="text-[14px] text-white font-medium truncate">{f.value || '—'}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Profile;
