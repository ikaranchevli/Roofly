import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Users,
  Mail,
  Phone,
  Camera,
  Hash,
  ArrowRight,
  Loader2,
  ChevronLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { toAbsoluteUrl } from '@/lib/helpers';
import { supabase } from '@/lib/supabase';
import type { Tenant } from '@/types/tenant';

export function JoinPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Join Code, 2: Details, 3: Profile Match
  const navigate = useNavigate();

  // State
  const [joinCode, setJoinCode] = useState('');
  const [household, setHousehold] = useState<any>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [matchedTenant, setMatchedTenant] = useState<Tenant | null>(null);

  const orangeColor = '#E67E22';

  // Step 1: Verify Code
  const verifyJoinCode = async () => {
    if (joinCode.length !== 6) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('households')
        .select('*')
        .eq('join_code', joinCode.toUpperCase())
        .single();

      if (error || !data) {
        toast.error('Invalid join code. Please check and try again.');
        return;
      }

      setHousehold(data);
      setStep(2);
    } catch (err) {
      toast.error('Error verifying code');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Search for matches and Proceed
  const checkMatchesAndProceed = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Search for matching name, email or phone using secure RPC
      // (Bypasses RLS for anonymous users during the join flow)
      const { data: tenants, error } = await supabase.rpc('match_housemate_profile', {
        p_household_id: household.id,
        p_email: email,
        p_phone: phone,
        p_first_name: firstName,
        p_last_name: lastName
      });

      if (error) throw error;

      if (tenants && tenants.length > 0) {
        // Sort by priority: Full name -> Last name -> First name
        const sorted = [...tenants].sort((a, b) => {
          // Priority 1: Full name match (Both first and last)
          const aFull = a.first_name?.toLowerCase() === firstName.toLowerCase() && a.last_name?.toLowerCase() === lastName.toLowerCase();
          const bFull = b.first_name?.toLowerCase() === firstName.toLowerCase() && b.last_name?.toLowerCase() === lastName.toLowerCase();
          if (aFull && !bFull) return -1;
          if (!aFull && bFull) return 1;

          // Priority 2: Last name match
          const aLast = a.last_name?.toLowerCase() === lastName.toLowerCase();
          const bLast = b.last_name?.toLowerCase() === lastName.toLowerCase();
          if (aLast && !bLast) return -1;
          if (!aLast && bLast) return 1;

          // Priority 3: First name match
          const aFirst = a.first_name?.toLowerCase() === firstName.toLowerCase();
          const bFirst = b.first_name?.toLowerCase() === firstName.toLowerCase();
          if (aFirst && !bFirst) return -1;
          if (!aFirst && bFirst) return 1;

          return 0;
        });

        setMatchedTenant(sorted[0] as Tenant);
        setStep(3);
      } else {
        // No match, proceed to create pending profile
        await createProfile(false);
      }
    } catch (err) {
      toast.error('Error checking for matches');
    } finally {
      setIsLoading(false);
    }
  };

  // Create Profile Logic
  const createProfile = async (isMatched: boolean) => {
    setIsLoading(true);
    try {
      // 1. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (authError) {
        if (authError.message === 'User already registered') {
          toast.error('This email is already registered. Please sign in instead.');
          return;
        }
        throw authError;
      }

      let avatarUrl = '';
      if (avatar) {
        const filePath = `avatars/${authData.user!.id}-${Date.now()}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatar);
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
          avatarUrl = urlData.publicUrl;
        }
      }

      // 2. If matched, call the secure RPC to merge shadow into auth user atomically
      if (isMatched && matchedTenant) {
        const { error: mergeError } = await supabase.rpc('merge_housemate_profile', {
          p_shadow_id: matchedTenant.id,
          p_auth_id: authData.user!.id,
          p_email: email,
          p_phone: phone,
          p_first_name: firstName,
          p_last_name: lastName,
          p_avatar_url: avatarUrl,
        });

        if (mergeError) throw mergeError;

        toast.success('Welcome to the house!', {
          description: 'Your profile has been matched and activated.',
        });
        navigate('/dashboard');
        return;
      }

      // 3. No match — Create a new pending profile
      const { error: pError } = await supabase
        .from('users')
        .insert({
          id: authData.user!.id,
          first_name: firstName,
          last_name: lastName,
          phone,
          email: email,
          avatar_url: avatarUrl,
          household_id: household.id,
          role: 'housemate',
          status: 'pending',
        });

      if (pError) throw pError;

      toast.info('Application submitted', {
        description: 'Waiting for admin approval.',
      });
      navigate('/login');
    } catch (err: any) {
      if (err.status === 429) {
        toast.error('Rate Limit Reached', { description: 'For security, Supabase limits the number of signups per hour. Please wait a bit or check your Supabase auth settings.' });
      } else {
        toast.error('Failed to create profile', { description: err.message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  return (
    <>
      <Helmet>
        <title>Join a Household — Roofly</title>
      </Helmet>

      <style>{`
        .join-root {
          display: flex;
          min-height: 100vh;
          width: 100%;
          background: linear-gradient(135deg, #E67E22 0%, #C0392B 100%);
          position: relative;
          overflow: hidden;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
        }

        .join-card {
          width: 100%;
          max-width: 500px;
          background: rgba(255, 255, 255, 0.97);
          border-radius: 32px;
          padding: 44px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.5);
          position: relative;
          z-index: 10;
        }

        .join-back-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 0.875rem;
          font-weight: 700;
          color: rgba(255,255,255,0.85);
          text-decoration: none;
          margin-top: 24px;
          transition: color 0.2s;
          position: relative;
          z-index: 10;
        }

        .join-back-link:hover {
          color: white;
        }

        .join-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 36px;
          position: relative;
          z-index: 10;
        }
      `}</style>

      <div className="join-root">
        {/* Grid overlay */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.08, pointerEvents: 'none' }}>
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="join-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#join-grid)" />
          </svg>
        </div>

        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 350, height: 350, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '5%', left: '-8%', width: 280, height: 280, borderRadius: '50%', background: 'rgba(0,0,0,0.1)', filter: 'blur(50px)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 500, position: 'relative', zIndex: 10 }}>
          {/* Logo */}
          <div className="join-logo">
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 57, height: 57, borderRadius: 16,
              background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
              padding: 10, border: '1px solid rgba(255,255,255,0.3)', flexShrink: 0,
            }}>
              <img
                src={toAbsoluteUrl('/logo-white.png')}
                alt="Roofly"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={(e) => { (e.target as HTMLImageElement).src = toAbsoluteUrl('/roofly-logo.svg'); }}
              />
            </div>
            <span style={{ fontSize: 44, fontWeight: 400, color: 'white', fontFamily: "'Zolo', sans-serif", letterSpacing: '0.5px' }}>roofly</span>
          </div>


          <motion.div
            className="join-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AnimatePresence mode="wait">
              {/* Step 1: Join Code */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center size-16 rounded-3xl bg-[#E67E22]/10 text-[#E67E22] mb-4">
                      <Hash className="size-8" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-zinc-900">Enter Roofly Key</h2>
                    <p className="text-zinc-500">Ask your house admin for the 6-digit code.</p>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="E.G. RFL123"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      className="block w-full text-center text-3xl font-black tracking-[0.2em] py-5 bg-zinc-50 border-2 border-zinc-100 rounded-2xl focus:outline-none focus:border-[#E67E22] focus:ring-4 focus:ring-[#E67E22]/5 transition-all uppercase placeholder:text-zinc-200"
                    />
                    <Button
                      onClick={verifyJoinCode}
                      disabled={joinCode.length !== 6 || isLoading}
                      className="w-full py-7 rounded-2xl font-bold text-lg"
                      style={{ backgroundColor: orangeColor, color: 'white' }}
                    >
                      {isLoading ? <Loader2 className="animate-spin" /> : 'Continue'}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Details */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <div className="space-y-1">
                    <h3 className="text-2xl font-extrabold text-zinc-900">Joining {household?.name}</h3>
                    <p className="text-zinc-500 text-sm">{household?.address}</p>
                  </div>

                  <form onSubmit={checkMatchesAndProceed} className="space-y-4">
                    {/* Avatar Upload */}
                    <div className="flex justify-center mb-2">
                      <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-input')?.click()}>
                        <div className="size-24 rounded-full bg-zinc-100 border-4 border-white shadow-sm overflow-hidden flex items-center justify-center">
                          {avatarPreview ? (
                            <img src={avatarPreview} alt="Preview" className="size-full object-cover" />
                          ) : (
                            <Camera className="size-8 text-zinc-400" />
                          )}
                        </div>
                        <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <User className="size-6 text-white" />
                        </div>
                        <input id="avatar-input" type="file" hidden accept="image/*" onChange={handleAvatarChange} />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-zinc-400" />
                          <input
                            placeholder="First Name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                            className="block w-full pl-12 pr-4 py-3.5 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:border-[#E67E22] transition-all"
                          />
                        </div>
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-zinc-400" />
                          <input
                            placeholder="Last Name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                            className="block w-full pl-12 pr-4 py-3.5 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:border-[#E67E22] transition-all"
                          />
                        </div>
                      </div>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-zinc-400" />
                        <input
                          type="email"
                          placeholder="Email Address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="block w-full pl-12 pr-4 py-3.5 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:border-[#E67E22] transition-all"
                        />
                      </div>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-zinc-400" />
                        <input
                          type="password"
                          placeholder="Create Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                          className="block w-full pl-12 pr-4 py-3.5 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:border-[#E67E22] transition-all"
                        />
                      </div>
                      <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-zinc-400" />
                        <input
                          placeholder="Phone Number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          className="block w-full pl-12 pr-4 py-3.5 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:border-[#E67E22] transition-all"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-7 rounded-2xl font-bold text-lg shadow-lg shadow-[#E67E22]/20 hover:shadow-[#E67E22]/30 transition-all active:scale-[0.98]"
                      style={{ backgroundColor: orangeColor, color: 'white' }}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </div>
                      ) : (
                        'Join Household'
                      )}
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* Step 3: Match Suggestion */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center size-16 rounded-full bg-blue-50 text-blue-600 mb-2">
                      <CheckCircle2 className="size-8" />
                    </div>
                    <h3 className="text-2xl font-extrabold text-zinc-900">Is this you?</h3>
                    <p className="text-zinc-500">We found a tenant record matching your details.</p>
                  </div>

                  <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100 flex items-center gap-4">
                    <div className="size-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl">
                      {matchedTenant?.first_name?.[0] || '?'}
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900">{matchedTenant?.first_name} {matchedTenant?.last_name}</h4>
                      <p className="text-xs text-zinc-500">Moved in on {matchedTenant?.move_in_date}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => createProfile(false)}
                      disabled={isLoading}
                      className="rounded-xl py-6"
                    >
                      No, that's not me
                    </Button>
                    <Button
                      onClick={() => createProfile(true)}
                      disabled={isLoading}
                      className="rounded-xl py-6"
                      style={{ backgroundColor: orangeColor, color: 'white' }}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </div>
                      ) : (
                        'Yes, looks right'
                      )}
                    </Button>
                  </div>

                  <div className="flex items-start gap-2 bg-amber-50 p-4 rounded-xl">
                    <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Confirming will automatically activate your profile and link your history.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Back link — centered below card */}
          <Link to="/login" className="join-back-link">
            <ChevronLeft className="size-4" /> Back to Sign In
          </Link>
        </div>

        {/* Bottom tagline */}
        <div style={{
          position: 'absolute',
          bottom: 32,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          zIndex: 10,
        }}>
          <h1 style={{ fontSize: 'clamp(1.25rem, 2vw, 1.6rem)', fontWeight: 900, color: 'white', lineHeight: 1.2, margin: 0 }}>
            Connect with your housemates and get in sync.&nbsp;&nbsp;🚀
          </h1>
        </div>
      </div>
    </>
  );
}
