import React, { useState, useEffect } from 'react';
import { traderService } from '../services/traderService';
import { useAuth } from '../contexts/AuthContext';

export default function TraderDashboard() {
  const [services, setServices] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [trades, setTrades] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [creatingService, setCreatingService] = useState(false);
  const [deletingService, setDeletingService] = useState(false);
  const [showCreateSuccess, setShowCreateSuccess] = useState(false);
  const [showCreateError, setShowCreateError] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [createMessage, setCreateMessage] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    predefinedService: '',
    pricing: {
      weekly: { enabled: false, price: '' },
      monthly: { enabled: true, price: '' },
      quarterly: { enabled: false, price: '' },
      yearly: { enabled: false, price: '' }
    }
  });
  const [profileForm, setProfileForm] = useState({
    name: '',
    bio: '',
    image_url: '',
    trades_per_day: 0,
  });
  const [alertForm, setAlertForm] = useState({
    service_id: '',
    stock_symbol: '',
    action: 'BUY',
    lot_size: '',
    rate: '',
    target: '',
    stop_loss: '',
    cmp: '',
    validity: '',
  });
  const [sending, setSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      
      const profileData = await traderService.getMyProfile().catch(err => {
        console.error('Error fetching profile:', err);
        return null;
      });
      
      const servicesData = await traderService.getMyServices().catch(err => {
        console.error('Error fetching services:', err);
        return [];
      });
      
      const subscribersData = await traderService.getMySubscribers().catch(err => {
        console.error('Error fetching subscribers:', err);
        return [];
      });
      
      const tradesData = await traderService.getMyTrades().catch(err => {
        console.error('Error fetching trades:', err);
        return [];
      });

      const analyticsData = await traderService.getAnalytics().catch(err => {
        console.error('Error fetching analytics:', err);
        return null;
      });
      
      setProfile(profileData);
      if (profileData) {
        setProfileForm({
          name: profileData.name || '',
          bio: profileData.bio || '',
          image_url: profileData.image_url || '',
          trades_per_day: profileData.trades_per_day || 0,
        });
      }
      setServices(servicesData || []);
      setSubscribers(subscribersData || []);
      setTrades(tradesData || []);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load dashboard data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    setCreatingService(true);
    setShowCreateError(false);
    try {
      // Define the 3 main service templates
      const serviceTemplates = {
        'equity-intraday': {
          name: 'Equity Intraday',
          description: 'Get real-time intraday trading signals for equity markets with high accuracy stock picks and precise entry/exit points.'
        },
        'futures-options': {
          name: 'Futures & Options',
          description: 'F&O trading signals with calculated risk-reward ratios for derivatives trading including index and stock options.'
        },
        'swing-trading': {
          name: 'Swing Trading',
          description: 'Medium to long-term swing trading opportunities with detailed technical and fundamental analysis for better returns.'
        }
      };

      // Validate service selection
      if (!serviceForm.predefinedService) {
        setCreateMessage('Please select a service type');
        setShowCreateError(true);
        setCreatingService(false);
        setTimeout(() => setShowCreateError(false), 3000);
        return;
      }

      // Validate at least one duration is enabled
      const enabledDurations = Object.entries(serviceForm.pricing).filter(([_, config]) => config.enabled);
      if (enabledDurations.length === 0) {
        alert('Please enable at least one subscription duration');
        return;
      }

      // Validate all enabled durations have prices
      for (const [duration, config] of enabledDurations) {
        if (!config.price || parseFloat(config.price) <= 0) {
          alert(`Please enter a valid price for ${duration} subscription`);
          return;
        }
      }

      // Get service template
      const template = serviceTemplates[serviceForm.predefinedService];
      
      // Build pricing tiers object
      const pricingTiers = {};
      const durationMap = {
        weekly: 7,
        monthly: 30,
        quarterly: 90,
        yearly: 365
      };

      enabledDurations.forEach(([duration, config]) => {
        pricingTiers[duration] = {
          price: parseFloat(config.price),
          days: durationMap[duration]
        };
      });

      // Check if service with same name already exists
      const existingService = services.find(s => s.name === template.name);
      
      if (existingService) {
        // Merge pricing tiers with existing service
        const existingTiers = existingService.pricing_tiers ? JSON.parse(existingService.pricing_tiers) : {};
        const mergedTiers = { ...existingTiers, ...pricingTiers };
        
        await traderService.updateService(existingService.id, {
          pricing_tiers: JSON.stringify(mergedTiers)
        });
        setCreateMessage('Service pricing tiers updated successfully!');
        setShowCreateSuccess(true);
        setTimeout(() => setShowCreateSuccess(false), 3000);
      } else {
        // Use the first enabled tier as the default price for backward compatibility
        const defaultTier = enabledDurations[0];
        const defaultPrice = parseFloat(defaultTier[1].price);
        const defaultDays = durationMap[defaultTier[0]];

        // Create single service with all pricing tiers
        await traderService.createService({
          name: template.name,
          description: template.description,
          price: defaultPrice,
          duration_days: defaultDays,
          pricing_tiers: JSON.stringify(pricingTiers)
        });
        setCreateMessage('Service created successfully!');
        setShowCreateSuccess(true);
        setTimeout(() => setShowCreateSuccess(false), 3000);
      }
      
      setCreatingService(false);
      setShowServiceModal(false);
      setServiceForm({
        predefinedService: '',
        pricing: {
          weekly: { enabled: false, price: '' },
          monthly: { enabled: true, price: '' },
          quarterly: { enabled: false, price: '' },
          yearly: { enabled: false, price: '' }
        }
      });
      fetchData();
    } catch (error) {
      console.error('Service creation error:', error);
      const errorMessage = error.response?.data?.detail 
        || error.message 
        || JSON.stringify(error.response?.data) 
        || 'Unknown error occurred';
      setCreateMessage('Failed to create service: ' + errorMessage);
      setShowCreateError(true);
      setCreatingService(false);
      setTimeout(() => setShowCreateError(false), 5000);
    }
  };

  const handleEditService = (service) => {
    setSelectedService(service);
    
    // Parse existing pricing tiers
    const existingTiers = service.pricing_tiers ? JSON.parse(service.pricing_tiers) : {};
    
    // Pre-fill the form
    const pricingForm = {
      weekly: { 
        enabled: !!existingTiers.weekly, 
        price: existingTiers.weekly?.price || '' 
      },
      monthly: { 
        enabled: !!existingTiers.monthly, 
        price: existingTiers.monthly?.price || '' 
      },
      quarterly: { 
        enabled: !!existingTiers.quarterly, 
        price: existingTiers.quarterly?.price || '' 
      },
      yearly: { 
        enabled: !!existingTiers.yearly, 
        price: existingTiers.yearly?.price || '' 
      }
    };
    
    setServiceForm({
      predefinedService: '',
      pricing: pricingForm
    });
    
    setShowEditModal(true);
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    try {
      // Validate at least one duration is enabled
      const enabledDurations = Object.entries(serviceForm.pricing).filter(([_, config]) => config.enabled);
      if (enabledDurations.length === 0) {
        alert('Please enable at least one subscription duration');
        return;
      }

      // Validate all enabled durations have prices
      for (const [duration, config] of enabledDurations) {
        if (!config.price || parseFloat(config.price) <= 0) {
          alert(`Please enter a valid price for ${duration} subscription`);
          return;
        }
      }

      // Build pricing tiers object
      const pricingTiers = {};
      const durationMap = {
        weekly: 7,
        monthly: 30,
        quarterly: 90,
        yearly: 365
      };

      enabledDurations.forEach(([duration, config]) => {
        pricingTiers[duration] = {
          price: parseFloat(config.price),
          days: durationMap[duration]
        };
      });

      // Update service
      await traderService.updateService(selectedService.id, {
        pricing_tiers: JSON.stringify(pricingTiers)
      });
      
      setShowEditModal(false);
      setSelectedService(null);
      setServiceForm({
        predefinedService: '',
        pricing: {
          weekly: { enabled: false, price: '' },
          monthly: { enabled: true, price: '' },
          quarterly: { enabled: false, price: '' },
          yearly: { enabled: false, price: '' }
        }
      });
      alert('Service updated successfully!');
      fetchData();
    } catch (error) {
      console.error('Service update error:', error);
      const errorMessage = error.response?.data?.detail 
        || error.message 
        || 'Unknown error occurred';
      alert('Failed to update service: ' + errorMessage);
    }
  };

  const handleDeleteService = (service) => {
    setSelectedService(service);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteService = async () => {
    try {
      setDeletingService(true);
      await traderService.deleteService(selectedService.id);
      setDeleteMessage(`Service "${selectedService.name}" deleted successfully!`);
      setShowDeleteConfirm(false);
      setSelectedService(null);
      setDeletingService(false);
      setShowDeleteSuccess(true);
      fetchData();
      setTimeout(() => {
        setShowDeleteSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Service deletion error:', error);
      const errorMessage = error.response?.data?.detail 
        || error.message 
        || 'Unknown error occurred';
      setDeleteMessage('Failed to delete service: ' + errorMessage);
      setDeletingService(false);
      alert('Failed to delete service: ' + errorMessage);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await traderService.updateProfile({
        ...profileForm,
        trades_per_day: parseInt(profileForm.trades_per_day) || 0,
      });
      setShowProfileModal(false);
      alert('Profile updated successfully!');
      fetchData();
    } catch (error) {
      alert('Failed to update profile: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  const handleSendAlert = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      // Convert date from YYYY-MM-DD to DD/MM/YYYY format
      let formattedValidity = alertForm.validity;
      if (alertForm.validity) {
        const [year, month, day] = alertForm.validity.split('-');
        formattedValidity = `${day}/${month}/${year}`;
      }

      const alertData = {
        service_id: parseInt(alertForm.service_id),
        stock_symbol: alertForm.stock_symbol,
        action: alertForm.action,
        lot_size: alertForm.lot_size ? parseInt(alertForm.lot_size) : undefined,
        rate: alertForm.rate ? parseFloat(alertForm.rate) : undefined,
        target: alertForm.target ? parseFloat(alertForm.target) : undefined,
        stop_loss: alertForm.stop_loss ? parseFloat(alertForm.stop_loss) : undefined,
        cmp: alertForm.cmp ? parseFloat(alertForm.cmp) : undefined,
        validity: formattedValidity || undefined,
      };
      await traderService.sendTradeAlert(alertData);
      setSending(false);
      setShowAlertModal(false);
      setAlertForm({ service_id: '', stock_symbol: '', action: 'BUY', lot_size: '', rate: '', target: '', stop_loss: '', cmp: '', validity: '' });
      
      // Show success message
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      
      fetchData();
    } catch (error) {
      setSending(false);
      alert('Failed to send alert: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg max-w-md">
          <h2 className="text-lg font-semibold mb-2">Error Loading Dashboard</h2>
          <p>{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
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
              <h1 className="text-3xl font-bold text-gray-900">Trader Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {profile?.name || user?.email}</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowAnalytics(!showAnalytics);
                  if (!showAnalytics) {
                    // Scroll to analytics section after a short delay to allow render
                    setTimeout(() => {
                      document.getElementById('analytics-section')?.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                      });
                    }, 100);
                  }
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {showAnalytics ? 'Hide Analytics' : 'View Analytics'}
              </button>
              <button
                onClick={() => setShowProfileModal(true)}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Edit Profile
              </button>
              <button
                onClick={() => setShowAlertModal(true)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Send Alert
              </button>
              <button
                onClick={() => setShowServiceModal(true)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Create Service
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      {showAnalytics && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200" id="analytics-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <svg className="w-7 h-7 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Business Analytics
            </h2>
            
            {!analytics ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading analytics data...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Overview Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                  <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
                    <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold text-gray-900">₹{analytics.overview.total_revenue.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
                <p className="text-sm text-gray-600 mb-1">Active Subscriptions</p>
                <p className="text-3xl font-bold text-green-600">{analytics.overview.active_subscriptions}</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
                <p className="text-sm text-gray-600 mb-1">Total Customers</p>
                <p className="text-3xl font-bold text-purple-600">{analytics.overview.total_customers}</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-amber-500 hover:shadow-lg transition-shadow">
                <p className="text-sm text-gray-600 mb-1">Retention Rate</p>
                <p className="text-3xl font-bold text-amber-600">{analytics.customer_metrics.retention_rate}%</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-rose-500 hover:shadow-lg transition-shadow">
                <p className="text-sm text-gray-600 mb-1">Repeat Customers</p>
                <p className="text-3xl font-bold text-rose-600">{analytics.customer_metrics.repeat_customer_percentage}%</p>
              </div>
            </div>

            {/* Customer Insights and Service Popularity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Metrics */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  Customer Insights
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Total Customers</span>
                    <span className="text-lg font-bold text-gray-900">{analytics.overview.total_customers}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Active Customers</span>
                    <span className="text-lg font-bold text-green-600">{analytics.customer_metrics.active_customers}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Repeated Customers</span>
                    <span className="text-lg font-bold text-purple-600">{analytics.customer_metrics.repeated_customers}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-sm font-medium text-blue-700">Repeat Rate</span>
                    <span className="text-lg font-bold text-blue-600">{analytics.customer_metrics.repeat_customer_percentage}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <span className="text-sm font-medium text-amber-700">Retention Rate</span>
                    <span className="text-lg font-bold text-amber-600">{analytics.customer_metrics.retention_rate}%</span>
                  </div>
                </div>
              </div>

              {/* Service Popularity */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                  Service Popularity
                </h3>
                {analytics.service_popularity && analytics.service_popularity.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.service_popularity.map((service, index) => {
                      const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500'];
                      const bgColors = ['bg-blue-50', 'bg-emerald-50', 'bg-purple-50', 'bg-amber-50', 'bg-rose-50'];
                      const color = colors[index % colors.length];
                      const bgColor = bgColors[index % bgColors.length];
                      const total = analytics.service_popularity.reduce((sum, s) => sum + s.subscription_count, 0);
                      const percentage = ((service.subscription_count / total) * 100).toFixed(1);
                      
                      return (
                        <div key={service.service_name} className={`p-4 ${bgColor} rounded-lg border border-gray-200`}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{service.service_name}</p>
                              <p className="text-xs text-gray-600 mt-1">₹{service.total_revenue.toLocaleString()} revenue</p>
                            </div>
                            <span className="text-sm font-bold text-gray-700">{service.subscription_count} subs</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className={`${color} h-2.5 rounded-full transition-all duration-300`} style={{width: `${percentage}%`}}></div>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{percentage}% of total subscriptions</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No subscription data available</p>
                )}
              </div>
            </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Services</p>
                <p className="text-2xl font-bold text-gray-900">{services.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Subscribers</p>
                <p className="text-2xl font-bold text-gray-900">{subscribers.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{subscribers.reduce((total, sub) => total + (sub.service_price || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* My Services */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">My Services</h2>
          </div>
          <div className="p-6">
            {services.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No services created yet</p>
                <button
                  onClick={() => setShowServiceModal(true)}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  Create your first service →
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {services.map((service) => {
                  // Parse pricing tiers if available
                  let pricingTiers = {};
                  try {
                    if (service.pricing_tiers) {
                      pricingTiers = JSON.parse(service.pricing_tiers);
                    }
                  } catch (e) {
                    console.error('Failed to parse pricing tiers:', e);
                  }

                  const hasPricingTiers = Object.keys(pricingTiers).length > 0;

                  return (
                    <div key={service.id} className="border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition hover:border-indigo-300">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{service.name}</h3>
                          <p className="text-sm text-gray-600 mt-2">{service.description}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${service.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {service.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {/* Pricing Tiers Display */}
                      {hasPricingTiers ? (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-700 mb-3">Subscription Plans:</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {pricingTiers.weekly && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                                <p className="text-xs text-blue-600 font-medium">Weekly</p>
                                <p className="text-lg font-bold text-blue-900 mt-1">₹{pricingTiers.weekly.price}</p>
                                <p className="text-xs text-blue-600">{pricingTiers.weekly.days} days</p>
                              </div>
                            )}
                            {pricingTiers.monthly && (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                                <p className="text-xs text-green-600 font-medium">Monthly</p>
                                <p className="text-lg font-bold text-green-900 mt-1">₹{pricingTiers.monthly.price}</p>
                                <p className="text-xs text-green-600">{pricingTiers.monthly.days} days</p>
                              </div>
                            )}
                            {pricingTiers.quarterly && (
                              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                                <p className="text-xs text-purple-600 font-medium">Quarterly</p>
                                <p className="text-lg font-bold text-purple-900 mt-1">₹{pricingTiers.quarterly.price}</p>
                                <p className="text-xs text-purple-600">{pricingTiers.quarterly.days} days</p>
                              </div>
                            )}
                            {pricingTiers.yearly && (
                              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                                <p className="text-xs text-orange-600 font-medium">Yearly</p>
                                <p className="text-lg font-bold text-orange-900 mt-1">₹{pricingTiers.yearly.price}</p>
                                <p className="text-xs text-orange-600">{pricingTiers.yearly.days} days</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 flex justify-between items-center bg-gray-50 rounded-lg p-4">
                          <div>
                            <p className="text-2xl font-bold text-indigo-600">₹{service.price}</p>
                            <p className="text-xs text-gray-500">per {service.duration_days} days</p>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                          </svg>
                          <span className="font-semibold">{service.subscriber_count || 0}</span>
                          <span className="ml-1">Subscribers</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditService(service)}
                            className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteService(service)}
                            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => {
                              setAlertForm({ ...alertForm, service_id: service.id });
                              setShowAlertModal(true);
                            }}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
                          >
                            Send Alert
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Active Subscribers */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Active Subscribers</h2>
          </div>
          <div className="overflow-x-auto">
            {subscribers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No subscribers yet</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telegram</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscribers.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sub.client_email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sub.service_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(sub.start_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(sub.expiry_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {sub.telegram_joined ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Joined</span>
                        ) : (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Create Service Modal */}
      {/* Edit Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Edit Marketplace Profile</h2>
            <p className="text-sm text-gray-600 mb-6">Update your profile information to appear in the marketplace</p>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Display Name *</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Rajesh Kumar"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio / Description</label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows="4"
                  placeholder="Tell potential subscribers about your trading experience and expertise..."
                  maxLength="500"
                />
                <p className="text-xs text-gray-500 mt-1">{profileForm.bio?.length || 0}/500 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image URL</label>
                <input
                  type="url"
                  value={profileForm.image_url}
                  onChange={(e) => setProfileForm({ ...profileForm, image_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://example.com/your-photo.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">Or leave blank for auto-generated avatar</p>
                {profileForm.image_url && (
                  <div className="mt-2">
                    <img 
                      src={profileForm.image_url} 
                      alt="Preview" 
                      className="w-20 h-20 rounded-full border-2 border-gray-300"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Average Trades Per Day</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={profileForm.trades_per_day}
                  onChange={(e) => setProfileForm({ ...profileForm, trades_per_day: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., 5"
                />
                <p className="text-xs text-gray-500 mt-1">Help subscribers understand your trading frequency</p>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-indigo-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-indigo-800">
                    <p className="font-semibold mb-1">Marketplace Visibility</p>
                    <p>This information will be displayed to potential subscribers in the marketplace once your profile is approved.</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Service</h2>
            <form onSubmit={handleCreateService} className="space-y-6">
              
              {/* Service Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Select Service Type</label>
                <select
                  required
                  value={serviceForm.predefinedService}
                  onChange={(e) => setServiceForm({ ...serviceForm, predefinedService: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                >
                  <option value="">Choose a service...</option>
                  <option value="equity-intraday">📊 Equity Intraday</option>
                  <option value="futures-options">📈 Futures & Options</option>
                  <option value="swing-trading">🔄 Swing Trading</option>
                </select>
              </div>

              {/* Pricing for Different Durations */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">Subscription Plans</label>
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                  
                  {/* Weekly */}
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={serviceForm.pricing.weekly.enabled}
                        onChange={(e) => setServiceForm({
                          ...serviceForm,
                          pricing: { ...serviceForm.pricing, weekly: { ...serviceForm.pricing.weekly, enabled: e.target.checked } }
                        })}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <label className="ml-3 text-sm font-medium text-gray-900">Weekly (7 days)</label>
                    </div>
                    {serviceForm.pricing.weekly.enabled && (
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={serviceForm.pricing.weekly.price}
                        onChange={(e) => setServiceForm({
                          ...serviceForm,
                          pricing: { ...serviceForm.pricing, weekly: { ...serviceForm.pricing.weekly, price: e.target.value } }
                        })}
                        className="w-32 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="₹ Price"
                      />
                    )}
                  </div>

                  {/* Monthly */}
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={serviceForm.pricing.monthly.enabled}
                        onChange={(e) => setServiceForm({
                          ...serviceForm,
                          pricing: { ...serviceForm.pricing, monthly: { ...serviceForm.pricing.monthly, enabled: e.target.checked } }
                        })}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <label className="ml-3 text-sm font-medium text-gray-900">Monthly (30 days)</label>
                    </div>
                    {serviceForm.pricing.monthly.enabled && (
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={serviceForm.pricing.monthly.price}
                        onChange={(e) => setServiceForm({
                          ...serviceForm,
                          pricing: { ...serviceForm.pricing, monthly: { ...serviceForm.pricing.monthly, price: e.target.value } }
                        })}
                        className="w-32 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="₹ Price"
                      />
                    )}
                  </div>

                  {/* Quarterly */}
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={serviceForm.pricing.quarterly.enabled}
                        onChange={(e) => setServiceForm({
                          ...serviceForm,
                          pricing: { ...serviceForm.pricing, quarterly: { ...serviceForm.pricing.quarterly, enabled: e.target.checked } }
                        })}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <label className="ml-3 text-sm font-medium text-gray-900">Quarterly (90 days)</label>
                    </div>
                    {serviceForm.pricing.quarterly.enabled && (
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={serviceForm.pricing.quarterly.price}
                        onChange={(e) => setServiceForm({
                          ...serviceForm,
                          pricing: { ...serviceForm.pricing, quarterly: { ...serviceForm.pricing.quarterly, price: e.target.value } }
                        })}
                        className="w-32 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="₹ Price"
                      />
                    )}
                  </div>

                  {/* Yearly */}
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={serviceForm.pricing.yearly.enabled}
                        onChange={(e) => setServiceForm({
                          ...serviceForm,
                          pricing: { ...serviceForm.pricing, yearly: { ...serviceForm.pricing.yearly, enabled: e.target.checked } }
                        })}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <label className="ml-3 text-sm font-medium text-gray-900">Yearly (365 days)</label>
                    </div>
                    {serviceForm.pricing.yearly.enabled && (
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={serviceForm.pricing.yearly.price}
                        onChange={(e) => setServiceForm({
                          ...serviceForm,
                          pricing: { ...serviceForm.pricing, yearly: { ...serviceForm.pricing.yearly, price: e.target.value } }
                        })}
                        className="w-32 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="₹ Price"
                      />
                    )}
                  </div>

                </div>
                <p className="text-xs text-gray-500 mt-2">Select one or more subscription plans. Each will be created as a separate service option.</p>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  disabled={creatingService}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingService}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {creatingService ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating...
                    </>
                  ) : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Edit Service: {selectedService.name}</h2>
            <form onSubmit={handleUpdateService} className="space-y-6">
              
              {/* Pricing for Different Durations */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">Subscription Plans</label>
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                  
                  {/* Weekly */}
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={serviceForm.pricing.weekly.enabled}
                        onChange={(e) => setServiceForm({
                          ...serviceForm,
                          pricing: { ...serviceForm.pricing, weekly: { ...serviceForm.pricing.weekly, enabled: e.target.checked } }
                        })}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <label className="ml-3 text-sm font-medium text-gray-900">Weekly (7 days)</label>
                    </div>
                    {serviceForm.pricing.weekly.enabled && (
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={serviceForm.pricing.weekly.price}
                        onChange={(e) => setServiceForm({
                          ...serviceForm,
                          pricing: { ...serviceForm.pricing, weekly: { ...serviceForm.pricing.weekly, price: e.target.value } }
                        })}
                        className="w-32 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="₹ Price"
                      />
                    )}
                  </div>

                  {/* Monthly */}
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={serviceForm.pricing.monthly.enabled}
                        onChange={(e) => setServiceForm({
                          ...serviceForm,
                          pricing: { ...serviceForm.pricing, monthly: { ...serviceForm.pricing.monthly, enabled: e.target.checked } }
                        })}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <label className="ml-3 text-sm font-medium text-gray-900">Monthly (30 days)</label>
                    </div>
                    {serviceForm.pricing.monthly.enabled && (
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={serviceForm.pricing.monthly.price}
                        onChange={(e) => setServiceForm({
                          ...serviceForm,
                          pricing: { ...serviceForm.pricing, monthly: { ...serviceForm.pricing.monthly, price: e.target.value } }
                        })}
                        className="w-32 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="₹ Price"
                      />
                    )}
                  </div>

                  {/* Quarterly */}
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={serviceForm.pricing.quarterly.enabled}
                        onChange={(e) => setServiceForm({
                          ...serviceForm,
                          pricing: { ...serviceForm.pricing, quarterly: { ...serviceForm.pricing.quarterly, enabled: e.target.checked } }
                        })}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <label className="ml-3 text-sm font-medium text-gray-900">Quarterly (90 days)</label>
                    </div>
                    {serviceForm.pricing.quarterly.enabled && (
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={serviceForm.pricing.quarterly.price}
                        onChange={(e) => setServiceForm({
                          ...serviceForm,
                          pricing: { ...serviceForm.pricing, quarterly: { ...serviceForm.pricing.quarterly, price: e.target.value } }
                        })}
                        className="w-32 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="₹ Price"
                      />
                    )}
                  </div>

                  {/* Yearly */}
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={serviceForm.pricing.yearly.enabled}
                        onChange={(e) => setServiceForm({
                          ...serviceForm,
                          pricing: { ...serviceForm.pricing, yearly: { ...serviceForm.pricing.yearly, enabled: e.target.checked } }
                        })}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <label className="ml-3 text-sm font-medium text-gray-900">Yearly (365 days)</label>
                    </div>
                    {serviceForm.pricing.yearly.enabled && (
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={serviceForm.pricing.yearly.price}
                        onChange={(e) => setServiceForm({
                          ...serviceForm,
                          pricing: { ...serviceForm.pricing, yearly: { ...serviceForm.pricing.yearly, price: e.target.value } }
                        })}
                        className="w-32 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="₹ Price"
                      />
                    )}
                  </div>

                </div>
                <p className="text-xs text-gray-500 mt-2">Update your subscription plans. At least one plan must be enabled.</p>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedService(null);
                    setServiceForm({
                      predefinedService: '',
                      pricing: {
                        weekly: { enabled: false, price: '' },
                        monthly: { enabled: true, price: '' },
                        quarterly: { enabled: false, price: '' },
                        yearly: { enabled: false, price: '' }
                      }
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  Update Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showCreateSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-green-50 border-2 border-green-500 rounded-lg shadow-lg p-4 flex items-center space-x-3 max-w-md">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">{createMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {showCreateError && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-red-50 border-2 border-red-500 rounded-lg shadow-lg p-4 flex items-center space-x-3 max-w-md">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">{createMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Success Notification */}
      {showDeleteSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-green-50 border-2 border-green-500 rounded-lg shadow-lg p-4 flex items-center space-x-3 max-w-md">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">{deleteMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showCreateSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-green-50 border-2 border-green-500 rounded-lg shadow-lg p-4 flex items-center space-x-3 max-w-md">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">{createMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {showCreateError && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-red-50 border-2 border-red-500 rounded-lg shadow-lg p-4 flex items-center space-x-3 max-w-md">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">{createMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Service</h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <strong>{selectedService.name}</strong>? 
              This action cannot be undone.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedService(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteService}
                disabled={deletingService}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingService ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Deleting...
                  </span>
                ) : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Send Trade Alert</h2>
            <form onSubmit={handleSendAlert} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service *</label>
                <select
                  required
                  value={alertForm.service_id}
                  onChange={(e) => setAlertForm({ ...alertForm, service_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select a service</option>
                  {services && services.length > 0 ? (
                    services.map((service) => (
                      <option key={service.id} value={service.id}>{service.name}</option>
                    ))
                  ) : (
                    <option value="" disabled>No services available</option>
                  )}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock Symbol *</label>
                <input
                  type="text"
                  required
                  value={alertForm.stock_symbol}
                  onChange={(e) => setAlertForm({ ...alertForm, stock_symbol: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., INDHOTEL30DEC25740CE"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action *</label>
                <select
                  required
                  value={alertForm.action}
                  onChange={(e) => setAlertForm({ ...alertForm, action: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lot Size</label>
                  <input
                    type="number"
                    value={alertForm.lot_size}
                    onChange={(e) => setAlertForm({ ...alertForm, lot_size: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., 1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    value={alertForm.rate}
                    onChange={(e) => setAlertForm({ ...alertForm, rate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., 8.2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target</label>
                  <input
                    type="number"
                    step="0.01"
                    value={alertForm.target}
                    onChange={(e) => setAlertForm({ ...alertForm, target: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., 12.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stop Loss</label>
                  <input
                    type="number"
                    step="0.01"
                    value={alertForm.stop_loss}
                    onChange={(e) => setAlertForm({ ...alertForm, stop_loss: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., 6.0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CMP</label>
                  <input
                    type="number"
                    step="0.01"
                    value={alertForm.cmp}
                    onChange={(e) => setAlertForm({ ...alertForm, cmp: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., 8.2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Validity</label>
                  <input
                    type="date"
                    value={alertForm.validity}
                    onChange={(e) => setAlertForm({ ...alertForm, validity: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAlertModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Send Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Loader */}
      {sending && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-green-600"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">Sending Alert...</h3>
              <p className="text-sm text-gray-600 mt-1">Please wait while we deliver your trade alert</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white rounded-lg shadow-2xl p-8 flex flex-col items-center space-y-4 animate-bounce-in pointer-events-auto">
            <div className="relative">
              <div className="bg-green-100 rounded-full p-4">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 animate-ping">
                <div className="bg-green-400 rounded-full h-6 w-6 opacity-75"></div>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900">Alert Sent Successfully!</h3>
              <p className="text-sm text-gray-600 mt-2">Your trade alert has been delivered to all subscribers</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
