# scripts/ — 6-letter answer list generation

Everything here is **build-time only**. Nothing in this directory is imported by
`src/`, and none of it ships in the bundle. It exists to generate one file:
`wordle6-answers.json` in the repo root.

```
node scripts/build-wordle6-answers.mjs
```

Re-run that after editing the script or `wordle6.json`. It rewrites
`wordle6-answers.json` and the two review files.

## Why this exists

The 5-letter game has two word lists, and the split matters:

| file | role | size |
| --- | --- | --- |
| `words.json` | legal **guesses** | 12,484 |
| `wordle.json` | possible **answers** | 2,315 |

`wordle.json` is Wordle's real answer list — hand-curated, no `-s` plurals, and
biased toward words a normal person knows.

`wordle6.json` arrived as a single raw scraped list of 5,128 words with no such
curation, so it could not be used as an answer pool directly. Two separate
problems disqualified about a third of it, and they need different tools:

1. **Inflections** — `abbeys`, `abhors`, `actors`, `abates`. Real Wordle never
   uses `-s` plurals as answers. ~17% of the list.
2. **Non-words** — `fourty`, `doesnt`, `havent`, `allday`, `gocart`, `madeup`,
   `beenie`, `giveth`. No morphology rule can catch these.

So this script generates a filtered answer pool, and `wordle6.json` stays the
guess dictionary. Removed words are **still legal to type** — they just never
become the answer. Same shape as the 5-letter setup.

Current output:

```
guess dictionary   : 5128
  dropped -s       :  878
  dropped non-words:   74
  dropped by DENY  :   13
  obscure but kept :  135
answers written    : 4163
```

## Data files

