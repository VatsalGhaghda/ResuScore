import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScoreGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const getScoreColor = (score: number) => {
  if (score >= 85) return "stroke-score-excellent";
  if (score >= 70) return "stroke-score-good";
  if (score >= 50) return "stroke-warning";
  return "stroke-score-poor";
};

const getScoreColorText = (score: number) => {
  if (score >= 85) return "text-score-excellent";
  if (score >= 70) return "text-score-good";
  if (score >= 50) return "text-warning";
  return "text-score-poor";
};

const sizeConfig = {
  sm: { size: 80, strokeWidth: 6, fontSize: "text-xl" },
  md: { size: 120, strokeWidth: 8, fontSize: "text-3xl" },
  lg: { size: 180, strokeWidth: 10, fontSize: "text-5xl" },
  xl: { size: 240, strokeWidth: 12, fontSize: "text-6xl" },
};

export function ScoreGauge({ 
  score, 
  size = "lg", 
  showLabel = true, 
  label = "Overall Score",
  className 
}: ScoreGaugeProps) {
  const config = sizeConfig[size];
  const radius = (config.size - config.strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="relative" style={{ width: config.size, height: config.size }}>
        {/* Background glow */}
        <div 
          className="absolute inset-0 rounded-full opacity-30 blur-xl"
          style={{
            background: score >= 85 
              ? "hsl(158 64% 52%)" 
              : score >= 70 
                ? "hsl(172 66% 50%)" 
                : score >= 50 
                  ? "hsl(43 96% 56%)" 
                  : "hsl(0 72% 51%)"
          }}
        />
        
        <svg
          width={config.size}
          height={config.size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            fill="none"
            strokeWidth={config.strokeWidth}
            className="stroke-secondary"
          />
          
          {/* Progress circle */}
          <motion.circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            fill="none"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            className={getScoreColor(score)}
            style={{
              strokeDasharray: circumference,
            }}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>

        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={cn("font-display font-bold", config.fontSize, getScoreColorText(score))}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {score}
          </motion.span>
          <span className="text-muted-foreground text-xs uppercase tracking-widest">/ 100</span>
        </div>
      </div>

      {showLabel && (
        <motion.p
          className="text-muted-foreground font-medium text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {label}
        </motion.p>
      )}
    </div>
  );
}
