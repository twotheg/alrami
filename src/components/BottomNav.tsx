"use client";

import { Calendar, Bell, Settings as SettingsIcon } from "lucide-react";

interface Props {
  active: "calendar" | "alarms" | "settings";
  onChange: (tab: "calendar" | "alarms" | "settings") => void;
}

export default function BottomNav({ active, onChange }: Props) {
  const items = [
    { id: "calendar" as const, label: "달력", icon: Calendar },
    { id: "alarms" as const, label: "알람", icon: Bell },
    { id: "settings" as const, label: "설정", icon: SettingsIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200">
      <div className="max-w-md mx-auto grid grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`flex flex-col items-center gap-0.5 py-2.5 transition ${
                isActive ? "text-[#FF7A59]" : "text-slate-500"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[11px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
