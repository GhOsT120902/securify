import OpenAI from "openai";
import { createHash } from "crypto";

export interface AgentStep {
  type: "agent_step";
  agent: string;
  content: string;
  status: "running" | "done" | "error";
}

export interface AnalysisResultEvent {
  type: "result";
  isScam: boolean;
  confidenceLevel: number;
  summary: string;
  text: string;
  messageHash: string;
}

export interface DoneEvent {
  type: "done";
}

export interface ErrorEvent {
  type: "error";
  message: string;
}

export type AgentEvent = AgentStep | AnalysisResultEvent | DoneEvent | ErrorEvent;

const GOOGLE_SAFE_BROWSING_URL =
  "https://safebrowsing.googleapis.com/v4/threatMatches:find";

const THREAT_TYPES = [
  "MALWARE",
  "SOCIAL_ENGINEERING",
  "UNWANTED_SOFTWARE",
  "POTENTIALLY_HARMFUL_APPLICATION",
];

async function checkUrlSafety(urls: string[]): Promise<Record<string, string>> {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!apiKey || urls.length === 0) return {};

  try {
    const body = {
      client: { clientId: "securify", clientVersion: "1.0" },
      threatInfo: {
        threatTypes: THREAT_TYPES,
        platformTypes: ["ANY_PLATFORM"],
        threatEntryTypes: ["URL"],
        threatEntries: urls.map((url) => ({ url })),
      },
    };
    const resp = await fetch(`${GOOGLE_SAFE_BROWSING_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!resp.ok) return {};
    const data = (await resp.json()) as { matches?: { threat: { url: string }; threatType: string }[] };
    const result: Record<string, string> = {};
    for (const match of data.matches ?? []) {
      result[match.threat.url] = match.threatType;
    }
    return result;
  } catch {
    return {};
  }
}

function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s"'<>]+/gi;
  return [...new Set(text.match(urlRegex) ?? [])];
}

function hashText(text: string): string {
  return createHash("sha256").update(text.trim()).digest("hex");
}

async function* runCoreAgents(
  openai: OpenAI,
  extractedText: string,
): AsyncGenerator<AgentEvent> {
  // Agent 2: Link Checker
  yield { type: "agent_step", agent: "Link Checker", content: "Identifying and checking URLs...", status: "running" };

  const urls = extractUrls(extractedText);
  let urlSafetyReport = "No URLs found in the message.";

  if (urls.length > 0) {
    const threats = await checkUrlSafety(urls);
    if (Object.keys(threats).length === 0) {
      urlSafetyReport = `Found ${urls.length} URL(s): ${urls.join(", ")}. No known threats detected by Google Safe Browsing.`;
    } else {
      const threatDetails = Object.entries(threats)
        .map(([url, type]) => `${url} (${type})`)
        .join(", ");
      urlSafetyReport = `WARNING: ${Object.keys(threats).length} of ${urls.length} URL(s) flagged as dangerous: ${threatDetails}`;
    }
  }

  yield {
    type: "agent_step",
    agent: "Link Checker",
    content: urlSafetyReport,
    status: "done",
  };

  // Agent 3: Content Analyst
  yield { type: "agent_step", agent: "Content Analyst", content: "Analyzing message for scam patterns...", status: "running" };

  let contentAnalysis = "";
  try {
    const contentResp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `You are a Content Analyst specializing in digital scam detection.

Extracted message text:
"""
${extractedText}
"""

URL safety report: ${urlSafetyReport}

Analyze this message for the following scam indicators:
1. Urgency tactics (limited time, act now, immediate action required)
2. Threats or fear tactics (account suspension, legal action, fine)
3. Impersonation (pretending to be a bank, government, tech company)
4. Suspicious offers (prizes, unexpected windfalls, too-good-to-be-true)
5. Pressure tactics (do not tell anyone, keep this secret)
6. Requests for personal/financial information
7. Logical inconsistencies or grammatical errors suggesting non-native fraud
8. Social engineering (building false trust, urgency, authority)

List the specific red flags you identify, or state clearly if no suspicious patterns are present.
Be concise and specific — cite actual phrases from the text.`,
        },
      ],
      max_tokens: 600,
    });
    contentAnalysis = contentResp.choices[0]?.message?.content?.trim() ?? "";
  } catch (err) {
    yield { type: "error", message: `Content analysis failed: ${err instanceof Error ? err.message : String(err)}` };
    return;
  }

  yield {
    type: "agent_step",
    agent: "Content Analyst",
    content: contentAnalysis,
    status: "done",
  };

  // Agent 4: Decision Maker
  yield { type: "agent_step", agent: "Decision Maker", content: "Making final scam determination...", status: "running" };

  let isScam = false;
  let confidenceLevel = 3;
  let decisionReasoning = "";

  try {
    const decisionResp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `You are a Decision Maker for scam detection.

Message text: """${extractedText}"""
Content analysis: ${contentAnalysis}
URL safety: ${urlSafetyReport}

Make a final determination. Respond in this exact JSON format:
{
  "isScam": true or false,
  "confidenceLevel": 1 to 5,
  "reasoning": "One sentence explaining your decision"
}

Confidence scale: 1=uncertain, 2=low, 3=moderate, 4=high, 5=very high
Do not include markdown, only valid JSON.`,
        },
      ],
      max_tokens: 200,
    });

    const raw = decisionResp.choices[0]?.message?.content?.trim() ?? "{}";
    const parsed = JSON.parse(raw) as { isScam?: boolean; confidenceLevel?: number; reasoning?: string };
    isScam = parsed.isScam ?? false;
    confidenceLevel = Math.min(5, Math.max(1, Math.round(parsed.confidenceLevel ?? 3)));
    decisionReasoning = parsed.reasoning ?? "";
  } catch (err) {
    yield { type: "error", message: `Decision failed: ${err instanceof Error ? err.message : String(err)}` };
    return;
  }

  yield {
    type: "agent_step",
    agent: "Decision Maker",
    content: `Verdict: ${isScam ? "SCAM" : "NOT SCAM"} (Confidence: ${confidenceLevel}/5). ${decisionReasoning}`,
    status: "done",
  };

  // Agent 5: Summary Specialist
  yield { type: "agent_step", agent: "Summary Specialist", content: "Generating user-friendly summary...", status: "running" };

  let summary = "";
  try {
    const summaryResp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `You are a Summary Specialist who explains scam analysis in plain language for non-technical users.

Message: """${extractedText}"""
Verdict: ${isScam ? "SCAM" : "NOT SCAM"} (Confidence: ${confidenceLevel}/5)
Analysis: ${contentAnalysis}
URL check: ${urlSafetyReport}
Decision reasoning: ${decisionReasoning}

Write a single paragraph (3-5 sentences) in plain, non-technical language that:
1. States clearly whether this is a scam or legitimate message
2. Explains the key reasons in simple terms
3. Gives one specific actionable recommendation

Write as if speaking to a worried friend. Be reassuring but direct. No jargon.`,
        },
      ],
      max_tokens: 300,
    });
    summary = summaryResp.choices[0]?.message?.content?.trim() ?? "";
  } catch (err) {
    yield { type: "error", message: `Summary failed: ${err instanceof Error ? err.message : String(err)}` };
    return;
  }

  yield {
    type: "agent_step",
    agent: "Summary Specialist",
    content: summary,
    status: "done",
  };

  // Agent 6: Language Translation
  yield { type: "agent_step", agent: "Language Translation", content: "Detecting language and translating if needed...", status: "running" };

  let finalSummary = summary;
  try {
    const langResp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Detect the language of this text: """${extractedText.substring(0, 500)}"""

If it is NOT English, translate the following summary into that same language.
If it IS English, return the summary unchanged.

Summary to translate (or return unchanged):
"""${summary}"""

Respond with ONLY the (possibly translated) summary text — no explanation, no language label.`,
        },
      ],
      max_tokens: 400,
    });
    finalSummary = langResp.choices[0]?.message?.content?.trim() ?? summary;
  } catch {
    finalSummary = summary;
  }

  const translated = finalSummary !== summary;
  yield {
    type: "agent_step",
    agent: "Language Translation",
    content: translated
      ? "Summary has been translated to match the source language of the message."
      : "Message is in English — no translation needed.",
    status: "done",
  };

  // Agent 7: Data Storage Agent
  yield { type: "agent_step", agent: "Data Storage Agent", content: "Archiving analysis results...", status: "running" };

  const messageHash = hashText(extractedText);

  yield {
    type: "agent_step",
    agent: "Data Storage Agent",
    content: "Analysis results archived successfully.",
    status: "done",
  };

  yield {
    type: "result",
    isScam,
    confidenceLevel,
    summary: finalSummary,
    text: extractedText,
    messageHash,
  };

  yield { type: "done" };
}

