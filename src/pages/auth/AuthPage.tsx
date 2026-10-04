import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Calendar,
  Check,
  CheckSquare,
  Copy,
  Database,
  Eye,
  EyeOff,
  Heart,
  KeyRound,
  Lock,
  Mail,
  Sparkles,
  User,
  Users,
  Wallet,
} from 'lucide-react';
import { useFamilyStore } from '../../stores/useFamilyStore';
import {
  ensureSharedSupabaseConfig,
  getSupabaseConfig,
  saveRuntimeSupabaseConfig,
  SUPABASE_SQL_SCHEMA,
} from '../../lib/supabase';
import {
  authService,
  restoreLocalUsersAndBundlesToServer,
} from '../../services/familyService';

type AuthMode = 'login' | 'register' | 'forgot';
type LoginAnimStage = 'idle' | 'unlocking' | 'lighting' | 'welcoming';

export function AuthPage() {
  const navigate = useNavigate();
  const login = useFamilyStore((s) => s.login);
  const register = useFamilyStore((s) => s.register);
  const setLoginAnimating = useFamilyStore((s) => s.setLoginAnimating);

  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [animStage, setAnimStage] = useState<LoginAnimStage>('idle');
  const [welcomeFamilyName, setWelcomeFamilyName] = useState('Keluarga Harmonis');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [familyMode, setFamilyMode] = useState<'create' | 'join'>('create');
  const [familyName, setFamilyName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  // External Supabase configuration panel
  const [sbConfig, setSbConfig] = useState(() => getSupabaseConfig());
  const [showSupabaseConfig, setShowSupabaseConfig] = useState(false);
  const [sbUrl, setSbUrl] = useState(sbConfig.url);
  const [sbKey, setSbKey] = useState(sbConfig.anonKey);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    void ensureSharedSupabaseConfig().then(() => {
      const latest = getSupabaseConfig();
      setSbConfig(latest);
      setSbUrl(latest.url);
      setSbKey(latest.anonKey);
    });
  }, []);

  // Interactive progress for the header house illustration while typing
  const hasEmail = email.trim().includes('@');
  const hasPassword = (mode === 'forgot' ? newPassword : password).length >= 6;

  const playWelcomeAnimationAndNavigate = async (authAction: () => Promise<void>) => {
    setLoginAnimating(true);
    setAnimStage('unlocking');

    try {
      // Wait for both auth call and Stage 1 key turning (800ms)
      await Promise.all([
        authAction(),
        new Promise((resolve) => setTimeout(resolve, 800)),
      ]);

      const currentFamily = useFamilyStore.getState().family;
      const currentProfile = useFamilyStore.getState().profile;
      if (currentFamily?.name) {
        setWelcomeFamilyName(currentFamily.name);
      } else if (currentProfile?.full_name) {
        setWelcomeFamilyName(`Keluarga ${currentProfile.full_name}`);
      }

      // Stage 2: Lighting up the home & gathering family modules (900ms)
      setAnimStage('lighting');
      await new Promise((resolve) => setTimeout(resolve, 900));

      // Stage 3: Doors swing open & warm welcome message (1000ms)
      setAnimStage('welcoming');
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setLoginAnimating(false);
      navigate('/', { replace: true });
    } catch (err) {
      setLoginAnimating(false);
      setAnimStage('idle');
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await playWelcomeAnimationAndNavigate(() => login(email, password));
      } else if (mode === 'register') {
        const cleanName = fullName.trim() || email.split('@')[0] || 'Keluarga Kita';
        if (password.length < 6) {
          throw new Error('Kata sandi minimal 6 karakter.');
        }
        setWelcomeFamilyName(familyName.trim() || `Keluarga ${cleanName}`);
        await playWelcomeAnimationAndNavigate(() =>
          register({
            fullName: cleanName,
            email,
            password,
            familyMode,
            familyName: familyName || `Keluarga ${cleanName}`,
            partnerName: partnerName || 'Pasangan',
            joinCode,
          })
        );
      } else if (mode === 'forgot') {
        if (!email.trim() || !newPassword.trim() || newPassword.length < 6) {
          throw new Error('Masukkan email terdaftar dan kata sandi baru minimal 6 karakter.');
        }
        await authService.resetPassword(email, newPassword);
        setSuccessMsg('Tautan pemulihan kata sandi telah dikirim ke email Anda. Silakan periksa kotak masuk/spam email.');
        setMode('login');
        setPassword('');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan saat memproses autentikasi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSupabaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    saveRuntimeSupabaseConfig(sbUrl, sbKey);
    setSbConfig(getSupabaseConfig());
    setShowSupabaseConfig(false);
    await restoreLocalUsersAndBundlesToServer();
    setSuccessMsg(
      sbUrl.trim()
        ? 'Kredensial Supabase eksternal berhasil disimpan & disinkronkan ke perangkat keluarga.'
        : 'Kredensial Supabase direset ke penyimpanan lokal persisten.'
    );
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Full-screen Unique "Membuka Pintu RumahKita" Login Ceremony Overlay */}
      <AnimatePresence>
        {animStage !== 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#1E2D24]/95 backdrop-blur-md flex flex-col items-center justify-center px-6 text-center overflow-hidden"
          >
            {/* Ambient Radial Golden Glow */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0.2 }}
              animate={{
                scale: animStage === 'welcoming' ? 2.4 : animStage === 'lighting' ? 1.5 : 0.9,
                opacity: animStage === 'welcoming' ? 0.55 : 0.3,
              }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute w-72 h-72 rounded-full bg-radial from-[#F4D393]/50 via-[#D4A359]/20 to-transparent pointer-events-none"
            />

            {/* Orbiting Family Modules that converge into the home */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              {[
                { Icon: Wallet, label: 'Keuangan', angle: -45, color: '#D4A359' },
                { Icon: Calendar, label: 'Kalender', angle: 45, color: '#6BA38B' },
                { Icon: Heart, label: 'Berdua', angle: 135, color: '#C87A73' },
                { Icon: CheckSquare, label: 'Tugas', angle: -135, color: '#5A819E' },
              ].map((item, idx) => {
                const rad = (item.angle * Math.PI) / 180;
                const startX = Math.cos(rad) * 105;
                const startY = Math.sin(rad) * 105;
                return (
                  <motion.div
                    key={item.label}
                    initial={{ x: startX, y: startY, scale: 0, opacity: 0 }}
                    animate={
                      animStage === 'unlocking'
                        ? { x: startX, y: startY, scale: 1, opacity: 0.9 }
                        : animStage === 'lighting'
                        ? { x: startX * 0.65, y: startY * 0.65, scale: 1.08, opacity: 1 }
                        : { x: 0, y: 10, scale: 0.2, opacity: 0 }
                    }
                    transition={{ duration: 0.6, delay: idx * 0.06, ease: 'easeInOut' }}
                    className="absolute z-20 flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg border border-white/20 text-white"
                      style={{ backgroundColor: item.color }}
                    >
                      <item.Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold text-[#FAF7F2]/80">
                      {item.label}
                    </span>
                  </motion.div>
                );
              })}

              {/* Chimney Floating Hearts & Sparkles */}
              <AnimatePresence>
                {(animStage === 'lighting' || animStage === 'welcoming') && (
                  <>
                    <motion.div
                      initial={{ y: -35, x: 26, scale: 0, opacity: 0 }}
                      animate={{ y: -95, x: 38, scale: 1.15, opacity: [0, 1, 0] }}
                      transition={{ duration: 1.4, ease: 'easeOut' }}
                      className="absolute z-20 text-[#C87A73]"
                    >
                      <Heart className="w-5 h-5 fill-[#C87A73]" />
                    </motion.div>
                    <motion.div
                      initial={{ y: -30, x: 18, scale: 0, opacity: 0 }}
                      animate={{ y: -80, x: 8, scale: 0.9, opacity: [0, 1, 0] }}
                      transition={{ duration: 1.3, delay: 0.2, ease: 'easeOut' }}
                      className="absolute z-20 text-[#F4D393]"
                    >
                      <Sparkles className="w-4 h-4" />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {/* Bespoke SVG Architectural Family House */}
              <motion.div
                initial={{ scale: 0.85, y: 10 }}
                animate={{
                  scale: animStage === 'welcoming' ? 1.12 : 1,
                  y: 0,
                }}
                transition={{ type: 'spring', stiffness: 180, damping: 16 }}
                className="relative z-10 w-44 h-44 flex items-center justify-center"
              >
                <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
                  {/* Chimney */}
                  <rect
                    x="132"
                    y="42"
                    width="18"
                    height="36"
                    rx="4"
                    fill="#D4A359"
                  />
                  {/* Roof */}
                  <path
                    d="M25 98 L100 32 L175 98 Z"
                    fill="#D4A359"
                    stroke="#F4D393"
                    strokeWidth="4"
                    strokeLinejoin="round"
                  />
                  {/* House Body */}
                  <rect
                    x="42"
                    y="95"
                    width="116"
                    height="80"
                    rx="12"
                    fill="#FAF7F2"
                    stroke="#E8E2D5"
                    strokeWidth="3"
                  />

                  {/* Left Window (Lights up warm gold in lighting/welcoming stage) */}
                  <rect
                    x="55"
                    y="110"
                    width="24"
                    height="24"
                    rx="5"
                    fill={animStage === 'unlocking' ? '#E8E2D5' : '#F4D393'}
                    stroke="#2A4D3E"
                    strokeWidth="2.5"
                    className="transition-colors duration-500"
                  />
                  <line x1="67" y1="110" x2="67" y2="134" stroke="#2A4D3E" strokeWidth="2" />
                  <line x1="55" y1="122" x2="79" y2="122" stroke="#2A4D3E" strokeWidth="2" />

                  {/* Right Window (Lights up warm gold in lighting/welcoming stage) */}
                  <rect
                    x="121"
                    y="110"
                    width="24"
                    height="24"
                    rx="5"
                    fill={animStage === 'unlocking' ? '#E8E2D5' : '#F4D393'}
                    stroke="#2A4D3E"
                    strokeWidth="2.5"
                    className="transition-colors duration-500"
                  />
                  <line x1="133" y1="110" x2="133" y2="134" stroke="#2A4D3E" strokeWidth="2" />
                  <line x1="121" y1="122" x2="145" y2="122" stroke="#2A4D3E" strokeWidth="2" />

                  {/* Attic Circular Window */}
                  <circle
                    cx="100"
                    cy="72"
                    r="11"
                    fill={animStage === 'unlocking' ? '#2A4D3E' : '#F4D393'}
                    stroke="#FAF7F2"
                    strokeWidth="2.5"
                    className="transition-colors duration-500"
                  />

                  {/* Warm Interior Light Behind the Front Door */}
                  <rect
                    x="84"
                    y="122"
                    width="32"
                    height="53"
                    rx="6"
                    fill="#F4D393"
                  />

                  {/* Front Door Leaf (Swings open in welcoming stage) */}
                  <motion.rect
                    x="84"
                    y="122"
                    width="32"
                    height="53"
                    rx="6"
                    fill="#2A4D3E"
                    stroke="#1E2D24"
                    strokeWidth="2"
                     style={{ transformOrigin: '84px 148px' }}
                    animate={{
                      scaleX: animStage === 'welcoming' ? 0.22 : 1,
                    }}
                    transition={{ duration: 0.55, ease: 'easeInOut' }}
                  />

                  {/* Golden Door Handle */}
                  {animStage !== 'welcoming' && (
                    <circle cx="110" cy="149" r="3" fill="#F4D393" />
                  )}
                </svg>

                {/* Stage 1 Key Turning Overlay */}
                <AnimatePresence>
                  {animStage === 'unlocking' && (
                    <motion.div
                      initial={{ scale: 0.5, rotate: -45, opacity: 0 }}
                      animate={{ scale: 1.1, rotate: 90, opacity: 1 }}
                      exit={{ scale: 0.4, opacity: 0 }}
                      transition={{ duration: 0.55, ease: 'backOut' }}
                      className="absolute bottom-5 w-11 h-11 rounded-2xl bg-[#D4A359] text-[#1E2D24] flex items-center justify-center shadow-xl border-2 border-[#FAF7F2]"
                    >
                      <KeyRound className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Stage Status Text */}
            <motion.div
              key={animStage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mt-4 space-y-2 max-w-xs"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-[#F4D393]">
                {animStage === 'unlocking'
                  ? 'Membuka Kunci Rumah...'
                  : animStage === 'lighting'
                  ? 'Menyalakan Lampu Ruang Keluarga...'
                  : 'Pintu Rumah Terbuka'}
              </p>
              <h2 className="text-xl font-bold text-[#FAF7F2]">
                {animStage === 'welcoming'
                  ? `Selamat Datang Pulang, ${welcomeFamilyName}!`
                  : 'Menyiapkan Kehangatan RumahKita'}
              </h2>
              <p className="text-xs text-[#FAF7F2]/70">
                {animStage === 'unlocking'
                  ? 'Memverifikasi kunci akses keluarga Anda dengan aman'
                  : animStage === 'lighting'
                  ? 'Menyusun ringkasan keuangan, kalender, dan agenda hari ini'
                  : 'Silakan masuk ke ruang keluarga Anda'}
              </p>
            </motion.div>

            {/* Progress Dots */}
            <div className="flex items-center gap-2 mt-6">
              {(['unlocking', 'lighting', 'welcoming'] as LoginAnimStage[]).map((step, i) => {
                const activeIndex = ['unlocking', 'lighting', 'welcoming'].indexOf(animStage);
                const isDone = i <= activeIndex;
                return (
                  <div
                    key={step}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isDone ? 'w-8 bg-[#F4D393]' : 'w-2 bg-white/20'
                    }`}
                  />
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-md space-y-5">
        {/* Interactive App Brand Header with Reactive House Windows */}
        <div className="text-center space-y-2">
          <motion.div
            whileHover={{ scale: 1.04 }}
            className="relative w-20 h-20 rounded-3xl bg-[#2A4D3E] flex items-center justify-center mx-auto shadow-md border border-[#D4A359]/30"
          >
            {/* Floating Hearth Heart when both Email & Password are typed */}
            <AnimatePresence>
              {hasEmail && hasPassword && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.6 }}
                  animate={{ opacity: 1, y: -10, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute -top-2 right-2 w-6 h-6 rounded-full bg-[#C87A73] text-white flex items-center justify-center shadow-sm"
                  title="Siap masuk ke RumahKita"
                >
                  <Heart className="w-3 h-3 fill-white" />
                </motion.div>
              )}
            </AnimatePresence>

            <svg viewBox="0 0 100 100" className="w-12 h-12">
              {/* Roof */}
              <path
                d="M14 48 L50 16 L86 48"
                fill="none"
                stroke="#F4D393"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* House Body */}
              <rect
                x="24"
                y="46"
                width="52"
                height="38"
                rx="6"
                fill="#FAF7F2"
              />
              {/* Left Window: glows gold when email is valid */}
              <rect
                x="31"
                y="54"
                width="12"
                height="12"
                rx="2.5"
                fill={hasEmail ? '#D4A359' : '#CBD5E1'}
                className="transition-colors duration-300"
              />
              {/* Right Window: glows gold when password has >= 6 chars */}
              <rect
                x="57"
                y="54"
                width="12"
                height="12"
                rx="2.5"
                fill={hasPassword ? '#D4A359' : '#CBD5E1'}
                className="transition-colors duration-300"
              />
              {/* Door */}
              <rect
                x="44"
                y="64"
                width="12"
                height="20"
                rx="2.5"
                fill="#2A4D3E"
              />
            </svg>
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1E2D24]">RumahKita</h1>
          <p className="text-xs text-[#5C6B62]">
            {hasEmail && hasPassword
              ? 'Lampu rumah sudah menyala — ketuk tombol di bawah untuk masuk!'
              : 'Manajemen Keuangan, Kalender, Tugas & Harmoni Keluarga'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-3xl border border-[#E8E2D5] p-6 shadow-xs space-y-5">
          {/* Mode Tabs */}
          {mode !== 'forgot' && (
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F4EFE6] rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`py-2.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                  mode === 'login'
                    ? 'bg-[#2A4D3E] text-white shadow-xs'
                    : 'text-[#5C6B62] hover:text-[#1E2D24]'
                }`}
              >
                Masuk Akun
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`py-2.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                  mode === 'register'
                    ? 'bg-[#2A4D3E] text-white shadow-xs'
                    : 'text-[#5C6B62] hover:text-[#1E2D24]'
                }`}
              >
                Daftar Keluarga Baru
              </button>
            </div>
          )}

          {mode === 'forgot' && (
            <div className="space-y-1">
              <h2 className="text-base font-bold text-[#1E2D24]">Atur Ulang Kata Sandi</h2>
              <p className="text-xs text-[#5C6B62]">
                Masukkan email akun Anda dan buat kata sandi baru.
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-[#FDECEC] border border-[#C84B31]/20 text-xs text-[#C84B31] font-medium">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-[#EAF4EE] border border-[#2A4D3E]/20 text-xs text-[#2A4D3E] font-medium">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-[#1E2D24] mb-1.5">
                  Nama Lengkap Anda
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#5C6B62] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] text-sm text-[#1E2D24] focus:outline-none focus:border-[#2A4D3E]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#5C6B62] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] text-sm text-[#1E2D24] focus:outline-none focus:border-[#2A4D3E]"
                />
              </div>
            </div>

            {mode !== 'forgot' ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#1E2D24]">Kata Sandi</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className="text-xs font-semibold text-[#2A4D3E] hover:underline"
                    >
                      Lupa kata sandi?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#5C6B62] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] text-sm text-[#1E2D24] focus:outline-none focus:border-[#2A4D3E]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label="Tampilkan atau sembunyikan kata sandi"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C6B62] hover:text-[#1E2D24]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-[#1E2D24] mb-1.5">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#5C6B62] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] text-sm text-[#1E2D24] focus:outline-none focus:border-[#2A4D3E]"
                  />
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div className="pt-2 border-t border-[#E8E2D5] space-y-3">
                <label className="block text-xs font-semibold text-[#1E2D24]">
                  Pengaturan Ruang Keluarga
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFamilyMode('create')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-colors ${
                      familyMode === 'create'
                        ? 'bg-[#F4EFE6] border-[#2A4D3E] text-[#2A4D3E]'
                        : 'bg-white border-[#E8E2D5] text-[#5C6B62]'
                    }`}
                  >
                    Buat Keluarga Baru
                  </button>
                  <button
                    type="button"
                    onClick={() => setFamilyMode('join')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-colors ${
                      familyMode === 'join'
                        ? 'bg-[#F4EFE6] border-[#2A4D3E] text-[#2A4D3E]'
                        : 'bg-white border-[#E8E2D5] text-[#5C6B62]'
                    }`}
                  >
                    Gabung Kode Keluarga
                  </button>
                </div>

                {familyMode === 'create' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-[#5C6B62] mb-1">
                        Nama Keluarga (Opsional)
                      </label>
                      <div className="relative">
                        <Users className="w-4 h-4 text-[#5C6B62] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={familyName}
                          onChange={(e) => setFamilyName(e.target.value)}
                          placeholder="Contoh: Keluarga Budi & Sari"
                          className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] text-sm text-[#1E2D24]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#5C6B62] mb-1">
                        Nama Pasangan (Opsional)
                      </label>
                      <input
                        type="text"
                        value={partnerName}
                        onChange={(e) => setPartnerName(e.target.value)}
                        placeholder="Contoh: Sari"
                        className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] text-sm text-[#1E2D24]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-[#5C6B62] mb-1">
                        Masukkan Kode Undangan / Family ID Pasangan
                      </label>
                      <input
                        type="text"
                        required
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        placeholder="Contoh: RK-8F2A"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#2A4D3E]/40 text-sm font-mono-num font-bold tracking-wider text-[#1E2D24] uppercase focus:outline-none focus:border-[#2A4D3E]"
                      />
                    </div>
                    <p className="text-[11px] text-[#5C6B62] leading-relaxed bg-[#F4EFE6]/70 p-2.5 rounded-xl border border-[#E8E2D5]">
                      Lihat kode undangan (misal <strong>RK-XXXX</strong>) pada HP pasangan di menu{' '}
                      <strong>Lainnya → Sistem Keluarga</strong>. Akun Anda akan otomatis terhubung ke
                      ruang keluarga yang sama.
                    </p>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[48px] rounded-2xl bg-[#2A4D3E] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#213D31] transition-colors disabled:opacity-60 cursor-pointer"
            >
              <span>
                {isSubmitting
                  ? 'Membuka Pintu RumahKita...'
                  : mode === 'login'
                  ? 'Masuk ke RumahKita'
                  : mode === 'register'
                  ? 'Buat Akun & Masuk Sekarang'
                  : 'Simpan Kata Sandi Baru'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full py-2 text-xs font-semibold text-[#5C6B62] hover:text-[#1E2D24]"
              >
                Kembali ke halaman masuk
              </button>
            )}
          </form>
        </div>

        {/* External Supabase Credential Connection Panel */}
        <div className="bg-white rounded-2xl border border-[#E8E2D5] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[#5C6B62]">
              <Database className="w-4 h-4 text-[#2A4D3E]" />
              <span>
                Mode Database:{' '}
                <strong className="text-[#1E2D24]">
                  {sbConfig.isConfigured
                    ? 'Supabase Eksternal Aktif'
                    : 'Penyimpanan Persisten Siap Pakai'}
                </strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowSupabaseConfig((prev) => !prev)}
              className="text-xs font-semibold text-[#2A4D3E] hover:underline"
            >
              {showSupabaseConfig ? 'Tutup' : 'Hubungkan Supabase'}
            </button>
          </div>

          {showSupabaseConfig && (
            <div className="mt-3 pt-3 border-t border-[#E8E2D5] space-y-3">
              <form onSubmit={handleSaveSupabaseConfig} className="space-y-3">
                <p className="text-[11px] text-[#5C6B62] leading-relaxed">
                  Opsional: Jika ingin menyinkronkan ke proyek Supabase milik sendiri, masukkan URL
                  & Anon Key lalu jalankan Skrip SQL di bawah pada SQL Editor Supabase Anda.
                </p>
                <div>
                  <label className="block text-[11px] font-semibold text-[#1E2D24] mb-1">
                    VITE_SUPABASE_URL
                  </label>
                  <input
                    type="url"
                    value={sbUrl}
                    onChange={(e) => setSbUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] text-xs font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#1E2D24] mb-1">
                    VITE_SUPABASE_ANON_KEY
                  </label>
                  <input
                    type="password"
                    value={sbKey}
                    onChange={(e) => setSbKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] text-xs font-mono-num"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="px-3 py-2 rounded-xl bg-[#F4EFE6] text-[#2A4D3E] text-xs font-semibold flex items-center gap-1.5"
                  >
                    {copiedSql ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedSql ? 'SQL Tersalin!' : 'Salin Skrip SQL Tabel'}</span>
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold"
                  >
                    Simpan Koneksi
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
