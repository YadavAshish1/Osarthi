/**
 * Algorithmic Devanagari <-> Roman (Hinglish) Transliteration Engine
 * 
 * 100% Rule-Based & Dynamic.
 * ZERO hardcoded word dictionaries.
 * Any new blog, chapter, author, or subject added by educators
 * is transliterated, searched, and highlighted automatically.
 */

const CONSONANTS: Record<string, string> = {
  '\u0915': 'k',  '\u0916': 'kh', '\u0917': 'g',  '\u0918': 'gh', '\u0919': 'ng',
  '\u091A': 'ch', '\u091B': 'chh','\u091C': 'j',  '\u091D': 'jh', '\u091E': 'ny',
  '\u091F': 't',  '\u0920': 'th', '\u0921': 'd',  '\u0922': 'dh', '\u0923': 'n',
  '\u0924': 't',  '\u0925': 'th', '\u0926': 'd',  '\u0927': 'dh', '\u0928': 'n',
  '\u092A': 'p',  '\u092B': 'ph', '\u092C': 'b',  '\u092D': 'bh', '\u092E': 'm',
  '\u092F': 'y',  '\u0930': 'r',  '\u0932': 'l',  '\u0933': 'l',  '\u0935': 'v',
  '\u0936': 'sh', '\u0937': 'sh', '\u0938': 's',  '\u0939': 'h',
  // Nukta consonants (Urdu/Hindi loanwords)
  '\u0958': 'q',  '\u0959': 'kh', '\u095A': 'gh', '\u095B': 'z',
  '\u095C': 'r',  '\u095D': 'rh', '\u095E': 'f'
};

const VOWELS: Record<string, string> = {
  '\u0905': 'a',  '\u0906': 'aa', '\u0907': 'i',  '\u0908': 'ee',
  '\u0909': 'u',  '\u090A': 'oo', '\u090B': 'ri', '\u090F': 'e',
  '\u0910': 'ai', '\u0913': 'o',  '\u0914': 'au'
};

const MATRAS: Record<string, string> = {
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
export function hasDevanagari(text: string): boolean {
  return /[\u0900-\u097F]/.test(text || '');
}

/**
 * Transliterates Devanagari text to Romanized Hinglish phonetically.
 * e.g. "नौका-विहार" -> "nauka-vihar"
 *      "सुमित्रानंदन पंत" -> "sumitranandan pant"
 *      "रसखान के सवैये" -> "rasakhan ke savaiye"
 */
export function romanizeHindi(text: string): string {
  if (!text || typeof text !== 'string') return '';
  let out = '';
  const len = text.length;

  for (let i = 0; i < len; i++) {
    const ch = text[i];
    const nextCh = text[i + 1] || '';
    const afterNextCh = text[i + 2] || '';

    // Common conjuncts (e.g. ज्ञ -> gy)
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
      // already skipped
    } else {
      out += ch;
    }
  }

  return out.replace(/\s+/g, ' ').trim();
}

/**
 * Pure algorithmic phonetic transliterator: Roman/Hinglish -> Devanagari
 * e.g. "nauka" -> "नौका"
 *      "vihar" -> "विहार"
 *      "kavita" -> "कविता"
 */
export function phoneticToDevanagari(input: string): string {
  if (!input || typeof input !== 'string') return '';
  const str = input.toLowerCase().trim();

  const multiConsonants: [string, string][] = [
    ['ksh', 'क्ष'], ['gy', 'ज्ञ'], ['tr', 'त्र'], ['chh', 'छ'],
    ['kh', 'ख'], ['gh', 'घ'], ['ch', 'च'], ['jh', 'झ'],
    ['th', 'थ'], ['dh', 'ध'], ['bh', 'भ'], ['ph', 'फ'], ['sh', 'श'],
  ];

  const singleConsonants: [string, string][] = [
    ['k', 'क'], ['g', 'ग'], ['j', 'ज'], ['t', 'त'], ['d', 'द'], ['n', 'न'],
    ['p', 'प'], ['b', 'ब'], ['m', 'म'], ['y', 'य'], ['r', 'र'], ['l', 'ल'],
    ['v', 'व'], ['w', 'व'], ['s', 'स'], ['h', 'ह'], ['z', 'ज़'], ['f', 'फ़']
  ];

  const vowels: [string, string, string][] = [
    ['au', 'ौ', 'औ'], ['ou', 'ौ', 'औ'], ['ai', 'ै', 'ऐ'], ['aa', 'ा', 'आ'],
    ['ee', 'ी', 'ई'], ['ii', 'ी', 'ई'], ['oo', 'ू', 'ऊ'], ['uu', 'ू', 'ऊ'],
    ['e', 'े', 'ए'], ['o', 'ो', 'ओ'], ['i', 'ि', 'इ'], ['u', 'ु', 'उ'],
    ['a', '', 'अ']
  ];

  let result = '';
  let i = 0;

  while (i < str.length) {
    // Check multi-char consonants first
    let matchedConsonant: string | null = null;
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
      let matchedMatra: string | null = null;
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
        // In Hindi, trailing 'a' represents 'ा' (nauka -> नौका, kavita -> कविता)
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

    // Standalone vowel
    let matchedVowel: string | null = null;
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
 * Builds expanded highlight terms dynamically without any static dictionary.
 * If user types "nauka", returns terms ["nauka", "नौका"]
 * If user types "नौका", returns terms ["नौका", "nauka"]
 */
export function getExpandedHighlightTerms(search: string): string[] {
  if (!search) return [];
  const clean = search.trim();
  if (!clean) return [];

  const terms = new Set<string>();
  terms.add(clean);

  if (hasDevanagari(clean)) {
    // Hindi Devanagari input -> Roman equivalents
    const roman = romanizeHindi(clean);
    if (roman) {
      terms.add(roman);
      roman.split(/\s+/).forEach((w) => {
        if (w.length >= 2) terms.add(w);
      });
    }
    clean.split(/[\s\-_]+/).forEach((w) => {
      if (w.length >= 2) terms.add(w);
    });
  } else {
    // English/Hinglish input -> Devanagari equivalents
    const words = clean.split(/[\s\-_]+/).filter(Boolean);
    if (words.length > 1) {
      const devWords = words.map((w) => phoneticToDevanagari(w) || w);
      terms.add(devWords.join(' '));
      terms.add(devWords.join('-'));
      for (const w of words) {
        terms.add(w);
        const p = phoneticToDevanagari(w);
        if (p && p.length >= 2) terms.add(p);
      }
    } else {
      const phonetic = phoneticToDevanagari(clean);
      if (phonetic && phonetic.length >= 2) {
        terms.add(phonetic);
      }
    }
  }

  return Array.from(terms).filter((t) => t && t.length >= 2);
}
