/**
 * Generates wordle6-answers.json — the pool of possible 6-letter answers.
 *
 * wordle6.json is a raw scraped list. Two separate problems disqualify much of
 * it as answer material, and they need different tools:
 *
 *   1. Plurals / 3rd-person forms (~17%): abbeys, abhors, actors. Real Wordle
 *      never uses these as answers. Detected with the Hunspell en_US dictionary,
 *      which stores lemmas plus affix flags ("abbey/MS" => abbeys is derived,
 *      not a lemma). Suffix-guessing alone is far too noisy — the control check
 *      below exists to prove that.
 *
 *      Past tenses are deliberately KEPT, because real Wordle uses them (tried,
 *      cried, dried are all answers). See EXCLUDE_PAST_TENSE.
 *
 *   2. Non-words: fourty, doesnt, allday, gocart, madeup, beenie. No morphology
 *      rule can catch these. Dropped by cross-checking two dictionaries and
 *      removing only what appears in NEITHER — gating on one alone would take
 *      out legitimate words the other happens to list (amidst, gelato, empath).
 *
 * The full wordle6.json remains the *guess* dictionary; removed words are still
 * legal to type, they just never become the answer. That mirrors the 5-letter
 * setup (words.json = guesses, wordle.json = answers).
 *
 * Usage: node scripts/build-wordle6-answers.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const readLines = (p) => fs.readFileSync(path.join(here, p), 'utf8').split('\n');

/* ---------- Hunspell affix rules ---------- */
const SFX = {}, PFX = {};
const affLines = readLines('en_US.aff');
for (let i = 0; i < affLines.length; i++) {
    const m = affLines[i].match(/^(SFX|PFX) (\S+) (Y|N) (\d+)/);
    if (!m) continue;
    const kind = m[1], flag = m[2], count = Number(m[4]);
    const target = kind === 'SFX' ? SFX : PFX;
    target[flag] = [];
    for (let j = 1; j <= count; j++) {
        const parts = (affLines[i + j] || '').trim().split(/\s+/);
        if (parts[0] !== kind) continue;
        target[flag].push({
            strip: parts[2] === '0' ? '' : parts[2],
            add: parts[3] === '0' ? '' : parts[3],
            cond: parts[4] || '.',
        });
    }
}

/* ---------- Hunspell lemmas + every form they generate ---------- */
const lemmas = new Map();   // lemma -> affix flags
const hunspell = new Set(); // every valid form, lemmas and derivations alike

const matches = (re, word) => {
    try { return new RegExp(re).test(word); } catch { return true; }
};

for (const line of readLines('en_US.dic').slice(1)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split('/');
    const word = parts[0].split(/\s/)[0].toLowerCase();
    const flagPart = parts[1] || '';
    if (!/^[a-z]+$/.test(word)) continue; // skip proper nouns / apostrophes

    if (!lemmas.has(word)) lemmas.set(word, new Set());
    for (const flag of flagPart) lemmas.get(word).add(flag);
    hunspell.add(word);

    const suffixed = [word];
    for (const flag of flagPart) for (const rule of SFX[flag] || []) {
        if (rule.strip && !word.endsWith(rule.strip)) continue;
        if (!matches(rule.cond + '$', word)) continue;
        const form = ((rule.strip ? word.slice(0, -rule.strip.length) : word) + rule.add).toLowerCase();
        hunspell.add(form);
        suffixed.push(form);
    }
    for (const flag of flagPart) for (const rule of PFX[flag] || []) {
        for (const base of suffixed) {
            if (rule.strip && !base.startsWith(rule.strip)) continue;
            if (!matches('^' + rule.cond, base)) continue;
            hunspell.add((rule.add + base.slice(rule.strip.length)).toLowerCase());
        }
    }
}

/* ---------- ENABLE Scrabble lexicon (public domain) ---------- */
const enable = new Set(readLines('enable1.txt').map((w) => w.trim().toLowerCase()).filter(Boolean));

// Real words that postdate ENABLE (1997) and that Hunspell also happens to miss.
// Reviewed by hand from scripts/dropped-non-words.txt — keep this list short.
const ALLOW = new Set(['empath', 'hitman', 'sensei']);

// ENABLE is a Scrabble lexicon, so it admits spelling variants that read as plain
// mistakes to a player ("ballon" for balloon, "spikey" for spiky) plus some crude
// slang. There is no reliable way to detect these automatically — an edit-distance
// pass flags 122 of the 148 ENABLE-only words, including amidst, cypher and dreamt
// — so they are listed by hand. Reviewed from scripts/enable-only-words.txt.
const DENY = new Set([
    'ballon', 'gimmie', 'weiner', 'whiney', 'spikey', 'mousey', 'stoney',
    'looney', 'whacko', 'shmuck', 'tictac', 'tittie', 'badass',
]);

/* ---------- Inflection detection ---------- */
// S = plural/3rd-person, D = -ed, G = -ing
const licenses = (stem, ...flags) => lemmas.has(stem) && flags.some((f) => lemmas.get(stem).has(f));

