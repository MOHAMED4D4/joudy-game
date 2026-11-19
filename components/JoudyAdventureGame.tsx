'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  loadProgress,
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
  const [achievementNotices, setAchievementNotices] = useState<{ title: string; amount: number; type: 'coins' | 'score' }[]>([]);
  const lossAudioRefs = useRef<HTMLAudioElement[]>([]);
  const stopTransitionAudio = useCallback(() => { lossAudioRefs.current.forEach((audio) => { audio.pause(); audio.currentTime = 0; }); lossAudioRefs.current = []; }, []);

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
      // Each five-level chapter has its own completion requirement and score gate.
      const save = loadWorldSave();
      const chapterLocked =
        (levelNumber >= 16 && levelNumber <= 20 && !save.coastalRegionUnlocked) ||
        (levelNumber >= 21 && levelNumber <= 25 && !save.thirdChapterUnlocked) ||
        (levelNumber >= 26 && levelNumber <= 30 && !save.fourthChapterUnlocked);
      if (levelNumber > progress.highestUnlockedLevel || chapterLocked) {
        setSelectedLevel(null);
        setGameState('WORLD_MAP');
        return;
      }
      stopTransitionAudio();
      soundEngine.setSfxEnabled(soundEnabled);
      soundEngine.setMusicEnabled(soundEnabled);
      soundEngine.playStartAdventure();
      setSelectedLevel(levelNumber);
      setRunId((id) => id + 1);
      setIsNewHighScore(false);
      setGameState('PLAYING');
    },
    [soundEnabled, progress.highestUnlockedLevel, stopTransitionAudio],
  );

  const handleGameOver = useCallback(() => {
    stopTransitionAudio();
    const lossMusic = new Audio('/audio/joudy-loss-music.mp3');
    lossMusic.volume = 0.24;
    const lossVoice = new Audio('/audio/joudy-loss.mp3');
    lossVoice.volume = 1;
    lossAudioRefs.current = [lossMusic, lossVoice];
    void lossMusic.play().catch(() => undefined);
    void lossVoice.play().catch(() => undefined);
  }, [stopTransitionAudio]);

  const handleHighScoreUpdate = useCallback((candidateScore: number) => {
    updateHighScoreOnly(candidateScore);
  }, []);

  const handleVictory = useCallback((stats: GameRunStats) => {
    stopTransitionAudio();
    const winAudio = new Audio('/audio/joudy-win.mp3');
    winAudio.volume = 1;
    lossAudioRefs.current = [winAudio];
    void winAudio.play().catch(() => undefined);
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
    const achievementSave = loadWorldSave();
    const updatedProgress = loadProgress();
    const completedCount = Object.keys(updatedProgress.completedLevels).length;
    const starsTotal = Object.values(updatedProgress.completedLevels).reduce((sum, item) => sum + item.stars, 0);
    const threeStarCount = Object.values(updatedProgress.completedLevels).filter((item) => item.stars === 3).length;
    const highScoreLevels = Object.values(updatedProgress.completedLevels).filter((item) => item.bestScore >= 1800).length;
    const achievementChecks: { id: string; title: string; done: boolean; type: 'coins' | 'score'; amount: number }[] = [
      ['levels-1','أول خطوة',completedCount>=1,'coins',250],['choco-25','حلوى البداية',achievementSave.totalChocolates>=50,'score',900],['score-5k','جامع النقاط',achievementSave.totalScore>=10000,'coins',350],
      ['levels-5','مغامر ناشئ',completedCount>=5,'coins',500],['choco-100','عاشق الشوكولاتة',achievementSave.totalChocolates>=200,'score',1000],['stars-10','عين على النجوم',starsTotal>=20,'coins',600],['score-25k','صياد النقاط',achievementSave.totalScore>=50000,'score',1100],['levels-10','رحّالة',completedCount>=10,'coins',900],
      ['perfect-1','قلب من حديد',achievementSave.perfectRuns>=2,'coins',750],['three-star-3','ثلاث نجوم',threeStarCount>=5,'score',1200],['choco-300','كنز الحلوى',achievementSave.totalChocolates>=600,'coins',1100],['boss-1','مواجهة الزعيم',achievementSave.totalBosses>=2,'coins',1300],['levels-15','حامي المدينة',Boolean(updatedProgress.completedLevels[15]),'score',1300],
      ['bosses-3','صياد الزعماء',achievementSave.totalBosses>=4,'coins',1700],['score-100k','أسطورة النقاط',achievementSave.totalScore>=200000,'score',1400],['perfect-5','مراوغ أسطوري',achievementSave.perfectRuns>=8,'coins',2200],['stars-30','جامع النجوم',starsTotal>=45,'coins',2300],['three-star-10','لا يخطئ',threeStarCount>=15,'score',1500],
      ['choco-750','مصنع الشوكولاتة',achievementSave.totalChocolates>=1500,'coins',2500],['levels-20','سيد المغامرة',completedCount>=20,'coins',2800],['highscore-5','صاحب الأرقام',highScoreLevels>=5,'score',1600],['bosses-5','كابوس الزعماء',achievementSave.totalBosses>=5,'coins',3000],
      ['perfect-10','لم تُمس',achievementSave.perfectRuns>=15,'coins',3200],['score-250k','مليون؟ ليس بعد!',achievementSave.totalScore>=500000,'score',1700],['stars-60','سماء مرصعة',starsTotal>=80,'coins',3500],['three-star-20','الكمال المطلق',threeStarCount>=25,'coins',3800],['choco-1500','إمبراطورية الحلوى',achievementSave.totalChocolates>=3000,'coins',4000],
      ['levels-25','أسطورة العالم',completedCount>=25,'coins',4500],['bosses-6','قاهر العمالقة',achievementSave.totalBosses>=6,'score',1800],['all-stars','كل نجمة في مكانها',starsTotal>=90,'coins',5000],['final','أسطورة جودي',Boolean(updatedProgress.completedLevels[30]),'coins',6000],['score-500k','الرقم المستحيل',achievementSave.totalScore>=1000000,'score',2000],
    ].map(([id,title,done,type,amount]) => ({id:String(id),title:String(title),done:Boolean(done),type:type as 'coins'|'score',amount:Number(amount)}));
    const claimed = new Set(achievementSave.claimedAchievementRewards ?? []);
    const newlyEarned = achievementChecks.filter((item) => item.done && !claimed.has(item.id));
    if (newlyEarned.length) {
      setAchievementNotices((current) => [...current, ...newlyEarned.map((item) => ({ title: item.title, amount: item.amount, type: item.type }))]);
      saveWorld((current) => ({
        ...current,
        coins: current.coins + newlyEarned.filter((item) => item.type === 'coins').reduce((sum, item) => sum + item.amount, 0),
        totalScore: current.totalScore + newlyEarned.filter((item) => item.type === 'score').reduce((sum, item) => sum + item.amount, 0),
        claimedAchievementRewards: [...new Set([...(current.claimedAchievementRewards ?? []), ...newlyEarned.map((item) => item.id)])],
      }));
    }
    setIsNewHighScore(beatRecord);
    setGameState('VICTORY');
  }, [characterCoinBonus, stopTransitionAudio]);

  const handleNextLevel = useCallback(() => {
    // Chapter transitions return to the map until the next gate is purchased.
    const save = loadWorldSave();
    const nextLevel = activeLevel + 1;
    const needsChapterUnlock =
      (nextLevel === 16 && !save.coastalRegionUnlocked) ||
      (nextLevel === 21 && !save.thirdChapterUnlocked) ||
      (nextLevel === 26 && !save.fourthChapterUnlocked);
    if (needsChapterUnlock) {
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

  useEffect(() => {
    if (gameState !== 'PLAYING' && document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    }
  }, [gameState]);

  return (
    <main onContextMenu={(event) => event.preventDefault()} onDragStart={(event) => event.preventDefault()} onSelect={(event) => event.preventDefault()} onClickCapture={(event) => { if ((event.target as HTMLElement).closest('button')) soundEngine.playButtonClick(); }} className="relative min-h-dvh w-full overflow-x-clip bg-[#080f1b] flex flex-col">
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
              highestUnlockedLevel={progress.highestUnlockedLevel}
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
              onStopTransitionAudio={stopTransitionAudio}
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
              onOpenWorldMap={() => { stopTransitionAudio(); setGameState('WORLD_MAP'); }}
            />
          )}

        </AnimatePresence>
      </div>
      {gameState === 'WORLD_MAP' && achievementNotices.length > 0 && (
        <div className="fixed inset-x-3 top-4 z-[120] mx-auto max-w-md animate-in slide-in-from-top-6 duration-500" role="status">
          <div className="relative overflow-hidden rounded-2xl border border-amber-200/50 bg-gradient-to-br from-[#38275c] via-[#182746] to-[#0b1729] p-4 text-white shadow-[0_18px_60px_rgba(0,0,0,.65)]">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-300/20 blur-2xl" />
            <div className="relative flex items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-amber-200/40 bg-amber-300/15 text-2xl">🏆</div>
              <div className="min-w-0 flex-1"><p className="text-[10px] font-black tracking-widest text-amber-200">إنجاز جديد!</p><p className="text-lg font-black">{achievementNotices[0].title}</p><p className="text-xs font-bold text-emerald-200">+{achievementNotices[0].amount.toLocaleString('ar-EG')} {achievementNotices[0].type === 'coins' ? 'عملة' : 'نقطة Score'}</p></div>
              <button type="button" onClick={() => setAchievementNotices((current) => current.slice(1))} className="rounded-lg px-2 py-1 text-white/70">✕</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
