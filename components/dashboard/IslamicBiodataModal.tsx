"use client";

import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Printer, ShieldCheck, Heart, Sparkles, CheckCircle2, 
  GraduationCap, Briefcase, User, Users, Moon, Compass, Lock, 
  ExternalLink, Check
} from 'lucide-react';
import { getOptimizedImageUrl } from '@/lib/imageUtils';

interface IslamicBiodataModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  contactData?: { mobile: string; email: string } | null;
  isUserPaid?: boolean;
  maskedPhone?: string;
  maskedEmail?: string;
  isPhotoHidden?: boolean;
}

export default function IslamicBiodataModal({
  isOpen,
  onClose,
  profile,
}: IslamicBiodataModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !profile) return null;

  const handlePrint = () => {
    window.print();
  };

  const userId = profile.userId || profile.UserId || 0;
  const memberId = profile.memberId || profile.MemberId || `NQ${String(userId).padStart(7, '0')}`;
  const fullName = profile.fullName || profile.FullName || 'Candidate Member';
  const age = profile.age || profile.Age || '';
  const dob = profile.dob || profile.Dob || profile.dateOfBirth || profile.DateOfBirth || '';
  const height = profile.height || profile.Height || '';
  const weight = profile.weight || profile.Weight || '';
  const maritalStatus = profile.maritalStatusName || profile.maritalStatus || profile.MaritalStatus || 'Never Married';
  const motherTongue = profile.motherTongueName || profile.motherTongue || profile.MotherTongue || 'Urdu / Hindi';
  const languages = profile.languages || profile.Languages || profile.languagesSpoken || '';
  const sect = profile.sectName || profile.sect || profile.Sect || 'Sunni';
  const maslak = profile.maslakName || profile.maslak || profile.Maslak || '';
  const caste = profile.casteName || profile.caste || profile.Caste || '';
  const subCaste = profile.subCaste || profile.SubCaste || '';
  const profileManagedBy = profile.profileCreatedByName || profile.profileCreatedBy || profile.ProfileCreatedBy || 'Self / Family';

  const education = profile.highestDegreeName || profile.highestDegree || profile.HighestDegree || '';
  const college = profile.collegeName || profile.CollegeName || '';
  const educationDetails = profile.educationDetails || profile.EducationDetails || '';
  const profession = profile.designationName || profile.designation || profile.Designation || profile.occupationDetails || profile.OccupationDetails || profile.occupation || '';
  const companySector = profile.employmentSectorName || profile.employmentSector || profile.EmploymentSector || '';
  const income = profile.annualIncome || profile.AnnualIncome || '';

  const currentState = profile.currentStateName || profile.currentState || profile.CurrentStateName || '';
  const currentCity = profile.currentCityName || profile.currentCity || profile.CurrentCityName || '';
  const currentCountry = profile.currentCountryName || profile.currentCountry || profile.CurrentCountryName || 'India';
  const nativeState = profile.nativeStateName || profile.nativeState || profile.NativeStateName || '';
  const nativeCity = profile.nativeCityName || profile.nativeCity || profile.NativeCityName || '';

  const bio = profile.aboutMe || profile.AboutMe || profile.bio || profile.Bio || '';

  const fatherName = profile.fatherName || profile.FatherName || '';
  const fatherOccupation = profile.fatherOccupationName || profile.fatherOccupation || profile.FatherOccupation || '';
  const motherName = profile.motherName || profile.MotherName || '';
  const motherOccupation = profile.motherOccupationName || profile.motherOccupation || profile.MotherOccupation || '';
  const totalBrothers = profile.totalBrothers ?? profile.TotalBrothers ?? 0;
  const marriedBrothers = profile.marriedBrothers ?? profile.MarriedBrothers ?? 0;
  const totalSisters = profile.totalSisters ?? profile.TotalSisters ?? 0;
  const marriedSisters = profile.marriedSisters ?? profile.MarriedSisters ?? 0;
  const familyType = profile.familyTypeName || profile.familyType || profile.FamilyType || '';
  const familyStatus = profile.familyStatusName || profile.familyStatus || profile.FamilyStatus || '';
  const familyValues = profile.familyValuesName || profile.familyValues || profile.FamilyValues || 'Religious & Moderate';
  const familyLivesIn = profile.familyLivesIn || profile.FamilyLivesIn || (currentCity ? `${currentCity}, ${currentState}` : '');

  // Religious Practices
  const namaz = profile.namaz || profile.Namaz || profile.namazFrequency || profile.NamazFrequency || 'Regularly (5 Times)';
  const roza = profile.roza || profile.Roza || profile.fasting || profile.Fasting || 'Observes Roza';
  const quran = profile.quran || profile.Quran || profile.quranReading || profile.QuranReading || 'Recites Regularly';
  const halalStrictness = profile.halalStrictness || profile.HalalStrictness || 'Always Halal';
  const islamicAttire = profile.hijab || profile.Hijab || profile.beard || profile.Beard || 'Modest Islamic Attire';

  // Lifestyle
  const diet = profile.dietType || profile.diet || profile.DietType || 'Halal';
  const smoking = profile.smoking || profile.Smoking || 'No';
  const drinking = profile.drinking || profile.Drinking || 'No';

  // Partner Preferences
  const partnerAge = (profile.partnerAgeMin || profile.partnerMinAge) 
    ? `${profile.partnerAgeMin || profile.partnerMinAge} - ${profile.partnerAgeMax || profile.partnerMaxAge || 'Open'} Yrs` 
    : '21 - 32 Yrs';
  const partnerHeight = (profile.partnerHeightMin) 
    ? `${profile.partnerHeightMin} - ${profile.partnerHeightMax || 'Open'}` 
    : '5\' 0" - 6\' 0"';
  const partnerMarital = profile.partnerMaritalStatus || profile.PartnerMaritalStatus || 'Never Married';
  const partnerEdu = profile.partnerEducation || profile.PartnerEducation || 'Graduate / Professional';
  const partnerOcc = profile.partnerOccupation || profile.PartnerOccupation || 'Employed / Business / Homemaker';
  const partnerLoc = profile.partnerCity || profile.partnerState || profile.PartnerCity || profile.PartnerState || 'Open / Anywhere';
  const partnerSectPref = profile.partnerSect || profile.PartnerSect || (sect ? `Preferably ${sect}` : 'Sunni / Muslim');

  const photo = getOptimizedImageUrl(profile.mainPhotoUrl || profile.photoUrl || profile.PhotoUrl || '');
  const isVerified = Boolean(profile.isVerified ?? profile.IsVerified);
  const liveProfileUrl = `https://nikahqubool.in/dashboard/profile?userId=${userId}`;

  // Helper row component for single-line neat layout
  const DetailRow = ({ label, value }: { label: string; value: string | React.ReactNode }) => {
    if (!value || value === 'N/A' || value === '') return null;
    return (
      <div className="flex items-baseline py-1.5 border-b border-stone-100 last:border-b-0 text-[12px] leading-snug">
        <span className="w-36 sm:w-44 text-stone-500 font-semibold shrink-0">
          {label}
        </span>
        <span className="text-stone-300 font-bold px-1.5 shrink-0">:</span>
        <span className="text-stone-900 font-medium flex-1 pl-1 break-words">
          {value}
        </span>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto bg-black/80 backdrop-blur-md">
        
        {/* PRINT STYLES STRICTLY OPTIMIZED FOR CLEAN A4 FORMAT */}
        <style jsx global>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm 12mm 12mm 12mm;
            }
            body {
              background: white !important;
              color: #1c1917 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body * {
              visibility: hidden;
            }
            #printable-islamic-biodata, #printable-islamic-biodata * {
              visibility: visible;
            }
            #printable-islamic-biodata {
              position: absolute;
              left: 0;
              top: 0;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              box-shadow: none !important;
              border: none !important;
            }
            .page-break-avoid {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
        >
          {/* TOP ACTION BAR */}
          <div className="no-print flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-stone-900 to-stone-800 text-white shrink-0 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#E21E5B] flex items-center justify-center text-white font-bold text-xs shadow-sm">
                NQ
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm tracking-wide">Nikah Qubool Official Biodata</h3>
                <p className="text-[11px] text-stone-300">Member ID: {memberId} • Privacy Protected</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#E21E5B] hover:bg-[#b01348] text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Printer size={15} />
                <span>Print / Save PDF</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* DOCUMENT BODY */}
          <div className="overflow-y-auto flex-1 p-3 sm:p-6 bg-[#F6F5F2]">
            <div 
              id="printable-islamic-biodata"
              ref={printAreaRef}
              className="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 sm:p-8 relative"
            >
              
              {/* HEADER: BISMILLAH & NIKAH QUBOOL BRAND */}
              <div className="text-center pb-4 border-b border-stone-200">
                <p className="font-serif text-xl sm:text-2xl text-amber-900 font-bold tracking-wider mb-1">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </p>
                <h2 className="text-lg sm:text-xl font-serif font-black tracking-tight text-[#E21E5B]">
                  NIKAH QUBOOL
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mt-0.5">
                  Official Muslim Matrimonial Biodata • Connecting Pure Souls with Sunnah
                </p>
                <p className="text-[10px] text-stone-400 font-medium">
                  Verified Portal: <span className="text-[#E21E5B] font-semibold">https://nikahqubool.in</span>
                </p>
              </div>

              {/* CANDIDATE HERO BLOCK (PHOTO ALWAYS BLURRED FOR PRIVACY) */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 py-4 border-b border-stone-200">
                
                {/* PHOTO CONTAINER WITH MANDATORY PRIVACY BLUR */}
                <div className="relative w-32 h-40 sm:w-36 sm:h-44 rounded-2xl overflow-hidden border-2 border-stone-200 shadow-xs shrink-0 bg-stone-100 flex items-center justify-center">
                  {photo ? (
                    <img 
                      src={photo} 
                      alt={fullName}
                      className="w-full h-full object-cover blur-md scale-110 filter"
                    />
                  ) : (
                    <div className="w-full h-full bg-stone-200 flex items-center justify-center">
                      <User size={42} className="text-stone-400" />
                    </div>
                  )}

                  {/* PRIVACY PROTECTED OVERLAY PILL */}
                  <div className="absolute inset-0 bg-stone-900/35 backdrop-blur-[1px] flex flex-col items-center justify-center text-center p-2 text-white">
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-1">
                      <Lock size={15} className="text-white" />
                    </div>
                    <span className="text-[10px] font-bold leading-tight uppercase tracking-wider">
                      Photo Blurred
                    </span>
                    <span className="text-[8.5px] text-stone-200 mt-0.5 leading-tight">
                      For Privacy & Security
                    </span>
                  </div>

                  {isVerified && (
                    <div className="absolute top-2 right-2 bg-emerald-600 text-white rounded-full p-1 shadow-xs">
                      <ShieldCheck size={13} />
                    </div>
                  )}
                </div>

                {/* HERO QUICK INFO */}
                <div className="flex-1 text-center sm:text-left space-y-1.5 w-full">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-stone-900">
                      {fullName}
                    </h1>
                    {isVerified && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 size={12} className="text-emerald-600" /> Verified Profile
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                    <span className="font-bold text-[#E21E5B]">Member ID: {memberId}</span>
                    <span className="text-stone-300">•</span>
                    <span className="text-stone-600 font-medium">Profile by: {profileManagedBy}</span>
                  </div>

                  <p className="text-xs text-stone-700 font-semibold pt-0.5">
                    {[
                      age ? `${age} Yrs` : null,
                      height || null,
                      maritalStatus || null,
                      sect || null,
                      caste || null,
                      currentCity ? `${currentCity}, ${currentState}` : currentState || null
                    ].filter(Boolean).join(' • ')}
                  </p>

                  <div className="pt-2 text-xs text-stone-600">
                    <div>
                      <span className="font-semibold text-stone-700">Education: </span>
                      <span>{education} {college ? `(${college})` : ''}</span>
                    </div>
                    <div className="mt-0.5">
                      <span className="font-semibold text-stone-700">Occupation: </span>
                      <span>{profession} {companySector ? `• ${companySector}` : ''}</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* CANDIDATE BIO (IF AVAILABLE) */}
              {bio && (
                <div className="py-3.5 border-b border-stone-200 page-break-avoid">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-stone-700 mb-1.5 flex items-center gap-1.5">
                    <User size={13} className="text-[#E21E5B]" />
                    About {fullName.split(' ')[0]}
                  </h4>
                  <p className="text-xs text-stone-700 leading-relaxed italic bg-stone-50 p-3 rounded-xl border border-stone-200/70">
                    &ldquo;{bio}&rdquo;
                  </p>
                </div>
              )}

              {/* SECTION 1: BASIC DETAILS (CLEAN SINGLE-LINE FORMAT) */}
              <div className="py-3.5 border-b border-stone-200 page-break-avoid">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-stone-800 mb-2 flex items-center gap-1.5">
                  <User size={13} className="text-[#E21E5B]" />
                  Basic Information
                </h4>
                <div className="bg-white rounded-xl border border-stone-200/80 px-3.5 py-1">
                  <DetailRow label="Full Name" value={fullName} />
                  <DetailRow label="Age / Date of Birth" value={age ? `${age} Years ${dob ? `(${dob})` : ''}` : dob} />
                  <DetailRow label="Height / Weight" value={[height, weight ? `${weight} kg` : null].filter(Boolean).join(' / ')} />
                  <DetailRow label="Marital Status" value={maritalStatus} />
                  <DetailRow label="Mother Tongue" value={motherTongue} />
                  {languages && <DetailRow label="Languages Spoken" value={languages} />}
                  <DetailRow label="Sect & Maslak" value={[sect, maslak ? `(${maslak})` : null].filter(Boolean).join(' ')} />
                  <DetailRow label="Caste / Community" value={[caste, subCaste ? `(${subCaste})` : null].filter(Boolean).join(' ')} />
                  <DetailRow label="Current Residence" value={[currentCity, currentState, currentCountry].filter(Boolean).join(', ')} />
                  <DetailRow label="Native Place" value={[nativeCity, nativeState].filter(Boolean).join(', ')} />
                  <DetailRow label="Profile Created By" value={profileManagedBy} />
                </div>
              </div>

              {/* SECTION 2: EDUCATION & CAREER */}
              <div className="py-3.5 border-b border-stone-200 page-break-avoid">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-stone-800 mb-2 flex items-center gap-1.5">
                  <GraduationCap size={14} className="text-[#E21E5B]" />
                  Education & Professional Career
                </h4>
                <div className="bg-white rounded-xl border border-stone-200/80 px-3.5 py-1">
                  <DetailRow label="Highest Degree" value={education} />
                  {college && <DetailRow label="College / University" value={college} />}
                  {educationDetails && <DetailRow label="Education Details" value={educationDetails} />}
                  <DetailRow label="Occupation / Role" value={profession} />
                  {companySector && <DetailRow label="Employment Sector" value={companySector} />}
                  {income && <DetailRow label="Annual Income" value={income} />}
                </div>
              </div>

              {/* SECTION 3: FAMILY BACKGROUND */}
              <div className="py-3.5 border-b border-stone-200 page-break-avoid">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-stone-800 mb-2 flex items-center gap-1.5">
                  <Heart size={13} className="text-[#E21E5B]" />
                  Family Background
                </h4>
                <div className="bg-white rounded-xl border border-stone-200/80 px-3.5 py-1">
                  <DetailRow label="Father's Name" value={fatherName || 'Not Disclosed'} />
                  <DetailRow label="Father's Occupation" value={fatherOccupation} />
                  <DetailRow label="Mother's Name" value={motherName || 'Not Disclosed'} />
                  <DetailRow label="Mother's Occupation" value={motherOccupation || 'Homemaker'} />
                  <DetailRow label="Brothers" value={`${totalBrothers} Brother${totalBrothers > 1 ? 's' : ''} (${marriedBrothers} Married)`} />
                  <DetailRow label="Sisters" value={`${totalSisters} Sister${totalSisters > 1 ? 's' : ''} (${marriedSisters} Married)`} />
                  <DetailRow label="Family Type & Status" value={[familyType || 'Nuclear', familyStatus || 'Middle Class'].join(' • ')} />
                  <DetailRow label="Family Values" value={familyValues} />
                  {familyLivesIn && <DetailRow label="Family Lives In" value={familyLivesIn} />}
                </div>
              </div>

              {/* SECTION 4: RELIGIOUS & ISLAMIC PRACTICES */}
              <div className="py-3.5 border-b border-stone-200 page-break-avoid">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-stone-800 mb-2 flex items-center gap-1.5">
                  <Moon size={13} className="text-[#E21E5B]" />
                  Religious & Islamic Lifestyle
                </h4>
                <div className="bg-white rounded-xl border border-stone-200/80 px-3.5 py-1">
                  <DetailRow label="Religion" value="Islam" />
                  <DetailRow label="Sect / Maslak" value={[sect, maslak ? `(${maslak})` : null].filter(Boolean).join(' ')} />
                  <DetailRow label="Namaz (Salah)" value={namaz} />
                  <DetailRow label="Roza (Fasting)" value={roza} />
                  <DetailRow label="Quran Recitation" value={quran} />
                  <DetailRow label="Halal / Strictness" value={halalStrictness} />
                  <DetailRow label="Islamic Attire" value={islamicAttire} />
                </div>
              </div>

              {/* SECTION 5: LIFESTYLE & HABITS */}
              <div className="py-3.5 border-b border-stone-200 page-break-avoid">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-stone-800 mb-2 flex items-center gap-1.5">
                  <Compass size={13} className="text-[#E21E5B]" />
                  Lifestyle & Habits
                </h4>
                <div className="bg-white rounded-xl border border-stone-200/80 px-3.5 py-1">
                  <DetailRow label="Dietary Preference" value={diet} />
                  <DetailRow label="Smoking" value={smoking} />
                  <DetailRow label="Drinking" value={drinking} />
                </div>
              </div>

              {/* SECTION 6: PARTNER PREFERENCES */}
              <div className="py-3.5 border-b border-stone-200 page-break-avoid">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-stone-800 mb-2 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-[#E21E5B]" />
                  Partner Expectations & Preferences
                </h4>
                <div className="bg-white rounded-xl border border-stone-200/80 px-3.5 py-1">
                  <DetailRow label="Preferred Age" value={partnerAge} />
                  <DetailRow label="Preferred Height" value={partnerHeight} />
                  <DetailRow label="Marital Status" value={partnerMarital} />
                  <DetailRow label="Education" value={partnerEdu} />
                  <DetailRow label="Profession" value={partnerOcc} />
                  <DetailRow label="Sect / Maslak" value={partnerSectPref} />
                  <DetailRow label="Preferred Location" value={partnerLoc} />
                </div>
              </div>

              {/* 🔒 PRIVACY-PROTECTED CONTACT BOX (NEVER EXPOSES PHONE OR EMAIL ON PDF) */}
              <div className="mt-4 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 page-break-avoid">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Lock size={14} />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-amber-950">
                      Contact & Communication Details Protected
                    </h5>
                    <p className="text-[11px] text-amber-900/80 leading-relaxed">
                      To safeguard candidate privacy and prevent unauthorized offline circulation, direct phone numbers and email addresses are strictly withheld from downloadable biodatas.
                    </p>
                    <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] font-bold text-[#E21E5B]">
                      <span>To send interest or contact this profile, visit:</span>
                      <a 
                        href={liveProfileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="underline hover:text-[#b01348] font-mono break-all"
                      >
                        {liveProfileUrl}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER DISCLAIMER */}
              <div className="mt-6 pt-3 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between text-[10px] text-stone-500 gap-2">
                <div className="flex items-center gap-1.5 font-semibold text-stone-700">
                  <span>Nikah Qubool Matrimonial Services</span>
                  <span>•</span>
                  <span>https://nikahqubool.in</span>
                </div>
                <div className="italic text-center sm:text-right">
                  System-generated authentic document • Subject to candidate self-declaration.
                </div>
              </div>

            </div>
          </div>

          {/* BOTTOM BAR FOR MOBILE CLOSE */}
          <div className="no-print p-3 sm:p-4 bg-white border-t border-stone-200 flex items-center justify-between shrink-0">
            <span className="text-xs text-stone-500">
              Click &quot;Print / Save PDF&quot; to download the official biodata.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all cursor-pointer"
            >
              Close
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
