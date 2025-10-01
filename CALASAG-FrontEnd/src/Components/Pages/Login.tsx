import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../Images/no-bg-logo.png';
import { supabase, testSupabaseConnection } from '../../db'; // Adjust to './db' if db.ts is in src/Components/Pages/
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

      // 🔹 Generate full name
      const fullName = `${lastName} ${firstName} ${middleInitial}`.trim();

      console.log('Attempting signUp with email:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: fullName, role: 'user' }, // 👈 use generated name
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
        name: fullName, // 👈 store full name for compatibility
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

      // ✅ Success path
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

// ✅ Safe to check after confirming userData exists
if (data.user.email_confirmed_at && userData.status === "pending") {
  await supabase
    .from("users")
    .update({ status: "active" })
    .eq("user_id", data.user.id);

  // keep it consistent in memory
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

      resetForm();
    } catch (err: unknown) {
      const error = err as AuthError;
      console.error('Login Error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      setError(`Login failed: ${error.message || 'Unknown error'}`, { cause: error });
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
      <div className="w-full lg:w-1/2 bg-[#f8eed4] flex flex-col items-center justify-center p-8">
        <img src={logo} alt="CALASAG Logo" className="w-900 md:w-900 mb-8" />
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#005524]">
        <form
          ref={formRef}
          className="bg-[#f8eed4] p-6 md:p-8 rounded-lg shadow-xl w-full max-w-sm border border-gray-800 text-[#005524] mx-4"
          onSubmit={(e) => {
            console.log('Form submitted');
            is2FAStep ? handle2FASubmit(e) : isRegistering ? handleRegisterSubmit(e) : handleLoginSubmit(e);
          }}
        >
          <h1 className="text-2xl md:text-3xl font-semibold text-center mb-2 uppercase tracking-widest">
            {is2FAStep ? 'One Time Password' : isRegistering ? 'Register' : 'Login'}
          </h1>
          <p className="text-xs text-[#bd4d22] text-center mb-6">
            {is2FAStep
              ? 'Enter the code sent to your mobile number'
              : isRegistering
              ? 'Create your CALASAG account'
              : 'Secure Access to CALASAG'}
          </p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {!is2FAStep ? (
            <>
              <div className="mb-4">
                <input
                  className="input w-full p-2 border border-gray-300 rounded"
                  type="email"
                  placeholder="Email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {isRegistering && (
                <>
                  <div className="mb-4">
                    <input
                      className="input w-full p-2 border border-gray-300 rounded"
                      type="text"
                      placeholder="Username"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>

                  {/* 🔹 First Name */}
                  <div className="mb-4">
                    <input
                      className="input w-full p-2 border border-gray-300 rounded"
                      type="text"
                      placeholder="First Name"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>

                  {/* 🔹 Last Name */}
                  <div className="mb-4">
                    <input
                      className="input w-full p-2 border border-gray-300 rounded"
                      type="text"
                      placeholder="Last Name"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>

                  {/* 🔹 Middle Initial */}
                  <div className="mb-4">
                    <input
                      className="input w-full p-2 border border-gray-300 rounded"
                      type="text"
                      placeholder="Middle Initial"
                      maxLength={1}
                      value={middleInitial}
                      onChange={(e) => setMiddleInitial(e.target.value)}
                    />
                  </div>

                  <div className="mb-4">
                    <input
                      className="input w-full p-2 border border-gray-300 rounded"
                      type="tel"
                      placeholder="Mobile Number"
                      required
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="mb-4">
                <input
                  className="input w-full p-2 border border-gray-300 rounded"
                  type="password"
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {isRegistering && (
                <div className="mb-4">
                  <input
                    className="input w-full p-2 border border-gray-300 rounded"
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
              <div className="mb-4">
                <input
                  className="input w-full p-2 border border-gray-300 rounded"
                  type="text"
                  placeholder="Enter OTP Code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-between mb-4">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={cooldown > 0}
                  className={`text-sm text-[#005524] hover:underline ${cooldown > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                  className="text-sm text-[#005524] hover:underline"
                >
                  Back to Login
                </button>
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full bg-[#f9a01b] hover:bg-[#F9C835] text-white font-medium py-2 rounded-lg transition"
            disabled={isSubmitting}
          >
            {is2FAStep ? 'Verify Code' : isRegistering ? 'Register' : 'Login'}
          </button>

          {!is2FAStep && (
            <>
              {showResendConfirmation && !isRegistering && (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={cooldown > 0}
                    className={`text-sm text-[#005524] hover:underline ${cooldown > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Resend Confirmation Email {cooldown > 0 && `(${cooldown}s)`}
                  </button>
                </div>
              )}
              <p className="text-sm text-center mt-6 text-gray-800">
                {isRegistering ? 'Already have an account?' : "Don't have an account?"}
                <button
                  type="button"
                  onClick={() => {
                    console.log(isRegistering ? 'Switching to login' : 'Switching to register');
                    setIsRegistering(!isRegistering);
                    resetForm();
                  }}
                  className="text-[#005524] ml-1 hover:underline"
                >
                  {isRegistering ? 'Login' : 'Register'}
                </button>
              </p>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
