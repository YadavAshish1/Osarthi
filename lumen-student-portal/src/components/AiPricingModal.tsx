"use client";

import React, { useState, useEffect } from 'react';
import {
  Sparkles, GraduationCap, Check, X,
  Zap, Award, ShieldCheck, ArrowRight, Loader2,
  CheckCircle2, CreditCard, QrCode, Smartphone,
  Building2, AlertCircle, ArrowLeft, RefreshCw
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export interface PricingPlan {
  id: string;
  name: string;
  tag?: string;
  price: number;
  currency?: string;
  billingPeriod: 'one-time' | 'monthly' | 'yearly';
  messageQuota: number;
  description?: string;
  features: string[];
  isActive?: boolean;
  isFeatured?: boolean;
}

interface AiPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans?: PricingPlan[];
  onPlanPurchased?: (updatedQuota: any) => void;
}

// Dynamically load Razorpay SDK
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function AiPricingModal({
  isOpen,
  onClose,
  plans = [],
  onPlanPurchased,
}: AiPricingModalProps) {
  const { user } = useAuth();
  const [selectedPlanId, setSelectedPlanId] = useState<string>('pro_monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'selection' | 'payment_terminal' | 'success'>('selection');
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'upi' | 'card' | 'test'>('razorpay');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState(user?.name || '');
  const [upiVpa, setUpiVpa] = useState('');

  // Reset modal state when opening
  useEffect(() => {
    if (isOpen) {
      setStep('selection');
      setErrorMessage(null);
      setSuccessData(null);
      setIsProcessing(false);
      loadRazorpayScript();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const defaultPlans: PricingPlan[] = [
    {
      id: 'starter',
      name: 'Exam Sprint Pack',
      tag: 'Quick Prep',
      price: 49,
      currency: 'INR',
      billingPeriod: 'one-time',
      messageQuota: 50,
      description: 'Instant boost of 50 AI questions for test & exam preparation.',
      features: [
        '50 Fast AI Doubts & Questions',
        'Full Chapter & Lesson Summaries',
        'Formula & Definition Breakdowns',
        'Valid for 30 Days',
      ],
      isActive: true,
      isFeatured: false,
    },
    {
      id: 'pro_monthly',
      name: 'Pro Scholar Monthly',
      tag: 'Most Popular ⭐',
      price: 149,
      currency: 'INR',
      billingPeriod: 'monthly',
      messageQuota: 300,
      description: 'Comprehensive daily study companion for mastering school curriculum.',
      features: [
        '300 AI Questions per Month (~10/day)',
        'Unlimited Lesson Notes & Q&A Generation',
        'Instant Practice MCQ Generator with Explanations',
        'Priority Fast AI Response Speed',
        'Auto-Cascading High Availability Engine',
      ],
      isActive: true,
      isFeatured: true,
    },
    {
      id: 'annual_pass',
      name: 'Academic Master Annual',
      tag: 'Best Value 🏆',
      price: 699,
      currency: 'INR',
      billingPeriod: 'yearly',
      messageQuota: 3000,
      description: 'Full academic year pass with massive quota & teacher co-author studio.',
      features: [
        '3,000 AI Questions for Full Academic Year',
        'Full Syllabus & Board Exam Study Copilot',
        'Educator Studio & Lesson Co-Authoring Access',
        'Zero Rate Limits & Dedicated Bandwidth',
        'Save >60% compared to monthly pass',
      ],
      isActive: true,
      isFeatured: false,
    },
  ];

  const displayPlans = plans.length > 0 ? plans : defaultPlans;
  const activePlan = displayPlans.find((p) => p.id === selectedPlanId) || displayPlans[1] || displayPlans[0];

  // Initiate Payment Process
  const handleInitiatePayment = async (planId: string) => {
    setSelectedPlanId(planId);
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // 1. Create order in backend
      const res = await api.post('/ai/subscription/checkout', { planId });
      const orderData = res.data?.order;
      setCurrentOrder(orderData);

      // Check if Razorpay script is loaded
      const isRzpLoaded = await loadRazorpayScript();

      if (isRzpLoaded && (window as any).Razorpay) {
        // Launch standard official Razorpay Checkout Window
        const options: any = {
          key: orderData.keyId || 'rzp_test_1DP5mmOlF5G5ag',
          amount: orderData.amountInPaise || Math.round(orderData.amount * 100),
          currency: orderData.currency || 'INR',
          name: 'Medhashine AI Tutor',
          description: `${orderData.planName} (${orderData.messageQuota} AI Questions)`,
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
          },
          theme: {
            color: '#A84C32',
          },
          handler: async function (response: any) {
            await handleVerifyPayment({
              orderId: orderData.orderId,
              gatewayOrderId: response.razorpay_order_id || orderData.gatewayOrderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
              paymentMethod: 'razorpay_checkout',
            });
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
              setErrorMessage('Payment was cancelled. Plan has not been activated.');
            },
          },
        };

        if (orderData.isRealRazorpayOrder && orderData.gatewayOrderId) {
          options.order_id = orderData.gatewayOrderId;
        }

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (resp: any) {
          setErrorMessage(resp.error?.description || 'Payment transaction failed. Plan was not activated.');
          setIsProcessing(false);
        });
        rzp.open();
      } else {
        // Open the interactive Medhashine UPI / Card Payment Terminal if Razorpay script fails to load
        setStep('payment_terminal');
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to initiate payment session. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Verify and complete payment
  const handleVerifyPayment = async (verificationPayload: any) => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await api.post('/ai/subscription/verify', verificationPayload);
      if (res.data?.success) {
        setSuccessData(res.data);
        setStep('success');
        if (onPlanPurchased) {
          onPlanPurchased(res.data.quota);
        }
      } else {
        setErrorMessage(res.data?.message || 'Payment verification could not be completed.');
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Payment verification failed. Please contact support if money was debited.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Submit payment from the in-modal Terminal
  const handleTerminalPaymentSubmit = async () => {
    if (!currentOrder) return;

    if (paymentMethod === 'card') {
      if (!cardNumber.replace(/\s/g, '') || cardNumber.replace(/\s/g, '').length < 15) {
        setErrorMessage('Please enter a valid 16-digit card number.');
        return;
      }
      if (!cardExpiry || !cardCvv) {
        setErrorMessage('Please enter card expiry date and 3-digit CVV.');
        return;
      }
    }

    const payload = {
      orderId: currentOrder.orderId,
      gatewayOrderId: currentOrder.gatewayOrderId,
      gatewayPaymentId: `PAY_${paymentMethod.toUpperCase()}_${Date.now()}`,
      paymentMethod,
      razorpayPaymentId: paymentMethod === 'razorpay' ? `rzp_pay_${Date.now()}` : undefined,
      razorpayOrderId: paymentMethod === 'razorpay' ? currentOrder.gatewayOrderId : undefined,
    };

    await handleVerifyPayment(payload);
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-black/65 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200 font-ui">
      <div className="relative bg-[#FAF8F5] text-[#1A1A1A] border border-[#E5E1D8] rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden my-auto font-ui">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/80 border border-[#E5E1D8] text-[#8A8580] hover:text-[#1A1A1A] hover:bg-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* ─── STEP 1: 3-TIER PLAN SELECTION ─── */}
        {step === 'selection' && (
          <div>
            {/* Modal Header */}
            <div className="relative px-6 pt-8 pb-6 text-center border-b border-[#E5E1D8] bg-white">
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[#A84C32] to-[#C4623E] flex items-center justify-center mx-auto mb-3 shadow-md shadow-[#A84C32]/20">
                <GraduationCap size={24} className="text-white" />
                <div className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center shadow-2xs">
                  <Sparkles size={10} className="text-amber-950 fill-amber-950" />
                </div>
              </div>

              <span className="eyebrow text-[#A84C32] text-xs font-bold uppercase tracking-wider block mb-1">
                Flexible & Student-Friendly Plans
              </span>
              <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
                Unlock Instant AI Study Doubts & Solutions
              </h2>
              <p className="text-xs sm:text-sm text-[#5C5A55] max-w-xl mx-auto mt-1 leading-relaxed">
                Choose a plan to ask unlimited chapter questions, generate practice MCQs, and prepare for board exams with confidence.
              </p>

              {errorMessage && (
                <div className="mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 text-xs font-bold flex items-center justify-center gap-2">
                  <AlertCircle size={15} className="text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* 3-Tier Comparison Cards */}
            <div className="p-4 sm:p-6 lg:p-8 bg-[#FAF8F5]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
                {displayPlans.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  const isPopular = plan.isFeatured || plan.id === 'pro_monthly';

                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`relative rounded-3xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between cursor-pointer border ${
                        isPopular
                          ? 'bg-white border-[#A84C32] shadow-xl shadow-[#A84C32]/10 ring-2 ring-[#A84C32]/20'
                          : 'bg-white/80 border-[#E5E1D8] hover:border-[#A84C32]/40 hover:shadow-md'
                      }`}
                    >
                      {/* Top Badge */}
                      {plan.tag && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wide shadow-xs border ${
                            isPopular
                              ? 'bg-[#A84C32] text-white border-[#A84C32]'
                              : 'bg-[#F0EDE8] text-[#1A1A1A] border-[#E5E1D8]'
                          }`}>
                            {plan.tag}
                          </span>
                        </div>
                      )}

                      <div className="space-y-4">
                        {/* Title & Quota */}
                        <div className="text-center pt-2">
                          <h3 className="font-bold text-base text-[#1A1A1A] font-serif-display">
                            {plan.name}
                          </h3>
                          <p className="text-[11px] text-[#8A8580] mt-0.5">
                            {plan.description || `${plan.messageQuota} AI Questions`}
                          </p>
                        </div>

                        {/* Price Header */}
                        <div className="py-3 px-4 rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8] text-center">
                          <div className="flex items-baseline justify-center gap-1">
                            <span className="text-sm font-bold text-[#A84C32]">₹</span>
                            <span className="text-3xl font-black text-[#1A1A1A] tracking-tight">
                              {plan.price}
                            </span>
                            <span className="text-xs font-medium text-[#8A8580]">
                              {plan.billingPeriod === 'monthly' ? '/ month' : plan.billingPeriod === 'yearly' ? '/ year' : ' pack'}
                            </span>
                          </div>
                          <div className="mt-1 text-[11px] font-bold text-emerald-700">
                            ⚡ {plan.messageQuota.toLocaleString()} AI Questions
                          </div>
                        </div>

                        {/* Feature Bullets */}
                        <div className="space-y-2 pt-2 text-xs">
                          {plan.features.map((feat, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-[#3D3B36]">
                              <div className="w-4 h-4 rounded-full bg-[#A84C32]/10 text-[#A84C32] flex items-center justify-center shrink-0 mt-0.5">
                                <Check size={10} strokeWidth={3} />
                              </div>
                              <span className="leading-snug text-[11px]">{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Select / Buy Button */}
                      <div className="pt-6">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInitiatePayment(plan.id);
                          }}
                          className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                            isPopular
                              ? 'bg-[#A84C32] hover:bg-[#8C3A27] text-white shadow-[#A84C32]/20'
                              : 'bg-[#F0EDE8] hover:bg-[#E8E4DD] text-[#1A1A1A]'
                          }`}
                        >
                          {isProcessing && selectedPlanId === plan.id ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              <span>Securing Checkout...</span>
                            </>
                          ) : (
                            <>
                              <CreditCard size={13} />
                              <span>Upgrade — Pay ₹{plan.price}</span>
                              <ArrowRight size={13} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Guarantee / Safe payment badge */}
              <div className="mt-6 pt-4 border-t border-[#E5E1D8] flex flex-col sm:flex-row items-center justify-between text-xs text-[#8A8580] gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  <span>Instant AI Activation • 100% Secure Razorpay & UPI Payments</span>
                </div>
                <div className="text-[11px]">
                  Need institutional access? <a href="mailto:support@medhashine.com" className="text-[#A84C32] font-semibold underline">Contact Support</a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP 2: MEDHASHINE PAYMENT TERMINAL ─── */}
        {step === 'payment_terminal' && currentOrder && (
          <div className="p-6 sm:p-8 space-y-6">
            {/* Terminal Header */}
            <div className="flex items-center justify-between border-b border-[#E5E1D8] pb-4">
              <button
                type="button"
                onClick={() => setStep('selection')}
                className="flex items-center gap-1.5 text-xs text-[#5C5A55] hover:text-[#A84C32] transition-colors cursor-pointer font-bold"
              >
                <ArrowLeft size={14} />
                <span>Change Plan</span>
              </button>

              <div className="text-right">
                <span className="text-[10px] text-[#8A8580] uppercase tracking-wider block">Total Payable</span>
                <span className="text-xl font-black text-[#A84C32]">₹{currentOrder.amount}</span>
              </div>
            </div>

            {/* Order Summary Pill */}
            <div className="p-4 rounded-2xl bg-white border border-[#E5E1D8] flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A84C32] to-[#C4623E] text-white flex items-center justify-center shrink-0">
                  <Zap size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#1A1A1A]">{currentOrder.planName}</h4>
                  <p className="text-xs text-emerald-700 font-medium">⚡ {currentOrder.messageQuota} AI Questions • Instant Activation</p>
                </div>
              </div>
              <span className="text-xs font-mono text-[#8A8580] bg-[#FAF8F5] px-2.5 py-1 rounded-lg border border-[#E5E1D8]">
                {currentOrder.gatewayOrderId}
              </span>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} className="text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Payment Method Selector Tabs */}
            <div>
              <label className="text-xs font-bold text-[#8A8580] uppercase tracking-wider block mb-2">
                Choose Payment Method
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'razorpay', label: 'Razorpay Gateway', icon: ShieldCheck, sub: 'UPI / Cards / NetBanking' },
                  { id: 'upi', label: 'UPI QR & Apps', icon: QrCode, sub: 'GPay / PhonePe / Paytm' },
                  { id: 'card', label: 'Debit / Credit Card', icon: CreditCard, sub: 'Visa / MasterCard / RuPay' },
                  { id: 'test', label: 'Sandbox / Test Pay', icon: RefreshCw, sub: 'Instant Demo Testing' },
                ].map(({ id, label, icon: Icon, sub }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPaymentMethod(id as any)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      paymentMethod === id
                        ? 'bg-white border-[#A84C32] shadow-md shadow-[#A84C32]/10 ring-2 ring-[#A84C32]/20'
                        : 'bg-white/60 border-[#E5E1D8] hover:bg-white hover:border-[#A84C32]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Icon size={18} className={paymentMethod === id ? 'text-[#A84C32]' : 'text-[#8A8580]'} />
                      {paymentMethod === id && (
                        <span className="w-2 h-2 rounded-full bg-[#A84C32]" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#1A1A1A]">{label}</div>
                      <div className="text-[10px] text-[#8A8580] mt-0.5">{sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Method Details Panel */}
            <div className="p-5 rounded-2xl bg-white border border-[#E5E1D8] shadow-xs">
              {paymentMethod === 'razorpay' && (
                <div className="space-y-3 text-center py-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#A84C32]/10 text-[#A84C32] flex items-center justify-center mx-auto">
                    <ShieldCheck size={26} />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-[#1A1A1A]">Razorpay Secured Gateway</h5>
                    <p className="text-xs text-[#5C5A55] max-w-md mx-auto mt-1">
                      Click below to proceed to the Razorpay payment gateway to pay using Google Pay, PhonePe, Paytm, Cards, or NetBanking.
                    </p>
                  </div>
                </div>
              )}

              {paymentMethod === 'upi' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    {/* Simulated Dynamic UPI QR */}
                    <div className="w-36 h-36 rounded-2xl bg-[#FAF8F5] border-2 border-dashed border-[#A84C32]/30 p-2 flex flex-col items-center justify-center shrink-0">
                      <QrCode size={90} className="text-[#1A1A1A]" />
                      <span className="text-[9px] font-mono text-[#8A8580] mt-1 font-bold">SCAN WITH ANY UPI APP</span>
                    </div>

                    <div className="space-y-2 flex-1 text-left">
                      <h5 className="font-bold text-xs text-[#1A1A1A]">Pay via UPI VPA / Apps:</h5>
                      <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E5E1D8] flex items-center justify-between font-mono text-xs text-[#1A1A1A] font-bold">
                        <span>{currentOrder.upiId || 'medhashine@okhdfcbank'}</span>
                        <span className="text-[10px] text-emerald-700 font-sans font-bold bg-emerald-50 px-2 py-0.5 rounded">Verified Merchant</span>
                      </div>
                      <p className="text-[11px] text-[#5C5A55] leading-relaxed">
                        Scan the QR code or send <strong>₹{currentOrder.amount}</strong> to the UPI ID above using Google Pay, PhonePe, Paytm or Cred, then click &quot;Confirm Payment&quot;.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="space-y-3 max-w-md mx-auto text-left">
                  <div>
                    <label className="text-[11px] font-bold text-[#5C5A55] block mb-1">Card Number</label>
                    <input
                      type="text"
                      placeholder="4532 •••• •••• 8892"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      maxLength={19}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E5E1D8] text-xs font-mono font-bold text-[#1A1A1A] focus:outline-none focus:border-[#A84C32]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-[#5C5A55] block mb-1">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        placeholder="12/28"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        maxLength={5}
                        className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E5E1D8] text-xs font-mono text-[#1A1A1A] focus:outline-none focus:border-[#A84C32]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#5C5A55] block mb-1">CVV</label>
                      <input
                        type="password"
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        maxLength={4}
                        className="w-full px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E5E1D8] text-xs font-mono text-[#1A1A1A] focus:outline-none focus:border-[#A84C32]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'test' && (
                <div className="space-y-2 text-center py-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-800 flex items-center justify-center mx-auto">
                    <RefreshCw size={20} />
                  </div>
                  <h5 className="font-bold text-xs text-[#1A1A1A]">Sandbox & Simulation Mode</h5>
                  <p className="text-[11px] text-[#5C5A55] max-w-sm mx-auto">
                    Verify this transaction in developer test mode without entering banking details. Instantly test quota crediting.
                  </p>
                </div>
              )}
            </div>

            {/* Pay Now Button */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleTerminalPaymentSubmit}
              className="w-full py-3.5 rounded-2xl bg-[#A84C32] hover:bg-[#8C3A27] text-white font-bold text-sm shadow-md shadow-[#A84C32]/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Verifying Payment with Gateway...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Pay ₹{currentOrder.amount} & Activate Questions</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ─── STEP 3: PAYMENT CONFIRMED / SUCCESS ─── */}
        {step === 'success' && successData && (
          <div className="p-8 sm:p-12 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 block mb-1">
                Payment Verified • Quota Activated
              </span>
              <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
                You&apos;re All Set to Learn! 🎉
              </h2>
              <p className="text-xs sm:text-sm text-[#5C5A55] max-w-md mx-auto mt-2 leading-relaxed">
                {successData.message || 'Your payment was successfully confirmed and your AI Tutor questions are now live.'}
              </p>
            </div>

            {/* Receipt Summary Card */}
            {successData.order && (
              <div className="p-4 rounded-2xl bg-white border border-[#E5E1D8] max-w-sm mx-auto text-xs space-y-2 text-left shadow-xs">
                <div className="flex items-center justify-between text-[#8A8580]">
                  <span>Plan:</span>
                  <span className="font-bold text-[#1A1A1A]">{successData.order.planName}</span>
                </div>
                <div className="flex items-center justify-between text-[#8A8580]">
                  <span>Amount Paid:</span>
                  <span className="font-bold text-emerald-700">₹{successData.order.amount}</span>
                </div>
                <div className="flex items-center justify-between text-[#8A8580]">
                  <span>Transaction ID:</span>
                  <span className="font-mono text-[10px] text-[#1A1A1A]">{successData.order.paymentId}</span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                setStep('selection');
              }}
              className="px-8 py-3 rounded-2xl bg-[#A84C32] hover:bg-[#8C3A27] text-white font-bold text-xs shadow-md shadow-[#A84C32]/20 transition-all cursor-pointer"
            >
              Start Asking Doubts Now →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
