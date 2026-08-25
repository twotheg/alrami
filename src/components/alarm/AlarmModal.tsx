"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { Alarm } from "@/lib/alarm/types";
import { SOUND_OPTIONS } from "@/lib/alarm/types";
import { playSound, stopAll } from "@/lib/alarm/sound";
import { formatTime } from "@/lib/alarm/scheduler";

const WEEKDAYS = [
  { idx: 0, label: "일" },
  { idx: 1, label: "월" },
  { idx: 2, label: "화" },
  { idx: 3, label: "수" },
  { idx: 4, label: "목" },
  { idx: 5, label: "금" },
  { idx: 6, label: "토" },
];

interface Props {
  isOpen: boolean;
  alarm: Alarm | null;
  onClose: () => void;
  onSave: (alarm: Alarm) => void;
  onDelete?: () => void;
}

export default function AlarmModal({ isOpen, alarm, onClose, onSave, onDelete }: Props) {
  const [hour, setHour] = useState(7);
  const [minute, setMinute] = useState(0);
  const [label, setLabel] = useState("알람");
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [skipHolidays, setSkipHolidays] = useState(true);
  const [sound, setSound] = useState("beep");
  const [vibrate, setVibrate] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [playPreview, setPlayPreview] = useState(false);

  useEffect(() => {
    if (alarm) {
      setHour(alarm.hour);
      setMinute(alarm.minute);
      setLabel(alarm.label);
      setWeekdays(alarm.weekdays);
      setSkipHolidays(alarm.skipHolidays);
      setSound(alarm.sound);
      setVibrate(alarm.vibrate ?? true);
      setEnabled(alarm.enabled);
    } else {
      setHour(7);
      setMinute(0);
      setLabel("알람");
      setWeekdays([1, 2, 3, 4, 5]);
      setSkipHolidays(true);
      setSound("beep");
      setVibrate(true);
      setEnabled(true);
    }
  }, [alarm, isOpen]);

  useEffect(() => {
    if (!playPreview) {
      stopAll();
    }
  }, [playPreview, sound]);

  useEffect(() => {
    if (playPreview) {
      playSound(sound);
      const t = setTimeout(() => setPlayPreview(false), 2000);
      return () => clearTimeout(t);
    }
  }, [playPreview, sound]);

  if (!isOpen) return null;

  const toggleWeekday = (idx: number) => {
    setWeekdays((prev) =>
      prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx]
    );
  };

  const handleSave = () => {
    stopAll();
    onSave({
      id: alarm?.id || `alarm-${Date.now()}`,
      label: label || "알람",
      hour,
      minute,
      enabled,
      weekdays,
      skipHolidays,
      sound,
      vibrate,
      lastTriggered: alarm?.lastTriggered,
    });
  };

  const handleDelete = () => {
    stopAll();
    if (onDelete) onDelete();
  };

  const presets: { label: string; value: number[] }[] = [
    { label: "주중", value: [1, 2, 3, 4, 5] },
    { label: "주말", value: [0, 6] },
    { label: "매일", value: [0, 1, 2, 3, 4, 5, 6] },
    { label: "한 번만", value: [] },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <button
            onClick={onClose}
            className="text-slate-500 font-medium px-2 py-1"
          >
            취소
          </button>
          <h3 className="font-bold text-slate-900">
            {alarm ? "알람 편집" : "알람 추가"}
          </h3>
          <button
            onClick={handleSave}
            className="text-[#FF7A59] font-semibold px-2 py-1"
          >
            저장
          </button>
        </div>

        <div className="px-5 py-6 space-y-6">
          {/* 시간 선택 휠 */}
          <div className="flex items-center justify-center gap-2 bg-slate-900 rounded-3xl py-6">
            <select
              value={hour}
              onChange={(e) => setHour(parseInt(e.target.value))}
              className="bg-transparent text-white text-5xl font-light text-center focus:outline-none appearance-none"
              style={{ width: "80px" }}
            >
              {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                <option key={h} value={h} className="text-black">
                  {h.toString().padStart(2, "0")}
                </option>
              ))}
            </select>
            <span className="text-white text-5xl font-light">:</span>
            <select
              value={minute}
              onChange={(e) => setMinute(parseInt(e.target.value))}
              className="bg-transparent text-white text-5xl font-light text-center focus:outline-none appearance-none"
              style={{ width: "80px" }}
            >
              {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                <option key={m} value={m} className="text-black">
                  {m.toString().padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>
          <p className="text-center -mt-3 text-sm text-slate-500">
            선택 시간: {formatTime(hour, minute)}
          </p>

          {/* 레이블 */}
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">레이블</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="예: 기상, 회의, 병원..."
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base focus:border-[#FF7A59] focus:outline-none focus:ring-2 focus:ring-[#FF7A59]/30"
            />
          </div>

          {/* 반복 요일 */}
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-2 block">반복</label>
            <div className="flex gap-1.5 mb-2">
              {WEEKDAYS.map((d) => {
                const selected = weekdays.includes(d.idx);
                return (
                  <button
                    key={d.idx}
                    type="button"
                    onClick={() => toggleWeekday(d.idx)}
                    className={[
                      "flex-1 aspect-square rounded-full text-sm font-semibold transition active:scale-95",
                      selected
                        ? "bg-[#FF7A59] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                    ].join(" ")}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 flex-wrap">
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setWeekdays(p.value)}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* 공휴일 스킵 토글 */}
          <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 cursor-pointer">
            <div>
              <p className="font-semibold text-slate-800 text-sm">공휴일 · 대체휴일 · 내 휴일</p>
              <p className="text-xs text-slate-500 mt-0.5">
                휴일로 지정된 날에는 알람이 울리지 않아요.
              </p>
            </div>
            <input
              type="checkbox"
              checked={skipHolidays}
              onChange={(e) => setSkipHolidays(e.target.checked)}
              className="sr-only peer"
            />
            <div className="relative w-12 h-7 bg-slate-300 peer-checked:bg-green-500 rounded-full transition-colors">
              <div
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  skipHolidays ? "translate-x-5" : ""
                }`}
              />
            </div>
          </label>

          {/* 벨소리 */}
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-2 block">벨소리</label>
            <div className="space-y-1">
              {SOUND_OPTIONS.map((s) => {
                const selected = sound === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSound(s.id)}
                    className={[
                      "w-full flex items-center justify-between px-4 py-3 rounded-2xl text-left transition",
                      selected ? "bg-[#fff4f0] border border-[#FF7A59]/30" : "bg-slate-50",
                    ].join(" ")}
                  >
                    <span className="font-medium text-slate-800 text-sm">{s.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSound(s.id);
                        setPlayPreview(true);
                      }}
                      className="text-xs text-[#FF7A59] font-semibold px-2 py-1 rounded-full bg-white"
                    >
                      미리듣기
                    </button>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 진동 */}
          <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 cursor-pointer">
            <p className="font-semibold text-slate-800 text-sm">진동</p>
            <input
              type="checkbox"
              checked={vibrate}
              onChange={(e) => setVibrate(e.target.checked)}
              className="sr-only peer"
            />
            <div className="relative w-12 h-7 bg-slate-300 peer-checked:bg-green-500 rounded-full transition-colors">
              <div
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  vibrate ? "translate-x-5" : ""
                }`}
              />
            </div>
          </label>

          {/* 활성화 */}
          <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 cursor-pointer">
            <p className="font-semibold text-slate-800 text-sm">활성화</p>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="relative w-12 h-7 bg-slate-300 peer-checked:bg-green-500 rounded-full transition-colors">
              <div
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  enabled ? "translate-x-5" : ""
                }`}
              />
            </div>
          </label>

          {alarm && onDelete && (
            <button
              onClick={handleDelete}
              className="w-full py-3 rounded-2xl bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition"
            >
              알람 삭제
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
