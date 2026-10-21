import { escapeRegex } from './sanitize.js';

/**
 * Pure Algorithmic Devanagari <-> Roman (Hinglish) Engine
 * 
 * 100% Rule-Based & Dynamic.
 * ZERO hardcoded word dictionaries.
 * Any new blog, chapter, author, or subject added by teachers
 * is transliterated and searched automatically.
 */

// Devanagari Unicode mappings
const CONSONANTS = {
  '\u0915': 'k',  '\u0916': 'kh', '\u0917': 'g',  '\u0918': 'gh', '\u0919': 'ng',
  '\u091A': 'ch', '\u091B': 'chh','\u091C': 'j',  '\u091D': 'jh', '\u091E': 'ny',
  '\u091F': 't',  '\u0920': 'th', '\u0921': 'd',  '\u0922': 'dh', '\u0923': 'n',
  '\u0924': 't',  '\u0925': 'th', '\u0926': 'd',  '\u0927': 'dh', '\u0928': 'n',
  '\u092A': 'p',  '\u092B': 'ph', '\u092C': 'b',  '\u092D': 'bh', '\u092E': 'm',
  '\u092F': 'y',  '\u0930': 'r',  '\u0932': 'l',  '\u0933': 'l',  '\u0935': 'v',
  '\u0936': 'sh', '\u0937': 'sh', '\u0938': 's',  '\u0939': 'h',
  // Nukta consonants
  '\u0958': 'q',  '\u0959': 'kh', '\u095A': 'gh', '\u095B': 'z',
  '\u095C': 'r',  '\u095D': 'rh', '\u095E': 'f'
};

const VOWELS = {
  '\u0905': 'a',  '\u0906': 'aa', '\u0907': 'i',  '\u0908': 'ee',
  '\u0909': 'u',  '\u090A': 'oo', '\u090B': 'ri', '\u090F': 'e',
  '\u0910': 'ai', '\u0913': 'o',  '\u0914': 'au'
};

const MATRAS = {
  '\u093E': 'a',  '\u093F': 'i',  '\u0940': 'i',  '\u0941': 'u',
  '\u0942': 'u',  '\u0943': 'ri', '\u0947': 'e',  '\u0948': 'ai',
  '\u094B': 'o',  '\u094C': 'au'
};

const VIRAMA = '\u094D';
const ANUSVARA = '\u0902';
const CHANDRABINDU = '\u0901';
const VISARGA = '\u0903';

/**
 * Checks if a string contains any Devanagari characters
 */
export function isDevanagari(text) {
  return /[\u0900-\u097F]/.test(text || '');
}

/**
 * Pure Algorithmic Devanagari to Roman (Hinglish) Transliteration
 * e.g. "नौका-विहार" -> "nauka-vihar"
 *      "सुमित्रानंदन पंत" -> "sumitranandan pant"
 */
export function devanagariToRoman(text) {
  if (!text || typeof text !== 'string') return '';
  let out = '';
  const len = text.length;

  for (let i = 0; i < len; i++) {
    const ch = text[i];
    const nextCh = text[i + 1] || '';
    const afterNextCh = text[i + 2] || '';

    // Conjunct ज्ञ -> gy
    if (ch === '\u091C' && nextCh === VIRAMA && afterNextCh === '\u091E') {
      out += 'gy';
      i += 2;
      continue;
    }

    if (CONSONANTS[ch]) {
      out += CONSONANTS[ch];
      if (nextCh === VIRAMA) {
        i++;
      } else if (MATRAS[nextCh]) {
        out += MATRAS[nextCh];
        i++;
        if (text[i + 1] === ANUSVARA || text[i + 1] === CHANDRABINDU) {
          out += 'n';
          i++;
        }
      } else if (nextCh === ANUSVARA || nextCh === CHANDRABINDU) {
        out += 'an';
        i++;
      } else if (nextCh === VISARGA) {
        out += 'ah';
        i++;
      } else {
        const isEndOfWord = !nextCh || /[\s\-_,.:;!?/()\[\]]/.test(nextCh);
        if (!isEndOfWord) {
          out += 'a';
        }
      }
    } else if (VOWELS[ch]) {
      out += VOWELS[ch];
      if (nextCh === ANUSVARA || nextCh === CHANDRABINDU) {
        out += 'n';
        i++;
      }
    } else if (MATRAS[ch]) {
      out += MATRAS[ch];
    } else if (ch === ANUSVARA || ch === CHANDRABINDU) {
      out += 'n';
    } else if (ch === VISARGA) {
      out += 'h';
    } else if (ch === VIRAMA) {
      // already handled
    } else {
      out += ch;
    }
  }

  return out.replace(/\s+/g, ' ').trim();
}

