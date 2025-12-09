import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
  className?: string;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  delay = 0,
  className,
}: FeatureCardProps) {
  return (
    <motion.div
      className={cn(
        "group relative p-6 rounded-2xl transition-all duration-300 cursor-pointer",
        "glass-hover",
        className
      )}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -5 }}
    >
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        <motion.div
          className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-300"
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          <Icon className="w-6 h-6 text-primary" />
        </motion.div>
        
        <h3 className="font-display font-semibold text-lg mb-2 text-foreground">
          {title}
        </h3>
        
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
}
