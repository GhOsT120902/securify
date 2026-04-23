import { useState, useCallback } from "react";

export type AgentStep = {
  type: "agent_step";
  agent: string;
  content: string;
  status: "running" | "done";
};

export type StreamResult = {
  type: "result";
  isScam: boolean;
  confidenceLevel: number;
  summary: string;
};

export type StreamError = {
  type: "error";
  message: string;
};

export type DoneEvent = {
  type: "done";
};

export type StreamEvent = AgentStep | StreamResult | StreamError | DoneEvent;

async function streamAnalysis(
  url: string,
  body: Record<string, unknown>,
  onStep: (step: AgentStep) => void,
  onResult: (result: StreamResult) => void,
  onError: (msg: string) => void,
  onDone: () => void,
) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let msg = "Failed to start analysis";
    try {
      const err = await response.json() as { message?: string };
      if (err.message) msg = err.message;
    } catch { /* ignore */ }
    throw new Error(msg);
  }

  if (!response.body) throw new Error("No response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const dataStr = line.slice(6).trim();
      if (!dataStr) continue;

      try {
        const event = JSON.parse(dataStr) as StreamEvent;

        if (event.type === "agent_step") {
          onStep(event);
        } else if (event.type === "result") {
          onResult(event);
        } else if (event.type === "error") {
          onError(event.message);
          return;
        } else if (event.type === "done") {
          onDone();
          return;
        }
      } catch (e) {
        console.error("Error parsing SSE data", e);
      }
    }
  }
}

export function useAnalyze() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [result, setResult] = useState<StreamResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addOrUpdateStep = useCallback((step: AgentStep) => {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.agent === step.agent);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = step;
        return next;
      }
      return [...prev, step];
    });
  }, []);

  const analyze = useCallback(async (imageBase64: string, mimeType: string) => {
    setIsAnalyzing(true);
    setSteps([]);
    setResult(null);
    setError(null);

    try {
      await streamAnalysis(
        "/api/analysis/analyze",
        { imageBase64, mimeType },
        addOrUpdateStep,
        (r) => setResult(r),
        (msg) => { setError(msg); setIsAnalyzing(false); },
        () => setIsAnalyzing(false),
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "An unexpected error occurred";
      setError(msg);
      setIsAnalyzing(false);
    }
  }, [addOrUpdateStep]);

  const analyzeText = useCallback(async (text: string) => {
    setIsAnalyzing(true);
    setSteps([]);
    setResult(null);
    setError(null);

    try {
      await streamAnalysis(
        "/api/analysis/analyze-text",
        { text },
        addOrUpdateStep,
        (r) => setResult(r),
        (msg) => { setError(msg); setIsAnalyzing(false); },
        () => setIsAnalyzing(false),
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "An unexpected error occurred";
      setError(msg);
      setIsAnalyzing(false);
    }
  }, [addOrUpdateStep]);

  const reset = useCallback(() => {
    setSteps([]);
    setResult(null);
    setError(null);
    setIsAnalyzing(false);
  }, []);

  return {
    analyze,
    analyzeText,
    isAnalyzing,
    steps,
    result,
    error,
    reset,
  };
}
