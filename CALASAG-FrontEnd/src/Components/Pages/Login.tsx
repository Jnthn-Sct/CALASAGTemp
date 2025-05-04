import React from "react";

export const Login = () => {
  return (
    <div className="min-h-screen w-screen flex flex-col lg:flex-row overflow-hidden">
      <div className="w-full lg:w-1/2 bg-emerald-700 text-white flex flex-col items-center justify-center p-8">
        <img src="/WALAPA" alt="CALASAG Logo" className="w-24 md:w-32 mb-4" />
        <h1 className="text-3xl md:text-4xl font-bold tracking-wide">
          CALASAG
        </h1>
        <p className="text-sm md:text-lg text-gray-400 mt-2 text-center">
          Safety Solution App
        </p>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-950">
        <form className="bg-gray-900/80 backdrop-blur-md p-6 md:p-8 rounded-lg shadow-xl w-full max-w-sm border border-gray-700 text-white mx-4">
          <h1 className="text-2xl md:text-3xl font-semibold text-center mb-2 tracking-widest uppercase">
            Login
          </h1>
          <p className="text-xs text-gray-400 text-center mb-6">
            Secure Access to CALASAG
          </p>

          <div className="mb-4">
            <input
              className="w-full bg-gray-800 text-white px-4 py-2 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
              type="text"
              placeholder="Username"
              required
            />
          </div>

          <div className="mb-4">
            <input
              className="w-full bg-gray-800 text-white px-4 py-2 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
              type="password"
              placeholder="Password"
              required
            />
          </div>

          <div className="flex items-center justify-between mb-6 text-sm text-gray-400">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="accent-blue-500" />
              Remember me
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600/80 hover:bg-blue-600 text-white font-medium py-2 rounded-lg transition duration-200"
          >
            Proceed
          </button>

          <p className="text-sm text-center mt-6 text-gray-400">
            Don't have an account?
            <a
              href="#"
              className="text-blue-500 hover:text-blue-400 hover:underline ml-1"
            >
              Register
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};
