import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../Images/no-bg-logo.png';
import { supabase, testSupabaseConnection } from '../../db';
import { AuthError } from '@supabase/supabase-js';

type UserRole = 'super_admin' | 'admin' | 'user';

const Login: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [is2FAStep, setIs2FAStep] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    console.log('Login component mounted');
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

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
    setOtpCode('');
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
        avatar: null,
        device_token: mobileNumber || '',
        notifications_enabled: true,
        email_notifications_enabled: true,
        notification_preferences: { system_reports: true, feature_updates: true },
        temp_notifications_enabled: null,
        temp_email_notifications_enabled: null,
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
  console.log('Redirecting to 2FA step');
  setIs2FAStep(true);
  setCooldown(30);
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

// ✅ Update last login timestamp
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
      setCooldown(30);
    } catch (err: unknown) {
      const error = err as AuthError;
      console.error('Resend Error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      setError(`Failed to resend confirmation: ${error.message || 'Unknown error'}`);
    }
  };

  const handle2FASubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    console.log('Submitting 2FA with OTP:', otpCode);
    if (!otpCode.trim()) {
      setError('Enter the OTP code.');
      setIsSubmitting(false);
      return;
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user.role as UserRole;
    console.log('2FA User Role:', role);

    setError(null);
    switch (role) {
      case 'super_admin':
        console.log('Redirecting to /super-admin-dashboard after 2FA');
        navigate('/super-admin-dashboard');
        break;
      case 'admin':
        console.log('Redirecting to /admin-dashboard after 2FA');
        navigate('/admin-dashboard');
        break;
      default:
        console.log('Redirecting to /dashboard after 2FA');
        navigate('/dashboard');
    }

    resetForm();
  };

  const handleResendCode = () => {
    if (cooldown === 0) {
      console.log('Resending OTP code');
      setError(null);
      alert('Code resent!');
      setCooldown(30);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Left Side - Logo */}
      <div className="w-full lg:w-1/2 bg-[#FAFAFA] flex flex-col items-center justify-center p-8">
        <img src={logo} alt="CALASAG Logo" className="w-900 md:w-900 mb-8" />
      </div>

      {/* Right Side - Form with Animated Background */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#2B2B2B] relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Animated Grid Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div 
              className="w-full h-full" 
              style={{
                backgroundImage: 'linear-gradient(#FFD166 1px, transparent 1px), linear-gradient(90deg, #FFD166 1px, transparent 1px)',
                backgroundSize: '50px 50px',
                animation: 'grid-move 20s linear infinite'
              }} 
            />
          </div>
        </div>

        {/* Shadow Effect with Animation */}
        <div
          className="absolute -z-10 pointer-events-none w-[85%] max-w-md h-[70%] rounded-2xl bg-black/30 blur-2xl opacity-70"
          style={{ 
            left: '50%', 
            transform: 'translate(-50%, 18px)',
            animation: 'pulse-shadow 3s ease-in-out infinite'
          }}
        />

        {/* Form Container with Transition */}
        <div className="relative z-10 w-full max-w-sm mx-4">
          <form
            key={isRegistering ? 'register' : is2FAStep ? '2fa' : 'login'}
            ref={formRef}
            className="bg-[#f8eed4] p-6 md:p-8 rounded-lg shadow-xl w-full border border-gray-800 text-[#005524] transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-2xl focus-within:shadow-2xl hover:ring-2 hover:ring-[#FFD166] ring-offset-2 ring-offset-[#005524]"
            onSubmit={(e) => {
              console.log('Form submitted');
              is2FAStep ? handle2FASubmit(e) : isRegistering ? handleRegisterSubmit(e) : handleLoginSubmit(e);
            }}
            style={{
              animation: 'fade-in-up 0.5s ease-out'
            }}
          >
            <h1 
              className="text-2xl md:text-3xl font-semibold text-center mb-2 uppercase tracking-widest"
              style={{ animation: 'slide-down 0.5s ease-out' }}
            >
              {is2FAStep ? 'One Time Password' : isRegistering ? 'Register' : 'Login'}
            </h1>
            <p 
              className="text-xs text-[#bd4d22] text-center mb-6" 
              style={{ animation: 'slide-down 0.5s ease-out 0.1s backwards' }}
            >
              {is2FAStep
                ? 'Enter the code sent to your mobile number'
                : isRegistering
                  ? 'Create your CALASAG account'
                  : 'Secure Access to CALASAG'}
            </p>

            {error && (
              <div 
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
                style={{ animation: 'shake 0.5s ease-in-out' }}
              >
                {error}
              </div>
            )}

            {!is2FAStep ? (
              <>
                <div className="mb-4" style={{ animation: 'slide-in 0.5s ease-out 0.2s backwards' }}>
                  <input
                    className="input w-full p-2 border border-[#005524]-300 rounded transition-all duration-300 focus:ring-2 focus:ring-[#FFD166] focus:border-transparent"
                    type="email"
                    placeholder="Email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {isRegistering && (
                  <>
                    <div className="mb-4" style={{ animation: 'slide-in 0.5s ease-out 0.25s backwards' }}>
                      <input
                        className="input w-full p-2 border border-[#005524]-300 rounded transition-all duration-300 focus:ring-2 focus:ring-[#FFD166] focus:border-transparent"
                        type="text"
                        placeholder="Username"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>

                    <div className="mb-4" style={{ animation: 'slide-in 0.5s ease-out 0.3s backwards' }}>
                      <input
                        className="input w-full p-2 border border-[#005524]-300 rounded transition-all duration-300 focus:ring-2 focus:ring-[#FFD166] focus:border-transparent"
                        type="text"
                        placeholder="First Name"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>

                    <div className="mb-4" style={{ animation: 'slide-in 0.5s ease-out 0.35s backwards' }}>
                      <input
                        className="input w-full p-2 border border-[#005524]-300 rounded transition-all duration-300 focus:ring-2 focus:ring-[#FFD166] focus:border-transparent"
                        type="text"
                        placeholder="Middle Initial"
                        maxLength={2}
                        value={middleInitial}
                        onChange={(e) => setMiddleInitial(e.target.value)}
                      />
                    </div>

                    <div className="mb-4" style={{ animation: 'slide-in 0.5s ease-out 0.4s backwards' }}>
                      <input
                        className="input w-full p-2 border border-[#005524]-300 rounded transition-all duration-300 focus:ring-2 focus:ring-[#FFD166] focus:border-transparent"
                        type="text"
                        placeholder="Last Name"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>

                    <div className="mb-4" style={{ animation: 'slide-in 0.5s ease-out 0.45s backwards' }}>
                      <input
                        className="input w-full p-2 border border-[#005524]-300 rounded transition-all duration-300 focus:ring-2 focus:ring-[#FFD166] focus:border-transparent"
                        type="tel"
                        placeholder="Mobile Number"
                        required
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className="mb-4" style={{ animation: `slide-in 0.5s ease-out ${isRegistering ? '0.5s' : '0.3s'} backwards` }}>
                  <input
                    className="input w-full p-2 border border-[#005524]-300 rounded transition-all duration-300 focus:ring-2 focus:ring-[#FFD166] focus:border-transparent"
                    type="password"
                    placeholder="Password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {isRegistering && (
                  <div className="mb-4" style={{ animation: 'slide-in 0.5s ease-out 0.55s backwards' }}>
                    <input
                      className="input w-full p-2 border border-[#005524]-300 rounded transition-all duration-300 focus:ring-2 focus:ring-[#FFD166] focus:border-transparent"
                      type="password"
                      placeholder="Confirm Password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="mb-4" style={{ animation: 'slide-in 0.5s ease-out 0.2s backwards' }}>
                  <input
                    className="input w-full p-2 border border-[#005524]-300 rounded transition-all duration-300 focus:ring-2 focus:ring-[#FFD166] focus:border-transparent text-center text-lg tracking-widest"
                    type="text"
                    placeholder="Enter OTP Code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-between mb-4" style={{ animation: 'slide-in 0.5s ease-out 0.3s backwards' }}>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={cooldown > 0}
                    className={`text-sm text-[#005524] hover:underline transition-all ${cooldown > 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                  >
                    Resend Code {cooldown > 0 && `(${cooldown}s)`}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Returning to login from 2FA');
                      setIs2FAStep(false);
                      resetForm();
                    }}
                    className="text-sm text-[#005524] hover:underline transition-all hover:scale-105"
                  >
                    Back to Login
                  </button>
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full bg-[#FFD166] hover:bg-[#F9C835] text-white font-medium py-2 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ animation: `slide-in 0.5s ease-out ${isRegistering ? '0.6s' : '0.4s'} backwards` }}
              disabled={isSubmitting}
            >
              {is2FAStep ? 'Verify Code' : isRegistering ? 'Register' : 'Login'}
            </button>

            {!is2FAStep && (
              <>
                {showResendConfirmation && !isRegistering && (
                  <div className="mt-4 text-center" style={{ animation: 'slide-in 0.5s ease-out' }}>
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      disabled={cooldown > 0}
                      className={`text-sm text-[#005524] hover:underline transition-all ${cooldown > 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                    >
                      Resend Confirmation Email {cooldown > 0 && `(${cooldown}s)`}
                    </button>
                  </div>
                )}
                <p 
                  className="text-sm text-center mt-6 text-gray-800" 
                  style={{ animation: `slide-in 0.5s ease-out ${isRegistering ? '0.65s' : '0.45s'} backwards` }}
                >
                  {isRegistering ? 'Already have an account?' : "Don't have an account?"}
                  <button
                    type="button"
                    onClick={() => {
                      console.log(isRegistering ? 'Switching to login' : 'Switching to register');
                      setIsRegistering(!isRegistering);
                      resetForm();
                    }}
                    className="text-[#005524] ml-1 hover:underline font-semibold transition-all hover:scale-105"
                  >
                    {isRegistering ? 'Login' : 'Register'}
                  </button>
                </p>
              </>
            )}
          </form>
        </div>

        {/* Custom Animations CSS */}
        <style>{`
          @keyframes float-slow {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(30px, -30px) scale(1.1); }
          }
          @keyframes float-medium {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(-40px, 40px) scale(1.15); }
          }
          @keyframes float-fast {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(20px, 30px) scale(1.2); }
          }
          @keyframes grid-move {
            0% { transform: translate(0, 0); }
            100% { transform: translate(50px, 50px); }
          }
          @keyframes pulse-shadow {
            0%, 100% { opacity: 0.7; transform: translate(-50%, 18px) scale(1); }
            50% { opacity: 0.9; transform: translate(-50%, 18px) scale(1.05); }
          }
          @keyframes fade-in-up {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes slide-down {
            0% { opacity: 0; transform: translateY(-10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes slide-in {
            0% { opacity: 0; transform: translateX(-10px); }
            100% { opacity: 1; transform: translateX(0); }
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default Login;