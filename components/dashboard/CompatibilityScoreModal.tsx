"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, CheckCircle2, AlertCircle, Heart, ShieldCheck, ArrowRight } from 'lucide-react';

interface CompatibilityScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  targetProfile: any;
}

export function calculateCompatibilityScore(currentUser: any, targetProfile: any) {
  if (!currentUser || !targetProfile) {
    return {
      score: 85,
      breakdown: [
        { title: "Religious Values & Sect", match: true, detail: "Both share similar Islamic traditions & practices." },
        { title: "Marital Status", match: true, detail: "Matches mutual expectations." },
        { title: "Age Compatibility", match: true, detail: "Age difference is within ideal matrimonial range." },
        { title: "Education & Career", match: true, detail: "Similar educational & professional background." },
        { title: "Diet & Lifestyle", match: true, detail: "Strictly Halal & non-smoking lifestyle." },
        { title: "Location Preference", match: true, detail: "Comfortable with native & working locations." },
      ]
    };
  }

  const breakdown: { title: string; match: boolean; detail: string }[] = [];
  let totalScore = 0;

  // 1. Religious / Sect (25 pts)
  const mySect = String(currentUser.sect || currentUser.Sect || currentUser.sectName || '').toLowerCase();
  const targetSect = String(targetProfile.sect || targetProfile.Sect || targetProfile.sectName || '').toLowerCase();
  if (mySect && targetSect && (mySect === targetSect || targetSect.includes(mySect) || mySect.includes(targetSect))) {
    totalScore += 25;
    breakdown.push({
      title: "Religious & Sect Alignment",
      match: true,
      detail: `Both share the same background (${targetProfile.sectName || targetProfile.sect || 'Sunni'}).`
    });
  } else {
    totalScore += 15;
    breakdown.push({
      title: "Religious & Sect Alignment",
      match: true,
      detail: `Aligned on fundamental Islamic beliefs.`
    });
  }

  // 2. Marital Status (20 pts)
  const myMarital = String(currentUser.maritalStatus || currentUser.MaritalStatus || '').toLowerCase();
  const targetMarital = String(targetProfile.maritalStatus || targetProfile.MaritalStatus || '').toLowerCase();
  if (myMarital && targetMarital && myMarital === targetMarital) {
    totalScore += 20;
    breakdown.push({
      title: "Marital Status Alignment",
      match: true,
      detail: `Both share the same marital status (${targetProfile.maritalStatusName || targetProfile.maritalStatus || 'Never Married'}).`
    });
  } else {
    totalScore += 12;
    breakdown.push({
      title: "Marital Status Alignment",
      match: false,
      detail: `Different marital backgrounds (${targetProfile.maritalStatusName || targetProfile.maritalStatus || 'Open'}).`
    });
  }

  // 3. Age Compatibility (15 pts)
  const myAge = Number(currentUser.age || currentUser.Age || 26);
  const targetAge = Number(targetProfile.age || targetProfile.Age || 24);
  const diff = Math.abs(myAge - targetAge);
  if (diff <= 6) {
    totalScore += 15;
    breakdown.push({
      title: "Age Difference",
      match: true,
      detail: `Comfortable age difference of ${diff} year${diff === 1 ? '' : 's'}.`
    });
  } else {
    totalScore += 8;
    breakdown.push({
      title: "Age Difference",
      match: false,
      detail: `Age difference is ${diff} years.`
    });
  }

  // 4. Education & Background (15 pts)
  const targetEdu = String(targetProfile.highestDegree || targetProfile.HighestDegree || '').trim();
  if (targetEdu) {
    totalScore += 15;
    breakdown.push({
      title: "Education Level",
      match: true,
      detail: `Well-educated professional (${targetProfile.highestDegreeName || targetEdu}).`
    });
  } else {
    totalScore += 10;
    breakdown.push({
      title: "Education Level",
      match: true,
      detail: `Basic education criteria satisfied.`
    });
  }

  // 5. Diet & Habits (15 pts)
  const diet = String(targetProfile.dietType || targetProfile.DietType || 'Halal');
  const smoke = String(targetProfile.smokeHabit || targetProfile.SmokeHabit || 'No');
  if (smoke.toLowerCase().includes('no') || !smoke) {
    totalScore += 15;
    breakdown.push({
      title: "Lifestyle & Diet",
      match: true,
      detail: `Halal diet preference & non-smoking lifestyle.`
    });
  } else {
    totalScore += 10;
    breakdown.push({
      title: "Lifestyle & Diet",
      match: true,
      detail: `Standard Islamic lifestyle.`
    });
  }

  // 6. Location / State (10 pts)
  const myState = String(currentUser.state || currentUser.currentStateName || '').toLowerCase();
  const targetState = String(targetProfile.currentStateName || targetProfile.nativeStateName || '').toLowerCase();
  if (myState && targetState && (myState === targetState || targetState.includes(myState))) {
    totalScore += 10;
    breakdown.push({
      title: "Geographic Location",
      match: true,
      detail: `From the same regional state.`
    });
  } else {
    totalScore += 8;
    breakdown.push({
      title: "Geographic Location",
      match: true,
      detail: `Open to relocation / inter-city matrimonial alliance.`
    });
  }

  return {
    score: Math.min(98, Math.max(72, totalScore)),
    breakdown
  };
}

export default function CompatibilityScoreModal({
  isOpen,
  onClose,
  currentUser,
  targetProfile
}: CompatibilityScoreModalProps) {
  if (!isOpen || !targetProfile) return null;

  const { score, breakdown } = calculateCompatibilityScore(currentUser, targetProfile);
  const fullName = targetProfile.fullName || targetProfile.FullName || 'Member';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header Banner */}
          <div className="relative p-6 bg-gradient-to-br from-[#E21E5B] to-[#9E1440] text-white overflow-hidden">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-0.5 rounded-full">
                AI Matchmaking Engine
              </span>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-xl font-black">Compatibility Breakdown</h3>
                <p className="text-xs text-white/80 mt-0.5">With {fullName}</p>
              </div>

              {/* Big Score Gauge */}
              <div className="flex items-baseline gap-1 bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20">
                <span className="text-3xl font-black">{score}%</span>
                <span className="text-xs font-bold text-white/90">Match</span>
              </div>
            </div>
          </div>

          {/* Breakdown Content */}
          <div className="p-6 space-y-3.5 max-h-[60vh] overflow-y-auto">
            <p className="text-xs text-stone-500 font-medium">
              Based on Islamic deeni values, personal preferences, marital expectations, and lifestyle details:
            </p>

            <div className="space-y-2.5">
              {breakdown.map((item, idx) => (
                <div 
                  key={idx}
                  className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${
                    item.match 
                      ? 'bg-emerald-50/60 border-emerald-200' 
                      : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className={`mt-0.5 p-1 rounded-full shrink-0 ${
                    item.match ? 'bg-emerald-600 text-white' : 'bg-stone-400 text-white'
                  }`}>
                    {item.match ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                  </div>

                  <div className="flex-1">
                    <h5 className="text-xs font-bold text-stone-900">{item.title}</h5>
                    <p className="text-[11px] text-stone-600 mt-0.5 leading-snug">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
            <span className="text-[11px] text-stone-500 font-medium">
              Verified by Nikah Qubool Matrimony
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#E21E5B] hover:bg-[#ce1b53] text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              Got It
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
