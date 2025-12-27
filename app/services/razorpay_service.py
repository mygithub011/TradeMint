import razorpay
from app.utils.config import settings
import logging

logger = logging.getLogger(__name__)

class RazorpayService:
    def __init__(self):
        # Initialize Razorpay client with credentials from config
        self.client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        self.client.set_app_details({"title": "TradeMint", "version": "1.0"})
    
    def create_order(self, amount: int, currency: str = "INR", receipt: str = None, notes: dict = None):
        """
        Create a Razorpay order for payment.
        
        Args:
            amount: Amount in smallest currency unit (paise for INR)
            currency: Currency code (default: INR)
            receipt: Unique receipt ID for internal reference
            notes: Additional metadata
        
        Returns:
            Order object with id, amount, currency, etc.
        """
        try:
            order_data = {
                "amount": amount,  # Amount in paise
                "currency": currency,
                "receipt": receipt or f"receipt_{amount}",
                "notes": notes or {}
            }
            
            order = self.client.order.create(data=order_data)
            logger.info(f"Razorpay order created: {order['id']}")
            return order
            
        except Exception as e:
            logger.error(f"Error creating Razorpay order: {e}")
            raise Exception(f"Failed to create payment order: {str(e)}")
    
    def verify_payment_signature(self, razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str) -> bool:
        """
        Verify payment signature to ensure payment authenticity.
        
        Args:
            razorpay_order_id: Order ID from Razorpay
            razorpay_payment_id: Payment ID received after payment
            razorpay_signature: Signature to verify
        
        Returns:
            True if signature is valid, False otherwise
        """
        try:
            params_dict = {
                'razorpay_order_id': razorpay_order_id,
                'razorpay_payment_id': razorpay_payment_id,
                'razorpay_signature': razorpay_signature
            }
            
            # This will raise SignatureVerificationError if signature is invalid
            self.client.utility.verify_payment_signature(params_dict)
            logger.info(f"Payment signature verified for order: {razorpay_order_id}")
            return True
            
        except razorpay.errors.SignatureVerificationError as e:
            logger.error(f"Payment signature verification failed: {e}")
            return False
        except Exception as e:
            logger.error(f"Error verifying payment signature: {e}")
            return False
    
    def get_payment_details(self, payment_id: str):
        """Fetch payment details from Razorpay."""
        try:
            payment = self.client.payment.fetch(payment_id)
            return payment
        except Exception as e:
            logger.error(f"Error fetching payment details: {e}")
            return None
    
    def refund_payment(self, payment_id: str, amount: int = None, notes: dict = None):
        """
        Initiate a refund for a payment.
        
        Args:
            payment_id: Razorpay payment ID
            amount: Amount to refund (in paise). If None, full refund
            notes: Additional metadata for refund
        
        Returns:
            Refund object
        """
        try:
            refund_data = {
                "notes": notes or {}
            }
            
            if amount:
                refund_data["amount"] = amount
            
            refund = self.client.payment.refund(payment_id, refund_data)
            logger.info(f"Refund initiated: {refund['id']} for payment: {payment_id}")
            return refund
            
        except Exception as e:
            logger.error(f"Error initiating refund: {e}")
            raise Exception(f"Failed to initiate refund: {str(e)}")

# Singleton instance
razorpay_service = RazorpayService()
