export interface HowItWorksStep {
  step: number;
  title: string;
  description: string;
  iconName: 'Workflow' | 'Bug' | 'BookOpen';
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const GITHUB_REPO_URL = 'https://github.com/aparmitsrivastav01-hub/CogniCode';

export const howItWorksSteps: HowItWorksStep[] = [
  {
    step: 1,
    title: '1. Predict',
    description: 'Read the source files and formulate a mental model to predict program stdout before running the code.',
    iconName: 'Workflow',
  },
  {
    step: 2,
    title: '2. Debug',
    description: 'Trace variable flow across multi-file modules, isolate the defect, and mark the root-cause line.',
    iconName: 'Bug',
  },
  {
    step: 3,
    title: '3. Explain',
    description: 'Articulate why the code behaves incorrectly and how the invariant was broken in your own words.',
    iconName: 'BookOpen',
  },
];

export const builtWithTechnologies = [
  { name: 'React 18', note: 'UI runtime' },
  { name: 'Vite', note: 'Fast bundling' },
  { name: 'TypeScript', note: 'Strict typing' },
  { name: 'Pyodide', note: 'Python in the browser (WASM)' },
  { name: 'Gemma', note: 'Deterministic local assistant' },
];

export const aboutFaqs: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'Why focus on code comprehension rather than code generation?',
    answer: 'AI code generators can produce hundreds of lines in seconds, making reading and reviewing code the true bottleneck. Engineers must verify correctness, audit subtle bugs, and validate data invariants before merging.',
  },
  {
    id: 'faq-2',
    question: 'Why does the assistant give decoys and Trust/Verify choices?',
    answer: 'In real-world software engineering with LLMs, assistant suggestions are frequently confident yet subtly flawed. CogniCode trains your critical evaluation by presenting plausible decoys alongside valid hints.',
  },
  {
    id: 'faq-3',
    question: 'Is any code executed on a backend server?',
    answer: 'No. All code execution runs hermetically in your browser using Pyodide WebAssembly. Your code, answers, and interactions stay strictly local.',
  },
  {
    id: 'faq-4',
    question: 'Are external Python packages supported?',
    answer: 'Challenges focus on standard library architectures with zero network or filesystem side effects, ensuring reproducible, deterministic ground truth for every participant.',
  },
];
