import { motion } from "framer-motion";
import { Check, X, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";

interface ChecklistItem {
  id: string;
  label: string;
  isComplete: boolean;
  category: string;
}

interface ChecklistSectionProps {
  items: ChecklistItem[];
  className?: string;
}

export function ChecklistSection({ items, className }: ChecklistSectionProps) {
  const completedCount = items.filter((item) => item.isComplete).length;
  const completionPercentage = Math.round((completedCount / items.length) * 100);

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  return (
    <GlassCard className={className} hover={false}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <ClipboardList className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg">Resume Checklist</h3>
            <p className="text-sm text-muted-foreground">
              {completedCount} of {items.length} items complete
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="font-display font-bold text-2xl text-primary">
            {completionPercentage}%
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-secondary rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${completionPercentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>

      {/* Grouped checklist items */}
      <div className="space-y-6">
        {Object.entries(groupedItems).map(([category, categoryItems], categoryIndex) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: categoryIndex * 0.1 }}
          >
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
              {category}
            </h4>
            <div className="space-y-2">
              {categoryItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
                    item.isComplete 
                      ? "bg-score-excellent/5 border border-score-excellent/20" 
                      : "bg-destructive/5 border border-destructive/20"
                  )}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: categoryIndex * 0.1 + index * 0.05 }}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center",
                    item.isComplete ? "bg-score-excellent/20" : "bg-destructive/20"
                  )}>
                    {item.isComplete ? (
                      <Check className="w-3.5 h-3.5 text-score-excellent" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-destructive" />
                    )}
                  </div>
                  <span className={cn(
                    "text-sm",
                    item.isComplete ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {item.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}
