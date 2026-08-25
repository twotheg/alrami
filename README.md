# 알라미 Alrami 🔔

> 공휴일 · 대체공휴일 · 개인 휴일에는 자동으로 알람을 건너뛰는 iPhone용 PWA 알람 앱

한국에서 아이폰 기본 알람을 쓰면 공휴일/대체휴무일에도 그대로 알람이 울려서 불편하셨죠?
**알라미**는 휴일에는 알람이 자동으로 울리지 않도록 하고, 매일 저녁 7시에는 내일 알람을 꺼야 하는지 켜야 하는지 푸시로 알려드립니다.

## ✨ 주요 기능

| 탭 | 기능 |
|----|------|
| 🔔 **알람** | iOS 기본 알람 UI 그대로 · 시간 · 요일 반복 · 레이블 · 벨소리 5종 · 진동 · **휴일 자동 스킵 토글** · 5분 미루기 |
| 📅 **달력** | 대한민국 공휴일 + 대체공휴일 자동 표시 · 개인 휴일 추가 (메모) · 월별 공휴일 목록 |
| ⚙️ **설정** | 푸시 ON/OFF · 소리/진동 기본값 · 사용 방법 · 문제 해결 가이드 |

- **벨소리 5가지 내장** (Web Audio 합성, 파일 불필요): 기본 삐, 차임벨, 종소리, 닭, 디지털
- **매일 저녁 19:00 KST**에 Web Push 발송
  - 내일이 휴일 → 🔕 "내일 Alarm OFF, 알람을 꺼두세요!"
  - 휴일/주말 다음 평일 → ⏰ "내일 Alarm ON, 알람을 켜두세요!"
- iPhone 홈 화면에 추가하면 네이티브 앱처럼 동작 (standalone PWA)
- 로그인 불필요, 기기별 UUID로 개인 설정 저장

## 🛠 기술 스택

- **Frontend**: Next.js 16 (App Router) · TypeScript · Tailwind CSS · date-fns · lucide-react
- **Backend**: Next.js Route Handlers · Drizzle ORM
- **DB**: PostgreSQL (Neon)
- **Push**: Web Push (web-push, VAPID)
- **Hosting**: Vercel
- **Cron**: Vercel Cron (매일 10:00 UTC = 한국 19:00)
- **공휴일 데이터**: 공공데이터포털 특일 API (대체휴일 포함) + Nager.Date fallback

## 🚀 GitHub + Vercel + Neon 배포 가이드

### 1. GitHub에 업로드

```bash
git init
git add .
git commit -m "init: 알라미 1.0.0"
git branch -M main
git remote add origin https://github.com/<your-username>/alrami.git
git push -u origin main
```

### 2. Neon에서 PostgreSQL 생성

