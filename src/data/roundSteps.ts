export type RoundStepId = 'predict' | 'debug' | 'explain' | 'verify';

export type RoundStepIconName = 'Workflow' | 'Bug' | 'BookOpen' | 'ShieldCheck';

export interface RoundStep {
  id: RoundStepId;
  order: number;
  title: string;
  description: string; // one plain-English line, max 14 words
  estimate: string; // e.g. "~2 min"
  example: string; // one short concrete example line shown when the step is expanded
  icon: RoundStepIconName;
}

export const roundSteps: RoundStep[] = [
  {
    id: 'predict',
    order: 1,
    title: 'Predict',
    description: 'Read the code and guess what it prints before you run it.',
    estimate: '~2 min',
    example: 'Form a mental model of the output: [(42, 1), (42, 2)] instead of [(42, 3)].',
    icon: 'Workflow',
  },
  {
    id: 'debug',
    order: 2,
    title: 'Debug',
    description: 'Find the exact line that causes the wrong behaviour.',
    estimate: '~4 min',
    example: 'Mark cart.py line 12 comparing string ID with integer ID.',
    icon: 'Bug',
  },
  {
    id: 'explain',
    order: 3,
    title: 'Explain',
    description: 'Say in your own words why it breaks and how to fix it.',
    estimate: '~2 min',
    example: 'Describe how type mismatch bypasses the deduplication invariant and suggest normalized_id.',
    icon: 'BookOpen',
  },
  {
    id: 'verify',
    order: 4,
    title: 'Verify',
    description: "Check the assistant's hints. Some are right, some are decoys.",
    estimate: 'Every step',
    example: 'Spot the false decoy in models.py and verify against cart.py invariants.',
    icon: 'ShieldCheck',
  },
];
