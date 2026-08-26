import { parseStringPromise } from "xml2js";
import { db } from "@/db";
import { holidays } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export interface Holiday {
  date: string;
  name: string;
  isSubstitute: boolean;
}

async function fetchWithTimeout(url: string, ms = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 86400 },
    });
    clearTimeout(timeout);
    return res;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

// Nager.Date API - 연도별 한 번 호출, 묵집, 인증 불필요
async function fetchNagerHolidays(
  countryCode: string,
  year: number
): Promise<Holiday[]> {
  const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`;
  const res = await fetchWithTimeout(url, 8000);
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
      item.types?.includes("SubstituteHoliday"),
  }));
}

// 공공데이터포털 API - 월별 12회 병렬 호출
async function fetchKoreaHolidays(year: number): Promise<Holiday[]> {
  const apiKey = process.env.KOREA_DATA_GO_KR_API_KEY;
  if (!apiKey || apiKey === "YOUR_DATA_GO_KR_ENCODING_KEY") {
    throw new Error("KOREA_DATA_GO_KR_API_KEY not configured");
  }

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const results = await Promise.all(
    months.map(async (month) => {
      const solMonth = month.toString().padStart(2, "0");
      const url = `http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo?serviceKey=${encodeURIComponent(
        apiKey
      )}&solYear=${year}&solMonth=${solMonth}&_type=json`;

      try {
        const res = await fetchWithTimeout(url, 5000);
        const text = await res.text();
        const data = await parseStringPromise(text, { explicitArray: false });
        const items = data?.response?.body?.items?.item;
        if (!items) return [];
        const list = Array.isArray(items) ? items : [items];
        return list.map((item: any) => {
          const locdate = item.locdate.toString();
          return {
            date: `${locdate.slice(0, 4)}-${locdate.slice(4, 6)}-${locdate.slice(
              6,
              8
            )}`,
            name: item.dateName,
            isSubstitute:
              item.dateName.includes("대체") ||
              item.dateName.toLowerCase().includes("substitute"),
          };
        });
      } catch (err) {
        return [];
      }
    })
  );

  const merged = results.flat();
  if (merged.length === 0) throw new Error("All Korea API requests failed");
  return merged;
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

  let fetched: Holiday[] = [];

  // 1. Nager API 먼저 시도 (빠르고 안정적)
  try {
    fetched = await fetchNagerHolidays(countryCode, year);
  } catch (err) {
    console.warn("Nager API failed:", err);
  }

  // 2. Nager가 실패하거나 비어있으면 공공데이터 API 시도
  if (fetched.length === 0 && countryCode === "KR") {
    try {
      fetched = await fetchKoreaHolidays(year);
    } catch (err) {
      console.warn("Korea API failed:", err);
    }
  }

  if (fetched.length > 0) {
    await db
      .insert(holidays)
      .values(
        fetched.map((h) => ({
          countryCode,
          date: h.date,
          name: h.name,
          isSubstitute: h.isSubstitute,
        }))
      )
      .onConflictDoNothing();
  }

  return fetched;
}
