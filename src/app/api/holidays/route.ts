import { NextRequest, NextResponse } from "next/server";
import { fetchAndCacheHolidays } from "@/lib/holidays";
import { COUNTRY_CODE } from "@/lib/countries";
import { db } from "@/db";
import { holidays } from "@/db/schema";
import { sql } from "drizzle-orm";

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
  const searchParams = request.nextUrl.searchParams;
  const year = parseInt(
    searchParams.get("year") || new Date().getFullYear().toString(),
    10
  );

  try {
    // holidays 테이블이 비어있으면 seed 데이터 자동 삽입
    const countResult = await db.select({ count: sql`count(*)` }).from(holidays);
    const totalCount = Number(countResult[0]?.count || 0);

    if (totalCount === 0) {
      for (const h of seedHolidays) {
        await db.insert(holidays).values({
          countryCode: COUNTRY_CODE,
          date: h.date,
          name: h.name,
          isSubstitute: h.isSubstitute,
        }).onConflictDoNothing();
      }
    }

    const data = await fetchAndCacheHolidays(COUNTRY_CODE, year);
    return NextResponse.json({ year, holidays: data });
  } catch (error: any) {
    console.error("Holidays fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch holidays", detail: error.message },
      { status: 500 }
    );
  }
}
