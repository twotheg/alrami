"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import Calendar from "@/components/Calendar";
import InstallPrompt from "@/components/InstallPrompt";
import NoteModal from "@/components/NoteModal";
import BottomNav from "@/components/BottomNav";
import AlarmList from "@/components/alarm/AlarmList";
import AlarmRinging from "@/components/alarm/AlarmRinging";
import Settings from "@/components/Settings";
import { useLocalStorage } from "@/lib/hooks";
import { registerServiceWorker } from "@/lib/register-sw";
import { useAlarms, setGlobalSkipDates } from "@/lib/alarm/useAlarms";
import { CalendarDays, ChevronDown } from "lucide-react";

interface Holiday {
  date: string;
  name: string;
  isSubstitute: boolean;
}

interface UserHoliday {
  id?: number;
  date: string;
  note: string | null;
}

export default function Home() {
  const [userId] = useLocalStorage<string>("alrami-user-id", "");
  const setUserId = useLocalStorage<string>("alrami-user-id", "")[1];
  const [activeTab, setActiveTab] = useState<
    "calendar" | "alarms" | "settings"
  >("alarms");

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [holidayMonthFilter, setHolidayMonthFilter] = useState<number>(
    new Date().getMonth() + 1
  );
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [userHolidays, setUserHolidays] = useState<UserHoliday[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const {
    alarms,
    firing,
    saveAlarm,
    deleteAlarm,
    toggleAlarm,
    dismissFiring,
  } = useAlarms();

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    if (!userId && typeof window !== "undefined") {
      setUserId(crypto.randomUUID());
    }
  }, [userId, setUserId]);

  const fetchHolidays = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/holidays?year=${currentYear}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load holidays");
      setHolidays(data.holidays || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentYear]);

  const fetchUserHolidays = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/user/holidays?userId=${userId}&country=KR`);
      const data = await res.json();
      if (res.ok) setUserHolidays(data.holidays || []);
    } catch (err) {
      console.error("Failed to load user holidays:", err);
    }
  }, [userId]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  useEffect(() => {
    fetchUserHolidays();
  }, [fetchUserHolidays]);

  useEffect(() => {
    const skipDates = new Set<string>();
    holidays.forEach((h) => skipDates.add(h.date));
    userHolidays.forEach((h) => skipDates.add(h.date));
    setGlobalSkipDates(Array.from(skipDates));
  }, [holidays, userHolidays]);

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setModalOpen(true);
  };

  const handleSaveHoliday = async (note: string) => {
    if (!userId || !selectedDate) return;
    try {
      await fetch("/api/user/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          countryCode: "KR",
          date: selectedDate,
          note,
        }),
      });
      await fetchUserHolidays();
      setMessage("내 휴일로 추가했어요.");
      setTimeout(() => setMessage(null), 2000);
    } catch (err) {
      setMessage("추가 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteHoliday = async () => {
    if (!userId || !selectedDate) return;
    try {
      await fetch("/api/user/holidays", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          countryCode: "KR",
          date: selectedDate,
        }),
      });
      await fetchUserHolidays();
      setMessage("내 휴일을 제거했어요.");
      setTimeout(() => setMessage(null), 2000);
    } catch (err) {
      setMessage("삭제 중 오류가 발생했습니다.");
    }
  };

  const selectedPublicHoliday = useMemo(() => {
    if (!selectedDate) return null;
    return holidays.find((h) => h.date === selectedDate) || null;
  }, [selectedDate, holidays]);

  const selectedUserHoliday = useMemo(() => {
    if (!selectedDate) return null;
    return userHolidays.find((h) => h.date === selectedDate) || null;
  }, [selectedDate, userHolidays]);

  const filteredHolidays = useMemo(() => {
    return holidays
      .filter((h) => {
        const m = parseISO(h.date).getMonth() + 1;
        return m === holidayMonthFilter;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [holidays, holidayMonthFilter]);

  return (
    <main className="max-w-md mx-auto min-h-screen bg-slate-50 pb-20">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100 px-5 py-3.5">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FF7A59] flex items-center justify-center">
              <span className="text-white text-sm">🔔</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900">알라미</h1>
          </div>
        </div>
      </header>

      {activeTab === "calendar" && (
        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-slate-400" />
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value, 10))}
                className="bg-transparent font-semibold text-slate-700 focus:outline-none"
              >
                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y}>
                    {y}년
                  </option>
                ))}
              </select>
            </div>
            {loading && (
              <span className="text-xs text-slate-400">불러오는 중...</span>
            )}
          </div>

          {error && (
            <div className="rounded-2xl bg-red-50 text-red-600 text-sm p-4">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-2xl bg-[#FF7A59]/10 text-[#FF7A59] text-sm p-3 text-center font-medium">
              {message}
            </div>
          )}

          <Calendar
            countryCode="KR"
            baseYear={currentYear}
            holidays={holidays}
            userHolidays={userHolidays}
            onDateClick={handleDateClick}
            loading={loading}
          />

          <div className="rounded-3xl bg-white p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800">공휴일</h3>
              <div className="relative">
                <select
                  value={holidayMonthFilter}
                  onChange={(e) =>
                    setHolidayMonthFilter(parseInt(e.target.value, 10))
                  }
                  className="appearance-none rounded-full bg-slate-100 pl-3 pr-8 py-1.5 text-sm font-semibold text-slate-700 focus:outline-none"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {m}월
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              </div>
            </div>
            {filteredHolidays.length === 0 ? (
              <p className="text-sm text-slate-400 py-2">
                {holidayMonthFilter}월에는 공휴일이 없습니다.
              </p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-auto">
                {filteredHolidays.map((h, idx) => (
                  <li
                    key={`${h.date}-${h.name}-${idx}`}
                    className={`flex items-center justify-between text-sm p-3 rounded-xl ${
                      h.isSubstitute
                        ? "bg-orange-50 text-orange-800"
                        : "bg-pink-50 text-pink-800"
                    }`}
                  >
                    <span className="font-medium">
                      {h.isSubstitute ? "🔄 " : "📌 "}
                      {h.name}
                    </span>
                    <span className="text-xs opacity-70">
                      {format(new Date(h.date), "M/d EEE", { locale: ko })}
                      {h.isSubstitute && " · 대체"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-3xl bg-white p-4 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-3">내 휴일</h3>
            {userHolidays.length === 0 ? (
              <p className="text-sm text-slate-400 py-2">
                달력에서 날짜를 탭해 개인 휴일을 추가해보세요.
              </p>
            ) : (
              <ul className="space-y-2 max-h-48 overflow-auto">
                {[...userHolidays]
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((h) => (
                    <li
                      key={h.date}
                      className="flex items-center justify-between text-sm p-3 rounded-xl bg-yellow-50 text-yellow-800 cursor-pointer hover:bg-yellow-100 transition"
                      onClick={() => handleDateClick(h.date)}
                    >
                      <span className="font-medium">
                        🌙{" "}
                        {h.note && h.note !== "개인 휴일" ? h.note : "개인 휴일"}
                      </span>
                      <span className="text-xs opacity-70">
                        {format(new Date(h.date), "M월 d일 EEE", {
                          locale: ko,
                        })}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {activeTab === "alarms" && (
        <AlarmList
          alarms={alarms}
          onSave={saveAlarm}
          onDelete={deleteAlarm}
          onToggle={toggleAlarm}
        />
      )}

      {activeTab === "settings" && <Settings userId={userId} />}

      <NoteModal
        isOpen={modalOpen}
        date={selectedDate}
        existingNote={selectedUserHoliday?.note || null}
        isPublicHoliday={!!selectedPublicHoliday}
        publicHolidayName={selectedPublicHoliday?.name}
        isSubstitute={selectedPublicHoliday?.isSubstitute}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveHoliday}
        onDelete={handleDeleteHoliday}
      />

      {firing && (
        <AlarmRinging alarm={firing} onDismiss={dismissFiring} />
      )}

      <BottomNav active={activeTab} onChange={setActiveTab} />

      <InstallPrompt />
    </main>
  );
}
