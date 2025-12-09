export interface GrammarIssue {
  type: 'error' | 'warning' | 'suggestion';
  message: string;
  context: string;
  lineNumber: number;
  suggestion?: string;
  explanation: string;
  impact: 'high' | 'medium' | 'low';
  text?: string;
  position?: { start: number; end: number };
}

export interface GrammarCheckResult {
  issues: GrammarIssue[];
  score: number;
  issueCount: number;
  errorCount: number;
  warningCount: number;
  suggestionCount: number;
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

interface GrammarRule {
  id: string;
  name: string;
  description: string;
  pattern: RegExp | { [key: string]: RegExp };
  type: 'error' | 'warning' | 'suggestion';
  impact: 'high' | 'medium' | 'low';
  suggestion: string;
}

const RESUME_GRAMMAR_RULES: GrammarRule[] = [
  {
    id: 'passive-voice',
    name: 'Passive Voice',
    description: 'Passive voice can make your writing less direct and engaging.',
    pattern: /\b(?:am|is|are|was|were|be|been|being)\s+[a-z]+ed\b/gi,
    type: 'warning',
    impact: 'medium',
    suggestion: 'Try to use active voice for more impactful statements.',
  },
  {
    id: 'first-person',
    name: 'First Person',
    description: 'Resumes should generally avoid first-person pronouns.',
    pattern: /\b(I|me|my|mine|myself)\b/gi,
    type: 'warning',
    impact: 'medium',
    suggestion: 'Remove first-person pronouns for a more professional tone.',
  },
  {
    id: 'inconsistent-tense',
    name: 'Inconsistent Verb Tense',
    description: 'Inconsistent verb tense can be confusing to readers.',
    pattern: {
      past: /\b(?:developed|created|managed|led|improved|increased|achieved|designed|implemented|reduced|saved|grew|built|launched|initiated|established|increased|decreased|optimized|streamlined|expanded|generated|produced|delivered|completed|exceeded|transformed)\b/gi,
      present: /\b(?:develop|create|manage|lead|improve|increase|achieve|design|implement|reduce|save|grow|build|launch|initiate|establish|increase|decrease|optimize|streamline|expand|generate|produce|deliver|complete|exceed|transform)\b/gi,
    },
    type: 'warning',
    impact: 'medium',
    suggestion: 'Use consistent verb tense (preferably past tense for past roles, present for current roles).',
  },
  {
    id: 'weak-verbs',
    name: 'Weak Action Verbs',
    description: 'Using strong action verbs makes your experience more impactful.',
    pattern: /\b(did|made|got|put|set|went|came|tried|started|began|helped|worked|used)\b/gi,
    type: 'suggestion',
    impact: 'low',
    suggestion: 'Replace with stronger action verbs like "achieved," "developed," or "implemented".',
  },
  {
    id: 'cliche-phrases',
    name: 'Overused Phrases',
    description: 'Clichés can make your resume sound generic.',
    pattern: /\b(team player|hard worker|detail-oriented|think outside the box|synergy|go-getter|results-driven|self-starter|dynamic|proven track record|go-to person|value add|outside the box|win-win|best of breed|cutting-edge|game changer|thought leadership|paradigm shift|leverage|circle back|drill down|low-hanging fruit|pushing the envelope|move the needle|win-win situation|think big picture)\b/gi,
    type: 'suggestion',
    impact: 'low',
    suggestion: 'Replace with specific examples of your achievements and impact.',
  },
  {
    id: 'vague-terms',
    name: 'Vague Terms',
    description: 'Vague terms don\'t provide concrete information about your achievements.',
    pattern: /\b(a lot|many|various|several|some|few|numerous|various|helped|assisted|participated|involved in|familiar with|knowledge of|experience with|responsible for|duties included|tasks included|worked on|helped with|contributed to)\b/gi,
    type: 'warning',
    impact: 'medium',
    suggestion: 'Be specific about your contributions and quantify your achievements when possible.',
  }
];

const COMMON_MISSPELLINGS: { [key: string]: string } = {
  'recieve': 'receive',
  'seperate': 'separate',
  'occured': 'occurred',
  'accomodate': 'accommodate',
  'definately': 'definitely',
  'excellant': 'excellent',
  'experiance': 'experience',
  'responsability': 'responsibility'
};

export function checkGrammar(text: string): GrammarCheckResult {
  const issues: GrammarIssue[] = [];
  
  // Simple sentence and word splitting
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  
  // Check each sentence for grammar issues
  sentences.forEach((sentence, sentenceIndex) => {
    const lineNumber = sentenceIndex + 1;
    
    // Check for passive voice
    const passiveVoiceMatch = sentence.match(RESUME_GRAMMAR_RULES[0].pattern as RegExp);
    if (passiveVoiceMatch) {
      issues.push(createIssue({
        rule: RESUME_GRAMMAR_RULES[0],
        text: passiveVoiceMatch[0],
        context: sentence,
        lineNumber
      }));
    }

    // Check for first person
    const firstPersonMatch = sentence.match(RESUME_GRAMMAR_RULES[1].pattern as RegExp);
    if (firstPersonMatch) {
      issues.push(createIssue({
        rule: RESUME_GRAMMAR_RULES[1],
        text: firstPersonMatch[0],
        context: sentence,
        lineNumber
      }));
    }

    // Check for inconsistent tense
    const pastTenseRule = RESUME_GRAMMAR_RULES[2];
    if (typeof pastTenseRule.pattern !== 'string' && 'past' in pastTenseRule.pattern) {
      const hasPastTense = sentence.match(pastTenseRule.pattern.past);
      const hasPresentTense = sentence.match(pastTenseRule.pattern.present);
      
      if (hasPastTense && hasPresentTense) {
        issues.push(createIssue({
          rule: pastTenseRule,
          text: sentence.substring(0, 100),
          context: sentence,
          lineNumber
        }));
      }
    }

    // Check for other rules
    for (let i = 3; i < RESUME_GRAMMAR_RULES.length; i++) {
      const rule = RESUME_GRAMMAR_RULES[i];
      const matches = sentence.match(rule.pattern as RegExp);
      
      if (matches) {
        issues.push(createIssue({
          rule,
          text: matches[0],
          context: sentence,
          lineNumber
        }));
      }
    }

    // Check for common misspellings
    Object.entries(COMMON_MISSPELLINGS).forEach(([incorrect, correct]) => {
      const regex = new RegExp(`\\b${incorrect}\\b`, 'gi');
      const matches = sentence.match(regex);
      
      if (matches) {
        issues.push({
          type: 'error',
          message: `Possible misspelling: "${incorrect}"`,
          context: sentence,
          lineNumber,
          suggestion: `Did you mean "${correct}"?`,
          explanation: `"${incorrect}" is a common misspelling of "${correct}".`,
          impact: 'low',
          text: matches[0]
        });
      }
    });
  });

  // Calculate metrics
  const totalWords = words.length;
  const totalSentences = sentences.length;
  const avgSentenceLength = totalSentences > 0 ? totalWords / totalSentences : 0;
  const readabilityLevel = calculateReadabilityLevel(avgSentenceLength);

  // Count issues by type
  const errorCount = issues.filter(i => i.type === 'error').length;
  const warningCount = issues.filter(i => i.type === 'warning').length;
  const suggestionCount = issues.filter(i => i.type === 'suggestion').length;
  const issueCount = errorCount + warningCount + suggestionCount;

  // Calculate score (100 - (errors * 2 + warnings * 1 + suggestions * 0.5), min 0)
  const score = Math.max(0, 100 - (errorCount * 2 + warningCount * 1 + suggestionCount * 0.5));

  return {
    issues,
    score,
    issueCount,
    errorCount,
    warningCount,
    suggestionCount,
    summary: {
      totalWords,
      totalSentences,
      avgSentenceLength,
      readabilityLevel,
      passiveVoiceCount: issues.filter(i => i.type === 'warning' && i.message.includes('Passive voice')).length,
      firstPersonCount: issues.filter(i => i.type === 'warning' && i.message.includes('First person')).length,
      inconsistentTenseCount: issues.filter(i => i.type === 'warning' && i.message.includes('Inconsistent verb tense')).length,
    }
  };
}

function createIssue({
  rule,
  text,
  context,
  lineNumber
}: {
  rule: GrammarRule;
  text: string;
  context: string;
  lineNumber: number;
}): GrammarIssue {
  return {
    type: rule.type,
    message: `${rule.name}: ${text}`,
    context,
    lineNumber,
    suggestion: rule.suggestion,
    explanation: rule.description,
    impact: rule.impact,
    text
  };
}

function calculateReadabilityLevel(avgSentenceLength: number): string {
  if (avgSentenceLength < 8) return 'Elementary';
  if (avgSentenceLength < 12) return 'Middle School';
  if (avgSentenceLength < 16) return 'High School';
  return 'College';
}