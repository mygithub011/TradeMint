import React, { useState } from 'react';

export default function TermsModal({ isOpen, onAccept, onDecline, userEmail }) {
  const [accepted, setAccepted] = useState(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);

  if (!isOpen) return null;

  const handleScroll = (e) => {
    const element = e.target;
    const isAtBottom = Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 10;
    if (isAtBottom && !isScrolledToBottom) {
      setIsScrolledToBottom(true);
    }
  };

  const handleAccept = () => {
    if (accepted) {
      onAccept();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-6 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-center mb-2">
            <svg className="w-12 h-12 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-center">Terms & Conditions</h2>
          <p className="text-center text-indigo-100 mt-2">Please read carefully before proceeding</p>
        </div>

        {/* Terms Content */}
        <div 
          className="px-8 py-6 overflow-y-auto flex-1 text-gray-700"
          onScroll={handleScroll}
          style={{ maxHeight: 'calc(90vh - 280px)' }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
          {/* Column 1 */}
          <div className="space-y-4">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 col-span-full md:col-span-2">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold text-yellow-800 text-sm">IMPORTANT: PLEASE READ THESE TERMS AND CONDITIONS CAREFULLY BEFORE USING THE PLATFORM.</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 text-right italic md:col-span-2">Last Updated: 27/12/2025</p>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-2">1. INTRODUCTION</h3>
            <p className="leading-relaxed text-sm">
              TradeMint ("Platform", "We", "Us", "Our") is a technology-based Software-as-a-Service (SaaS) platform that enables users to access market-related content, research, and trade ideas shared by SEBI-registered individuals ("Service Providers"). <strong className="text-red-600">TradeMint itself does not provide any investment or trading advice.</strong>
            </p>
            <p className="leading-relaxed mt-2 text-sm">
              By accessing or using TradeMint, you agree to be bound by these Terms and Conditions.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-2">2. ELIGIBILITY</h3>
            <p className="leading-relaxed text-sm">
              You must be at least 18 years of age and legally capable of entering into a binding contract to use this platform.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-2">3. ROLE OF TRADEMINT</h3>
            <p className="leading-relaxed mb-2 text-sm">
              <strong className="text-red-600">TradeMint is not a SEBI-registered investment advisor, research analyst, or portfolio manager.</strong>
            </p>
            <p className="leading-relaxed mb-2 font-semibold text-sm">TradeMint does not:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Recommend or endorse any securities or trades</li>
              <li>Guarantee returns or profits</li>
              <li>Execute trades on behalf of users</li>
            </ul>
            <p className="leading-relaxed mt-2 text-sm">
              TradeMint only provides technological infrastructure including dashboards, subscription management, and communication tools.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-2">4. SERVICE PROVIDERS (SEBI REGISTERED TRADERS)</h3>
            <p className="leading-relaxed text-sm">
              All Service Providers onboarded on TradeMint are required to hold valid SEBI registrations.
            </p>
            <p className="leading-relaxed mt-2 text-sm">
              TradeMint displays SEBI registration details for transparency but does not verify or audit the quality or performance of services.
            </p>
            <p className="leading-relaxed mt-2 text-sm">
              Any advice, trade ideas, or market views are solely the responsibility of the respective Service Provider.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-2">5. USER RESPONSIBILITIES</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-semibold text-red-800 mb-2 text-sm">Users acknowledge that:</p>
              <ul className="list-disc pl-6 space-y-1 text-red-700 text-sm">
                <li><strong>Trading involves substantial financial risk</strong></li>
                <li><strong>Past performance is not indicative of future results</strong></li>
                <li><strong>All trading decisions are made at their own discretion and risk</strong></li>
              </ul>
              <p className="mt-3 font-semibold text-red-800 text-sm">
                Users agree not to hold TradeMint liable for any financial losses.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-2">6. SUBSCRIPTIONS & PAYMENTS</h3>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Subscriptions grant access to Service Provider content for a fixed duration.</li>
              <li><strong>All payments are non-refundable</strong> unless explicitly stated otherwise.</li>
              <li>TradeMint may charge platform fees for providing infrastructure services.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-2">7. TELEGRAM & THIRD-PARTY PLATFORMS</h3>
            <p className="leading-relaxed text-sm">
              TradeMint may facilitate access to third-party platforms such as Telegram.
            </p>
            <p className="leading-relaxed mt-2 text-sm">
              TradeMint is not responsible for downtime, message delays, or data loss caused by third-party services.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-2">8. PERFORMANCE METRICS</h3>
            <p className="leading-relaxed text-sm">
              Any performance data or analytics displayed are for informational purposes only and do not represent guaranteed outcomes.
            </p>
          </section>
          </div>

          {/* Column 2 */}
          <div className="space-y-4">
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-2">9. PROHIBITED USE</h3>
            <p className="leading-relaxed mb-2 text-sm">Users shall not:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Misuse or redistribute content</li>
              <li>Post misleading or illegal content</li>
              <li>Attempt to manipulate platform data</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-2">10. LIMITATION OF LIABILITY</h3>
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
              <p className="font-semibold mb-2 text-sm">TradeMint shall not be liable for:</p>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Financial losses</li>
                <li>Missed trade opportunities</li>
                <li>Indirect or consequential damages</li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-2">11. TERMINATION</h3>
            <p className="leading-relaxed text-sm">
              TradeMint reserves the right to suspend or terminate accounts that violate these terms.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-2">12. INTELLECTUAL PROPERTY</h3>
            <p className="leading-relaxed text-sm">
              All platform-related IP belongs to TradeMint. Content shared by Service Providers remains their responsibility.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-2">13. GOVERNING LAW</h3>
            <p className="leading-relaxed text-sm">
              These Terms shall be governed by the laws of India. Courts located in India shall have exclusive jurisdiction.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-2">14. AMENDMENTS</h3>
            <p className="leading-relaxed text-sm">
              TradeMint reserves the right to modify these Terms at any time. Continued use constitutes acceptance of updated terms.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-2">15. CONTACT</h3>
            <p className="leading-relaxed text-sm">
              For queries, contact: <a href="mailto:support@trademint.in" className="text-indigo-600 hover:text-indigo-700 font-semibold">support@trademint.in</a>
            </p>
          </section>
          </div>
          </div>

          {!isScrolledToBottom && (
            <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-8 pb-4 text-center">
              <p className="text-sm text-gray-500 animate-bounce">↓ Please scroll down to read all terms ↓</p>
            </div>
          )}
        </div>

        {/* Footer with Checkbox and Buttons */}
        <div className="bg-gray-50 px-8 py-6 rounded-b-2xl border-t border-gray-200 flex-shrink-0">
          <div className="mb-6">
            <label className="flex items-start space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-1 w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-gray-700 select-none group-hover:text-gray-900">
                <strong>I have read and understood the Terms & Conditions and Risk Disclosure.</strong>
              </span>
            </label>
          </div>

          <div className="flex gap-4">
            <button
              onClick={onDecline}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              disabled={!accepted}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                accepted
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Accept & Continue
            </button>
          </div>

          {userEmail && (
            <p className="text-xs text-gray-500 text-center mt-4">
              By accepting, {userEmail} agrees to all terms and conditions
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
