import { NextRequest, NextResponse } from "next/server";
import { webpush } from "@/lib/push";
import { db } from "@/db";
import { pushSubscriptions, holidays, userHolidays } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, title = "알라미", message = "알라미 푸시 테스트입니다." } = body;

    const payload = JSON.stringify({
      title,
      body: message,
      icon: "/icons/icon-512x512.png",
      badge: "/icons/icon-192x192.png",
      tag: "alrami-test",
    });

    if (endpoint) {
      const sub = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, endpoint))
        .limit(1);

      if (!sub[0]) {
        return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
      }

      await webpush.sendNotification(
        {
          endpoint: sub[0].endpoint,
          keys: { p256dh: sub[0].p256dh, auth: sub[0].auth },
        },
        payload
      );
    } else {
      const allSubs = await db.select().from(pushSubscriptions);
      for (const sub of allSubs) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          );
        } catch (err: any) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Push error:", error);
    return NextResponse.json({ error: "Failed to send push" }, { status: 500 });
  }
}