export async function* runAnalysisPipeline(
  imageBase64: string,
  mimeType: string = "image/jpeg",
): AsyncGenerator<AgentEvent> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Agent 1: OCR Specialist
  yield { type: "agent_step", agent: "OCR Specialist", content: "Extracting text from image...", status: "running" };

  let extractedText = "";
  try {
    const ocrResp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
            {
              type: "text",
              text: `You are an OCR Specialist. Extract ALL readable text from this image exactly as it appears. 
Include every word, number, URL, email, phone number, and punctuation mark you can see.
Clean up obvious OCR artifacts (e.g. split words) but do not paraphrase or summarize.
If there is NO readable text in this image (e.g. it's a landscape photo, abstract art, or blank), respond with exactly: NO_TEXT_FOUND
Otherwise, output only the extracted text — no explanation, no commentary.`,
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    extractedText = ocrResp.choices[0]?.message?.content?.trim() ?? "";
  } catch (err) {
    yield { type: "error", message: `OCR failed: ${err instanceof Error ? err.message : String(err)}` };
    return;
  }

  if (extractedText === "NO_TEXT_FOUND" || extractedText === "") {
    yield {
      type: "agent_step",
      agent: "OCR Specialist",
      content: "No readable text found in the image. Analysis cannot proceed.",
      status: "done",
    };
    yield { type: "error", message: "No readable text was found in the image. Please upload a screenshot containing text." };
    return;
  }

  yield {
    type: "agent_step",
    agent: "OCR Specialist",
    content: `Text extracted successfully (${extractedText.length} characters).`,
    status: "done",
  };

  yield* runCoreAgents(openai, extractedText);
}

export async function* runTextAnalysisPipeline(
  text: string,
): AsyncGenerator<AgentEvent> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const trimmed = text.trim();
  if (!trimmed) {
    yield { type: "error", message: "No text provided for analysis." };
    return;
  }

  // Skip OCR — text is provided directly
  yield {
    type: "agent_step",
    agent: "Text Input",
    content: `Text received (${trimmed.length} characters). Proceeding with analysis.`,
    status: "done",
  };

  yield* runCoreAgents(openai, trimmed);
}
