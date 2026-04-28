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
          background: #fff;
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
          gap: 12px;
          padding: 20px 24px;
          background: linear-gradient(135deg, #E67E22 0%, #C0392B 100%);
          flex-shrink: 0;
        }

        .login-form-scroll {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
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
            background: linear-gradient(135deg, #E67E22 0%, #C0392B 100%);
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
          }
        }
      `}</style>

      <div className="login-root">

        {/* Desktop: Left Orange Panel */}
        <motion.div
          className="login-orange-panel"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
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

          {/* Decorative blobs */}
          <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', filter: 'blur(60px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '10%', left: '-8%', width: 220, height: 220, borderRadius: '50%', background: 'rgba(0,0,0,0.08)', filter: 'blur(48px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, opacity: 0.08, pointerEvents: 'none' }}>
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="login-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#login-grid)" />
            </svg>
          </div>
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

          {/* Form content */}
          <div className="login-form-scroll">
            <div className="w-full max-w-md space-y-8">
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
                  <label htmlFor="email" className="text-sm font-bold text-zinc-700 uppercase tracking-wider">
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
                  <label htmlFor="password" className="text-sm font-bold text-zinc-700 uppercase tracking-wider">
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
                  <span className="bg-white px-6 text-zinc-400">OR</span>
                </div>
              </div>

              {/* Social buttons */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleSocialLogin('facebook')}
                  disabled={isLoading}
                  className="flex justify-center items-center py-3.5 border-2 border-zinc-100 rounded-2xl hover:bg-zinc-50 hover:border-zinc-200 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Facebook className="size-6 text-[#1877F2]" />
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  className="flex justify-center items-center py-3.5 border-2 border-zinc-100 rounded-2xl hover:bg-zinc-50 hover:border-zinc-200 transition-all active:scale-95 disabled:opacity-50"
                >
                  <svg className="size-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  disabled={isLoading}
                  className="flex justify-center items-center py-3.5 border-2 border-zinc-100 rounded-2xl hover:bg-zinc-50 hover:border-zinc-200 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Chrome className="size-6 text-[#4285F4]" />
                </button>
              </div>

              {/* Join House CTA */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-zinc-100" />
                </div>
                <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest">
                  <span className="bg-white px-6 text-zinc-400">New Housemate?</span>
                </div>
              </div>

              <Link to="/join" className="block w-full">
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-base border-2 transition-all active:scale-[0.98] hover:shadow-lg"
                  style={{ borderColor: '#E67E22', color: '#E67E22', background: 'rgba(230,126,34,0.05)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#E67E22'; (e.currentTarget as HTMLButtonElement).style.color = 'white'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(230,126,34,0.05)'; (e.currentTarget as HTMLButtonElement).style.color = '#E67E22'; }}
                >
                  <Home className="size-5" />
                  Join a House
                </button>
              </Link>
            </div>
          </div>
        </motion.div>

      </div>
    </>
  );
}
