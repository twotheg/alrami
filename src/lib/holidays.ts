import { parseStringPromise } from "xml2js";
import { db } from "@/db";
import { holidays } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  isSubstitute: boolean;
}

async function fetchKoreaHolidays(year: number): Promise<Holiday[]> {
  const apiKey = process.env.KOREA_DATA_GO_KR_API_KEY;
  if (!apiKey || apiKey === "YOUR_DATA_GO_KR_ENCODING_KEY") {
    throw new Error("KOREA_DATA_GO_KR_API_KEY not configured");
  }

  const results: Holiday[] = [];

  for (let month = 1; month <= 12; month++) {
    const solMonth = month.toString().padStart(2, "0");
    const url = `http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo?serviceKey=${encodeURIComponent(
      apiKey
    )}&solYear=${year}&solMonth=${solMonth}&_type=json`;

    try {
      const res = await fetch(url, { next: { revalidate: 86400 } });
      const text = await res.text();
      const data = await parseStringPromise(text, { explicitArray: false });
      const items = data?.response?.body?.items?.item;

      if (!items) continue;

      const list = Array.isArray(items) ? items : [items];
      for (const item of list) {
        const locdate = item.locdate;
        const dateName = item.dateName;
        if (!locdate || !dateName) continue;

        const dateStr = `${locdate.toString().slice(0, 4)}-${locdate
          .toString()
          .slice(4, 6)}-${locdate.toString().slice(6, 8)}`;

        const isSubstitute = dateName.includes("대체") || dateName.includes("substitute");
        results.push({ date: dateStr, name: dateName, isSubstitute });
      }
    } catch (err) {
      console.error(`Failed to fetch Korea holidays for ${year}-${solMonth}:`, err);
    }
  }

  return results;
}

async function fetchNagerHolidays(countryCode: string, year: number): Promise<Holiday[]> {
  const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`Nager API error: ${res.status}`);

  const data = (await res.json()) as Array<{
    date: string;
    localName: string;
    name: string;
    types: string[];
  }>;

  return data.map((item) => ({
    date: item.date,
    name: item.localName || item.name,
    isSubstitute:
      item.name.toLowerCase().includes("substitute") ||
      item.localName.toLowerCase().includes("대체") ||
      item.types.includes("SubstituteHoliday"),
  }));
}

export async function fetchAndCacheHolidays(
  countryCode: string,
  year: number
): Promise<Holiday[]> {
  const existing = await db
    .select()
    .from(holidays)
    .where(
      and(
        eq(holidays.countryCode, countryCode),
        sql`EXTRACT(YEAR FROM ${holidays.date}) = ${year}`
      )
    );

  if (existing.length > 0) {
    return existing.map((h) => ({
      date: h.date,
      name: h.name,
      isSubstitute: h.isSubstitute,
    }));
  }

  let fetched: Holiday[];

  if (countryCode === "KR") {
    try {
      fetched = await fetchKoreaHolidays(year);
    } catch (err) {
      console.warn("Korea API failed, falling back to Nager:", err);
      fetched = await fetchNagerHolidays(countryCode, year);
    }
  } else {
    fetched = await fetchNagerHolidays(countryCode, year);
  }

  if (fetched.length > 0) {
    await db.insert(holidays).values(
      fetched.map((h) => ({
        countryCode,
        date: h.date,
        name: h.name,
        isSubstitute: h.isSubstitute,
      }))
    ).onConflictDoNothing();
  }

  return fetched;
}
