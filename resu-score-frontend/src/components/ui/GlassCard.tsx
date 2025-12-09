import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  variant?: "default" | "elevated" | "glow" | "subtle";
  hover?: boolean;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", hover = true, children, ...props }, ref) => {
    const variants = {
      default: "glass",
      elevated: "glass shadow-[0_20px_60px_hsl(0_0%_0%/0.4)]",
      glow: "glass glow",
      subtle: "bg-secondary/30 border border-border/50",
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          "rounded-2xl p-6",
          variants[variant],
          hover && "transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_60px_hsl(252_87%_64%/0.15)]",
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export { GlassCard };
