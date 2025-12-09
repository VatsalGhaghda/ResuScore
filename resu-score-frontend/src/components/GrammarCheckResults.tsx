import { AlertCircle, CheckCircle, AlertTriangle, Info, ArrowRight, Sparkles, Lightbulb, Zap, BarChart2, TrendingUp, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

type GrammarIssue = {
  type: 'error' | 'warning' | 'suggestion';
  message: string;
  context: string;
  lineNumber: number;
  suggestion?: string;
  explanation: string;
  impact: 'high' | 'medium' | 'low';
};

interface GrammarCheckResultsProps {
  issues: GrammarIssue[];
  score: number;
  summary: {
    totalWords: number;
    totalSentences: number;
    avgSentenceLength: number;
    readabilityLevel: string;
    passiveVoiceCount: number;
    firstPersonCount: number;
    inconsistentTenseCount: number;
  };
}

const impactColors = {
  high: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800/50',
    text: 'text-red-700 dark:text-red-300',
    icon: 'text-red-500 dark:text-red-400',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    highlight: 'bg-red-100/50 dark:bg-red-900/20',
  },
  medium: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800/50',
    text: 'text-yellow-700 dark:text-yellow-300',
    icon: 'text-yellow-500 dark:text-yellow-400',
    badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    highlight: 'bg-yellow-100/50 dark:bg-yellow-900/20',
  },
  low: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800/50',
    text: 'text-blue-700 dark:text-blue-300',
    icon: 'text-blue-500 dark:text-blue-400',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    highlight: 'bg-blue-100/50 dark:bg-blue-900/20',
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800/50',
    text: 'text-green-700 dark:text-green-300',
    icon: 'text-green-500 dark:text-green-400',
    badge: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    highlight: 'bg-green-100/50 dark:bg-green-900/20',
  },
};

const typeIcons = {
  error: <AlertCircle className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
  suggestion: <Lightbulb className="w-5 h-5" />,
  success: <CheckCircle className="w-5 h-5" />,
};

const typeLabels = {
  error: 'Error',
  warning: 'Warning',
  suggestion: 'Suggestion',
  success: 'Success',
};

