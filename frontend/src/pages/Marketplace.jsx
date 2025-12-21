import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientService } from '../services/clientService';
import { useAuth } from '../contexts/AuthContext';

export default function Marketplace() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const data = await clientService.getMarketplace();
      setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (serviceId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'client') {
      alert('Only clients can subscribe to services');
      return;
    }

    setSubscribing(serviceId);
    try {
      await clientService.subscribe(serviceId);
      alert('Successfully subscribed! Check your dashboard.');
      navigate('/client/dashboard');
    } catch (error) {
      alert('Failed to subscribe: ' + (error.response?.data?.detail || 'Unknown error'));
    } finally {
      setSubscribing(null);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
          <p className="text-gray-600 mt-1">Discover professional trading services</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {services.length === 0 ? (
          <div className="text-center py-16">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No services available</h3>
            <p className="mt-1 text-gray-500">Check back later for new trading services</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div key={service.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{service.name}</h3>
                    {service.is_active && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 h-12 overflow-hidden">
                    {service.description}
                  </p>

                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Offered by</p>
                    <p className="text-sm font-medium text-gray-900">{service.trader_email || 'Professional Trader'}</p>
                  </div>

                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                    <div>
                      <p className="text-3xl font-bold text-indigo-600">${service.price}</p>
                      <p className="text-xs text-gray-500">per {service.duration_days} days</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Subscribers</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {service.subscriber_count || 0}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Real-time trade alerts
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Telegram group access
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      24/7 support
                    </div>
                  </div>

                  <button
                    onClick={() => handleSubscribe(service.id)}
                    disabled={subscribing === service.id || !service.is_active}
                    className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {subscribing === service.id ? 'Subscribing...' : 'Subscribe Now'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
