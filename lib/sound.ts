'use client';

// Web Audio API를 사용한 사운드 생성 (파일 없이)
export class SoundEffects {
  private audioContext: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioContextClass();
    }
  }

  // 포탄 발사 소리 (대포 발사음) - 개선된 버전
  playCannonFire() {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // 1. 강력한 저음 폭발음 (메인 붐)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const filter1 = ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(120, now);
    osc1.frequency.exponentialRampToValueAtTime(40, now + 0.08);
    osc1.frequency.exponentialRampToValueAtTime(20, now + 0.2);

    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(400, now);
    filter1.Q.setValueAtTime(2, now);

    gain1.gain.setValueAtTime(0.7, now);
    gain1.gain.exponentialRampToValueAtTime(0.3, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.2);

    // 2. 중음역 펀치 사운드
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(200, now);
    osc2.frequency.exponentialRampToValueAtTime(80, now + 0.1);

    gain2.gain.setValueAtTime(0.4, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now);
    osc2.stop(now + 0.1);

    // 3. 화이트 노이즈 (폭발 충격파) - 더 강하게
    this.playWhiteNoise(now, 0.12, 0.5);

    // 4. 짧은 고음 클릭 (대포 메커니즘 소리)
    this.playWhiteNoise(now, 0.02, 0.3);
  }

  // 공기 저항 바람 소리 (포탄이 날아갈 때) - 개선된 로켓 사운드
  playWindWhoosh(duration: number) {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // 1. 메인 바람 소리 (화이트 노이즈 필터링)
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // 화이트 노이즈 생성
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gainNode = ctx.createGain();

    source.buffer = buffer;

    // 밴드패스 필터로 더 리얼한 바람 소리
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(600, now + duration);
    filter.Q.setValueAtTime(3, now);

    // 볼륨 페이드 (시작 강하게 → 점점 약하게)
    gainNode.gain.setValueAtTime(0.25, now);
    gainNode.gain.linearRampToValueAtTime(0.15, now + duration * 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(now);
    source.stop(now + duration);

    // 2. 로켓 엔진 소리 (저주파 럼블)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    const oscFilter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, now);
    osc.frequency.linearRampToValueAtTime(80, now + duration * 0.5);
    osc.frequency.linearRampToValueAtTime(50, now + duration);

    oscFilter.type = 'lowpass';
    oscFilter.frequency.setValueAtTime(300, now);
    oscFilter.Q.setValueAtTime(2, now);

    oscGain.gain.setValueAtTime(0.15, now);
    oscGain.gain.linearRampToValueAtTime(0.1, now + duration * 0.5);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.connect(oscFilter);
    oscFilter.connect(oscGain);
    oscGain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);

    // 3. 고주파 휘파람 소리 (날카로운 바람 소리)
    const osc2 = ctx.createOscillator();
    const osc2Gain = ctx.createGain();

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(2500, now);
    osc2.frequency.exponentialRampToValueAtTime(1800, now + duration);

    osc2Gain.gain.setValueAtTime(0.08, now + 0.1);
    osc2Gain.gain.linearRampToValueAtTime(0.05, now + duration * 0.5);
    osc2Gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc2.connect(osc2Gain);
    osc2Gain.connect(ctx.destination);

    osc2.start(now + 0.1);
    osc2.stop(now + duration);
  }

  // 폭죽/포탄 폭발 소리 (다양한 변형) - 매우 리얼한 버전
  playExplosion(variation: number = 0) {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // 1. 초기 충격파 (매우 강한 저음 붐)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const filter1 = ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(150 + variation * 20, now);
    osc1.frequency.exponentialRampToValueAtTime(40, now + 0.1);
    osc1.frequency.exponentialRampToValueAtTime(15, now + 0.5);

    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(600, now);
    filter1.frequency.exponentialRampToValueAtTime(200, now + 0.5);
    filter1.Q.setValueAtTime(3, now);

    gain1.gain.setValueAtTime(0.8, now);
    gain1.gain.exponentialRampToValueAtTime(0.3, now + 0.1);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.5);

    // 2. 고음 폭발 (날카로운 파열음)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    const filter2 = ctx.createBiquadFilter();

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(3000 + variation * 300, now);
    osc2.frequency.exponentialRampToValueAtTime(800, now + 0.08);
    osc2.frequency.exponentialRampToValueAtTime(200, now + 0.2);

    filter2.type = 'highpass';
    filter2.frequency.setValueAtTime(1000, now);
    filter2.Q.setValueAtTime(2, now);

    gain2.gain.setValueAtTime(0.4, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc2.connect(filter2);
    filter2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now);
    osc2.stop(now + 0.2);

    // 3. 중음역 폭발 (풍부한 사운드)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();

    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(400 + variation * 50, now);
    osc3.frequency.exponentialRampToValueAtTime(100, now + 0.3);

    gain3.gain.setValueAtTime(0.5, now);
    gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc3.connect(gain3);
    gain3.connect(ctx.destination);

    osc3.start(now);
    osc3.stop(now + 0.3);

    // 4. 메인 화이트 노이즈 (초기 폭발)
    this.playWhiteNoise(now, 0.15, 0.6);

    // 5. 크래클 효과 (폭죽 튀는 소리) - 더 많이, 더 리얼하게
    for (let i = 0; i < 12; i++) {
      const delay = 0.03 + Math.random() * 0.25;
      const duration = 0.02 + Math.random() * 0.04;
      this.playWhiteNoise(now + delay, duration, 0.15 + Math.random() * 0.15);
    }

    // 6. 잔향 노이즈 (폭발 후 울림)
    this.playWhiteNoise(now + 0.2, 0.4, 0.15);

    // 7. 메탈릭 링 (폭발 후 금속성 울림)
    const ringOsc = ctx.createOscillator();
    const ringGain = ctx.createGain();

    ringOsc.type = 'sine';
    ringOsc.frequency.setValueAtTime(1200 + variation * 100, now + 0.05);
    ringOsc.frequency.exponentialRampToValueAtTime(800, now + 0.4);

    ringGain.gain.setValueAtTime(0.15, now + 0.05);
    ringGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    ringOsc.connect(ringGain);
    ringGain.connect(ctx.destination);

    ringOsc.start(now + 0.05);
    ringOsc.stop(now + 0.4);
  }

  // 화이트 노이즈 (불꽃 반짝임)
  private playWhiteNoise(startTime: number, duration: number, volume: number) {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * volume;
    }

    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();

    source.buffer = buffer;
    gainNode.gain.setValueAtTime(volume, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(startTime);
  }

  // 반짝임 소리 (작은 불꽃)
  playSparkle() {
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1200 + Math.random() * 800, now);

    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.1);
  }
}

// 싱글톤 인스턴스
let soundEffects: SoundEffects | null = null;

export function getSoundEffects(): SoundEffects {
  if (!soundEffects && typeof window !== 'undefined') {
    soundEffects = new SoundEffects();
  }
  return soundEffects!;
}
