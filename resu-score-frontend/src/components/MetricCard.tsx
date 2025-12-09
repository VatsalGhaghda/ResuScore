import { motion } from "framer-motion";
import { LucideIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface MetricDetail {
  label: string;
  value: string;
  status?: "good" | "warning" | "error";
}

interface MetricCardProps {
  title: string;
  icon: LucideIcon;
  details: MetricDetail[];
  delay?: number;
  className?: string;
}

const statusConfig = {
  good: "text-score-excellent",
  warning: "text-warning",
  error: "text-destructive",
};

export function MetricCard({
  title,
  icon: Icon,
  details,
  delay = 0,
  className,
}: MetricCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      className={cn(
        "glass rounded-2xl overflow-hidden transition-all duration-300",
        "hover:border-primary/30",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 flex items-center justify-between text-left hover:bg-primary/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <span className="font-display font-semibold">{title}</span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        </motion.div>
      </button>

      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? "auto" : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className="px-5 pb-5 space-y-3">
          {details.map((detail, index) => (
            <motion.div
              key={detail.label}
              className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: isExpanded ? 1 : 0, x: isExpanded ? 0 : -10 }}
              transition={{ delay: index * 0.05 }}
            >
              <span className="text-sm text-muted-foreground">{detail.label}</span>
              <span
                className={cn(
                  "text-sm font-medium",
                  detail.status ? statusConfig[detail.status] : "text-foreground"
                )}
              >
                {detail.value}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