export function GrammarCheckResults({ issues = [], score = 0, summary }: GrammarCheckResultsProps) {
  const [selectedIssue, setSelectedIssue] = useState<GrammarIssue | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'error' | 'warning' | 'suggestion'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const filteredIssues = activeTab === 'all' 
    ? issues 
    : issues.filter(issue => issue.type === activeTab);

  const issueCounts = issues.reduce(
    (acc, issue) => {
      acc[issue.type]++;
      return acc;
    },
    { error: 0, warning: 0, suggestion: 0 }
  );

  const getReadabilityColor = (level: string) => {
    const levels = {
      'College': 'text-green-600 dark:text-green-400',
      'High School': 'text-yellow-600 dark:text-yellow-400',
      'Middle School': 'text-red-600 dark:text-red-400',
      'Elementary': 'text-red-700 dark:text-red-500',
    };
    return levels[level as keyof typeof levels] || 'text-gray-700 dark:text-gray-300';
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Grammar Score</span>
            <div className={`p-2 rounded-lg ${score >= 80 ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : score >= 60 ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
              {score >= 80 ? <CheckCircle className="w-5 h-5" /> : score >= 60 ? <AlertTriangle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>
          </div>
          <div className="flex items-baseline">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{Math.round(score)}</div>
            <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">/ 100</span>
          </div>
          <div className="mt-3 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={cn(
                'h-full rounded-full',
                score >= 80 ? 'bg-gradient-to-r from-green-400 to-green-500' : 
                score >= 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 
                'bg-gradient-to-r from-red-400 to-red-500'
              )}
              style={{ width: `${Math.min(score, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {score >= 80 ? 'Excellent!' : score >= 60 ? 'Good, but could be improved' : 'Needs attention'}
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Issues Found</span>
            <div className="p-2 rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-300">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-900/10">
              <div className="text-lg font-bold text-red-600 dark:text-red-400">{issueCounts.error}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Errors</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/10">
              <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{issueCounts.warning}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Warnings</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-900/10">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{issueCounts.suggestion}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Suggestions</div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Readability</span>
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <BarChart2 className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-2xl font-bold ${getReadabilityColor(summary.readabilityLevel)}`}>
            {summary.readabilityLevel}
          </div>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
              <span>{summary.avgSentenceLength.toFixed(1)} words per sentence</span>
            </div>
            <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              {summary.avgSentenceLength > 15 ? 'Consider shorter sentences for better readability' : 
               summary.avgSentenceLength < 10 ? 'Good sentence length' : 'Average sentence length'}
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Writing Style</span>
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-300">Passive Voice</span>
                <span className={`font-medium ${summary.passiveVoiceCount > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                  {summary.passiveVoiceCount} {summary.passiveVoiceCount === 1 ? 'instance' : 'instances'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                <div 
                  className={`h-1.5 rounded-full ${summary.passiveVoiceCount > 0 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                  style={{ width: `${Math.min(summary.passiveVoiceCount * 20, 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-300">First Person</span>
                <span className={`font-medium ${summary.firstPersonCount > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'}`}>
                  {summary.firstPersonCount} {summary.firstPersonCount === 1 ? 'use' : 'uses'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                <div 
                  className={`h-1.5 rounded-full ${summary.firstPersonCount > 0 ? 'bg-blue-500' : 'bg-green-500'}`} 
                  style={{ width: `${Math.min(summary.firstPersonCount * 10, 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-300">Inconsistent Tense</span>
                <span className={`font-medium ${summary.inconsistentTenseCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {summary.inconsistentTenseCount} {summary.inconsistentTenseCount === 1 ? 'issue' : 'issues'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                <div 
                  className={`h-1.5 rounded-full ${summary.inconsistentTenseCount > 0 ? 'bg-red-500' : 'bg-green-500'}`} 
                  style={{ width: `${Math.min(summary.inconsistentTenseCount * 20, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <motion.div 
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="sticky top-0 z-10 bg-white dark:bg-gray-900 pt-2 pb-1 border-b border-gray-200 dark:border-gray-700"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-6 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <span className="flex items-center">
                <span className="mr-1.5">All Issues</span>
                <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  issues.length > 0 
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {issues.length}
                </span>
              </span>
            </button>
            
            <button
              onClick={() => setActiveTab('error')}
              className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 inline-flex items-center ${
                activeTab === 'error'
                  ? 'border-red-500 text-red-600 dark:text-red-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <AlertCircle className="w-4 h-4 mr-1.5 flex-shrink-0" />
              <span className="mr-1.5">Errors</span>
              {issueCounts.error > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                  {issueCounts.error}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('warning')}
              className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 inline-flex items-center ${
                activeTab === 'warning'
                  ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <AlertTriangle className="w-4 h-4 mr-1.5 flex-shrink-0" />
              <span className="mr-1.5">Warnings</span>
              {issueCounts.warning > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                  {issueCounts.warning}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('suggestion')}
              className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 inline-flex items-center ${
                activeTab === 'suggestion'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Lightbulb className="w-4 h-4 mr-1.5 flex-shrink-0" />
              <span className="mr-1.5">Suggestions</span>
              {issueCounts.suggestion > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  {issueCounts.suggestion}
                </span>
              )}
            </button>
          </nav>
        </div>
      </motion.div>

      {/* Issues List */}
      <div className="space-y-4 py-2">
        <AnimatePresence mode="wait">
          {filteredIssues.length === 0 ? (
            <motion.div 
              key="no-issues"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center py-12 px-4"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <CheckCircle className="w-8 h-8 text-green-500 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {activeTab === 'all' 
                  ? 'No issues found! 🎉' 
                  : `No ${activeTab}s found`}
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                {activeTab === 'all' 
                  ? 'Your resume looks great! No grammar, style, or formatting issues were detected.'
                  : `No ${activeTab}s found in your resume. Check other tabs for different types of feedback.`}
                }
              </p>
              {activeTab !== 'all' && (
                <button
                  onClick={() => setActiveTab('all')}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
                >
                  View All Issues
                </button>
              )}
            </motion.div>
        ) : (
          <motion.div 
            key={`issues-${activeTab}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {filteredIssues.map((issue, index) => (
              <motion.div
                key={`${issue.type}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className={`border rounded-xl overflow-hidden transition-all duration-200 ${
                  issue.type === 'error' 
                    ? 'border-red-200 dark:border-red-900/50 bg-white dark:bg-gray-800/50 hover:shadow-md hover:border-red-300 dark:hover:border-red-800/70' 
                    : issue.type === 'warning'
                    ? 'border-yellow-200 dark:border-yellow-900/50 bg-white dark:bg-gray-800/50 hover:shadow-md hover:border-yellow-300 dark:hover:border-yellow-800/70'
                    : 'border-blue-200 dark:border-blue-900/50 bg-white dark:bg-gray-800/50 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-800/70'
                }`}
              >
                <div 
                  className={`px-5 py-3 flex items-start sm:items-center justify-between cursor-pointer transition-colors duration-150 ${
                    issue.type === 'error' 
                      ? impactColors.high.highlight
                      : issue.type === 'warning'
                      ? impactColors.medium.highlight
                      : impactColors.low.highlight
                  }`}
                  onClick={() => setSelectedIssue(issue === selectedIssue ? null : issue)}
                >
                  <div className="flex items-start">
                    <span className={`mt-0.5 mr-3 flex-shrink-0 ${
                      issue.type === 'error' 
                        ? impactColors.high.icon
                        : issue.type === 'warning'
                        ? impactColors.medium.icon
                        : impactColors.low.icon
                    }`}>
                      {typeIcons[issue.type]}
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white line-clamp-2">
                        {issue.message}
                      </div>
                      <div className="flex flex-wrap items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center">
                          <span className="hidden sm:inline">Line</span> {issue.lineNumber}
                        </span>
                        <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
                        <span className="capitalize">{issue.impact} impact</span>
                        <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
                        <span className="capitalize text-blue-600 dark:text-blue-400">
                          {typeLabels[issue.type]}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center ml-3 flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      issue.impact === 'high' 
                        ? impactColors.high.badge
                        : issue.impact === 'medium'
                        ? impactColors.medium.badge
                        : impactColors.low.badge
                    }`}>
                      {issue.impact.toUpperCase()}
                    </span>
                    <div className="ml-3 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                      <svg
                        className={`h-5 w-5 text-gray-400 transition-transform ${selectedIssue === issue ? 'rotate-180' : ''}`}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <AnimatePresence>
                  {selectedIssue === issue && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-5 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                              <span className="w-1.5 h-4 rounded-sm bg-blue-500 mr-2"></span>
                              Context
                            </h4>
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-sm text-gray-800 dark:text-gray-200 font-mono leading-relaxed border border-gray-200 dark:border-gray-600/50">
                              <span className="text-gray-400">...</span>
                              <span className="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">
                                {issue.context}
                              </span>
                              <span className="text-gray-400">...</span>
                            </div>
                            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                              <Info className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                              This issue was found on line {issue.lineNumber}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                              <span className="w-1.5 h-4 rounded-sm bg-green-500 mr-2"></span>
                              Suggestion
                            </h4>
                            <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-lg text-sm border border-green-100 dark:border-green-900/30">
                              <div className="flex">
                                <div className="flex-shrink-0">
                                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-500">
                                    <Lightbulb className="w-4 h-4" />
                                  </div>
                                </div>
                                <div className="ml-3">
                                  <p className="text-green-800 dark:text-green-200 font-medium">{issue.suggestion}</p>
                                  {issue.explanation && (
                                    <div className="mt-2 p-3 bg-white dark:bg-gray-800/50 rounded border border-green-100 dark:border-green-900/30">
                                      <p className="text-sm text-green-700 dark:text-green-300">
                                        {issue.explanation}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                                <span className="w-1.5 h-4 rounded-sm bg-purple-500 mr-2"></span>
                                Quick Fix
                              </h4>
                              <div className="flex items-center space-x-3">
                                <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150">
                                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                  Apply Suggestion
                                </button>
                                <button className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                                  Ignore Issue
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700">
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">How to Improve</h4>
                          <ul className="space-y-3">
                            <li className="flex items-start">
                              <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3 mt-0.5">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">Review the highlighted text in context</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Make sure the suggested change fits the overall context of your resume.</p>
                              </div>
                            </li>
                            <li className="flex items-start">
                              <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3 mt-0.5">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">Consider the suggested improvement</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">The suggestion is based on best practices for resume writing.</p>
                              </div>
                            </li>
                            <li className="flex items-start">
                              <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3 mt-0.5">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">Maintain consistency</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Ensure similar issues are fixed throughout your resume for a professional look.</p>
                              </div>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Writing Tips */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-6 shadow-sm"
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                Professional Writing Tips
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Enhance your resume with these expert recommendations
              </p>
            </div>
            <div className="mt-3 md:mt-0">
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150">
                View All Tips
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <motion.div 
              whileHover={{ y: -2 }}
              className="group bg-white dark:bg-gray-800/50 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 hover:shadow-md transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white">Be Concise & Impactful</h4>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Use bullet points and keep sentences short. Aim for 1-2 lines per bullet to improve readability.
              </p>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -2 }}
              className="group bg-white dark:bg-gray-800/50 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 hover:shadow-md transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white">Use Strong Action Verbs</h4>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Start bullet points with powerful verbs like "Spearheaded," "Optimized," "Transformed," or "Pioneered."
              </p>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -2 }}
              className="group bg-white dark:bg-gray-800/50 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 hover:shadow-md transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 mb-3 group-hover:bg-green-600 group-hover:text-white transition-colors">
                <BarChart2 className="w-5 h-5" />
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white">Quantify Achievements</h4>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Include metrics and numbers to demonstrate impact (e.g., "Boosted conversion by 42% in Q3 2023").
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Add custom scrollbar styles */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

export default GrammarCheckResults;
