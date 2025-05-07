import React, { useState, useEffect, useRef } from "react";
import logo from "../Images/no-bg-logo.png";

export const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [is2FAStep, setIs2FAStep] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const formRef = useRef(null);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setIs2FAStep(true);
    setCooldown(30);
    if (formRef.current) {
      formRef.current.reset();
    }
  };

  const handle2FASubmit = (e) => {
    e.preventDefault();
    alert("2FA verified successfully!");
    setIs2FAStep(false);
    setCooldown(0);
    if (formRef.current) {
      formRef.current.reset();
    }
  };

  const handleResendCode = () => {
    if (cooldown === 0) {
      alert("2FA code resent!");
      setCooldown(30);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Left Side */}
      <div className="w-full lg:w-1/2 bg-[#f8eed4] text-white flex flex-col items-center justify-center p-8">
        <img src={logo} alt="CALASAG Logo" className="w-900 md:w-900 mb-8" />
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#005524]">
        <form
          ref={formRef}
          className="bg-[#f8eed4] backdrop-blur-md p-6 md:p-8 rounded-lg shadow-xl w-full max-w-sm border border-gray-800 text-[#f9a01b] mx-4"
          onSubmit={is2FAStep ? handle2FASubmit : handleLoginSubmit}
        >
          <h1 className="text-2xl md:text-3xl font-semibold text-center mb-2 tracking-widest uppercase">
            {is2FAStep
              ? "Two-Factor Authentication"
              : isRegistering
              ? "Register"
              : "Login"}
          </h1>
          <p className="text-xs text-[#bd4d22] text-center mb-6">
            {is2FAStep
              ? "Enter the code sent to your email/phone"
              : isRegistering
              ? "Create your CALASAG account"
              : "Secure Access to CALASAG"}
          </p>

          {!is2FAStep ? (
            <>
              <div className="mb-4">
                <input
                  className="w-full bg-[#f8eed4] text-gray-800 px-4 py-2 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#005524] placeholder-gray-600"
                  type="text"
                  placeholder="Username"
                  required
                />
              </div>

              {isRegistering && (
                <div className="mb-4">
                  <input
                    className="w-full bg-[#f8eed4] text-gray-800 px-4 py-2 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#005524] placeholder-gray-500"
                    type="tel"
                    placeholder="Mobile Number"
                    required
                  />
                </div>
              )}

              {isRegistering && (
                <div className="mb-4">
                  <input
                    className="w-full bg-[#f8eed4] text-gray-800 px-4 py-2 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#005524] placeholder-gray-500"
                    type="email"
                    placeholder="Email"
                    required
                  />
                </div>
              )}

              <div className="mb-4">
                <input
                  className="w-full bg-[#f8eed4e8] text-gray-800 px-4 py-2 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#005524] placeholder-gray-500"
                  type="password"
                  placeholder="Password"
                  required
                />
              </div>

              {isRegistering && (
                <div className="mb-4">
                  <input
                    className="w-full bg-[#f8eed48e] text-gray-800 px-4 py-2 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#005524] placeholder-gray-500"
                    type="password"
                    placeholder="Confirm Password"
                    required
                  />
                </div>
              )}

              {!isRegistering && (
                <div className="flex items-center justify-between mb-6 text-sm text-gray-400">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="accent-[#005524]" />
                    Remember me
                  </label>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="mb-4">
                <input
                  className="w-full bg-[#f8eed4] text-gray-800 px-4 py-2 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-[#005524] placeholder-gray-500"
                  type="text"
                  placeholder="Enter 2FA Code"
                  required
                />
              </div>
              <div className="flex justify-between mb-4">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={cooldown > 0}
                  className={`text-sm text-[#005524] hover:text-[#005523c7] hover:underline ${
                    cooldown > 0 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  Resend Code {cooldown > 0 ? `(${cooldown}s)` : ""}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIs2FAStep(false);
                    if (formRef.current) {
                      formRef.current.reset();
                    }
                  }}
                  className="text-sm text-[#005524] hover:text-[#005523c7] hover:underline"
                >
                  Back to Login
                </button>
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full bg-[#005524] hover:bg-[#005523d3] text-white font-medium py-2 rounded-lg transition duration-200"
          >
            {is2FAStep ? "Verify Code" : isRegistering ? "Register" : "Login"}
          </button>

          {!is2FAStep && (
            <p className="text-sm text-center mt-6 text-gray-800">
              {isRegistering
                ? "Already have an account?"
                : "Don't have an account?"}
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  if (formRef.current) {
                    formRef.current.reset();
                  }
                }}
                className="text-[#005524] hover:text-[#005523c7] hover:underline ml-1"
              >
                {isRegistering ? "Login" : "Register"}
              </button>
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
