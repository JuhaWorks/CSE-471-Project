import { useState, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useSocketStore } from '../store/useSocketStore';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/getCroppedImg';

// Auto-compress any Cloudinary avatar to a ~10-15kb 100x100 WebP
const getOptimizedAvatar = (url) => {
    if (!url) return 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
    if (url.includes('upload/')) {
        return url.replace('upload/', 'upload/w_100,h_100,c_fill,f_webp/');
    }
    return url;
};

// ─── Status options (must match backend enum) ────────────────────────────────
const STATUS_OPTIONS = ['Online', 'Away', 'Do Not Disturb', 'Offline'];

const STATUS_DOT = {
    Online: 'bg-emerald-500',
    Away: 'bg-yellow-400',
    'Do Not Disturb': 'bg-red-500',
    Offline: 'bg-gray-500',
};

const roleColors = {
    Admin: 'from-red-500 to-orange-500',
    Manager: 'from-blue-500 to-cyan-500',
    Developer: 'from-violet-500 to-blue-500',
    Guest: 'from-gray-500 to-gray-600',
};

// ─── Small feedback banner ────────────────────────────────────────────────────
const Banner = ({ type, msg }) =>
    msg ? (
        <p className={`text-[13px] px-4 py-2.5 rounded-xl border ${type === 'error'
            ? 'bg-red-500/10 border-red-500/20 text-red-400'
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}>
            {msg}
        </p>
    ) : null;

// ─── Section card wrapper ────────────────────────────────────────────────────
const Card = ({ title, badge, children }) => (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-white">{title}</h2>
            {badge && (
                <span className="text-[10px] text-gray-500 bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/[0.06] uppercase tracking-wider font-medium">
                    {badge}
                </span>
            )}
        </div>
        <div className="p-6 space-y-4">{children}</div>
    </div>
);

// ─── Shared input ─────────────────────────────────────────────────────────────
const Input = ({ label, ...props }) => (
    <div>
        <label className="block text-[11px] text-gray-500 uppercase tracking-wider font-medium mb-1.5">
            {label}
        </label>
        <input
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-[14px] text-white placeholder-gray-600 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/10 transition-all"
            {...props}
        />
    </div>
);

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = () => (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
    </svg>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const Profile = () => {
    const { user, uploadAvatar, updateProfile, removeAvatar } = useAuthStore();

    // ── Avatar state ──────────────────────────────────────────────────────────
    const fileRef = useRef(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [avatarStatus, setAvatarStatus] = useState({ type: '', msg: '' });

    // ── Cropping state ────────────────────────────────────────────────────────
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isCropping, setIsCropping] = useState(false);

    // ── Edit profile state ────────────────────────────────────────────────────
    const [profileForm, setProfileForm] = useState({
        name: user?.name || '',
        status: user?.status || 'Online',
        customMessage: user?.customMessage || '',
    });
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileStatus, setProfileStatus] = useState({ type: '', msg: '' });


    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setAvatarStatus({ type: 'error', msg: 'Only image files are allowed.' });
            return;
        }
        setAvatarPreview(URL.createObjectURL(file));
        setIsCropping(true);
        setAvatarStatus({ type: '', msg: '' });
    };

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleCropSave = async () => {
        try {
            setAvatarLoading(true);
            const croppedImageBlob = await getCroppedImg(
                avatarPreview,
                croppedAreaPixels
            );

            // convert blob to file
            const file = new File([croppedImageBlob], 'avatar.jpg', { type: 'image/jpeg' });

            await uploadAvatar(file);
            setAvatarPreview(null);
            setIsCropping(false);
            setAvatarStatus({ type: 'success', msg: 'Profile picture updated!' });
        } catch (err) {
            setAvatarStatus({ type: 'error', msg: err?.response?.data?.message || err?.message || 'Upload failed.' });
        } finally {
            setAvatarLoading(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const handleCropCancel = () => {
        setAvatarPreview(null);
        setIsCropping(false);
        if (fileRef.current) fileRef.current.value = '';
    };

    const handleRemoveAvatar = async () => {
        setAvatarLoading(true);
        setAvatarStatus({ type: '', msg: '' });
        try {
            await removeAvatar();
            setAvatarStatus({ type: 'success', msg: 'Profile picture removed!' });
        } catch (err) {
            setAvatarStatus({ type: 'error', msg: err.response?.data?.message || 'Remove failed.' });
        } finally {
            setAvatarLoading(false);
        }
    };

    const handleProfileSave = async (e) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileStatus({ type: '', msg: '' });
        try {
            await updateProfile(profileForm);
            setProfileStatus({ type: 'success', msg: 'Profile updated successfully!' });
        } catch (err) {
            setProfileStatus({ type: 'error', msg: err.response?.data?.message || 'Update failed.' });
        } finally {
            setProfileLoading(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="p-5 sm:p-7 lg:p-8 max-w-2xl mx-auto space-y-5">
            <h1 className="text-2xl font-bold tracking-tight">Edit Profile</h1>

            {/* Cropping Modal */}
            {isCropping && avatarPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#12121a] border border-white/[0.08] rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
                            <h3 className="font-bold text-white text-[15px]">Crop Profile Picture</h3>
                            <button onClick={handleCropCancel} className="text-gray-400 hover:text-white transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="relative w-full h-80 bg-black">
                            <Cropper
                                image={avatarPreview}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="round"
                                showGrid={false}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        </div>

                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-[11px] text-gray-500 uppercase tracking-wider font-medium mb-2">Zoom</label>
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-labelledby="Zoom"
                                    onChange={(e) => setZoom(e.target.value)}
                                    className="w-full accent-violet-500"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleCropCancel}
                                    className="flex-1 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] text-white rounded-xl text-[13px] font-semibold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCropSave}
                                    disabled={avatarLoading}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-[13px] font-semibold transition-colors disabled:opacity-60"
                                >
                                    {avatarLoading ? <Spinner /> : null}
                                    {avatarLoading ? 'Saving...' : 'Crop & Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Avatar Card ──────────────────────────────────────────────── */}
            <Card title="Profile Picture" badge="optional">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* Preview */}
                    <div className="relative flex-shrink-0">
                        <img
                            src={avatarPreview || getOptimizedAvatar(user?.avatar)}
                            alt={user?.name}
                            className="w-24 h-24 rounded-2xl border-2 border-white/[0.08] object-cover shadow-xl"
                        />
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0a0a12] ${STATUS_DOT[user?.status] || 'bg-emerald-500'}`} />
                    </div>

                    <div className="flex-1 w-full space-y-3">
                        <div>
                            <p className="text-[13px] font-bold text-white">{user?.name || 'User'}</p>
                            <p className="text-[12px] text-gray-500">{user?.email}</p>
                            <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r ${roleColors[user?.role] || roleColors.Guest} uppercase tracking-wider`}>
                                {user?.role || 'Guest'}
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <label className="cursor-pointer px-4 py-2 text-[13px] font-semibold rounded-xl bg-white/[0.05] border border-white/[0.08] text-gray-300 hover:bg-white/[0.08] transition-all">
                                Choose Image
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </label>
                            {user?.avatar && !user.avatar.includes('149071.png') && (
                                <button
                                    type="button"
                                    onClick={handleRemoveAvatar}
                                    disabled={avatarLoading}
                                    className="px-4 py-2 text-[13px] font-semibold rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all disabled:opacity-60 border border-red-500/20"
                                >
                                    {avatarLoading ? 'Removing…' : 'Remove Picture'}
                                </button>
                            )}
                        </div>
                        <p className="text-[11px] text-gray-600">JPG, PNG or WebP · max 5 MB</p>
                        <Banner {...avatarStatus} />
                    </div>
                </div>
            </Card>

            {/* ── Edit Info Card ───────────────────────────────────────────── */}
            <Card title="Profile Info">
                <form onSubmit={handleProfileSave} className="space-y-4">
                    <Input
                        label="Full Name"
                        type="text"
                        value={profileForm.name}
                        onChange={e => setProfileForm(s => ({ ...s, name: e.target.value }))}
                        placeholder="Your name"
                        maxLength={50}
                    />

                    {/* Status selector */}
                    <div>
                        <label className="block text-[11px] text-gray-500 uppercase tracking-wider font-medium mb-1.5">
                            Status
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {STATUS_OPTIONS.map(s => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={async () => {
                                        setProfileForm(f => ({ ...f, status: s }));

                                        // 1. Instant Socket Sync
                                        const { socket } = useSocketStore.getState();
                                        if (socket?.connected) {
                                            socket.emit('setStatus', { status: s });
                                        }

                                        // 2. Instant Auth Store Sync (for Avatar Dot)
                                        useAuthStore.setState(state => ({
                                            user: state.user ? { ...state.user, status: s } : null
                                        }));

                                        // 3. Persist to DB immediately
                                        try {
                                            await useAuthStore.getState().updateStatus(s);
                                        } catch (err) {
                                            console.error('Failed to sync status to DB:', err);
                                        }
                                    }}
                                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] font-medium border transition-all ${profileForm.status === s
                                        ? 'bg-violet-500/10 border-violet-500/30 text-violet-300'
                                        : 'bg-white/[0.02] border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.05]'
                                        }`}
                                >
                                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_DOT[s]}`} />
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] text-gray-500 uppercase tracking-wider font-medium mb-1.5">
                            Custom Message <span className="normal-case text-gray-600">({profileForm.customMessage.length}/150)</span>
                        </label>
                        <textarea
                            value={profileForm.customMessage}
                            onChange={e => setProfileForm(s => ({ ...s, customMessage: e.target.value }))}
                            placeholder="e.g. In a meeting until 3pm…"
                            maxLength={150}
                            rows={2}
                            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-[14px] text-white placeholder-gray-600 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/10 transition-all resize-none"
                        />
                    </div>

                    <Banner {...profileStatus} />

                    <button
                        type="submit"
                        disabled={profileLoading}
                        className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-all disabled:opacity-60 shadow-lg shadow-violet-500/15"
                    >
                        {profileLoading ? <Spinner /> : null}
                        {profileLoading ? 'Saving…' : 'Save Changes'}
                    </button>
                </form>
            </Card>
        </div>
    );
};

export default Profile;
