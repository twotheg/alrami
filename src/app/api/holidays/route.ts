import { NextRequest, NextResponse } from "next/server";
import { fetchAndCacheHolidays } from "@/lib/holidays";
import { COUNTRY_CODE } from "@/lib/countries";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const year = parseInt(
    searchParams.get("year") || new Date().getFullYear().toString(),
    10
  );

  try {
    const data = await fetchAndCacheHolidays(COUNTRY_CODE, year);
    return NextResponse.json({ year, holidays: data });
  } catch (error) {
    console.error("Holidays fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch holidays" },
      { status: 500 }
    );
  }
}
