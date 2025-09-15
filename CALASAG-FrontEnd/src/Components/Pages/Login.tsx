import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../Images/no-bg-logo.png';
import { createClient } from '@supabase/supabase-js';

type UserRole = 'super_admin' | 'admin' | 'user';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const Login: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [is2FAStep, setIs2FAStep] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
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
    setFullName('');
    setMobileNumber('');
    setOtpCode('');
    setError(null);
    setShowResendConfirmation(false);
    formRef.current?.reset();
  };

  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Starting registration for:', email);

    if (!validateEmail(email)) {
      setError('Invalid email format.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      console.log('Signing out any existing session');
      await supabase.auth.signOut();

      console.log('Attempting signUp with email:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: fullName, role: 'user' },
        },
      });

      if (error) {
        console.error('SignUp Error:', JSON.stringify(error, null, 2));
        throw error;
      }
      if (!data.user) {
        console.error('No user data returned after signup');
        throw new Error('No user data returned');
      }

      console.log('SignUp User:', JSON.stringify(data.user, null, 2));

      console.log('Inserting user profile into public.users');
      const { error: insertError } = await supabase.from('users').insert({
        user_id: data.user.id,
        email,
        name: fullName,
        role: 'user',
        avatar: null,
        device_token: mobileNumber || '',
      });

      if (insertError) {
        console.error('Insert Error:', JSON.stringify(insertError, null, 2));
        throw insertError;
      }

      setError(null);
      alert('Registration successful! Please check your email (including Spam/Promotions) for a confirmation link.');
      setIsRegistering(false);
      resetForm();
    } catch (err: any) {
      console.error('Registration Error:', JSON.stringify(err, null, 2));
      setError(
        err.message.includes('User already registered')
          ? 'This email is already registered. Please log in or use a different email.'
          : `Error during registration: ${err.message}`
      );
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Form submitted for login with email:', email);

    try {
      console.log('Attempting signIn with email:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Sign-in response:', { data, error });

      if (error) {
        console.error('SignIn Error:', JSON.stringify(error, null, 2));
        if (error.message.includes('Email not confirmed')) {
          setShowResendConfirmation(true);
          throw new Error(
            'Email not confirmed. Please check your email (including Spam/Promotions) or resend the confirmation link.'
          );
        }
        throw error;
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
        console.error('User Query Error:', JSON.stringify(userError, null, 2));
        throw userError;
      }

      if (!userData) {
        console.error('No user profile found in public.users for user_id:', data.user.id);
        throw new Error('User profile not found in users table');
      }

      // Check if user is inactive
      if (userData.status === 'inactive') {
        console.error('Login attempt by inactive user:', userData.email);
        throw new Error('Your account is deactivated. Please contact superadmin@gmail.com.');
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
    } catch (err: any) {
      console.error('Login Error:', JSON.stringify(err, null, 2));
      setError(`Login failed: ${err.message}`);
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
        console.error('Resend Error:', JSON.stringify(error, null, 2));
        throw error;
      }
      setError(null);
      alert('Confirmation email resent! Check your email (including Spam/Promotions).');
      setCooldown(30);
    } catch (err: any) {
      console.error('Resend Error:', JSON.stringify(err, null, 2));
      setError(`Failed to resend confirmation: ${err.message}`);
    }
  };

  const handle2FASubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Submitting 2FA with OTP:', otpCode);
    if (!otpCode.trim()) {
      setError('Enter the OTP code.');
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
                  <div className="mb-4">
                    <input
                      className="input w-full p-2 border border-gray-300 rounded"
                      type="text"
                      placeholder="Full Name"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
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
                    console.log('Toggling between login and register');
                    setIsRegistering(!isRegistering);
                    setShowResendConfirmation(false);
                    resetForm();
                  }}
                  className="text-[#f9a01b] hover:text-[#F9C835] hover:underline ml-1"
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