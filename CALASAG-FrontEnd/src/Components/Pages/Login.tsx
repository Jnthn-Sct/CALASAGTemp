import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../Images/no-bg-logo.png';
import { supabase, testSupabaseConnection } from '../../db';
import { AuthError } from '@supabase/supabase-js';

type UserRole = 'super_admin' | 'admin' | 'user';

const Login: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [mobileNumber, setMobileNumber] = useState('');
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    console.log('Login component mounted');
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const resetForm = () => {
    setEmail('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setMiddleInitial('');
    setMobileNumber('');
    setError(null);
    setShowResendConfirmation(false);
    setIsSubmitting(false);
    formRef.current?.reset();
  };

  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    console.log('Starting registration for:', email);

    if (!validateEmail(email)) {
      setError('Invalid email format.');
      setIsSubmitting(false);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('Signing out any existing session');
      await supabase.auth.signOut();

      const fullName = `${lastName} ${firstName} ${middleInitial}`.trim();

      console.log('Attempting signUp with email:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: fullName, role: 'user' },
        },
      });

      if (error) {
        console.error('SignUp Error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        throw new Error(`Registration failed: ${error.message || 'Unknown error'}`);
      }
      if (!data.user) {
        throw new Error('No user data returned after signup');
      }

      console.log('SignUp User:', JSON.stringify(data.user, null, 2));

      console.log('Upserting user profile into public.users');
      const { error: upsertError } = await supabase.from('users').upsert({
        user_id: data.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        middle_initial: middleInitial,
        name: fullName,
        role: 'user',
        status: data.user.email_confirmed_at ? 'active' : 'pending',
        device_token: mobileNumber || ''
      });

      if (upsertError) {
        console.error('Upsert Error:', JSON.stringify(upsertError, Object.getOwnPropertyNames(upsertError), 2));
        throw new Error(`Upsert failed: ${upsertError.message || 'Unknown error'}`);
      }

      setError(null);
      alert('✅ Registration successful! Please check your email (including Spam/Promotions) to confirm your account.');
      setIsRegistering(false);
      resetForm();
    } catch (err: unknown) {
      const error = err as AuthError;
      console.error('Registration Error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      setError(
        error.message.includes('User already registered')
          ? 'This email is already registered. Please log in or use a different email.'
          : `Error during registration: ${error.message || 'Unknown error'}`
      );
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    console.log('Form submitted for login with email:', email);
    console.log('Environment Variables:', {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'undefined',
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
        ? 'present (length: ' + import.meta.env.VITE_SUPABASE_ANON_KEY.length + ')'
        : 'undefined',
    });

    try {
      console.log('Attempting signIn with email:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Sign-in response:', { data, error });

      if (error) {
        console.error('SignIn Error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        if (error.message.includes('Email not confirmed')) {
          setShowResendConfirmation(true);
          throw new Error(
            'Email not confirmed. Please check your email (including Spam/Promotions) or resend the confirmation link.'
          );
        }
        throw new Error(`Login failed: ${error.message || 'Unknown error'}`);
      }

      if (!data.user) {
        console.error('No user returned after sign-in');
        throw new Error('No user returned');
      }

      console.log('Signed-in User:', JSON.stringify(data.user, null, 2));

      console.log('Fetching user profile from public.users for user_id:', data.user.id);
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_id, email, name, role, status, avatar, device_token')
        .eq('user_id', data.user.id)
        .single();

      if (userError) {
        console.error('User Query Error:', JSON.stringify(userError, Object.getOwnPropertyNames(userError), 2));
        throw new Error(`User query failed: ${userError.message || 'Unknown error'}`);
      }

      if (!userData) {
        console.error('No user profile found in public.users for user_id:', data.user.id);
        throw new Error('User profile not found in users table');
      }

      if (userData.status === 'inactive') {
        await supabase.auth.signOut();
        setError('Your account is inactive. Please contact an administrator.');
        setIsSubmitting(false);
        return;
      }
      if (data.user.email_confirmed_at && userData.status === "pending") {
        await supabase
          .from("users")
          .update({ status: "active" })
          .eq("user_id", data.user.id);

        userData.status = "active";
      }

      console.log('User Profile:', JSON.stringify(userData, null, 2));

      const userProfile = {
        id: userData.user_id,
        name: userData.name || 'Default Name',
        email: userData.email,
        role: userData.role as UserRole,
      };

      console.log('Storing user profile in localStorage:', JSON.stringify(userProfile, null, 2));
      localStorage.setItem('user', JSON.stringify(userProfile));
      localStorage.setItem('userRole', userData.role);

      setError(null);
      console.log('User role:', userData.role);
      await testSupabaseConnection();
      if (userData.role === 'user') {
        console.log('Redirecting to /dashboard');
        navigate('/dashboard');
      } else if (userData.role === 'admin') {
        console.log('Redirecting to /admin-dashboard');
        navigate('/admin-dashboard');
      } else if (userData.role === 'super_admin') {
        console.log('Redirecting to /super-admin-dashboard');
        navigate('/super-admin-dashboard');
      } else {
        console.error('Unknown role:', userData.role);
        throw new Error('Unknown user role');
      }

      await supabase
        .from("users")
        .update({ last_login: new Date().toISOString() })
        .eq("user_id", data.user.id);

      resetForm();

    } catch (err: unknown) {
      const error = err as AuthError;
      console.error('Login Error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      setError(`${error.message || 'Unknown error'}`);
      setIsSubmitting(false);
    }
  };

  const handleResendConfirmation = async () => {
    console.log('Resending confirmation email for:', email);
    if (!validateEmail(email)) {
      setError('Please enter a valid email.');
      return;
    }
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (error) {
        console.error('Resend Error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        throw new Error(`Resend failed: ${error.message || 'Unknown error'}`);
      }
      setError(null);
      alert('Confirmation email resent! Check your email (including Spam/Promotions).');
    } catch (err: unknown) {
      const error = err as AuthError;
      console.error('Resend Error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      setError(`Failed to resend confirmation: ${error.message || 'Unknown error'}`);
    }
  };


  return (
    <div className="min-h-screen h-screen w-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Left Side - Logo */}
      <div className="w-full lg:w-1/2 bg-[#FAFAFA] flex flex-col items-center justify-center p-8">
        <img src={logo} alt="CALASAG Logo" className="w-900 md:w-900 mb-8" />
      </div>

      {/* Right Side - Form with Animated Background */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#2B2B2B] relative overflow-hidden p-4">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Glowing Orbs */}
          <div
            className="absolute w-96 h-96 rounded-full blur-3xl opacity-20"
            style={{
              background: 'radial-gradient(circle, #FFD166 0%, transparent 70%)',
              top: '10%',
              left: '10%',
              animation: 'float-orb 8s ease-in-out infinite'
            }}
          />
          <div
            className="absolute w-80 h-80 rounded-full blur-3xl opacity-15"
            style={{
              background: 'radial-gradient(circle, #005524 0%, transparent 70%)',
              bottom: '10%',
              right: '10%',
              animation: 'float-orb-reverse 10s ease-in-out infinite'
            }}
          />

          {/* Animated Particles */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-[#FFD166] rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animation: `particle-float ${5 + Math.random() * 10}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 5}s`,
                  opacity: 0.3
                }}
              />
            ))}
          </div>
        </div>

        {/* Form Container */}
        <div className="relative z-10 w-full max-w-md h-full flex items-center justify-center py-4">
          <div className="w-full max-h-full overflow-y-auto scrollbar-hide">
            <form
              key={isRegistering ? 'register' : 'login'}
              ref={formRef}
              className="backdrop-blur-xl bg-white/10 p-5 md:p-6 rounded-2xl shadow-2xl w-full border border-white/20 text-white transition-all duration-700 ease-out"
              onSubmit={(e) => {
                console.log('Form submitted');
                isRegistering ? handleRegisterSubmit(e) : handleLoginSubmit(e);
              }}
              style={{
                animation: 'scale-fade-in 0.6s ease-out',
                boxShadow: '0 8px 32px 0 rgba(255, 209, 102, 0.15)'
              }}
            >
              <h1
                className="text-xl md:text-2xl font-bold text-center mb-1 uppercase tracking-wide text-[#FAFAFA]"
                style={{
                  animation: 'glow-pulse 2s ease-in-out infinite',
                  textShadow: '0 0 20px rgba(255, 209, 102, 0.5)'
                }}
              >
                {isRegistering ? 'Register' : 'Login'}
              </h1>
              <p
                className="text-xs text-white/70 text-center mb-4"
                style={{ animation: 'fade-in 0.8s ease-out 0.2s backwards' }}
              >
                {isRegistering
                  ? 'Create your CALASAG account'
                  : 'Secure Access to CALASAG'}
              </p>

              {error && (
                <div
                  className="bg-red-500/20 backdrop-blur-sm border border-red-400/50 text-red-200 px-3 py-2 rounded-lg mb-3 text-sm"
                  style={{ animation: 'bounce-in 0.5s ease-out' }}
                >
                  {error}
                </div>
              )}

              <div className="mb-3" style={{ animation: 'slide-up 0.6s ease-out 0.3s backwards' }}>
                <input
                  className="w-full p-2.5 text-sm bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/50 transition-all duration-300 focus:bg-white/20 focus:border-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#FAFAFA]/50"
                  type="email"
                  placeholder="Email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {isRegistering && (
                <>
                  <div className="mb-3" style={{ animation: 'slide-up 0.6s ease-out 0.35s backwards' }}>
                    <input
                      className="w-full p-2.5 text-sm bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/50 transition-all duration-300 focus:bg-white/20 focus:border-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#FAFAFA]/50"
                      type="text"
                      placeholder="Username"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div style={{ animation: 'slide-up 0.6s ease-out 0.4s backwards' }}>
                      <input
                        className="w-full p-2.5 text-sm bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/50 transition-all duration-300 focus:bg-white/20 focus:border-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#FAFAFA]/50"
                        type="text"
                        placeholder="First Name"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>

                    <div style={{ animation: 'slide-up 0.6s ease-out 0.45s backwards' }}>
                      <input
                        className="w-full p-2.5 text-sm bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/50 transition-all duration-300 focus:bg-white/20 focus:border-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#FAFAFA]/50"
                        type="text"
                        placeholder="Last Name"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mb-3" style={{ animation: 'slide-up 0.6s ease-out 0.5s backwards' }}>
                    <input
                      className="w-full p-2.5 text-sm bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/50 transition-all duration-300 focus:bg-white/20 focus:border-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#FAFAFA]/50"
                      type="text"
                      placeholder="Middle Initial"
                      maxLength={2}
                      value={middleInitial}
                      onChange={(e) => setMiddleInitial(e.target.value)}
                    />
                  </div>

                  <div className="mb-3" style={{ animation: 'slide-up 0.6s ease-out 0.55s backwards' }}>
                    <input
                      className="w-full p-2.5 text-sm bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/50 transition-all duration-300 focus:bg-white/20 focus:border-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#FAFAFA]/50"
                      type="tel"
                      placeholder="Mobile Number"
                      required
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="mb-3" style={{ animation: `slide-up 0.6s ease-out ${isRegistering ? '0.6s' : '0.4s'} backwards` }}>
                <input
                  className="w-full p-2.5 text-sm bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/50 transition-all duration-300 focus:bg-white/20 focus:border-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#FAFAFA]/50"
                  type="password"
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {isRegistering && (
                <div className="mb-3" style={{ animation: 'slide-up 0.6s ease-out 0.65s backwards' }}>
                  <input
                    className="w-full p-2.5 text-sm bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/50 transition-all duration-300 focus:bg-white/20 focus:border-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#FAFAFA]/50"
                    type="password"
                    placeholder="Confirm Password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#FAFAFA] hover:bg-[#4ECDC4] text-[#2B2B2B] font-bold py-2.5 text-sm rounded-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  animation: `slide-up 0.6s ease-out ${isRegistering ? '0.7s' : '0.5s'} backwards`,
                  boxShadow: '0 4px 20px rgba(255, 209, 102, 0.4)'
                }}
                disabled={isSubmitting}
              >
                {isRegistering ? 'Register' : 'Login'}
              </button>

              {showResendConfirmation && !isRegistering && (
                <div className="mt-3 text-center" style={{ animation: 'fade-in 0.5s ease-out' }}>
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    className="text-sm text-[#FAFAFA] hover:text-[#4ECDC4] transition-all hover:scale-105"
                  >
                    Resend Confirmation Email
                  </button>
                </div>
              )}
              <p
                className="text-sm text-center mt-4 text-white/80"
                style={{ animation: `fade-in 0.6s ease-out ${isRegistering ? '0.75s' : '0.55s'} backwards` }}
              >
                {isRegistering ? 'Already have an account?' : "Don't have an account?"}
                <button
                  type="button"
                  onClick={() => {
                    console.log(isRegistering ? 'Switching to login' : 'Switching to register');
                    setIsRegistering(!isRegistering);
                    resetForm();
                  }}
                  className="text-[#FAFAFA] ml-1 hover:text-[#3abfb2] font-semibold transition-all hover:scale-105"
                >
                  {isRegistering ? 'Login' : 'Register'}
                </button>
              </p>
            </form>
          </div>
        </div>

        {/* Custom Animations CSS */}
        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          @keyframes float-orb {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(50px, -50px) scale(1.1); }
          }
          @keyframes float-orb-reverse {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(-50px, 50px) scale(1.15); }
          }
          @keyframes particle-float {
            0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
            10% { opacity: 0.3; }
            90% { opacity: 0.3; }
            50% { transform: translateY(-100px) translateX(50px); }
          }
          @keyframes scale-fade-in {
            0% { opacity: 0; transform: scale(0.9); }
            100% { opacity: 1; transform: scale(1); }
          }
          @keyframes glow-pulse {
            0%, 100% { text-shadow: 0 0 20px rgba(255, 209, 102, 0.5); }
            50% { text-shadow: 0 0 30px rgba(255, 209, 102, 0.8), 0 0 40px rgba(255, 209, 102, 0.4); }
          }
          @keyframes slide-up {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes fade-in {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
          @keyframes bounce-in {
            0% { opacity: 0; transform: scale(0.5); }
            50% { transform: scale(1.05); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default Login;