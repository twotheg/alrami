"use client";

import { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

interface Props {
  isOpen: boolean;
  date: string | null;
  existingNote: string | null;
  onClose: () => void;
  onSave: (note: string) => void;
  onDelete: () => void;
  isPublicHoliday: boolean;
  publicHolidayName?: string;
  isSubstitute?: boolean;
}

export default function NoteModal({
  isOpen,
  date,
  existingNote,
  onClose,
  onSave,
  onDelete,
  isPublicHoliday,
  publicHolidayName,
  isSubstitute,
}: Props) {
  const [note, setNote] = useState("");

  useEffect(() => {
    setNote(existingNote || "");
  }, [existingNote, isOpen]);

  if (!isOpen || !date) return null;

  const d = parseISO(date);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-slate-400">
              {format(d, "yyyy년 M월 d일 EEEE", { locale: ko })}
            </p>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              {isPublicHoliday
                ? `${publicHolidayName}${isSubstitute ? " (대체휴일)" : ""}`
                : "내 휴일로 추가"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {isPublicHoliday ? (
          <div className="space-y-3">
            <div className="rounded-2xl bg-pink-50 border border-pink-200 p-4 text-sm text-pink-700">
              이 날은 이미 공휴일로 지정되어 있어 알람이 자동으로 OFF 됩니다.
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition"
            >
              확인
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                메모 (선택)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="예: 연차, 재택근무, 여행..."
                autoFocus
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="flex gap-2">
              {existingNote && (
                <button
                  onClick={() => {
                    onDelete();
                    onClose();
                  }}
                  className="px-4 py-3 rounded-2xl bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition"
                >
                  삭제
                </button>
              )}
              <button
                onClick={() => {
                  onSave(note || "개인 휴일");
                  onClose();
                }}
                className="flex-1 py-3 rounded-2xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                {existingNote ? "저장" : "추가"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
