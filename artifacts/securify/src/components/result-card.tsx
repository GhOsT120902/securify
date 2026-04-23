import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StreamResult } from "@/hooks/use-analyze";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ResultCardProps {
  result: StreamResult | null;
  error: string | null;
}

export function ResultCard({ result, error }: ResultCardProps) {
  if (error) {
    return (
      <Card className="border-primary/30 bg-primary/5 text-primary overflow-hidden h-full">
        <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Analysis Failed</h3>
          <p className="text-sm opacity-90 max-w-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return null;
  }

  const isScam = result.isScam;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="h-full"
    >
      <Card className={cn(
        "overflow-hidden h-full border-t-4",
        isScam
          ? "border-t-primary border-x-primary/20 border-b-primary/20 bg-primary/5 shadow-[0_8px_30px_rgb(220,38,38,0.15)]"
          : "border-t-safe border-x-safe/20 border-b-safe/20 bg-safe/5 shadow-[0_8px_30px_rgb(34,197,94,0.12)]"
      )}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            {isScam ? (
              <>
                <div className="bg-primary/10 p-2 rounded-lg border border-primary/20">
                  <AlertTriangle className="h-6 w-6 text-primary" />
                </div>
                <span className="text-2xl font-bold tracking-tight text-primary">It's a Scam</span>
              </>
            ) : (
              <>
                <div className="bg-safe/10 p-2 rounded-lg border border-safe/20">
                  <ShieldCheck className="h-6 w-6 text-safe" />
                </div>
                <span className="text-2xl font-bold tracking-tight text-safe">Looks Safe</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-white/50">Confidence Level</span>
              <span className={isScam ? "text-primary" : "text-safe"}>
                {result.confidenceLevel} / 5
              </span>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={cn(
                    "h-2 flex-1 rounded-full transition-colors",
                    level <= result.confidenceLevel
                      ? isScam ? "bg-primary" : "bg-safe"
                      : "bg-white/10"
                  )}
                />
              ))}
            </div>
          </div>

          <div className="bg-black/40 rounded-lg p-5 border border-white/8 shadow-sm leading-relaxed text-sm">
            <p className="font-medium mb-2 text-white">Analysis Summary</p>
            <p className="text-white/60">{result.summary}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
