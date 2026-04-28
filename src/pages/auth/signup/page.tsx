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
          flex-shrink: 0;
        }

        .auth-form-scroll {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 16px 24px 40px;
          gap: 40px;
          overflow-y: auto;
        }

        .auth-form-card {
          width: 100%;
          max-width: 500px;
          background: #fffaf5;
          border-radius: 32px;
          padding: 44px 32px;
          box-shadow: 0 30px 60px rgba(0,0,0,0.12);
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
            background: #fffaf5;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: row;
            overflow-y: hidden;
          }

          .auth-form-card {
            background: transparent;
            padding: 0;
            border-radius: 0;
            box-shadow: none;
            max-width: none;
            display: flex;
            justify-content: center;
          }

          .auth-form-inner {
            width: 100%;
            max-width: 550px;
          }

          .join-bottom-bar-wrapper {
            position: fixed;
            bottom: 0;
            right: 0;
            width: 60%;
            display: flex;
            justify-content: center;
            z-index: 50;
            pointer-events: none;
          }

          .join-bottom-bar {
            width: 90%;
            max-width: 1790px;
            height: 80px;
            background: #769b8a;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 24px;
            padding: 0 32px;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            text-decoration: none;
            border-radius: 24px 24px 0 0;
            box-shadow: 0 -10px 30px rgba(0,0,0,0.1);
            pointer-events: auto;
          }

          .join-bottom-bar:hover {
            height: 90px;
            background: #6a8c7c;
          }

          .join-bar-logo {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(12px);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(255, 255, 255, 0.3);
            padding: 8px;
          }

          .join-bar-text {
            color: white;
            font-weight: 800;
            font-size: 16px;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            opacity: 0.95;
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

      <div className="auth-root gradient-sunset relative overflow-hidden">
        {/* Mobile-only background effects */}
        <div className="lg:hidden absolute inset-0 grid-pattern opacity-30 pointer-events-none" />
        <div className="lg:hidden absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/20 blur-3xl pulse-glow pointer-events-none" />
        <div className="lg:hidden absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-black/10 blur-3xl pulse-glow pointer-events-none" />
        {/* Desktop Left Panel */}
        <motion.div
          className="auth-orange-panel gradient-sunset relative overflow-hidden"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />

          {/* Decorative glowing blobs */}
          <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-white/20 blur-3xl pulse-glow pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-black/10 blur-3xl pulse-glow pointer-events-none" />
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
            <div className="w-full max-w-[500px] mx-auto flex items-center justify-between">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 52, height: 52, borderRadius: 14,
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
                <span style={{ fontSize: 32, fontWeight: 400, color: 'white', fontFamily: "'Zolo', sans-serif", letterSpacing: '0.5px' }}>roofly</span>
              </div>

              <Link to="/join" style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  padding: '10px 20px',
                  borderRadius: '100px',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Home className="size-4" />
                  Join a house
                </div>
              </Link>
            </div>
          </div>

          <div className="auth-form-scroll">
            <div className="auth-form-card">
              <div className="auth-form-inner space-y-8">
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

                </form>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Desktop bottom bar */}
      <div className="hidden lg:flex join-bottom-bar-wrapper">
        <Link to="/join" className="join-bottom-bar">
          <div className="join-bar-logo">
            <img
              src={toAbsoluteUrl('/logo-white.png')}
              alt="Roofly"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => { (e.target as HTMLImageElement).src = toAbsoluteUrl('/roofly-logo.svg'); }}
            />
          </div>
          <div className="join-bar-text">
            JOIN WITH ROOFLY KEY
          </div>
        </Link>
      </div>
    </>
  );
}
