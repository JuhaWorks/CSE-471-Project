import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api, useAuthStore } from '../store/useAuthStore';
import { CheckCircle, XCircle } from 'lucide-react';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    const { checkAuth } = useAuthStore();

    const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link.');
            return;
        }

        const verifyToken = async () => {
            try {
                const response = await api.get(`/auth/verify-email/${token}`);
                setStatus('success');
                setMessage(response.data.message || 'Email verified successfully!');
                // Reload user state quietly
                await checkAuth();

                // Redirect user to dashboard shorty
                setTimeout(() => navigate('/'), 3000);
            } catch (error) {
                setStatus('error');
                setMessage(error?.response?.data?.message || 'Verification failed. The link may have expired.');
            }
        };

        verifyToken();
    }, [token, navigate, checkAuth]);

    return (
        <div className="min-h-screen bg-[#060612] flex items-center justify-center p-4 text-[#eeeeff] font-sans">
            <div className="bg-[#08081e] border border-[rgba(255,255,255,0.06)] shadow-2xl rounded-2xl p-8 max-w-md w-full text-center flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                {status === 'loading' && (
                    <div className="w-16 h-16 rounded-2xl bg-[rgba(123,82,255,0.1)] border border-[rgba(123,82,255,0.2)] flex items-center justify-center mb-6">
                        <span className="w-8 h-8 rounded-full border-[3px] border-[#7B52FF]/30 border-t-[#7B52FF] animate-spin"></span>
                    </div>
                )}

                {status === 'success' && (
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-500">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                )}

                {status === 'error' && (
                    <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 text-red-500">
                        <XCircle className="w-8 h-8" />
                    </div>
                )}

                <h2 className="text-2xl font-bold mb-3 tracking-tight text-white">
                    {status === 'loading' ? 'Verifying...' : status === 'success' ? 'Verified!' : 'Verification Failed'}
                </h2>

                <p className="text-[#8888aa] text-sm leading-relaxed mb-8">
                    {message}
                </p>

                {status === 'success' ? (
                    <p className="text-xs text-[#44445a]">Redirecting to your workspace...</p>
                ) : (
                    <Link
                        to="/"
                        className="w-full py-3 px-4 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.1)] text-white font-semibold rounded-xl transition-all flex items-center justify-center"
                    >
                        Go back home
                    </Link>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
