import { Router, type Request, type Response, type NextFunction } from "express";
import { db, analysesTable } from "@workspace/db";
import { eq, desc, count, sql, and } from "drizzle-orm";
import { runAnalysisPipeline, runTextAnalysisPipeline, type AgentEvent } from "../lib/agents.js";
import { AnalyzeImageBody, ListResultsQueryParams, GetResultParams } from "@workspace/api-zod";
import { z } from "zod";

const router = Router();

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized", message: "You must be signed in" });
    return;
  }
  (req as Request & { userId: string }).userId = String(userId);
  next();
}

router.post("/analyze", requireAuth, async (req, res) => {
  const userId = (req as Request & { userId: string }).userId;
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
          .where(and(eq(analysesTable.messageHash, resultHash), eq(analysesTable.userId, userId)))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(analysesTable).values({
            userId,
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

const AnalyzeTextBody = z.object({
  text: z.string().min(1, "text is required"),
});

router.post("/analyze-text", requireAuth, async (req, res) => {
  const userId = (req as Request & { userId: string }).userId;
  const parsed = AnalyzeTextBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Bad Request", message: "text is required" });
    return;
  }

  const { text } = parsed.data;

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

    for await (const event of runTextAnalysisPipeline(text)) {
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
          .where(and(eq(analysesTable.messageHash, resultHash), eq(analysesTable.userId, userId)))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(analysesTable).values({
            userId,
            text: resultText,
            summary: resultSummary,
            isScam: resultIsScam,
            confidenceLevel: resultConfidence,
            messageHash: resultHash,
          });
        }
      } catch (dbErr) {
        req.log.error({ err: dbErr }, "Failed to save text analysis to DB");
      }
    }
  } catch (err) {
    send({ type: "error", message: err instanceof Error ? err.message : "Unknown error occurred" });
  } finally {
    res.end();
  }
});

