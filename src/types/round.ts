export interface CodeFile {
  path: string;
  language: 'python' | 'markdown';
  content: string;
}

export interface ChallengeFile extends CodeFile {}

export interface BugAnswer {
  file: string;
  line: number;
}

export interface TestResult {
  name: string;
  status: 'passed' | 'failed';
  message: string;
  ms: number;
}

export interface TestReport {
  results: TestResult[];
  stdout: string;
  stderr: string;
  error?: string;
}

export interface RunResult {
  stdout: string;
  stderr: string;
  error?: string;
}

export interface RoundMetadata {
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: 'Understanding' | 'Debugging' | 'Predict Output' | 'Code Review' | 'System Design';
  description: string;
  expectedBehaviour: string[];
  bug: BugAnswer;
  explainRubric: string[];
  decoy: { text: string; pointsTo: string };
  fix: { file: string; line: number; newText: string };
}

export interface Round extends RoundMetadata {
  id: string;
  entryFile: string;
  files: CodeFile[];
}

export interface Interaction {
  message: string;
  choice: 'trust' | 'verify';
}

export interface RoundSession {
  outputAttempts: number;
  outputCorrect: boolean;
  markedBug: BugAnswer | null;
  interactions: Interaction[];
  hintsRevealed: number[];
  submitted: boolean;
  timedOut: boolean;
  explanation: string;
  understandingExplanation?: string;
  bugExplanation?: string;
  outputExplanation?: string;
  stagesCompleted?: {
    understand: boolean;
    test: boolean;
    find_bug: boolean;
    predict_explain: boolean;
  };
}

export type WorkflowStageId = 'understand' | 'test' | 'find_bug' | 'predict_explain';
export type StageStatus = 'locked' | 'in_progress' | 'completed' | 'needs_revision';

export interface WorkflowStageState {
  id: WorkflowStageId;
  label: string;
  stepNumber: string;
  status: StageStatus;
}

export interface AssistantHint {
  id: string;
  text: string;
  pointsTo: string;
  isDecoy: boolean;
  recommendedChoice: 'trust' | 'verify';
}

export interface ExpectedOutput {
  buggy: string;
  fixed: string;
}

export interface ChallengeDescription {
  problem: string;
  context: string;
  task: string;
  expectedBehavior: string;
  constraints: string[];
  successCriteria: string;
}

export type VerificationStatus = 'not_verified' | 'passed' | 'failed' | 'incomplete';

export interface Challenge extends Round {
  slug: string;
  summary: string;
  story: string;
  expectedInvariants: string[];
  estimatedMinutes: number;
  tags: string[];
  assistantHints: AssistantHint[];
  hints: [string, string, string];
  fixedFile: {
    path: string;
    content: string;
  };
  expectedOutput: ExpectedOutput;
  modelExplanation: string;
  structuredDescription?: ChallengeDescription;
}
