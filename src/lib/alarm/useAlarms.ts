"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Alarm } from "./types";
import { getNextTrigger, toDateStr } from "./scheduler";
import { getAlarmVolume } from "./sound";

const STORAGE_KEY = "alrami-alarms";

// 전역 스킵 날짜 Set (홈 탭에서 주입)
let globalSkipDates = new Set<string>();

export function setGlobalSkipDates(dates: string[]) {
  globalSkipDates = new Set(dates);
}

export function useAlarms() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [firing, setFiring] = useState<Alarm | null>(null);
  const firedTodayKeyRef = useRef<Set<string>>(new Set());

  // 로드
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setAlarms(JSON.parse(raw));
    } catch (e) {
      console.error("Failed to load alarms", e);
    }
  }, []);

  // 저장
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
    } catch (e) {}
  }, [alarms]);

  const saveAlarm = useCallback((alarm: Alarm) => {
    setAlarms((prev) => {
      const existing = prev.findIndex((a) => a.id === alarm.id);
      if (existing >= 0) {
        const copy = [...prev];
        copy[existing] = alarm;
        return copy;
      }
      return [...prev, alarm];
    });
  }, []);

  const deleteAlarm = useCallback((id: string) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const toggleAlarm = useCallback((id: string) => {
    setAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  }, []);

  const dismissFiring = useCallback(
    (snooze = false) => {
      if (!firing) return;
      if (snooze) {
        const fireAgain = firing;
        setTimeout(() => {
          setFiring(fireAgain);
        }, 5 * 60 * 1000);
      } else {
        setAlarms((prev) =>
          prev.map((a) =>
            a.id === firing.id
              ? {
                  ...a,
                  lastTriggered: new Date().toISOString(),
                  enabled: a.weekdays.length === 0 ? false : a.enabled,
                }
              : a
          )
        );
      }
      setFiring(null);
    },
    [firing]
  );

  // 매초마다 알람 트리거 체크
  useEffect(() => {
    const tick = () => {
      if (firing) return;
      const now = new Date();
      const todayStr = toDateStr(now);

      for (const alarm of alarms) {
        if (!alarm.enabled) continue;
        if (alarm.skipHolidays && globalSkipDates.has(todayStr)) continue;

        const next = getNextTrigger(alarm, new Date(now.getTime() - 60_000));
        if (!next) continue;

        const diff = next.getTime() - now.getTime();
        if (diff >= 0 && diff < 1000) {
          const todayKey = `${alarm.id}:${todayStr}`;
          if (firedTodayKeyRef.current.has(todayKey)) continue;
          firedTodayKeyRef.current.add(todayKey);

          // 시스템 Notification 발송 (알림 볼륨 사용)
          if (typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission === "granted") {
              try {
                new Notification(`🔔 ${alarm.label}`, {
                  body: `${alarm.hour
                    .toString()
                    .padStart(2, "0")}:${alarm.minute
                    .toString()
                    .padStart(2, "0")} 알람이 울리고 있습니다.`,
                  icon: "/icons/icon-512x512.png",
                  badge: "/icons/icon-192x192.png",
                  tag: `alarm-fire-${alarm.id}`,
                  requireInteraction: true,
                });
              } catch {}
            }
          }

          setFiring(alarm);
          break;
        }
      }
    };

    const id = setInterval(tick, 1000);
    tick();
    return () => clearInterval(id);
  }, [alarms, firing]);

  return {
    alarms,
    firing,
    saveAlarm,
    deleteAlarm,
    toggleAlarm,
    dismissFiring,
  };
}
