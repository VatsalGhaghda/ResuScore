import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, CheckCircle2, AlertTriangle, Lightbulb,
  RefreshCw, ChevronDown, ChevronUp, Briefcase, Building2,
  ArrowRight, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui/GlassCard';
import { aiRewrite } from '@/services/api';

interface AIInsights {
  overallScore: number;
  rolePrediction: string;
  industryPrediction: string;
  strengths: string[];
  criticalIssues: string[];
  rewriteSuggestions: Array<{ original: string; improved: string }>;
  tailoredAdvice: string;
}

interface RewriteState {
  loading: boolean;
  result: { original: string; improved: string; explanation: string } | null;
  error: string | null;
}

export function AIInsightsCard({ insights, rolePrediction }: { insights: AIInsights; rolePrediction?: string }) {
  const [expanded, setExpanded] = useState(true);
  const [rewriteStates, setRewriteStates] = useState<Record<number, RewriteState>>({});

  const handleRewrite = async (index: number, text: string) => {
    setRewriteStates(prev => ({
      ...prev,
      [index]: { loading: true, result: null, error: null },
    }));
    try {
      const result = await aiRewrite(text, rolePrediction || insights.rolePrediction);
      setRewriteStates(prev => ({
        ...prev,
        [index]: { loading: false, result, error: null },
      }));
    } catch (err) {
      setRewriteStates(prev => ({
        ...prev,
        [index]: { loading: false, result: null, error: err instanceof Error ? err.message : 'Rewrite failed' },
      }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mb-8"
    >
      <GlassCard className="overflow-hidden border border-purple-500/20">
        {/* Header */}
        <div
          className="flex items-center justify-between cursor-pointer select-none p-6 pb-4"
          onClick={() => setExpanded(e => !e)}
          role="button"
          aria-expanded={expanded}
          id="ai-insights-header"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                AI Analysis
              </h2>
              <p className="text-xs text-muted-foreground">Comprehensive resume evaluation</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* AI Score Badge */}
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-400">{insights.overallScore}</div>
              <div className="text-xs text-muted-foreground">AI Score</div>
            </div>
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 space-y-6">
                {/* Role & Industry Badges */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-sm">
                    <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-blue-300 font-medium">{insights.rolePrediction}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-sm">
                    <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-cyan-300 font-medium">{insights.industryPrediction}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Strengths */}
                  {insights.strengths.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Strengths
                      </h3>
                      <ul className="space-y-2">
                        {insights.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Critical Issues */}
                  {insights.criticalIssues.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-rose-400 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Critical Issues
                      </h3>
                      <ul className="space-y-2">
                        {insights.criticalIssues.map((issue, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Tailored Advice */}
                {insights.tailoredAdvice && (
                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-semibold text-amber-400">Tailored Advice</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{insights.tailoredAdvice}</p>
                  </div>
                )}

                {/* Rewrite Suggestions */}
                {insights.rewriteSuggestions.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" /> AI Rewrite Suggestions
                    </h3>
                    {insights.rewriteSuggestions.map((s, i) => {
                      const state = rewriteStates[i];
                      return (
                        <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                          {/* Original */}
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1">Original</div>
                            <p className="text-sm text-foreground/70 leading-relaxed line-clamp-3">{s.original}</p>
                          </div>

                          {/* Default improved from AI analysis */}
                          {!state?.result && (
                            <div>
                              <div className="flex items-center gap-1.5 text-xs font-medium text-purple-300 mb-1">
                                <Sparkles className="w-3 h-3" /> Suggested Improvement
                              </div>
                              <p className="text-sm text-foreground leading-relaxed">{s.improved}</p>
                            </div>
                          )}

                          {/* On-demand rewrite result */}
                          {state?.result && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-300 mb-1">
                                <Sparkles className="w-3 h-3" /> Rewritten Version
                              </div>
                              <p className="text-sm text-foreground leading-relaxed">{state.result.improved}</p>
                              <p className="text-xs text-muted-foreground italic">{state.result.explanation}</p>
                            </div>
                          )}

                          {/* Error */}
                          {state?.error && (
                            <p className="text-xs text-rose-400">{state.error}</p>
                          )}

                          {/* Rewrite button */}
                          <button
                            id={`ai-rewrite-btn-${i}`}
                            onClick={() => handleRewrite(i, s.original)}
                            disabled={state?.loading}
                            className={cn(
                              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                              'bg-purple-500/10 border border-purple-500/20 text-purple-300',
                              'hover:bg-purple-500/20 hover:border-purple-500/40',
                              'disabled:opacity-50 disabled:cursor-not-allowed'
                            )}
                          >
                            {state?.loading ? (
                              <><Loader2 className="w-3 h-3 animate-spin" /> Rewriting...</>
                            ) : state?.result ? (
                              <><RefreshCw className="w-3 h-3" /> Rewrite Again</>
                            ) : (
                              <><ArrowRight className="w-3 h-3" /> Rewrite with AI</>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
}
