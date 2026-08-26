import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { holidays } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const seedHolidays = [
  {"date": "2025-01-01", "name": "새해", "isSubstitute": false},
  {"date": "2025-01-28", "name": "설날", "isSubstitute": false},
  {"date": "2025-01-29", "name": "설날", "isSubstitute": false},
  {"date": "2025-01-30", "name": "설날", "isSubstitute": false},
  {"date": "2025-03-01", "name": "삼일절", "isSubstitute": false},
  {"date": "2025-03-03", "name": "삼일절 대체공휴일", "isSubstitute": true},
  {"date": "2025-05-01", "name": "근로자의 날", "isSubstitute": false},
  {"date": "2025-05-05", "name": "어린이날", "isSubstitute": false},
  {"date": "2025-05-05", "name": "부처님오신날", "isSubstitute": false},
  {"date": "2025-06-03", "name": "전국동시지방선거일", "isSubstitute": false},
  {"date": "2025-06-06", "name": "현충일", "isSubstitute": false},
  {"date": "2025-08-15", "name": "광복절", "isSubstitute": false},
  {"date": "2025-10-03", "name": "개천절", "isSubstitute": false},
  {"date": "2025-10-05", "name": "개천절 대체공휴일", "isSubstitute": true},
  {"date": "2025-10-06", "name": "추석", "isSubstitute": false},
  {"date": "2025-10-07", "name": "추석", "isSubstitute": false},
  {"date": "2025-10-08", "name": "추석", "isSubstitute": false},
  {"date": "2025-10-09", "name": "한글날", "isSubstitute": false},
  {"date": "2025-12-25", "name": "크리스마스", "isSubstitute": false},
  {"date": "2026-01-01", "name": "새해", "isSubstitute": false},
  {"date": "2026-02-16", "name": "설날", "isSubstitute": false},
  {"date": "2026-02-17", "name": "설날", "isSubstitute": false},
  {"date": "2026-02-18", "name": "설날", "isSubstitute": false},
  {"date": "2026-03-01", "name": "삼일절", "isSubstitute": false},
  {"date": "2026-03-02", "name": "삼일절 대체공휴일", "isSubstitute": true},
  {"date": "2026-05-01", "name": "근로자의 날", "isSubstitute": false},
  {"date": "2026-05-05", "name": "어린이날", "isSubstitute": false},
  {"date": "2026-05-24", "name": "부처님오신날", "isSubstitute": false},
  {"date": "2026-05-25", "name": "부처님오신날 대체공휴일", "isSubstitute": true},
  {"date": "2026-06-06", "name": "현충일", "isSubstitute": false},
  {"date": "2026-08-15", "name": "광복절", "isSubstitute": false},
  {"date": "2026-08-17", "name": "광복절 대체공휴일", "isSubstitute": true},
  {"date": "2026-09-24", "name": "추석", "isSubstitute": false},
  {"date": "2026-09-25", "name": "추석", "isSubstitute": false},
  {"date": "2026-09-26", "name": "추석", "isSubstitute": false},
  {"date": "2026-10-03", "name": "개천절", "isSubstitute": false},
  {"date": "2026-10-05", "name": "개천절 대체공휴일", "isSubstitute": true},
  {"date": "2026-10-09", "name": "한글날", "isSubstitute": false},
  {"date": "2026-12-25", "name": "크리스마스", "isSubstitute": false}
];

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== "alrami-seed-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let inserted = 0;
    for (const h of seedHolidays) {
      const exists = await db
        .select()
        .from(holidays)
        .where(
          and(
            eq(holidays.countryCode, "KR"),
            eq(holidays.date, h.date),
            eq(holidays.name, h.name)
          )
        )
        .limit(1);

      if (exists.length === 0) {
        await db.insert(holidays).values({
          countryCode: "KR",
          date: h.date,
          name: h.name,
          isSubstitute: h.isSubstitute,
        });
        inserted++;
      }
    }

    return NextResponse.json({ success: true, inserted });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
