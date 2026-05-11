import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { walletController, userController } from '../controllers';
import { useAuthStore } from '../store/authStore';
import { useSnackbarStore } from '../store/snackbarStore';
import { formatTime12h } from '../utils/format';
import AddBankModal from '../components/wallet/AddBankModal';

const WITHDRAWAL_RULES = [
  "Casino Withdrawal Limit: You can withdraw up to 10 times the total amount you've deposited. If your withdrawal request exceeds this limit, the extra amount may be held or cancelled by the company.",
  "Casino Winning Limit: You can win up to 50 times your bet amount in any casino game round. If your winnings exceed this, only up to 50 times your bet will be credited to your account.",
  "The bonus amount can be used to place bets across the platform and the winnings can be withdrawn.",
  "A player can use bonus amount to place bets and play games on fairplay.",
  "If the withdrawals are pending from the bank, it may take upto 72 banking hours for your transaction to clear.",
  "If a user only deposits and attempts to withdraw the money without placing a single bet, 100% of the amount will be withheld due to suspicious activity. If this is repeated, no withdrawal will be given to the user.",
];

export default function WithdrawPage() {
  const navigate = useNavigate();
  const { show: showSnackbar } = useSnackbarStore();
  const { loginToken, isLoggedIn } = useAuthStore();

  const [amount, setAmount] = useState('');
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('BANK');
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBankId, setSelectedBankId] = useState(null);
  const [usdtWallet, setUsdtWallet] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [balance, setBalance] = useState({ available_balance: 0 });
  const [submitting, setSubmitting] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditingUSDT, setIsEditingUSDT] = useState(false);
  const [newWaddress, setNewWaddress] = useState('');
  const [newWqr, setNewWqr] = useState('');
  const [newWqrName, setNewWqrName] = useState('');
  const [usdtLoading, setUsdtLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    fetchData();
    fetchHistory();
  }, [isLoggedIn]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [balanceRes, banksRes, usdtRes] = await Promise.all([
        userController.getBalance(loginToken),
        walletController.getBankAccounts(loginToken),
        walletController.getUSDTWallet(loginToken)
      ]);

      if (balanceRes && balanceRes.available_balance !== undefined) {
        setBalance(balanceRes);
      }

      // Bank Accounts normalization (handles numeric keys response structure)
      if (banksRes && banksRes.error !== '1') {
        let accounts = [];
        const raw = banksRes.data || banksRes.list || banksRes;
        
        if (Array.isArray(raw)) {
          accounts = raw;
        } else if (typeof raw === 'object' && raw !== null) {
          // Robust normalization for objects with numeric keys "0", "1", etc.
          // This explicitly filters for numeric keys to avoid mixing metadata like 'error' or 'msg'
          accounts = Object.entries(raw)
            .filter(([key, val]) => !isNaN(key) && val && typeof val === 'object' && (val.ACno || val.AcNo || val.Bank || val.Id))
            .map(([_, val]) => val);
        }
        
        setBankAccounts(accounts);
        if (accounts.length > 0 && !selectedBankId) {
          setSelectedBankId(accounts[0].id || accounts[0].Id);
        }
      }

      // USDT Wallet normalization
      if (usdtRes && !usdtRes.error) {
        const wallet = usdtRes.data || (typeof usdtRes === 'object' && usdtRes.address ? usdtRes : null);
        if (wallet && wallet.address) {
          setUsdtWallet(wallet);
          setNewWaddress(wallet.address);
        }
      }
    } catch (err) {
      console.error('Failed to fetch withdrawal data:', err);
      showSnackbar('Failed to sync wallet data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await walletController.getWithdrawalHistory(loginToken);
      if (res && !res.error) {
        const rawHistory = res.data || res.list || (typeof res === 'object' ? Object.values(res).filter(v => v && typeof v === 'object' && v.Amount) : []);
        setHistory(Array.isArray(rawHistory) ? rawHistory : []);
      }
    } catch (err) {
      console.error('History fetch error:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) < 500) {
      showSnackbar('Minimum withdrawal is ₹500', 'error');
      return;
    }
    if (activeCategory === 'BANK' && !selectedBankId) {
      showSnackbar('Please select a bank account', 'error');
      return;
    }
    if (activeCategory === 'USDT' && !usdtWallet) {
      showSnackbar('Please setup your USDT wallet first', 'error');
      return;
    }

    try {
      setSubmitting(true);
      let res;
      
      if (activeCategory === 'BANK') {
        // Bank withdrawals use positional arguments (Token, BankId, Amount)
        res = await walletController.requestWithdrawal(loginToken, selectedBankId, amount);
      } else {
        // USDT withdrawals use a structured payload object
        res = await walletController.withdrawUSDT({
          LoginToken: loginToken,
          Amount: amount,
          WalletAddress: usdtWallet.address,
          Remark: remark || 'Withdrawal Request'
        });
      }

      if (res && !res.error) {
        showSnackbar('Withdrawal request submitted successfully!', 'success');
        setAmount('');
        setRemark('');
        fetchHistory();
      } else {
        showSnackbar(res?.msg || 'Request failed', 'error');
      }
    } catch (err) {
      showSnackbar('An error occurred during request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBank = async (id) => {
    if (!window.confirm('Remove this bank account?')) return;
    try {
      const res = await walletController.deleteBankAccount(loginToken, id);
      if (res && !res.error) {
        showSnackbar('Account removed', 'success');
        fetchData();
      }
    } catch (err) {
      showSnackbar('Delete failed', 'error');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewWqrName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => setNewWqr(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateUSDTWallet = async () => {
    if (!newWaddress) {
      showSnackbar('Enter wallet address', 'error');
      return;
    }
    try {
      setUsdtLoading(true);
      const res = await walletController.updateUSDTWallet(loginToken, newWaddress, newWqr);
      if (res && !res.error) {
        showSnackbar('USDT Wallet updated', 'success');
        setIsEditingUSDT(false);
        fetchData();
      } else {
        showSnackbar(res?.msg || 'Update failed', 'error');
      }
    } catch (err) {
      showSnackbar('An error occurred', 'error');
    } finally {
      setUsdtLoading(false);
    }
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
            <button onClick={() => navigate(-1)} className="text-black pr-2 transition-transform active:scale-90">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <h1 className="text-[14px] font-black text-black uppercase tracking-tight">Withdrawal</h1>
          </div>
        </div>

      <div className="w-full mx-auto px-4 md:px-8 lg:px-10 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
          
          {/* ── LEFT AREA: Withdrawal Form ── */}
          <div className="xl:col-span-12 2xl:col-span-7 space-y-8 animate-in fade-in duration-500">
            {/* Promotional Banner */}
            <div className="w-full overflow-hidden rounded-xl bg-white border border-[#ccc] shadow-md relative group">
               <div className="w-full flex items-center gap-6 px-8 py-10 bg-gradient-to-br from-white to-[#f9f9f9] border border-[#ffb400]/20 relative overflow-hidden">
                  <div className="absolute right-0 top-0 opacity-5 scale-150 rotate-12 transition-transform group-hover:rotate-0 duration-700">
                     <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#ffb400" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  </div>
                  <div className="text-5xl drop-shadow-md">💰</div>
                  <div className="relative z-10">
                    <p className="font-black text-black uppercase text-2xl tracking-tighter leading-tight">24/7 Instant Withdrawals</p>
                    <div className="mt-3 bg-[#ffb400] text-black px-4 py-1.5 rounded-full inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-black/5">
                       <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                       No Limits • Secure Portal
                    </div>
                  </div>
               </div>
            </div>

            {/* Category Selector */}
            <div className="bg-white p-4 rounded-xl border border-[#ccc] flex gap-4 shadow-md">
               <div 
                onClick={() => setActiveCategory('BANK')}
                className={`flex-1 h-28 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer border-2 transition-all group ${activeCategory === 'BANK' ? 'bg-[#ffb400]/10 border-[#ffb400] shadow-sm' : 'bg-[#f4f4f4] border-transparent hover:border-[#ccc]'}`}
               >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${activeCategory === 'BANK' ? 'bg-[#ffb400] text-black' : 'bg-black/5 text-[#888] group-hover:bg-black/10'}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M11 10v11M15 10v11M20 10v11"/></svg>
                  </div>
                  <span className={`text-[11px] font-black uppercase tracking-widest leading-tight transition-colors ${activeCategory === 'BANK' ? 'text-black' : 'text-[#888]'}`}>Bank Transfer</span>
               </div>
               
               <div 
                onClick={() => setActiveCategory('USDT')}
                className={`flex-1 h-28 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer border-2 transition-all group ${activeCategory === 'USDT' ? 'bg-[#ffb400]/10 border-[#ffb400] shadow-sm' : 'bg-[#f4f4f4] border-transparent hover:border-[#ccc]'}`}
               >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${activeCategory === 'USDT' ? 'bg-[#ffb400] text-black' : 'bg-black/5 text-[#888] group-hover:bg-black/10'}`}>
                    <img src="https://cryptologos.cc/logos/tether-usdt-logo.png" className={`w-7 h-7 object-contain ${activeCategory === 'USDT' ? '' : 'grayscale opacity-50'}`} alt="" />
                  </div>
                  <span className={`text-[11px] font-black uppercase tracking-widest leading-tight transition-colors ${activeCategory === 'USDT' ? 'text-black' : 'text-[#888]'}`}>USDT (TRC20)</span>
               </div>
            </div>

            {/* Balance Pill */}
            <div className="animate-in slide-in-from-bottom-4 duration-500 delay-100">
                <div className="inline-flex items-center gap-3 bg-white rounded-xl px-6 py-3 text-[#111] shadow-md border border-[#ccc] group overflow-hidden relative">
                   <div className="absolute inset-0 bg-[#ffb400]/5 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                   <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shadow-sm relative z-10">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffb400" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" /><path d="M4 6v12c0 1.1.9 2 2 2h14v-4" /><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" /></svg>
                  </div>
                  <span className="text-[14px] font-black uppercase tracking-tight relative z-10">
                    Wallet Balance : <span className="text-[#ffb400] ml-1">₹ {balance.available_balance.toLocaleString()}</span>
                  </span>
               </div>
            </div>

            {/* Rules List */}
            <div className="space-y-3 px-2">
                <div className="flex items-center gap-2 text-[#888] mb-1">
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                   <span className="text-[10px] font-black uppercase tracking-widest">Withdrawal Policy Highlights</span>
                </div>
                <ul className="space-y-2.5">
                   {WITHDRAWAL_RULES.map((rule, idx) => (
                     <li key={idx} className="text-[13px] text-[#444] font-bold leading-relaxed flex gap-3">
                        <span className="text-[#ffb400] font-black tracking-tighter shrink-0">{idx + 1}.</span>
                        <p>{rule}</p>
                     </li>
                   ))}
                </ul>
            </div>

            {activeCategory === 'BANK' ? (
              /* Bank Selection */
              <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="flex items-center justify-between px-2">
                     <h2 className="text-[15px] font-black uppercase tracking-tight text-[#111]">Saved Accounts</h2>
                      <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-[#ffb400] hover:bg-[#ffc800] text-black px-6 h-10 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-md transition-all active:scale-95 flex items-center gap-2"
                      >
                         ADD NEW <span className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center text-[12px]">+</span>
                      </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                     {bankAccounts.length === 0 ? (
                       <div className="col-span-full py-16 bg-white border border-[#ccc] rounded-xl flex flex-col items-center gap-4 text-[#888] shadow-sm">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M11 10v11M15 10v11M20 10v11"/></svg>
                          <span className="text-xs font-black uppercase tracking-[0.3em]">No Bank Accounts Linked</span>
                       </div>
                    ) : (
                      bankAccounts.map((bank) => {
                        const id = bank.id || bank.Id;
                        const isSelected = selectedBankId === id;
                        return (
                           <div 
                             key={id}
                             onClick={() => setSelectedBankId(id)}
                             className={`p-6 rounded-xl border-2 transition-all cursor-pointer relative group overflow-hidden shadow-sm ${isSelected ? 'bg-[#ffb400]/5 border-[#ffb400]' : 'bg-white border-[#eee] hover:border-[#ccc]'}`}
                           >
                              <div className="flex justify-between items-start mb-4 relative z-10">
                               <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isSelected ? 'bg-[#ffb400] text-black shadow-sm' : 'bg-[#f4f4f4] text-[#888]'}`}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M11 10v11M15 10v11M20 10v11"/></svg>
                                 </div>
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); handleDeleteBank(id); }}
                                   className="p-2 text-black/5 hover:text-red-500 transition-colors active:scale-75"
                                 >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                 </button>
                              </div>
                              <div className="space-y-0.5 relative z-10">
                                 <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-black text-[14px] uppercase tracking-tight truncate max-w-[70%] text-[#111]">{bank.Bank || 'Bank'}</h4>
                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter italic ${isSelected ? 'bg-[#ffb400] text-black' : 'bg-black/5 text-[#888]'}`}>{bank.ACname || 'Primary'}</span>
                                 </div>
                                 <p className="text-[14px] font-black text-[#444] tracking-[0.1em]">{bank.ACno || bank.AcNo || bank.AccountNo}</p>
                                 <div className="flex justify-between items-center mt-5 pt-4 border-t border-black/5">
                                    <div className="flex flex-col">
                                       <span className="text-[7px] font-black text-[#888] uppercase tracking-widest">IFSC Code</span>
                                       <span className="text-[10px] font-black uppercase text-[#ffb400] tracking-widest">{bank.Isfc || bank.Ifsc}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                       <span className="text-[7px] font-black text-[#888] uppercase tracking-widest">Holder</span>
                                       <span className="text-[10px] font-black text-[#444] uppercase truncate max-w-[80px]">{bank.ACholdername || 'User'}</span>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        );
                      })
                    )}
                  </div>
              </div>
            ) : (
              /* USDT Selection */
               <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="flex items-center justify-between px-2">
                     <h2 className="text-[15px] font-black uppercase tracking-tight text-[#111]">USDT (TRC20) Wallet</h2>
                     {usdtWallet && !isEditingUSDT && (
                       <button onClick={() => setIsEditingUSDT(true)} className="text-[11px] font-black uppercase tracking-widest text-[#ffb400] hover:underline decoration-2 underline-offset-4">Update Address</button>
                     )}
                  </div>
                  
                  {!usdtWallet || isEditingUSDT ? (
                     <div className="bg-white border border-[#ccc] rounded-xl p-8 space-y-6 shadow-md animate-in slide-in-from-bottom-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[#888] ml-1">Wallet Address (TRC20)</label>
                          <input 
                            type="text"
                            value={newWaddress}
                            onChange={(e) => setNewWaddress(e.target.value)}
                            placeholder="Enter your USDT TRC20 destination address"
                            className="w-full h-14 bg-[#f4f4f4] border border-[#ddd] rounded-xl px-6 text-sm font-black text-[#111] focus:outline-none focus:border-[#ffb400] transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[#888] ml-1">Wallet QR Screenshot</label>
                          <div className="flex items-center gap-4">
                             <button onClick={() => document.getElementById('qr-input-withdraw').click()} className="h-14 px-8 bg-[#f4f4f4] border border-[#ddd] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#eee] transition-all flex items-center gap-2 text-black">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffb400" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                {newWqrName ? 'CHANGE IMAGE' : 'UPLOAD QR CODE'}
                             </button>
                             <span className="text-[10px] font-bold text-[#888] truncate max-w-[200px]">{newWqrName || 'No file selected'}</span>
                             <input id="qr-input-withdraw" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                          </div>
                        </div>
                        <div className="flex gap-4 pt-2">
                           <button onClick={handleUpdateUSDTWallet} disabled={usdtLoading} className="flex-1 h-14 bg-[#ffb400] text-black rounded-xl font-black uppercase tracking-widest shadow-md active:scale-95 transition-all">
                              {usdtLoading ? 'Syncing...' : 'SAVE WALLET DETAILS'}
                           </button>
                           {usdtWallet && <button onClick={() => setIsEditingUSDT(false)} className="px-10 h-14 bg-black/5 text-[#444] rounded-xl font-black uppercase tracking-widest hover:bg-black/10 transition-all">CANCEL</button>}
                        </div>
                     </div>
                  ) : (
                     <div className="bg-white border-2 border-[#ffb400]/30 rounded-xl p-8 flex flex-col md:flex-row items-center gap-10 shadow-md relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-1000">
                            <img src="https://cryptologos.cc/logos/tether-usdt-logo.png" className="w-40 h-40 object-contain" alt="" />
                        </div>
                        <div className="w-44 h-44 bg-white p-4 rounded-xl shadow-md shrink-0 relative z-10 transition-transform group-hover:scale-105 duration-500 border border-[#eee]">
                           <img src={usdtWallet.qr} alt="QR" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 space-y-5 w-full relative z-10">
                           <div className="space-y-1">
                              <span className="text-[10px] font-black text-[#ffb400] uppercase tracking-[0.3em] mb-1 block">Verified Destination</span>
                              <h4 className="text-3xl font-black tracking-tighter text-[#111]">USDT (TRC20)</h4>
                           </div>
                           <div className="bg-[#f9f9f9] rounded-xl p-5 border border-[#eee] break-all shadow-inner relative group/addr">
                              <span className="text-[8px] font-black text-[#888] uppercase tracking-widest mb-2 block">Network Address</span>
                              <p className="text-sm font-mono font-black text-[#222] leading-relaxed tracking-tight">{usdtWallet.address}</p>
                              <button onClick={() => { navigator.clipboard.writeText(usdtWallet.address); showSnackbar('Address Copied!', 'success'); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white hover:bg-[#ffb400] text-black border border-[#ddd] rounded-lg opacity-0 group-hover/addr:opacity-100 transition-all active:scale-90 shadow-sm">
                                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                              </button>
                           </div>
                           <div className="flex items-center gap-2.5 text-green-600 font-black uppercase text-[9px] tracking-widest bg-green-500/5 inline-flex px-3 py-1.5 rounded-full border border-green-500/10">
                              <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                              Linked & Ready for Instant Processing
                           </div>
                        </div>
                     </div>
                  )}
              </div>
            )}

             {/* Request Withdrawal Card */}
             <div className="bg-white border border-[#ccc] rounded-xl p-10 space-y-8 shadow-md animate-in slide-in-from-bottom-6 duration-700">
                <h3 className="text-[15px] font-black uppercase tracking-[0.2em] text-[#888] border-b border-[#eee] pb-6">Request Withdrawal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-3">
                      <label className="text-[11px] font-black uppercase tracking-widest text-[#666] ml-2">Amount to Withdraw</label>
                      <div className="relative group">
                          <input 
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount"
                            className="w-full h-16 bg-[#f4f4f4] border border-[#ddd] rounded-xl px-6 text-2xl font-black text-[#111] focus:outline-none focus:border-[#ffb400] transition-all"
                          />
                      </div>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[11px] font-black uppercase tracking-widest text-[#666] ml-2">Remark (Optional)</label>
                      <input 
                       type="text"
                       value={remark}
                       onChange={(e) => setRemark(e.target.value)}
                       placeholder="e.g. Personal Use"
                       className="w-full h-16 bg-[#f4f4f4] border border-[#ddd] rounded-xl px-6 text-sm font-black text-[#111] focus:outline-none focus:border-[#ffb400] transition-all"
                      />
                   </div>
                </div>
                
                <button 
                 disabled={submitting || (activeCategory === 'BANK' ? !selectedBankId : !usdtWallet || isEditingUSDT)}
                 onClick={handleWithdraw}
                 className={`w-full h-16 rounded-xl font-black uppercase tracking-[0.2em] text-sm transition-all ${submitting || (activeCategory === 'BANK' ? !selectedBankId : !usdtWallet || isEditingUSDT) ? 'bg-black/5 text-[#888]' : 'bg-[#ffb400] hover:bg-[#ffc800] text-black shadow-md active:scale-95'}`}
                >
                   {submitting ? 'Syncing with Bank...' : 'Submit Withdrawal Request'}
                </button>
             </div>
          </div>

           {/* ── RIGHT AREA: Withdrawal History ── */}
           <div className="xl:col-span-12 2xl:col-span-5 flex flex-col min-h-[855px]">
             <div className="flex-1 flex flex-col bg-white border border-[#ccc] rounded-xl overflow-hidden shadow-md relative">
               <div className="p-6 border-b border-[#eee] flex items-center justify-between bg-[#f9f9f9]">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#111]">Withdraw History</h3>
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-[#ffb400] uppercase tracking-widest">
                     <div className="w-1 h-1 rounded-full bg-current animate-pulse" />
                     Live Activity
                  </div>
               </div>
               
               <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
                  <div className="min-w-[650px]">
                     {/* Table Header */}
                     <div className="grid grid-cols-[1fr_1fr_1.5fr_1.2fr_1.5fr] px-6 py-4 bg-[#eee] text-[10px] font-black text-[#666] uppercase tracking-[0.1em] sticky top-0 z-10 border-b border-[#ddd]">
                       <span className="text-center">AMOUNT</span>
                       <span className="text-center">STATUS</span>
                       <span className="text-center">DATE & TIME</span>
                       <span className="text-center">METHOD</span>
                       <span className="text-right">DETAILS</span>
                     </div>

                     {historyLoading ? (
                       <div className="py-40 flex flex-col items-center justify-center gap-4 text-[#ccc]">
                         <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#ffb400]" />
                         <span className="text-[10px] font-black uppercase tracking-[0.3em]">Syncing History...</span>
                       </div>
                    ) : history.length === 0 ? (
                      <div className="py-40 text-center opacity-20 flex flex-col items-center gap-4">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#111]">No Withdrawal Records</p>
                      </div>
                    ) : (
                      history.map((item, i) => {
                        const status = (item.Status || 'Pending').toLowerCase();
                        const method = item.Type || item.Bank || item.bank || 'Bank';
                        const amount = item.Amount || item.amount || 0;
                        const date = item.datetime || item.date || item.created_at || '---';
                        const remarks = item.Remarks || item.remarks || item.Remark || '---';

                        return (
                           <div key={i} className={`grid grid-cols-[1fr_1fr_1.5fr_1.2fr_1.5fr] items-center px-6 py-4 border-b border-[#eee] transition-all hover:bg-black/[0.02] ${i % 2 === 0 ? 'bg-transparent' : 'bg-[#fcfcfc]'}`}>
                             <span className="text-[15px] font-black text-[#111] text-center tracking-tighter">₹{parseFloat(amount).toLocaleString()}</span>
                             <div className="flex justify-center">
                               <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter shadow-sm border ${
                                 status === 'success' || status === 'approved' || status === 'completed'
                                   ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                                   : status === 'failed' || status === 'rejected' || status === 'cancel'
                                     ? 'bg-red-500/10 text-red-600 border-red-500/20' 
                                     : 'bg-[#ffb400]/10 text-[#ffb400] border-[#ffb400]/20'
                               }`}>
                                 {item.Status || 'Pending'}
                               </span>
                             </div>
                             <div className="text-[11px] font-black text-[#888] text-center leading-tight uppercase tracking-tighter">
                               {(() => {
                                 const dStr = date;
                                 if (!dStr || dStr === '---') return '---';
                                 
                                 // Manual parse for DD-MM-YYYY HH:mm:ss
                                 let dObj;
                                 const parts = dStr.split(/[-/ :]/);
                                 if (parts.length >= 3) {
                                   const day = parseInt(parts[0], 10);
                                   const month = parseInt(parts[1], 10) - 1;
                                   const year = parseInt(parts[2], 10);
                                   const hour = parseInt(parts[3] || '0', 10);
                                   const minute = parseInt(parts[4] || '0', 10);
                                   const second = parseInt(parts[5] || '0', 10);
                                   
                                   if (year > 1000) {
                                     dObj = new Date(year, month, day, hour, minute, second);
                                   } else {
                                     dObj = new Date(dStr);
                                   }
                                 } else {
                                   dObj = new Date(dStr);
                                 }

                                 if (isNaN(dObj.getTime())) return dStr;

                                 const formatted = dObj.toLocaleString('en-GB', {
                                   day: '2-digit',
                                   month: 'short',
                                   year: 'numeric',
                                   hour: '2-digit',
                                   minute: '2-digit',
                                   hour12: true
                                 }).toUpperCase();

                                 const [dayV, monV, yrV, timeV, ampmV] = formatted.replace(',', '').split(' ');
                                 return (
                                   <>
                                     <span className="block text-black">{dayV} {monV} {yrV}</span>
                                     <span className="text-[#aaa]">{timeV} {ampmV}</span>
                                   </>
                                 );
                               })()}
                             </div>
                             <span className="text-[12px] font-black text-[#444] uppercase text-center tracking-tighter italic">{method}</span>
                             <span className="text-[10px] text-[#666] text-right leading-snug font-bold italic truncate max-w-full" title={remarks}>
                               {remarks}
                             </span>
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
       <AddBankModal 
         isOpen={isAddModalOpen} 
         onClose={() => setIsAddModalOpen(false)} 
         onSuccess={fetchData} 
       />
       <style>{`
         .no-scrollbar::-webkit-scrollbar { display: none; }
         .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
       `}</style>
       </div>
    </Layout>
  );
}
