import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Edit,
  Trash,
  User,
  EyeOff,
  Eye,
  Mail,
  Smartphone,
  Calendar,
  Info,
  ExternalLink,
  Copy,
  Check,
  Tag,
  Clock,
  Briefcase
} from 'lucide-react';
import { Account } from '../types';

interface AccountDetailViewProps {
  account: Account;
  onBack: () => void;
  onEdit: (account: Account) => void;
  onDelete: (accountId: string) => void;
}

interface FieldItem {
  id: string;
  label: string;
  value: string;
  icon: React.ComponentType<any>;
  color: string;
  tagColor: string;
  fontStyle?: string;
  isFullWidth?: boolean;
}

export default function AccountDetailView({
  account,
  onBack,
  onEdit,
  onDelete
}: AccountDetailViewProps) {
  // To handle Clipboard Feedback per field card
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Custom states for mobile tap to reveal because mobile doesn't have hover
  const [revealedFields, setRevealedFields] = useState<Record<string, boolean>>({});

  const handleCopy = (fieldId: string, value: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedField(fieldId);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const toggleReveal = (fieldId: string) => {
    setRevealedFields((prev) => ({
      ...prev,
      [fieldId]: !prev[fieldId]
    }));
  };

  // Field cards configuration
  const fields: FieldItem[] = [
    {
      id: 'username',
      label: 'ইউজারনেম (Username)',
      value: account.username,
      icon: User,
      color: 'bg-[#1A1C1E] border-slate-800 hover:border-rose-500/40 text-rose-400',
      tagColor: 'bg-rose-950/40 border border-rose-900/50 text-rose-300'
    },
    {
      id: 'password',
      label: 'পাসওয়ার্ড (Password)',
      value: account.password,
      icon: EyeOff,
      color: 'bg-[#1A1C1E] border-slate-800 hover:border-emerald-500/40 text-emerald-400',
      tagColor: 'bg-emerald-950/40 border border-emerald-900/50 text-emerald-300',
      fontStyle: 'font-mono'
    },
    {
      id: 'email',
      label: 'ইমেইল / জিমেইল (Gmail)',
      value: account.email,
      icon: Mail,
      color: 'bg-[#1A1C1E] border-slate-800 hover:border-blue-500/40 text-blue-400',
      tagColor: 'bg-blue-950/40 border border-blue-900/50 text-blue-300'
    },
    {
      id: 'mobile',
      label: 'মোবাইল নং (Mobile No)',
      value: account.mobile,
      icon: Smartphone,
      color: 'bg-[#1A1C1E] border-slate-800 hover:border-amber-500/40 text-amber-400',
      tagColor: 'bg-amber-950/40 border border-amber-900/50 text-amber-350'
    },
    {
      id: 'link',
      label: 'ওয়েব লিংক (Web Link)',
      value: account.link,
      icon: ExternalLink,
      color: 'bg-[#1A1C1E] border-slate-800 hover:border-violet-500/40 text-violet-400',
      tagColor: 'bg-violet-950/40 border border-violet-900/50 text-violet-300'
    },
    {
      id: 'date',
      label: 'একাউন্ট খোলার তারিখ',
      value: account.dateOfOpening,
      icon: Calendar,
      color: 'bg-[#1A1C1E] border-slate-800 hover:border-sky-500/40 text-sky-455',
      tagColor: 'bg-sky-950/40 border border-sky-900/50 text-sky-300'
    },
    {
      id: 'details',
      label: 'বিস্তারিত বিবরণ (Details)',
      value: account.details,
      icon: Info,
      color: 'bg-[#1A1C1E] border-slate-800 hover:border-fuchsia-500/40 text-fuchsia-400',
      tagColor: 'bg-fuchsia-950/40 border border-fuchsia-900/50 text-fuchsia-300',
      isFullWidth: true
    }
  ];

  // Map any extra fields added dynamically by the user
  const extraFieldsList: FieldItem[] = account.extraFields
    ? Object.entries(account.extraFields).map(([key, value], idx) => {
        const borderColors = [
          'hover:border-teal-500/40 text-teal-400',
          'hover:border-orange-500/40 text-orange-400',
          'hover:border-lime-500/40 text-lime-400',
          'hover:border-pink-500/40 text-pink-400'
        ];
        const tagColors = [
          'bg-teal-950/40 border border-teal-900/50 text-teal-300',
          'bg-orange-950/40 border border-orange-900/50 text-orange-300',
          'bg-lime-950/40 border border-lime-900/50 text-lime-300',
          'bg-pink-950/40 border border-pink-900/50 text-pink-300'
        ];
        
        return {
          id: `extra-${idx}`,
          label: key,
          value: value,
          icon: Tag,
          color: `bg-[#1A1C1E] border-slate-800 ${borderColors[idx % borderColors.length]}`,
          tagColor: tagColors[idx % tagColors.length]
        };
      })
    : [];

  const allVisibleFields = [...fields, ...extraFieldsList].filter(f => f.value && f.value.trim() !== '');

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-2">
      
      {/* Detail View Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-[#1A1C1E] p-3 rounded-xl border border-slate-800 shadow-md">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-350 hover:text-white font-medium text-xs transition py-1 px-3 rounded-lg hover:bg-[#121416] self-start"
          id="btn-back"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          পেছনে যান
        </button>

        <div className="flex gap-2 items-center self-end">
          <button
            onClick={() => onEdit(account)}
            className="flex items-center gap-1.5 bg-blue-950/40 text-blue-400 hover:bg-blue-900/40 hover:text-white border border-blue-900/40 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
            id="btn-edit"
          >
            <Edit className="h-3.5 w-3.5" />
            এডিট করুন
          </button>
          <button
            onClick={() => onDelete(account.id)}
            className="flex items-center gap-1.5 bg-red-950/40 text-red-400 hover:bg-red-900/40 hover:text-white border border-red-900/40 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
            id="btn-delete"
          >
            <Trash className="h-3.5 w-3.5" />
            ডিলিট করুন
          </button>
        </div>
      </div>

      {/* Main Account Poster */}
      <div className="text-center mb-8">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-xl shadow-md shadow-blue-500/10 mb-3 select-none">
          {account.platform.substring(0, 2).toUpperCase()}
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">{account.platform}</h1>
        
        <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-[#1A1C1E] text-slate-300 border border-slate-800">
            <Briefcase className="h-3 w-3 text-slate-500" />
            {account.category || "মিক্স"}
          </span>
          {account.link && (
            <a
              href={account.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold text-blue-400 bg-blue-950/20 border border-blue-900/30 hover:bg-blue-950/40 transition"
            >
              লিংকে যান
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
        </div>
      </div>

      {/* Grid of Colorful Bento Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allVisibleFields.map((field) => {
          const Icon = field.icon;
          const isCopied = copiedField === field.id;
          const isRevealed = revealedFields[field.id] || false;

          return (
            <div
              key={field.id}
              className={`relative overflow-hidden rounded-xl border p-4.5 min-h-[120px] flex flex-col justify-between transition-all duration-300 shadow-md cursor-pointer select-none group ${field.color} ${
                field.isFullWidth ? 'md:col-span-2' : ''
              }`}
              onClick={() => handleCopy(field.id, field.value)}
              onMouseEnter={() => toggleReveal(field.id)}
              onMouseLeave={() => toggleReveal(field.id)}
            >
              {/* Background gradient layout */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/2 to-transparent pointer-events-none" />

              {/* Top Row: Label & Copy/Lock Indicator */}
              <div className="flex items-center justify-between z-10">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold leading-none ${field.tagColor}`}>
                  {field.label}
                </span>
                
                <div className="flex items-center gap-2">
                  {/* Eye Toggle to manually reveal click for mobile */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // don't copy when eye clicked
                      toggleReveal(field.id);
                    }}
                    className="p-1 rounded-full hover:bg-black/20 transition md:hidden"
                    title="তথ্য দেখুন"
                  >
                    {isRevealed ? <Eye className="h-3.5 w-3.5 text-slate-400" /> : <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
                  </button>

                  <div className="text-slate-500 group-hover:text-slate-300 transition">
                    {isCopied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-slate-500 group-hover:scale-110 transition opacity-60 group-hover:opacity-100" />
                    )}
                  </div>
                </div>
              </div>

              {/* Output / Secret state */}
              <div className="mt-3 relative z-10 flex-1 flex items-end">
                {/* Visual Cover animation */}
                <div className="w-full relative overflow-hidden">
                  
                  {/* HIDING CONTENT: Only shown if NOT revealed */}
                  {!isRevealed && (
                    <div className="flex items-center gap-1.5 text-slate-500 font-medium py-1">
                      <Icon className="h-4 w-4 shrink-0 opacity-60 animate-pulse" />
                      <span className="text-[11px] tracking-wide text-slate-500">
                        দেখতে মাউস রাখুন / ট্যাপ করুন
                      </span>
                    </div>
                  )}

                  {/* REVEALED CONTENT: Smoothly animated when Hovered/Tapped */}
                  {isRevealed && (
                    <div className={`flex items-start gap-1.5 py-1 ${field.fontStyle || ''} font-bold text-slate-200 break-all w-full`}>
                      <Icon className="h-4 w-4 shrink-0 text-slate-450 mt-0.5" />
                      <span className="text-xs leading-normal select-all">
                        {field.value}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Copied Banner Animation */}
              {isCopied && (
                <div className="absolute bottom-2.5 right-2.5 bg-slate-900 border border-slate-800 text-white rounded-lg px-2 py-0.5 text-[9px] font-black tracking-wider shadow-lg flex items-center gap-1 z-20">
                  <Check className="h-2.5 w-2.5 text-emerald-400" />
                  কপি হয়েছে!
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Guide details help box */}
      <p className="mt-6 text-center text-[10px] text-slate-500 bg-[#121416] border border-slate-800 max-w-sm mx-auto p-3 rounded-lg select-none leading-relaxed">
        নিরাপত্তার স্বার্থে পাসওয়ার্ড বুক আপনার কোনো গোপন তথ্য খোলামেলা স্ক্রিনে দেখায় না। তথ্য দেখতে তার ঘরের ওপর <strong>মাউস রাখুন</strong> এবং কপি করতে সেটিতে <strong>চেপে ধরুন বা একটি ক্লিক করুন</strong>।
      </p>

    </div>
  );
}
