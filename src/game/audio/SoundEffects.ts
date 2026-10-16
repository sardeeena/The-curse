// Procedural Web Audio API sound synthesis - zero external audio dependencies
export class SoundEffects {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private ambientOsc1: OscillatorNode | null = null;
  private ambientOsc2: OscillatorNode | null = null;
  private chaseOsc: OscillatorNode | null = null;
  private chaseGain: GainNode | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.7;
  private lastHeartbeatTime: number = 0;

  constructor() {
    // AudioContext is initialized on first user interaction to comply with browser autoplay policies
  }

  public init() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume * 0.16, this.ctx.currentTime);
    }
    if (this.chaseGain && this.ctx) {
      this.chaseGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume * 0.22, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.setVolume(this.volume);
    return this.isMuted;
  }

  public startAtmosphere() {
    this.init();
    if (!this.ctx || this.ambientOsc1) return;

    try {
      const t = this.ctx.currentTime;
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume * 0.16, t);
      this.ambientGain.connect(this.ctx.destination);

      // Low tomb drone
      this.ambientOsc1 = this.ctx.createOscillator();
      this.ambientOsc1.type = 'sawtooth';
      this.ambientOsc1.frequency.setValueAtTime(45, t); // deep 45Hz drone

      // Lowpass filter for muffled subterranean rumble
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, t);

      this.ambientOsc1.connect(filter);

      // Second eerie resonant layer
      this.ambientOsc2 = this.ctx.createOscillator();
      this.ambientOsc2.type = 'sine';
      this.ambientOsc2.frequency.setValueAtTime(68, t); // mystical dissonance

      const filter2 = this.ctx.createBiquadFilter();
      filter2.type = 'bandpass';
      filter2.frequency.setValueAtTime(180, t);
      filter2.Q.setValueAtTime(3.0, t);

      this.ambientOsc2.connect(filter2);
      filter.connect(this.ambientGain);
      filter2.connect(this.ambientGain);

      this.ambientOsc1.start();
      this.ambientOsc2.start();
    } catch {
      // Audio autoplay may be blocked until user gesture
    }
  }

  public setChaseTension(active: boolean) {
    if (this.isMuted || !this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      if (active) {
        if (!this.chaseOsc) {
          this.chaseGain = this.ctx.createGain();
          this.chaseGain.gain.setValueAtTime(0, t);
          this.chaseGain.gain.linearRampToValueAtTime(this.volume * 0.22, t + 0.8);
          this.chaseGain.connect(this.ctx.destination);

          this.chaseOsc = this.ctx.createOscillator();
          this.chaseOsc.type = 'sawtooth';
          this.chaseOsc.frequency.setValueAtTime(85, t);
          this.chaseOsc.frequency.linearRampToValueAtTime(115, t + 2.0);

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(320, t);

          this.chaseOsc.connect(filter);
          filter.connect(this.chaseGain);
          this.chaseOsc.start();
        }
      } else {
        if (this.chaseGain && this.chaseOsc) {
          this.chaseGain.gain.linearRampToValueAtTime(0.001, t + 1.2);
          const oldOsc = this.chaseOsc;
          setTimeout(() => {
            try {
              oldOsc.stop();
              oldOsc.disconnect();
            } catch {
              // ignore
            }
          }, 1300);
          this.chaseOsc = null;
          this.chaseGain = null;
        }
      }
    } catch {
      // ignore
    }
  }

  public stopAtmosphere() {
    this.setChaseTension(false);
    if (this.ambientOsc1) {
      try {
        this.ambientOsc1.stop();
        this.ambientOsc1.disconnect();
      } catch {
        // ignore
      }
      this.ambientOsc1 = null;
    }
    if (this.ambientOsc2) {
      try {
        this.ambientOsc2.stop();
        this.ambientOsc2.disconnect();
      } catch {
        // ignore
      }
      this.ambientOsc2 = null;
    }
  }

  public playFootstep() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Stone step thud
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(80 + Math.random() * 20, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.08);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, t);

      const stepVolume = (this.volume * 0.25) * (0.85 + Math.random() * 0.3);
      gain.gain.setValueAtTime(stepVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.1);
    } catch {
      // Ignore
    }
  }

  public playGuardianStep(distance: number) {
    if (this.isMuted || distance > 26) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      // Proximity-scaled volume: loud when close (<5m), muffled when far
      const distRatio = Math.max(0, 1 - distance / 26);
      const stepVol = this.volume * 0.65 * (distRatio * distRatio);

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Heavy monstrous stone thud
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(65, t);
      osc.frequency.exponentialRampToValueAtTime(22, t + 0.18);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140 + distRatio * 180, t);

      gain.gain.setValueAtTime(stepVol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.22);
    } catch {
      // Ignore
    }
  }

  public playGuardianRoar(distance: number) {
    if (this.isMuted || distance > 32) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const distRatio = Math.max(0.1, 1 - distance / 32);

      const osc = this.ctx.createOscillator();
      const mod = this.ctx.createOscillator();
      const modGain = this.ctx.createGain();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // FM synthesis demonic throat groan
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.linearRampToValueAtTime(65, t + 0.9);

      mod.type = 'sine';
      mod.frequency.setValueAtTime(32, t);
      modGain.gain.setValueAtTime(80, t);
      mod.connect(osc.frequency);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(280, t);
      filter.Q.setValueAtTime(4, t);

      gain.gain.setValueAtTime(this.volume * 0.5 * distRatio, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      mod.start(t);
      osc.stop(t + 1.2);
      mod.stop(t + 1.2);
    } catch {
      // Ignore
    }
  }

  public playPlayerHurt() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Pain impact thud
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(130, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.25);

      gain.gain.setValueAtTime(this.volume * 0.75, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.3);
    } catch {
      // Ignore
    }
  }

  public playHeartbeat(now: number, urgency: number) {
    if (this.isMuted) return;
    // Limit heartbeat frequency based on urgency (0 = calm ~1.2s, 1 = terrified ~0.55s)
    const interval = 1.3 - urgency * 0.75;
    if (now - this.lastHeartbeatTime < interval) return;
    this.lastHeartbeatTime = now;

    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      // Double thump: "lub-DUB"
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(65, t);
      osc1.frequency.exponentialRampToValueAtTime(35, t + 0.08);
      gain1.gain.setValueAtTime(this.volume * 0.45 * (0.6 + urgency * 0.4), t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(t);
      osc1.stop(t + 0.12);

      // Second beat 140ms later
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(75, t + 0.14);
      osc2.frequency.exponentialRampToValueAtTime(40, t + 0.24);
      gain2.gain.setValueAtTime(this.volume * 0.6 * (0.6 + urgency * 0.4), t + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(t + 0.14);
      osc2.stop(t + 0.28);
    } catch {
      // Ignore
    }
  }

  public playJumpscareSting() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      // Dissonant screeching horror cluster
      const freqs = [587.33, 622.25, 830.61, 987.77];
      freqs.forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.7, t + 0.6);

        gain.gain.setValueAtTime(this.volume * 0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(t);
        osc.stop(t + 0.75);
      });
    } catch {
      // Ignore
    }
  }

  public playPuzzleClick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(380, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.08);

      gain.gain.setValueAtTime(this.volume * 0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
    } catch {
      // Ignore
    }
  }

  public playPuzzleSuccess() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      // Royal Egyptian chord progression (D minor pentatonic chime)
      const notes = [293.66, 349.23, 440.0, 523.25, 698.46];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const startTime = t + idx * 0.12;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(this.volume * 0.35, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.85);
      });
    } catch {
      // Ignore
    }
  }

  public playGameOverSound() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.linearRampToValueAtTime(32, t + 2.5);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, t);

      gain.gain.setValueAtTime(this.volume * 0.6, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 3.0);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 3.2);
    } catch {
      // Ignore
    }
  }

  public playFlashlightClick(isOn: boolean) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isOn ? 1800 : 1200, t);
      osc.frequency.exponentialRampToValueAtTime(isOn ? 900 : 600, t + 0.04);

      gain.gain.setValueAtTime(this.volume * 0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.06);
    } catch {
      // Ignore
    }
  }

  public playPickup() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(440, t);
      osc1.frequency.exponentialRampToValueAtTime(880, t + 0.15);
      osc1.frequency.exponentialRampToValueAtTime(1320, t + 0.35);

      osc2.frequency.setValueAtTime(554.37, t);
      osc2.frequency.exponentialRampToValueAtTime(1108.73, t + 0.2);

      gain.gain.setValueAtTime(this.volume * 0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.65);
      osc2.stop(t + 0.65);
    } catch {
      // Ignore
    }
  }

  public playStoneGrind() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.8;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(180, t);
      filter.Q.setValueAtTime(4.0, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(this.volume * 0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(t);
      noise.stop(t + 0.85);
    } catch {
      // Ignore
    }
  }

  public playBatteryPickup() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, t);
      osc.frequency.exponentialRampToValueAtTime(1040, t + 0.12);

      gain.gain.setValueAtTime(this.volume * 0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.26);
    } catch {
      // Ignore
    }
  }

  public playWhisperEcho() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 1.2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(650, t);
      filter.frequency.exponentialRampToValueAtTime(350, t + 1.1);
      filter.Q.setValueAtTime(6.0, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(this.volume * 0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.15);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(t);
      noise.stop(t + 1.2);
    } catch {
      // Ignore
    }
  }

  public dispose() {
    this.stopAtmosphere();
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {
        // Ignore
      }
      this.ctx = null;
    }
  }
}

export const soundManager = new SoundEffects();
