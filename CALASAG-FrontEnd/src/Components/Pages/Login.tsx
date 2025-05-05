import React, { useState } from "react";

export const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);

  return (
    <div className="min-h-screen w-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Left Side ng Page po Ito*/}
      <div className="w-full lg:w-1/2 bg-[#f8eed4] text-white flex flex-col items-center justify-center p-8">
        <img src="/WALAPA" alt="CALASAG Logo" className="w-24 md:w-32 mb-4" />
        <h1 className="text-7xl md:text-7xl font-bold tracking-wide text-[#005524]">
          CALASAG
        </h1>
        <p className="text-sm md:text-lg text-[#be4c1d] mt-2 text-center">
          Your Safety is Tailored with Bayanihan Touch
        </p>
      </div>

      {/* Right Side ng page Po Ito */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#005524]">
        <form className="bg-gray-900/80 backdrop-blur-md p-6 md:p-8 rounded-lg shadow-xl w-full max-w-sm border border-gray-700 text-white mx-4">
          <h1 className="text-2xl md:text-3xl font-semibold text-center mb-2 tracking-widest uppercase">
            {isRegistering ? "Register" : "Login"}
          </h1>
          <p className="text-xs text-gray-400 text-center mb-6">
            {isRegistering
              ? "Create your CALASAG account"
              : "Secure Access to CALASAG"}
          </p>

          <div className="mb-4">
            <input
              className="w-full bg-[gray-800] text-white px-4 py-2 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
              type="text"
              placeholder="Username"
              required
            />
          </div>

          {isRegistering && (
            <div className="mb-4">
              <input
                className="w-full bg-gray-800 text-white px-4 py-2 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                type="tel"
                placeholder="Mobile Number"
                required
              />
            </div>
          )}

          {isRegistering && (
            <div className="mb-4">
              <input
                className="w-full bg-gray-800 text-white px-4 py-2 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                type="email"
                placeholder="Email"
                required
              />
            </div>
          )}

          <div className="mb-4">
            <input
              className="w-full bg-gray-800 text-white px-4 py-2 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
              type="password"
              placeholder="Password"
              required
            />
          </div>

          {isRegistering && (
            <div className="mb-4">
              <input
                className="w-full bg-gray-800 text-white px-4 py-2 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                type="password"
                placeholder="Confirm Password"
                required
              />
            </div>
          )}

          {!isRegistering && (
            <div className="flex items-center justify-between mb-6 text-sm text-gray-400">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-blue-500" />
                Remember me
              </label>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600/80 hover:bg-blue-600 text-white font-medium py-2 rounded-lg transition duration-200"
          >
            {isRegistering ? "Register" : "Login"}
          </button>

          <p className="text-sm text-center mt-6 text-gray-400">
            {isRegistering
              ? "Already have an account?"
              : "Don't have an account?"}
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-blue-500 hover:text-blue-400 hover:underline ml-1"
            >
              {isRegistering ? "Login" : "Register"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};
