import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { session } = useAuth();

  useEffect(() => {
    if (session) {
      navigate('/dashboard');
    }
  }, [session, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.error_description || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-neutral-800/50 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-neutral-700 animate-fade-in-up">
        <img src="https://cdn.jsdelivr.net/gh/ginting719/Audio/LOGO-01.png" alt="Alpro Learning Hour Logo" className="mx-auto h-16 w-auto mb-4" />
        <h1 className="text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
          Alpro Learning Hour
        </h1>
        
        {error && <div className="bg-error/20 border border-error text-error p-3 rounded-md mb-6">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full bg-neutral-700 border border-neutral-600 rounded-md shadow-sm py-3 px-4 text-white focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full bg-neutral-700 border border-neutral-600 rounded-md shadow-sm py-3 px-4 text-white focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-300 transform hover:scale-105"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            AUTHORIZED BY GINTING
          </p>
          <p className="text-xs text-gray-500 mt-1">
            accounts managed by administrator
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;