import { useState, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useSocketStore } from '../store/useSocketStore';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/getCroppedImg';
import { 
    User, 
    Mail, 
    Shield, 
    Camera, 
    Trash2, 
    Check, 
    X, 
    Settings, 
    Activity, 
    MessageSquare, 
    Zap,
    ShieldCheck,
    LogOut,
    Eye,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';


const STATUSES = ['Online', 'Away', 'Do Not Disturb', 'Offline'];
const STATUS_CONFIG = {
    Online: { color: 'bg-emerald-500', shadow: 'shadow-emerald-500/40', text: 'text-emerald-400' },
    Away: { color: 'bg-amber-500', shadow: 'shadow-amber-500/40', text: 'text-amber-400' },
    'Do Not Disturb': { color: 'bg-rose-500', shadow: 'shadow-rose-500/40', text: 'text-rose-400' },
    Offline: { color: 'bg-gray-600', shadow: 'shadow-gray-500/40', text: 'text-gray-400' }
};

const ROLE_GRADIENT = {
    Admin: 'from-rose-500 to-orange-500',
    Manager: 'from-cyan-500 to-blue-600',
    Developer: 'from-emerald-500 to-cyan-500',
    Guest: 'from-gray-500 to-gray-700',
};

/**
 * Modern 2026 Profile Page
 * High-fidelity identity management with Glassmorphism 2.0
 */
export default function Profile() {
    const { user, uploadAvatar, updateProfile, removeAvatar } = useAuthStore();
    const fileRef = useRef(null);

    const [preview, setPreview] = useState(null);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedPx, setCroppedPx] = useState(null);
    const [cropping, setCropping] = useState(false);

    const [form, setForm] = useState({
        name: user?.name || '', status: user?.status || 'Online', customMessage: user?.customMessage || '',
    });
    const [profileLoading, setProfileLoading] = useState(false);

    const onFile = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        setPreview(URL.createObjectURL(f));
        setCropping(true);
    };

    const onCropComplete = useCallback((_, px) => setCroppedPx(px), []);

    const saveCrop = async () => {
        try {
            setAvatarLoading(true);
            const blob = await getCroppedImg(preview, croppedPx);
            await uploadAvatar(new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));
            setPreview(null); setCropping(false);
        } catch (err) {
            console.error(err);
        } finally {
            setAvatarLoading(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const cancelCrop = () => { setPreview(null); setCropping(false); if (fileRef.current) fileRef.current.value = ''; };

    const setStatus = async (s) => {
        setForm(f => ({ ...f, status: s }));
        const { socket } = useSocketStore.getState();
        if (socket?.connected) socket.emit('setStatus', { status: s });
        useAuthStore.setState(st => ({ user: st.user ? { ...st.user, status: s } : null }));
        try { await useAuthStore.getState().updateStatus(s); } catch (e) { console.error(e); }
    };

    const saveProfile = async (e) => {
        e.preventDefault();
        setProfileLoading(true);
        try { await updateProfile(form); }
        catch (err) { console.error(err); }
        finally { setProfileLoading(false); }
    };

    return (
        <div className="min-h-screen pb-20 pt-8 px-6 lg:px-10 space-y-10 max-w-5xl mx-auto">
            {/* Cinematic Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-cyan-400 font-black text-[10px] uppercase tracking-[0.4em]">
                        <User className="w-4 h-4" />
                        <span>Identity Node</span>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-6xl font-black text-[var(--text-main)] tracking-tighter leading-none">
                            Agent <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Profile.</span>
                        </h1>
                        <p className="text-gray-500 font-medium text-lg max-w-xl">
                            Configure your platform avatar, neural status identifiers, and operational clearance parameters.
                        </p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Visual Identity Column */}
                <div className="space-y-8">
                    <Card className="overflow-hidden relative group" padding="p-8">
                        <div className="flex flex-col items-center text-center gap-6">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-[2.5rem] bg-[var(--bg-surface)] border-2 border-white/10 p-1 overflow-hidden shadow-2xl group-hover:border-cyan-500/30 transition-all duration-500">
                                    <img 
                                        src={user?.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                                        alt={user?.name}
                                        className="w-full h-full object-cover rounded-[2.25rem]"
                                    />
                                </div>
                                <div className={twMerge(clsx(
                                    "absolute bottom-1 right-1 w-6 h-6 rounded-xl border-4 border-[var(--bg-base)] z-10 shadow-xl",
                                    STATUS_CONFIG[user?.status]?.color,
                                    STATUS_CONFIG[user?.status]?.shadow
                                ))} />
                                <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm">
                                    <Camera className="w-8 h-8 text-white" />
                                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
                                </label>
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight">{user?.name}</h2>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-[0.2em]">{user?.email}</p>
                                <div className={twMerge(clsx(
                                    "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black text-white bg-gradient-to-r shadow-xl uppercase tracking-widest mt-2",
                                    ROLE_GRADIENT[user?.role] || ROLE_GRADIENT.Guest
                                ))}>
                                    <ShieldCheck className="w-3 h-3" />
                                    {user?.role} Protocol
                                </div>
                            </div>

                            <div className="w-full pt-4 border-t border-white/5 flex flex-col gap-3">
                                <Button 
                                    variant="outline" 
                                    className="w-full flex items-center justify-between group/btn"
                                    onClick={() => fileRef.current.click()}
                                >
                                    <span>Uplink Visual Asset</span>
                                    <Camera className="w-4 h-4 text-gray-700 group-hover/btn:text-cyan-400 transition-colors" />
                                </Button>
                                {user?.avatar && !user.avatar.includes('149071.png') && (
                                    <button 
                                        onClick={removeAvatar}
                                        className="text-[10px] font-black text-red-500/60 uppercase tracking-widest hover:text-red-400 transition-colors"
                                    >
                                        Purge Profile Image
                                    </button>
                                )}
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-cyan-500/5 border-cyan-500/10" padding="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                                <Zap className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Neural Link</span>
                                <span className="text-xs font-black text-cyan-400">Fully Synchronized</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Configuration Column */}
                <div className="lg:col-span-2 space-y-8">
                    <Card padding="p-0" className="overflow-hidden">
                        <div className="px-10 py-6 border-b border-white/5 flex items-center gap-3">
                            <Settings className="w-4 h-4 text-gray-600" />
                            <h3 className="text-xs font-black text-[var(--text-main)] uppercase tracking-[0.3em]">Core Synchronization</h3>
                        </div>
                        <form onSubmit={saveProfile} className="p-10 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Full Identifier (Name)</label>
                                    <div className="relative group">
                                        <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700 group-focus-within:text-cyan-400 transition-colors" />
                                        <input 
                                            type="text" 
                                            value={form.name}
                                            onChange={e => setForm(s => ({ ...s, name: e.target.value }))}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-[var(--text-main)] focus:outline-none focus:border-cyan-500/30 focus:ring-8 focus:ring-cyan-500/5 transition-all font-medium text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Universal Access (Email)</label>
                                    <div className="relative group opacity-50 cursor-not-allowed">
                                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
                                        <input 
                                            disabled
                                            value={user?.email}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-[var(--text-main)] cursor-not-allowed font-medium text-sm opacity-60"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Neural Presence Status</label>
                                    <span className="text-[9px] font-black text-cyan-400 tracking-widest uppercase flex items-center gap-2">
                                        <Activity className="w-3 h-3" />
                                        Real-time Broadcast
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {STATUSES.map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setStatus(s)}
                                            className={twMerge(clsx(
                                                "flex items-center gap-3 px-4 py-4 rounded-2xl border transition-all relative group overflow-hidden",
                                                form.status === s 
                                                    ? "bg-white text-black border-white shadow-2xl" 
                                                    : "bg-white/5 border-white/5 text-gray-500 hover:border-white/10 hover:text-gray-300"
                                            ))}
                                        >
                                            <div className={twMerge(clsx(
                                                "w-2 h-2 rounded-full shrink-0 shadow-[0_0_8px_rgba(255,255,255,0.4)]",
                                                STATUS_CONFIG[s].color
                                            ))} />
                                            <span className="text-[10px] font-black uppercase tracking-widest relative z-10">{s}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Custom Directive (Status Message)</label>
                                    <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">
                                        {form.customMessage.length} / 150
                                    </span>
                                </div>
                                <div className="relative group">
                                    <MessageSquare className="absolute left-5 top-5 w-4 h-4 text-gray-700 group-focus-within:text-cyan-400 transition-colors" />
                                    <textarea 
                                        rows={3}
                                        value={form.customMessage}
                                        onChange={e => setForm(s => ({ ...s, customMessage: e.target.value }))}
                                        placeholder="Broadcast a directive to your team segments..."
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 py-5 text-white focus:outline-none focus:border-cyan-500/30 focus:ring-8 focus:ring-cyan-500/5 transition-all font-medium text-sm resize-none"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-between">
                                <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest max-w-[200px] leading-relaxed">
                                    Operational parameters are synchronized across all neural links globally.
                                </p>
                                <Button
                                    type="submit"
                                    isLoading={profileLoading}
                                    disabled={profileLoading}
                                    className="px-12 py-5 rounded-2xl"
                                >
                                    Synchronize Changes
                                </Button>
                            </div>
                        </form>
                    </Card>

                    {/* Account Protocols (Mock for UI) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card padding="p-6" className="group cursor-pointer hover:border-white/10 transition-all">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                        <Eye className="w-4 h-4 text-gray-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-white uppercase tracking-widest">Privacy Controls</span>
                                        <span className="text-[10px] text-gray-600 font-medium">Neural visibility settings</span>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-800 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                            </div>
                        </Card>
                        <Card padding="p-6" className="group cursor-pointer hover:border-red-500/20 transition-all">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-red-500/5 flex items-center justify-center">
                                        <LogOut className="w-4 h-4 text-red-500/60" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-red-500/80 uppercase tracking-widest">Session Terminate</span>
                                        <span className="text-[10px] text-gray-600 font-medium">Clear all local neural caches</span>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-800 group-hover:text-red-400 transition-all transform group-hover:translate-x-1" />
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Crop Protocol Modal */}
            <AnimatePresence>
                {cropping && preview && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-10"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#09090b] border border-white/10 rounded-[3rem] w-full max-w-lg overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)]"
                        >
                            <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-white tracking-tighter">Visual Crop Protocol.</h3>
                                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em]">Calibrating Identity Node</p>
                                </div>
                                <button onClick={cancelCrop} className="p-3 bg-white/5 rounded-2xl text-gray-500 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="relative w-full h-80 bg-black">
                                <Cropper 
                                    image={preview} 
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

                            <div className="p-10 space-y-8">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                        <span>Optical Zoom</span>
                                        <span className="text-cyan-400">{parseFloat(zoom).toFixed(1)}x</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        value={zoom} 
                                        min={1} 
                                        max={3} 
                                        step={0.1} 
                                        className="w-full accent-white h-2 bg-white/5 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                                        onChange={e => setZoom(e.target.value)} 
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <Button variant="outline" onClick={cancelCrop} className="flex-1 py-5 rounded-2xl">Abort</Button>
                                    <Button 
                                        onClick={saveCrop} 
                                        isLoading={avatarLoading}
                                        className="flex-1 py-5 rounded-2xl bg-cyan-600 hover:bg-cyan-500"
                                    >
                                        Execute Crop
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}