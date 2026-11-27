/**
 * Comprehensive Master ID-to-Text Resolver for Pakiza Rishte Web
 * Guarantees that raw numeric IDs (e.g. "1", "2", "14") are NEVER displayed on screen.
 * Synchronized with mobile app's MasterResolver.
 */

export const FALLBACK_MASTERS: Record<string, Record<string, string>> = {
  PROFILE_CREATED_FOR: {
    '1': 'Self',
    '2': 'Son',
    '3': 'Daughter',
    '4': 'Brother',
    '5': 'Sister',
    '6': 'Relative',
    '7': 'Friend',
  },
  MARITAL_STATUS: {
    '1': 'Never Married',
    '2': 'Divorced',
    '3': 'Widowed',
    '4': 'Awaiting Divorce',
    '5': 'Separated',
    '6': 'Khula',
    '7': 'Annulled',
  },
  RELIGIONS: {
    '1': 'Islam',
  },
  SECTS: {
    '1': 'Sunni',
    '2': 'Shia',
    '3': 'Ahle Hadees',
    '4': 'Bohra',
    '5': 'Other',
  },
  MASLAKS: {
    '1': 'Barelvi',
    '2': 'Deobandi',
    '3': 'Ahle Hadees',
    '4': 'Shafi',
    '5': 'Hanafi',
    '6': 'Salafi',
    '7': 'Just Sunni / No Maslak',
    '8': 'Other',
  },
  CASTES: {
    '1': 'Syed',
    '2': 'Sheikh',
    '3': 'Pathan',
    '4': 'Ansari',
    '5': 'Qureshi',
    '6': 'Siddiqui',
    '7': 'Farooqui',
    '8': 'Usmani',
    '9': 'Mirza / Mughal',
    '10': 'Khan',
    '11': 'Malik',
    '12': 'Chaudhary',
    '13': 'Saifi',
    '14': 'Mansoori',
    '15': 'Rayeen',
    '16': 'Salmani',
    '17': 'Idrisi',
    '18': 'Abbasi',
    '19': 'Rizvi',
    '20': 'Zaidi',
    '21': 'Naqvi',
    '22': 'Kazmi',
    '23': 'Jafri',
    '24': 'Alvi',
    '25': 'Hashmi',
    '26': 'Qadri',
    '27': 'Chishti',
    '28': 'Nizami',
    '29': 'Sabri',
    '30': 'Memon',
    '31': 'Khoja',
    '32': 'Bohra',
    '33': 'Mapilla',
    '34': 'Meo',
    '35': 'Rangrez',
    '36': 'Qassab',
    '37': 'Faqir',
    '38': 'Teli',
    '39': 'Julaha',
    '40': 'Gaddi',
    '41': 'Gujjar',
    '42': 'Rajput Muslim',
    '43': 'Jat Muslim',
    '44': 'Kashmiri Muslim',
    '45': 'Caste No Bar',
    '46': 'Other',
  },
  MOTHER_TONGUES: {
    '1': 'Urdu',
    '2': 'Hindi',
    '3': 'English',
    '4': 'Arabic',
    '5': 'Punjabi',
    '6': 'Bengali',
    '7': 'Marathi',
    '8': 'Gujarati',
    '9': 'Tamil',
    '10': 'Telugu',
    '11': 'Malayalam',
    '12': 'Kannada',
    '13': 'Kashmiri',
    '14': 'Sindhi',
    '15': 'Pashto',
    '16': 'Persian',
    '17': 'Other',
  },
  COMPLEXION: {
    '1': 'Very Fair',
    '2': 'Fair',
    '3': 'Wheatish',
    '4': 'Wheatish Brown',
    '5': 'Dark',
  },
  COMPLEXIONS: {
    '1': 'Very Fair',
    '2': 'Fair',
    '3': 'Wheatish',
    '4': 'Wheatish Brown',
    '5': 'Dark',
  },
  EDUCATIONS: {
    '1': 'B.Tech / B.E.',
    '2': 'M.Tech / M.E.',
    '3': 'MBA / PGDM',
    '4': 'MCA',
    '5': 'BCA',
    '6': 'B.Sc',
    '7': 'M.Sc',
    '8': 'B.Com',
    '9': 'M.Com',
    '10': 'B.A.',
    '11': 'M.A.',
    '12': 'MBBS',
    '13': 'MD / MS',
    '14': 'BDS',
    '15': 'B.Pharm',
    '16': 'BBA',
    '17': 'LLB',
    '18': 'CA / CS',
    '19': 'Diploma',
    '20': 'High School (10th)',
    '21': 'Intermediate (12th)',
    '22': 'Islamic Scholar / Aalim',
    '23': 'Other',
  },
  EMPLOYMENT_SECTORS: {
    '1': 'Private Sector',
    '2': 'Government / Public Sector',
    '3': 'Business / Self Employed',
    '4': 'Civil Services',
    '5': 'Defence / Police',
    '6': 'Not Working / Homemaker',
    '7': 'Student',
  },
  HEIGHTS: {
    '135': '4ft 5in (135 cm)',
    '137': '4ft 6in (137 cm)',
    '140': '4ft 7in (140 cm)',
    '142': '4ft 8in (142 cm)',
    '145': '4ft 9in (145 cm)',
    '147': '4ft 10in (147 cm)',
    '150': '4ft 11in (150 cm)',
    '152': '5ft 0in (152 cm)',
    '155': '5ft 1in (155 cm)',
    '157': '5ft 2in (157 cm)',
    '160': '5ft 3in (160 cm)',
    '162': '5ft 4in (162 cm)',
    '165': '5ft 5in (165 cm)',
    '168': '5ft 6in (168 cm)',
    '170': '5ft 7in (170 cm)',
    '173': '5ft 8in (173 cm)',
    '175': '5ft 9in (175 cm)',
    '178': '5ft 10in (178 cm)',
    '180': '5ft 11in (180 cm)',
    '183': '6ft 0in (183 cm)',
    '185': '6ft 1in (185 cm)',
    '188': '6ft 2in (188 cm)',
    '190': '6ft 3in (190 cm)',
    '193': '6ft 4in (193 cm)',
    '195': '6ft 5in (195 cm)',
    '198': '6ft 6in (198 cm)',
    '201': '6ft 7in (201 cm)',
    '203': '6ft 8in (203 cm)',
    '206': '6ft 9in (206 cm)',
    '208': '6ft 10in (208 cm)',
    '211': '6ft 11in (211 cm)',
    '213': '7ft 0in (213 cm)',
  },
  OCCUPATIONS: {
    '1': 'Software Engineer / IT Professional',
    '2': 'Doctor / Medical Professional',
    '3': 'Teacher / Professor / Academician',
    '4': 'Business Owner / Entrepreneur',
    '5': 'Chartered Accountant / Finance',
    '6': 'Banker / Banking Professional',
    '7': 'Civil Engineer / Architect',
    '8': 'Mechanical / Electrical Engineer',
    '9': 'Government Employee / Officer',
    '10': 'Lawyer / Legal Professional',
    '11': 'Pharmacist / Healthcare Worker',
    '12': 'Marketing / Sales Professional',
    '13': 'HR / Admin Professional',
    '14': 'Consultant / Analyst',
    '15': 'Merchant Navy / Aviation',
    '16': 'Defence / Police Services',
    '17': 'Journalist / Media / Designer',
    '18': 'Islamic Scholar / Imam / Mufti',
    '19': 'Homemaker / Not Working',
    '20': 'Student',
    '21': 'Other',
    '22': 'Retired',
  },
  PARENT_OCCUPATIONS: {
    '1': 'Homemaker/Housewife',
    '2': 'Business/Self Employed',
    '3': 'Defence',
    '4': 'Civil Services',
    '5': 'Politician',
    '6': 'Social Workers',
    '7': 'Private Sector',
    '8': 'Government / PSU Sector',
    '9': 'Not Working',
    '10': 'Retired',
    '11': 'Passed Away',
  },
  FAMILY_TYPES: {
    '1': 'Joint Family',
    '2': 'Nuclear Family',
    '3': 'Extended Family',
  },
  FAMILY_STATUS: {
    '1': 'Middle Class',
    '2': 'Upper Middle Class',
    '3': 'Rich / Affluent',
    '4': 'Moderate',
  },
  NAMAZ_HABITS: {
    '1': 'Always (5 times daily)',
    '2': 'Regularly',
    '3': 'Sometimes / Friday Only',
    '4': 'During Ramadan Only',
    '5': 'Trying to improve',
  },
  QURAN_READING: {
    '1': 'Daily',
    '2': 'Weekly',
    '3': 'Occasionally',
    '4': 'During Ramadan',
    '5': 'Learned in childhood',
  },
  ROZA_HABITS: {
    '1': 'All Ramadan Rozas',
    '2': 'Most Rozas',
    '3': 'Sunnah Rozas also',
    '4': 'Only few due to health',
  },
  HIJAB_BEARD: {
    '1': 'Strict Hijab / Abaya',
    '2': 'Dupatta / Modest Dress',
    '3': 'Sunnah Beard',
    '4': 'Trimmed Beard',
    '5': 'Clean Shaved',
    '6': 'No',
  },
  ZAKAT_HABITS: {
    '1': 'Yes, pay regularly every year',
    '2': 'Not applicable yet',
    '3': 'Will start paying soon',
  },
  HAJJ_UMRAH: {
    '1': 'Performed Hajj & Umrah',
    '2': 'Performed Umrah',
    '3': 'Planning soon InshaAllah',
    '4': 'Not yet',
  },
  DIET_TYPES: {
    '1': 'Halal Meat & Veg (Non-Veg)',
    '2': 'Strictly Vegetarian',
    '3': 'Eggetarian',
  },
  SMOKE_HABITS: {
    '1': 'No, Never',
    '2': 'Occasionally',
    '3': 'Yes',
  },
  DRINK_HABITS: {
    '1': 'No, Strictly Never (Haram)',
    '2': 'Never',
  },
  COOKING_SKILLS: {
    '1': 'Yes, can cook well',
    '2': 'Basic cooking',
    '3': 'Learning to cook',
    '4': 'Cannot cook',
  },
  PHOTO_PRIVACY: {
    '1': 'All Members',
    '2': 'Connected / Accepted Members Only',
    '3': 'On Request Only',
  }
};