1. [console.neon.tech](https://console.neon.tech)에 가입/로그인합니다.
2. **New Project** → 프로젝트명 `alrami` → Region은 `Asia Pacific (Tokyo)` 또는 가까운 곳 → Create.
3. 생성된 **Connection String**을 복사합니다. (예: `postgresql://alrami_owner:...@ep-xxx.ap-southeast-1.aws.neon.tech/alrami?sslmode=require`)

### 3. Vercel 프로젝트 연결

1. [vercel.com](https://vercel.com) → New Project → GitHub의 `alrami` 저장소 선택.
2. Framework preset은 자동으로 **Next.js**가 선택됩니다.
3. **Environment Variables**에 아래 값을 모두 입력합니다.

| 변수 | 값 |
|------|-----|
| `DATABASE_URL` | Neon에서 복사한 connection string |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | 아래 명령으로 생성한 공개키 |
| `VAPID_PRIVATE_KEY` | 아래 명령으로 생성한 개인키 |
| `VAPID_SUBJECT` | `mailto:your-email@example.com` |
| `KOREA_DATA_GO_KR_API_KEY` | [공공데이터포털](https://www.data.go.kr/data/15012690/openapi.do) Encoding 인증키 (선택, 없으면 Nager fallback) |
| `CRON_SECRET` | 원하는 랜덤 문자열 (Vercel Cron 보호용) |

4. VAPID 키는 로컬에서 아래로 생성:
   ```bash
   npx web-push generate-vapid-keys
   ```
   출력의 `publicKey`, `privateKey`를 각각 복사.

### 4. DB 스키마 적용

로컬에서 또는 Vercel 빌드 후:

```bash
# DATABASE_URL에 Neon connection string 넣고 실행
npx drizzle-kit push
```

이 명령은 Neon DB에 `countries`, `holidays`, `user_holidays`, `push_subscriptions` 테이블을 생성합니다.

### 5. 아이폰에서 앱 설치

1. iPhone Safari로 배포된 Vercel URL에 접속합니다.
2. 하단 공유 버튼(⬆️) → **홈 화면에 추가** → 추가.
3. 홈 화면에 생긴 주황색 🔔 "알라미" 아이콘으로 실행.
4. 하단 「설정」탭 → 푸시 알림 「켜기」 → 권한 허용.

### 6. 공공데이터포털 API 키 (한국 공휴일 정확도)

- 앱 등록 없이도 Nager.Date API로 대략의 공휴일은 가져오지만, 대체공휴일은 누락될 수 있습니다.
- 정확한 한국 공휴일을 원하시면 [공공데이터포털](https://www.data.go.kr/data/15012690/openapi.do)에서 **활용신청** 후 **Encoding 인증키**를 발급받아 `KOREA_DATA_GO_KR_API_KEY`에 넣어주세요 (무료).

## 🔔 알람 동작 방식 & 제한 사항

- 앱이 포그라운드/백그라운드에서 열려 있으면 정확한 시간에 전체화면 알람 + 소리 + 진동이 울립니다.
- PWA가 완전히 종료된 상태에서도 **매일 저녁 푸시**가 도착하고, 푸시를 탭하면 앱이 열려 다음 날 아침 알람이 정상 동작합니다.
- 잠들기 전 앱을 완전히 종료하지 말고 열어두시면 가장 정확해요.
- iOS 16.4 이상, Safari에서만 Web Push가 지원됩니다.

## 📂 프로젝트 구조

```
src/
├── app/
│   ├── api/
│   │   ├── holidays/           # 공휴일 조회 + DB 캐싱
│   │   ├── user/holidays/      # 개인 휴일 CRUD
│   │   ├── subscribe/          # Push 구독/해지
│   │   ├── push/               # 테스트 발송
│   │   └── cron/push/          # 매일 19:00 (KST) 크론
│   ├── page.tsx                # 메인 (탭 3개)
│   └── layout.tsx
├── components/
│   ├── Calendar.tsx
│   ├── NoteModal.tsx
│   ├── BottomNav.tsx
│   ├── PushManager.tsx
│   ├── InstallPrompt.tsx
│   ├── Settings.tsx
│   └── alarm/
│       ├── AlarmList.tsx
│       ├── AlarmModal.tsx
│       └── AlarmRinging.tsx
├── lib/
│   ├── countries.ts
│   ├── holidays.ts             # 공휴일 fetch (한국 공공API + Nager fallback)
│   ├── push.ts                 # web-push 초기화
│   ├── register-sw.ts
│   ├── hooks.ts
│   └── alarm/                  # 알람 엔진 (스케줄러 + Web Audio 벨소리)
└── db/
    ├── index.ts
    └── schema.ts
public/
├── manifest.json
├── sw.js                       # Service Worker (push / cache)
└── icons/
```

## 🧪 로컬 개발

```bash
npm install
cp .env.local.example .env.local
# .env.local에 DATABASE_URL (로컬 PostgreSQL 또는 Neon)과 VAPID 키를 넣으세요
npx drizzle-kit push
npm run dev
```

## 📄 라이선스

MIT
