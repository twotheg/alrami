"use client";

import { useState } from "react";
import { Plus, Bell } from "lucide-react";
import type { Alarm } from "@/lib/alarm/types";
import { formatTime, formatWeekdays } from "@/lib/alarm/scheduler";
import AlarmModal from "./AlarmModal";

interface Props {
  alarms: Alarm[];
  onSave: (alarm: Alarm) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

export default function AlarmList({ alarms, onSave, onDelete, onToggle }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Alarm | null>(null);

  const handleNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (alarm: Alarm) => {
    setEditing(alarm);
    setModalOpen(true);
  };

  const handleSave = (alarm: Alarm) => {
    onSave(alarm);
    setModalOpen(false);
    setEditing(null);
  };

  const handleDelete = () => {
    if (editing) {
      onDelete(editing.id);
      setModalOpen(false);
      setEditing(null);
    }
  };

  const sorted = [...alarms].sort((a, b) => {
    const aMin = a.hour * 60 + a.minute;
    const bMin = b.hour * 60 + b.minute;
    return aMin - bMin;
  });

  return (
    <div className="p-5 space-y-4">
      <div className="rounded-3xl bg-white p-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">내 알람</h2>
          <span className="text-xs text-slate-500">{alarms.length}개</span>
        </div>
        {sorted.length === 0 ? (
          <div className="py-8 text-center">
            <div className="p-4 bg-slate-50 rounded-full inline-block mb-3">
              <Bell className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-sm text-slate-400">아직 등록된 알람이 없어요.</p>
            <p className="text-xs text-slate-400 mt-1">+ 버튼을 눌러 알람을 추가해보세요.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {sorted.map((alarm) => (
              <li
                key={alarm.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition cursor-pointer"
                onClick={() => handleEdit(alarm)}
              >
                <div>
                  <p
                    className={`text-4xl font-light tracking-tight ${
                      alarm.enabled ? "text-slate-900" : "text-slate-400"
                    }`}
                  >
                    {formatTime(alarm.hour, alarm.minute)}
                  </p>
                  <p
                    className={`text-sm mt-0.5 ${
                      alarm.enabled ? "text-slate-600" : "text-slate-400"
                    }`}
                  >
                    {alarm.label} · {formatWeekdays(alarm.weekdays)}
                    {alarm.skipHolidays && (
                      <span className="ml-1.5 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">
                        휴일 스킵
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(alarm.id);
                  }}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    alarm.enabled ? "bg-green-500" : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-7 h-7 bg-white rounded-full shadow transition-transform ${
                      alarm.enabled ? "translate-x-6" : ""
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl bg-blue-50 p-4 text-xs text-blue-800 space-y-1">
        <p className="font-semibold">💡 안내</p>
        <p>• 앱이 열려있거나 홈 화면에 추가되어 있을 때 정확한 시간에 알람이 울려요.</p>
        <p>• 휴일 스킵을 켜면 공휴일/대체휴일/내 휴일에는 알람이 자동으로 건너뛰어집니다.</p>
      </div>

      <button
        onClick={handleNew}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#FF7A59] hover:bg-[#e86a4c] text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition z-30"
        style={{ right: "max(1.25rem, calc(50% - 14rem))", bottom: "5.5rem" }}
      >
        <Plus className="w-6 h-6" />
      </button>

      <AlarmModal
        isOpen={modalOpen}
        alarm={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
