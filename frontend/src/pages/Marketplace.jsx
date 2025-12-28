import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientService } from '../services/clientService';
import { paymentService } from '../services/paymentService';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function Marketplace() {
  const [traders, setTraders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedTrader, setSelectedTrader] = useState(null);
  const [currentReview, setCurrentReview] = useState(0);
  const [currentFeature, setCurrentFeature] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [showExistingSubscription, setShowExistingSubscription] = useState(false);
  const [existingSubscriptionInfo, setExistingSubscriptionInfo] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Customer reviews data
  const reviews = [
    {
      name: "Amit Sharma",
      role: "Day Trader",
      image: "https://ui-avatars.com/api/?name=Amit+Sharma&background=0D8ABC&color=fff",
      rating: 5,
      text: "The trading signals are incredibly accurate! I've been consistently profitable following the recommendations."
    },
    {
      name: "Priya Patel",
      role: "Swing Trader",
      image: "https://ui-avatars.com/api/?name=Priya+Patel&background=6366F1&color=fff",
      rating: 5,
      text: "Best investment I've made. The expert analysis has helped me grow my portfolio by 40% in 3 months!"
    },
    {
      name: "Rahul Kumar",
      role: "Options Trader",
      image: "https://ui-avatars.com/api/?name=Rahul+Kumar&background=EC4899&color=fff",
      rating: 5,
      text: "Professional traders with excellent risk management. Highly recommend their F&O strategies!"
    }
  ];

  // Real trading positions screenshots
  const tradingPositions = [
    {
      title: "INDHOTEL & BDL Options",
      totalReturns: "+₹3,983.75",
      returnColor: "text-green-500",
      positions: [
        { symbol: "INDHOTEL", date: "30 Dec", strike: "740", type: "Call", qty: "+3,000", returns: "+₹100.00", avg: "₹8.37", mkt: "₹8.40" },
        { symbol: "BDL", date: "30 Dec", strike: "1420", type: "Call", qty: "", returns: "+₹3,883.75", avg: "₹0.00", mkt: "₹26.25" }
      ]
    },
    {
      title: "INDIGO Put Option",
      totalReturns: "+₹18,840.00",
      returnColor: "text-green-500",
      positions: [
        { symbol: "INDIGO", date: "30 Dec", strike: "5100", type: "Put", qty: "", returns: "+₹18,840.00", avg: "₹0.00", mkt: "₹39.20" }
      ]
    },
    {
      title: "ANGELONE & AMBUJACEM",
      totalReturns: "+₹12,350.00",
      returnColor: "text-green-500",
      positions: [
        { symbol: "ANGELONE", date: "30 Dec", strike: "2500", type: "Put", qty: "+750", returns: "+₹6,837.50", avg: "₹59.83", mkt: "₹68.95" },
        { symbol: "AMBUJACEM", date: "30 Dec", strike: "540", type: "Put", qty: "", returns: "+₹5,512.50", avg: "₹0.00", mkt: "₹8.20" }
      ]
    }
  ];

  // Auto-slide reviews
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentReview((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Auto-slide featured cards
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Auto-slide trading positions
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPosition((prev) => (prev + 1) % tradingPositions.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchTraders();
  }, []);

  const fetchTraders = async () => {
    try {
      const response = await api.get('/marketplace/traders');
      setTraders(response.data);
    } catch (error) {
      console.error('Error fetching traders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (serviceId, serviceName, servicePrice, traderName) => {
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

      // Step 1: Create Razorpay order
      const orderData = await paymentService.createOrder(serviceId);
      
      // Step 2: Process payment through Razorpay
      const serviceData = {
        id: serviceId,
        name: serviceName,
        price: servicePrice,
        traderName: traderName
      };
      
      await paymentService.processPayment(
        orderData,
        serviceData,
        // On success
        (result) => {
          console.log('Payment successful:', result);
          setSuccessMessage(`Successfully subscribed to ${serviceName}!`);
          setShowSuccess(true);
          setSubscribing(null);
          setTimeout(() => {
            setShowSuccess(false);
            navigate('/client/dashboard');
          }, 2500);
        },
        // On failure
        (error) => {
          console.error('Payment failed:', error);
          setSubscribing(null);
          alert('Payment failed: ' + (error.message || 'Unknown error'));
        }
      );
      
    } catch (error) {
      console.error('Subscription error:', error);
      setSubscribing(null);
      alert('Failed to initiate payment: ' + (error.response?.data?.detail || error.message || 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center bg-white rounded-3xl shadow-2xl p-10">
          <div className="relative mx-auto mb-6">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-purple-200 border-t-indigo-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <p className="text-lg font-semibold text-gray-900">Loading Marketplace...</p>
          <p className="text-sm text-gray-500 mt-2">Finding the best traders for you</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'}}>
      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-white rounded-xl shadow-2xl p-6 border-l-4 border-green-500 animate-slide-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-800 font-semibold">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Hero Header with Modern Gradient and Stock Chart Background */}
      <div className="relative overflow-hidden text-white shadow-2xl" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'}}>
        {/* Background Chart Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full object-cover" viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 350 L100 320 L200 280 L300 240 L400 200 L500 160 L600 120 L700 80 L800 50" 
                  stroke="white" strokeWidth="4" fill="none" opacity="0.3"/>
            <path d="M0 380 L120 360 L240 320 L360 270 L480 220 L600 170 L720 120 L800 90" 
                  stroke="white" strokeWidth="3" fill="none" opacity="0.2"/>
            <path d="M0 300 L80 290 L160 260 L240 230 L320 180 L400 140 L480 100 L560 70 L640 50 L720 30 L800 20" 
                  stroke="white" strokeWidth="2" fill="none" opacity="0.15"/>
            {/* Candlestick patterns */}
            <g opacity="0.1">
              <rect x="50" y="250" width="8" height="60" fill="white"/>
              <rect x="150" y="220" width="8" height="40" fill="white"/>
              <rect x="250" y="200" width="8" height="80" fill="white"/>
              <rect x="350" y="180" width="8" height="50" fill="white"/>
              <rect x="450" y="160" width="8" height="70" fill="white"/>
              <rect x="550" y="140" width="8" height="45" fill="white"/>
              <rect x="650" y="120" width="8" height="55" fill="white"/>
            </g>
          </svg>
        </div>
        
        {/* Additional blur overlay */}
        <div className="absolute inset-0 bg-black opacity-5 backdrop-blur-sm"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="text-center">
            <svg className="w-20 h-20 mx-auto mb-8 drop-shadow-2xl" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Stack of coins - clearer design */}
              {/* Bottom coin */}
              <ellipse cx="32" cy="50" rx="12" ry="4" fill="#FFD700" stroke="#FFA500" strokeWidth="1"/>
              <ellipse cx="32" cy="48" rx="12" ry="4" fill="#FFE55C"/>
              
              {/* Middle coin */}
              <ellipse cx="32" cy="42" rx="11" ry="3.5" fill="#FFD700" stroke="#FFA500" strokeWidth="1"/>
              <ellipse cx="32" cy="40" rx="11" ry="3.5" fill="#FFE55C"/>
              
              {/* Top coin */}
              <ellipse cx="32" cy="34" rx="10" ry="3" fill="#FFD700" stroke="#FFA500" strokeWidth="1"/>
              <ellipse cx="32" cy="32" rx="10" ry="3" fill="#FFE55C"/>
              
              {/* Currency symbols on coins */}
              <text x="32" y="52" textAnchor="middle" fill="#FF8C00" fontSize="8" fontWeight="bold">₹</text>
              <text x="32" y="44" textAnchor="middle" fill="#FF8C00" fontSize="7" fontWeight="bold">₹</text>
              <text x="32" y="36" textAnchor="middle" fill="#FF8C00" fontSize="6" fontWeight="bold">₹</text>
              
              {/* Growth arrow */}
              <path d="M45 25L50 20L55 25M50 20V35" stroke="#00FF7F" strokeWidth="3" fill="none"/>
              <path d="M45 25L50 20L55 25" fill="#00FF7F"/>
              
              {/* Sparkle effects */}
              <circle cx="20" cy="25" r="1.5" fill="#FFD700" opacity="0.8"/>
              <circle cx="44" cy="15" r="1" fill="#FFD700" opacity="0.6"/>
              <circle cx="18" cy="35" r="1" fill="#FFE55C" opacity="0.7"/>
              
              {/* Dollar signs for wealth */}
              <text x="15" y="20" fill="#32CD32" fontSize="6" fontWeight="bold" opacity="0.7">₹</text>
              <text x="50" y="45" fill="#32CD32" fontSize="5" fontWeight="bold" opacity="0.6">₹</text>
            </svg>
            <h1 className="text-5xl font-extrabold mb-4 drop-shadow-lg">Expert Trading Services</h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto font-light drop-shadow">
              Connect with SEBI-registered professionals. Get real-time insights, expert analysis, and proven strategies.
            </p>
            
            {/* Stats */}
            <div className="flex justify-center gap-8 flex-wrap">
              <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/30 backdrop-blur-xl rounded-2xl px-8 py-4 border border-emerald-400/40 shadow-lg">
                <div className="text-3xl font-bold text-emerald-100">{traders.length}+</div>
                <div className="text-sm font-light text-emerald-200">Expert Traders</div>
              </div>
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/30 backdrop-blur-xl rounded-2xl px-8 py-4 border border-blue-400/40 shadow-lg">
                <div className="text-3xl font-bold text-blue-100">95%</div>
                <div className="text-sm font-light text-blue-200">Success Rate</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/30 backdrop-blur-xl rounded-2xl px-8 py-4 border border-purple-400/40 shadow-lg">
                <div className="text-3xl font-bold text-purple-100">10K+</div>
                <div className="text-sm font-light text-purple-200">Active Users</div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent"></div>
      </div>

      {/* Why Choose TradeMint Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 mt-12">
        <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Why Choose TradeMint?
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Features Carousel */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-semibold text-gray-800 text-center mb-6">Our Features</h3>
            <div className="relative overflow-hidden h-44">
              <div className="flex transition-transform duration-700 ease-in-out" style={{transform: `translateX(-${currentFeature * 100}%)`}}>
                {/* Feature Card 1 */}
                <div className="w-full flex-shrink-0 px-2">
                  <div className="text-center h-full flex flex-col justify-center">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center shadow-lg" style={{background: 'linear-gradient(135deg, #667eea, #764ba2)'}}>
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h4 className="text-base font-bold mb-2 text-gray-800">SEBI Verified Experts</h4>
                    <p className="text-gray-600 text-xs leading-relaxed">All traders are verified SEBI-registered professionals with proven track records</p>
                  </div>
                </div>

                {/* Feature Card 2 */}
                <div className="w-full flex-shrink-0 px-2">
                  <div className="text-center h-full flex flex-col justify-center">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center shadow-lg" style={{background: 'linear-gradient(135deg, #f093fb, #f5576c)'}}>
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h4 className="text-base font-bold mb-2 text-gray-800">Real-Time Signals</h4>
                    <p className="text-gray-600 text-xs leading-relaxed">Get instant trade alerts via Telegram with entry, exit, and stop-loss levels</p>
                  </div>
                </div>

                {/* Feature Card 3 */}
                <div className="w-full flex-shrink-0 px-2">
                  <div className="text-center h-full flex flex-col justify-center">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center shadow-lg" style={{background: 'linear-gradient(135deg, #4facfe, #00f2fe)'}}>
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="text-base font-bold mb-2 text-gray-800">Transparent Pricing</h4>
                    <p className="text-gray-600 text-xs leading-relaxed">No hidden charges. Clear pricing with secure Razorpay payment gateway</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Features Dots */}
            <div className="flex justify-center gap-2 mt-4">
              {[0, 1, 2].map((index) => (
                <button
                  key={index}
                  onClick={() => setCurrentFeature(index)}
                  className={`w-3 h-3 rounded-full transition-all ${index === currentFeature ? 'bg-blue-600 w-6' : 'bg-gray-300'}`}
                />
              ))}
            </div>
          </div>

          {/* Right Side - Trading Positions Carousel */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <svg className="w-6 h-6 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
                Real Trading Positions
              </h3>
              <span className="text-xs text-green-400 font-semibold bg-green-400/10 px-3 py-1 rounded-full border border-green-400/30">
                LIVE RESULTS
              </span>
            </div>
            <div className="relative overflow-hidden" style={{minHeight: '180px'}}>
              <div className="flex transition-transform duration-700 ease-in-out" style={{transform: `translateX(-${currentPosition * 100}%)`}}>
                {tradingPositions.map((position, index) => (
                  <div key={index} className="w-full flex-shrink-0 px-1">
                    {/* Position Card */}
                    <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
                      {/* Header with Total Returns */}
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-700/50">
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Total Returns</div>
                          <div className={`text-xl font-bold ${position.returnColor}`}>{position.totalReturns}</div>
                        </div>
                        <div className="bg-green-500/10 px-3 py-1 rounded-lg border border-green-500/30">
                          <span className="text-green-400 text-xs font-semibold">PROFIT</span>
                        </div>
                      </div>
                      
                      {/* Positions List */}
                      <div className="space-y-2">
                        {position.positions.map((pos, posIdx) => (
                          <div key={posIdx} className="bg-gray-900/50 rounded-lg p-2 border border-gray-700/30">
                            <div className="flex items-center justify-between mb-1">
                              <div>
                                <span className="text-white font-bold text-sm">{pos.symbol}</span>
                                <span className="text-gray-400 text-xs ml-2">{pos.date}</span>
                                <span className="text-gray-400 text-xs ml-1">{pos.strike} {pos.type}</span>
                              </div>
                              {pos.qty && (
                                <span className="text-blue-400 text-xs bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/30">
                                  {pos.qty}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex gap-3">
                                <span className="text-gray-400">Avg {pos.avg}</span>
                                <span className="text-gray-400">Mkt {pos.mkt}</span>
                              </div>
                              <span className="text-green-400 font-semibold">{pos.returns}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Position Dots */}
            <div className="flex justify-center gap-2 mt-4">
              {tradingPositions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPosition(index)}
                  className={`w-3 h-3 rounded-full transition-all ${index === currentPosition ? 'bg-green-500 w-6' : 'bg-gray-600'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Testimonials Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          What Our Clients Say
        </h2>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-xl p-6 border border-purple-100">
          <div className="flex items-center justify-center mb-4">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>
          <div className="relative overflow-hidden h-48">
            <div className="flex transition-transform duration-700 ease-in-out" style={{transform: `translateX(-${currentReview * 100}%)`}}>
              {reviews.map((review, index) => (
                <div key={index} className="w-full flex-shrink-0 px-4">
                  <div className="text-center h-full flex flex-col justify-center max-w-2xl mx-auto">
                    <img src={review.image} alt={review.name} className="w-16 h-16 rounded-full mx-auto mb-4 border-3 border-purple-300 shadow-lg" />
                    <p className="text-gray-700 italic mb-4 text-base leading-relaxed">"{review.text}"</p>
                    <p className="text-lg text-gray-900 font-bold">{review.name}</p>
                    <p className="text-sm text-gray-600">{review.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Reviews Dots */}
          <div className="flex justify-center gap-2 mt-4">
            {reviews.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentReview(index)}
                className={`w-3 h-3 rounded-full transition-all ${index === currentReview ? 'bg-purple-600 w-6' : 'bg-gray-300'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Available Traders Section */}
      <div className="relative py-20 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50"></div>
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)'
        }}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mb-4">
              <span className="text-white text-sm font-semibold tracking-wide">SEBI REGISTERED</span>
            </div>
            <h2 className="text-5xl font-extrabold mb-4">
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Meet Our Expert Traders
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Connect with verified professionals and get real-time trading insights
            </p>
          </div>

          {traders.length === 0 ? (
            <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">No traders available yet</h3>
              <p className="mt-2 text-gray-500">Check back soon for verified SEBI registered traders</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {traders.map((trader) => (
                <div key={trader.id} className="group relative">
                  {/* Card Glow Effect */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl opacity-0 group-hover:opacity-100 blur transition duration-500"></div>
                  
                  {/* Main Card */}
                  <div className="relative bg-white rounded-3xl shadow-xl transform transition-all duration-500 group-hover:scale-105 group-hover:shadow-2xl border border-gray-100">
                    {/* Gradient Header with Verified Badge */}
                    <div className="relative h-32 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 overflow-visible">`
                      {/* Animated Background Pattern */}
                      <div className="absolute inset-0 opacity-20">
                        <div className="absolute inset-0" style={{
                          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.1) 10px, rgba(255,255,255,.1) 20px)'
                        }}></div>
                      </div>
                      
                      {/* Verified Badge */}
                      <div className="absolute top-3 right-3 z-10">
                        <div className="bg-gradient-to-r from-emerald-400 to-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center shadow-lg animate-pulse">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          VERIFIED
                        </div>
                      </div>
                      
                      {/* Profile Section */}
                      <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-lg opacity-60"></div>
                          <img 
                            src={trader.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(trader.name)}&background=gradient&color=fff&size=200`}
                            alt={trader.name}
                            className="relative w-24 h-24 rounded-full border-4 border-white shadow-2xl object-cover"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Trader Info */}
                    <div className="pt-20 px-5 pb-5">
                      <div className="text-center mb-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{trader.name}</h3>
                        <p className="text-xs text-gray-500 font-mono bg-gray-100 inline-block px-3 py-1 rounded-full">
                          SEBI: {trader.sebi_reg}
                        </p>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {/* Trades Per Day */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 text-center border border-blue-100 hover:border-blue-300 transition-colors">
                          <div className="flex items-center justify-center mb-1">
                            <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                            </svg>
                          </div>
                          <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{trader.trades_per_day}</p>
                          <p className="text-xs text-gray-600 font-medium mt-1">Trades</p>
                        </div>
                        
                        {/* Services */}
                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-3 text-center border border-emerald-100 hover:border-emerald-300 transition-colors">
                          <div className="flex items-center justify-center mb-1">
                            <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                            </svg>
                          </div>
                          <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">{trader.total_services}</p>
                          <p className="text-xs text-gray-600 font-medium mt-1">Services</p>
                        </div>
                        
                        {/* Subscribers */}
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3 text-center border border-amber-100 hover:border-amber-300 transition-colors">
                          <div className="flex items-center justify-center mb-1">
                            <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                          </div>
                          <p className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">{trader.total_subscribers}</p>
                          <p className="text-xs text-gray-600 font-medium mt-1">Clients</p>
                        </div>
                      </div>

                      {/* Bio */}
                      <div className="mb-4">
                        <p className="text-gray-600 text-sm leading-relaxed text-center line-clamp-2 min-h-[2.5rem]">
                          {trader.bio || "Expert market insights and trading recommendations."}
                        </p>
                      </div>

                      {/* Explore Services Button */}
                      <button
                        onClick={() => {
                          if (!user) {
                            sessionStorage.setItem('redirectAfterLogin', `/trader/${trader.id}/services`);
                            navigate('/login');
                            return;
                          }
                          navigate(`/trader/${trader.id}/services`);
                        }}
                        className="w-full relative group/btn overflow-hidden rounded-xl transition-all duration-300"
                      >
                        {/* Animated Gradient Background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 transition-all duration-300"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 opacity-0 group-hover/btn:opacity-100 transition-all duration-500"></div>
                        
                        {/* Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                        
                        {/* Button Content */}
                        <div className="relative px-6 py-3.5 flex items-center justify-center">
                          <span className="text-white font-bold text-base tracking-wide">
                            Explore Services
                          </span>
                          <svg className="w-5 h-5 ml-2 text-white transform group-hover/btn:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>
                      </button>
                    </div>

                    {/* Card Footer Badge */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-3 border-t border-gray-200">
                      <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                          </svg>
                          Telegram
                        </span>
                        <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          Real-time
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
              <div className="absolute -top-2 -right-2 animate-ping">
                <div className="bg-green-400 rounded-full h-8 w-8 opacity-75"></div>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Subscription Successful!</h3>
              <p className="text-gray-600 mt-3 font-medium">
                {successMessage}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                ✨ Redirecting to your dashboard...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Contact Us Section */}
      <div className="relative bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 py-20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(236, 72, 153, 0.3) 0%, transparent 50%)'
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
              Get in Touch
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Have questions? We're here to help you start your trading journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Email Card */}
            <div className="group bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
              <div className="flex flex-col items-center text-center">
                <div className="bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full p-4 mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Email Us</h3>
                <p className="text-gray-300 text-sm mb-3">For general inquiries</p>
                <a href="mailto:support@trademint.in" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                  support@trademint.in
                </a>
              </div>
            </div>

            {/* Phone Card */}
            <div className="group bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
              <div className="flex flex-col items-center text-center">
                <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-full p-4 mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Call Us</h3>
                <p className="text-gray-300 text-sm mb-3">Mon-Fri 9AM-6PM IST</p>
                <a href="tel:+911234567890" className="text-green-400 hover:text-green-300 font-semibold transition-colors">
                  +91 123 456 7890
                </a>
              </div>
            </div>

            {/* Office Card */}
            <div className="group bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105">
              <div className="flex flex-col items-center text-center">
                <div className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-full p-4 mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Visit Us</h3>
                <p className="text-gray-300 text-sm mb-3">Our office location</p>
                <p className="text-purple-400 font-semibold">
                  Mumbai, Maharashtra<br />India
                </p>
              </div>
            </div>
          </div>

          {/* Social Media Links */}
          <div className="text-center">
            <p className="text-gray-300 mb-6">Follow us on social media</p>
            <div className="flex justify-center gap-6">
              <a href="#" className="bg-white/10 backdrop-blur-lg p-3 rounded-full hover:bg-white/20 transition-all hover:scale-110">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="bg-white/10 backdrop-blur-lg p-3 rounded-full hover:bg-white/20 transition-all hover:scale-110">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a href="#" className="bg-white/10 backdrop-blur-lg p-3 rounded-full hover:bg-white/20 transition-all hover:scale-110">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a href="#" className="bg-white/10 backdrop-blur-lg p-3 rounded-full hover:bg-white/20 transition-all hover:scale-110">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-white/20">
            <div className="flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
              <p>© 2025 TradeMint. All rights reserved.</p>
              <div className="flex gap-6 mt-4 md:mt-0">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-white transition-colors">Disclaimer</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
