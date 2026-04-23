import { UploadArea } from "@/components/upload-area";
import { WorkflowPanel } from "@/components/workflow-panel";
import { ResultCard } from "@/components/result-card";
import { HistoryPanel } from "@/components/history-panel";
import { useAnalyze } from "@/hooks/use-analyze";
import { useGetStats } from "@workspace/api-client-react";
import { Shield, ShieldAlert, Activity, BarChart3, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetStatsQueryKey } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";

export function Home() {
  const { analyze, isAnalyzing, steps, result, error, reset } = useAnalyze();
  const { data: stats } = useGetStats();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const queryClient = useQueryClient();

  const handleUpload = async (imageBase64: string, mimeType: string) => {
    await analyze(imageBase64, mimeType);
    // After analysis completes, update history and stats
    setRefreshTrigger(prev => prev + 1);
    queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
  };

  const handleReset = () => {
    reset();
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-foreground">
              Securify
            </span>
          </div>

          {stats && (
            <div className="hidden md:flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Activity className="h-4 w-4" />
                <span>{stats.total.toLocaleString()} analyzed</span>
              </div>
              <div className="w-px h-4 bg-border"></div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShieldAlert className="h-4 w-4 text-destructive/70" />
                <span>{stats.scamRate.toFixed(1)}% scam rate</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 md:px-8 py-8 md:py-12 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Upload & Results */}
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight">
                Suspicious message? <span className="text-muted-foreground">Let's check.</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Upload a screenshot of an email, text, or post. Our expert AI agents will analyze it for scam patterns and tell you if it's safe.
              </p>
            </div>

            <AnimatePresence mode="wait">
              {!isAnalyzing && !result && !error ? (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-card rounded-2xl border shadow-sm p-2"
                >
                  <UploadArea onUpload={handleUpload} disabled={isAnalyzing} />
                </motion.div>
              ) : (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {(result || error) && (
                    <>
                      <div className="flex justify-end">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleReset}
                          className="gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Check another
                        </Button>
                      </div>
                      <div className="h-[350px]">
                        <ResultCard result={result} error={error} />
                      </div>
                    </>
                  )}
                  
                  <div className="h-[300px]">
                    <WorkflowPanel steps={steps} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: History */}
          <div className="lg:col-span-4 space-y-6">
            {/* Mobile Stats Card */}
            {stats && (
              <div className="md:hidden bg-card rounded-xl border p-4 flex justify-between items-center shadow-sm">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Total Analyzed</span>
                  <span className="font-display font-semibold text-xl">{stats.total.toLocaleString()}</span>
                </div>
                <div className="w-px h-10 bg-border"></div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Scam Rate</span>
                  <span className="font-display font-semibold text-xl text-destructive">{stats.scamRate.toFixed(1)}%</span>
                </div>
              </div>
            )}
            
            <HistoryPanel refreshTrigger={refreshTrigger} />
          </div>

        </div>
      </main>
    </div>
  );
}
