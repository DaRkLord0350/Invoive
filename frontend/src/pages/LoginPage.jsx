import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { authAPI, businessAPI } from '../api';
import { useAuthStore, useBusinessStore } from '../store';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, setError, error, isLoading, setLoading } = useAuthStore();
  const { setCurrentBusiness } = useBusinessStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.login(email, password);
      login(data.user, data.access_token);
      
      // Fetch user's businesses
      try {
        const businessData = await businessAPI.list();
        if (businessData && businessData.length > 0) {
          setCurrentBusiness(businessData[0]);
        }
      } catch (businessErr) {
        console.error('Failed to fetch businesses:', businessErr);
        // Continue anyway, dashboard will handle missing business
      }
      
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center px-4 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="card shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="text-4xl font-bold text-primary mb-2">📊</div>
            <h1 className="text-2xl font-bold text-secondary dark:text-light">
              Invoice Manager
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Billing & Inventory Management
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="input pl-10"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded" />
                <span>Remember me</span>
              </label>
              <a href="/forgot-password" className="text-primary hover:underline">
                Forgot password?
              </a>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full mt-6"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="loading-spinner" />
                  Logging in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Signup Link */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <a href="/signup" className="text-primary font-semibold hover:underline">
                Sign up here
              </a>
            </p>
          </div>

          {/* Demo Credentials */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg text-xs text-gray-600 dark:text-gray-300">
            <p className="font-semibold mb-1">Demo Credentials:</p>
            <p>Email: demo@example.com</p>
            <p>Password: demo123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
