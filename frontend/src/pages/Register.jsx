import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function Register() {
  const [step, setStep] = useState(1); // 1: Role Selection, 2: Details Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Trader-specific fields
  const [traderName, setTraderName] = useState('');
  const [sebiReg, setSebiReg] = useState('');
  const [panCard, setPanCard] = useState('');
  const [bio, setBio] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelection = (selectedRole) => {
    setRole(selectedRole);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    console.log('=== REGISTRATION FORM SUBMISSION ===');
    console.log('Role:', role);
    console.log('Email:', email);
    console.log('Password length:', password.length);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    // Validate trader-specific fields
    if (role === 'trader') {
      console.log('Validating trader fields...');
      console.log('Trader Name:', traderName);
      console.log('SEBI Reg:', sebiReg);
      console.log('PAN Card:', panCard);
      
      if (!traderName.trim()) {
        console.error('Validation failed: Display name missing');
        setError('Display name is required for traders');
        return;
      }
      if (!sebiReg.trim()) {
        console.error('Validation failed: SEBI reg missing');
        setError('SEBI registration number is required for traders');
        return;
      }
      if (!panCard.trim()) {
        console.error('Validation failed: PAN card missing');
        setError('PAN card number is required for traders');
        return;
      }
      // Validate PAN format
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
      if (!panRegex.test(panCard.toUpperCase())) {
        console.error('Validation failed: Invalid PAN format');
        setError('Invalid PAN card format. Format: ABCDE1234F');
        return;
      }
      
      // Check SEBI and PAN uniqueness BEFORE creating account
      console.log('Checking SEBI/PAN uniqueness...');
      try {
        await api.post('/traders/validate', {
          sebi_reg: sebiReg,
          pan_card: panCard.toUpperCase()
        });
        console.log('✅ SEBI/PAN validation passed');
      } catch (validationErr) {
        console.error('❌ Validation failed:', validationErr.response?.data?.detail);
        setError(validationErr.response?.data?.detail || 'SEBI or PAN number already exists');
        return;
      }
      
      console.log('✅ All trader validations passed');
    }

    setLoading(true);
    console.log('Starting registration...');

    try {
      // Register user
      await register(email, password, role);
      
      // If trader, onboard with additional details
      if (role === 'trader') {
        try {
          // Login to get token
          console.log('Logging in to get token...');
          const loginResponse = await api.post('/auth/login', 
            new URLSearchParams({
              username: email,
              password: password
            }),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              }
            }
          );
          
          const token = loginResponse.data.access_token;
          console.log('Token received, preparing onboarding data...');
          
          // Prepare onboarding data - only include optional fields if they have values
          const onboardData = {
            name: traderName,
            sebi_reg: sebiReg,
            pan_card: panCard.toUpperCase(),
            trades_per_day: 0
          };
          
          if (bio && bio.trim()) {
            onboardData.bio = bio;
          }
          
          if (imageUrl && imageUrl.trim()) {
            onboardData.image_url = imageUrl;
          }
          
          console.log('Onboarding data:', onboardData);
          console.log('Onboarding data as JSON:', JSON.stringify(onboardData, null, 2));
          console.log('Sending POST to /traders/onboard with token:', token?.substring(0, 20) + '...');
          
          // Onboard trader with SEBI and PAN details
          const onboardResponse = await api.post('/traders/onboard', onboardData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('✅ Onboarding successful!', onboardResponse.data);
          console.log('Status code:', onboardResponse.status);
          setLoading(false);
          setSuccess('Registration successful! Your account is pending admin approval.');
          setShowSuccess(true);
        } catch (onboardErr) {
          console.error('❌ Onboarding error:', onboardErr);
          console.error('Error response data:', onboardErr.response?.data);
          console.error('Error response status:', onboardErr.response?.status);
          console.error('Error message:', onboardErr.message);
          console.error('Full error object:', JSON.stringify(onboardErr.response?.data, null, 2));
          setLoading(false);
          
          const errorDetail = onboardErr.response?.data?.detail || onboardErr.message || 'Unknown error';
          setError('Account created but onboarding failed: ' + errorDetail);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
      } else {
        setLoading(false);
        setSuccess('Registration successful! Please login.');
        setShowSuccess(true);
      }
      
      setTimeout(() => {
        setShowSuccess(false);
        navigate('/login');
      }, 3000);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-lg border border-white">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">TradeMint</h1>
          <p className="text-gray-600 font-medium">
            {step === 1 ? 'Choose your account type' : 'Create your account'}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-md transition-all duration-300 ${
              step >= 1 ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white scale-110' : 'bg-gray-200 text-gray-500'
            }`}>
              1
            </div>
            <div className={`w-20 h-1.5 mx-3 rounded-full transition-all duration-500 ${
              step >= 2 ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-gray-200'
            }`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-md transition-all duration-300 ${
              step >= 2 ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white scale-110' : 'bg-gray-200 text-gray-500'
            }`}>
              2
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {/* Step 1: Role Selection */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">I want to register as</h2>
            
            <button
              onClick={() => handleRoleSelection('client')}
              className="w-full p-6 border-2 border-gray-200 rounded-2xl hover:border-emerald-400 hover:shadow-xl hover:scale-105 transition-all duration-300 text-left group bg-gradient-to-br from-white to-emerald-50"
            >
              <div className="flex items-start">
                <div className="p-4 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-5 flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">Client</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Subscribe to trading services and receive expert trading recommendations</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleRoleSelection('trader')}
              className="w-full p-6 border-2 border-gray-200 rounded-2xl hover:border-purple-400 hover:shadow-xl hover:scale-105 transition-all duration-300 text-left group bg-gradient-to-br from-white to-purple-50"
            >
              <div className="flex items-start">
                <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-5 flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">Trader</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Offer trading services and share your expertise (requires SEBI registration & admin approval)</p>
                </div>
              </div>
            </button>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Details Form */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
            {/* Back Button */}
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center text-indigo-600 hover:text-purple-600 font-semibold mb-4 hover:translate-x-[-4px] transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-semibold text-gray-800">
                <span className="text-indigo-600">✓</span> Registering as: <span className="text-indigo-700">{role === 'client' ? 'Client' : 'Trader'}</span>
              </p>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200 hover:border-gray-300"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200 hover:border-gray-300"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200 hover:border-gray-300"
                placeholder="••••••••"
              />
            </div>

            {/* Trader-specific fields */}
            {role === 'trader' && (
            <div className="space-y-4 p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl shadow-inner">
              <h3 className="font-bold text-gray-900 mb-3 text-lg flex items-center">
                <span className="w-2 h-2 bg-indigo-600 rounded-full mr-2 animate-pulse"></span>
                Trader Information
              </h3>
              
              <div>
                <label htmlFor="traderName" className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name *
                </label>
                <input
                  id="traderName"
                  type="text"
                  required={role === 'trader'}
                  value={traderName}
                  onChange={(e) => setTraderName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="e.g., Rajesh Kumar"
                />
              </div>

              <div>
                <label htmlFor="sebiReg" className="block text-sm font-medium text-gray-700 mb-2">
                  SEBI Registration Number *
                </label>
                <input
                  id="sebiReg"
                  type="text"
                  required={role === 'trader'}
                  value={sebiReg}
                  onChange={(e) => setSebiReg(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono"
                  placeholder="e.g., INH000001234"
                />
              </div>

              <div>
                <label htmlFor="panCard" className="block text-sm font-medium text-gray-700 mb-2">
                  PAN Card Number *
                </label>
                <input
                  id="panCard"
                  type="text"
                  required={role === 'trader'}
                  value={panCard}
                  onChange={(e) => setPanCard(e.target.value.toUpperCase())}
                  maxLength="10"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono uppercase"
                  placeholder="ABCDE1234F"
                />
                <p className="text-xs text-gray-500 mt-1">Format: 5 letters + 4 digits + 1 letter</p>
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                  Bio / Description (Optional)
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength="500"
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Tell potential subscribers about your trading experience..."
                />
                <p className="text-xs text-gray-500 mt-1">{bio.length}/500 characters</p>
              </div>

              <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Image URL (Optional)
                </label>
                <input
                  id="imageUrl"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="https://example.com/your-photo.jpg"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex">
                  <svg className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs text-yellow-800">
                    Your trader account will be pending admin approval. You'll be notified once approved.
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100"
          >
            {loading ? 'Creating account...' : 'Sign Up →'}
          </button>
        </form>
      )}
    </div>

      {/* Global Loader */}
      {loading && (
        <div className="fixed inset-0 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-10 flex flex-col items-center space-y-6 shadow-2xl">
            <div className="relative">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-purple-200 border-t-indigo-600"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900">Creating Your Account...</h3>
              <p className="text-sm text-gray-600 mt-2">
                {role === 'trader' ? 'Setting up your trader profile' : 'Please wait while we register you'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-10 flex flex-col items-center space-y-6 animate-bounce-in pointer-events-auto border-4 border-green-200">
            <div className="relative">
              <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-full p-5 shadow-lg">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="absolute -top-2 -right-2 animate-ping">
                <div className="bg-green-400 rounded-full h-8 w-8 opacity-75"></div>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Account Created Successfully!</h3>
              <p className="text-sm text-gray-600 mt-3 font-medium">
                {role === 'trader' 
                  ? '🎉 Your trader profile is pending admin approval'
                  : '✨ Redirecting you to login...'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
