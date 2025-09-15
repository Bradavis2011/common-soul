import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RoleSelection: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<'HEALER' | 'CUSTOMER' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token');

  const handleRoleSubmit = async () => {
    if (!selectedRole || !token) {
      setError('Please select a role');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/select-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          userType: selectedRole
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to select role');
      }

      // Store the new token and user data
      localStorage.setItem('token', data.token);

      // Update auth context
      login({
        token: data.token,
        user: data.user
      });

      // Redirect to appropriate dashboard
      if (selectedRole === 'HEALER') {
        navigate('/healer/dashboard');
      } else {
        navigate('/dashboard');
      }

    } catch (error) {
      console.error('Role selection error:', error);
      setError(error instanceof Error ? error.message : 'Failed to select role');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Invalid Access</h2>
            <p className="mt-2 text-sm text-gray-600">
              No authentication token found. Please try signing in again.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-indigo-100">
            <svg
              className="h-6 w-6 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Choose Your Path
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Welcome to Common Soul! Let us know how you'd like to use our platform.
          </p>
        </div>

        <div className="space-y-4">
          {/* Customer Option */}
          <div
            className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all duration-200 ${
              selectedRole === 'CUSTOMER'
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedRole('CUSTOMER')}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  selectedRole === 'CUSTOMER' ? 'border-indigo-500' : 'border-gray-300'
                }`}>
                  {selectedRole === 'CUSTOMER' && (
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                  )}
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">I'm seeking healing</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Connect with verified spiritual healers, book sessions, and embark on your healing journey.
                </p>
                <ul className="mt-3 text-sm text-gray-500 space-y-1">
                  <li>• Browse healer profiles and specialties</li>
                  <li>• Book and manage healing sessions</li>
                  <li>• Access exclusive wellness content</li>
                  <li>• Join our supportive community</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Healer Option */}
          <div
            className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all duration-200 ${
              selectedRole === 'HEALER'
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedRole('HEALER')}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  selectedRole === 'HEALER' ? 'border-indigo-500' : 'border-gray-300'
                }`}>
                  {selectedRole === 'HEALER' && (
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                  )}
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">I'm a healer</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Share your gifts with those in need. Build your practice and grow your healing community.
                </p>
                <ul className="mt-3 text-sm text-gray-500 space-y-1">
                  <li>• Create your professional healer profile</li>
                  <li>• Manage appointments and clients</li>
                  <li>• Set your own rates and availability</li>
                  <li>• Receive secure payments</li>
                </ul>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <button
            onClick={handleRoleSubmit}
            disabled={!selectedRole || isLoading}
            className={`w-full py-3 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
              selectedRole
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'Setting up your account...' : 'Continue'}
          </button>

          <div className="text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;