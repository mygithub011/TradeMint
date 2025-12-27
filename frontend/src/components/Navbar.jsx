import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, logout, isClient, isTrader, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <svg className="w-8 h-8 mr-2" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Chart bars */}
                <rect x="10" y="70" width="12" height="20" fill="#00B894" rx="2"/>
                <rect x="26" y="60" width="12" height="30" fill="#00B894" rx="2"/>
                <rect x="42" y="50" width="12" height="40" fill="#00B894" rx="2"/>
                <rect x="58" y="35" width="12" height="55" fill="#00B894" rx="2"/>
                <rect x="74" y="25" width="12" height="65" fill="#00B894" rx="2"/>
                
                {/* Growth line */}
                <path d="M16 76 L32 66 L48 56 L64 40 L80 30" stroke="#00B894" strokeWidth="3" fill="none"/>
                
                {/* Arrow */}
                <path d="M75 35 L85 25 L95 35 M85 25 L85 45" stroke="#00B894" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M75 35 L85 25 L95 35" fill="#00B894"/>
              </svg>
              <div className="flex items-center">
                <span className="text-2xl font-bold text-gray-800">Trade</span>
                <span className="text-2xl font-bold text-green-600">Mint</span>
              </div>
            </Link>
            
            {user && (
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  to="/marketplace"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive('/marketplace')
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Marketplace
                </Link>

                {isClient && (
                  <Link
                    to="/client/dashboard"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                      isActive('/client/dashboard')
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Dashboard
                  </Link>
                )}

                {isTrader && (
                  <Link
                    to="/trader/dashboard"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                      isActive('/trader/dashboard')
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Dashboard
                  </Link>
                )}

                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                      isActive('/admin')
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Admin Panel
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <p className="text-gray-700 font-medium">{user.email}</p>
                  <p className="text-gray-500 text-xs capitalize">{user.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex space-x-4">
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
