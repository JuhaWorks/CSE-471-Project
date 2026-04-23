import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuthStore, api } from '../store/useAuthStore';
import { useSocketStore } from '../store/useSocketStore';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../components/profile/ProfileUtils';

// Modular Components
import ProfileBanner from '../components/profile/ProfileBanner';
import IdentityCard from '../components/profile/IdentityCard';
import ProgressionCard from '../components/profile/ProgressionCard';
import GeneralTab from '../components/profile/GeneralTab';
import ConsistencyMatrix from '../components/profile/ConsistencyMatrix';
import { CropModal, LevelUpCelebrationModal } from '../components/profile/ProfileModals';

// Utils
import getCroppedImg from '../utils/getCroppedImg';

export default function Profile() {
    const { user, uploadAvatar, uploadCoverImage, updateProfile, removeAvatar, updateStatus } = useAuthStore();
    const fileRef = useRef(null);
    const coverFileRef = useRef(null);

    // State
    const [preview, setPreview] = useState(null);
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedPx, setCroppedPx] = useState(null);
    const [cropping, setCropping] = useState(false);

    const [form, setForm] = useState({
        name: user?.name || '',
        status: user?.status || 'Online',
        location: user?.location || '',
        bio: user?.bio || '',
        skills: user?.skills || [],
    });
    const [skillInput, setSkillInput] = useState('');
    const [profileLoading, setProfileLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    // Heatmap Query
    const { data: heatmapData } = useQuery({
        queryKey: ['user-heatmap'],
        queryFn: async () => {
            const res = await api.get('/users/profile/heatmap');
            return res.data.data;
        }
    });

    // Level-up Celebration State
    const [celebrating, setCelebrating] = useState(null);
    const { socket } = useSocketStore();

    useEffect(() => {
        if (!socket) return;
        const handleLevelUp = (data) => {
            if (data.userId === user?._id) {
                setCelebrating(data);
            }
        };
        socket.on('gamification_update', handleLevelUp);
        return () => socket.off('gamification_update', handleLevelUp);
    }, [socket, user?._id]);

    // Handlers
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
            setPreview(null);
            setCropping(false);
        } catch (err) {
            console.error(err);
        } finally {
            setAvatarLoading(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const cancelCrop = () => {
        setPreview(null);
        setCropping(false);
        if (fileRef.current) fileRef.current.value = '';
    };

    const setStatus = async (s) => {
        setForm(f => ({ ...f, status: s }));
        const { socket } = useSocketStore.getState();
        if (socket?.connected) socket.emit('setStatus', { status: s });
        useAuthStore.setState(st => ({ user: st.user ? { ...st.user, status: s } : null }));
        try { await updateStatus(s); }
        catch (e) { console.error(e); }
    };

    const saveProfile = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        setProfileLoading(true);
        try {
            const dataToSave = e?.overrides ? { ...form, ...e.overrides } : form;
            await updateProfile(dataToSave);
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (err) {
            console.error(err);
        } finally {
            setProfileLoading(false);
        }
    };

    const handleCoverFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setProfileLoading(true);
        try {
            await uploadCoverImage(file);
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (err) {
            console.error(err);
        } finally {
            setProfileLoading(false);
            if (coverFileRef.current) coverFileRef.current.value = '';
        }
    };

    const handleCoverPrompt = () => {
        const url = prompt("Enter banner image URL:");
        if (url) {
            saveProfile({ 
                preventDefault: () => {}, 
                target: {},
                overrides: { coverImage: url }
            });
        }
    };

    return (
        <div className="flex flex-col gap-8 pb-20">
            
            <ProfileBanner 
                user={user}
                coverFileRef={coverFileRef}
                handleCoverFile={handleCoverFile}
                handleCoverPrompt={handleCoverPrompt}
            />

            <div className="w-full space-y-8">
                {/* Page Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-primary tracking-tighter uppercase">
                            Profile <span className="text-theme">Identity.</span>
                        </h1>
                        <p className="mt-1 text-[10px] font-black text-tertiary uppercase tracking-[0.3em]">
                            Manage your account details and preferences.
                        </p>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-default" />

                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
                    {/* Left Column */}
                    <div className="space-y-4">
                        <IdentityCard 
                            user={user}
                            status={form.status}
                            fileRef={fileRef}
                            onFile={onFile}
                            removeAvatar={removeAvatar}
                        />
                        <ProgressionCard user={user} />
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        <AnimatePresence mode="wait">
                            <motion.div 
                                key="profile-tab"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-6"
                            >
                                <GeneralTab 
                                    user={user}
                                    form={form}
                                    setForm={setForm}
                                    skillInput={skillInput}
                                    setSkillInput={setSkillInput}
                                    setStatus={setStatus}
                                    saveProfile={saveProfile}
                                    profileLoading={profileLoading}
                                    saved={saved}
                                />
                                <ConsistencyMatrix heatmapData={heatmapData} />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <CropModal 
                cropping={cropping}
                preview={preview}
                crop={crop}
                setCrop={setCrop}
                zoom={zoom}
                setZoom={setZoom}
                onCropComplete={onCropComplete}
                cancelCrop={cancelCrop}
                saveCrop={saveCrop}
                avatarLoading={avatarLoading}
            />
            
            <LevelUpCelebrationModal 
                celebrating={celebrating}
                setCelebrating={setCelebrating}
            />
        </div>
    );
}