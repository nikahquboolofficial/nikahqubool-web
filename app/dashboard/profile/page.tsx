"use client";
import React from 'react';
import { 
  User, MapPin, Briefcase, GraduationCap, 
  Heart, Phone, Mail, Users, CheckCircle2, 
  Star, Info, Globe, Gem, Sparkles, Moon
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function MyProfilePage() {
  
  // Static data based on your requirements
  const userData = {
    name: "Maazni Sheikh",
    memberId: "PR-992834",
    age: 26,
    height: "6ft 0in",
    maritalStatus: "Never Married",
    religion: "Sunni / Salmani",
    education: "B.Com",
    college: "Regional College Bareilly",
    occupation: "Not Working",
    income: "Rs. 20 - 35 Lakh",
    location: "Khowai, Tripura, India",
    mobile: "+91 8445220256",
    email: "yasarmishkat5@gmail.com",
    familyType: "Nuclear Family",
    about: "There are 5 members in my family. I value honesty and simplicity in life. Looking for a partner who respects family values."
  };

  // Timeline Section Wrapper - Desktop aur Mobile ke liye optimized
  const SectionWrapper = ({ icon: Icon, title, children }: any) => (
    <div className="relative pl-7 md:pl-14 pb-10 group">
      {/* Vertical Timeline Line */}
      <div className="absolute left-[11px] md:left-[19px] top-0 bottom-0 w-[2px] bg-pink-100 group-last:bg-transparent" />
      
      {/* Floating Icon Node */}
      <div className="absolute left-0 top-0 w-6 h-6 md:w-10 md:h-10 rounded-full bg-white border-2 border-[#D2136E] flex items-center justify-center z-10 shadow-sm">
        <Icon size={14} className="text-[#D2136E] md:w-5 md:h-5" />
      </div>

      <div className="bg-white rounded-[24px] md:rounded-[35px] p-5 md:p-10 border border-pink-50 shadow-sm hover:shadow-md transition-all">
        <h3 className="text-[11px] md:text-[13px] font-black text-[#D2136E] uppercase tracking-[0.15em] mb-6 flex items-center gap-2">
          {title} <Sparkles size={14} className="opacity-40" />
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 md:gap-x-16">
          {children}
        </div>
      </div>
    </div>
  );

  // Detail Item with clean typography
  const InfoBit = ({ label, value, isFullWidth = false }: any) => (
    <div className={`space-y-1.5 ${isFullWidth ? 'sm:col-span-2' : ''}`}>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-[14px] md:text-[16px] font-bold text-slate-700 leading-tight">{value || "Not filled"}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDF2F5] pb-20">
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-12 space-y-10">
        
        {/* --- ELITE HERO CARD --- */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[35px] md:rounded-[50px] p-6 md:p-12 border border-pink-50 shadow-2xl shadow-pink-100/50 flex flex-col md:flex-row gap-8 items-center relative overflow-hidden"
        >
          {/* Subtle Background Pattern */}
          <div className="absolute -top-10 -right-10 opacity-[0.03] pointer-events-none">
             <Gem size={250} className="text-[#D2136E]" />
          </div>

          {/* Profile Image Container */}
          <div className="relative group">
            <div className="w-36 h-36 md:w-52 md:h-52 rounded-[40px] md:rounded-[60px] overflow-hidden border-[6px] md:border-[10px] border-pink-50 shadow-xl">
              <img 
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                alt="User Profile"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-2 md:p-3 rounded-2xl border-4 border-white shadow-lg">
              <CheckCircle2 size={20} />
            </div>
          </div>

          {/* Identity Info */}
          <div className="flex-1 text-center md:text-left space-y-6">
            <div>
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mb-3">
                <h1 className="text-2xl md:text-4xl font-black text-slate-800 italic tracking-tighter uppercase leading-none">
                  {userData.name}
                </h1>
                <span className="bg-[#D2136E] text-white text-[9px] md:text-[10px] font-black px-4 py-1.5 rounded-full uppercase italic tracking-wider">
                  ID: {userData.memberId}
                </span>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-6 text-slate-500 font-bold text-xs md:text-sm">
                 <span className="flex items-center gap-2"><MapPin size={18} className="text-[#D2136E]" /> {userData.location}</span>
                 <span className="flex items-center gap-2"><Globe size={18} className="text-[#D2136E]" /> Created for Sister</span>
              </div>
            </div>
            
            {/* Quick Badges Area */}
            <div className="pt-6 border-t border-gray-100 flex flex-wrap justify-center md:justify-start gap-4 md:gap-10">
               <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Age / Height</p>
                  <p className="text-sm md:text-base font-extrabold text-slate-700">{userData.age} Yrs, {userData.height}</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Community</p>
                  <p className="text-sm md:text-base font-extrabold text-slate-700">{userData.religion}</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Education</p>
                  <p className="text-sm md:text-base font-extrabold text-slate-700">{userData.education}</p>
               </div>
            </div>
          </div>
        </motion.div>

        {/* --- MAIN DETAILS TIMELINE --- */}
        <div className="max-w-4xl mx-auto space-y-2">
          
          <SectionWrapper icon={Info} title="Personal Summary">
            <InfoBit label="About Me" value={userData.about} isFullWidth={true} />
          </SectionWrapper>

          <SectionWrapper icon={Heart} title="Basic Background">
            <InfoBit label="Full Name" value={userData.name} />
            <InfoBit label="Gender" value="Female" />
            <InfoBit label="Marital Status" value={userData.maritalStatus} />
            <InfoBit label="Height" value={userData.height} />
            <InfoBit label="Mother Tongue" value="Hindi / Urdu" />
            <InfoBit label="Disability" value="None" />
          </SectionWrapper>

          <SectionWrapper icon={Phone} title="Contact Information">
            <InfoBit label="Mobile Number" value={userData.mobile} />
            <InfoBit label="Email Address" value={userData.email} />
            <div className="sm:col-span-2 flex items-center gap-3 p-4 bg-slate-800 text-white rounded-[20px] mt-2 shadow-xl shadow-slate-200">
               <ShieldCheck className="text-green-400 shrink-0" size={24} />
               <p className="text-[11px] font-bold leading-tight opacity-90 uppercase tracking-tight">
                 Your contact privacy is our priority. These details are only visible to verified premium members.
               </p>
            </div>
          </SectionWrapper>

          <SectionWrapper icon={GraduationCap} title="Education & Career">
            <InfoBit label="Qualification" value={userData.education} />
            <InfoBit label="College Name" value={userData.college} />
            <InfoBit label="Working Sector" value={userData.occupation} />
            <InfoBit label="Annual Income" value={userData.income} />
          </SectionWrapper>

          <SectionWrapper icon={Users} title="Family Structure">
            <InfoBit label="Family Type" value={userData.familyType} />
            <InfoBit label="Father's Work" value="Business Owner" />
            <InfoBit label="Mother's Work" value="Homemaker" />
            <InfoBit label="Family Status" value="Middle Class" />
            <InfoBit label="Location" value={userData.location} />
          </SectionWrapper>

          <SectionWrapper icon={Moon} title="Religious Life">
            <InfoBit label="Religion" value="Muslim" />
            <InfoBit label="Caste" value={userData.religion} />
            <InfoBit label="Perform Namaz" value="Regularly" />
            <InfoBit label="Quran Reading" value="Daily" />
          </SectionWrapper>

        </div>
      </div>
    </div>
  );
}

// Small helper for the shield icon used in contact
const ShieldCheck = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);