import { useState, useCallback, useRef } from "react";
import { AnalysisResult } from "@workspace/api-client-react";

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

export function useAnalyze() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [result, setResult] = useState<StreamResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const analyze = useCallback(async (imageBase64: string, mimeType: string) => {
    setIsAnalyzing(true);
    setSteps([]);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/analysis/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType })
      });

      if (!response.ok) {
        throw new Error("Failed to start analysis");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (!dataStr.trim()) continue;

            try {
              const event = JSON.parse(dataStr) as StreamEvent;

              if (event.type === "agent_step") {
                setSteps((prev) => {
                  const existingIndex = prev.findIndex(s => s.agent === event.agent);
                  if (existingIndex >= 0) {
                    const newSteps = [...prev];
                    newSteps[existingIndex] = event;
                    return newSteps;
                  }
                  return [...prev, event];
                });
              } else if (event.type === "result") {
                setResult(event);
              } else if (event.type === "error") {
                setError(event.message);
                setIsAnalyzing(false);
                return;
              } else if (event.type === "done") {
                setIsAnalyzing(false);
                return;
              }
            } catch (e) {
              console.error("Error parsing SSE data", e);
            }
          }
        }
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || "An unexpected error occurred");
      setIsAnalyzing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setSteps([]);
    setResult(null);
    setError(null);
    setIsAnalyzing(false);
  }, []);

  return {
    analyze,
    isAnalyzing,
    steps,
    result,
    error,
    reset
  };
}
