import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,700;1,9..144,300&family=DM+Sans:wght@300;400;500;600;700;800;900&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
        --v: #7B52FF; --b: #2563EB;
        --bg: #060612; --panel: #08081e; --card: rgba(255,255,255,0.022);
        --border: rgba(255,255,255,0.06); --border-h: rgba(255,255,255,0.12); --border-f: rgba(123,82,255,0.5);
        --t1: #eeeeff; --t2: #8888aa; --t3: #44445a; --err: #ff6b75;
        --r: 13px; --ff: 'DM Sans', system-ui, sans-serif; --ffd: 'Fraunces', Georgia, serif;
    }

    @keyframes kFadeUp  { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
    @keyframes kFadeIn  { from { opacity:0 } to { opacity:1 } }
    @keyframes kSlideIn { from { opacity:0; transform:translateX(-20px) } to { opacity:1; transform:translateX(0) } }
    @keyframes kModalIn { from { opacity:0; transform:scale(.93) translateY(10px) } to { opacity:1; transform:none } }
    @keyframes kSpin    { to { transform:rotate(360deg) } }
    @keyframes kOrb     { 0%,100% { transform:translate(0,0) scale(1) } 40% { transform:translate(28px,-18px) scale(1.04) } 75% { transform:translate(-18px,14px) scale(.97) } }
    @keyframes kFloat   { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-5px) } }
    @keyframes kGrow    { from { transform:scaleX(0) } to { transform:scaleX(1) } }
    @keyframes kShimmer { 0% { background-position:-200% center } 100% { background-position:200% center } }
    @keyframes kChipIn  { from { opacity:0; transform:translateY(6px) scale(.96) } to { opacity:1; transform:none } }

    .au { animation: kFadeUp  .55s cubic-bezier(.22,1,.36,1) both }
    .as { animation: kSlideIn .5s  cubic-bezier(.22,1,.36,1) both }
    .af { animation: kFadeIn  .4s  ease both }
    .d0 { animation-delay:0ms }   .d1 { animation-delay:70ms }  .d2 { animation-delay:140ms }
    .d3 { animation-delay:210ms } .d4 { animation-delay:280ms } .d5 { animation-delay:350ms }
    .d6 { animation-delay:420ms } .d7 { animation-delay:490ms }

    /* ── Layout ── */
    .root { min-height:100vh; display:flex; font-family:var(--ff); background:var(--bg); color:var(--t1); -webkit-font-smoothing:antialiased; overflow:hidden; }

    /* ── Brand panel ── */
    .brand { display:none; position:relative; overflow:hidden; flex-direction:column; justify-content:space-between; padding:3.5rem; background:var(--panel); }
    @media(min-width:1024px) { .brand { display:flex; width:43%; } }

    .orb { position:absolute; border-radius:50%; filter:blur(80px); pointer-events:none; }
    .orb-a { width:440px; height:440px; background:rgba(123,82,255,.11); top:-100px; left:-80px; animation:kOrb 19s ease-in-out infinite; }
    .orb-b { width:300px; height:300px; background:rgba(37,99,235,.09); bottom:40px; right:-60px; animation:kOrb 23s ease-in-out -7s infinite; }
    .orb-c { width:180px; height:180px; background:rgba(123,82,255,.06); top:55%; left:35%; animation:kOrb 17s ease-in-out -4s infinite; }

    .grid-bg {
        position:absolute; inset:0; opacity:.018;
        background-image: linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px);
        background-size: 50px 50px;
    }
    .vignette { position:absolute; inset:0; background:radial-gradient(ellipse at center, transparent 40%, rgba(8,8,30,.6)); }
    .brand-rule { height:1px; background:linear-gradient(90deg,transparent,var(--border) 30%,var(--border) 70%,transparent); transform-origin:left; animation:kGrow .9s cubic-bezier(.22,1,.36,1) .5s both; margin-bottom:1.5rem; }

    .chip { display:flex; align-items:center; gap:10px; padding:9px 13px; border-radius:11px; background:rgba(255,255,255,.025); border:1px solid var(--border); transition:border-color .25s, background .25s, transform .25s; cursor:default; animation:kChipIn .5s cubic-bezier(.22,1,.36,1) both; }
    .chip:hover { border-color:rgba(123,82,255,.28); background:rgba(123,82,255,.07); transform:translateY(-2px); }
    .chip-icon { width:28px; height:28px; border-radius:8px; flex-shrink:0; background:rgba(123,82,255,.14); border:1px solid rgba(123,82,255,.22); display:flex; align-items:center; justify-content:center; font-size:12px; }

    .avatar { width:32px; height:32px; border-radius:50%; flex-shrink:0; background:linear-gradient(135deg,var(--v),var(--b)); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; color:#fff; animation:kFloat 4.5s ease-in-out infinite; }

    /* ── Form panel ── */
    .form-panel { flex:1; display:flex; align-items:center; justify-content:center; padding:3rem 1.5rem; position:relative; overflow:hidden; }
    @media(min-width:640px)  { .form-panel { padding:4rem 3rem; } }
    @media(min-width:1280px) { .form-panel { padding:5rem; } }
    .form-inner { width:100%; max-width:390px; position:relative; z-index:1; }
    .glow-a { position:absolute; border-radius:50%; pointer-events:none; filter:blur(110px); }

    /* ── Logo ── */
    .logo { border-radius:14px; background:linear-gradient(135deg,var(--v),var(--b)); display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 8px 30px rgba(123,82,255,.32); transition:transform .3s cubic-bezier(.34,1.56,.64,1), box-shadow .3s; cursor:default; }
    .logo:hover { transform:scale(1.08) rotate(-2deg); box-shadow:0 14px 44px rgba(123,82,255,.46); }
    .logo span { font-weight:900; color:#fff; line-height:1; font-size:inherit; }
    .logo-sm { width:36px; height:36px; }
    .logo-md { width:48px; height:48px; }

    /* ── Card ── */
    .card { background:var(--card); backdrop-filter:blur(28px); border:1px solid var(--border); border-radius:20px; padding:26px; box-shadow:0 0 0 .5px rgba(255,255,255,.025) inset, 0 24px 80px rgba(0,0,0,.38), 0 4px 16px rgba(0,0,0,.18); transition:border-color .4s; }
    .card:focus-within { border-color:rgba(123,82,255,.16); }

    /* ── Field ── */
    .field { display:flex; flex-direction:column; gap:6px; }
    .flabel { font-size:11px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:var(--t2); }
    .fwrap  { position:relative; }
    .finput {
        width:100%; padding:11px 15px; border-radius:var(--r);
        background:rgba(255,255,255,.03); border:1px solid var(--border);
        color:var(--t1); font-family:var(--ff); font-size:14px; font-weight:500;
        outline:none; -webkit-appearance:none;
        transition:border-color .2s, box-shadow .2s, background .2s;
    }
    .finput::placeholder { color:var(--t3); }
    .finput:hover  { border-color:var(--border-h); background:rgba(255,255,255,.04); }
    .finput:focus  { border-color:var(--border-f); box-shadow:0 0 0 3px rgba(123,82,255,.13); background:rgba(255,255,255,.05); }
    .finput.has-r  { padding-right:44px; }
    .finput.err    { border-color:rgba(255,107,117,.4); }
    .finput.err:focus { border-color:rgba(255,107,117,.65); box-shadow:0 0 0 3px rgba(255,107,117,.1); }
    .fright { position:absolute; right:10px; top:50%; transform:translateY(-50%); }
    .ferr   { display:flex; align-items:center; gap:5px; font-size:11px; font-weight:500; color:var(--err); animation:kFadeUp .2s ease both; }

    /* ── Icon button ── */
    .ibtn { padding:6px; border-radius:8px; background:transparent; border:none; cursor:pointer; color:var(--t3); transition:color .2s, background .2s; display:flex; align-items:center; justify-content:center; }
    .ibtn:hover { color:var(--t2); background:rgba(255,255,255,.05); }

    /* ── Error banner ── */
    .err-banner { display:flex; align-items:flex-start; gap:10px; padding:12px 13px; border-radius:12px; background:rgba(255,107,117,.07); border:1px solid rgba(255,107,117,.18); color:#ff9999; animation:kFadeUp .3s cubic-bezier(.22,1,.36,1) both; }

    /* ── Submit button ── */
    .sbtn { width:100%; padding:12px; border-radius:var(--r); font-family:var(--ff); font-size:14px; font-weight:700; cursor:pointer; border:none; outline:none; display:flex; align-items:center; justify-content:center; gap:8px; transition:opacity .2s, transform .15s, box-shadow .2s; position:relative; overflow:hidden; }
    .sbtn.on { background:linear-gradient(135deg, var(--v) 0%, #5c3de8 45%, var(--b) 100%); color:#fff; box-shadow:0 8px 30px rgba(123,82,255,.32), 0 2px 8px rgba(0,0,0,.2); }
    .sbtn.on::after { content:''; position:absolute; inset:0; background:linear-gradient(105deg, transparent 30%, rgba(255,255,255,.13) 50%, transparent 70%); background-size:200% auto; opacity:0; transition:opacity .3s; }
    .sbtn.on:hover { opacity:.9; box-shadow:0 12px 40px rgba(123,82,255,.42); }
    .sbtn.on:hover::after { opacity:1; animation:kShimmer 1.6s linear infinite; }
    .sbtn.on:active { transform:scale(.985); }
    .sbtn.off { background:rgba(255,255,255,.04); color:var(--t3); cursor:not-allowed; border:1px solid var(--border); }

    /* ── Spinner ── */
    .spin { width:14px; height:14px; border-radius:50%; border:2px solid rgba(255,255,255,.22); border-top-color:#fff; animation:kSpin .65s linear infinite; flex-shrink:0; }

    /* ── OAuth ── */
    .divider { display:flex; align-items:center; gap:12px; }
    .dline   { flex:1; height:1px; background:var(--border); }
    .dlabel  { font-size:11px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; color:var(--t3); }
    .obtn { display:flex; align-items:center; justify-content:center; gap:9px; padding:10px 15px; border-radius:11px; font-family:var(--ff); font-size:13px; font-weight:600; text-decoration:none; transition:transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s, background .2s; }
    .obtn:active { transform:scale(.97) !important; }
    .og { background:#fff; color:#3a3a55; box-shadow:0 1px 4px rgba(0,0,0,.1); }
    .og:hover { background:#f4f4ff; box-shadow:0 4px 16px rgba(0,0,0,.12); transform:translateY(-2px); }
    .gh { background:#161b22; color:#fff; border:1px solid rgba(255,255,255,.08); }
    .gh:hover { background:#1c2430; box-shadow:0 4px 16px rgba(0,0,0,.3); transform:translateY(-2px); }

    /* ── Checkbox ── */
    .cbox { width:15px; height:15px; border-radius:5px; border:1px solid rgba(255,255,255,.11); background:rgba(255,255,255,.03); display:flex; align-items:center; justify-content:center; transition:border-color .2s, background .2s; flex-shrink:0; }
    .clabel { display:flex; align-items:center; gap:8px; cursor:pointer; }
    .clabel:hover .cbox { border-color:rgba(123,82,255,.4); background:rgba(123,82,255,.07); }

    /* ── Modal ── */
    .modal-wrap { position:fixed; inset:0; z-index:50; display:flex; align-items:center; justify-content:center; padding:1rem; }
    .modal-bg   { position:fixed; inset:0; background:rgba(0,0,0,.65); backdrop-filter:blur(8px); animation:kFadeIn .25s ease both; }
    .modal-box  { position:relative; width:100%; max-width:350px; background:#0e0e2a; border:1px solid rgba(255,255,255,.09); border-radius:20px; padding:24px; box-shadow:0 32px 100px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.02) inset; animation:kModalIn .35s cubic-bezier(.22,1,.36,1) both; }
    .modal-icon { width:42px; height:42px; border-radius:12px; background:rgba(251,191,36,.1); border:1px solid rgba(251,191,36,.22); display:flex; align-items:center; justify-content:center; margin-bottom:14px; }

    /* ── Utility ── */
    .row  { display:flex; align-items:center; justify-content:space-between; }
    .col  { display:flex; flex-direction:column; }
    .g8   { gap:8px; }  .g10 { gap:10px; }  .g16 { gap:16px; }  .g18 { gap:18px; }
    .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .z1     { position:relative; z-index:1; }
    .serif  { font-family:var(--ffd); }
    .grad   { background:linear-gradient(120deg,#b39dff,#7c9fff); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
    .link-v { color:#9b7fff; font-weight:600; text-decoration:none; transition:color .2s; } .link-v:hover { color:#bcaaff; }
    .link-s { color:var(--t2); text-decoration:underline; text-underline-offset:2px; transition:color .2s; } .link-s:hover { color:var(--t1); }
    .forgot { background:none; border:none; font-family:var(--ff); font-size:12px; font-weight:600; color:var(--t3); cursor:pointer; padding:0; transition:color .2s; } .forgot:hover { color:#9b7fff; }
    .footer-row { text-align:center; font-size:11px; color:var(--t3); line-height:1.7; margin-top:14px; }
    .mobile-logo { display:flex; align-items:center; gap:12px; margin-bottom:2.5rem; }
    @media(min-width:1024px) { .mobile-logo { display:none; } }
`;

const GlobalStyles = () => {
    useEffect(() => {
        const el = document.createElement('style');
        el.id = 'klivra-login-styles';
        el.textContent = STYLES;
        document.head.appendChild(el);
        return () => el.remove();
    }, []);
    return null;
};

// ══════════════════════════════════════════════════════════════════════════════
// § VALIDATION
// ══════════════════════════════════════════════════════════════════════════════

const loginSchema = z.object({
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    rememberMe: z.boolean().optional(),
});

// ══════════════════════════════════════════════════════════════════════════════
// § STATIC CONFIG
// ══════════════════════════════════════════════════════════════════════════════

const FEATURES = [
    { icon: '⚡', label: 'Real-time Sync', d: 'd2' },
    { icon: '◫', label: 'Kanban Boards', d: 'd3' },
    { icon: '◻', label: 'Whiteboards', d: 'd4' },
    { icon: '⬡', label: 'End-to-End Secure', d: 'd5' },
];

const OAUTH_PROVIDERS = [
    {
        key: 'google', label: 'Google', cls: 'og', path: '/api/auth/google',
        icon: (
            <svg width="17" height="17" viewBox="0 0 24 24">
                <g transform="matrix(1,0,0,1,27.009,-39.239)">
                    <path fill="#4285F4" d="M-3.264 51.509c0-.79-.07-1.54-.19-2.27H-14.754v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
                    <path fill="#34A853" d="M-14.754 63.239c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96l-3.98 3.09c1.97 3.92 6.02 6.62 10.71 6.62z" />
                    <path fill="#FBBC05" d="M-21.484 53.529c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.28v-3.09h-3.98c-.82 1.62-1.29 3.44-1.29 5.37s.47 3.75 1.29 5.37l3.98-3.08z" />
                    <path fill="#EA4335" d="M-14.754 43.989c1.77 0 3.35.61 4.6 1.8l3.42-3.42c-2.07-1.94-4.78-3.13-8.02-3.13-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
                </g>
            </svg>
        ),
    },
    {
        key: 'github', label: 'GitHub', cls: 'gh', path: '/api/auth/github',
        icon: (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
        ),
    },
];

// ══════════════════════════════════════════════════════════════════════════════
// § ICON ATOMS
// ══════════════════════════════════════════════════════════════════════════════

const AlertIcon = ({ size = 15 }) => (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);

const XIcon = ({ size = 13 }) => (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M18 6L6 18M6 6l12 12" />
    </svg>
);

const EyeIcon = ({ open }) => (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {open
            ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
            : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
        }
    </svg>
);

const WarnIcon = () => (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

// ══════════════════════════════════════════════════════════════════════════════
// § PRIMITIVES
// ══════════════════════════════════════════════════════════════════════════════

const Spinner = () => <div className="spin" aria-hidden="true" />;

const Logo = ({ size = 'md' }) => (
    <div className={`logo logo-${size}`} style={{ fontSize: size === 'sm' ? 15 : 22 }}>
        <span>K</span>
    </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// § FORM PRIMITIVES
// ══════════════════════════════════════════════════════════════════════════════

const PasswordToggle = ({ show, onToggle }) => (
    <button type="button" className="ibtn" onClick={onToggle} tabIndex={-1} aria-label={show ? 'Hide password' : 'Show password'}>
        <EyeIcon open={show} />
    </button>
);

const InputField = ({ id, label, type = 'text', placeholder, register, error, autoComplete, rightElement, delay = 'd0' }) => (
    <div className={`field au ${delay}`}>
        <label htmlFor={id} className="flabel">{label}</label>
        <div className="fwrap">
            <input
                id={id} type={type} autoComplete={autoComplete} placeholder={placeholder}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? `${id}-err` : undefined}
                {...register}
                className={['finput', rightElement ? 'has-r' : '', error ? 'err' : ''].filter(Boolean).join(' ')}
            />
            {rightElement && <div className="fright">{rightElement}</div>}
        </div>
        {error && (
            <p id={`${id}-err`} role="alert" className="ferr">
                <AlertIcon size={12} />{error.message}
            </p>
        )}
    </div>
);

const ErrorBanner = ({ message, onDismiss }) => (
    <div role="alert" className="err-banner au d0">
        <AlertIcon size={14} style={{ marginTop: 1 }} />
        <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{message}</span>
        <button className="ibtn" onClick={onDismiss} aria-label="Dismiss" style={{ padding: 4 }}><XIcon /></button>
    </div>
);

const SubmitButton = ({ isLoading, isValid, isModalOpen }) => {
    const loading = isLoading && !isModalOpen;
    const disabled = isLoading || !isValid;
    return (
        <button type="submit" disabled={disabled} className={`sbtn ${disabled ? 'off' : 'on'}`}>
            {loading ? <><Spinner />Signing in…</> : 'Sign In'}
        </button>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
// § OAUTH SECTION
// ══════════════════════════════════════════════════════════════════════════════

const OAuthDivider = () => (
    <div className="divider">
        <div className="dline" /><span className="dlabel">or continue with</span><div className="dline" />
    </div>
);

const OAuthButton = ({ href, label, icon, cls }) => (
    <a href={href} className={`obtn ${cls}`}>{icon}{label}</a>
);

const OAuthSection = ({ apiUrl }) => (
    <div className="col g16 au d7">
        <OAuthDivider />
        <div className="grid-2">
            {OAUTH_PROVIDERS.map(({ key, label, cls, path, icon }) => (
                <OAuthButton key={key} href={`${apiUrl}${path}`} label={label} icon={icon} cls={cls} />
            ))}
        </div>
    </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// § REACTIVATION MODAL
// ══════════════════════════════════════════════════════════════════════════════

const ReactivationModal = ({ isOpen, isLoading, onConfirm, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="modal-wrap" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal-bg" onClick={onClose} aria-hidden="true" />
            <div className="modal-box">
                <div className="modal-icon"><WarnIcon /></div>
                <h3 id="modal-title" style={{ fontSize: 16, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-.02em', marginBottom: 8 }}>
                    Account Deactivated
                </h3>
                <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.65 }}>
                    Your account is currently deactivated. Reactivate now to restore access to your workspace and all projects.
                </p>
                <div className="row g10" style={{ marginTop: 20 }}>
                    <button
                        onClick={onClose} disabled={isLoading}
                        style={{ flex: 1, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: 'DM Sans,sans-serif', cursor: 'pointer', background: 'rgba(255,255,255,.04)', border: '1px solid var(--border)', color: 'var(--t2)', transition: 'all .2s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.08)'; e.currentTarget.style.color = 'var(--t1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.04)'; e.currentTarget.style.color = 'var(--t2)'; }}
                    >Cancel</button>
                    <button onClick={onConfirm} disabled={isLoading} className="sbtn on" style={{ flex: 1, padding: '10px', fontSize: 13 }}>
                        {isLoading ? <><Spinner />Reactivating…</> : 'Reactivate & Sign In'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
// § BRAND PANEL
// ══════════════════════════════════════════════════════════════════════════════

const BrandPanel = () => (
    <aside className="brand">
        <div className="orb orb-a" /><div className="orb orb-b" /><div className="orb orb-c" />
        <div className="grid-bg" /><div className="vignette" />

        <div className="row g10 z1 as d0">
            <Logo size="md" />
            <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: '-.03em', flex: 1 }}>Klivra</span>
        </div>

        <div className="col z1" style={{ flex: 1, justifyContent: 'center', paddingBlock: '3rem' }}>
            <p className="au d1" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--v)', marginBottom: 18 }}>
                Enterprise Collaboration
            </p>
            <h2 className="serif au d2" style={{ fontSize: 'clamp(1.9rem,3.2vw,2.75rem)', fontWeight: 700, color: 'var(--t1)', lineHeight: 1.08, marginBottom: 18 }}>
                Build great things,<br />
                <span className="grad">together.</span>
            </h2>
            <p className="au d3" style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.7, maxWidth: 275, marginBottom: 28 }}>
                Real-time collaboration for teams that move fast and ship extraordinary products.
            </p>
            <div className="grid-2">
                {FEATURES.map(({ icon, label, d }) => (
                    <div key={label} className={`chip au ${d}`}>
                        <div className="chip-icon">{icon}</div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>{label}</span>
                    </div>
                ))}
            </div>
        </div>
    </aside>
);

// ══════════════════════════════════════════════════════════════════════════════
// § LOGIN FORM
// ══════════════════════════════════════════════════════════════════════════════

const LoginForm = ({ onSubmit, isLoading, error, clearError, isModalOpen }) => {
    const [showPass, setShowPass] = useState(false);
    const togglePass = useCallback(() => setShowPass(v => !v), []);

    const { register, handleSubmit, watch, formState: { errors, isValid } } = useForm({
        resolver: zodResolver(loginSchema),
        mode: 'onChange',
        defaultValues: { rememberMe: false },
    });

    const rememberMe = watch('rememberMe');

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="col g18">
            {error && <ErrorBanner message={error} onDismiss={clearError} />}

            <InputField
                id="email" label="Email address" type="email"
                placeholder="name@company.com" autoComplete="email"
                register={register('email')} error={errors.email} delay="d2"
            />
            <InputField
                id="password" label="Password"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••••" autoComplete="current-password"
                register={register('password')} error={errors.password}
                rightElement={<PasswordToggle show={showPass} onToggle={togglePass} />}
                delay="d3"
            />

            <div className="row au d4">
                <label className="clabel">
                    <div className="cbox">
                        <input type="checkbox" {...register('rememberMe')} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} />
                        {rememberMe && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        )}
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 500 }}>Remember me</span>
                </label>
                <button type="button" className="forgot">Forgot password?</button>
            </div>

            <div className="au d5">
                <SubmitButton isLoading={isLoading} isValid={isValid} isModalOpen={isModalOpen} />
            </div>
        </form>
    );
};
const FormPanel = ({ apiUrl, onSubmit, isLoading, error, clearError, isModalOpen }) => (
    <main className="form-panel">
        <div className="glow-a" style={{ width: 340, height: 340, top: '-8%', right: '-8%', background: 'rgba(123,82,255,.045)' }} />
        <div className="glow-a" style={{ width: 260, height: 260, bottom: '-5%', left: '-5%', background: 'rgba(37,99,235,.04)' }} />

        <div className="form-inner">
            <div className="mobile-logo as d0">
                <Logo size="sm" />
                <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: '-.03em' }}>Klivra</span>
            </div>

            <div className="col g8" style={{ marginBottom: 26 }}>
                <h1 className="au d0" style={{ fontSize: 'clamp(22px,3vw,30px)', fontWeight: 900, letterSpacing: '-.03em', color: 'var(--t1)', lineHeight: 1.1 }}>Welcome back</h1>
                <p className="au d1" style={{ fontSize: 14, color: 'var(--t2)' }}>
                    New to Klivra? <Link to="/register" className="link-v">Create an account</Link>
                </p>
            </div>

            <div className="card au d1" style={{ marginBottom: 12 }}>
                <LoginForm
                    onSubmit={onSubmit} isLoading={isLoading}
                    error={error} clearError={clearError} isModalOpen={isModalOpen}
                />
                <div style={{ marginTop: 20 }}>
                    <OAuthSection apiUrl={apiUrl} />
                </div>
            </div>

            <p className="footer-row au d7">
                By signing in you agree to our <a href="#" className="link-s">Terms of Service</a> and <a href="#" className="link-s">Privacy Policy</a>.
            </p>
        </div>
    </main>
);

const Login = () => {
    const navigate = useNavigate();
    const { login, isLoading, error, clearError, user } = useAuthStore();
    const [showModal, setShowModal] = useState(false);
    const [reactivationData, setReactivationData] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://syncforge-io.onrender.com' : 'http://localhost:5000');


    useEffect(() => { if (user) navigate('/'); }, [user, navigate]);
    useEffect(() => { clearError(); }, [clearError]);

    const onSubmit = useCallback(async (data) => {
        clearError();
        try {
            await login(data.email, data.password, data.rememberMe);
            navigate('/');
        } catch (err) {
            if (err?.requiresReactivation) {
                setReactivationData(data);
                setShowModal(true);
            }
        }
    }, [clearError, login, navigate]);

    const handleReactivate = useCallback(async () => {
        try {
            await login(reactivationData.email, reactivationData.password, reactivationData.rememberMe, true);
            setShowModal(false);
            navigate('/');
        } catch {
            setShowModal(false);
        }
    }, [login, navigate, reactivationData]);

    return (
        <>
            <GlobalStyles />
            <div className="root">
                <ReactivationModal isOpen={showModal} isLoading={isLoading} onConfirm={handleReactivate} onClose={() => setShowModal(false)} />
                <BrandPanel />
                <FormPanel
                    apiUrl={API_URL} onSubmit={onSubmit}
                    isLoading={isLoading} error={error}
                    clearError={clearError} isModalOpen={showModal}
                />
            </div>
        </>
    );
};

export default Login;