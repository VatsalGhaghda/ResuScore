import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  FileText, 
  Calendar, 
  TrendingUp, 
  ArrowLeft,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BackgroundEffects } from "@/components/BackgroundEffects";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getAllAnalyses } from "@/services/api";
import { toast } from "sonner";
import { format } from "date-fns";

const getScoreColor = (score: number) => {
  if (score >= 85) return { 
    text: "text-score-excellent", 
    bg: "bg-score-excellent/10",
    border: "border-score-excellent/30"
  };
  if (score >= 70) return { 
    text: "text-score-good", 
    bg: "bg-score-good/10",
    border: "border-score-good/30"
  };
  if (score >= 50) return { 
    text: "text-warning", 
    bg: "bg-warning/10",
    border: "border-warning/30"
  };
  return { 
    text: "text-score-poor", 
    bg: "bg-score-poor/10",
    border: "border-score-poor/30"
  };
};

const getScoreLabel = (score: number) => {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Needs Improvement';
};

const History = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const {
    data: analyses = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['analyses'],
    queryFn: getAllAnalyses,
  });

  // Show toast on error
  if (isError) {
    toast.error((error as Error)?.message || 'Failed to load analysis history');
  }

  // Filter analyses client-side based on search query
  const filteredAnalyses = useMemo(() => {
    if (!searchQuery.trim()) return analyses;
    const q = searchQuery.toLowerCase();
    return analyses.filter(
      (a) =>
        a.originalName.toLowerCase().includes(q) ||
        a.fileType.toLowerCase().includes(q)
    );
  }, [searchQuery, analyses]);

  const handleAnalysisClick = (analysisId: string) => {
    navigate(`/results?id=${analysisId}`);
  };


  if (isLoading) {
    return (
      <div className="min-h-screen relative">
        <BackgroundEffects />
        <Navbar />
        <main className="relative z-10 pt-24 pb-16 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analysis history...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <BackgroundEffects />
      <Navbar />
      
      <main className="relative z-10 pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <Link 
                to="/"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to Upload</span>
              </Link>
              <motion.h1
                className="font-display text-3xl md:text-4xl font-bold"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Analysis History
              </motion.h1>
              <motion.p
                className="text-muted-foreground mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {analyses.length} resume{analyses.length !== 1 ? 's' : ''} analyzed
              </motion.p>
            </div>

            <motion.div
              className="flex gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                variant="outline"
                onClick={() => refetch()}
                className="glass-hover"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </motion.div>
          </div>

          {/* Search and Filter */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by filename or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 glass"
              />
            </div>
          </motion.div>

          {/* Analyses List */}
          {filteredAnalyses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <GlassCard className="p-12 text-center">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display text-xl font-semibold mb-2">
                  {analyses.length === 0 ? "No analyses yet" : "No results found"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {analyses.length === 0
                    ? "Upload your first resume to get started"
                    : "Try adjusting your search query"}
                </p>
                {analyses.length === 0 && (
                  <Button asChild>
                    <Link to="/">
                      Upload Resume
                    </Link>
                  </Button>
                )}
              </GlassCard>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredAnalyses.map((analysis, index) => {
                const formatScore = analysis.analysisResults.formatScore ?? 0;
                const contentScore = analysis.analysisResults.contentScore ?? 0;
                const atsScore = analysis.analysisResults.atsScore ?? 0;
                const checks = analysis.analysisResults.checks || {
                  fileFormat: false,
                  structure: false,
                  headings: false,
                  skills: false,
                  experience: false,
                  education: false,
                  contactInfo: false,
                  keywords: false,
                  dates: false,
                  length: false
                };
                
                return (
                  <motion.div
                    key={analysis._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index + 0.4 }}
                    className="glass rounded-2xl p-6 hover:border-primary/50 transition-all duration-200 cursor-pointer"
                    onClick={() => handleAnalysisClick(analysis._id)}
                  >
                    {/* Header with score and metadata */}
                    <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className={`p-3 rounded-xl border ${getScoreColor(analysis.analysisResults.overallScore).bg} ${getScoreColor(analysis.analysisResults.overallScore).border}`}>
                          <FileText className={`w-5 h-5 ${getScoreColor(analysis.analysisResults.overallScore).text}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {analysis.originalName}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(analysis.uploadDate), "MMM d, yyyy")}
                            </span>
                            <span>•</span>
                            <span className="font-mono bg-secondary/30 px-1.5 py-0.5 rounded">
                              {analysis.fileType.toUpperCase()}
                            </span>
                            <span>•</span>
                            <span>{(analysis.fileSize / 1024).toFixed(1)} KB</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-display font-bold text-4xl ${getScoreColor(analysis.analysisResults.overallScore).text}`}>
                          {analysis.analysisResults.overallScore}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getScoreLabel(analysis.analysisResults.overallScore)}
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 bg-secondary rounded-full overflow-hidden mb-6">
                      <div 
                        className={`h-full rounded-full ${getScoreColor(analysis.analysisResults.overallScore).bg.replace('bg-', 'bg-opacity-100 ')}`}
                        style={{ width: `${analysis.analysisResults.overallScore}%` }}
                      />
                    </div>

                    {/* Score breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 rounded-lg bg-background/50 border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Format</span>
                          <span className={`text-sm font-medium ${getScoreColor(formatScore).text}`}>
                            {formatScore}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${getScoreColor(formatScore).bg.replace('bg-', 'bg-opacity-100 ')}`}
                            style={{ width: `${formatScore}%` }}
                          />
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-background/50 border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Content</span>
                          <span className={`text-sm font-medium ${getScoreColor(contentScore).text}`}>
                            {contentScore}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${getScoreColor(contentScore).bg.replace('bg-', 'bg-opacity-100 ')}`}
                            style={{ width: `${contentScore}%` }}
                          />
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-background/50 border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">ATS</span>
                          <span className={`text-sm font-medium ${getScoreColor(atsScore).text}`}>
                            {atsScore}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${getScoreColor(atsScore).bg.replace('bg-', 'bg-opacity-100 ')}`}
                            style={{ width: `${atsScore}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quick checks */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className={cn("flex items-center gap-2 text-sm p-2 rounded-lg", checks.contactInfo ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                        {checks.contactInfo ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        <span>Contact Info</span>
                      </div>
                      <div className={cn("flex items-center gap-2 text-sm p-2 rounded-lg", checks.experience ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                        {checks.experience ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        <span>Experience</span>
                      </div>
                      <div className={cn("flex items-center gap-2 text-sm p-2 rounded-lg", checks.education ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                        {checks.education ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        <span>Education</span>
                      </div>
                      <div className={cn("flex items-center gap-2 text-sm p-2 rounded-lg", checks.skills ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                        {checks.skills ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        <span>Skills</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-6 text-xs text-muted-foreground">
                      <TrendingUp className="w-3 h-3" />
                      <span>Click for detailed analysis</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default History;

