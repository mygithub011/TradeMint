import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import alertService from '../services/alertService';

function ClientAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    if (user && user.role === 'client') {
      loadAlerts();
      loadUnreadCount();
    }
  }, [user, filter]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await alertService.getMyAlerts(0, 100, filter === 'unread');
      setAlerts(data);
      setError('');
    } catch (err) {
      console.error('Failed to load alerts:', err);
      setError('Failed to load alerts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const data = await alertService.getUnreadCount();
      setUnreadCount(data.unread_count);
    } catch (err) {
      console.error('Failed to load unread count:', err);
    }
  };

  const handleMarkAsRead = async (recipientId, isRead) => {
    if (isRead) return; // Already read
    
    try {
      await alertService.markAlertRead(recipientId);
      // Update local state
      setAlerts(alerts.map(alert => 
        alert.id === recipientId 
          ? { ...alert, is_read: true, read_at: new Date().toISOString() }
          : alert
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getActionBadgeClass = (action) => {
    return action === 'BUY' 
      ? 'bg-green-100 text-green-800 border-green-300'
      : 'bg-red-100 text-red-800 border-red-300';
  };

  const calculateProgress = (rate, stopLoss, target) => {
    if (!rate || !stopLoss || !target) return 50;
    const rateNum = parseFloat(rate);
    const slNum = parseFloat(stopLoss);
    const targetNum = parseFloat(target);
    const range = targetNum - slNum;
    const progress = ((rateNum - slNum) / range) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const openDetailsModal = (alert) => {
    setSelectedAlert(alert);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedAlert(null);
  };

  const calculateRiskReward = (entry, target, stopLoss) => {
    if (!entry || !target || !stopLoss) return 'N/A';
    const entryNum = parseFloat(entry);
    const targetNum = parseFloat(target);
    const slNum = parseFloat(stopLoss);
    const reward = Math.abs(targetNum - entryNum);
    const risk = Math.abs(entryNum - slNum);
    if (risk === 0) return 'N/A';
    return (reward / risk).toFixed(2);
  };

  if (user?.role !== 'client') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <p className="text-yellow-700">This page is only accessible to clients.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Trade Alerts
          </h1>
          <p className="text-gray-600">
            Real-time alerts from your subscribed traders
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Alerts
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all relative ${
                filter === 'unread'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Unread
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {/* Alerts List */}
        {!loading && alerts.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Alerts Yet</h3>
            <p className="text-gray-600">
              {filter === 'unread' 
                ? "You're all caught up! No unread alerts."
                : "Subscribe to trader services to start receiving alerts."}
            </p>
          </div>
        )}

        {!loading && alerts.length > 0 && (
          <div className="space-y-4">
            {alerts.map((alert) => {
              const entryPrice = alert.rate ? parseFloat(alert.rate) : 0;
              const targetPrice = alert.target ? parseFloat(alert.target) : 0;
              const slPrice = alert.stop_loss ? parseFloat(alert.stop_loss) : 0;
              const cmpPrice = alert.cmp ? parseFloat(alert.cmp) : entryPrice;
              const progress = calculateProgress(alert.rate, alert.stop_loss, alert.target);
              
              return (
                <div
                  key={alert.id}
                  className={`bg-white rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden ${
                    !alert.is_read ? 'ring-2 ring-indigo-400' : ''
                  }`}
                >
                  <div className="p-6">
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-bold text-gray-900">{alert.stock_symbol}</h3>
                          <span className={`px-3 py-1 rounded-md text-sm font-bold ${
                            alert.action === 'BUY' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                          }`}>
                            {alert.action}
                          </span>
                          {!alert.is_read && (
                            <span className="px-3 py-1 rounded-md text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                              NEW
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="font-medium">{alert.service_name}</span>
                          {alert.lot_size && (
                            <>
                              <span>•</span>
                              <span>Lot: {alert.lot_size}</span>
                            </>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTime(alert.sent_at)}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-3xl font-bold text-green-600">
                          {cmpPrice > 0 && entryPrice > 0 ? (
                            <>
                              {cmpPrice.toFixed(2)}
                              <div className="text-xs font-semibold text-green-600">
                                (+{((cmpPrice - entryPrice) / entryPrice * 100).toFixed(2)}%)
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-400">--</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Price Range Visualization */}
                    {alert.stop_loss && alert.target && (
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-semibold text-red-600">SL: {slPrice.toFixed(2)}</span>
                          {alert.rate && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                              ENTRY: {parseFloat(alert.rate).toFixed(2)}
                            </span>
                          )}
                          <span className="text-xs font-semibold text-green-600">Target: {targetPrice.toFixed(2)}</span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="absolute h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300 rounded-full"
                            style={{ width: `${progress}%` }}
                          ></div>
                          <div 
                            className="absolute top-0 left-0 h-full flex items-center justify-between px-3 w-full"
                            style={{ color: progress > 50 ? 'white' : '#374151' }}
                          >
                            <span className="text-xs font-bold">{slPrice.toFixed(2)}</span>
                            <span className="text-xs font-bold">{targetPrice.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Trade Details Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {alert.rate && (
                        <div>
                          <p className="text-xs text-gray-600 font-medium">Entry</p>
                          <p className="text-lg font-bold text-gray-900">₹{parseFloat(alert.rate).toFixed(2)}</p>
                        </div>
                      )}
                      {alert.target && (
                        <div>
                          <p className="text-xs text-gray-600 font-medium">Target</p>
                          <p className="text-lg font-bold text-green-600">₹{parseFloat(alert.target).toFixed(2)}</p>
                        </div>
                      )}
                      {alert.stop_loss && (
                        <div>
                          <p className="text-xs text-gray-600 font-medium">Stop Loss</p>
                          <p className="text-lg font-bold text-red-600">₹{parseFloat(alert.stop_loss).toFixed(2)}</p>
                        </div>
                      )}
                      {alert.cmp && (
                        <div>
                          <p className="text-xs text-gray-600 font-medium">CMP</p>
                          <p className="text-lg font-bold text-blue-600">₹{parseFloat(alert.cmp).toFixed(2)}</p>
                        </div>
                      )}
                    </div>

                    {/* Footer Row */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                          {alert.trader_name}
                        </div>
                        {alert.validity && (
                          <span className="text-xs text-gray-500">Valid: {alert.validity}</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {!alert.is_read && (
                          <button
                            onClick={() => handleMarkAsRead(alert.id, alert.is_read)}
                            className="p-2 bg-indigo-100 hover:bg-indigo-200 rounded-full transition-colors"
                            title="Mark as read"
                          >
                            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                        
                        <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors" title="Alert info">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        
                        <button 
                          onClick={() => openDetailsModal(alert)}
                          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors" 
                          title="View details"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Read Status */}
                    {alert.is_read && alert.read_at && (
                      <div className="mt-3 text-xs text-gray-400 text-center">
                        Read {formatDate(alert.read_at)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Trade Details Modal */}
        {showDetailsModal && selectedAlert && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full p-2">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Trade Details</h2>
                    <p className="text-sm text-gray-600">Complete information for {selectedAlert.stock_symbol} trade</p>
                  </div>
                </div>
                <button 
                  onClick={closeDetailsModal}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Stock Header */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-3xl font-bold text-gray-900">{selectedAlert.stock_symbol}</h3>
                      <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm font-semibold">
                        CLOSED
                      </span>
                      <span className={`px-3 py-1 rounded-md text-sm font-bold ${
                        selectedAlert.action === 'BUY' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {selectedAlert.action}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-green-600">
                        ₹{selectedAlert.cmp || selectedAlert.rate || '0.00'}
                      </div>
                      {selectedAlert.cmp && selectedAlert.rate && (
                        <div className="text-sm font-semibold text-green-600">
                          (+{((parseFloat(selectedAlert.cmp) - parseFloat(selectedAlert.rate)) / parseFloat(selectedAlert.rate) * 100).toFixed(2)}%)
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-1">Exchange</p>
                      <p className="text-base font-bold text-gray-900">NFO</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-1">Lot Size</p>
                      <p className="text-base font-bold text-gray-900">{selectedAlert.lot_size || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-1">Created</p>
                      <p className="text-base font-bold text-gray-900">{formatDate(selectedAlert.sent_at).split(',')[0]}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-1">Updated</p>
                      <p className="text-base font-bold text-gray-900">{formatDate(selectedAlert.received_at).split(',')[0]}</p>
                    </div>
                  </div>
                </div>

                {/* Price Levels */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-purple-100 rounded-full p-2">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Price Levels</h3>
                      <p className="text-sm text-gray-600">Entry, exit, target, and stop loss</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Entry Price */}
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-blue-500 rounded-full p-1">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                        <p className="text-sm font-semibold text-blue-700">Entry Price</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">₹{selectedAlert.rate || '0.00'}</p>
                    </div>

                    {/* Exit Price */}
                    <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-purple-500 rounded-full p-1">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                        <p className="text-sm font-semibold text-purple-700">Exit Price</p>
                      </div>
                      <p className="text-2xl font-bold text-purple-900">₹{selectedAlert.cmp || selectedAlert.rate || '0.00'}</p>
                    </div>

                    {/* Target */}
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-green-500 rounded-full p-1">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-sm font-semibold text-green-700">Target</p>
                      </div>
                      <p className="text-2xl font-bold text-green-900">₹{selectedAlert.target || '0.00'}</p>
                    </div>

                    {/* Stop Loss */}
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-red-500 rounded-full p-1">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <p className="text-sm font-semibold text-red-700">Stop Loss</p>
                      </div>
                      <p className="text-2xl font-bold text-red-900">₹{selectedAlert.stop_loss || '0.00'}</p>
                    </div>
                  </div>
                </div>

                {/* Trade Information & Distribution */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Trade Information */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="bg-orange-100 rounded-full p-2">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Trade Information</h3>
                        <p className="text-sm text-gray-600">Additional trade parameters</p>
                      </div>
                    </div>

                    <div className="space-y-3 bg-gray-50 rounded-xl p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Validity</span>
                        <span className="font-semibold text-gray-900">{selectedAlert.validity || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Risk/Reward Ratio</span>
                        <span className="font-semibold text-gray-900">
                          1:{calculateRiskReward(selectedAlert.rate, selectedAlert.target, selectedAlert.stop_loss)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Trigger Status</span>
                        <span className="font-semibold text-green-600">Triggered</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Market Status</span>
                        <span className="font-semibold text-gray-600">Closed</span>
                      </div>
                    </div>
                  </div>

                  {/* Distribution */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="bg-green-100 rounded-full p-2">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Distribution</h3>
                        <p className="text-sm text-gray-600">Plans this trade is shared with</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-600 mb-2">Shared Plans:</p>
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-sm font-mono text-gray-700 break-all">
                          {selectedAlert.alert_id?.toString(16) || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="bg-yellow-100 rounded-full p-2">
                        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Additional Notes</h3>
                        <p className="text-sm text-gray-600">Add comments or observations</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">0 notes</span>
                  </div>

                  <textarea
                    className="w-full border-2 border-purple-300 rounded-xl p-4 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows="4"
                    placeholder="Add a note about this trade..."
                  ></textarea>
                  <button className="mt-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold transition-colors">
                    + Add Note
                  </button>
                </div>

                {/* Trade ID */}
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-500">
                    Trade ID: <span className="font-mono">{selectedAlert.alert_id?.toString(16).padStart(8, '0')}...</span>
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={closeDetailsModal}
                  className="px-6 py-2 bg-white border-2 border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientAlerts;