// ENABLE carries no affix data, so it can only confirm a stem is a real word.
// Used for the -s rule only: that rule scores 0 false positives on the control
// even without flags, because the -ss/-us/-is guards do the heavy lifting. It
// recovers plurals whose singular Hunspell lacks (bacons, glyphs, mangos).
const isRealWord = (stem) => enable.has(stem) || hunspell.has(stem);

const MIN_STEM = 3; // shorter stems produce nonsense matches (chest<ch, bring<br)

// Real Wordle excludes -s plurals absolutely, but DOES use past tenses as answers
// (tried, cried, dried, spied, freed are all in wordle.json). Matching that means
// leaving -ed forms in. Flip to true to also strip them — the detection below is
// kept and tested either way.
const EXCLUDE_PAST_TENSE = false;

const inflectionOf = (word) => {
    const candidates = [];
    const add = (stem, ...flags) => {
        if (stem.length >= MIN_STEM && stem !== word) candidates.push([stem, flags]);
    };

    // -s plural / 3rd-person. Never treat -ss/-us/-is as a plural marker.
    if (word.endsWith('ies')) add(word.slice(0, -3) + 'y', 'S');
    if (word.endsWith('es')) { add(word.slice(0, -2), 'S'); add(word.slice(0, -1), 'S'); }
    if (word.endsWith('s') && !/(ss|us|is)$/.test(word)) add(word.slice(0, -1), 'S');

    // -ed past tense
    if (EXCLUDE_PAST_TENSE && word.endsWith('ied')) add(word.slice(0, -3) + 'y', 'D');
    if (EXCLUDE_PAST_TENSE && word.endsWith('ed')) {
        add(word.slice(0, -1), 'D');  // abate + d
        add(word.slice(0, -2), 'D');  // want + ed
        // Doubled consonant (ban -> banned). Hunspell can't generate these, so it
        // lists them as bare entries and the lemma carries no D flag — accept any
        // verb-ish flag on the undoubled stem instead.
        if (word.at(-3) === word.at(-4)) add(word.slice(0, -3), 'D', 'S', 'G');
    }

    for (const c of candidates) if (licenses(c[0], ...c[1])) return c[0];

    // Second chance for plurals whose singular Hunspell doesn't know. Skipped when
    // Hunspell lists the word as a lemma itself — ENABLE is a Scrabble lexicon full
    // of obscure short words that make convincing bogus stems (chaos < "chao").
    if (!lemmas.has(word)) {
        for (const c of candidates) if (c[1][0] === 'S' && isRealWord(c[0])) return c[0];
    }
    return null;
};

/* ---------- Control: the 5-letter answer list is known-good ---------- */
const control = readJson('wordle.json').map((w) => w.toLowerCase());
const controlPlurals = control.filter((w) => w.endsWith('s') && inflectionOf(w));
if (controlPlurals.length) {
    console.error('Plural rule regressed on the 5-letter control:', controlPlurals.join(' '));
    process.exit(1);
}

/* ---------- Build ---------- */
const all = readJson('wordle6.json').map((w) => w.toLowerCase());
const answers = [];
const dropped = { s: [], ed: [], notAWord: [], denied: [] };
// Scrabble-valid but absent from a normal spellcheck dictionary. NOT dropped —
// the 5-letter list carries 1.9% of these (biome, briar, sheik) — but written out
// so the DENY list above can be revisited.
const enableOnly = [];

for (const word of all) {
    const stem = inflectionOf(word);
    if (stem) {
        (word.endsWith('ed') ? dropped.ed : dropped.s).push(word + '<' + stem);
        continue;
    }
    if (DENY.has(word)) { dropped.denied.push(word); continue; }
    if (!hunspell.has(word) && !enable.has(word) && !ALLOW.has(word)) {
        dropped.notAWord.push(word);
        continue;
    }
    if (!hunspell.has(word) && enable.has(word)) enableOnly.push(word);
    answers.push(word);
}

fs.writeFileSync(
    path.join(root, 'wordle6-answers.json'),
    '[\n' + answers.map((w) => '  "' + w.toUpperCase() + '"').join(',\n') + '\n]\n'
);
fs.writeFileSync(path.join(here, 'dropped-non-words.txt'), dropped.notAWord.join('\n') + '\n');
fs.writeFileSync(path.join(here, 'enable-only-words.txt'), enableOnly.join('\n') + '\n');

const show = (a, n) => a.slice(0, n).join(', ');
console.log('guess dictionary   : ' + all.length);
console.log('  dropped -s       : ' + String(dropped.s.length).padStart(4) + '   ' + show(dropped.s, 6));
console.log('  dropped -ed      : ' + String(dropped.ed.length).padStart(4) + '   ' + show(dropped.ed, 6));
console.log('  dropped non-words: ' + String(dropped.notAWord.length).padStart(4) + '   ' + show(dropped.notAWord, 10));
console.log('  dropped by DENY  : ' + String(dropped.denied.length).padStart(4) + '   ' + show(dropped.denied, 13));
console.log('  obscure but kept : ' + String(enableOnly.length).padStart(4) + '   (Scrabble-valid only; 5-letter list runs 1.9%)');
console.log('answers written    : ' + answers.length + '  -> wordle6-answers.json');
console.log('control            : 0 plural false positives on ' + control.length + ' known answers');
console.log('review files       -> scripts/dropped-non-words.txt, scripts/enable-only-words.txt');
