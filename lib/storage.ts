'use client';

import { useSyncExternalStore } from 'react';

export interface LevelProgressRecord {
  bestScore: number;
  stars: 1 | 2 | 3;
}

export interface JoudyGameProgress {
  highScore: number;
  highestUnlockedLevel: number;
  completedLevels: Record<number, LevelProgressRecord>;
}

const STORAGE_KEY = 'joudy_magical_adventure_test_v1';
const PROGRESS_EVENT = 'joudy-progress-change';

const DEFAULT_PROGRESS: JoudyGameProgress = {
  highScore: 0,
  highestUnlockedLevel: 30,
  completedLevels: {},
};

let cachedRaw: string | null = null;
let cachedParsed: JoudyGameProgress = DEFAULT_PROGRESS;

function parseProgress(raw: string | null): JoudyGameProgress {
  if (!raw) return DEFAULT_PROGRESS;
  try {
    const parsed = JSON.parse(raw) as Partial<JoudyGameProgress>;
    return {
      highScore: typeof parsed.highScore === 'number' ? Math.max(0, parsed.highScore) : 0,
      highestUnlockedLevel:
        typeof parsed.highestUnlockedLevel === 'number'
          ? Math.max(1, Math.min(30, parsed.highestUnlockedLevel))
          : 1,
      completedLevels:
        parsed.completedLevels && typeof parsed.completedLevels === 'object'
          ? parsed.completedLevels
          : {},
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function loadProgress(): JoudyGameProgress {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedParsed;
    cachedRaw = raw;
    cachedParsed = parseProgress(raw);
    return cachedParsed;
  } catch {
    return DEFAULT_PROGRESS;
  }
}

function subscribeProgress(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };
  const onCustom = () => callback();
  window.addEventListener('storage', onStorage);
  window.addEventListener(PROGRESS_EVENT, onCustom);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(PROGRESS_EVENT, onCustom);
  };
}

export function useJoudyProgress(): JoudyGameProgress {
  return useSyncExternalStore(
    subscribeProgress,
    loadProgress,
    () => DEFAULT_PROGRESS,
  );
}

export function saveProgress(progress: JoudyGameProgress): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(progress);
    cachedRaw = serialized;
    cachedParsed = progress;
    window.localStorage.setItem(STORAGE_KEY, serialized);
    window.dispatchEvent(new Event(PROGRESS_EVENT));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function computeLevelStars(obstaclesHit: number): 1 | 2 | 3 {
  if (obstaclesHit === 0) return 3;
  if (obstaclesHit <= 2) return 2;
  return 1;
}

export function recordLevelCompletion(
  level: number,
  score: number,
  obstaclesHit: number,
): { next: JoudyGameProgress; isNewHighScore: boolean } {
  const current = loadProgress();
  const stars = computeLevelStars(obstaclesHit);
  const existing = current.completedLevels[level];
  const mergedRecord: LevelProgressRecord = {
    bestScore: Math.max(existing?.bestScore ?? 0, score),
    stars: Math.max(existing?.stars ?? 1, stars) as 1 | 2 | 3,
  };

  const isNewHighScore = score > current.highScore;
  const next: JoudyGameProgress = {
    highScore: Math.max(current.highScore, score),
    highestUnlockedLevel: Math.min(
      30,
      Math.max(current.highestUnlockedLevel, level + 1),
    ),
    completedLevels: {
      ...current.completedLevels,
      [level]: mergedRecord,
    },
  };

  saveProgress(next);
  return { next, isNewHighScore };
}

export function updateHighScoreOnly(candidateScore: number): void {
  const current = loadProgress();
  if (candidateScore <= current.highScore) return;
  saveProgress({
    ...current,
    highScore: candidateScore,
  });
}
