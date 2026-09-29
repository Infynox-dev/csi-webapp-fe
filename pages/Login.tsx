import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { setAuthTokens, setAuthUser } from '../services/auth';
import { resolvePostLoginPath } from '../services/authRouting';
import { resetRemovedMembersAlertDismiss } from '../utils/removedMembersAlert';
import { UserRole } from '../types';
import { isLoginPhone } from '../utils/phoneNumber';

interface LoginProps {
  onLogin?: (role: UserRole) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{email?: string; password?: string}>({});
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [formError, setFormError] = useState('');

  // Get the portal context from URL params (kalamela or conference)
  const portalContext = searchParams.get('portal');

  const isValidPhone = (value: string): boolean => isLoginPhone(value);

  // Check if input is a valid email
  const isValidEmail = (value: string): boolean => {
    return /\S+@\S+\.\S+/.test(value);
  };

  // Check if input is a valid username (alphanumeric, for district officials who use district name)
  const isValidUsername = (value: string): boolean => {
    // Allow alphanumeric usernames with minimum 2 characters (e.g., ADOOR, THIRUVALLA)
    return /^[A-Za-z0-9_-]{2,}$/.test(value);
  };

  const validateForm = (): boolean => {
    const newErrors: {email?: string; password?: string} = {};
    
    if (!email) {
      newErrors.email = 'Username is required';
    } else if (!isValidEmail(email) && !isValidPhone(email) && !isValidUsername(email)) {
      newErrors.email = 'Please enter a valid email, phone number, or username';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 4) {
      newErrors.password = 'Password must be at least 4 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setFormError('');

    const doLogin = async () => {
      try {
        // Pass portal context to backend so it can return the appropriate redirect_url
        const loginPayload: { username: string; password: string; portal?: 'kalamela' | 'conference' } = {
          username: email,
          password,
        };
        
        // Include portal in payload if it's set (kalamela or conference)
        if (portalContext === 'kalamela' || portalContext === 'conference') {
          loginPayload.portal = portalContext;
        }
        
        const tokens = await api.login(loginPayload);
        
        // Store both access and refresh tokens
        setAuthTokens(tokens.access_token, tokens.refresh_token || '');
        queryClient.clear();
        
        // Store user_type from login response
        if (tokens.user_type) {
          localStorage.setItem('user_type', tokens.user_type);
        }

        // Fetch profile to derive role and store user info
        try {
          const me = await api.me(tokens.access_token);
          
          // Store user profile for use throughout the app
          setAuthUser(me);
          resetRemovedMembersAlertDismiss(me.id);
          
          // Update user_type from profile if available
          if (me.user_type) {
            localStorage.setItem('user_type', me.user_type);
          }
          
          const userType = me.user_type || tokens.user_type;
          const role = userType === '1' ? UserRole.ADMIN
            : userType === '4' ? UserRole.OFFICIAL
            : userType === '2' || userType === '3' ? UserRole.OFFICIAL
            : UserRole.PUBLIC;
          onLogin?.(role);

          // Use redirect_url from login response if available, otherwise route based on user role
          if (tokens.redirect_url && userType !== '2') {
            navigate(tokens.redirect_url);
          } else if (userType === '4') {
            navigate('/admin/blood-donor-search');
          } else {
            const path = await resolvePostLoginPath(userType, portalContext);
            navigate(path);
          }
        } catch (profileErr) {
          // If profile fetch fails, use redirect_url from login response or route based on portal context
          const userType = tokens.user_type;
          const role = userType === '1' ? UserRole.ADMIN
            : userType === '4' ? UserRole.OFFICIAL
            : userType === '2' || userType === '3' ? UserRole.OFFICIAL
            : UserRole.PUBLIC;
          onLogin?.(role);
          
          if (tokens.redirect_url && userType !== '2') {
            navigate(tokens.redirect_url);
          } else if (userType === '4') {
            navigate('/admin/blood-donor-search');
          } else {
            const path = await resolvePostLoginPath(userType, portalContext);
            navigate(path);
          }
        }
      } catch (err: any) {
        setFormError(err?.message || 'Login failed. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    doLogin();
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-textDark">
          Username / Email / Phone
        </label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="email"
            name="email"
            type="text"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
            }}
            className={`block w-full pl-10 pr-3 py-2.5 bg-white border rounded-md shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all ${
              errors.email ? 'border-danger' : 'border-borderColor'
            }`}
            placeholder="Username, email, or phone number"
          />
        </div>
        {errors.email && (
          <p className="mt-1.5 text-sm text-danger flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-textDark">
          Password
        </label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
            }}
            className={`block w-full pl-10 pr-10 py-2.5 bg-white border rounded-md shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm transition-all ${
              errors.password ? 'border-danger' : 'border-borderColor'
            }`}
            placeholder="Enter your password"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-textMuted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {errors.password && (
          <p className="mt-1.5 text-sm text-danger flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.password}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 text-primary focus:ring-primary border-borderColor rounded"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-textDark">
            Remember me
          </label>
        </div>

        <div className="text-sm">
          <a href="#" className="font-medium text-primary hover:text-primary-hover transition-colors">
            Forgot password?
          </a>
        </div>
      </div>

      <div>
        <Button type="submit" className="w-full" disabled={loading} isLoading={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </div>

      {formError && (
        <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-md p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      {/* Demo Credentials Hint */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-center">
        <p className="text-xs text-yellow-800">
          <span className="font-bold">Demo Credentials:</span> Use <strong>admin</strong> / <strong>password</strong>
        </p>
      </div>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-borderColor" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-textMuted">Or access</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/kalamela')}>
                Public Results Portal
            </Button>
        </div>
      </div>
    </form>
  );
};
