"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Loader2, Send } from "lucide-react";

interface Props {
  userId: string;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export default function PushManager({ userId }: Props) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      setIsSupported(false);
      return;
    }
    setIsSupported(true);

    navigator.serviceWorker.ready.then(async (registration) => {
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    });
  }, []);

  const subscribe = async () => {
    setLoading(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error("VAPID public key missing");

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, subscription: subscription.toJSON() }),
      });

      setIsSubscribed(true);
    } catch (err: any) {
      setError(err.message || "구독 실패");
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await fetch("/api/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
      }
      setIsSubscribed(false);
    } catch (err: any) {
      setError(err.message || "구독 해제 실패");
    } finally {
      setLoading(false);
    }
  };

  const testPush = async () => {
    setTestLoading(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        setError("먼저 푸시를 구독해주세요.");
        return;
      }
      const res = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          title: "🔔 알라미 테스트",
          message: "알라미 푸시 알림이 정상 수신됩니다!",
        }),
      });
      if (!res.ok) throw new Error("푸시 발송 실패");
    } catch (err: any) {
      setError(err.message || "테스트 실패");
    } finally {
      setTestLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <p className="text-sm text-slate-500">
        이 브라우저/기기에서는 푸시를 지원하지 않아요. iPhone에서는 iOS 16.4 이상 Safari에서 홈 화면에 추가한 뒤 사용해주세요.
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-full ${
              isSubscribed ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-500"
            }`}
          >
            {isSubscribed ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">
              {isSubscribed ? "저녁 7시 푸시 ON" : "저녁 7시 푸시 OFF"}
            </p>
            <p className="text-xs text-slate-500">
              {isSubscribed
                ? "내일 휴일이면 미리 알림을 보내드려요."
                : "내일 알람을 끌지 휴일마다 알려드려요."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSubscribed && (
            <button
              onClick={testPush}
              disabled={testLoading}
              className="p-2 rounded-full text-green-700 bg-green-50 hover:bg-green-100 active:scale-95 transition"
              aria-label="테스트"
            >
              {testLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          )}
          <button
            onClick={isSubscribed ? unsubscribe : subscribe}
            disabled={loading}
            className={`px-3 py-2 rounded-full text-sm font-semibold transition active:scale-95 ${
              isSubscribed
                ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                : "bg-[#FF7A59] text-white hover:bg-[#e86a4c]"
            }`}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isSubscribed ? (
              "끄기"
            ) : (
              "켜기"
            )}
          </button>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}
