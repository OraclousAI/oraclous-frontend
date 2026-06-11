// useCorpus — the typed accessor surface both surfaces consume. The corpus is static module
// data (no backend, D-001), so this is a thin, stable wrapper around src/corpus/index.ts that
// gives components one import and a place to hang memoised derivations later.

import * as corpus from '../corpus/index.js';

export function useCorpus() {
  return corpus;
}

export type Corpus = typeof corpus;
