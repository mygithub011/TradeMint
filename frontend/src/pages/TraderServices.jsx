import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientService } from '../services/clientService';
import { paymentService } from '../services/paymentService';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function TraderServices() {
  const { traderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trader, setTrader] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showExistingSubscription, setShowExistingSubscription] = useState(false);
  const [existingSubscriptionInfo, setExistingSubscriptionInfo] = useState(null);

  useEffect(() => {
    fetchTraderServices();
  }, [traderId]);

  const fetchTraderServices = async () => {
    try {
      setLoading(true);
      // Fetch trader details and services
      const response = await api.get(`/traders/${traderId}/services`);
      setTrader(response.data.trader);
      setServices(response.data.services);
    } catch (error) {
      console.error('Error fetching trader services:', error);
      // Fallback to marketplace if trader not found
      navigate('/marketplace');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (serviceId, serviceName, price, duration, traderName) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'client') {
      alert('Only clients can subscribe to services');
      return;
    }

    setSubscribing(serviceId + '-' + duration); // Track specific tier being subscribed to
    
    try {
      // First check if user already has an active subscription for this service
      const mySubscriptions = await clientService.getMySubscriptions();
      const existingSubscription = mySubscriptions.find(sub => 
        sub.service_id === serviceId && sub.status === 'ACTIVE'
      );
      
      if (existingSubscription) {
        // Format the end date
        const endDate = new Date(existingSubscription.end_date);
        const formattedDate = endDate.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric'
        });
        
        setExistingSubscriptionInfo({
          serviceName,
          endDate: formattedDate,
          subscription: existingSubscription
        });
        setShowExistingSubscription(true);
        setSubscribing(null);
        return;
      }

      // Step 1: Create Razorpay order with specific duration and price
      const orderData = await paymentService.createOrder(serviceId, price, duration);
      
      // Step 2: Process payment through Razorpay
      const serviceData = {
        id: serviceId,
        name: serviceName + ` (${duration} days)`,
        price: price,
        traderName: traderName,
        duration_days: duration
      };
      
      await paymentService.processPayment(
        orderData,
        serviceData,
        // On success
        (result) => {
          console.log('Payment successful:', result);
          setSuccessMessage(`Successfully subscribed to ${serviceName}! You will receive Telegram alerts shortly.`);
          setShowSuccess(true);
          setSubscribing(null);
          setTimeout(() => {
            setShowSuccess(false);
            navigate('/client/dashboard');
          }, 3000);
        },
        // On failure
        (error) => {
          console.error('Payment failed:', error);
          setSubscribing(null);
          alert('Payment failed: ' + (error.message || 'Unknown error'));
        }
      );
    } catch (error) {
      console.error('Error creating order:', error);
      setSubscribing(null);
      alert('Failed to create order. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading trader services...</p>
        </div>
      </div>
    );
  }

  if (!trader) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Trader not found</p>
          <button 
            onClick={() => navigate('/marketplace')}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <button
          onClick={() => navigate('/marketplace')}
          className="flex items-center text-purple-600 hover:text-purple-800 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Marketplace
        </button>
      </div>

      {/* Trader Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-8 text-white relative overflow-hidden" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
            <div className="absolute top-4 right-4">
              <span className="bg-white text-emerald-600 text-sm font-bold px-4 py-2 rounded-full flex items-center shadow-lg">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                SEBI VERIFIED
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <img 
                src={trader.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(trader.name)}&background=gradient&color=fff&size=200`}
                alt={trader.name}
                className="w-24 h-24 rounded-full border-4 border-white/40 shadow-lg"
              />
              <div>
                <h1 className="text-3xl font-bold drop-shadow-lg">{trader.name}</h1>
                <p className="text-white/95 text-lg mt-1 font-mono">SEBI: {trader.sebi_reg}</p>
                <p className="text-white/90 mt-2">{trader.bio}</p>
              </div>
            </div>
            
            {/* Stats */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20 hover:bg-white transition-all">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-800">{trader.trades_per_day}</div>
                    <div className="text-xs text-slate-600 font-medium">Trades/Day</div>
                  </div>
                </div>
              </div>
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20 hover:bg-white transition-all">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-800">{trader.total_services}</div>
                    <div className="text-xs text-slate-600 font-medium">Services</div>
                  </div>
                </div>
              </div>
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20 hover:bg-white transition-all">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-800">{trader.total_subscribers}</div>
                    <div className="text-xs text-slate-600 font-medium">Subscribers</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Available Services</h2>
        {services.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <p className="text-gray-500">No services available from this trader</p>
          </div>
        ) : (
          <div className="space-y-6">
            {(() => {
              // Group services by name and merge pricing tiers
              const groupedServices = {};
              services.forEach(service => {
                if (!groupedServices[service.name]) {
                  groupedServices[service.name] = {
                    ...service,
                    allPricingTiers: {}
                  };
                }
                
                // Parse and merge pricing tiers
                try {
                  if (service.pricing_tiers) {
                    const tiers = JSON.parse(service.pricing_tiers);
                    groupedServices[service.name].allPricingTiers = {
                      ...groupedServices[service.name].allPricingTiers,
                      ...tiers
                    };
                  }
                } catch (e) {
                  console.error('Failed to parse pricing tiers:', e);
                }
              });

              return Object.values(groupedServices).map((service) => {
                const pricingTiers = service.allPricingTiers;
                const hasPricingTiers = Object.keys(pricingTiers).length > 0;

                return (
                  <div key={service.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border-2 border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{service.name}</h3>
                        <p className="text-gray-600 mt-2 text-lg">{service.description}</p>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                        <svg className="w-4 h-4 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                        <span className="font-semibold">{service.subscriber_count || 0}</span> subscribers
                      </div>
                    </div>

                    {/* Pricing Tiers Display */}
                    {hasPricingTiers ? (
                      <div className="mt-6">
                        <p className="text-sm font-medium text-gray-700 mb-4">Choose Your Subscription Plan:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {pricingTiers.weekly && (
                            <div className="bg-white border-2 border-blue-200 rounded-xl p-5 hover:shadow-lg transition-all hover:border-blue-400 cursor-pointer hover:-translate-y-1">
                              <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">Weekly</p>
                              <p className="text-3xl font-bold text-slate-800 mb-1">₹{pricingTiers.weekly.price}</p>
                              <p className="text-xs text-slate-600 mb-3">{pricingTiers.weekly.days} days</p>
                              <button
                                onClick={() => handleSubscribe(service.id, service.name, pricingTiers.weekly.price, pricingTiers.weekly.days, trader.name)}
                                disabled={subscribing === service.id + '-' + pricingTiers.weekly.days}
                                className="w-full px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm"
                              >
                                {subscribing === service.id + '-' + pricingTiers.weekly.days ? (
                                  <span className="flex items-center justify-center">
                                    <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Processing...
                                  </span>
                                ) : 'Subscribe'}
                              </button>
                            </div>
                          )}
                          {pricingTiers.monthly && (
                            <div className="bg-white border-2 border-emerald-200 rounded-xl p-5 hover:shadow-lg transition-all hover:border-emerald-400 cursor-pointer hover:-translate-y-1">
                              <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide mb-1">Monthly</p>
                              <p className="text-3xl font-bold text-slate-800 mb-1">₹{pricingTiers.monthly.price}</p>
                              <p className="text-xs text-slate-600 mb-3">{pricingTiers.monthly.days} days</p>
                              <button
                                onClick={() => handleSubscribe(service.id, service.name, pricingTiers.monthly.price, pricingTiers.monthly.days, trader.name)}
                                disabled={subscribing === service.id + '-' + pricingTiers.monthly.days}
                                className="w-full px-4 py-2 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm"
                              >
                                {subscribing === service.id + '-' + pricingTiers.monthly.days ? (
                                  <span className="flex items-center justify-center">
                                    <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Processing...
                                  </span>
                                ) : 'Subscribe'}
                              </button>
                            </div>
                          )}
                          {pricingTiers.quarterly && (
                            <div className="bg-white border-2 border-purple-200 rounded-xl p-5 hover:shadow-lg transition-all hover:border-purple-400 cursor-pointer relative overflow-hidden hover:-translate-y-1">
                              <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs px-2 py-1 rounded-bl-lg font-bold">POPULAR</div>
                              <p className="text-xs text-purple-600 font-semibold uppercase tracking-wide mb-1">Quarterly</p>
                              <p className="text-3xl font-bold text-slate-800 mb-1">₹{pricingTiers.quarterly.price}</p>
                              <p className="text-xs text-slate-600 mb-3">{pricingTiers.quarterly.days} days</p>
                              <button
                                onClick={() => handleSubscribe(service.id, service.name, pricingTiers.quarterly.price, pricingTiers.quarterly.days, trader.name)}
                                disabled={subscribing === service.id + '-' + pricingTiers.quarterly.days}
                                className="w-full px-4 py-2 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm"
                              >
                                {subscribing === service.id + '-' + pricingTiers.quarterly.days ? (
                                  <span className="flex items-center justify-center">
                                    <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Processing...
                                  </span>
                                ) : 'Subscribe'}
                              </button>
                            </div>
                          )}
                          {pricingTiers.yearly && (
                            <div className="bg-white border-2 border-amber-200 rounded-xl p-5 hover:shadow-lg transition-all hover:border-amber-400 cursor-pointer relative overflow-hidden hover:-translate-y-1">
                              <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs px-2 py-1 rounded-bl-lg font-bold">BEST VALUE</div>
                              <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide mb-1">Yearly</p>
                              <p className="text-3xl font-bold text-slate-800 mb-1">₹{pricingTiers.yearly.price}</p>
                              <p className="text-xs text-slate-600 mb-3">{pricingTiers.yearly.days} days</p>
                              <button
                                onClick={() => handleSubscribe(service.id, service.name, pricingTiers.yearly.price, pricingTiers.yearly.days, trader.name)}
                                disabled={subscribing === service.id + '-' + pricingTiers.yearly.days}
                                className="w-full px-4 py-2 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm"
                              >
                                {subscribing === service.id + '-' + pricingTiers.yearly.days ? (
                                  <span className="flex items-center justify-center">
                                    <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Processing...
                                  </span>
                                ) : 'Subscribe'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 flex justify-between items-center bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
                        <div>
                          <p className="text-3xl font-bold text-purple-600">₹{service.price}</p>
                          <p className="text-xs text-gray-500 mt-1">per {service.duration_days} days</p>
                        </div>
                        <button
                          onClick={() => handleSubscribe(service.id, service.name, service.price, service.duration_days, trader.name)}
                          disabled={subscribing === service.id + '-' + service.duration_days}
                          className="px-6 py-3 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:scale-105"
                          style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}
                        >
                          {subscribing === service.id + '-' + service.duration_days ? (
                            <span className="flex items-center">
                              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Processing...
                            </span>
                          ) : 'Subscribe'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      {/* Existing Subscription Dialog */}
      {showExistingSubscription && existingSubscriptionInfo && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center space-y-6 max-w-md mx-4 border-4 border-blue-200">
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-full p-4 shadow-lg">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Active Subscription Found</h3>
              <p className="text-gray-600 mb-2">
                You already have an active subscription to
              </p>
              <p className="text-lg font-semibold text-blue-600 mb-4">
                {existingSubscriptionInfo.serviceName}
              </p>
              <p className="text-gray-600 mb-6">
                Validity till: <span className="font-semibold text-gray-800">{existingSubscriptionInfo.endDate}</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExistingSubscription(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowExistingSubscription(false);
                    navigate('/client/dashboard');
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-10 flex flex-col items-center space-y-6 animate-bounce-in border-4 border-green-200 max-w-md mx-4">
            <div className="relative">
              <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-full p-5 shadow-lg">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Subscription Successful!</h3>
              <p className="text-gray-600 mt-3 font-medium">{successMessage}</p>
              <p className="text-sm text-gray-500 mt-2">✨ Redirecting to your dashboard...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}