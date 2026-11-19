'use client';

type CollectibleSoundType =
  | 'cat'
  | 'rose'
  | 'chocolate'
  | 'coin'
  | 'shadowHunter'
  | 'shadowRunner'
  | 'shadowBrute'
  | 'shadowBoss'
  | 'crystalHunter'
  | 'crystalRunner'
  | 'crystalBrute'
  | 'crystalBoss'
  | 'emberHunter'
  | 'emberRunner'
  | 'emberBrute'
  | 'emberBoss';

class MagicalSoundEngine {
  private ctx: AudioContext | null = null;
  private sfxEnabled = true;
  private musicEnabled = true;
  private musicTimer: number | null = null;
  private musicStep = 0;
  private backgroundSuspended = false;
  private wheelSources: AudioBufferSourceNode[] = [];
  private wheelGains: GainNode[] = [];

  // Gentle C-major pentatonic music-box melody (Hz)
  private readonly melodyNotes = [
    523.25, 659.25, 783.99, 1046.5, 880.0, 783.99,
    659.25, 587.33, 523.25, 659.25, 783.99, 659.25,
    587.33, 659.25, 783.99, 880.0, 783.99, 659.25,
  ];

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended' && !this.backgroundSuspended) {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public suspendForBackground() {
    this.backgroundSuspended = true;
    this.stopBackgroundMusic();
    if (this.ctx && this.ctx.state === 'running') void this.ctx.suspend().catch(() => undefined);
  }

  public resumeAfterUserGesture() {
    this.backgroundSuspended = false;
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume().catch(() => undefined);
  }

  public playLocked() {
    if (!this.sfxEnabled) return;
    this.playTone(240, 0.13, { type: 'triangle', volume: 0.10, slideToFreq: 175 });
    this.playTone(185, 0.16, { type: 'sine', volume: 0.075, delay: 0.07, slideToFreq: 130 });
  }

  public playPurchase() {
    if (!this.sfxEnabled) return;
    [659.25, 830.61, 987.77, 1318.51].forEach((frequency, index) => this.playTone(frequency, 0.19, { type: 'triangle', volume: 0.13, delay: index * 0.065 }));
    this.playTone(1567.98, 0.32, { type: 'sine', volume: 0.09, delay: 0.28 });
  }

  public setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopBackgroundMusic();
    }
  }

  public startBackgroundMusic() {
    if (!this.musicEnabled || this.musicTimer !== null) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.musicStep = 0;
    const playStep = () => {
      if (!this.musicEnabled) return;
      const activeCtx = this.ensureContext();
      if (!activeCtx) return;

      const freq = this.melodyNotes[this.musicStep % this.melodyNotes.length];
      this.musicStep += 1;

      const now = activeCtx.currentTime;
      const osc = activeCtx.createOscillator();
      const gain = activeCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.025, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

      osc.connect(gain);
      gain.connect(activeCtx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    };

    playStep();
    this.musicTimer = window.setInterval(playStep, 520);
  }

  public stopBackgroundMusic() {
    if (this.musicTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private playTone(
    freq: number,
    duration: number,
    options: {
      type?: OscillatorType;
      volume?: number;
      delay?: number;
      slideToFreq?: number;
    } = {},
  ) {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const { type = 'sine', volume = 0.14, delay = 0, slideToFreq } = options;
    const start = ctx.currentTime + delay;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slideToFreq) {
      osc.frequency.exponentialRampToValueAtTime(slideToFreq, start + duration);
    }

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  public playButtonClick() {
    if (!this.sfxEnabled) return;
    this.playTone(740, 0.055, { type: 'sine', volume: 0.055 });
    this.playTone(988, 0.045, { type: 'triangle', volume: 0.035, delay: 0.025 });
  }

  public playStartAdventure() {
    if (!this.sfxEnabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.22, { type: 'triangle', volume: 0.13, delay: idx * 0.075 });
    });
  }

  public playCollect(itemType: CollectibleSoundType, comboCount = 1) {
    if (!this.sfxEnabled) return;
    const comboBoost = 1 + Math.min(8, Math.max(0, comboCount - 1)) * 0.045;

    if (itemType === 'cat') {
      // Cute cheerful "meow-sparkle" ascending chime (+20)
      this.playTone(784 * comboBoost, 0.11, {
        type: 'triangle',
        volume: 0.15,
        slideToFreq: 987.77 * comboBoost,
      });
      this.playTone(1046.5 * comboBoost, 0.18, {
        type: 'sine',
        volume: 0.16,
        delay: 0.08,
        slideToFreq: 1318.5 * comboBoost,
      });
    } else if (itemType === 'rose') {
      // Silky floral harp arpeggio (+15)
      this.playTone(659.25 * comboBoost, 0.15, { type: 'sine', volume: 0.13 });
      this.playTone(880 * comboBoost, 0.18, { type: 'sine', volume: 0.13, delay: 0.055 });
      this.playTone(1174.66 * comboBoost, 0.22, { type: 'triangle', volume: 0.1, delay: 0.11 });
    } else if (itemType === 'coin') {
      // Bright coin pickup chime
      this.playTone(987.77 * comboBoost, 0.09, { type: 'triangle', volume: 0.13 });
      this.playTone(1318.5 * comboBoost, 0.16, { type: 'sine', volume: 0.14, delay: 0.055 });
    } else {
      // Warm sweet chocolate marimba pop (+10)
      this.playTone(523.25 * comboBoost, 0.12, { type: 'triangle', volume: 0.14 });
      this.playTone(659.25 * comboBoost, 0.16, { type: 'sine', volume: 0.13, delay: 0.06 });
    }
  }

  public playMagnetCollect() {
    if (!this.sfxEnabled) return;
    const notes = [587.33, 783.99, 987.77, 1174.66, 1567.98];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.18, {
        type: 'sine',
        volume: 0.14,
        delay: idx * 0.055,
        slideToFreq: n * 1.06,
      });
    });
  }

  public playObstacleHit() {
    if (!this.sfxEnabled) return;
    // Soft cartoon "boing" thud (never harsh)
    this.playTone(320, 0.22, {
      type: 'triangle',
      volume: 0.16,
      slideToFreq: 145,
    });
    this.playTone(210, 0.18, {
      type: 'sine',
      volume: 0.12,
      delay: 0.07,
      slideToFreq: 110,
    });
  }

  public playHeartCollect() {
    if (!this.sfxEnabled) return;
    [659.25, 880, 1174.66, 1567.98].forEach((frequency, index) => {
      this.playTone(frequency, 0.2, { type: 'sine', volume: 0.13, delay: index * 0.055 });
    });
  }

  public playThunder() {
    if (!this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const rumble = ctx.createOscillator();
    const rumbleGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    rumble.type = 'triangle';
    rumble.frequency.setValueAtTime(88, now);
    rumble.frequency.exponentialRampToValueAtTime(38, now + 1.15);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(260, now);
    filter.frequency.exponentialRampToValueAtTime(95, now + 1.2);
    rumbleGain.gain.setValueAtTime(0.0001, now);
    rumbleGain.gain.linearRampToValueAtTime(0.16, now + 0.035);
    rumbleGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.25);
    rumble.connect(filter);
    filter.connect(rumbleGain);
    rumbleGain.connect(ctx.destination);
    rumble.start(now);
    rumble.stop(now + 1.28);

    // Short filtered noise adds the crack of the lightning without a harsh peak.
    const length = Math.floor(ctx.sampleRate * 0.42);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) channel[i] = (Math.random() * 2 - 1) * (1 - i / length) * 0.55;
    const noise = ctx.createBufferSource();
    const noiseFilter = ctx.createBiquadFilter();
    const noiseGain = ctx.createGain();
    noise.buffer = buffer;
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 900;
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.linearRampToValueAtTime(0.12, now + 0.012);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.44);
  }

  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;

  public playVictoryFanfare() {
    if (!this.sfxEnabled) return;
    const fanfare = [
      { f: 523.25, d: 0.16, t: 0 },
      { f: 659.25, d: 0.16, t: 0.11 },
      { f: 783.99, d: 0.16, t: 0.22 },
      { f: 1046.5, d: 0.28, t: 0.33 },
      { f: 880.0, d: 0.16, t: 0.56 },
      { f: 1046.5, d: 0.45, t: 0.72 },
      { f: 1318.51, d: 0.55, t: 0.9 },
    ];
    fanfare.forEach((n) => {
      this.playTone(n.f, n.d, {
        type: 'triangle',
        volume: 0.16,
        delay: n.t,
      });
    });
  }

  public startWheelSpin() {
    if (!this.sfxEnabled || this.wheelSources.length) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    // Mechanical ratchet: short filtered noise clicks, like a real prize wheel
    // passing over its spring-loaded pointer. Clicks slow down with the wheel.
    const duration = 5.4;
    const sampleRate = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, Math.ceil(sampleRate * 0.075), sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i += 1) {
      const envelope = Math.pow(1 - i / samples.length, 2.4);
      samples[i] = (Math.random() * 2 - 1) * envelope;
    }

    const now = ctx.currentTime;
    let elapsed = 0;
    let tick = 0;
    while (elapsed < duration - 0.08) {
      const source = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      source.buffer = buffer;
      filter.type = 'bandpass';
      filter.frequency.value = 1450 + Math.min(900, tick * 22);
      filter.Q.value = 0.85;
      gain.gain.setValueAtTime(0.0001, now + elapsed);
      gain.gain.exponentialRampToValueAtTime(0.12, now + elapsed + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + elapsed + 0.065);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start(now + elapsed);
      source.stop(now + elapsed + 0.076);
      this.wheelSources.push(source);
      this.wheelGains.push(gain);
      source.onended = () => {
        this.wheelSources = this.wheelSources.filter((item) => item !== source);
        this.wheelGains = this.wheelGains.filter((item) => item !== gain);
      };
      tick += 1;
      elapsed += 0.105 + (elapsed / duration) * 0.19;
    }
  }

  public stopWheelSpin() {
    // Stop any remaining scheduled clicks immediately when the wheel lands.
    this.wheelSources.forEach((source) => {
      try { source.stop(); } catch { /* source may already have ended */ }
    });
    this.wheelSources = [];
    this.wheelGains = [];
  }

  public playWheelWin() {
    if (!this.sfxEnabled) return;
    const notes = [659.25, 830.61, 987.77, 1318.51, 1567.98];
    notes.forEach((frequency, index) => this.playTone(frequency, index === 4 ? 0.48 : 0.2, { type: 'triangle', volume: 0.17, delay: index * 0.105 }));
    this.playTone(1975.53, 0.34, { type: 'sine', volume: 0.1, delay: 0.58 });
  }

  public playAchievementWin() {
    if (!this.sfxEnabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((frequency, index) => this.playTone(frequency, index === 4 ? 0.62 : 0.17, { type: 'sine', volume: 0.13, delay: index * 0.13 }));
  }

  public playDialoguePop() {
    if (!this.sfxEnabled) return;
    this.playTone(620, 0.08, {
      type: 'sine',
      volume: 0.09,
      slideToFreq: 780,
    });
  }

  public playQuestComplete() {
    if (!this.sfxEnabled) return;
    const notes = [587.33, 739.99, 880, 1174.66];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.24, {
        type: 'triangle',
        volume: 0.14,
        delay: idx * 0.08,
      });
    });
  }

  public playCarEnter() {
    if (!this.sfxEnabled) return;
    this.playTone(180, 0.14, { type: 'triangle', volume: 0.11, slideToFreq: 310 });
    this.playTone(523.25, 0.16, { type: 'sine', volume: 0.12, delay: 0.09, slideToFreq: 783.99 });
  }

  public playCarExit() {
    if (!this.sfxEnabled) return;
    this.playTone(587.33, 0.13, { type: 'sine', volume: 0.11, slideToFreq: 392.0 });
    this.stopCarEngineSound();
  }

  public playCoinCollect() {
    if (!this.sfxEnabled) return;
    this.playTone(987.77, 0.08, { type: 'sine', volume: 0.13 });
    this.playTone(1318.51, 0.18, { type: 'sine', volume: 0.14, delay: 0.065 });
  }

  public playSleepLullaby() {
    if (!this.sfxEnabled) return;
    const notes = [523.25, 440.0, 392.0, 329.63];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.38, { type: 'sine', volume: 0.1, delay: idx * 0.22 });
    });
  }

  public playMakeupSparkle() {
    if (!this.sfxEnabled) return;
    const notes = [880, 1174.66, 1396.91, 1760];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.14, { type: 'sine', volume: 0.1, delay: idx * 0.045, slideToFreq: n * 1.05 });
    });
  }

  public playOutfitChange() {
    if (!this.sfxEnabled) return;
    this.playTone(440, 0.12, { type: 'triangle', volume: 0.12, slideToFreq: 659.25 });
    this.playTone(659.25, 0.18, { type: 'sine', volume: 0.13, delay: 0.08, slideToFreq: 987.77 });
  }

  public playCatMeow(stage = 1) {
    if (!this.sfxEnabled) return;
    const base = stage === 1 ? 840 : stage === 2 ? 680 : 540;
    this.playTone(base, 0.14, { type: 'triangle', volume: 0.13, slideToFreq: base * 1.28 });
    this.playTone(base * 1.22, 0.22, {
      type: 'sine',
      volume: 0.12,
      delay: 0.12,
      slideToFreq: base * 0.86,
    });
  }

  public playPetFeed() {
    if (!this.sfxEnabled) return;
    [523.25, 659.25, 783.99].forEach((n, idx) => {
      this.playTone(n, 0.12, { type: 'triangle', volume: 0.12, delay: idx * 0.07 });
    });
  }

  public playPetDrink() {
    if (!this.sfxEnabled) return;
    this.playTone(740, 0.11, { type: 'sine', volume: 0.11, slideToFreq: 1046.5 });
    this.playTone(987.77, 0.14, { type: 'sine', volume: 0.11, delay: 0.08, slideToFreq: 1318.51 });
  }

  public playTurboBoost() {
    if (!this.sfxEnabled) return;
    this.playTone(220, 0.28, { type: 'sawtooth', volume: 0.1, slideToFreq: 760 });
    this.playTone(587.33, 0.24, { type: 'triangle', volume: 0.12, delay: 0.06, slideToFreq: 1174.66 });
  }

  public playTelescopeSparkle() {
    if (!this.sfxEnabled) return;
    const notes = [659.25, 880, 1174.66, 1567.98, 1975.53];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.22, { type: 'sine', volume: 0.1, delay: idx * 0.07 });
    });
  }

  public updateCarEngineSound(speedRatio: number, isDriving: boolean) {
    if (!isDriving || !this.sfxEnabled) {
      this.stopCarEngineSound();
      return;
    }
    const ctx = this.ensureContext();
    if (!ctx) return;

    if (!this.engineOsc || !this.engineGain || !this.engineFilter) {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(62, ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(170, ctx.currentTime);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      this.engineOsc = osc;
      this.engineFilter = filter;
      this.engineGain = gain;
    }

    const clamped = Math.max(0, Math.min(1, speedRatio));
    const now = ctx.currentTime;
    this.engineOsc.frequency.setTargetAtTime(58 + clamped * 68, now, 0.06);
    this.engineFilter.frequency.setTargetAtTime(140 + clamped * 160, now, 0.06);
    this.engineGain.gain.setTargetAtTime(0.015 + clamped * 0.025, now, 0.06);
  }

  public stopCarEngineSound() {
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      } catch {
        // Ignore already-stopped oscillator
      }
    }
    if (this.engineFilter) {
      try {
        this.engineFilter.disconnect();
      } catch {
        // Ignore
      }
    }
    if (this.engineGain) {
      try {
        this.engineGain.disconnect();
      } catch {
        // Ignore
      }
    }
    this.engineOsc = null;
    this.engineFilter = null;
    this.engineGain = null;
  }
}

export const soundEngine = new MagicalSoundEngine();
