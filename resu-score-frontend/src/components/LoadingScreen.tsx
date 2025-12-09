import { motion } from "framer-motion";
import { FileText, Sparkles, Search, CheckCircle } from "lucide-react";

const steps = [
  { icon: FileText, label: "Reading document", delay: 0 },
  { icon: Search, label: "Analyzing content", delay: 1 },
  { icon: Sparkles, label: "Evaluating ATS compatibility", delay: 2 },
  { icon: CheckCircle, label: "Generating score", delay: 3 },
];

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        {/* Animated logo */}
        <motion.div
          className="relative w-24 h-24 mx-auto mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Outer ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Inner ring */}
          <motion.div
            className="absolute inset-2 rounded-full border-2 border-primary/50"
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <FileText className="w-6 h-6 text-primary" />
            </motion.div>
          </div>
        </motion.div>

        <motion.h2
          className="font-display text-2xl font-bold mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Analyzing Your Resume
        </motion.h2>
        
        <motion.p
          className="text-muted-foreground mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          This will only take a moment...
        </motion.p>

        {/* Steps */}
        <div className="space-y-4 max-w-xs mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.label}
              className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: step.delay * 0.5 + 0.5 }}
            >
              <motion.div
                className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"
                animate={{
                  backgroundColor: [
                    "hsl(252 87% 64% / 0.1)",
                    "hsl(252 87% 64% / 0.3)",
                    "hsl(252 87% 64% / 0.1)",
                  ],
                }}
                transition={{
                  delay: step.delay * 0.5 + 0.5,
                  duration: 1.5,
                  repeat: Infinity,
                }}
              >
                <step.icon className="w-4 h-4 text-primary" />
              </motion.div>
              <span className="text-sm text-muted-foreground">{step.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