/**
 * Converts a Romanized/Hinglish word into an algorithmic Devanagari regex pattern.
 * Supports phonetic nuances:
 * - 'au' / 'o' -> (?:ौ|ो|औ|ओ)
 * - 'v' / 'w' / 'b' -> (?:व|ब)
 * - 'i' / 'ee' -> (?:ि|ी|इ|ई)
 * - 'a' -> (?:ा|आ|) (can be long matra or inherent vowel)
 * - 'an' before consonant -> (?:ं|न|ण|ान)
 * e.g. "nauka" -> matches "नौका", "नौका-विहार"
 *      "vihar" -> matches "विहार"
 *      "pant"  -> matches "पंत"
 */
export function romanWordToDevanagariPattern(word) {
  if (!word || typeof word !== 'string') return '';
  let str = word.toLowerCase().trim();

  // Handle 'an' before consonants (e.g. pant -> पंत, nandan -> नंदन)
  str = str.replace(/an(?=[kgjtdnpbmyrvlswhczf])/gi, '@@anusvara@@');

  const phoneticMap = [
    // Multi consonants
    ['ksh', '(?:क्ष)'],
    ['gya', '(?:ज्ञा|ज्ञ)'],
    ['gy', '(?:ज्ञ)'],
    ['tra', '(?:त्रा|त्र)'],
    ['tr', '(?:त्र)'],
    ['sh', '(?:श|ष)'],
    ['chh', '(?:छ)'],
    ['ch', '(?:च)'],
    ['kh', '(?:ख)'],
    ['gh', '(?:घ)'],
    ['jh', '(?:झ)'],
    ['th', '(?:थ|ठ)'],
    ['dh', '(?:ध|ढ)'],
    ['bh', '(?:भ)'],
    ['ph', '(?:फ)'],
    ['@@anusvara@@', '(?:ं|न|ण|ान)'],

    // Single consonants
    ['k', '(?:क)'],
    ['g', '(?:ग)'],
    ['j', '(?:ज)'],
    ['t', '(?:त|ट)'],
    ['d', '(?:द|ड)'],
    ['n', '(?:न|ण)'],
    ['p', '(?:प)'],
    ['b', '(?:ब)'],
    ['m', '(?:म)'],
    ['y', '(?:य)'],
    ['r', '(?:र|ड़)'],
    ['l', '(?:ल)'],
    ['v', '(?:व|ब)'],
    ['w', '(?:व|ब)'],
    ['s', '(?:स|श)'],
    ['h', '(?:ह)'],
    ['z', '(?:ज़|ज)'],
    ['f', '(?:फ़|फ)'],

    // Vowels & Matras
    ['au', '(?:ौ|औ|ो)'],
    ['ou', '(?:ौ|औ|ो)'],
    ['ai', '(?:ै|ऐ)'],
    ['aa', '(?:ा|आ)'],
    ['ee', '(?:ी|ई)'],
    ['oo', '(?:ू|ऊ)'],
    ['e', '(?:े|ए)'],
    ['o', '(?:ो|ओ|ौ)'],
    ['i', '(?:ि|ी|इ|ई)'],
    ['u', '(?:ु|ू|उ|ऊ)'],
    ['a', '(?:ा|आ|)']
  ];

  let pattern = '';
  let i = 0;
  while (i < str.length) {
    let matched = false;
    for (const [rom, devPattern] of phoneticMap) {
      if (str.startsWith(rom, i)) {
        pattern += devPattern;
        i += rom.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      pattern += escapeRegex(str[i]);
      i++;
    }
  }

  return pattern;
}

/**
 * Builds a phonetic Devanagari string from a Roman/Hinglish token
 */
export function phoneticTransliterate(input) {
  if (!input || typeof input !== 'string') return '';
  const str = input.toLowerCase().trim();

  const multiConsonants = [
    ['ksh', 'क्ष'], ['gy', 'ज्ञ'], ['tr', 'त्र'], ['chh', 'छ'],
    ['kh', 'ख'], ['gh', 'घ'], ['ch', 'च'], ['jh', 'झ'],
    ['th', 'थ'], ['dh', 'ध'], ['bh', 'भ'], ['ph', 'फ'], ['sh', 'श'],
  ];

  const singleConsonants = [
    ['k', 'क'], ['g', 'ग'], ['j', 'ज'], ['t', 'त'], ['d', 'द'], ['n', 'न'],
    ['p', 'प'], ['b', 'ब'], ['m', 'म'], ['y', 'य'], ['r', 'र'], ['l', 'ल'],
    ['v', 'व'], ['w', 'व'], ['s', 'स'], ['h', 'ह'], ['z', 'ज़'], ['f', 'फ़']
  ];

  const vowels = [
    ['au', 'ौ', 'औ'], ['ou', 'ौ', 'औ'], ['ai', 'ै', 'ऐ'], ['aa', 'ा', 'आ'],
    ['ee', 'ी', 'ई'], ['ii', 'ी', 'ई'], ['oo', 'ू', 'ऊ'], ['uu', 'ू', 'ऊ'],
    ['e', 'े', 'ए'], ['o', 'ो', 'ओ'], ['i', 'ि', 'इ'], ['u', 'ु', 'उ'],
    ['a', '', 'अ']
  ];

  let result = '';
  let i = 0;

  while (i < str.length) {
    let matchedConsonant = null;
    let consLen = 0;
    for (const [rom, dev] of multiConsonants) {
      if (str.startsWith(rom, i)) {
        matchedConsonant = dev;
        consLen = rom.length;
        break;
      }
    }
    if (!matchedConsonant) {
      for (const [rom, dev] of singleConsonants) {
        if (str.startsWith(rom, i)) {
          matchedConsonant = dev;
          consLen = rom.length;
          break;
        }
      }
    }

    if (matchedConsonant) {
      i += consLen;
      let matchedMatra = null;
      let vowelLen = 0;
      for (const [rom, matra] of vowels) {
        if (str.startsWith(rom, i)) {
          matchedMatra = matra;
          vowelLen = rom.length;
          break;
        }
      }

      if (matchedMatra !== null) {
        i += vowelLen;
        if (matchedMatra === '' && (i >= str.length || !str[i].match(/[a-z]/i))) {
          result += matchedConsonant + 'ा';
        } else {
          result += matchedConsonant + matchedMatra;
        }
      } else {
        result += matchedConsonant;
      }
      continue;
    }

    let matchedVowel = null;
    let vowelLen = 0;
    for (const [rom, , independent] of vowels) {
      if (str.startsWith(rom, i)) {
        matchedVowel = independent;
        vowelLen = rom.length;
        break;
      }
    }
    if (matchedVowel) {
      result += matchedVowel;
      i += vowelLen;
      continue;
    }

    result += str[i];
    i++;
  }

  return result;
}

/**
 * Expands search query into multiple script variations dynamically:
 * e.g. "nauka" -> ["nauka", "नौका"]
 *      "nauka vihar" -> ["nauka vihar", "नौका विहार", "नौका-विहार"]
 *      "नौका-विहार" -> ["नौका-विहार", "नौका विहार", "nauka vihar", "nauka-vihar"]
 */
export function expandSearchVariants(query) {
  if (!query || typeof query !== 'string') return [];
  const clean = query.trim();
  if (!clean) return [];

  const variants = new Set();
  variants.add(clean);

  if (isDevanagari(clean)) {
    // Input is Devanagari -> generate Roman/Hinglish equivalents dynamically
    const roman = devanagariToRoman(clean);
    if (roman) {
      variants.add(roman);
      variants.add(roman.replace(/[\s\-_]+/g, ' '));
      variants.add(roman.replace(/[\s\-_]+/g, '-'));
    }
    // Also add space vs hyphen variations in Devanagari
    variants.add(clean.replace(/[\s\-_]+/g, ' '));
    variants.add(clean.replace(/[\s\-_]+/g, '-'));
  } else {
    // Input is Roman / Hinglish -> generate Devanagari equivalents dynamically
    const words = clean.split(/[\s\-_\/]+/).filter(Boolean);
    if (words.length > 1) {
      const transliteratedWords = words.map((w) => phoneticTransliterate(w) || w);
      variants.add(transliteratedWords.join(' '));
      variants.add(transliteratedWords.join('-'));
      for (const w of words) {
        const p = phoneticTransliterate(w);
        if (p && p !== w) variants.add(p);
      }
    } else {
      const phonetic = phoneticTransliterate(clean);
      if (phonetic && phonetic !== clean) {
        variants.add(phonetic);
      }
    }
  }

  return Array.from(variants).filter((v) => v && v.length >= 2);
}

/**
 * Builds a single MongoDB regex matching any expanded query variant
 * including phonetic regex patterns for Hinglish input.
 */
export function buildSearchRegex(query) {
  if (!query || typeof query !== 'string') return new RegExp('', 'i');
  const clean = query.trim();
  if (!clean) return new RegExp('', 'i');

  const parts = [];

  // 1. Literal expanded variants
  const variants = expandSearchVariants(clean);
  for (const v of variants) {
    parts.push(escapeRegex(v));
  }

  // 2. If Roman input, add phonetic regex pattern for flexible matching
  if (!isDevanagari(clean)) {
    const words = clean.split(/[\s\-_\/]+/).filter(Boolean);
    if (words.length > 0) {
      const wordPatterns = words.map(romanWordToDevanagariPattern);
      // Words separated by optional spaces or hyphens
      const joinedPattern = wordPatterns.join('[\\s\\-_]*');
      if (joinedPattern) {
        parts.push(joinedPattern);
      }
    }
  }

  return new RegExp(`(?:${parts.join('|')})`, 'i');
}
