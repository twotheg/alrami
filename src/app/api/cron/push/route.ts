import { NextRequest, NextResponse } from "next/server";
import { webpush } from "@/lib/push";
import { db } from "@/db";
import { pushSubscriptions, holidays, userHolidays } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { format, addDays, isWeekend } from "date-fns";

// 오늘이 휴일인지 (공휴일 또는 개인 휴일 또는 주말)
async function isHoliday(
  countryCode: string,
  userId: string,
  date: Date
): Promise<{ isOff: boolean; name: string }> {
  const dateStr = format(date, "yyyy-MM-dd");

  const [publicHoliday] = await db
    .select()
    .from(holidays)
    .where(and(eq(holidays.countryCode, countryCode), eq(holidays.date, dateStr)))
    .limit(1);

  if (publicHoliday) {
    return {
      isOff: true,
      name: publicHoliday.name + (publicHoliday.isSubstitute ? " (대체휴일)" : ""),
    };
  }

  const [personalHoliday] = await db
    .select()
    .from(userHolidays)
    .where(
      and(
        eq(userHolidays.userId, userId),
        eq(userHolidays.countryCode, countryCode),
        eq(userHolidays.date, dateStr)
      )
    )
    .limit(1);

  if (personalHoliday) {
    return { isOff: true, name: personalHoliday.note || "개인 휴일" };
  }

  return { isOff: false, name: "" };
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const tomorrow = addDays(today, 1);
  const tomorrowStr = format(tomorrow, "yyyy-MM-dd");
  let sentOff = 0;
  let sentOn = 0;

  try {
    const allSubs = await db.select().from(pushSubscriptions);

    for (const sub of allSubs) {
      const tomorrowInfo = await isHoliday(sub.countryCode, sub.userId, tomorrow);
      const todayInfo = await isHoliday(sub.countryCode, sub.userId, today);

      let title = "";
      let body = "";
      let tag = "";

      // 내일이 휴일이면 → 알람 끄라고 안내
      if (tomorrowInfo.isOff) {
        title = "🔕 내일은 알라미가 쉬어요";
        body = `내일 ${format(tomorrow, "M월 d일")}은 ${tomorrowInfo.name}이에요. 오늘 저녁 알람을 꺼두세요!`;
        tag = `alrami-off-${tomorrowStr}`;
      } else {
        const todayIsOff = todayInfo.isOff || isWeekend(today);
        if (todayIsOff) {
          title = "⏰ 내일 알라미가 깨워요";
          body = `내일 ${format(tomorrow, "M월 d일")}은 정상 출근일이에요. 잊지 말고 알람을 켜두세요!`;
          tag = `alrami-on-${tomorrowStr}`;
        }
      }

      if (!title) continue;

      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({
            title,
            body,
            icon: "/icons/icon-512x512.png",
            badge: "/icons/icon-512x512.png",
            tag,
            data: { url: "/" },
            requireInteraction: true,
          })
        );
        if (title.includes("OFF")) sentOff++;
        else sentOn++;
      } catch (err: any) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
        }
      }
    }

    return NextResponse.json({ success: true, date: tomorrowStr, sentOff, sentOn });
  } catch (error) {
    console.error("Cron push error:", error);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
