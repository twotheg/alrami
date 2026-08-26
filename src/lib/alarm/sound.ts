"use client";

// Web Audio API로 여러 벨소리 합성
let audioCtx: AudioContext | null = null;
let currentOscillators: OscillatorNode[] = [];
let currentInterval: number | null = null;

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
  gainNode.gain.setValueAtTime(0, startAt);
  gainNode.gain.linearRampToValueAtTime(gain, startAt + 0.01);
  gainNode.gain.linearRampToValueAtTime(gain, startAt + duration - 0.05);
  gainNode.gain.linearRampToValueAtTime(0, startAt + duration);
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration);
  currentOscillators.push(osc);
}

function playPattern(pattern: (ctx: AudioContext, start: number) => number) {
  const ctx = getCtx();
  stopAll();
  let offset = ctx.currentTime;
  // 10초간 반복
  for (let i = 0; i < 30; i++) {
    const dur = pattern(ctx, offset);
    offset += dur;
  }
}

export function stopAll() {
  currentOscillators.forEach((o) => {
    try {
      o.stop();
    } catch {}
  });
  currentOscillators = [];
  if (currentInterval) {
    clearInterval(currentInterval);
    currentInterval = null;
  }
}

export function playSound(soundId: string) {
  stopAll();
  const ctx = getCtx();

  switch (soundId) {
    case "beep": {
      // 빠른 삐삐삐
      playPattern((c, start) => {
        beep(c, 880, 0.12, start, "square", 0.3);
        beep(c, 880, 0.12, start + 0.15, "square", 0.3);
        beep(c, 880, 0.12, start + 0.3, "square", 0.3);
        return 0.9;
      });
      break;
    }
    case "chime": {
      // 부드러운 차임 (C-E-G-C 상행 아르페지오)
      playPattern((c, start) => {
        beep(c, 523.25, 0.4, start, "sine", 0.35); // C5
        beep(c, 659.25, 0.4, start + 0.3, "sine", 0.35); // E5
        beep(c, 783.99, 0.4, start + 0.6, "sine", 0.35); // G5
        beep(c, 1046.5, 0.8, start + 0.9, "sine", 0.35); // C6
        return 2.2;
      });
      break;
    }
    case "bell": {
      // 전통적인 종소리 (두 가지 음이 번갈아)
      playPattern((c, start) => {
        beep(c, 987.77, 0.5, start, "triangle", 0.4); // B5
        beep(c, 1318.51, 0.7, start + 0.5, "triangle", 0.3); // E6
        return 1.5;
      });
      break;
    }
    case "rooster": {
      // 닭 우는 소리 흉내 (피치가 올라가는 톤)
      playPattern((c, start) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(300, start);
        osc.frequency.linearRampToValueAtTime(800, start + 0.3);
        osc.frequency.linearRampToValueAtTime(500, start + 0.6);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.3, start + 0.05);
        gain.gain.linearRampToValueAtTime(0.3, start + 0.5);
        gain.gain.linearRampToValueAtTime(0, start + 0.7);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(start);
        osc.stop(start + 0.7);
        currentOscillators.push(osc);
        return 1.2;
      });
      break;
    }
    case "digital": {
      // 디지털 알람 - 높고 거친 삐
      playPattern((c, start) => {
        for (let i = 0; i < 4; i++) {
          beep(c, 1200, 0.08, start + i * 0.15, "square", 0.25);
        }
        return 1.0;
      });
      break;
    }
    default:
      playSound("beep");
  }
}
