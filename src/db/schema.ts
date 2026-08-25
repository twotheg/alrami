import { pgTable, serial, varchar, text, boolean, timestamp, date, uniqueIndex } from "drizzle-orm/pg-core";

export const countries = pgTable("countries", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  flag: varchar("flag", { length: 10 }).notNull(),
  source: varchar("source", { length: 50 }).notNull().default("nager"),
});

export const holidays = pgTable("holidays", {
  id: serial("id").primaryKey(),
  countryCode: varchar("country_code", { length: 10 }).notNull(),
  date: date("date").notNull(),
  name: text("name").notNull(),
  isSubstitute: boolean("is_substitute").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueHoliday: uniqueIndex("unique_holiday_idx").on(table.countryCode, table.date, table.name),
}));

export const userHolidays = pgTable("user_holidays", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  countryCode: varchar("country_code", { length: 10 }).notNull(),
  date: date("date").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueUserHoliday: uniqueIndex("unique_user_holiday_idx").on(table.userId, table.countryCode, table.date),
}));

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  countryCode: varchar("country_code", { length: 10 }).notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueEndpoint: uniqueIndex("unique_endpoint_idx").on(table.endpoint),
}));
