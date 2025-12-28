import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

function ClientProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    email: '',
    dob: '',
    gender: '',
    pan: '',
    profile_photo: '',
    enrolled_courses: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/profile');
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to load profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.put('/auth/profile', {
        name: profile.name,
        phone: profile.phone,
        dob: profile.dob,
        gender: profile.gender,
        pan: profile.pan
      });
      
      setProfile(response.data);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to update profile';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // In production, upload to server/cloud storage
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, profile_photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-1">Manage your personal information and account details</p>
        </div>

        {/* Success/Error Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-8">
          {/* Profile Photo Section */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Photo</h2>
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                  {profile.profile_photo ? (
                    <img src={profile.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
              
              <div className="flex-1">
                <label className="block">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 cursor-pointer transition-colors">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handlePhotoUpload}
                    />
                    <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-600 font-medium">Click to upload</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={profile.name || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="ANURAG MISHRA"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                  {profile.phone && <span className="text-xs text-gray-500 ml-2">(Cannot be changed)</span>}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={profile.phone || ''}
                  onChange={handleInputChange}
                  disabled={!!profile.phone}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    profile.phone ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50'
                  }`}
                  placeholder="9161452323"
                />
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Account Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={profile.email || ''}
                  disabled
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">DOB</label>
                <input
                  type="date"
                  name="dob"
                  value={profile.dob || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <select
                  name="gender"
                  value={profile.gender || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select Gender</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PAN
                  {profile.pan && <span className="text-xs text-gray-500 ml-2">(Cannot be changed)</span>}
                </label>
                <input
                  type="text"
                  name="pan"
                  value={profile.pan || ''}
                  onChange={handleInputChange}
                  disabled={!!profile.pan}
                  maxLength="10"
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase ${
                    profile.pan ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50'
                  }`}
                  placeholder="ESKPM0208L"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Enrolled Courses</label>
                <input
                  type="text"
                  value={profile.enrolled_courses || 0}
                  disabled
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => loadProfile()}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ClientProfile;
