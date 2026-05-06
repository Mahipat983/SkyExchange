import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { walletController, userController } from '../controllers';
import { useAuthStore } from '../store/authStore';
import { useSnackbarStore } from '../store/snackbarStore';
import { formatTime12h } from '../utils/format';

const QUICK_AMOUNTS = [500, 1000, 5000, 10000, 50000, 100000];

export default function DepositPage() {
  const navigate = useNavigate();
  const { show: showSnackbar } = useSnackbarStore();
  const { loginToken, isLoggedIn } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [depositMethods, setDepositMethods] = useState([]);
  const [activeMethodId, setActiveMethodId] = useState(null);
  const [history, setHistory] = useState([]);

  const [step, setStep] = useState(1); // 1: Amount, 2: Method selection & details
  const [utr, setUtr] = useState('');
  const [txHash, setTxHash] = useState('');
  const [amount, setAmount] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotName, setScreenshotName] = useState('');
  const [screenshotMime, setScreenshotMime] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [userHasSelectedManually, setUserHasSelectedManually] = useState(false);

  const fileRef = useRef(null);

  const fetchData = async () => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    const token = useAuthStore.getState().getToken();
    if (!token) return;

    try {
      setMethodsLoading(true);
      setHistoryLoading(true);

      const [methodsRes, historyRes] = await Promise.all([
        walletController.getDepositMethods(loginToken).catch(e => {
          showSnackbar('Failed to load payment methods', 'error');
          return {};
        }),
        walletController.getDepositHistory(loginToken).catch(e => {
          showSnackbar('Failed to load history', 'error');
          return {};
        })
      ]);

      if (methodsRes) {
        let methods = [];
        // Extract data - check common keys, or check if the response itself is the list (object with numeric keys)
        const possibleData = methodsRes.data || methodsRes.list || methodsRes.depositlist || methodsRes.banklist || methodsRes.BankList || methodsRes.methods;

        const rawData = possibleData || (typeof methodsRes === 'object' && !methodsRes.error && Object.keys(methodsRes).some(k => !isNaN(k)) ? methodsRes : null);

        if (Array.isArray(rawData)) {
          methods = rawData;
        } else if (rawData && typeof rawData === 'object') {
          methods = Object.values(rawData).filter(v => v && typeof v === 'object');
        } else if (Array.isArray(methodsRes)) {
          methods = methodsRes;
        }
        setDepositMethods(methods);
      }

      if (historyRes) {
        let historyData = [];
        const possibleHistory = historyRes.data || historyRes.list;
        const raw = possibleHistory || (typeof historyRes === 'object' && !historyRes.error && Object.keys(historyRes).some(k => !isNaN(k)) ? historyRes : historyRes);

        if (Array.isArray(raw)) {
          historyData = raw;
        } else if (raw && typeof raw === 'object') {
          historyData = Object.values(raw).filter(v => v && typeof v === 'object' && (v.Amount !== undefined || v.amount !== undefined || v[0] !== undefined));
        }
        setHistory(historyData);
      }
    } catch (error) {
      console.error('Failed to fetch deposit data:', error);
      showSnackbar('Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
      setMethodsLoading(false);
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [isLoggedIn, loginToken]);

  const filteredMethods = useMemo(() => {
    const amt = parseFloat(amount) || 0;
    const filtered = depositMethods.filter(m => {
      const min = parseFloat(m.Min || m.min_deposit || 0);
      const max = parseFloat(m.Max || m.max_deposit || 100000000);
      return amt >= min && amt <= max;
    });

    const sorted = [...filtered].sort((a, b) => {
      const aType = (a.Type || a.type || 'BANK').toUpperCase();
      const bType = (b.Type || b.type || 'BANK').toUpperCase();
      const aName = (a.Name || a.bankname || '').toUpperCase();
      const bName = (b.Name || b.bankname || '').toUpperCase();

      const isACrypto = aType === 'CRYPTO' || aType === 'USDT' || aName.includes('USDT');
      const isBCrypto = bType === 'CRYPTO' || bType === 'USDT' || bName.includes('USDT');

      if (isACrypto && !isBCrypto) return 1;
      if (!isACrypto && isBCrypto) return -1;
      if (aType === 'BANK' && bType !== 'BANK') return -1;
      if (aType !== 'BANK' && bType === 'BANK') return 1;
      return 0;
    });

    const whatsapp = {
      Bank_Id: 'whatsapp',
      Name: 'Whatsapp Deposit',
      Type: 'WHATSAPP',
      isWhatsapp: true
    };

    return [whatsapp, ...sorted.filter(m => !m.isWhatsapp)];
  }, [amount, depositMethods]);

  useEffect(() => {
    if (filteredMethods.length > 0) {
      const currentSelected = filteredMethods.find(m => String(m.Bank_Id || m.Id || m.id) === activeMethodId);
      const firstRealMethod = filteredMethods.find(m => !m.isWhatsapp);
      const firstRealId = firstRealMethod ? String(firstRealMethod.Bank_Id || firstRealMethod.Id || firstRealMethod.id) : null;

      const isCurrentValid = !!currentSelected && !currentSelected.isWhatsapp;

      if (!isCurrentValid || (!userHasSelectedManually && activeMethodId !== firstRealId)) {
        if (firstRealId) {
          setActiveMethodId(firstRealId);
        } else {
          setActiveMethodId(null);
        }
      }
    } else {
      setActiveMethodId(null);
    }
  }, [filteredMethods, userHasSelectedManually]);

  const activeMethod = filteredMethods.find(m => String(m.Bank_Id || m.Id || m.id) === activeMethodId);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotName(file.name);
    setScreenshotMime(file.type);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setScreenshot(base64String.split(',')[1] || base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!activeMethodId) {
      showSnackbar('Please select a payment method', 'error');
      return;
    }
    const cleanAmount = parseFloat(amount);
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      showSnackbar('Please enter a valid amount', 'error');
      return;
    }

    const min = parseFloat(activeMethod?.Min || 0);
    const max = parseFloat(activeMethod?.Max || 100000000);
    if (cleanAmount < min) {
      showSnackbar(`Minimum amount for this method is ₹${min}`, 'error');
      return;
    }
    if (cleanAmount > max) {
      showSnackbar(`Maximum amount for this method is ₹${max}`, 'error');
      return;
    }

    const methodType = (activeMethod.Type || activeMethod.type || '').toUpperCase();
    const isCrypto = methodType === 'CRYPTO' || methodType === 'USDT';

    if (!utr.trim()) {
      showSnackbar(isCrypto ? 'Please enter USDT Reference No' : 'Please enter valid UTR/Reference ID', 'error');
      return;
    }

    if (isCrypto && !txHash.trim()) {
      showSnackbar('Please enter TX Hash', 'error');
      return;
    }

    if (!agreed) {
      showSnackbar('Please agree to the terms', 'error');
      return;
    }

    const token = useAuthStore.getState().getToken();
    if (!token) return;

    setSubmitting(true);
    try {
      let response;
      if (isCrypto) {
        response = await walletController.depositUSDT({
          LoginToken: loginToken,
          Amount: amount,
          usdt_ref: utr,
          Mime_type: screenshotMime,
          Screenshot: screenshot || '',
          txhash: txHash
        });
      } else {
        response = await walletController.requestDeposit({
          LoginToken: loginToken,
          Amount: amount,
          Utr: utr,
          BankId: activeMethodId,
          Mime_type: screenshotMime,
          Screenshot: screenshot || ''
        });
      }

      if (response.error === '0') {
        showSnackbar(response.msg || 'Deposit request submitted successfully', 'success');
        setUtr('');
        setTxHash('');
        setScreenshot(null);
        setScreenshotName('');
        setAgreed(false);
        fetchData(); // Refresh history
      } else {
        showSnackbar(response.msg || 'Failed to submit deposit request', 'error');
      }
    } catch (error) {
      showSnackbar('An error occurred during submission', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text);
    showSnackbar('Copied to clipboard!', 'success');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#eee] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#ffb400]" />
      </div>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen pb-24 bg-[#eee] text-[#222] font-sans selection:bg-[#ffb400]/30">
        {/* ── Sub Header / Breadcrumb ── */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#ffb400] border-b border-black/10 shadow-sm">
          <div className="flex items-center gap-1">
            <button onClick={() => step === 1 ? navigate(-1) : setStep(1)} className="text-black pr-2 transition-transform active:scale-90">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <div className="flex flex-col">
              <h1 className="text-[14px] font-black text-black uppercase tracking-tight">Deposit Funds</h1>
            </div>
          </div>
        </div>

      <div className="w-full mx-auto px-4 md:px-8 lg:px-10 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">

          {/* ── LEFT AREA: Deposit Step 1 or 2 ── */}
          <div className="xl:col-span-12 2xl:col-span-7 space-y-8 animate-in fade-in duration-500">
            {step === 1 ? (
              /* Step 1 Content */
              <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="bg-white border border-[#ccc] rounded-xl p-8 shadow-md space-y-6">
                  <div className="space-y-3">
                    <label className="text-[14px] font-black uppercase tracking-wider text-[#444] ml-1">Deposit Amount</label>
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="relative flex-1 group">
                        <input
                          type="number"
                          placeholder="Enter amount"
                          value={amount}
                          onChange={(e) => {
                            setAmount(e.target.value);
                            if (!e.target.value) setUserHasSelectedManually(false);
                          }}
                          className="w-full h-16 bg-[#f4f4f4] border-2 border-[#ddd] rounded-xl px-5 text-2xl font-black text-[#111] focus:outline-none focus:border-[#ffb400] transition-all placeholder:text-black/10"
                        />
                      </div>
                      <button
                        onClick={() => parseFloat(amount) > 0 ? setStep(2) : showSnackbar('Please enter valid amount', 'error')}
                        className="h-16 w-full md:w-auto px-10 bg-[#ffb400] hover:bg-[#ffc800] text-black rounded-xl font-black tracking-widest uppercase shadow-md active:scale-[0.98] transition-all"
                      >
                        SUBMIT
                      </button>
                    </div>
                  </div>

                  {/* Quick Amounts */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {QUICK_AMOUNTS.map(amt => (
                      <button
                        key={amt}
                        onClick={() => setAmount(amt.toString())}
                        className={`h-12 rounded-xl text-[12px] font-black transition-all ${amount === amt.toString() ? 'bg-[#ffb400] text-black shadow-md' : 'bg-black/5 hover:bg-black/10 text-[#555]'}`}
                      >
                        +₹{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-[#ccc] rounded-xl p-8 space-y-4 shadow-sm">
                  {[
                    "Deposit money only in the below available accounts to get the fastest credits.",
                    "Deposits made 45 minutes after account removal are valid.",
                    "Site is not responsible for money deposited to Old/Inactive accounts.",
                    "After deposit, add your UTR and amount to receive balance.",
                    "NEFT receiving time varies from 40 minutes to 2 hours.",
                    "Modification: payment valid for 1 hour after change."
                  ].map((text, i) => (
                    <div key={i} className="flex gap-4 text-[#333]">
                      <span className="font-black text-sm text-[#ffb400] shrink-0">{i + 1}.</span>
                      <p className="font-bold text-[14px] opacity-90">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Step 2 Content */
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                {/* Bank Selector */}
                <div className="space-y-4">
                  <label className="text-[14px] font-black uppercase tracking-wider text-[#444] ml-1">Select Payment Method</label>
                  {methodsLoading ? (
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                      {Array(4).fill(0).map((_, i) => <div key={i} className="min-w-[100px] h-24 rounded-2xl bg-[#eee] animate-pulse" />)}
                    </div>
                  ) : filteredMethods.length === 0 ? (
                    <div className="py-8 text-center text-[#ffb400] font-black uppercase tracking-widest text-xs">
                      NO BANKS AVAILABLE FOR ₹{parseFloat(amount).toLocaleString()}
                    </div>
                  ) : (
                    <div className="flex gap-2 md:gap-4 overflow-x-auto no-scrollbar pb-2">
                      {filteredMethods.map((pm) => {
                        const id = String(pm.Bank_Id || pm.id || pm.Id);
                        const isActive = activeMethodId === id;

                        const rawType = (pm.Type || pm.type || 'BANK').toUpperCase();
                        let displayName = pm.isWhatsapp ? 'WhatsApp' : (rawType === 'BANK' ? (pm.Name || 'Bank') : rawType);

                        // Icon Mapping (using flaticon as fallbacks for "pixel perfect" feel)
                        let iconPath = 'https://cdn-icons-png.flaticon.com/512/10009/10009224.png'; // Bank
                        if (rawType.includes('GOOGLE') || rawType === 'GPAY') iconPath = 'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/google-pay-icon.png';
                        else if (rawType.includes('PAYTM')) iconPath = 'https://cdn.iconscout.com/icon/free/png-256/free-paytm-226448.png';
                        else if (rawType.includes('PHONE')) iconPath = 'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/phonepe-logo-icon.png';
                        else if (rawType === 'UPI') iconPath = 'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/upi-icon.png';
                        else if (rawType === 'CRYPTO' || rawType === 'USDT') iconPath = 'https://cryptologos.cc/logos/tether-usdt-logo.png';
                        else if (rawType === 'WHATSAPP') iconPath = 'https://cdn-icons-png.flaticon.com/512/124/124034.png';

                        return (
                          <button
                            key={id}
                            onClick={() => {
                              if (pm.isWhatsapp) {
                                window.open('https://wa.me/your_number', '_blank');
                              } else {
                                setActiveMethodId(id);
                                setUserHasSelectedManually(true);
                              }
                            }}
                            className={`flex flex-col items-center justify-center gap-1.5 p-1 pt-2 rounded-xl border-2 transition-all flex-shrink-0 min-w-[95px] ${isActive ? 'bg-[#ffb400]/10 border-[#ffb400] text-black shadow-sm' : 'border-[#ddd] bg-white text-[#666] hover:border-[#ccc]'}`}
                          >
                            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-1.5 shadow-sm overflow-hidden border border-black/5">
                              <img src={iconPath} alt="" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-tight text-center truncate w-full px-1">{displayName}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Bank Details Card */}
                  <div className="space-y-6">
                    <div className="bg-white border border-[#ccc] rounded-xl overflow-hidden p-6 space-y-1 shadow-md min-h-[300px] flex flex-col justify-center relative">
                      {activeMethod ? (
                        <div className="space-y-1 animate-in fade-in duration-300">
                          {(() => {
                            const type = (activeMethod.Type || activeMethod.type || 'BANK').toUpperCase();

                            if (type === 'CRYPTO' || type === 'USDT') {
                              return (
                                <>
                                  <AccountDetailRow label="Wallet Name" value={activeMethod.Name || activeMethod.bankname} onCopy={handleCopy} />
                                  <AccountDetailRow label="Wallet Address" value={activeMethod.Id || activeMethod.id} onCopy={handleCopy} />
                                  <AccountDetailRow label="Min Amount" value={`₹ ${activeMethod.Min || '100'}`} />
                                  <AccountDetailRow label="Max Amount" value={`₹ ${activeMethod.Max || '10000'}`} />
                                </>
                              );
                            }

                            if (type === 'UPI' || type.includes('PAYTM') || type.includes('GOOGLE') || type.includes('PHONE') || type === 'GPAY') {
                              return (
                                <>
                                  <AccountDetailRow label="Name" value={activeMethod.BankACnme} onCopy={handleCopy} />
                                  <AccountDetailRow label="UPI ID" value={activeMethod.Id || activeMethod.id || activeMethod.AcNo} onCopy={handleCopy} />
                                  <AccountDetailRow label="Min Amount" value={`₹ ${activeMethod.Min || '200'}`} />
                                  <AccountDetailRow label="Max Amount" value={`₹ ${activeMethod.Max || '1cr'}`} />
                                </>
                              );
                            }

                            // Default: BANK
                            return (
                              <>
                                <AccountDetailRow label="Bank Name" value={activeMethod.Name || activeMethod.bankname} onCopy={handleCopy} />
                                <AccountDetailRow label="A/C No" value={activeMethod.AcNo} onCopy={handleCopy} />
                                <AccountDetailRow label="IFSC Code" value={activeMethod.Isfc} onCopy={handleCopy} />
                                <AccountDetailRow label="Account Name" value={activeMethod.BankACnme} onCopy={handleCopy} />
                                <AccountDetailRow label="Min Amount" value={`₹ ${activeMethod.Min || '200'}`} />
                                <AccountDetailRow label="Max Amount" value={`₹ ${activeMethod.Max || '1cr'}`} />
                              </>
                            );
                          })()}

                          {activeMethod.Qr && (
                            <div className="pt-4 flex justify-center">
                              <div className="bg-white p-3 rounded-2xl w-44 shadow-lg active:scale-110 transition-transform cursor-pointer">
                                <img src={activeMethod.Qr.includes('base64') ? activeMethod.Qr : `data:image/jpeg;base64,${activeMethod.Qr}`} className="w-full" alt="QR" />
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center space-y-3 opacity-20 flex flex-col items-center">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M11 10v11M15 10v11M20 10v11" /></svg>
                          <p className="uppercase font-black tracking-[0.3em] text-[10px]">Select a Payment Method</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form Card */}
                    <div className="bg-white border border-[#ccc] rounded-xl p-8 space-y-6 shadow-md">
                      <div className="space-y-1.5">
                        <p className="text-[12px] font-black uppercase tracking-widest text-[#444] ml-1">
                          {activeMethod && ['CRYPTO', 'USDT'].includes((activeMethod.Type || activeMethod.type || '').toUpperCase()) ? 'USDT Reference No' : 'UTR / Reference Number'} <span className="text-red-500">*</span>
                        </p>
                        <input
                          type="text"
                          value={utr}
                          onChange={(e) => setUtr(e.target.value)}
                          placeholder={activeMethod && ['CRYPTO', 'USDT'].includes((activeMethod.Type || activeMethod.type || '').toUpperCase()) ? '10 Digit USDT Reference No' : '6 to 12 Digit UTR Number'}
                          className="w-full h-12 bg-[#f4f4f4] border border-[#ddd] rounded-xl px-4 text-sm font-bold text-[#111] focus:outline-none focus:border-[#ffb400] transition-all"
                        />
                      </div>

                    {activeMethod && ['CRYPTO', 'USDT'].includes((activeMethod.Type || activeMethod.type || '').toUpperCase()) && (
                      <div className="space-y-1.5 animate-in slide-in-from-bottom-2">
                        <p className="text-[12px] font-black uppercase tracking-widest text-[#666] ml-1">TX Hash <span className="text-red-500">*</span></p>
                        <input
                          type="text"
                          value={txHash}
                          onChange={(e) => setTxHash(e.target.value)}
                          placeholder="Paste transaction hash"
                          className="w-full h-12 bg-[#f9f9f9] border border-[#ddd] rounded-xl px-4 text-sm font-bold text-[#111] focus:outline-none focus:border-[#ffb400] transition-all"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-[12px] font-black uppercase tracking-widest text-[#666] ml-1">Payment Proof <span className="text-red-500 font-medium">[Required]</span></p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => fileRef.current?.click()}
                          className="h-10 px-6 bg-[#f4f4f4] border border-[#ddd] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#eee] transition-all flex items-center gap-2 text-black"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                          {screenshotName ? 'Change' : 'Choose file'}
                        </button>
                        <span className="text-[10px] font-bold text-[#888] truncate max-w-[150px]">
                          {screenshotName || 'No file chosen'}
                        </span>
                      </div>
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <p className="text-[12px] font-black uppercase tracking-widest text-[#666] ml-1">Confirm Amount</p>
                      <input
                        type="number"
                        value={amount}
                        readOnly
                        className="w-full h-12 bg-[#f4f4f4] border border-[#ddd] rounded-xl px-4 text-sm font-black text-[#111] focus:outline-none cursor-not-allowed opacity-60"
                      />
                    </div>

                    <div className="flex items-start gap-3 pt-2">
                      <input
                        type="checkbox"
                        id="agree-terms"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="w-5 h-5 rounded border-[#ddd] bg-[#f4f4f4] accent-[#ffb400] mt-0.5 cursor-pointer"
                      />
                      <label htmlFor="agree-terms" className="text-[11px] font-bold text-[#666] leading-relaxed cursor-pointer select-none">
                        I confirm that I have transferred ₹{amount} and agree with the terms of payment.
                      </label>
                    </div>

                    <button
                      disabled={submitting}
                      onClick={handleSubmit}
                      className={`w-full h-14 rounded-xl font-black uppercase tracking-widest transition-all ${submitting ? 'bg-black/5 text-black/20' : 'bg-[#ffb400] hover:bg-[#ffc800] text-black shadow-md active:scale-[0.98]'}`}
                    >
                      {submitting ? 'Processing...' : 'SUBMIT REQUEST'}
                    </button>
                  </div>
                </div>

                {/* Bottom Instructions */}
                <div className="bg-white border border-[#ccc] rounded-xl p-8 space-y-4 shadow-sm">
                  {[
                    "Deposit money only in the below available accounts to get the fastest credits.",
                    "Deposits made 45 minutes after account removal are valid.",
                    "Site is not responsible for money deposited to Old/Inactive accounts.",
                    "After deposit, add your UTR and amount to receive balance.",
                    "NEFT receiving time varies from 40 minutes to 2 hours.",
                    "Modification: payment valid for 1 hour after change."
                  ].map((text, i) => (
                    <div key={i} className="flex gap-4">
                      <span className="shrink-0 font-black text-sm text-[#ffb400]">{i + 1}.</span>
                      <p className="text-[14px] font-bold text-[#444] leading-relaxed">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT AREA: Transaction History ── */}
          <div className="xl:col-span-12 2xl:col-span-5 flex flex-col min-h-[855px]">
            <div className="flex-1 flex flex-col bg-white border border-[#ccc] rounded-xl overflow-hidden shadow-md relative">
              <div className="p-6 border-b border-[#eee] flex items-center justify-between bg-[#f9f9f9]">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#111]">Transaction History</h3>
                <div className="flex items-center gap-1.5 text-[9px] font-black text-[#ffb400] uppercase tracking-widest">
                  <div className="w-1 h-1 rounded-full bg-current animate-pulse" />
                  Live Activity
                </div>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
                <div className="min-w-[600px]">
                  {/* Table Header */}
                  <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_2fr] px-6 py-4 bg-[#eee] text-[10px] font-black text-[#666] uppercase tracking-[0.1em] sticky top-0 z-10 border-b border-[#ddd]">
                    <span>TXN ID / UTR</span>
                    <span className="text-center">METHOD</span>
                    <span className="text-center">AMOUNT</span>
                    <span className="text-center">STATUS</span>
                    <span className="text-right">DATE & TIME</span>
                  </div>

                  {historyLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-[#ccc]">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#ffb400]" />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em]">Syncing...</span>
                    </div>
                  ) : history.length === 0 ? (
                    <div className="py-40 text-center opacity-20 flex flex-col items-center gap-4">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                      <p className="text-[10px] font-black uppercase tracking-widest">No Recent Deposits</p>
                    </div>
                  ) : (
                    history.map((item, i) => {
                      const utr = item.Utr || item.utr || item.id || '---';
                      const status = (item.Status || 'Pending').toLowerCase();
                      const method = item.Method || item.method || 'Bank';
                      const amt = parseFloat(item.Amount || item.amount || 0);

                      return (
                        <div key={i} className={`grid grid-cols-[1.5fr_1fr_1fr_1fr_2fr] items-center px-6 py-4 border-b border-[#eee] transition-all hover:bg-black/[0.02] ${i % 2 === 0 ? 'bg-transparent' : 'bg-[#fcfcfc]'}`}>
                          <div className="flex items-center gap-2 min-w-0 group/utr">
                            <span className="text-[11px] font-black text-black uppercase tracking-tighter break-all">{utr}</span>
                            <button 
                              onClick={() => handleCopy(utr)}
                              className="opacity-0 group-hover/utr:opacity-100 p-1 text-[#ffb400] hover:scale-110 transition-all active:scale-90"
                              title="Copy UTR"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                            </button>
                          </div>
                          <span className="text-[12px] font-black text-[#444] uppercase text-center tracking-tighter italic">{method}</span>
                          <span className="text-[15px] font-black text-[#111] text-center tracking-tighter">₹{amt.toLocaleString()}</span>
                          <div className="flex justify-center">
                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter shadow-sm border ${
                              status === 'success' || status === 'approved' 
                                ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                                : status === 'failed' || status === 'rejected' || status === 'cancel'
                                  ? 'bg-red-500/10 text-red-600 border-red-500/20' 
                                  : 'bg-[#ffb400]/10 text-[#ffb400] border-[#ffb400]/20'
                            }`}>
                              {item.Status || 'Pending'}
                            </span>
                          </div>
                          <div className="text-[11px] font-black text-[#888] text-right leading-tight uppercase tracking-tighter">
                            {(() => {
                              const dStr = item.Date || item.date || item.created_at;
                              if (!dStr) return '---';
                              
                              // Manual parse for DD-MM-YYYY HH:mm:ss
                              let date;
                              const parts = dStr.split(/[-/ :]/);
                              if (parts.length >= 3) {
                                const day = parseInt(parts[0], 10);
                                const month = parseInt(parts[1], 10) - 1;
                                const year = parseInt(parts[2], 10);
                                const hour = parseInt(parts[3] || '0', 10);
                                const minute = parseInt(parts[4] || '0', 10);
                                const second = parseInt(parts[5] || '0', 10);
                                
                                if (year > 1000) {
                                  date = new Date(year, month, day, hour, minute, second);
                                } else {
                                  date = new Date(dStr);
                                }
                              } else {
                                date = new Date(dStr);
                              }

                              if (isNaN(date.getTime())) return dStr;

                              const formatted = date.toLocaleString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              }).toUpperCase();

                              const [d, m, y, time, ampm] = formatted.replace(',', '').split(' ');
                              return (
                                <>
                                  <span className="block text-black">{d} {m} {y}</span>
                                  <span className="text-[#aaa]">{time} {ampm}</span>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      </div>
    </Layout>
  );
}

function AccountDetailRow({ label, value, onCopy }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between p-4 border-b border-black/5 last:border-0 group">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[10px] font-black text-[#888] uppercase tracking-[0.2em]">{label}</span>
        <span className="text-[14px] font-black text-[#111] break-all leading-tight tracking-tight">
          {value}
        </span>
      </div>
      {onCopy && (
        <button onClick={() => onCopy(value)} className="p-2 -mr-2 text-[#888] hover:text-[#ffb400] transition-colors active:scale-75">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
        </button>
      )}
    </div>
  );
}
