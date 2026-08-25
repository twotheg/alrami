"use client";

import { Bell, Globe, Moon, Volume2, Info, Shield, BellOff } from "lucide-react";
import PushManager from "./PushManager";
import { useLocalStorage } from "@/lib/hooks";

interface Props {
  userId: string;
}

export default function Settings({ userId }: Props) {
  const [soundEnabled, setSoundEnabled] = useLocalStorage<boolean>(
    "alrami-sound",
    true
  );
  const [vibrateEnabled, setVibrateEnabled] = useLocalStorage<boolean>(
    "alrami-vibrate",
    true
  );

  return (
    <div className="p-5 space-y-4">
      <div className="rounded-3xl bg-white p-4 shadow-sm border border-slate-100">
        <h2 className="font-bold text-slate-800 mb-3">푸시 알림</h2>
        <PushManager userId={userId} />
      </div>

      <div className="rounded-3xl bg-white p-4 shadow-sm border border-slate-100">
        <h2 className="font-bold text-slate-800 mb-3">알람 기본 설정</h2>
        <div className="divide-y divide-slate-100">
          <ToggleRow
            icon={<Volume2 className="w-5 h-5 text-blue-600" />}
            title="소리"
            subtitle="벨소리가 울립니다"
            checked={soundEnabled}
            onChange={setSoundEnabled}
          />
          <ToggleRow
            icon={<Moon className="w-5 h-5 text-indigo-600" />}
            title="진동"
            subtitle="알람이 울릴 때 진동이 함께 옵니다"
            checked={vibrateEnabled}
            onChange={setVibrateEnabled}
          />
        </div>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-100 space-y-4">
        <h2 className="font-bold text-slate-800 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600" />
          앱 소개 & 사용 방법
        </h2>
        <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
          <section>
            <h3 className="font-semibold text-slate-800 mb-1">📱 홈 화면 추가 방법</h3>
            <ol className="list-decimal list-inside space-y-0.5 text-xs">
              <li>Safari로 이 페이지를 여세요.</li>
              <li>하단 중앙의 공유 버튼(⬆️)을 탭하세요.</li>
              <li>「홈 화면에 추가」를 선택하고 「추가」를 누르세요.</li>
              <li>홈 화면에 생긴 알라미 아이콘으로 실행하세요.</li>
            </ol>
          </section>

          <section>
            <h3 className="font-semibold text-slate-800 mb-1">🔔 알람이 울리지 않을 수도 있어요</h3>
            <p className="text-xs">
              iPhone Safari PWA는 앱이 오랫동안 종료된 상태이면 백그라운드 동작이
              제한됩니다. 하지만 매일 저녁 7시에 오는 푸시 알림을 탭해 앱을 열어두면,
              다음 날 아침 정확한 시간에 알람이 울려요.
            </p>
            <div className="mt-2 rounded-xl bg-blue-50 p-2.5 text-xs text-blue-800">
              <strong className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> 해결 방법
              </strong>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li>잠들기 전 앱을 완전히 닫지 말고 열어두세요.</li>
                <li>푸시 알림을 탭하면 앱이 깨어납니다.</li>
                <li>「설정 → Safari → 고급 → JavaScript」 켜짐 확인</li>
                <li>저전력 모드는 알림 지연의 원인이 될 수 있어요.</li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-slate-800 mb-1">🔕 휴일 자동 스킵</h3>
            <p className="text-xs">
              캘린더 탭에서 국가 공휴일(대체공휴일 포함)이 자동으로 표시되며,
              개인 휴일도 추가할 수 있어요. 알람을 만들 때 「공휴일 스킵」을 켜면
              그 날은 알람이 자동으로 울리지 않습니다.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-800 mb-1">
              <BellOff className="w-3.5 h-3.5 inline mr-1" />
              기본 알람 vs 알라미
            </h3>
            <p className="text-xs">
              알라미는 휴일 스킵과 개인 휴일 연동이 핵심이에요. 기본 아이폰 알람을
              끄고 알라미만 사용하시면 휴일마다 일일이 알람을 끄지 않아도 돼요.
            </p>
          </section>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-100">
        <h2 className="font-bold text-slate-800 mb-2">배포 정보</h2>
        <div className="space-y-2 text-xs text-slate-600">
          <InfoRow label="버전" value="1.0.0" />
          <InfoRow label="호스팅" value="Vercel" />
          <InfoRow label="데이터베이스" value="Neon Postgres" />
          <InfoRow label="공휴일 데이터" value="공공데이터포털 + Nager.Date" />
        </div>
      </div>

      <p className="text-center text-xs text-slate-400 pt-2">
        ⓒ 2026 알라미 · 푹 쉬는 아침을 위해
      </p>
    </div>
  );
}

function ToggleRow({
  icon,
  title,
  subtitle,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 py-3 cursor-pointer">
      <div className="p-2 bg-slate-50 rounded-full shrink-0">{icon}</div>
      <div className="flex-1">
        <p className="font-medium text-sm text-slate-800">{title}</p>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="relative w-12 h-7 bg-slate-300 peer-checked:bg-green-500 rounded-full transition-colors">
        <div
          className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </div>
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}
