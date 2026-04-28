import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Home,
  ArrowRight,
  Facebook,
  Chrome,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { toAbsoluteUrl } from '@/lib/helpers';
import { supabase } from '@/lib/supabase';

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const orangeColor = '#E67E22';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error('Authentication failed', {
          description: error.message,
        });
      } else {
        toast.success('Successfully signed in!', {
          description: 'Welcome back to Roofly.',
        });
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error('Social login failed', {
        description: err.message,
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign In — Roofly</title>
      </Helmet>

      {/* Responsive styles */}
      <style>{`
        .login-root {
          display: flex;
          min-height: 100vh;
          width: 100%;
        }

        /* Mobile: stack vertically, orange panel hidden */
        .login-orange-panel {
          display: none;
        }

        .login-form-panel {
          width: 100%;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        /* Mobile orange header bar */
        .login-mobile-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px;
          flex-shrink: 0;
          position: relative;
          z-index: 20;
        }

        .login-form-scroll {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 16px 24px 40px;
          gap: 40px;
          overflow-y: auto;
        }

        .login-form-card {
          width: 100%;
          max-width: 500px;
          background: #fff;
          border-radius: 32px;
          padding: 44px 32px;
          box-shadow: 0 30px 60px rgba(0,0,0,0.12);
        }

        .login-mobile-footer {
          width: 100%;
          max-width: 500px;
          display: flex;
          flex-direction: row;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
          padding-top: 32px;
        }

        .login-illustration-mobile {
          width: 42%;
          max-width: 180px;
          height: auto;
          flex-shrink: 0;
          margin-bottom: -10px;
        }

        /* Desktop (≥1024px): 40/60 split — matching signup page */
        @media (min-width: 1024px) {
          .login-root {
            flex-direction: row;
          }

          .login-orange-panel {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            width: 40%;
            flex-shrink: 0;
            position: relative;
            padding: 64px;
            overflow: hidden;
          }

          .login-mobile-header {
            display: none;
          }

          .login-form-panel {
            width: 60%;
            flex-direction: row;
            min-height: 100vh;
          }

          .login-form-scroll {
            padding: 48px;
            background: #fffaf5;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: row;
            overflow-y: hidden;
          }

          .login-mobile-footer {
            display: none;
          }

          .login-form-card {
            background: transparent;
            padding: 0;
            border-radius: 0;
            box-shadow: none;
            max-width: none;
            display: flex;
            justify-content: center;
          }

          .login-form-inner {
            width: 100%;
            max-width: 480px;
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
      `}</style>

      <div className="login-root gradient-sunset relative overflow-hidden">
        {/* Mobile-only background effects */}
        <div className="lg:hidden absolute inset-0 grid-pattern opacity-30 pointer-events-none" />
        <div className="lg:hidden absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/20 blur-3xl pulse-glow pointer-events-none" />
        <div className="lg:hidden absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-black/10 blur-3xl pulse-glow pointer-events-none" />

        {/* Desktop: Left Orange Panel */}
        <motion.div
          className="login-orange-panel gradient-sunset relative overflow-hidden"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />

          {/* Decorative glowing blobs */}
          <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-white/20 blur-3xl pulse-glow pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-black/10 blur-3xl pulse-glow pointer-events-none" />
          {/* Logo */}
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

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            style={{ position: 'relative', zIndex: 10 }}
          >
            <img
              src={toAbsoluteUrl('/media/illustrations/person-laptop.png')}
              alt="Person working on laptop"
              style={{ width: '100%', maxWidth: 750, height: 'auto', marginBottom: 28, marginLeft: -100, display: 'block' }}
            />
            <h1 style={{ fontSize: 'clamp(2rem, 3vw, 3rem)', fontWeight: 900, color: 'white', lineHeight: 1.2, margin: 0 }}>
              Spend less time managing,<br />More time Living. 🏠
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', marginTop: 20, maxWidth: 500 }}>
              A smarter way to organize your shared space. Coordinate bills, tasks, and inventory in one seamless experience designed for modern households.
            </p>
          </motion.div>
        </motion.div>

        {/* Form Panel — contains mobile header + scrollable form */}
        <motion.div
          className="login-form-panel"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Mobile-only orange header */}
          <div className="login-mobile-header">
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

          {/* Form content */}
          <div className="login-form-scroll">
            <div className="login-form-card">
              <div className="login-form-inner space-y-8">
                <div className="space-y-2">
                  <h2 className="text-3xl lg:text-4xl font-extrabold text-zinc-900 tracking-tight">
                    Sign In To Your Account.
                  </h2>
                  <p className="text-zinc-500 text-base lg:text-lg">
                    Let's sign in to your account and get started.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="hidden lg:block text-sm font-bold text-zinc-700 uppercase tracking-wider">
                      Email Address
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-[#E67E22] transition-colors">
                        <Mail className="size-5" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        placeholder="email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="block w-full pl-12 pr-4 py-3.5 bg-zinc-50/50 border border-zinc-200 rounded-2xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#E67E22]/20 focus:border-[#E67E22] transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="hidden lg:block text-sm font-bold text-zinc-700 uppercase tracking-wider">
                      Password
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-[#E67E22] transition-colors">
                        <Lock className="size-5" />
                      </div>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="block w-full pl-12 pr-12 py-3.5 bg-zinc-50/50 border border-zinc-200 rounded-2xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#E67E22]/20 focus:border-[#E67E22] transition-all disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors disabled:opacity-50"
                      >
                        {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Sign In Button */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-6 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70"
                    style={{
                      backgroundColor: '#E67E22',
                      color: 'white',
                      boxShadow: '0 10px 30px #E67E2240',
                    }}
                  >
                    {isLoading ? (
                      <><Loader2 className="size-5 animate-spin" /> Signing in...</>
                    ) : (
                      <>Sign In <ArrowRight className="size-5" /></>
                    )}
                  </Button>

                  <div className="space-y-3 text-center">
                    <p className="text-sm text-zinc-500 font-medium">
                      Don't have an account?{' '}
                      <Link to="/signup" className="font-bold hover:underline" style={{ color: '#E67E22' }}>
                        Sign Up
                      </Link>
                    </p>
                    <Link to="/forgot-password" className="block text-sm font-bold hover:underline" style={{ color: '#E67E22' }}>
                      Forgot Password
                    </Link>
                  </div>
                </form>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-zinc-100" />
                  </div>
                  <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest">
                    <span className="bg-[#fffaf5] px-6 text-zinc-400">OR</span>
                  </div>
                </div>

                {/* Social buttons */}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('facebook')}
                    disabled={isLoading}
                    className="flex justify-center items-center py-4 border border-zinc-100 rounded-2xl hover:bg-zinc-50 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Facebook className="size-6 text-[#1877F2]" />
                  </button>
                  <button
                    type="button"
                    disabled={isLoading}
                    className="flex justify-center items-center py-4 border border-zinc-100 rounded-2xl hover:bg-zinc-50 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <svg className="size-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('google')}
                    disabled={isLoading}
                    className="flex justify-center items-center py-4 border border-zinc-100 rounded-2xl hover:bg-zinc-50 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Chrome className="size-6 text-[#4285F4]" />
                  </button>
                </div>

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
