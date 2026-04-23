import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const analysesTable = pgTable("analyses", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  summary: text("summary").notNull(),
  isScam: boolean("is_scam").notNull(),
  confidenceLevel: integer("confidence_level").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  messageHash: text("message_hash").notNull().unique(),
});

export const insertAnalysisSchema = createInsertSchema(analysesTable).omit({ id: true, createdAt: true });
export const selectAnalysisSchema = createSelectSchema(analysesTable);

export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analysesTable.$inferSelect;
