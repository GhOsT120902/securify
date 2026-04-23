import { UploadArea } from "@/components/upload-area";
import { TextInputArea } from "@/components/text-input-area";
import { WorkflowPanel } from "@/components/workflow-panel";
import { ResultCard } from "@/components/result-card";
import { HistoryPanel } from "@/components/history-panel";
import { useAnalyze } from "@/hooks/use-analyze";
import { useGetStats, getGetStatsQueryKey } from "@workspace/api-client-react";
import { Shield, ShieldAlert, Activity, RefreshCw, Image, Type, LogOut, User } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/contexts/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type InputMode = "image" | "text";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function Home() {
  const { analyze, analyzeText, isAnalyzing, steps, result, error, reset } = useAnalyze();
  const { data: stats } = useGetStats();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [inputMode, setInputMode] = useState<InputMode>("image");
  const queryClient = useQueryClient();
  const { user, signOut } = useAuthContext();

  const afterAnalysis = () => {
    setRefreshTrigger((prev) => prev + 1);
    queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
  };

  const handleUpload = async (imageBase64: string, mimeType: string) => {
    await analyze(imageBase64, mimeType);
    afterAnalysis();
  };

  const handleTextAnalyze = async (text: string) => {
    await analyzeText(text);
    afterAnalysis();
  };

  const handleReset = () => {
    reset();
  };

  const showInput = !isAnalyzing && !result && !error;

  const displayName = user?.email?.split("@")[0] ?? "Account";

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

          <div className="flex items-center gap-3">
            {stats && (
              <div className="hidden md:flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Activity className="h-4 w-4" />
                  <span>{stats.total.toLocaleString()} analyzed</span>
                </div>
                <div className="w-px h-4 bg-border" />
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ShieldAlert className="h-4 w-4 text-destructive/70" />
                  <span>{stats.scamRate.toFixed(1)}% scam rate</span>
                </div>
              </div>
            )}

            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline max-w-[120px] truncate">{displayName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-sm">{displayName}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 text-muted-foreground cursor-pointer"
                  onClick={async () => { await signOut(); queryClient.clear(); }}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 md:px-8 py-8 md:py-12 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column */}
          <div className="lg:col-span-8 space-y-6">
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight">
                Suspicious message?{" "}
                <span className="text-primary">Let's check.</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Upload a screenshot or paste the text of any suspicious message. Our AI agents will analyze it and tell you if it's safe.
              </p>
            </div>

            <AnimatePresence mode="wait">
              {showInput ? (
                <motion.div
                  key="input"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-card rounded-2xl border shadow-sm overflow-hidden"
                >
                  {/* Mode tabs */}
                  <div className="flex border-b">
                    <button
                      onClick={() => setInputMode("image")}
                      className={cn(
                        "flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px",
                        inputMode === "image"
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground",
                      )}
                      data-testid="tab-image"
                    >
                      <Image className="h-4 w-4" />
                      Screenshot
                    </button>
                    <button
                      onClick={() => setInputMode("text")}
                      className={cn(
                        "flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px",
                        inputMode === "text"
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground",
                      )}
                      data-testid="tab-text"
                    >
                      <Type className="h-4 w-4" />
                      Paste Text
                    </button>
                  </div>

                  {/* Input area */}
                  <div className="p-4">
                    <AnimatePresence mode="wait">
                      {inputMode === "image" ? (
                        <motion.div
                          key="image-input"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <UploadArea onUpload={handleUpload} disabled={isAnalyzing} />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="text-input"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <TextInputArea onAnalyze={handleTextAnalyze} disabled={isAnalyzing} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
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
            {stats && (
              <div className="md:hidden bg-card rounded-xl border p-4 flex justify-between items-center shadow-sm">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Total Analyzed</span>
                  <span className="font-display font-semibold text-xl">{stats.total.toLocaleString()}</span>
                </div>
                <div className="w-px h-10 bg-border" />
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
