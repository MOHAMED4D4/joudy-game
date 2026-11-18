'use client';

import React, { useCallback, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Volume2, VolumeX } from 'lucide-react';
import { addWorldCoins, loadWorldSave, saveWorld, useWorldSave } from '@/lib/joudyWorld';
import CharacterSelectScreen from './CharacterSelectScreen';
import WorldMapScreen from './WorldMapScreen';
import GameArena, { type GameRunStats } from './GameArena';
import VictoryScreen from './VictoryScreen';
import { getLevelConfig } from '@/lib/levels';
import {
  recordLevelCompletion,
  updateHighScoreOnly,
  useJoudyProgress,
} from '@/lib/storage';
import { soundEngine } from '@/lib/soundEffects';

type GameState = 'TITLE_MENU' | 'WORLD_MAP' | 'PLAYING' | 'VICTORY';

const REAL_IMAGE_SRC = '/images/joudy-real.png';
const ANIME_IMAGE_SRC = '/images/joudy-anime.jpg';

export default function JoudyAdventureGame() {
  const progress = useJoudyProgress();
  const worldSave = useWorldSave();

  // Restore the original welcome page before the stages map.
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  // Keep Joudy's original V3 costume fixed; no wardrobe overlays or equipment bonuses.
  const characterSpeedBonus = 1;
  const characterShieldBonus = 0;
  const characterCoinBonus = 1;
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [runId, setRunId] = useState(1);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

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

  const handleStartLevel = useCallback(
    (levelNumber: number) => {
      if (levelNumber >= 16 && levelNumber <= 20 && !worldSave.pearlIslandUnlocked) {
        setSelectedLevel(null);
        setGameState('WORLD_MAP');
        return;
      }
      soundEngine.setSfxEnabled(soundEnabled);
      soundEngine.setMusicEnabled(soundEnabled);
      soundEngine.playStartAdventure();
      setSelectedLevel(levelNumber);
      setRunId((id) => id + 1);
      setIsNewHighScore(false);
      setGameState('PLAYING');
    },
    [soundEnabled, worldSave.pearlIslandUnlocked],
  );

  const handleHighScoreUpdate = useCallback((candidateScore: number) => {
    updateHighScoreOnly(candidateScore);
  }, []);

  const handleVictory = useCallback((stats: GameRunStats) => {
    setLastStats(stats);
    const reward = Math.max(25, Math.floor((Math.floor(stats.score / 5) + stats.cats * 3 + stats.roses * 2) * characterCoinBonus));
    addWorldCoins(reward);
    const latest = loadWorldSave();
    const { [stats.level]: _completedRevives, ...remainingRevives } = latest.reviveCountsByLevel;
    saveWorld({
      reviveCountsByLevel: remainingRevives,
      highestAchievement: Math.max(latest.highestAchievement, stats.level >= 30 ? 3 : stats.level >= 15 ? 2 : stats.level >= 5 ? 1 : 0),
    });

    const { isNewHighScore: beatRecord } = recordLevelCompletion(
      stats.level,
      stats.score,
      stats.obstaclesHit,
    );
    setIsNewHighScore(beatRecord);
    setGameState('VICTORY');
  }, [characterCoinBonus]);

  const handleNextLevel = useCallback(() => {
    if (activeLevel === 15 && !worldSave.pearlIslandUnlocked) {
      setSelectedLevel(null);
      setGameState('WORLD_MAP');
      return;
    }
    const nextLvl = Math.min(30, activeLevel + 1);
    handleStartLevel(nextLvl);
  }, [activeLevel, handleStartLevel, worldSave.pearlIslandUnlocked]);

  const handleReplayCurrent = useCallback(() => {
    handleStartLevel(activeLevel);
  }, [activeLevel, handleStartLevel]);

  const activeLevelConfig = getLevelConfig(activeLevel);

  return (
    <main className="relative min-h-dvh w-full overflow-x-clip bg-[#080f1b] flex flex-col">
      {/* Minimal audio control */}
      {gameState !== 'PLAYING' && (
        <div className="absolute left-4 top-4 z-30">
          <button type="button" onClick={handleToggleSound} aria-label={soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت'} className="rounded-full border border-white/10 bg-slate-950/70 p-3 text-slate-200 shadow-lg backdrop-blur">
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        </div>
      )}

      {/* Active Screen State Machine (2D Arcade & Winding Map) */}
      <div className="relative z-10 flex-1 flex items-stretch justify-center w-full">
        <AnimatePresence mode="wait">
          {gameState === 'TITLE_MENU' && (
            <CharacterSelectScreen
              key="joudy-original-title"
              realImageSrc={realImageSrc}
              onStartAdventure={() => setGameState('WORLD_MAP')}
            />
          )}

          {gameState === 'WORLD_MAP' && (
            <WorldMapScreen
              key="world-map-2d"
              progress={progress}
              onSelectLevel={handleStartLevel}
            />
          )}

          {gameState === 'PLAYING' && (
            <GameArena
              key={`arena-2d-${activeLevel}-${runId}`}
              levelConfig={activeLevelConfig}
              realImageSrc={realImageSrc}
              animeImageSrc={animeImageSrc}
              characterSpriteSrc="/images/joudy-original-transparent.png"
              highScore={progress.highScore}
              soundEnabled={soundEnabled}
              onToggleSound={handleToggleSound}
              characterFilter="none"
              characterSpeedBonus={characterSpeedBonus}
              characterShieldBonus={characterShieldBonus}
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

        </AnimatePresence>
      </div>
    </main>
  );
}
