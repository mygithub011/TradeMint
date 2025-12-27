import api from './api';

export const paymentService = {
  /**
   * Create Razorpay order for a service subscription
   */
  createOrder: async (serviceId, customPrice = null, customDuration = null) => {
    const payload = { service_id: serviceId };
    if (customPrice !== null) payload.custom_price = customPrice;
    if (customDuration !== null) payload.custom_duration = customDuration;
    
    const response = await api.post('/payments/create-order', payload);
    return response.data;
  },

  /**
   * Verify payment after Razorpay checkout
   */
  verifyPayment: async (paymentData) => {
    const response = await api.post('/payments/verify', paymentData);
    return response.data;
  },

  /**
   * Get all payments made by current user
   */
  getMyPayments: async () => {
    const response = await api.get('/payments/my-payments');
    return response.data;
  },

  /**
   * Get details of a specific payment
   */
  getPaymentDetails: async (paymentId) => {
    const response = await api.get(`/payments/payment/${paymentId}`);
    return response.data;
  },

  /**
   * Initialize Razorpay checkout and process payment
   */
  processPayment: async (orderData, serviceData, onSuccess, onFailure) => {
    // Load Razorpay script if not already loaded
    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
      
      await new Promise((resolve) => {
        script.onload = resolve;
      });
    }

    const options = {
      key: orderData.key_id,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'TradeMint',
      description: `Subscription: ${serviceData.name}`,
      order_id: orderData.order_id,
      handler: async function (response) {
        try {
          // Verify payment on backend
          const verifyData = {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            service_id: serviceData.id
          };
          
          const result = await paymentService.verifyPayment(verifyData);
          onSuccess(result);
        } catch (error) {
          console.error('Payment verification failed:', error);
          onFailure(error);
        }
      },
      prefill: {
        name: serviceData.traderName || '',
        email: 'test@example.com',
        contact: '9999999999'
      },
      notes: {
        service_id: serviceData.id,
        service_name: serviceData.name
      },
      theme: {
        color: '#6A5AE0'
      },
      modal: {
        ondismiss: function() {
          onFailure(new Error('Payment cancelled by user'));
        }
      }
    };

    const razorpayInstance = new window.Razorpay(options);
    razorpayInstance.open();
  }
};
