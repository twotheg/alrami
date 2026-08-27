import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userHolidays } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const COUNTRY = "KR";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const data = await db
    .select()
    .from(userHolidays)
    .where(and(eq(userHolidays.userId, userId), eq(userHolidays.countryCode, COUNTRY)))
    .orderBy(userHolidays.date);

  return NextResponse.json({ holidays: data });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, date, note } = body;

    if (!userId || !date) {
      return NextResponse.json({ error: "userId and date required" }, { status: 400 });
    }

    const result = await db
      .insert(userHolidays)
      .values({ userId, countryCode: COUNTRY, date, note: note || null })
      .onConflictDoNothing()
      .returning();

    return NextResponse.json({ success: true, holiday: result[0] || null });
  } catch (error: any) {
    console.error("Add user holiday error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to add holiday" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, date } = body;

    if (!userId || !date) {
      return NextResponse.json({ error: "userId and date required" }, { status: 400 });
    }

    await db
      .delete(userHolidays)
      .where(
        and(
          eq(userHolidays.userId, userId),
          eq(userHolidays.countryCode, COUNTRY),
          eq(userHolidays.date, date)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user holiday error:", error);
    return NextResponse.json({ error: "Failed to delete holiday" }, { status: 500 });
  }
}
