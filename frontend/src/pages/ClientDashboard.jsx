import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { clientService } from '../services/clientService';
import { useAuth } from '../contexts/AuthContext';

export default function ClientDashboard() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [trades, setTrades] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subsData, tradesData] = await Promise.all([
        clientService.getMySubscriptions(),
        clientService.getMyTrades(),
      ]);
      setSubscriptions(subsData);
      setTrades(tradesData);
      setAlerts([]); // Clients don't have their own alerts - they receive alerts from subscribed services
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getExpiryStatus = (sub) => {
    const daysLeft = sub.days_left || 0;
    if (sub.is_expired || daysLeft <= 0) return { text: 'Expired', color: 'text-red-600 bg-red-50', borderColor: 'border-red-200' };
    if (daysLeft < 7) return { text: `${daysLeft} days left`, color: 'text-orange-600 bg-orange-50', borderColor: 'border-orange-200' };
    return { text: `${daysLeft} days left`, color: 'text-green-600 bg-green-50', borderColor: 'border-green-200' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Client Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.email}</p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/client/profile"
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </Link>
              <Link
                to="/client/alerts"
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                View Alerts
              </Link>
              <Link
                to="/marketplace"
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Browse Marketplace
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Active Subscriptions</p>
                <p className="text-2xl font-bold text-gray-900">{subscriptions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Trades</p>
                <p className="text-2xl font-bold text-gray-900">{trades.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">New Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{alerts.filter(a => !a.read).length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Active Subscriptions</h2>
          </div>
          <div className="p-6">
            {subscriptions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No active subscriptions</p>
                <Link
                  to="/marketplace"
                  className="text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  Browse services →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {subscriptions.map((sub) => {
                  const status = getExpiryStatus(sub);
                  return (
                    <div key={sub.id} className={`border ${status.borderColor} rounded-xl p-6 hover:shadow-lg transition-all`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-bold text-gray-900">{sub.service_name || 'Service'}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.color}`}>
                              {status.text}
                            </span>
                          </div>
                          
                          {/* Trader Details */}
                          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <h4 className="font-bold text-gray-900">{sub.trader_name}</h4>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-600">SEBI Reg:</span>
                              <span className="ml-2 font-mono font-semibold text-purple-700">{sub.trader_sebi_reg || 'N/A'}</span>
                            </div>
                          </div>

                          {/* Subscription Details */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                            <div className="flex items-center gap-2">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <div>
                                <p className="text-xs text-gray-500">Started</p>
                                <p className="text-sm font-semibold text-gray-900">{formatDate(sub.start_date)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div>
                                <p className="text-xs text-gray-500">Expires</p>
                                <p className="text-sm font-semibold text-gray-900">{formatDate(sub.end_date)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div>
                                <p className="text-xs text-gray-500">Amount Paid</p>
                                <p className="text-sm font-bold text-green-600">₹{sub.service_price}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              <div>
                                <p className="text-xs text-gray-500">Duration</p>
                                <p className="text-sm font-semibold text-gray-900">{sub.duration_days} days</p>
                              </div>
                            </div>
                          </div>

                          {/* Service Description */}
                          {sub.service_description && (
                            <p className="text-sm text-gray-600 mt-2">{sub.service_description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Trade History */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent Trade History</h2>
          </div>
          <div className="overflow-x-auto">
            {trades.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No trades yet</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entry</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P&L</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trades.slice(0, 10).map((trade) => (
                    <tr key={trade.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(trade.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {trade.symbol}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-2 py-1 rounded ${trade.trade_type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {trade.trade_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{trade.entry_price?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{trade.exit_price?.toFixed(2) || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={trade.pnl >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          {trade.pnl ? `₹${trade.pnl.toFixed(2)}` : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded ${trade.status === 'OPEN' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                          {trade.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent Alerts</h2>
          </div>
          <div className="p-6">
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No alerts yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="border-l-4 border-indigo-500 bg-indigo-50 p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{alert.title || 'Trade Alert'}</p>
                        <p className="text-sm text-gray-700 mt-1">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-2">{formatDate(alert.created_at)}</p>
                      </div>
                      {!alert.read && (
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">New</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
