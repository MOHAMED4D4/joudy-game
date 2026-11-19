'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Volume2, VolumeX } from 'lucide-react';
import { addWorldCoins, loadWorldSave, saveWorld } from '@/lib/joudyWorld';
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
  const [lastRewardCoins, setLastRewardCoins] = useState(0);

  const [lastStats, setLastStats] = useState<GameRunStats>({
    level: 1,
    score: 300,
    cats: 0,
    roses: 0,
    chocolates: 0,
    obstaclesHit: 0,
    elapsedSeconds: 0,
    heartsRemaining: 3,
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
      // Never allow a direct start into season two before the first city is
      // completed and its 40,000-point gate has been purchased.
      if (levelNumber > progress.highestUnlockedLevel || (levelNumber >= 16 && !loadWorldSave().coastalRegionUnlocked)) {
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
    [soundEnabled, progress.highestUnlockedLevel],
  );

  const handleGameOver = useCallback(() => {
    // The voice and the original melancholy game-over cue play together.
    // Both are intentionally independent from the regular game mute toggle.
    const lossMusic = new Audio('/audio/joudy-loss-music.mp3');
    lossMusic.volume = 0.24;
    lossMusic.loop = false;
    void lossMusic.play().catch(() => {
      // Playback is attempted directly at the game-over event.
    });

    const lossVoice = new Audio('/audio/joudy-loss.mp3');
    lossVoice.volume = 1;
    void lossVoice.play().catch(() => {
      // Playback is attempted directly at the game-over event.
    });
  }, []);

  const handleHighScoreUpdate = useCallback((candidateScore: number) => {
    updateHighScoreOnly(candidateScore);
  }, []);

  const handleVictory = useCallback((stats: GameRunStats) => {
    setLastStats(stats);
    const beforeReward = loadWorldSave();
    const reward = stats.level === 30
      ? (beforeReward.finalBossRewardClaimed ? 0 : 50_000)
      : Math.max(25, Math.floor((Math.floor(stats.score / 5) + stats.cats * 3 + stats.roses * 2) * characterCoinBonus));
    setLastRewardCoins(reward);
    if (reward > 0) addWorldCoins(reward);
    const latest = loadWorldSave();
    const { [stats.level]: _completedRevives, ...remainingRevives } = latest.reviveCountsByLevel;
    saveWorld((current) => ({
      ...current,
      totalChocolates: current.totalChocolates + stats.chocolates,
      totalScore: current.totalScore + stats.score,
      perfectRuns: current.perfectRuns + (stats.heartsRemaining === 3 && stats.obstaclesHit === 0 ? 1 : 0),
      totalBosses: current.totalBosses + ([5, 10, 15, 20, 25, 30].includes(stats.level) ? 1 : 0),
      reviveCountsByLevel: remainingRevives,
      highestAchievement: Math.max(latest.highestAchievement, stats.level >= 30 ? 3 : stats.level >= 15 ? 2 : stats.level >= 5 ? 1 : 0),
      finalBossRewardClaimed: latest.finalBossRewardClaimed || (stats.level === 30 && reward > 0),
    }));

    const { isNewHighScore: beatRecord } = recordLevelCompletion(
      stats.level,
      stats.score,
      stats.obstaclesHit,
    );
    setIsNewHighScore(beatRecord);
    setGameState('VICTORY');
  }, [characterCoinBonus]);

  const handleNextLevel = useCallback(() => {
    // Finishing level 15 returns to the map so the player must buy the new city.
    if (activeLevel === 15 && !loadWorldSave().coastalRegionUnlocked) {
      setGameState('WORLD_MAP');
      return;
    }
    const nextLvl = Math.min(30, activeLevel + 1);
    handleStartLevel(nextLvl);
  }, [activeLevel, handleStartLevel]);

  const handleReplayCurrent = useCallback(() => {
    handleStartLevel(activeLevel);
  }, [activeLevel, handleStartLevel]);

  const activeLevelConfig = getLevelConfig(activeLevel);

  return (
    <main onClickCapture={(event) => { if ((event.target as HTMLElement).closest('button')) soundEngine.playButtonClick(); }} className="relative min-h-dvh w-full overflow-x-clip bg-[#080f1b] flex flex-col">
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
              onBackToHome={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setGameState('TITLE_MENU'); }}
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
              onGameOver={handleGameOver}
            />
          )}

          {gameState === 'VICTORY' && (
            <VictoryScreen
              key={`victory-2d-${activeLevel}`}
              levelConfig={activeLevelConfig}
              realImageSrc={realImageSrc}
              animeImageSrc={animeImageSrc}
              stats={lastStats}
              rewardCoins={lastRewardCoins}
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
