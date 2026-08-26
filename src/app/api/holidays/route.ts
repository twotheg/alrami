import { NextRequest, NextResponse } from "next/server";
import { fetchAndCacheHolidays } from "@/lib/holidays";
import { COUNTRY_CODE } from "@/lib/countries";
import { db } from "@/db";
import { holidays } from "@/db/schema";
import { sql } from "drizzle-orm";

const seedHolidays = [
  // 2024
  {"date": "2024-01-01", "name": "새해", "isSubstitute": false},
  {"date": "2024-02-09", "name": "설날", "isSubstitute": false},
  {"date": "2024-02-10", "name": "설날", "isSubstitute": false},
  {"date": "2024-02-11", "name": "설날", "isSubstitute": false},
  {"date": "2024-02-12", "name": "설날 대체공휴일", "isSubstitute": true},
  {"date": "2024-03-01", "name": "삼일절", "isSubstitute": false},
  {"date": "2024-04-10", "name": "국회의원선거일", "isSubstitute": false},
  {"date": "2024-05-01", "name": "근로자의 날", "isSubstitute": false},
  {"date": "2024-05-05", "name": "어린이날", "isSubstitute": false},
  {"date": "2024-05-06", "name": "어린이날 대체공휴일", "isSubstitute": true},
  {"date": "2024-05-15", "name": "부처님오신날", "isSubstitute": false},
  {"date": "2024-06-06", "name": "현충일", "isSubstitute": false},
  {"date": "2024-08-15", "name": "광복절", "isSubstitute": false},
  {"date": "2024-09-16", "name": "추석", "isSubstitute": false},
  {"date": "2024-09-17", "name": "추석", "isSubstitute": false},
  {"date": "2024-09-18", "name": "추석", "isSubstitute": false},
  {"date": "2024-10-03", "name": "개천절", "isSubstitute": false},
  {"date": "2024-10-09", "name": "한글날", "isSubstitute": false},
  {"date": "2024-12-25", "name": "크리스마스", "isSubstitute": false},
  // 2025
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
  // 2026
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
  {"date": "2026-06-03", "name": "전국동시지방선거일", "isSubstitute": false},
  {"date": "2026-06-06", "name": "현충일", "isSubstitute": false},
  {"date": "2026-08-15", "name": "광복절", "isSubstitute": false},
  {"date": "2026-08-17", "name": "광복절 대체공휴일", "isSubstitute": true},
  {"date": "2026-09-24", "name": "추석", "isSubstitute": false},
  {"date": "2026-09-25", "name": "추석", "isSubstitute": false},
  {"date": "2026-09-26", "name": "추석", "isSubstitute": false},
  {"date": "2026-10-03", "name": "개천절", "isSubstitute": false},
  {"date": "2026-10-05", "name": "개천절 대체공휴일", "isSubstitute": true},
  {"date": "2026-10-09", "name": "한글날", "isSubstitute": false},
  {"date": "2026-12-25", "name": "크리스마스", "isSubstitute": false},
  // 2027
  {"date": "2027-01-01", "name": "새해", "isSubstitute": false},
  {"date": "2027-02-06", "name": "설날", "isSubstitute": false},
  {"date": "2027-02-07", "name": "설날", "isSubstitute": false},
  {"date": "2027-02-08", "name": "설날", "isSubstitute": false},
  {"date": "2027-02-09", "name": "설날 대체공휴일", "isSubstitute": true},
  {"date": "2027-03-01", "name": "삼일절", "isSubstitute": false},
  {"date": "2027-05-01", "name": "근로자의 날", "isSubstitute": false},
  {"date": "2027-05-03", "name": "근로자의 날 대체공휴일", "isSubstitute": true},
  {"date": "2027-05-05", "name": "어린이날", "isSubstitute": false},
  {"date": "2027-05-13", "name": "부처님오신날", "isSubstitute": false},
  {"date": "2027-06-06", "name": "현충일", "isSubstitute": false},
  {"date": "2027-06-07", "name": "현충일 대체공휴일", "isSubstitute": true},
  {"date": "2027-07-17", "name": "제헌절", "isSubstitute": false},
  {"date": "2027-07-19", "name": "제헌절 대체공휴일", "isSubstitute": true},
  {"date": "2027-08-15", "name": "광복절", "isSubstitute": false},
  {"date": "2027-08-16", "name": "광복절 대체공휴일", "isSubstitute": true},
  {"date": "2027-09-14", "name": "추석", "isSubstitute": false},
  {"date": "2027-09-15", "name": "추석", "isSubstitute": false},
  {"date": "2027-09-16", "name": "추석", "isSubstitute": false},
  {"date": "2027-10-03", "name": "개천절", "isSubstitute": false},
  {"date": "2027-10-04", "name": "개천절 대체공휴일", "isSubstitute": true},
  {"date": "2027-10-09", "name": "한글날", "isSubstitute": false},
  {"date": "2027-10-11", "name": "한글날 대체공휴일", "isSubstitute": true},
  {"date": "2027-12-25", "name": "크리스마스", "isSubstitute": false},
  {"date": "2027-12-27", "name": "크리스마스 대체공휴일", "isSubstitute": true},
  // 2028
  {"date": "2028-01-01", "name": "새해", "isSubstitute": false},
  {"date": "2028-01-03", "name": "새해 대체공휴일", "isSubstitute": true},
  {"date": "2028-01-26", "name": "설날", "isSubstitute": false},
  {"date": "2028-01-27", "name": "설날", "isSubstitute": false},
  {"date": "2028-01-28", "name": "설날 대체공휴일", "isSubstitute": true},
  {"date": "2028-03-01", "name": "삼일절", "isSubstitute": false},
  {"date": "2028-05-01", "name": "근로자의 날", "isSubstitute": false},
  {"date": "2028-05-02", "name": "부처님오신날", "isSubstitute": false},
  {"date": "2028-05-05", "name": "어린이날", "isSubstitute": false},
  {"date": "2028-06-06", "name": "현충일", "isSubstitute": false},
  {"date": "2028-08-15", "name": "광복절", "isSubstitute": false},
  {"date": "2028-10-02", "name": "추석", "isSubstitute": false},
  {"date": "2028-10-03", "name": "추석", "isSubstitute": false},
  {"date": "2028-10-03", "name": "개천절", "isSubstitute": false},
  {"date": "2028-10-04", "name": "추석", "isSubstitute": false},
  {"date": "2028-10-05", "name": "개천절 대체공휴일", "isSubstitute": true},
  {"date": "2028-10-09", "name": "한글날", "isSubstitute": false},
  {"date": "2028-12-25", "name": "크리스마스", "isSubstitute": false}
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const year = parseInt(
    searchParams.get("year") || new Date().getFullYear().toString(),
    10
  );

  try {
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
