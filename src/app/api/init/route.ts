import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

// 앱 시작 시 자동으로 필요한 테이블이 없으면 만들어주는 API
// Vercel 첫 배포 후 한 번만 호출하면 됩니다.
export async function GET() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS countries (
        id SERIAL PRIMARY KEY,
        code VARCHAR(10) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        flag VARCHAR(10) NOT NULL,
        source VARCHAR(50) NOT NULL DEFAULT 'nager'
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS holidays (
        id SERIAL PRIMARY KEY,
        country_code VARCHAR(10) NOT NULL,
        date DATE NOT NULL,
        name TEXT NOT NULL,
        is_substitute BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS unique_holiday_idx
      ON holidays (country_code, date, name);
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_holidays (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        country_code VARCHAR(10) NOT NULL,
        date DATE NOT NULL,
        note TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS unique_user_holiday_idx
      ON user_holidays (user_id, country_code, date);
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        country_code VARCHAR(10) NOT NULL,
        endpoint TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS unique_endpoint_idx
      ON push_subscriptions (endpoint);
    `);

    return NextResponse.json({ success: true, message: "Tables ready" });
  } catch (error: any) {
    console.error("Init error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
