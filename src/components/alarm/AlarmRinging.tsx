"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, Moon, Sun } from "lucide-react";
import type { Alarm } from "@/lib/alarm/types";
import { playSound, stopAll } from "@/lib/alarm/sound";

interface Props {
  alarm: Alarm;
  onDismiss: (snooze: boolean) => void;
}

export default function AlarmRinging({ alarm, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    playSound(alarm.sound);
    if (alarm.vibrate && "vibrate" in navigator) {
      try {
        navigator.vibrate?.([500, 200, 500, 200, 1000]);
      } catch {}
    }

    return () => stopAll();
  }, [alarm.id]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col bg-gradient-to-b from-[#FF7A59] via-[#ff5e3a] to-[#c0392b] text-white transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="mb-8 p-6 bg-white/20 rounded-full animate-pulse">
          <BellRing className="w-20 h-20 text-white" />
        </div>
        <p className="text-lg opacity-80 mb-2">
          {alarm.hour.toString().padStart(2, "0")}:
          {alarm.minute.toString().padStart(2, "0")}
        </p>
        <h1 className="text-3xl font-bold mb-4">{alarm.label}</h1>
        <p className="text-base opacity-70">
          좋은 아침이에요! 알람이 울리고 있습니다 🔔
        </p>
      </div>

      <div className="px-6 pb-10 space-y-3">
        <button
          onClick={() => onDismiss(false)}
          className="w-full py-5 rounded-3xl bg-white text-slate-900 font-bold text-lg hover:bg-slate-100 active:scale-95 transition flex items-center justify-center gap-2"
        >
          <Sun className="w-5 h-5" />
          해제
        </button>
        <button
          onClick={() => onDismiss(true)}
          className="w-full py-5 rounded-3xl bg-white/10 backdrop-blur text-white font-bold text-lg hover:bg-white/20 active:scale-95 transition flex items-center justify-center gap-2"
        >
          <Moon className="w-5 h-5" />
          5분 미루기
        </button>
      </div>
    </div>
  );
}
