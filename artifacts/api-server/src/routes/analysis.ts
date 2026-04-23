import { Router } from "express";
import { db, analysesTable } from "@workspace/db";
import { eq, desc, count, sql } from "drizzle-orm";
import { runAnalysisPipeline, type AgentEvent } from "../lib/agents.js";
import { AnalyzeImageBody, ListResultsQueryParams, GetResultParams } from "@workspace/api-zod";

const router = Router();

router.post("/analyze", async (req, res) => {
  const parsed = AnalyzeImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Bad Request", message: "imageBase64 is required" });
    return;
  }

  const { imageBase64, mimeType = "image/jpeg" } = parsed.data;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (event: AgentEvent) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  try {
    let resultText = "";
    let resultIsScam = false;
    let resultConfidence = 3;
    let resultSummary = "";
    let resultHash = "";

    for await (const event of runAnalysisPipeline(imageBase64, mimeType)) {
      send(event);

      if (event.type === "result") {
        resultText = event.text;
        resultIsScam = event.isScam;
        resultConfidence = event.confidenceLevel;
        resultSummary = event.summary;
        resultHash = event.messageHash;
      }
    }

    if (resultText && resultSummary && resultHash) {
      try {
        const existing = await db
          .select()
          .from(analysesTable)
          .where(eq(analysesTable.messageHash, resultHash))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(analysesTable).values({
            text: resultText,
            summary: resultSummary,
            isScam: resultIsScam,
            confidenceLevel: resultConfidence,
            messageHash: resultHash,
          });
        }
      } catch (dbErr) {
        req.log.error({ err: dbErr }, "Failed to save analysis to DB");
      }
    }
  } catch (err) {
    send({ type: "error", message: err instanceof Error ? err.message : "Unknown error occurred" });
  } finally {
    res.end();
  }
});

router.get("/results", async (req, res) => {
  const parsed = ListResultsQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const offset = parsed.success ? (parsed.data.offset ?? 0) : 0;

  try {
    const [results, totalResult] = await Promise.all([
      db
        .select()
        .from(analysesTable)
        .orderBy(desc(analysesTable.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(analysesTable),
    ]);

    const total = totalResult[0]?.count ?? 0;

    res.json({
      results: results.map((r) => ({
        id: r.id,
        text: r.text,
        summary: r.summary,
        isScam: r.isScam,
        confidenceLevel: r.confidenceLevel,
        createdAt: r.createdAt.toISOString(),
        messageHash: r.messageHash,
      })),
      total,
      limit,
      offset,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list results");
    res.status(500).json({ error: "Internal Server Error", message: "Failed to fetch results" });
  }
});

router.get("/results/:id", async (req, res) => {
  const parsed = GetResultParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Bad Request", message: "Invalid id" });
    return;
  }

  const id = Number(parsed.data.id);

  try {
    const results = await db
      .select()
      .from(analysesTable)
      .where(eq(analysesTable.id, id))
      .limit(1);

    if (results.length === 0) {
      res.status(404).json({ error: "Not Found", message: "Analysis not found" });
      return;
    }

    const r = results[0]!;
    res.json({
      id: r.id,
      text: r.text,
      summary: r.summary,
      isScam: r.isScam,
      confidenceLevel: r.confidenceLevel,
      createdAt: r.createdAt.toISOString(),
      messageHash: r.messageHash,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get result");
    res.status(500).json({ error: "Internal Server Error", message: "Failed to fetch result" });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const [totals, recent] = await Promise.all([
      db
        .select({
          total: count(),
          scamCount: sql<number>`SUM(CASE WHEN is_scam = true THEN 1 ELSE 0 END)::int`,
        })
        .from(analysesTable),
      db
        .select()
        .from(analysesTable)
        .orderBy(desc(analysesTable.createdAt))
        .limit(5),
    ]);

    const total = totals[0]?.total ?? 0;
    const scamCount = totals[0]?.scamCount ?? 0;
    const hamCount = total - scamCount;
    const scamRate = total > 0 ? Math.round((scamCount / total) * 100 * 10) / 10 : 0;

    res.json({
      total,
      scamCount,
      hamCount,
      scamRate,
      recentResults: recent.map((r) => ({
        id: r.id,
        text: r.text,
        summary: r.summary,
        isScam: r.isScam,
        confidenceLevel: r.confidenceLevel,
        createdAt: r.createdAt.toISOString(),
        messageHash: r.messageHash,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Internal Server Error", message: "Failed to fetch stats" });
  }
});

export default router;
