'use client';

import React, { useCallback, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Trophy, Volume2, VolumeX } from 'lucide-react';
import CharacterSelectScreen from './CharacterSelectScreen';
import WorldMapScreen from './WorldMapScreen';
import GameArena, { type GameRunStats } from './GameArena';
import VictoryScreen from './VictoryScreen';
import OpenWorldArena from './OpenWorldArena';
import RoyalHonorsEvent from './RoyalHonorsEvent';
import { getLevelConfig } from '@/lib/levels';
import {
  recordLevelCompletion,
  updateHighScoreOnly,
  useJoudyProgress,
} from '@/lib/storage';
import { soundEngine } from '@/lib/soundEffects';

type GameState = 'TITLE_MENU' | 'WORLD_MAP' | 'PLAYING' | 'VICTORY' | 'OPEN_WORLD' | 'ROYAL_EVENT';

const REAL_IMAGE_SRC = '/assets/aistudio/Screenshot_________________Gallery_94dde710.png';
const ANIME_IMAGE_SRC = '/images/joudy-anime.jpg';

export default function JoudyAdventureGame() {
  const progress = useJoudyProgress();

  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [runId, setRunId] = useState(1);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [royalPhotoBonus, setRoyalPhotoBonus] = useState(0);

  const [lastStats, setLastStats] = useState<GameRunStats>({
    level: 1,
    score: 300,
    cats: 0,
    roses: 0,
    chocolates: 0,
    obstaclesHit: 0,
    elapsedSeconds: 0,
  });

  const activeLevel = selectedLevel ?? progress.highestUnlockedLevel;
  const realImageSrc = REAL_IMAGE_SRC;
  const animeImageSrc = ANIME_IMAGE_SRC;

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      soundEngine.setSfxEnabled(next);
      soundEngine.setMusicEnabled(next);
      return next;
    });
  }, []);

  const handleOpenWorldMap = useCallback(() => {
    soundEngine.stopBackgroundMusic();
    soundEngine.stopCarEngineSound();
    soundEngine.playStartAdventure();
    setGameState('WORLD_MAP');
  }, []);

  const handleOpenFreeWorld = useCallback(() => {
    soundEngine.setSfxEnabled(soundEnabled);
    soundEngine.setMusicEnabled(soundEnabled);
    soundEngine.playStartAdventure();
    setGameState('OPEN_WORLD');
  }, [soundEnabled]);

  const handleRoyalPhotoReward = useCallback((amount: number) => {
    setRoyalPhotoBonus((total) => total + amount);
  }, []);

  const handleOpenRoyalEvent = useCallback(() => {
    soundEngine.setSfxEnabled(soundEnabled);
    soundEngine.setMusicEnabled(soundEnabled);
    soundEngine.playStartAdventure();
    setGameState('ROYAL_EVENT');
  }, [soundEnabled]);

  const handleStartLevel = useCallback(
    (levelNumber: number) => {
      soundEngine.setSfxEnabled(soundEnabled);
      soundEngine.setMusicEnabled(soundEnabled);
      soundEngine.playStartAdventure();
      setSelectedLevel(levelNumber);
      setRunId((id) => id + 1);
      setIsNewHighScore(false);
      setGameState('PLAYING');
    },
    [soundEnabled],
  );

  const handleHighScoreUpdate = useCallback((candidateScore: number) => {
    updateHighScoreOnly(candidateScore);
  }, []);

  const handleVictory = useCallback((stats: GameRunStats) => {
    setLastStats(stats);
    const { isNewHighScore: beatRecord } = recordLevelCompletion(
      stats.level,
      stats.score,
      stats.obstaclesHit,
    );
    setIsNewHighScore(beatRecord);
    setGameState('VICTORY');
  }, []);

  const handleNextLevel = useCallback(() => {
    const nextLvl = Math.min(30, activeLevel + 1);
    handleStartLevel(nextLvl);
  }, [activeLevel, handleStartLevel]);

  const handleReplayCurrent = useCallback(() => {
    handleStartLevel(activeLevel);
  }, [activeLevel, handleStartLevel]);

  const activeLevelConfig = getLevelConfig(activeLevel);

  return (
    <main className="relative min-h-dvh w-full overflow-x-hidden bg-gradient-to-b from-[#FFF5F8] via-[#FFF9FB] to-[#FEF2F6] flex flex-col">
      {/* Subtle Pastel Ambient Glow Background */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -top-28 -right-24 w-96 h-96 rounded-full bg-rose-200/35 blur-3xl" />
        <div className="absolute top-1/3 -left-24 w-80 h-80 rounded-full bg-emerald-200/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-amber-200/25 blur-3xl" />
      </div>

      {/* Persistent Top Bar (Brand + High Score + Audio) outside Active Arenas */}
      {gameState !== 'PLAYING' && gameState !== 'OPEN_WORLD' && gameState !== 'ROYAL_EVENT' && (
        <div className="relative z-20 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-3 pb-1 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setGameState('TITLE_MENU')}
            className="text-base sm:text-lg font-bold text-rose-700 hover:text-rose-900 transition-colors whitespace-nowrap cursor-pointer"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            عالم جودي الملكي
          </button>

          <div className="flex items-center gap-2.5 sm:gap-4">
            <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-800 tabular-nums whitespace-nowrap">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>الرقم القياسي لجودي: {progress.highScore}</span>
            </div>

            <button
              type="button"
              onClick={handleToggleSound}
              className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl bg-white/95 border border-rose-200 text-xs sm:text-sm font-semibold text-[#2D1824] hover:bg-rose-50 transition-colors shadow-xs cursor-pointer whitespace-nowrap"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-rose-500" />
                  <span className="hidden sm:inline">الصوت مفعّل</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-slate-500" />
                  <span className="hidden sm:inline">الصوت مكتوم</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Active Screen State Machine (2D Arcade & Winding Map) */}
      <div className="relative z-10 flex-1 flex items-center justify-center w-full">
        <AnimatePresence mode="wait">
          {gameState === 'TITLE_MENU' && (
            <CharacterSelectScreen
              key="title-menu"
              realImageSrc={realImageSrc}
              animeImageSrc={animeImageSrc}
              onStartAdventure={handleOpenWorldMap}
              onStartOpenWorld={handleOpenFreeWorld}
              onStartRoyalEvent={handleOpenRoyalEvent}
            />
          )}

          {gameState === 'WORLD_MAP' && (
            <WorldMapScreen
              key="world-map-2d"
              progress={progress}
              realImageSrc={realImageSrc}
              animeImageSrc={animeImageSrc}
              onSelectLevel={handleStartLevel}
              onBackToCharacter={() => setGameState('TITLE_MENU')}
            />
          )}

          {gameState === 'PLAYING' && (
            <GameArena
              key={`arena-2d-${activeLevel}-${runId}`}
              levelConfig={activeLevelConfig}
              realImageSrc={realImageSrc}
              animeImageSrc={animeImageSrc}
              highScore={progress.highScore}
              soundEnabled={soundEnabled}
              onToggleSound={handleToggleSound}
              onHighScoreUpdate={handleHighScoreUpdate}
              onExitToMap={() => {
                soundEngine.stopBackgroundMusic();
                setGameState('WORLD_MAP');
              }}
              onVictory={handleVictory}
            />
          )}

          {gameState === 'VICTORY' && (
            <VictoryScreen
              key={`victory-2d-${activeLevel}`}
              levelConfig={activeLevelConfig}
              realImageSrc={realImageSrc}
              animeImageSrc={animeImageSrc}
              stats={lastStats}
              highScore={progress.highScore}
              isNewHighScore={isNewHighScore}
              onNextLevel={handleNextLevel}
              onPlayAgain={handleReplayCurrent}
              onOpenWorldMap={() => setGameState('WORLD_MAP')}
            />
          )}

          {gameState === 'OPEN_WORLD' && (
            <OpenWorldArena
              key="open-world-rpg"
              realImageSrc={realImageSrc}
              animeImageSrc={animeImageSrc}
              soundEnabled={soundEnabled}
              onToggleSound={handleToggleSound}
              bonusCoins={royalPhotoBonus}
              onExitToHub={() => {
                soundEngine.stopCarEngineSound();
                soundEngine.stopBackgroundMusic();
                setGameState('TITLE_MENU');
              }}
            />
          )}

          {gameState === 'ROYAL_EVENT' && (
            <RoyalHonorsEvent
              key="royal-honors-event"
              portraitSrc={realImageSrc}
              onBackToHub={() => setGameState('TITLE_MENU')}
              onEnterKingdom={handleOpenFreeWorld}
              onPhotoReward={handleRoyalPhotoReward}
            />
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
