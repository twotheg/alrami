"use client";

import type { Alarm } from "./types";

const WEEKDAY_LABELS_KR = ["일", "월", "화", "수", "목", "금", "토"];

export function formatTime(hour: number, minute: number): string {
  const hh = hour.toString().padStart(2, "0");
  const mm = minute.toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

export function formatWeekdays(weekdays: number[]): string {
  if (weekdays.length === 0) return "한 번만";
  if (weekdays.length === 7) return "매일";
  if (
    weekdays.length === 5 &&
    [1, 2, 3, 4, 5].every((d) => weekdays.includes(d))
  ) {
    return "주중";
  }
  if (weekdays.length === 2 && weekdays.includes(0) && weekdays.includes(6)) {
    return "주말";
  }
  return weekdays
    .sort()
    .map((d) => WEEKDAY_LABELS_KR[d])
    .join(" ");
}

// 다음에 울릴 Date를 계산
export function getNextTrigger(
  alarm: Alarm,
  now: Date = new Date()
): Date | null {
  if (!alarm.enabled) return null;

  const candidates: Date[] = [];
  // 앞으로 7일 동안 검사
  for (let dayOffset = 0; dayOffset < 8; dayOffset++) {
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(alarm.hour, alarm.minute, 0, 0);

    const dayOfWeek = d.getDay();
    const matchesWeekday =
      alarm.weekdays.length === 0
        ? dayOffset > 0
        : alarm.weekdays.includes(dayOfWeek);

    if (matchesWeekday && d.getTime() > now.getTime()) {
      candidates.push(d);
    }
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.getTime() - b.getTime());
  return candidates[0];
}

// 오늘 이 알람이 울려야 하는지 (공휴일 스킵 등은 caller에서 처리)
export function shouldFireToday(
  alarm: Alarm,
  today: Date = new Date()
): boolean {
  if (!alarm.enabled) return false;

  const dayOfWeek = today.getDay();
  if (alarm.weekdays.length === 0) {
    // 한 번만 알람: lastTriggered가 없고 오늘 시간이 아직 안 지났으면?
    // 스케줄링 시 getNextTrigger로 계산
    return false;
  }
  return alarm.weekdays.includes(dayOfWeek);
}

// YYYY-MM-DD 포맷
export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}
