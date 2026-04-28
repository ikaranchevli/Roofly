import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  MapPin,
  Home,
  ArrowRight,
  Loader2,
  ChevronLeft
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { GeoapifyContext, GeoapifyGeocoderAutocomplete } from '@geoapify/react-geocoder-autocomplete';
import '@geoapify/geocoder-autocomplete/styles/minimal.css';
import { Button } from '@/components/ui/button';
import { toAbsoluteUrl, generateJoinCode } from '@/lib/helpers';
import { supabase } from '@/lib/supabase';

export function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [houseName, setHouseName] = useState('');
  const [address, setAddress] = useState('');

  const orangeColor = '#E67E22';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      toast.error('Please select a valid house address');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Starting sign up for:', email);
      // 1. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (authError) {
        console.error('Auth Error:', authError);
        throw authError;
      }
      if (!authData.user) throw new Error('Sign up failed');

      const userId = authData.user.id;
      console.log('User created:', userId);

      // 2. Create Household
      const joinCode = generateJoinCode();
      console.log('Creating household with code:', joinCode);
      const { data: household, error: hError } = await supabase
        .from('households')
        .insert({
          name: houseName,
          address: address,
          join_code: joinCode,
          admin_id: userId,
        })
        .select()
        .single();

      if (hError) {
        console.error('Household Error:', hError);
        throw hError;
      }
      console.log('Household created:', household.id);

      // 3. Create Profile
      const { error: pError } = await supabase
        .from('users')
        .insert({
          id: userId,
          first_name: firstName,
          last_name: lastName,
          email: email,
          household_id: household.id,
          role: 'admin',
          status: 'active',
        });

      if (pError) {
        console.error('Profile Error:', pError);
        throw pError;
      }
      console.log('Profile created successfully');

      toast.success('Account created successfully!', {
        description: `Your join code is: ${joinCode}. Share it with your housemates!`,
      });

      navigate('/dashboard');
    } catch (err: any) {
      if (err.status === 429) {
        toast.error('Rate Limit Reached', { description: 'For security, Supabase limits the number of signups per hour. Please wait a bit or check your Supabase auth settings.' });
      } else {
        toast.error('Registration failed', { description: err.message });
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin Sign Up — Roofly</title>
      </Helmet>

      <style>{`
        .auth-root {
          display: flex;
          min-height: 100vh;
          width: 100%;
          background: #fff;
        }

        .auth-orange-panel {
          display: none;
        }

        .auth-form-panel {
          width: 100%;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        .auth-mobile-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 24px;
          background: linear-gradient(135deg, #E67E22 0%, #C0392B 100%);
          flex-shrink: 0;
        }

        .auth-form-scroll {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
        }

        @media (min-width: 1024px) {
          .auth-root {
            flex-direction: row;
          }

          .auth-orange-panel {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            width: 40%;
            flex-shrink: 0;
            position: relative;
            padding: 64px;
            overflow: hidden;
            background: linear-gradient(135deg, #E67E22 0%, #C0392B 100%);
          }

          .auth-mobile-header {
            display: none;
          }

          .auth-form-panel {
            width: 60%;
            flex-direction: row;
            min-height: 100vh;
          }

          .auth-form-scroll {
            padding: 48px;
          }
        }

        /* Geoapify Custom Styling */
        .geoapify-autocomplete-input {
          box-sizing: border-box !important;
          display: block !important;
          width: 100% !important;
          height: 48px !important;
          padding: 0 16px 0 48px !important;
          background-color: rgb(250 250 250 / 0.5) !important;
          border: 1px solid rgb(228 228 231) !important;
          border-radius: 12px !important;
          font-size: 14px !important;
          transition: all 0.2s !important;
          outline: none !important;
        }

        .geoapify-autocomplete-input::placeholder {
          color: #a1a1aa !important;
        }

        .geoapify-autocomplete-input:focus {
          border-color: #E67E22 !important;
          box-shadow: 0 0 0 2px rgba(230, 126, 34, 0.2) !important;
          background-color: #fff !important;
        }

        .geoapify-autocomplete-items {
          background-color: white !important;
          border: 1px solid rgb(228 228 231) !important;
          border-radius: 12px !important;
          margin-top: 8px !important;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1) !important;
          overflow: hidden !important;
          z-index: 50 !important;
        }

        .geoapify-autocomplete-item {
          padding: 10px 16px !important;
          font-size: 13px !important;
        }

        .geoapify-autocomplete-item.active {
          background-color: rgb(250 250 250) !important;
          color: #E67E22 !important;
        }
      `}</style>

      <div className="auth-root">
        {/* Desktop Left Panel */}
        <motion.div
          className="auth-orange-panel"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
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
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            style={{ position: 'relative', zIndex: 10 }}
          >
            <img
              src={toAbsoluteUrl('/media/illustrations/housemates.png')}
              alt="Housemates"
              style={{ width: '100%', maxWidth: 790, height: 'auto', marginBottom: -38, marginLeft: -60, display: 'block' }}
            />
            <h1 style={{ fontSize: 'clamp(2rem, 3vw, 3rem)', fontWeight: 900, color: 'white', lineHeight: 1.2, margin: 0 }}>
              Start your household<br />journey with us. 🔑
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', marginTop: 20, maxWidth: 400 }}>
              Create a space for your housemates, manage bills effortlessly, and keep everyone connected.
            </p>
          </motion.div>


          {/* Decorative blobs */}
          <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', filter: 'blur(60px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '10%', left: '-8%', width: 220, height: 220, borderRadius: '50%', background: 'rgba(0,0,0,0.08)', filter: 'blur(48px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, opacity: 0.05, pointerEvents: 'none' }}>
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="signup-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#signup-grid)" />
            </svg>
          </div>
        </motion.div>

        {/* Form Panel */}
        <motion.div
          className="auth-form-panel"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Mobile Header */}
          <div className="auth-mobile-header">
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 52, height: 52, borderRadius: 13,
              background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
              padding: 9, border: '1px solid rgba(255,255,255,0.3)', flexShrink: 0,
            }}>
              <img
                src={toAbsoluteUrl('/logo-white.png')}
                alt="Roofly"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={(e) => { (e.target as HTMLImageElement).src = toAbsoluteUrl('/roofly-logo.svg'); }}
              />
            </div>
            <span style={{ fontSize: 29, fontWeight: 400, color: 'white', fontFamily: "'Zolo', sans-serif", letterSpacing: '0.5px' }}>roofly</span>
          </div>

          <div className="auth-form-scroll overflow-y-auto">
            <div className="w-full max-w-lg space-y-8">
              <div className="flex flex-col gap-2">
                <Link to="/login" className="flex items-center gap-1.5 text-sm font-bold text-zinc-500 hover:text-[#E67E22] transition-colors mb-2">
                  <ChevronLeft className="size-4" /> Back to Sign In
                </Link>
                <h2 className="text-3xl lg:text-4xl font-extrabold text-zinc-900 tracking-tight">
                  Create Your Household.
                </h2>
                <p className="text-zinc-500 text-base">
                  Sign up as an admin to start managing your home.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                {/* First Name */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 uppercase tracking-wider">First Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-zinc-400 group-focus-within:text-[#E67E22] transition-colors z-10" />
                    <input
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="block w-full pl-12 pr-4 py-3 bg-zinc-50/50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E67E22]/20 focus:border-[#E67E22] transition-all"
                    />
                  </div>
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 uppercase tracking-wider">Last Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-zinc-400 group-focus-within:text-[#E67E22] transition-colors z-10" />
                    <input
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="block w-full pl-12 pr-4 py-3 bg-zinc-50/50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E67E22]/20 focus:border-[#E67E22] transition-all"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 uppercase tracking-wider">Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-zinc-400 group-focus-within:text-[#E67E22] transition-colors z-10" />
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="block w-full pl-12 pr-4 py-3 bg-zinc-50/50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E67E22]/20 focus:border-[#E67E22] transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 uppercase tracking-wider">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-zinc-400 group-focus-within:text-[#E67E22] transition-colors z-10" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="block w-full pl-12 pr-4 py-3 bg-zinc-50/50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E67E22]/20 focus:border-[#E67E22] transition-all"
                    />
                  </div>
                </div>

                {/* Household Info Section */}
                <div className="md:col-span-2 pt-2 pb-1">
                  <div className="flex items-center gap-2">
                    <div className="h-px grow bg-zinc-100"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Household Details</span>
                    <div className="h-px grow bg-zinc-100"></div>
                  </div>
                </div>

                {/* House Name */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 uppercase tracking-wider">House Name</label>
                  <div className="relative group">
                    <Home className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-zinc-400 group-focus-within:text-[#E67E22] transition-colors z-10" />
                    <input
                      type="text"
                      placeholder="e.g. The Green House"
                      value={houseName}
                      onChange={(e) => setHouseName(e.target.value)}
                      required
                      className="block w-full pl-12 pr-4 py-3 bg-zinc-50/50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E67E22]/20 focus:border-[#E67E22] transition-all"
                    />
                  </div>
                </div>

                {/* House Address (Geoapify Autocomplete) */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 uppercase tracking-wider">House Address</label>
                  <div className="relative group geoapify-container">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-zinc-400 group-focus-within:text-[#E67E22] transition-colors z-10" />
                    <GeoapifyContext apiKey={import.meta.env.VITE_GEOAPIFY_API_KEY}>
                      <GeoapifyGeocoderAutocomplete
                        placeholder="Search address..."
                        lang="en"
                        limit={5}
                        placeSelect={(value) => {
                          const addr = value?.properties?.formatted || '';
                          setAddress(addr);
                        }}
                      />
                    </GeoapifyContext>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="md:col-span-2 pt-4">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-6 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70"
                    style={{
                      backgroundColor: orangeColor,
                      color: 'white',
                      boxShadow: `0 8px 25px ${orangeColor}40`,
                    }}
                  >
                    {isLoading ? (
                      <><Loader2 className="size-5 animate-spin" /> Creating Account...</>
                    ) : (
                      <>Create My Household <ArrowRight className="size-5" /></>
                    )}
                  </Button>
                </div>

                <div className="md:col-span-2 relative py-2">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-zinc-100" />
                  </div>
                  <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest">
                    <span className="bg-white px-6 text-zinc-400">Already have a Roofly Key?</span>
                  </div>
                </div>

                <Link to="/join" className="block md:col-span-2 w-full">
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-base border-2 transition-all active:scale-[0.98] hover:shadow-lg"
                    style={{ borderColor: orangeColor, color: orangeColor, background: 'rgba(230,126,34,0.05)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = orangeColor; (e.currentTarget as HTMLButtonElement).style.color = 'white'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(230,126,34,0.05)'; (e.currentTarget as HTMLButtonElement).style.color = orangeColor; }}
                  >
                    <Home className="size-5" />
                    Join a House
                  </button>
                </Link>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
