import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../Images/no-bg-logo.png";
import { createClient } from "@supabase/supabase-js";

type UserRole = "super_admin" | "admin" | "user";

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const Login: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [is2FAStep, setIs2FAStep] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);

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

  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateEmail(email)) return alert("Invalid email format.");
    if (password !== confirmPassword) return alert("Passwords do not match.");

    try {
      // Clear any existing session to prevent conflicts
      await supabase.auth.signOut();

      // Sign up user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error("SignUp Error:", JSON.stringify(error, null, 2));
        if (error.message.includes("User already registered")) {
          throw new Error(
            "This email is already registered. Please log in or use a different email."
          );
        }
        throw error;
      }
      if (!data.user) throw new Error("No user data returned after signup");

      // Log user data for debugging
      console.log("SignUp User:", JSON.stringify(data.user, null, 2));

      // Check for active session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Session Error:", JSON.stringify(sessionError, null, 2));
        throw sessionError;
      }

      // Log session data for debugging
      console.log("Session Data:", JSON.stringify(session, null, 2));

      if (!session) {
        // No session (likely auto-confirmation disabled)
        console.warn("No active session; email confirmation may be required");
        alert(
          "Registration successful! Please check your Gmail inbox (including Spam/Promotions) for a confirmation email. If not received, try resending after attempting to log in."
        );
        setIsRegistering(false);
        formRef.current?.reset();
        return;
      }

      // Insert user profile in "users" table
      const { error: insertError } = await supabase.from("users").insert([
        {
          user_id: data.user.id,
          name: fullName,
          email: email,
          role: "user",
          device_token: "",
        },
      ]);

      if (insertError) {
        console.error(
          "Insert Error Details:",
          JSON.stringify(insertError, null, 2)
        );
        throw insertError;
      }

      alert("Registration successful!");
      setIsRegistering(false);
      formRef.current?.reset();
    } catch (err: any) {
      console.error("Registration Error:", JSON.stringify(err, null, 2));
      alert("Error during registration: " + err.message);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("SignIn Error:", JSON.stringify(error, null, 2));
        if (error.message.includes("Email not confirmed")) {
          setShowResendConfirmation(true);
          throw new Error(
            "Email not confirmed. Please check your Gmail inbox (including Spam/Promotions) for the confirmation email or resend it."
          );
        }
        throw error;
      }

      if (!data.user) throw new Error("No user returned");

      // Query user profile from "users" table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("user_id", data.user.id);

      if (userError) {
        console.error("User Query Error:", JSON.stringify(userError, null, 2));
        throw userError;
      }

      let role: UserRole = "user"; // Default role

      if (userData.length === 0) {
        // No profile exists; insert one
        const { error: insertError } = await supabase.from("users").insert([
          {
            user_id: data.user.id,
            name: fullName || "Default Name",
            email: email,
            role: "user",
            device_token: "",
          },
        ]);
        if (insertError) {
          console.error(
            "Insert Error Details:",
            JSON.stringify(insertError, null, 2)
          );
          throw insertError;
        }
      } else if (userData.length > 1) {
        // Multiple profiles found; log error and use first role
        console.error(`Multiple profiles found for user_id: ${data.user.id}`);
        role = userData[0].role as UserRole;
      } else {
        // Single profile found
        role = userData[0].role as UserRole;
      }

      localStorage.setItem("userRole", role);

      if (role === "user") {
        setIs2FAStep(true);
        setCooldown(30);
      } else if (role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/super-admin-dashboard");
      }

      formRef.current?.reset();
    } catch (err: any) {
      console.error("Login Error:", JSON.stringify(err, null, 2));
      alert("Login failed: " + err.message);
    }
  };

  const handleResendConfirmation = async () => {
    if (!validateEmail(email)) return alert("Please enter a valid email.");
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) {
        console.error("Resend Error:", JSON.stringify(error, null, 2));
        throw error;
      }
      alert(
        "Confirmation email resent! Check your Gmail inbox (including Spam/Promotions)."
      );
      setCooldown(30);
    } catch (err: any) {
      console.error("Resend Error:", JSON.stringify(err, null, 2));
      alert(
        "Failed to resend confirmation: " +
          (err.message ||
            "Unknown error. Please try again or check Supabase settings.")
      );
    }
  };

  const handle2FASubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!otpCode.trim()) return alert("Enter the OTP code.");

    const role = localStorage.getItem("userRole") as UserRole;
    switch (role) {
      case "super_admin":
        navigate("/super-admin-dashboard");
        break;
      case "admin":
        navigate("/admin-dashboard");
        break;
      default:
        navigate("/dashboard");
    }

    setOtpCode("");
  };

  const handleResendCode = () => {
    if (cooldown === 0) {
      alert("Code resent!");
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
          onSubmit={
            is2FAStep
              ? handle2FASubmit
              : isRegistering
              ? handleRegisterSubmit
              : handleLoginSubmit
          }
        >
          <h1 className="text-2xl md:text-3xl font-semibold text-center mb-2 uppercase tracking-widest">
            {is2FAStep
              ? "One Time Password"
              : isRegistering
              ? "Register"
              : "Login"}
          </h1>
          <p className="text-xs text-[#bd4d22] text-center mb-6">
            {is2FAStep
              ? "Enter the code sent to your mobile number"
              : isRegistering
              ? "Create your CALASAG account"
              : "Secure Access to CALASAG"}
          </p>

          {!is2FAStep ? (
            <>
              <div className="mb-4">
                <input
                  className="input"
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
                      className="input"
                      type="text"
                      placeholder="Username"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div className="mb-4">
                    <input
                      className="input"
                      type="text"
                      placeholder="Full Name"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="mb-4">
                    <input
                      className="input"
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
                  className="input"
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
                    className="input"
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
                  className="input"
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
                  className={`text-sm text-[#005524] hover:underline ${
                    cooldown > 0 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  Resend Code {cooldown > 0 && `(${cooldown}s)`}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIs2FAStep(false);
                    formRef.current?.reset();
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
            {is2FAStep ? "Verify Code" : isRegistering ? "Register" : "Login"}
          </button>

          {!is2FAStep && (
            <>
              {showResendConfirmation && !isRegistering && (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={cooldown > 0}
                    className={`text-sm text-[#005524] hover:underline ${
                      cooldown > 0 ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    Resend Confirmation Email {cooldown > 0 && `(${cooldown}s)`}
                  </button>
                </div>
              )}
              <p className="text-sm text-center mt-6 text-gray-800">
                {isRegistering
                  ? "Already have an account?"
                  : "Don't have an account?"}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    setShowResendConfirmation(false);
                    formRef.current?.reset();
                  }}
                  className="text-[#f9a01b] hover:text-[#F9C835] hover:underline ml-1"
                >
                  {isRegistering ? "Login" : "Register"}
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