/**
 * Resolves a category and value into clean text, NEVER returning a bare number.
 */
export function resolveMasterText(category: string, rawVal: any, dynamicOptions?: Array<{ id?: any; value: string }>): string {
  if (rawVal === null || rawVal === undefined || rawVal === '') return '';
  const str = String(rawVal).trim();
  if (str === '' || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined' || str === '0') {
    return '';
  }

  // 1. If it's already human-readable text (not a bare number), return it!
  const isPureNumber = /^\d+$/.test(str);
  if (!isPureNumber) {
    return str;
  }

  const catKey = category.toUpperCase().trim();

  // 2. Check dynamically loaded options first
  if (dynamicOptions && Array.isArray(dynamicOptions) && dynamicOptions.length > 0) {
    const matched = dynamicOptions.find(o => String(o.id) === str);
    if (matched && matched.value && !/^\d+$/.test(matched.value)) {
      return matched.value;
    }
    const byVal = dynamicOptions.find(o => o.value.toLowerCase() === str.toLowerCase());
    if (byVal && byVal.value) {
      return byVal.value;
    }
  }

  // 3. Check fallback map
  const fallbackCat = FALLBACK_MASTERS[catKey] || 
                      FALLBACK_MASTERS[`${catKey}S`] || 
                      (catKey.endsWith('S') ? FALLBACK_MASTERS[catKey.slice(0, -1)] : undefined);

  if (fallbackCat && fallbackCat[str]) {
    return fallbackCat[str];
  }

  // 4. Try 1-based index into fallback map entries
  if (fallbackCat) {
    const values = Object.values(fallbackCat);
    const idx = Number(str) - 1;
    if (idx >= 0 && idx < values.length) {
      return values[idx];
    }
  }

  // NEVER return raw numeric ID like "1" or "14"
  return '';
}

