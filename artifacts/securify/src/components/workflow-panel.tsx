import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AgentStep } from "@/hooks/use-analyze";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface WorkflowPanelProps {
  steps: AgentStep[];
}

export function WorkflowPanel({ steps }: WorkflowPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [steps]);

  if (steps.length === 0) {
    return (
      <Card className="h-full border-muted/40 shadow-sm bg-card/50">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-base font-medium">Analysis Progress</CardTitle>
          <CardDescription>Upload an image to start analysis</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground/50">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-muted-foreground/20 mx-auto mb-3"></div>
            <p className="text-sm">Waiting for input...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full border-muted/40 shadow-sm overflow-hidden flex flex-col">
      <CardHeader className="pb-3 border-b border-border/50 bg-card">
        <CardTitle className="text-base font-medium flex items-center justify-between">
          <span>Analysis Progress</span>
          {steps.some(s => s.status === 'running') && (
            <span className="text-xs font-normal text-muted-foreground flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Processing
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <ScrollArea className="flex-grow bg-muted/10">
        <div className="p-4 space-y-4" ref={scrollRef}>
          <AnimatePresence initial={false}>
            {steps.map((step, index) => (
              <motion.div
                key={step.agent}
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "rounded-lg border p-3 md:p-4 text-sm transition-colors",
                  step.status === "running" 
                    ? "bg-card border-primary/20 shadow-sm ring-1 ring-primary/10" 
                    : "bg-muted/30 border-transparent text-muted-foreground"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {step.status === "running" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <p className={cn(
                      "font-medium",
                      step.status === "running" ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {step.agent}
                    </p>
                    <p className={cn(
                      "text-xs leading-relaxed",
                      step.status === "running" ? "text-muted-foreground" : "text-muted-foreground/70"
                    )}>
                      {step.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </Card>
  );
}
