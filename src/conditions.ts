/**
 * Turning what a caller says into a CCSR condition category.
 *
 * MEPS codes conditions as CCSR categories — END010, MBD002 — and nobody asks
 * a question in those terms. An agent asks "what do people take for high
 * cholesterol". Without this the pack answers zero rows to almost every real
 * question, which reads as "we have no data" rather than "you used the wrong
 * vocabulary".
 *
 * Two layers: these hand-written synonyms for the way people actually speak,
 * then a trigram match against the official CCSR labels for everything else.
 */

/** Everyday phrasing -> CCSR categories. Several codes where the plain word
 *  genuinely spans them: "diabetes" is END002 and END003, and returning only
 *  one of them would quietly halve the answer. */
export const CONDITION_SYNONYMS: Record<string, string[]> = {
  // EVERY code below was checked against the HCUP CCSR reference file, because
  // a first pass written from memory got roughly a dozen of them wrong in a way
  // no test would catch: "epilepsy" pointed at cerebral palsy, "psoriasis" at
  // pressure ulcer, "hypothyroidism" at diabetes. Each would have returned a
  // confident, plausible, wrong list of drugs. If you add a synonym, look the
  // code up — do not recall it.
  'high cholesterol': ['END010'],
  cholesterol: ['END010'],
  hyperlipidemia: ['END010'],
  'lipid disorder': ['END010'],
  // END004/005/006 are diabetes categories too, but MEPS does not use them:
  // in the 2024 file every diabetes person sits in END002 or END003. Including
  // the unused codes would only widen the query, but naming them here would
  // imply a coverage that is not in the data.
  diabetes: ['END002', 'END003'],
  'type 2 diabetes': ['END002', 'END003'],
  'blood sugar': ['END002', 'END003'],
  obesity: ['END009'],
  'weight loss': ['END009'],
  thyroid: ['END001'],
  hypothyroidism: ['END001'],
  'high blood pressure': ['CIR007'],
  hypertension: ['CIR007'],
  'heart failure': ['CIR019'],
  'atrial fibrillation': ['CIR017'],
  afib: ['CIR017'],
  arrhythmia: ['CIR017'],
  'coronary artery disease': ['CIR011'],
  'pulmonary embolism': ['CIR013'],
  depression: ['MBD002'],
  depressive: ['MBD002'],
  anxiety: ['MBD005'],
  ocd: ['MBD006'],
  ptsd: ['MBD007'],
  bipolar: ['MBD003'],
  schizophrenia: ['MBD001'],
  psychosis: ['MBD001'],
  'opioid use disorder': ['MBD018'],
  'alcohol use disorder': ['MBD017'],
  smoking: ['MBD024'],
  'tobacco use': ['MBD024'],
  insomnia: ['NVS016'],
  'sleep disorder': ['NVS016'],
  epilepsy: ['NVS009'],
  seizures: ['NVS009'],
  migraine: ['NVS010'],
  headache: ['NVS010'],
  'nerve pain': ['NVS019'],
  asthma: ['RSP009'],
  copd: ['RSP008'],
  emphysema: ['RSP008'],
  'acid reflux': ['DIG004'],
  gerd: ['DIG004'],
  heartburn: ['DIG004'],
  arthritis: ['MUS006', 'MUS003'],
  osteoarthritis: ['MUS006'],
  'rheumatoid arthritis': ['MUS003'],
  osteoporosis: ['MUS013'],
  'back pain': ['MUS038'],
  'low back pain': ['MUS038'],
  'chronic pain': ['MUS010', 'MUS038', 'NVS019'],
  'kidney disease': ['GEN003'],
  ckd: ['GEN003'],
  hiv: ['INF006'],
  glaucoma: ['EYE003'],
  // Deliberately absent: ADHD (CCSR splits it across neurodevelopmental and
  // impulse-control in a way the data does not settle), eczema and psoriasis
  // (no dedicated category — the nearest is "other specified inflammatory
  // condition of skin"), and allergies (the only "allergic" category is an
  // INJURY code for allergic reactions). Those fall through to the label
  // search, which reports which category it matched so a caller can see what
  // they actually got.
};

const CCSR_RE = /^[A-Z]{3}\d{3}$/;

/** An exact CCSR code if the caller gave one, else the synonym hit, else null
 *  meaning "fall through to a label search". */
export function resolveConditionCodes(raw: string): string[] | null {
  const t = raw.trim();
  if (!t) return null;
  if (CCSR_RE.test(t.toUpperCase())) return [t.toUpperCase()];
  const lower = t.toLowerCase().replace(/\s+/g, ' ');
  if (CONDITION_SYNONYMS[lower]) return CONDITION_SYNONYMS[lower];
  // Longest containing synonym, so "type 2 diabetes mellitus" still resolves
  // and does not lose to the shorter "diabetes".
  const hit = Object.keys(CONDITION_SYNONYMS)
    .filter((k) => lower.includes(k))
    .sort((a, b) => b.length - a.length)[0];
  return hit ? CONDITION_SYNONYMS[hit] : null;
}