/**
 * Resolves a comma-separated or array of IDs/strings into clean human-readable labels.
 * e.g. "1,2" for EDUCATIONS -> ["B.Tech / B.E.", "M.Tech / M.E."]
 */
export function resolveMultiMasterList(
  category: string, 
  rawVal: any, 
  dynamicOptions?: Array<{ id?: any; value: string }>
): string[] {
  if (rawVal === null || rawVal === undefined || rawVal === '') return [];
  
  let tokens: string[] = [];
  if (Array.isArray(rawVal)) {
    tokens = rawVal.map(v => String(v).trim()).filter(Boolean);
  } else if (typeof rawVal === 'string' || typeof rawVal === 'number') {
    tokens = String(rawVal).split(',').map(s => s.trim()).filter(Boolean);
  }
  
  const results: string[] = [];
  for (const token of tokens) {
    if (token === '0' || token.toLowerCase() === 'null' || token.toLowerCase() === 'undefined') continue;
    const resolved = resolveMasterText(category, token, dynamicOptions);
    if (resolved && resolved.trim().length > 0 && !/^\d+$/.test(resolved.trim())) {
      results.push(resolved.trim());
    } else if (!/^\d+$/.test(token) && token.trim().length > 0) {
      results.push(token.trim());
    }
  }
  return results;
}