| file | source | license |
| --- | --- | --- |
| `en_US.dic` / `en_US.aff` | [wooorm/dictionaries](https://github.com/wooorm/dictionaries/tree/main/dictionaries/en), Hunspell, SCOWL-derived | MIT AND BSD (`en_US-LICENSE.txt`) |
| `enable1.txt` | [dolph/dictionary](https://github.com/dolph/dictionary), ENABLE Scrabble lexicon, 172,823 words | public domain |

They total ~2.3 MB and are committed so regeneration works offline.

**Hunspell is not just a word list** — that's the whole reason it's here. It
stores *lemmas plus affix flags*: `abbey/MS` means "abbey" is the base form and
`abbeys` is *derived*. That lets inflections be identified structurally instead
of guessed at from suffixes.

## Decisions, and why

Read this section before changing the filter. Most of these were arrived at by
measurement, and several obvious-looking alternatives are already known to fail.

### The control check is load-bearing — don't remove it

The script runs its own plural rule against `wordle.json` (the known-good
5-letter answer list) and **exits non-zero if it flags anything**. Since that
list provably contains no plurals, any hit is a false positive.

This has already caught a real regression. Adding ENABLE as a stem source made
`chaos` register as the plural of `chao` — which ENABLE genuinely lists as a
valid Scrabble word. Without the control that would have shipped silently. The
fix was the `lemmas.has(word)` guard on the ENABLE fallback.

### `-s` only. Past tenses are deliberately kept

`EXCLUDE_PAST_TENSE` is `false`. Real Wordle **uses past tenses as answers** —
`tried`, `cried`, `dried`, `spied`, `freed` are all in `wordle.json`. Stripping
them would be stricter than Wordle, not equal to it. The detection code is kept
and still works; flip the flag to re-enable it (that removes ~582 more words).

### `-er` and `-ing` are not filtered

Tempting, but wrong on two counts:

- `wordle.json` contains 141 `-er` words (`baker`, `lover`, `boxer`, `finer`,
  `wiser`) and 23 `-ing` words (`doing`, `going`, `being`, `using`). Wordle
  clearly allows them.
- The `-er` rule is *inaccurate*. Measured against the control it produced 80
  hits, ~20% of them junk: `hyper`<`hype`, `after`<`aft`, `river`<`riv`,
  `super`<`sup`, `offer`<`off`, `meter`<`mete`. At 6 letters it would wrongly
  kill `barber`, `badger`, `beaker`.

By contrast the `-s` rule scores **0 false positives across all 2,315** control
words. The `-ss`/`-us`/`-is` guards do the heavy lifting there (`glass`,
`focus`, `basis`).

### Non-words: cross-check two dictionaries, never gate on one

A word is dropped only if it is in **neither** Hunspell **nor** ENABLE.

Gating on Hunspell alone would drop a further 135 words from the answer pool,
and a large share are perfectly good: `amidst`, `aviate`, `cypher`, `duffel`,
`furore`, `lustre`, `eponym`, `gelato`, `chakra`, `cabbie`. Requiring both
dictionaries to disagree isolates the actual junk — 74 words, almost all
contractions (`doesnt`, `theyre`), run-together compounds (`allday`, `pegleg`,
`tshirt`), misspellings (`fourty`, `sabath`), archaic verbs (`giveth`,
`taketh`), and slang (`schlub`, `wassup`).

### `MIN_STEM = 3`

Shorter stems produce nonsense matches — `chest`<`ch`, `bring`<`br`,
`quest`<`que`. Do not lower it.

### Doubled-consonant past tenses need a special case

Hunspell cannot *generate* `banned` from `ban`, so it lists `banned` as a bare
entry and `ban/SM` carries no `D` flag. A strictly flag-based rule misses this
whole class (`banned`, `padded`, `sagged`). Hence the `word.at(-3) ===
word.at(-4)` branch accepting any verb-ish flag on the undoubled stem. Currently
inert because past tenses are kept, but it's correct and tested.

### `ALLOW` and `DENY` are hand-curated. Keep them short

- `ALLOW` — real words postdating ENABLE (1997) that Hunspell also misses:
  `empath`, `hitman`, `sensei`.
- `DENY` — words ENABLE accepts that read as plain mistakes to a player
  (`ballon` for balloon, `spikey` for spiky) or are crude.

**Known dead end:** detecting the `DENY` class automatically via edit distance
does not work. When measured, a one-edit pass against the normal dictionary
flagged 122 of 148 candidates, including `amidst`→`midst`, `cypher`→`cipher`,
`dreamt`→`dream`, `behove`→`behoove`. Nearly every English word is one edit from
another. Don't rebuild this; extend the list by hand from
`enable-only-words.txt`.

## Review files (generated, safe to delete)

- `dropped-non-words.txt` — the 74 dropped as junk. Scan for false drops.
- `enable-only-words.txt` — the 135 words that are Scrabble-valid but absent
  from a normal spellcheck dictionary. **Not dropped**, on purpose: the 5-letter
  list carries the same kind of thing at 1.9% (`biome`, `briar`, `fibre`,
  `sheik`, `ovine`). Source for extending `DENY`.

## How close is it to the 5-letter list?

| metric | 5-letter | 6-letter |
| --- | --- | --- |
| in neither dictionary | 0.1% | 0.1% |
| Scrabble-only (obscurity proxy) | 1.9% | 3.2% |
| share of all real words that length | 35.8% | 42.1% |

**The remaining gap is commonness, not morphology, and no dictionary can close
it.** Wordle's 2,315 answers were chosen by a person for "would a normal player
know this." The 6-letter pool still carries weak-but-legal words, mostly `-er`
agent nouns (`amuser`, `lopper`, `tugger`, `pelter`). The only real fix is a
word-frequency list, which would be a new dependency and a new decision — ask
before adding one.

## Gotchas

- **Regenerating changes the daily answer.** The puzzle index is
  `daysSince(2026-01-01) % answers.length`, so any size change reshuffles every
  future day. In-progress saved games in `localStorage` (`wordle6-state`) would
  then be scored against a different solution. Clear that key after regenerating,
  or accept one bad day.
- **`wordle6-answers.json` is generated.** Don't hand-edit it — edit `ALLOW`,
  `DENY`, or the rules and re-run.
- **Answers must stay a subset of `wordle6.json`,** or a word could be the
  answer without being typeable.
