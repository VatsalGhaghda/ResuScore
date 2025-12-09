import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, XCircle, ChevronRight, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";

interface Suggestion {
  id: string;
  type: "success" | "warning" | "error";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
}

interface SuggestionListProps {
  suggestions: Suggestion[];
  className?: string;
}

const typeConfig = {
  success: {
    icon: CheckCircle,
    iconClass: "text-score-excellent",
    bgClass: "bg-score-excellent/10",
    borderClass: "border-score-excellent/20",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-warning",
    bgClass: "bg-warning/10",
    borderClass: "border-warning/20",
  },
  error: {
    icon: XCircle,
    iconClass: "text-destructive",
    bgClass: "bg-destructive/10",
    borderClass: "border-destructive/20",
  },
};

const impactBadge = {
  high: "bg-destructive/20 text-destructive",
  medium: "bg-warning/20 text-warning",
  low: "bg-muted text-muted-foreground",
};

export function SuggestionList({ suggestions, className }: SuggestionListProps) {
  return (
    <GlassCard className={className} hover={false}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
          <Lightbulb className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-lg">Improvement Suggestions</h3>
          <p className="text-sm text-muted-foreground">
            {suggestions.length} recommendations to boost your score
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion, index) => {
          const config = typeConfig[suggestion.type];
          const Icon = config.icon;

          return (
            <motion.div
              key={suggestion.id}
              className={cn(
                "p-4 rounded-xl border transition-all duration-200 cursor-pointer group",
                "hover:border-primary/30 hover:bg-primary/5",
                config.bgClass,
                config.borderClass
              )}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ x: 4 }}
            >
              <div className="flex items-start gap-3">
                <div className={cn("p-1.5 rounded-lg", config.bgClass)}>
                  <Icon className={cn("w-4 h-4", config.iconClass)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-foreground text-sm">
                      {suggestion.title}
                    </h4>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide",
                      impactBadge[suggestion.impact]
                    )}>
                      {suggestion.impact}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {suggestion.description}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </GlassCard>
  );
}
