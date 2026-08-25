"use client";

import { useState, useEffect } from "react";
import { Download, Share, X } from "lucide-react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const iOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(iOSDevice);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // iOS이고 standalone이 아니면 보여주기
    if (iOSDevice && !window.matchMedia("(display-mode: standalone)").matches) {
      // 홈 화면에서 이미 설치된 유저에게는 안 보여줌. 기본은 숨기되, 필요시 표시
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!isVisible) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 rounded-2xl bg-[#FF7A59] text-white p-4 shadow-2xl animate-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-white/20 rounded-full shrink-0">
          <Download className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">알라미를 홈 화면에 추가하세요</p>
          {isIOS ? (
            <p className="text-xs text-white/90 mt-1">
              Safari 하단의 <Share className="w-3 h-3 inline mx-0.5" /> 공유 버튼 →
              「홈 화면에 추가」를 눌러주세요.
            </p>
          ) : (
            <p className="text-xs text-white/90 mt-1">
              홈 화면에 설치하면 앱처럼 알람을 사용할 수 있어요.
            </p>
          )}
          {!isIOS && deferredPrompt && (
            <button
              onClick={handleInstall}
              className="mt-2 px-4 py-1.5 bg-white text-[#FF7A59] rounded-full text-xs font-semibold"
            >
              설치하기
            </button>
          )}
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="p-1 hover:bg-white/10 rounded-full transition"
          aria-label="닫기"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
