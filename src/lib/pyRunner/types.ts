import type { RunResult, TestReport } from '../../types/round';
export interface PyRunner {
  preload(): Promise<void>;
  runEntry(files: Record<string, string>, entry: string): Promise<RunResult>;
  runTests(files: Record<string, string>): Promise<TestReport>;
}