/**
 * Formats partner height range professionally e.g. "4ft 6in (137 cm) - 6ft 10in (208 cm)"
 */
export function formatHeightPreference(minH: any, maxH: any): string | null {
  if (!minH && !maxH) return null;
  
  const formatSingle = (val: any) => {
    if (!val) return '';
    const num = parseFloat(String(val));
    if (isNaN(num) || num <= 0) return String(val);
    
    // Check if in centimeters (> 100 cm)
    if (num > 100) {
      const totalInches = Math.round(num / 2.54);
      const ft = Math.floor(totalInches / 12);
      const inch = totalInches % 12;
      return `${ft}ft ${inch}in (${Math.round(num)} cm)`;
    }
    
    // Decimal feet (e.g. 4.5, 6.8)
    const totalInches = Math.round(num * 12);
    const ft = Math.floor(totalInches / 12);
    const inch = totalInches % 12;
    const cm = Math.round(totalInches * 2.54);
    return `${ft}ft ${inch}in (${cm} cm)`;
  };

  const minFormatted = formatSingle(minH);
  const maxFormatted = formatSingle(maxH);

  if (minFormatted && maxFormatted) {
    if (minFormatted === maxFormatted) return minFormatted;
    return `${minFormatted} - ${maxFormatted}`;
  }
  if (minFormatted) return `Min ${minFormatted}`;
  if (maxFormatted) return `Up to ${maxFormatted}`;
  return null;
}

/**
 * Formats age range professionally e.g. "18 to 70 Years"
 */
export function formatAgePreference(minA: any, maxA: any): string | null {
  const min = Number(minA);
  const max = Number(maxA);
  if (min > 0 && max > 0) {
    if (min === max) return `${min} Years`;
    return `${min} to ${max} Years`;
  }
  if (min > 0) return `${min}+ Years`;
  if (max > 0) return `Up to ${max} Years`;
  return null;
}
