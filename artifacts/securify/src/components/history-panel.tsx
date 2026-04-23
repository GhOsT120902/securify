import { useListResults, getListResultsQueryKey, AnalysisResult } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, ShieldCheck, Clock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface HistoryPanelProps {
  refreshTrigger?: number; // Used to trigger refetch after new analysis
}

export function HistoryPanel({ refreshTrigger }: HistoryPanelProps) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useListResults({ limit: 10 });

  useEffect(() => {
    if (refreshTrigger) {
      queryClient.invalidateQueries({ queryKey: getListResultsQueryKey() });
    }
  }, [refreshTrigger, queryClient]);

  if (isLoading) {
    return (
      <Card className="border-muted/40 shadow-sm bg-card/50">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Analyses
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-muted"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const results = data?.results || [];

  if (results.length === 0) {
    return (
      <Card className="border-muted/40 shadow-sm bg-card/50">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Analyses
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center text-muted-foreground text-sm">
          No past analyses found. Your recent checks will appear here.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-muted/40 shadow-sm overflow-hidden flex flex-col max-h-[600px]">
      <CardHeader className="pb-3 border-b border-border/50 bg-card">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Recent Analyses
        </CardTitle>
      </CardHeader>
      <ScrollArea className="flex-grow">
        <div className="divide-y divide-border/50">
          {results.map((result: AnalysisResult) => (
            <div key={result.id} className="p-4 hover:bg-muted/30 transition-colors group">
              <div className="flex items-start gap-3">
                <div className={cn(
                  "mt-0.5 p-1.5 rounded-full shrink-0",
                  result.isScam ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                )}>
                  {result.isScam ? <AlertTriangle className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <Badge 
                      variant={result.isScam ? "destructive" : "outline"} 
                      className={cn(
                        "font-medium text-[10px] uppercase tracking-wider px-2 py-0",
                        !result.isScam && "border-primary/30 text-primary bg-primary/5"
                      )}
                    >
                      {result.isScam ? "Scam" : "Safe"}
                    </Badge>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatDistanceToNow(new Date(result.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground line-clamp-2 mb-2 font-medium leading-snug">
                    {result.text || "No text extracted"}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {result.summary}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