router.get("/results", requireAuth, async (req, res) => {
  const userId = (req as Request & { userId: string }).userId;
  const parsed = ListResultsQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const offset = parsed.success ? (parsed.data.offset ?? 0) : 0;

  try {
    const [results, totalResult] = await Promise.all([
      db
        .select()
        .from(analysesTable)
        .where(eq(analysesTable.userId, userId))
        .orderBy(desc(analysesTable.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(analysesTable).where(eq(analysesTable.userId, userId)),
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

router.get("/results/:id", requireAuth, async (req, res) => {
  const userId = (req as Request & { userId: string }).userId;
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
      .where(and(eq(analysesTable.id, id), eq(analysesTable.userId, userId)))
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

const AnalyzeDocumentBody = z.object({
  fileBase64: z.string().min(1, "fileBase64 is required"),
  mimeType: z.enum([
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ]),
  fileName: z.string().optional(),
});

router.post("/analyze-document", requireAuth, async (req, res) => {
  const userId = (req as Request & { userId: string }).userId;
  const parsed = AnalyzeDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Bad Request", message: parsed.error.errors[0]?.message ?? "Invalid request" });
    return;
  }

  const { fileBase64, mimeType, fileName } = parsed.data;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (event: AgentEvent) => res.write(`data: ${JSON.stringify(event)}\n\n`);

  try {
    send({ type: "agent_step", agent: "Document Parser", content: `Extracting text from ${fileName ?? "document"}…`, status: "running" });

    const buffer = Buffer.from(fileBase64, "base64");
    let extractedText = "";

    if (mimeType === "application/pdf") {
      const pdfParse = (await import("pdf-parse")).default;
      const result = await pdfParse(buffer);
      extractedText = result.text.trim();
    } else {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value.trim();
    }

    if (!extractedText || extractedText.length < 10) {
      send({ type: "error", message: "Could not extract readable text from this document. It may be scanned or image-only." });
      res.end();
      return;
    }

    const previewLength = 120;
    const preview = extractedText.length > previewLength ? extractedText.slice(0, previewLength) + "…" : extractedText;
    send({ type: "agent_step", agent: "Document Parser", content: `Extracted ${extractedText.length.toLocaleString()} characters. Preview: "${preview}"`, status: "done" });

    let resultText = "";
    let resultIsScam = false;
    let resultConfidence = 3;
    let resultSummary = "";
    let resultHash = "";

    for await (const event of runTextAnalysisPipeline(extractedText.slice(0, 8000))) {
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
        const existing = await db.select().from(analysesTable)
          .where(and(eq(analysesTable.messageHash, resultHash), eq(analysesTable.userId, userId))).limit(1);
        if (existing.length === 0) {
          await db.insert(analysesTable).values({ userId, text: resultText, summary: resultSummary, isScam: resultIsScam, confidenceLevel: resultConfidence, messageHash: resultHash });
        }
      } catch (dbErr) {
        req.log.error({ err: dbErr }, "Failed to save document analysis to DB");
      }
    }
  } catch (err) {
    send({ type: "error", message: err instanceof Error ? err.message : "Unknown error occurred" });
  } finally {
    res.end();
  }
});

const AnalyzeUrlBody = z.object({
  url: z.string().url("Must be a valid URL"),
});

async function checkGoogleSafeBrowsing(url: string): Promise<{ isThreat: boolean; threats: string[] }> {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!apiKey) return { isThreat: false, threats: [] };

  const body = {
    client: { clientId: "securify", clientVersion: "1.0" },
    threatInfo: {
      threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url }],
    },
  };

  const res = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) return { isThreat: false, threats: [] };

  const data = (await res.json()) as { matches?: { threatType?: string }[] };
  if (!data.matches || data.matches.length === 0) return { isThreat: false, threats: [] };

  const threats = [...new Set(data.matches.map((m) => m.threatType ?? "UNKNOWN"))];
  return { isThreat: true, threats };
}

router.post("/analyze-url", requireAuth, async (req, res) => {
  const userId = (req as Request & { userId: string }).userId;
  const parsed = AnalyzeUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Bad Request", message: parsed.error.errors[0]?.message ?? "Invalid URL" });
    return;
  }

  const { url } = parsed.data;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (event: AgentEvent) => res.write(`data: ${JSON.stringify(event)}\n\n`);

  try {
    send({ type: "agent_step", agent: "Safe Browsing", content: "Checking against Google Safe Browsing threat database…", status: "running" });
    const { isThreat, threats } = await checkGoogleSafeBrowsing(url);
    const threatLabel = threats.map((t) => t.replace(/_/g, " ").toLowerCase()).join(", ");
    send({ type: "agent_step", agent: "Safe Browsing", content: isThreat ? `Known threat detected: ${threatLabel}` : "Not found in Google Safe Browsing threat lists.", status: "done" });

    send({ type: "agent_step", agent: "AI Analysis", content: "Analyzing URL patterns, domain, and reputation signals…", status: "running" });

    const { OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const safeBrowsingContext = isThreat
      ? `Google Safe Browsing flagged this URL as: ${threats.join(", ")}.`
      : "Google Safe Browsing did not flag this URL in its known threat lists.";

    const aiRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 600,
      messages: [
        {
          role: "system",
          content: `You are a cybersecurity expert specializing in URL and phishing analysis. Analyze the given URL for scam/phishing/malware risk.
Consider: domain age signals, suspicious TLDs, URL structure tricks (typosquatting, punycode, excessive subdomains), redirect chains, known brand impersonation patterns.
${safeBrowsingContext}
Respond in JSON: { "isScam": boolean, "confidenceLevel": 1-5, "summary": "1-2 sentence plain-English verdict", "flags": ["list of specific concerns found, or empty array if clean"] }`,
        },
        { role: "user", content: `Analyze this URL: ${url}` },
      ],
      response_format: { type: "json_object" },
    });

    const aiText = aiRes.choices[0]?.message?.content ?? "{}";
    let aiResult: { isScam?: boolean; confidenceLevel?: number; summary?: string; flags?: string[] } = {};
    try { aiResult = JSON.parse(aiText); } catch { /* ignore */ }

    const flags = aiResult.flags ?? [];
    const flagSummary = flags.length > 0 ? ` Flags: ${flags.join("; ")}.` : "";
    send({ type: "agent_step", agent: "AI Analysis", content: `${aiResult.summary ?? "Analysis complete."}${flagSummary}`, status: "done" });

    if (flags.length > 0) {
      send({ type: "agent_step", agent: "Risk Assessment", content: `Found ${flags.length} concern${flags.length > 1 ? "s" : ""}: ${flags.join(", ")}.`, status: "running" });
      send({ type: "agent_step", agent: "Risk Assessment", content: `Confidence level: ${aiResult.confidenceLevel ?? 3}/5.`, status: "done" });
    }

    const isScam = isThreat || (aiResult.isScam ?? false);
    const confidence = isThreat ? Math.max(aiResult.confidenceLevel ?? 4, 4) : (aiResult.confidenceLevel ?? 3);
    const summary = isThreat
      ? `⚠️ Flagged by Google Safe Browsing as ${threatLabel}. ${aiResult.summary ?? ""}`.trim()
      : (aiResult.summary ?? "URL appears to be clean.");

    const crypto = await import("crypto");
    const messageHash = crypto.createHash("sha256").update(url).digest("hex");

    send({ type: "result", isScam, confidenceLevel: confidence, summary, text: url, messageHash });

    try {
      const existing = await db.select().from(analysesTable).where(and(eq(analysesTable.messageHash, messageHash), eq(analysesTable.userId, userId))).limit(1);
      if (existing.length === 0) {
        await db.insert(analysesTable).values({ userId, text: url, summary, isScam, confidenceLevel: confidence, messageHash });
      }
    } catch (dbErr) {
      req.log.error({ err: dbErr }, "Failed to save URL analysis to DB");
    }
  } catch (err) {
    send({ type: "error", message: err instanceof Error ? err.message : "Unknown error occurred" });
  } finally {
    res.end();
  }
});

router.get("/stats", requireAuth, async (req, res) => {
  const userId = (req as Request & { userId: string }).userId;
  try {
    const [totals, recent] = await Promise.all([
      db
        .select({
          total: count(),
          scamCount: sql<number>`SUM(CASE WHEN is_scam = true THEN 1 ELSE 0 END)::int`,
        })
        .from(analysesTable)
        .where(eq(analysesTable.userId, userId)),
      db
        .select()
        .from(analysesTable)
        .where(eq(analysesTable.userId, userId))
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
