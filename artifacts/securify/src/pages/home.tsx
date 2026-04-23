import { MatrixRain } from "@/components/matrix-rain";
import { UploadArea } from "@/components/upload-area";
import { TextInputArea } from "@/components/text-input-area";
import { UrlInputArea } from "@/components/url-input-area";
import { DocumentUploadArea } from "@/components/document-upload-area";
import { WorkflowPanel } from "@/components/workflow-panel";
import { ResultCard } from "@/components/result-card";
import { HistoryPanel } from "@/components/history-panel";
import { useAnalyze } from "@/hooks/use-analyze";
import { useGetStats, getGetStatsQueryKey } from "@workspace/api-client-react";
import { Shield, ShieldAlert, Activity, RefreshCw, Image, MessageSquare, Link, FileText, LogOut, User } from "lucide-react";
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

type InputMode = "image" | "text" | "url" | "document";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function Home() {
  const { analyze, analyzeText, analyzeDocument, analyzeUrl, isAnalyzing, steps, result, error, reset } = useAnalyze();
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

  const handleUrlAnalyze = async (url: string) => {
    await analyzeUrl(url);
    afterAnalysis();
  };

  const handleDocumentAnalyze = async (fileBase64: string, mimeType: string, fileName: string) => {
    await analyzeDocument(fileBase64, mimeType, fileName);
    afterAnalysis();
  };

  const handleReset = () => {
    reset();
  };

  const showInput = !isAnalyzing && !result && !error;

  const displayName = user?.displayName ?? user?.email?.split("@")[0] ?? "Account";

  return (
    <div className="min-h-[100dvh] flex flex-col bg-black">
      {/* Matrix rain background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <MatrixRain className="opacity-25" />
      </div>
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/8 bg-black/95 backdrop-blur">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/15 p-2 rounded-lg border border-primary/20">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-white">
              Securify
            </span>
          </div>

          <div className="flex items-center gap-3">
            {stats && (
              <div className="hidden md:flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-white/50">
                  <Activity className="h-4 w-4" />
                  <span>{stats.total.toLocaleString()} analyzed</span>
                </div>
                <div className="w-px h-4 bg-white/10" />
                <div className="flex items-center gap-2 text-white/50">
                  <ShieldAlert className="h-4 w-4 text-primary/70" />
                  <span>{stats.scamRate.toFixed(1)}% scam rate</span>
                </div>
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-white/15 text-white/80 hover:text-white">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={displayName} className="h-5 w-5 rounded-full object-cover" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline max-w-[120px] truncate">{displayName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-[#111] border-white/10">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-sm text-white">{displayName}</span>
                    <span className="text-xs text-white/50 truncate">
                      {user?.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/8" />
                <DropdownMenuItem
                  className="gap-2 text-white/60 cursor-pointer hover:text-white"
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
      <main className="relative z-[1] flex-1 container mx-auto px-4 md:px-8 py-8 md:py-12 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column */}
          <div className="lg:col-span-8 space-y-6">
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-white">
                Suspicious message?{" "}
                <span className="text-primary">Let's check.</span>
              </h1>
              <p className="text-lg text-white/50 max-w-2xl">
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
                  className="bg-[#111] rounded-2xl border border-white/8 overflow-hidden"
                >
                  {/* Mode tabs */}
                  <div className="flex border-b border-white/8">
                    <button
                      onClick={() => setInputMode("image")}
                      className={cn(
                        "flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px",
                        inputMode === "image"
                          ? "border-primary text-primary"
                          : "border-transparent text-white/40 hover:text-white/70",
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
                          : "border-transparent text-white/40 hover:text-white/70",
                      )}
                      data-testid="tab-text"
                    >
                      <MessageSquare className="h-4 w-4" />
                      SMS
                    </button>
                    <button
                      onClick={() => setInputMode("url")}
                      className={cn(
                        "flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px",
                        inputMode === "url"
                          ? "border-primary text-primary"
                          : "border-transparent text-white/40 hover:text-white/70",
                      )}
                      data-testid="tab-url"
                    >
                      <Link className="h-4 w-4" />
                      Check URL
                    </button>
                    <button
                      onClick={() => setInputMode("document")}
                      className={cn(
                        "flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px",
                        inputMode === "document"
                          ? "border-primary text-primary"
                          : "border-transparent text-white/40 hover:text-white/70",
                      )}
                      data-testid="tab-document"
                    >
                      <FileText className="h-4 w-4" />
                      Document
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
                      ) : inputMode === "text" ? (
                        <motion.div
                          key="text-input"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <TextInputArea onAnalyze={handleTextAnalyze} disabled={isAnalyzing} />
                        </motion.div>
                      ) : inputMode === "url" ? (
                        <motion.div
                          key="url-input"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <UrlInputArea onAnalyze={handleUrlAnalyze} disabled={isAnalyzing} />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="document-input"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <DocumentUploadArea onAnalyze={handleDocumentAnalyze} disabled={isAnalyzing} />
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
                          className="gap-2 border-white/15 text-white/70 hover:text-white"
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
              <div className="md:hidden bg-[#111] rounded-xl border border-white/8 p-4 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-xs text-white/40 font-medium uppercase tracking-wider mb-1">Total Analyzed</span>
                  <span className="font-display font-semibold text-xl text-white">{stats.total.toLocaleString()}</span>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="flex flex-col items-end">
                  <span className="text-xs text-white/40 font-medium uppercase tracking-wider mb-1">Scam Rate</span>
                  <span className="font-display font-semibold text-xl text-primary">{stats.scamRate.toFixed(1)}%</span>
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
