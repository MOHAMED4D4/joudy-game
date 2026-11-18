'use client';

import React, { useCallback, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Volume2, VolumeX } from 'lucide-react';
import JoudyHome from './JoudyHome';
import { addWorldCoins, loadWorldSave, saveWorld, useWorldSave, SHOP_ITEMS } from '@/lib/joudyWorld';
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

type GameState = 'HOME' | 'TITLE_MENU' | 'WORLD_MAP' | 'PLAYING' | 'VICTORY';

const REAL_IMAGE_SRC = '/images/joudy-real.png';
const ANIME_IMAGE_SRC = '/images/joudy-anime.jpg';

export default function JoudyAdventureGame() {
  const progress = useJoudyProgress();

  const [gameState, setGameState] = useState<GameState>('HOME');
  const worldSave = useWorldSave();
  const equippedOutfit = SHOP_ITEMS.find((item) => item.id === worldSave.equippedOutfit) ?? SHOP_ITEMS[0];
  const equippedShoes = SHOP_ITEMS.find((item) => item.id === worldSave.equippedShoes) ?? SHOP_ITEMS.find((item) => item.id === 'sneakers')!;
  const characterSpeedBonus = equippedOutfit.bonus === 'speed' || equippedShoes.bonus === 'speed' ? 1.08 : 1;
  const characterShieldBonus = equippedOutfit.bonus === 'shield' || equippedShoes.bonus === 'shield' ? 0.2 : 0;
  const characterCoinBonus = equippedOutfit.bonus === 'coins' || equippedShoes.bonus === 'coins' ? 1.05 : 1;
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

  const handleOpenWorldMap = useCallback(() => {
    soundEngine.stopBackgroundMusic();
    soundEngine.stopCarEngineSound();
    soundEngine.playStartAdventure();
    setGameState('WORLD_MAP');
  }, []);

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
    const nextLvl = Math.min(30, activeLevel + 1);
    handleStartLevel(nextLvl);
  }, [activeLevel, handleStartLevel]);

  const handleReplayCurrent = useCallback(() => {
    handleStartLevel(activeLevel);
  }, [activeLevel, handleStartLevel]);

  const activeLevelConfig = getLevelConfig(activeLevel);

  return (
    <main className="relative min-h-dvh w-full overflow-x-hidden bg-[#080f1b] flex flex-col">
      {/* Minimal audio control */}
      {gameState !== 'PLAYING' && gameState !== 'HOME' && (
        <div className="absolute left-4 top-4 z-30">
          <button type="button" onClick={handleToggleSound} aria-label={soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت'} className="rounded-full border border-white/10 bg-slate-950/70 p-3 text-slate-200 shadow-lg backdrop-blur">
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        </div>
      )}

      {/* Active Screen State Machine (2D Arcade & Winding Map) */}
      <div className="relative z-10 flex-1 flex items-stretch justify-center w-full">
        {gameState === 'HOME' && (
          <JoudyHome
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            onPlayArcade={handleOpenWorldMap}
          />
        )}
        <AnimatePresence mode="wait">
          {gameState === 'TITLE_MENU' && (
            <CharacterSelectScreen
              key="title-menu"
              realImageSrc={realImageSrc}
              onStartAdventure={handleOpenWorldMap}
              onBackToHome={() => setGameState('HOME')}
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
              characterFilter={equippedOutfit.filter}
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
