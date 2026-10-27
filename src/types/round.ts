export interface CodeFile { path: string; language: 'python' | 'markdown'; content: string }
export interface BugAnswer { file: string; line: number }
export interface TestResult { name: string; status: 'passed' | 'failed'; message: string; ms: number }
export interface TestReport { results: TestResult[]; stdout: string; stderr: string; error?: string }
export interface RunResult { stdout: string; stderr: string; error?: string }
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
export interface Interaction { message: string; choice: 'trust' | 'verify' }
export interface RoundSession {
  outputAttempts: number;
  outputCorrect: boolean;
  markedBug: BugAnswer | null;
  interactions: Interaction[];
  hintsRevealed: number[];
  submitted: boolean;
  timedOut: boolean;
  explanation: string;
}
