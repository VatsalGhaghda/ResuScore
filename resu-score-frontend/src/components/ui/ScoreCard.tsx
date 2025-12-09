import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface ScoreCardProps {
  title: string;
  score: number;
  icon: LucideIcon;
  description?: string;
  delay?: number;
  className?: string;
}

const getScoreColor = (score: number) => {
  if (score >= 85) return { bg: "bg-score-excellent/10", text: "text-score-excellent", border: "border-score-excellent/30" };
  if (score >= 70) return { bg: "bg-score-good/10", text: "text-score-good", border: "border-score-good/30" };
  if (score >= 50) return { bg: "bg-warning/10", text: "text-warning", border: "border-warning/30" };
  return { bg: "bg-score-poor/10", text: "text-score-poor", border: "border-score-poor/30" };
};

export function ScoreCard({ 
  title, 
  score, 
  icon: Icon, 
  description,
  delay = 0,
  className 
}: ScoreCardProps) {
  const colors = getScoreColor(score);

  return (
    <motion.div
      className={cn(
        "glass rounded-2xl p-5 relative overflow-hidden group cursor-pointer",
        "transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_40px_hsl(252_87%_64%/0.1)]",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Background gradient on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-primary/5 to-transparent" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={cn("p-3 rounded-xl", colors.bg, colors.border, "border")}>
            <Icon className={cn("w-5 h-5", colors.text)} />
          </div>
          <motion.span
            className={cn("font-display font-bold text-3xl", colors.text)}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.2, duration: 0.4 }}
          >
            {score}
          </motion.span>
        </div>

        <h3 className="font-display font-semibold text-foreground mb-1">{title}</h3>
        
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}

        {/* Progress bar */}
        <div className="mt-4 h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", colors.text.replace("text-", "bg-"))}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ delay: delay + 0.3, duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
}
