import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Plus,
  Download,
  Folder,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ListFilter,
  Trash2,
  Lock,
  Tag
} from 'lucide-react';
import { Account, DEFAULT_CATEGORIES } from '../types';
import * as xlsx from 'xlsx';

interface LibraryProps {
  accounts: Account[];
  customCategories: string[];
  onSelectAccount: (account: Account) => void;
  onAddAccount: () => void;
  onAddCustomCategory: (category: string) => void;
  onDeleteCategory: (category: string) => void;
}

export default function Library({
  accounts,
  customCategories,
  onSelectAccount,
  onAddAccount,
  onAddCustomCategory,
  onDeleteCategory
}: LibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('সবগুলো');
  const [searchQuery, setSearchQuery] = useState('');
  const [newCatInput, setNewCatInput] = useState('');
  const [showAddCatRow, setShowAddCatRow] = useState(false);

  // Group combined categories
  const allCategories = Array.from(new Set(['সবগুলো', ...DEFAULT_CATEGORIES, ...customCategories]));

  // Handle excel download where each category goes into its own Sheet!
  const handleDownloadExcel = () => {
    // 1. Double check there's data
    if (accounts.length === 0) {
      alert("কোনো তথ্য পাওয়া যায়নি ডাউনলোড করার জন্য!");
      return;
    }

    // 2. Create new workbook
    const wb = xlsx.utils.book_new();

    // 3. Group accounts by category
    const categoriesInUse = Array.from(new Set(accounts.map(a => a.category || "মিক্স")));

    categoriesInUse.forEach((cat) => {
      const catAccounts = accounts.filter(a => (a.category || "মিক্স") === cat);

      // Map rows values to sheet format
      const headerRow = [
        'প্ল্যাটফর্ম/একাউন্ট',
        'ওয়েব লিংক',
        'ইউজারনেম',
        'পাসওয়ার্ড',
        'ইমেইল/জিমেইল',
        'মোবাইল নং',
        'খোলার তারিখ',
        'বিস্তারিত নোট',
        'অন্যান্য তথ্য'
      ];

      const dataRows = catAccounts.map(acc => [
        acc.platform,
        acc.link,
        acc.username,
        acc.password,
        acc.email,
        acc.mobile,
        acc.dateOfOpening,
        acc.details,
        acc.extraFields ? Object.entries(acc.extraFields).map(([k,v]) => `${k}: ${v}`).join('; ') : ''
      ]);

      const ws = xlsx.utils.aoa_to_sheet([headerRow, ...dataRows]);
      
      // Auto-fit column widths a little bit for polished excel look
      const maxColWidths = headerRow.map((_, i) => ({
        wch: Math.max(
          headerRow[i].length * 2,
          ...dataRows.map(row => (row[i] ? row[i].toString().length + 2 : 10))
        )
      }));
      ws['!cols'] = maxColWidths;

      // Limit sheet name to 30 chars (Excel requirement)
      const safeSheetName = cat.substring(0, 30).replace(/[\\*?:/\[\]]/g, '');
      xlsx.utils.book_append_sheet(wb, ws, safeSheetName || "অন্যান্য");
    });

    // 4. Trigger download
    xlsx.writeFile(wb, "Password_Book_Accounts.xlsx");
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCatInput.trim()) {
      onAddCustomCategory(newCatInput.trim());
      setSelectedCategory(newCatInput.trim());
      setNewCatInput('');
      setShowAddCatRow(false);
    }
  };

  // Filter accounts based on selected tab & search queries
  const filteredAccounts = accounts.filter((acc) => {
    const matchesCategory = selectedCategory === 'সবগুলো' || acc.category === selectedCategory;
    
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesCategory;

    // Search targets: platform, username, email, mobile, details
    const matchesSearch =
      acc.platform.toLowerCase().includes(query) ||
      acc.username.toLowerCase().includes(query) ||
      acc.email.toLowerCase().includes(query) ||
      acc.mobile.toLowerCase().includes(query) ||
      acc.details.toLowerCase().includes(query) ||
      acc.category.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Search and Action Toolbar header */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch justify-between bg-[#1A1C1E] p-4 rounded-xl border border-slate-800 shadow-md">
        
        {/* Search Input Box */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="একাউন্ট সার্চ করুন (একটি মাত্র অক্ষর লিখলেও মিলবে)..."
            className="w-full rounded-xl border border-slate-800 bg-[#121416] py-2.5 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20 transition-all"
          />
        </div>

        {/* Buttons panels */}
        <div className="flex gap-2 items-stretch shrink-0">
          
          {/* Add Account Button */}
          <button
            onClick={onAddAccount}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 font-bold text-xs transition active:scale-95 shadow-md shadow-blue-600/10"
            id="btn-add-account"
          >
            <Plus className="h-4 w-4" />
            নতুন যুক্ত করুন
          </button>

          {/* Download Excel Sheet Button */}
          <button
            onClick={handleDownloadExcel}
            className="flex items-center justify-center gap-1.5 border border-slate-800 bg-[#121416] hover:bg-slate-850 text-slate-300 rounded-xl px-3.5 py-2.5 font-semibold text-xs transition active:scale-95"
            id="btn-download-excel"
            title="এক্সসেল ফাইল ডাউনলোড করুন"
          >
            <Download className="h-4 w-4" />
            ব্যাকআপ এক্সসেল
          </button>

        </div>
      </div>

      {/* Main Categories Navigation Rail */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-450 uppercase tracking-widest flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-slate-500" />
            ক্যাটাগরি সমূহ
          </h3>
          <button
            onClick={() => setShowAddCatRow(!showAddCatRow)}
            className="text-[10px] bg-[#1A1C1E] hover:bg-[#121416] border border-slate-800 font-bold px-2 py-1 rounded-lg text-slate-300 flex items-center gap-1 transition"
          >
            <Plus className="h-2.5 w-2.5" />
            নতুন ক্যাটাগরি
          </button>
        </div>

        {/* Dynamic add category form inline panel */}
        <AnimatePresence>
          {showAddCatRow && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleCreateCategory}
              className="flex gap-2 max-w-sm bg-[#121416] p-2 rounded-xl border border-slate-800"
            >
              <input
                required
                type="text"
                placeholder="নতুন ক্যাটাগরি..."
                value={newCatInput}
                onChange={(e) => setNewCatInput(e.target.value)}
                className="flex-1 rounded-lg border border-slate-800 py-1 px-2 text-xs text-slate-200 bg-[#1A1C1E] focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 text-xs font-semibold text-white rounded-lg transition"
              >
                যুক্ত করুন
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Swiper Categories Slider */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
          {allCategories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const isCustom = customCategories.includes(cat);

            return (
              <div
                key={cat}
                className="relative shrink-0 flex items-center gap-1"
              >
                <button
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition active:scale-95 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                      : 'bg-[#1A1C1E] text-slate-400 border border-slate-800 hover:bg-[#121416] hover:text-white'
                  }`}
                >
                  {cat}
                </button>
                
                {/* Delete trigger for custom user categories */}
                {isCustom && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`আপনি কি '${cat}' ক্যাটাগরি ডিলিট করতে চান? এই ক্যাটাগরির একাউন্টগুলো মুছে যাবে না, তবে ক্যাটাগরি হারাতে পারে।`)) {
                        onDeleteCategory(cat);
                        if (selectedCategory === cat) setSelectedCategory('সবগুলো');
                      }
                    }}
                    className="absolute -top-1 -right-1 flex h-3.5 w-3.5 shadow-md items-center justify-center rounded-full bg-red-900 hover:bg-red-800 text-red-200 text-[10px] transition"
                    title="ক্যাটাগরি মুছুন"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Accounts display grids list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-slate-500">
            সর্বমোট {filteredAccounts.length} টি একাউন্ট পাওয়া গিয়েছে
          </span>
        </div>

        {filteredAccounts.length === 0 ? (
          <div className="text-center py-16 bg-[#1A1C1E] rounded-xl border border-dashed border-slate-800 p-8">
            <Lock className="h-8 w-8 text-slate-600 mx-auto mb-3" />
            <h4 className="text-xs font-bold text-slate-400">কোনো তথ্য পাওয়া যায়নি</h4>
            <p className="text-[11px] text-slate-500 mt-1">পাসওয়ার্ড বুকে কোনো রেকর্ড নেই অথবা সার্চে ফলাফল পাওয়া যায়নি।</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAccounts.map((account) => (
              <motion.div
                key={account.id}
                whileHover={{ y: -2 }}
                onClick={() => onSelectAccount(account)}
                className="bg-[#1A1C1E] border border-slate-800 rounded-xl p-4.5 hover:border-blue-500/50 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-[#121416] text-blue-400 border border-slate-800 font-extrabold uppercase text-xs select-none group-hover:bg-blue-950/25 group-hover:text-blue-300 group-hover:border-blue-500/30 transition">
                        {account.platform.substring(0, 1)}
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-white tracking-tight group-hover:text-blue-400 transition">
                          {account.platform}
                        </h4>
                        <span className="text-[9px] text-slate-500 bg-slate-900/40 px-1.5 py-0.5 rounded border border-slate-800/40 font-bold uppercase tracking-wider">
                          {account.category || "মিক্স"}
                        </span>
                      </div>
                    </div>
                    
                    <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition" />
                  </div>

                  {/* Field metadata display layout snippet */}
                  <div className="space-y-1.5 text-[11px]">
                    {account.username && (
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-[9px] uppercase font-bold text-slate-500">ইউজারনেম</span>
                        <span className="font-mono truncate max-w-[140px] text-slate-300">{account.username}</span>
                      </div>
                    )}
                    {account.email && (
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-[9px] uppercase font-bold text-slate-500">ইমেইল</span>
                        <span className="font-mono truncate max-w-[140px] text-slate-300">{account.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-800/60 pt-2.5 mt-3 flex items-center justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wide select-none">
                  <span>পাসওয়ার্ড সুরক্ষিত</span>
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500/50 animate-pulse" />
                  </div>
                </div>

              </motion.div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
