// ---------------------------------------------------------------------------
// Serbian Latin ↔ Cyrillic transliteration
// ---------------------------------------------------------------------------

const LATIN_TO_CYRILLIC: ReadonlyMap<string, string> = new Map([
  // Digraphs first (order matters for matching)
  ['Lj', 'Љ'], ['lj', 'љ'],
  ['Nj', 'Њ'], ['nj', 'њ'],
  ['Dž', 'Џ'], ['dž', 'џ'],
  ['DŽ', 'Џ'], ['LJ', 'Љ'], ['NJ', 'Њ'],
  // Single characters
  ['A', 'А'], ['a', 'а'],
  ['B', 'Б'], ['b', 'б'],
  ['V', 'В'], ['v', 'в'],
  ['G', 'Г'], ['g', 'г'],
  ['D', 'Д'], ['d', 'д'],
  ['Đ', 'Ђ'], ['đ', 'ђ'],
  ['E', 'Е'], ['e', 'е'],
  ['Ž', 'Ж'], ['ž', 'ж'],
  ['Z', 'З'], ['z', 'з'],
  ['I', 'И'], ['i', 'и'],
  ['J', 'Ј'], ['j', 'ј'],
  ['K', 'К'], ['k', 'к'],
  ['L', 'Л'], ['l', 'л'],
  ['M', 'М'], ['m', 'м'],
  ['N', 'Н'], ['n', 'н'],
  ['O', 'О'], ['o', 'о'],
  ['P', 'П'], ['p', 'п'],
  ['R', 'Р'], ['r', 'р'],
  ['S', 'С'], ['s', 'с'],
  ['T', 'Т'], ['t', 'т'],
  ['Ć', 'Ћ'], ['ć', 'ћ'],
  ['U', 'У'], ['u', 'у'],
  ['F', 'Ф'], ['f', 'ф'],
  ['H', 'Х'], ['h', 'х'],
  ['C', 'Ц'], ['c', 'ц'],
  ['Č', 'Ч'], ['č', 'ч'],
  ['Š', 'Ш'], ['š', 'ш'],
]);

const CYRILLIC_TO_LATIN: ReadonlyMap<string, string> = new Map([
  ['Љ', 'Lj'], ['љ', 'lj'],
  ['Њ', 'Nj'], ['њ', 'nj'],
  ['Џ', 'Dž'], ['џ', 'dž'],
  ['А', 'A'], ['а', 'a'],
  ['Б', 'B'], ['б', 'b'],
  ['В', 'V'], ['в', 'v'],
  ['Г', 'G'], ['г', 'g'],
  ['Д', 'D'], ['д', 'd'],
  ['Ђ', 'Đ'], ['ђ', 'đ'],
  ['Е', 'E'], ['е', 'e'],
  ['Ж', 'Ž'], ['ж', 'ž'],
  ['З', 'Z'], ['з', 'z'],
  ['И', 'I'], ['и', 'i'],
  ['Ј', 'J'], ['ј', 'j'],
  ['К', 'K'], ['к', 'k'],
  ['Л', 'L'], ['л', 'l'],
  ['М', 'M'], ['м', 'm'],
  ['Н', 'N'], ['н', 'n'],
  ['О', 'O'], ['о', 'o'],
  ['П', 'P'], ['п', 'p'],
  ['Р', 'R'], ['р', 'r'],
  ['С', 'S'], ['с', 's'],
  ['Т', 'T'], ['т', 't'],
  ['Ћ', 'Ć'], ['ћ', 'ć'],
  ['У', 'U'], ['у', 'u'],
  ['Ф', 'F'], ['ф', 'f'],
  ['Х', 'H'], ['х', 'h'],
  ['Ц', 'C'], ['ц', 'c'],
  ['Ч', 'Č'], ['ч', 'č'],
  ['Ш', 'Š'], ['ш', 'š'],
]);

/** Digraph prefixes that need two-character lookahead */
const DIGRAPH_STARTS = new Set(['L', 'l', 'N', 'n', 'D', 'd']);

/**
 * Convert Serbian Latin text to Serbian Cyrillic.
 *
 * Handles digraphs (lj → љ, nj → њ, dž → џ) correctly.
 */
export function latinToCyrillic(text: string): string {
  let result = '';
  let i = 0;

  while (i < text.length) {
    if (i + 1 < text.length && DIGRAPH_STARTS.has(text[i])) {
      const digraph = text.slice(i, i + 2);
      const mapped = LATIN_TO_CYRILLIC.get(digraph);
      if (mapped) {
        result += mapped;
        i += 2;
        continue;
      }
    }

    const mapped = LATIN_TO_CYRILLIC.get(text[i]);
    result += mapped ?? text[i];
    i++;
  }

  return result;
}

/**
 * Convert Serbian Cyrillic text to Serbian Latin.
 */
export function cyrillicToLatin(text: string): string {
  let result = '';
  for (const char of text) {
    result += CYRILLIC_TO_LATIN.get(char) ?? char;
  }
  return result;
}

/**
 * Detect whether the text is predominantly Cyrillic.
 *
 * Returns true if more than half of the alphabetic characters
 * are in the Cyrillic Unicode block.
 */
export function isCyrillic(text: string): boolean {
  let cyrillic = 0;
  let latin = 0;
  for (const char of text) {
    const code = char.codePointAt(0)!;
    if (code >= 0x0400 && code <= 0x04FF) cyrillic++;
    else if ((code >= 0x0041 && code <= 0x005A) || (code >= 0x0061 && code <= 0x007A)) latin++;
  }
  return cyrillic > latin;
}
