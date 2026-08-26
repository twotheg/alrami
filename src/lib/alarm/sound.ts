"use client";

// Web Audio API로 벨소리 합성
let audioCtx: AudioContext | null = null;
let currentOscillators: OscillatorNode[] = [];
let currentGainNodes: GainNode[] = [];
let currentInterval: number | null = null;
let currentVolume = 1;

function getCtx(): AudioContext {
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function beep(
  ctx: AudioContext,
  freq: number,
  duration: number,
  startAt: number,
  type: OscillatorType = "sine",
  gain = 0.4
) {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startAt);

  const finalGain = gain * currentVolume;
  gainNode.gain.setValueAtTime(0, startAt);
  gainNode.gain.linearRampToValueAtTime(finalGain, startAt + 0.01);
  gainNode.gain.linearRampToValueAtTime(finalGain, startAt + duration - 0.05);
  gainNode.gain.linearRampToValueAtTime(0, startAt + duration);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration);
  currentOscillators.push(osc);
  currentGainNodes.push(gainNode);
}

export function stopAll() {
  currentOscillators.forEach((o) => {
    try {
      o.stop();
    } catch {}
  });
  currentOscillators = [];
  currentGainNodes = [];
  if (currentInterval) {
    clearInterval(currentInterval);
    currentInterval = null;
  }
}

export function setAlarmVolume(volume: number) {
  currentVolume = Math.max(0, Math.min(1, volume));
}

export function getAlarmVolume(): number {
  return currentVolume;
}

export function playSound(soundId: string, volume?: number) {
  if (volume !== undefined) setAlarmVolume(volume);
  stopAll();
  const ctx = getCtx();

  const playOneCycle = (start: number) => {
    switch (soundId) {
      case "beep": {
        for (let i = 0; i < 3; i++) {
          beep(ctx, 880, 0.12, start + i * 0.15, "square", 0.3);
        }
        return 0.9;
      }
      case "chime": {
        beep(ctx, 523.25, 0.4, start, "sine", 0.35);
        beep(ctx, 659.25, 0.4, start + 0.3, "sine", 0.35);
        beep(ctx, 783.99, 0.4, start + 0.6, "sine", 0.35);
        beep(ctx, 1046.5, 0.8, start + 0.9, "sine", 0.35);
        return 2.2;
      }
      case "bell": {
        beep(ctx, 987.77, 0.5, start, "triangle", 0.4);
        beep(ctx, 1318.51, 0.7, start + 0.5, "triangle", 0.3);
        return 1.5;
      }
      case "rooster": {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(300, start);
        osc.frequency.linearRampToValueAtTime(800, start + 0.3);
        osc.frequency.linearRampToValueAtTime(500, start + 0.6);
        const finalGain = 0.3 * currentVolume;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(finalGain, start + 0.05);
        gain.gain.linearRampToValueAtTime(finalGain, start + 0.5);
        gain.gain.linearRampToValueAtTime(0, start + 0.7);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.7);
        currentOscillators.push(osc);
        currentGainNodes.push(gain);
        return 1.2;
      }
      case "digital": {
        for (let i = 0; i < 4; i++) {
          beep(ctx, 1200, 0.08, start + i * 0.15, "square", 0.25);
        }
        return 1.0;
      }
      default:
        return playOneCycle(0);
    }
  };

  let offset = ctx.currentTime;
  for (let i = 0; i < 30; i++) {
    const dur = playOneCycle(offset);
    offset += dur;
  }
}
