import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  Lock,
  CloudLightning,
  CloudOff,
  Cloud,
  CheckCircle,
  RefreshCw,
  LogOut,
  User as UserIcon,
  ShieldAlert as AlertIcon,
  HardDrive
} from 'lucide-react';
import { initAuth, googleSignIn, logoutUser } from './firebase';
import {
  getOrCreateDriveFolder,
  getOrCreateSpreadsheet,
  readAccountsFromSheet,
  syncAccountsToSheet
} from './googleApi';
import { Account, AuthState, DEFAULT_CATEGORIES } from './types';
import Library from './components/Library';
import AccountDetailView from './components/AccountDetailView';
import AddAccountModal from './components/AddAccountModal';
import ConfirmationDialog from './components/ConfirmationDialog';

export default function App() {
  // Authentication & session state
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    accessToken: null,
    needsAuth: true,
    loading: true
  });

  // Google Sheet database state
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  
  // Status loops
  const [dbLoading, setDbLoading] = useState(false);
  const [sheetSyncStatus, setSheetSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [syncErrorMessage, setSyncErrorMessage] = useState('');

  // Navigation and views
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Safeguard modal confirmation state
  const [confirmMutation, setConfirmMutation] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Initialize Auth state listener on boot
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setAuth({
          user,
          accessToken: token,
          needsAuth: false,
          loading: false
        });
      },
      () => {
        setAuth({
          user: null,
          accessToken: null,
          needsAuth: true,
          loading: false
        });
      }
    );
    return () => unsubscribe();
  }, []);

  // When successfully authenticated, load Spreadsheet or create it
  useEffect(() => {
    if (auth.accessToken && !auth.needsAuth) {
      loadPasswordSheetDatabase(auth.accessToken);
    } else {
      // Clear states if logged out
      setAccounts([]);
      setSpreadsheetId(null);
    }
  }, [auth.accessToken, auth.needsAuth]);

  // Extract categories dynamically from current loaded accounts
  useEffect(() => {
    if (accounts.length > 0) {
      const uniqueCats = Array.from(new Set(accounts.map(acc => acc.category || ''))) as string[];
      const filteredCustoms = uniqueCats.filter(
        (cat) => cat && !DEFAULT_CATEGORIES.includes(cat)
      );
      
      // Update custom category collections
      setCustomCategories((prev) => {
        const combined = Array.from(new Set([...prev, ...filteredCustoms]));
        return combined;
      });
    }
  }, [accounts]);

  /**
   * Load entire sheet database from Drive
   */
  const loadPasswordSheetDatabase = async (token: string) => {
    setDbLoading(true);
    setSheetSyncStatus('syncing');
    try {
      // 1. Get/Create "Password Book (পাসওয়ার্ড বুক)" Folder
      const folderId = await getOrCreateDriveFolder(token);

      // 2. Get/Create "Password_Book_Database" Spreadsheet inside that parent folder
      const sheetId = await getOrCreateSpreadsheet(token, folderId);
      setSpreadsheetId(sheetId);

      // 3. Query sheet for user values
      const records = await readAccountsFromSheet(token, sheetId);
      setAccounts(records);
      setSheetSyncStatus('synced');
    } catch (error: any) {
      console.error('Failed to pull spreadsheets from your Google Drive:', error);
      setSheetSyncStatus('error');
      setSyncErrorMessage(error.message || 'নেটওয়ার্ক বা ড্রাইভ অনুমোদন ত্রুটি!');
    } finally {
      setDbLoading(false);
    }
  };

  /**
   * Safe sync engine that pushes local changes back to sheet and handles loaders
   */
  const performDriveSync = async (updatedAccounts: Account[]) => {
    if (!auth.accessToken || !spreadsheetId) return;
    
    setSheetSyncStatus('syncing');
    try {
      await syncAccountsToSheet(auth.accessToken, spreadsheetId, updatedAccounts);
      setSheetSyncStatus('synced');
    } catch (error: any) {
      console.error('Failed to sync to Google Spreadsheet:', error);
      setSheetSyncStatus('error');
      setSyncErrorMessage('ডাটা ড্রাইভে সিঙ্ক করতে সমস্যা হয়েছে!');
    }
  };

  const handleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setAuth({
          user: result.user,
          accessToken: result.accessToken,
          needsAuth: false,
          loading: false
        });
      }
    } catch (err) {
      console.error('Firebase Pop-up google auth failed:', err);
    }
  };

  const handleLogout = async () => {
    const confirmOut = window.confirm('আপনি কি পাসওয়ার্ড বুক থেকে লগআউট করতে চান?');
    if (!confirmOut) return;
    
    await logoutUser();
    setAuth({
      user: null,
      accessToken: null,
      needsAuth: true,
      loading: false
    });
    setSelectedAccount(null);
  };

  /**
   * Add or Edit Account record
   */
  const handleSaveAccount = (savedAcc: Account) => {
    let updatedAccounts: Account[] = [];
    const exists = accounts.some(a => a.id === savedAcc.id);

    if (exists) {
      // UPDATE operation
      updatedAccounts = accounts.map(a => a.id === savedAcc.id ? savedAcc : a);
      if (selectedAccount?.id === savedAcc.id) {
        setSelectedAccount(savedAcc); // update currently view details
      }
    } else {
      // ADD operation
      updatedAccounts = [savedAcc, ...accounts];
    }

    setAccounts(updatedAccounts);
    performDriveSync(updatedAccounts);
  };

  /**
   * Delete Account record (requires confirmation)
   */
  const handleDeleteAccount = (accountId: string) => {
    const target = accounts.find(a => a.id === accountId);
    if (!target) return;

    setConfirmMutation({
      isOpen: true,
      title: 'একাউন্ট মুছে ফেলবেন?',
      message: `আপনি কি আসলেই '${target.platform}' একাউন্ট এবং এর সব পাসওয়ার্ড ডিলিট করতে চান? এই পরিবর্তনটি সরাসরি আপনার গুগল শিটেও কার্যকর হবে।`,
      onConfirm: () => {
        const updatedAccounts = accounts.filter(a => a.id !== accountId);
        setAccounts(updatedAccounts);
        performDriveSync(updatedAccounts);
        setSelectedAccount(null);
        setConfirmMutation(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleAddCustomCategory = (newCat: string) => {
    if (!customCategories.includes(newCat)) {
      setCustomCategories([...customCategories, newCat]);
    }
  };

  const handleDeleteCategory = (catToDelete: string) => {
    setCustomCategories(customCategories.filter(c => c !== catToDelete));
  };

  return (
    <div className="min-h-screen bg-[#0F1113] text-slate-200 flex flex-col font-sans selection:bg-blue-500/30 selection:text-white">
      
      {/* Sync State Overlay Notification */}
      {sheetSyncStatus === 'syncing' && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 border border-slate-700 text-white rounded-full py-1.5 px-4 text-xs font-semibold flex items-center gap-2 shadow-xl shadow-black/40 animate-pulse">
          <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-400" />
          <span>গুগল ড্রাইভের সাথে ডাটা মিলানো হচ্ছে...</span>
        </div>
      )}

      {/* Main layout Header Bar */}
      <header className="sticky top-0 z-40 bg-[#121416] border-b border-slate-800 px-6 py-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-lg shadow-md shadow-blue-600/20">
            P
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white">পাসওয়ার্ড বুক</h1>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">গুগল শিট দ্বারা সুরক্ষিত</p>
          </div>
        </div>

        {/* Dashboard metadata and logged-in user details */}
        {!auth.needsAuth && auth.user && (
          <div className="flex items-center gap-4">
            
            {/* Sheet storage connection status badge */}
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/55 border border-slate-800 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase text-slate-400 select-none">
              <Cloud className={`h-3.5 w-3.5 ${sheetSyncStatus === 'synced' ? 'text-blue-400' : 'text-amber-500'}`} />
              <span>{sheetSyncStatus === 'synced' ? 'অনলাইন সিঙ্কড' : 'সিঙ্ক করা হচ্ছে'}</span>
            </div>

            {/* Profile widget */}
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-white leading-tight">{auth.user.displayName || 'ব্যবহারকারী'}</p>
                <p className="text-[9px] text-slate-500 font-semibold">{auth.user.email}</p>
              </div>
              {auth.user.photoURL ? (
                <img
                  src={auth.user.photoURL}
                  referrerPolicy="no-referrer"
                  alt="avatar"
                  className="h-7 w-7 rounded-full border border-slate-800"
                />
              ) : (
                <div className="h-7 w-7 bg-slate-800 rounded-full flex items-center justify-center text-slate-300">
                  <UserIcon className="h-3.5 w-3.5" />
                </div>
              )}
            </div>

            {/* Log out icon */}
            <button
              onClick={handleLogout}
              className="p-1.5 border border-slate-850 hover:bg-slate-800 hover:text-red-400 text-slate-500 rounded-lg transition-colors"
              title="লগআউট"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </header>

      {/* Primary body view content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {auth.loading ? (
          /* Central loading spinner on page bootstrap */
          <div className="flex flex-col items-center justify-center py-32">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mb-4" />
            <h3 className="text-xs font-semibold text-slate-400">পাসওয়ার্ড বুক লোড হতে দিন...</h3>
          </div>
        ) : auth.needsAuth ? (
          
          /* UNATHENTICATED STATE: Dark, high density polished card */
          <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#1A1C1E] rounded-2xl border border-slate-800 p-8 sm:p-10 shadow-2xl space-y-6"
            >
              <div className="h-16 w-16 mx-auto flex items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/15">
                <Lock className="h-7 w-7" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
                  নিরাপদ ও সহজে পাসওয়ার্ড রাখুন
                </h2>
                <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
                  পাসওয়ার্ড বুক অ্যাপ দিয়ে আপনার সব লিংকের ইউজারনেম, পাসওয়ার্ড ও জিমেইল এক জায়গায় সাজিয়ে রাখুন। ডাটা সম্পূর্ণ আপনার গুগল ড্রাইভের এক্সসেল শিটে সুরক্ষিত থাকবে।
                </p>
              </div>

              {/* Unique human indicators list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto py-2 text-left">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#121416] border border-slate-850">
                  <CheckCircle className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">১০০% নিজস্ব মালিকানা</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">সব পাসওয়ার্ড আপনার ড্রাইভে থাকবে।</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#121416] border border-slate-850">
                  <HardDrive className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">ডিভাইস ফ্রেন্ডলি</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">পিসি বা মোবাইল সব জায়গায় চলবে।</p>
                  </div>
                </div>
              </div>

              {/* Standard Google Sign in integration button */}
              <div className="pt-2 flex flex-col items-center gap-3">
                <button
                  onClick={handleLogin}
                  className="w-full sm:w-auto px-5 py-2.5 cursor-pointer inline-flex items-center justify-center rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition active:scale-95 shadow-md shadow-blue-500/10 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-4 w-4">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    </svg>
                    <span>গুগল দিয়ে লগইন করুন</span>
                  </div>
                </button>
                <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">
                  গুগল ড্রাইভ ও শিট ব্যবহারের অনুমতির জন্য জিমেইল নির্বাচন করুন
                </span>
              </div>
            </motion.div>
          </div>
        ) : dbLoading ? (
          
          /* LOADING DATABASE STATUS: Displays file system creation status feedback */
          <div className="flex flex-col items-center justify-center py-32 space-y-4 text-center max-w-sm mx-auto">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
            <h3 className="text-sm font-bold text-white">ডিজিটাল বুক কানেক্ট করা হচ্ছে</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              প্রথমবার ব্যবহারে আপনার গুগল ড্রাইভ পেজে <strong>"Password Book (পাসওয়ার্ড বুক)"</strong> ফোল্ডার ও গুগল শিট ডেটাবেইস তৈরি করা হচ্ছে। দয়া করে অপেক্ষা করুন...
            </p>
          </div>
        ) : (
          
          /* AUTHENTICATED ACTIVE STATE */
          <div className="space-y-6">
            
            {/* Display error sync notification if API fails */}
            {sheetSyncStatus === 'error' && (
              <div className="bg-red-950/40 border border-red-900/50 rounded-2xl p-4 flex items-center gap-3 text-red-300">
                <AlertIcon className="h-5 w-5 shrink-0 text-red-400" />
                <div className="text-xs font-semibold">
                  <span>ডেটা সিঙ্ক করতে ব্যর্থ হয়েছে: </span>
                  <span className="font-mono text-red-200">{syncErrorMessage}</span>
                </div>
              </div>
            )}

            {/* Active views switcher with micro-motion feedback */}
            <AnimatePresence mode="wait">
              {selectedAccount ? (
                <motion.div
                  key="detail"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <AccountDetailView
                    account={selectedAccount}
                    onBack={() => setSelectedAccount(null)}
                    onEdit={(acc) => {
                      setEditingAccount(acc);
                      setIsAddModalOpen(true);
                    }}
                    onDelete={handleDeleteAccount}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="library"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Library
                    accounts={accounts}
                    customCategories={customCategories}
                    onSelectAccount={(acc) => setSelectedAccount(acc)}
                    onAddAccount={() => {
                      setEditingAccount(null);
                      setIsAddModalOpen(true);
                    }}
                    onAddCustomCategory={handleAddCustomCategory}
                    onDeleteCategory={handleDeleteCategory}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Footer sync bar layout matches design mockup */}
      {!auth.needsAuth && !auth.loading && (
        <footer className="bg-[#0A0C0E] border-t border-slate-800 py-2.5 px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
            <span>গুগল ড্রাইভের সাথে ডাটা যুক্ত (Synced with Google Sheet)</span>
          </div>
          <div className="text-[9px] text-slate-650 font-mono">
            ফাইল নোড: Drive / Password Book (পাসওয়ার্ড বুক) / Password_Book_Database
          </div>
        </footer>
      )}

      {/* Safe dialog widgets */}
      <AddAccountModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingAccount(null);
        }}
        onSave={handleSaveAccount}
        editingAccount={editingAccount}
        customCategories={customCategories}
        onAddCustomCategory={handleAddCustomCategory}
      />

      <ConfirmationDialog
        isOpen={confirmMutation.isOpen}
        title={confirmMutation.title}
        message={confirmMutation.message}
        onConfirm={confirmMutation.onConfirm}
        onCancel={() => setConfirmMutation(prev => ({ ...prev, isOpen: false }))}
      />

    </div>
  );
}
