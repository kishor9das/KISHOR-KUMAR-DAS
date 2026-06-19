import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Key, Calendar, Link as LinkIcon, User, Shield, Info, Smartphone, Mail, Trash } from 'lucide-react';
import { Account, DEFAULT_CATEGORIES } from '../types';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (account: Account) => void;
  editingAccount?: Account | null;
  customCategories: string[];
  onAddCustomCategory: (category: string) => void;
}

export default function AddAccountModal({
  isOpen,
  onClose,
  onSave,
  editingAccount,
  customCategories,
  onAddCustomCategory
}: AddAccountModalProps) {
  const [platform, setPlatform] = useState('');
  const [link, setLink] = useState('');
  const [category, setCategory] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [dateOfOpening, setDateOfOpening] = useState('');
  const [details, setDetails] = useState('');
  
  // Custom metadata fields (extra keys / values)
  const [extraFields, setExtraFields] = useState<{ id: string; key: string; value: string }[]>([]);
  const [newCatInput, setNewCatInput] = useState('');
  const [showAddCatInput, setShowAddCatInput] = useState(false);

  // Initialize fields if editing
  useEffect(() => {
    if (editingAccount) {
      setPlatform(editingAccount.platform);
      setLink(editingAccount.link);
      setCategory(editingAccount.category);
      setUsername(editingAccount.username);
      setPassword(editingAccount.password);
      setEmail(editingAccount.email);
      setMobile(editingAccount.mobile);
      setDateOfOpening(editingAccount.dateOfOpening);
      setDetails(editingAccount.details);
      
      const parsedExtras = editingAccount.extraFields
        ? Object.entries(editingAccount.extraFields).map(([k, v]) => ({
            id: Math.random().toString(),
            key: k,
            value: v
          }))
        : [];
      setExtraFields(parsedExtras);
    } else {
      // Setup Defaults
      setPlatform('');
      setLink('');
      setCategory(DEFAULT_CATEGORIES[0]);
      setUsername('');
      setPassword('');
      setEmail('');
      setMobile('');
      setDateOfOpening(new Date().toISOString().split('T')[0]);
      setDetails('');
      setExtraFields([]);
    }
  }, [editingAccount, isOpen]);

  const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...customCategories]));

  const handleAddNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCatInput.trim()) {
      onAddCustomCategory(newCatInput.trim());
      setCategory(newCatInput.trim());
      setNewCatInput('');
      setShowAddCatInput(false);
    }
  };

  const handleAddField = () => {
    setExtraFields([...extraFields, { id: Math.random().toString(), key: '', value: '' }]);
  };

  const handleRemoveField = (id: string) => {
    setExtraFields(extraFields.filter(f => f.id !== id));
  };

  const handleFieldChange = (id: string, prop: 'key' | 'value', val: string) => {
    setExtraFields(extraFields.map(f => f.id === id ? { ...f, [prop]: val } : f));
  };

  const generateRawPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
    let pass = "";
    for (let i = 0; i < 16; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!platform.trim()) return;

    // Convert extras list to record
    const extrasObj: Record<string, string> = {};
    extraFields.forEach(f => {
      if (f.key.trim() && f.value.trim()) {
        extrasObj[f.key.trim()] = f.value;
      }
    });

    const finalAccount: Account = {
      id: editingAccount?.id || Math.random().toString(36).substring(2, 9),
      platform: platform.trim(),
      link: link.trim(),
      category,
      username: username.trim(),
      password: password.trim(),
      email: email.trim(),
      mobile: mobile.trim(),
      dateOfOpening,
      details: details.trim(),
      extraFields: extrasObj
    };

    onSave(finalAccount);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />

          {/* Modal content body */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-[#1A1C1E] shadow-2xl ring-1 ring-slate-800 flex flex-col text-slate-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                {editingAccount ? 'একাউন্ট তথ্য পরিবর্তন করুন' : 'নতুন একাউন্ট যুক্ত করুন'}
              </h2>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-slate-500 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
              
              {/* Row 1: Platform & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">একাউন্ট / প্ল্যাটফর্ম নাম *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Shield className="h-4 w-4" />
                    </span>
                    <input
                      required
                      type="text"
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      placeholder="যেমন: Facebook, bKash, Gmail, etc."
                      className="w-full rounded-xl border border-slate-800 bg-[#121416] py-2.5 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">ক্যাটাগরি</label>
                  <div className="flex gap-2">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-800 bg-[#121416] py-2.5 px-3 text-xs text-slate-350 focus:border-blue-500 focus:outline-none"
                    >
                      {allCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowAddCatInput(!showAddCatInput)}
                      className="rounded-xl bg-[#121416] border border-slate-850 px-3.5 text-slate-300 hover:bg-[#1A1C1E] transition text-xs flex items-center gap-1 shrink-0 font-medium"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      নতুন
                    </button>
                  </div>

                  {/* Add New Category Custom input */}
                  {showAddCatInput && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2.5 flex gap-2"
                    >
                      <input
                        type="text"
                        value={newCatInput}
                        onChange={(e) => setNewCatInput(e.target.value)}
                        placeholder="ক্যাটাগরির নাম দিন"
                        className="flex-1 rounded-xl border border-slate-800 bg-[#121416] py-1.5 px-3 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddNewCategory}
                        className="rounded-xl bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs text-white font-medium transition"
                      >
                        যুক্ত করুন
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Row 2: Link & Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">ওয়েব লিংক (Web Link)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <LinkIcon className="h-4 w-4" />
                    </span>
                    <input
                      type="url"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full rounded-xl border border-slate-800 bg-[#121416] py-2.5 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">একাউন্ট খোলার তারিখ</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Calendar className="h-4 w-4" />
                    </span>
                    <input
                      type="date"
                      value={dateOfOpening}
                      onChange={(e) => setDateOfOpening(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-[#121416] py-2.5 pl-10 pr-4 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Username & Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">ইউজারনেম (Username)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <User className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="ব্যবহারকারীর নাম"
                      className="w-full rounded-xl border border-slate-800 bg-[#121416] py-2.5 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">পাসওয়ার্ড (Password)</label>
                    <button
                      type="button"
                      onClick={generateRawPassword}
                      className="text-[10px] text-blue-400 font-bold hover:text-blue-300 flex items-center gap-1 active:scale-95 transition"
                    >
                      <Key className="h-3.5 w-3.5" />
                      অটো পাসওয়ার্ড জেনারেট
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Key className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="পাসওয়ার্ড লিখুন"
                      className="w-full rounded-xl border border-slate-800 bg-[#121416] py-2.5 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Email & Mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">জিমেইল / ইমেইল (Email)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full rounded-xl border border-slate-800 bg-[#121416] py-2.5 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">মোবাইল নং (Mobile No)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Smartphone className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full rounded-xl border border-slate-800 bg-[#121416] py-2.5 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Details field */}
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">বিস্তারিত বিবরণ / নোট (Details)</label>
                <div className="relative">
                  <span className="absolute top-3 left-3 text-slate-500">
                    <Info className="h-4 w-4" />
                  </span>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="পাসওয়ার্ড পরিবর্তনের ইতিহাস বা সহযোগী তথ্য ইত্যাদি..."
                    rows={3}
                    className="w-full rounded-xl border border-slate-800 bg-[#121416] py-2.5 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Extra Custom Fields with animation list layout */}
              <div className="border-t border-slate-800/80 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                    অন্যান্য কাস্টম তথ্য (যেমন: 2FA কোড, প্রশ্ন-উত্তর)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddField}
                    className="text-[10px] bg-[#121416] hover:bg-[#1A1C1E] border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 font-bold flex items-center gap-1 active:scale-95 transition"
                  >
                    <Plus className="h-3 w-3" />
                    ঘর যুক্ত করুন
                  </button>
                </div>

                <div className="space-y-3">
                  {extraFields.map((field) => (
                    <motion.div
                      key={field.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex gap-2 items-center"
                    >
                      <input
                        type="text"
                        placeholder="তথ্যের নাম (যেমন: ২FA কোড)"
                        value={field.key}
                        onChange={(e) => handleFieldChange(field.id, 'key', e.target.value)}
                        className="flex-1 rounded-xl border border-slate-800 bg-[#121416] py-2 px-3 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="তথ্যের মান"
                        value={field.value}
                        onChange={(e) => handleFieldChange(field.id, 'value', e.target.value)}
                        className="flex-1 rounded-xl border border-slate-800 bg-[#121416] py-2 px-3 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveField(field.id)}
                        className="p-1.5 text-red-400 hover:text-red-300 bg-red-955/20 hover:bg-red-955/40 rounded-lg border border-red-900/30 transition"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Submit panel */}
              <div className="border-t border-slate-800/80 pt-4 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-800 bg-[#121416] hover:bg-[#1A1C1E] px-4.5 py-2.5 text-xs font-bold text-slate-400 transition active:scale-95"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-blue-750 active:scale-95 shadow-md shadow-blue-500/10"
                >
                  সংরক্ষণ করুন
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
