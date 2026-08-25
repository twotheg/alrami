export interface Alarm {
  id: string;
  label: string;
  hour: number; // 0-23
  minute: number; // 0-59
  enabled: boolean;
  weekdays: number[]; // 0=일, 1=월 ... 6=토 (비어있으면 오늘/다음 한번만)
  skipHolidays: boolean;
  sound: string; // sound id
  vibrate?: boolean;
  lastTriggered?: string; // ISO date string of last fire
}

export interface SoundOption {
  id: string;
  name: string;
  type: "beep" | "chime" | "bell" | "rooster" | "digital";
}

export const SOUND_OPTIONS: SoundOption[] = [
  { id: "beep", name: "기본 삐소리", type: "beep" },
  { id: "chime", name: "차임벨", type: "chime" },
  { id: "bell", name: "종소리", type: "bell" },
  { id: "rooster", name: "닭 우는 소리", type: "rooster" },
  { id: "digital", name: "디지털 알람", type: "digital" },
];
