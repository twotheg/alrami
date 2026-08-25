"use client";

import { useState, useMemo } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  getDay,
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

interface Props {
  countryCode: string;
  baseYear: number;
  holidays: Holiday[];
  userHolidays: UserHoliday[];
  onDateClick: (date: string) => void;
  loading?: boolean;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function Calendar({
  baseYear,
  holidays,
  userHolidays,
  onDateClick,
  loading,
}: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date(baseYear, new Date().getMonth(), 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const holidayMap = useMemo(() => {
    const map = new Map<string, Holiday>();
    holidays.forEach((h) => map.set(h.date, h));
    return map;
  }, [holidays]);

  const userHolidayMap = useMemo(() => {
    const map = new Map<string, UserHoliday>();
    userHolidays.forEach((h) => map.set(h.date, h));
    return map;
  }, [userHolidays]);

  const isToday = (date: Date) => isSameDay(date, new Date());

  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 rounded-full hover:bg-slate-100 active:scale-95 transition"
          aria-label="이전 달"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h2 className="text-lg font-bold text-slate-800">
          {format(currentMonth, "yyyy년 M월", { locale: ko })}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 rounded-full hover:bg-slate-100 active:scale-95 transition"
          aria-label="다음 달"
        >
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map((day, idx) => (
          <div
            key={day}
            className={`text-center text-xs font-semibold py-2 ${
              idx === 0 ? "text-red-500" : idx === 6 ? "text-blue-500" : "text-slate-500"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date) => {
          const dateStr = format(date, "yyyy-MM-dd");
          const holiday = holidayMap.get(dateStr);
          const userHoliday = userHolidayMap.get(dateStr);
          const inMonth = isSameMonth(date, currentMonth);
          const dayIndex = getDay(date);
          const today = isToday(date);

          let bgClass = "bg-slate-50 hover:bg-slate-100";
          let textClass = "text-slate-700";
          let badge: string | null = null;
          let badgeColorClass = "text-pink-600";

          if (holiday) {
            if (holiday.isSubstitute) {
              bgClass = "bg-orange-100 hover:bg-orange-200";
              textClass = "text-orange-800";
              badgeColorClass = "text-orange-700";
              badge = "대체";
            } else {
              bgClass = "bg-pink-100 hover:bg-pink-200";
              textClass = "text-pink-800";
              badgeColorClass = "text-pink-700";
              badge = holiday.name.length > 3 ? holiday.name.slice(0, 2) : holiday.name;
            }
          } else if (userHoliday) {
            bgClass = "bg-yellow-100 hover:bg-yellow-200";
            textClass = "text-yellow-800";
            badgeColorClass = "text-yellow-700";
            badge = userHoliday.note && userHoliday.note !== "개인 휴일" ? userHoliday.note.slice(0, 2) : "내휴일";
          } else if (!inMonth) {
            bgClass = "bg-transparent";
            textClass = "text-slate-300";
          } else {
            if (dayIndex === 0) textClass = "text-red-500";
            else if (dayIndex === 6) textClass = "text-blue-500";
          }

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => {
                if (inMonth && !loading) {
                  onDateClick(dateStr);
                }
              }}
              disabled={loading || !inMonth}
              className={[
                "relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition active:scale-95 select-none cursor-pointer",
                bgClass,
                textClass,
                today ? "ring-2 ring-blue-500 ring-offset-1 font-bold" : "font-medium",
                !inMonth ? "cursor-default pointer-events-none" : "",
              ].join(" ")}
            >
              <span>{format(date, "d")}</span>
              {badge && inMonth && (
                <span className={`absolute bottom-0.5 right-0 left-0 text-[8px] leading-none font-semibold text-center truncate px-0.5 ${badgeColorClass}`}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md bg-pink-100 border border-pink-200" />
          <span>공휴일</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md bg-orange-100 border border-orange-200" />
          <span>대체휴일</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md bg-yellow-100 border border-yellow-200" />
          <span>내 휴일</span>
        </div>
      </div>
    </div>
  );
}
