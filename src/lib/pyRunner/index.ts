import type { PyRunner } from './types';
import type { RunResult, TestReport } from '../../types/round';
interface WorkerResponse { ok: boolean; task: string; stdout?: string; stderr?: string; report?: TestReport; error?: string }
const JOB_TIMEOUT_MS = 5000;

function execute(task: string, files?: Record<string, string>, entry?: string): Promise<WorkerResponse> {
  return new Promise((resolve, reject) => {
    const worker = new Worker('/pyodide-worker.js');
    let timeout = window.setTimeout(() => {
      worker.terminate();
      reject(new Error('Python runtime did not finish loading.'));
    }, 30000);
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      if (event.data.task === 'runtime-ready') {
        window.clearTimeout(timeout);
        timeout = window.setTimeout(() => {
          worker.terminate();
          reject(new Error('Python run exceeded the 5 second limit.'));
        }, JOB_TIMEOUT_MS);
        return;
      }
      window.clearTimeout(timeout);
      worker.terminate();
      if (event.data.ok) resolve(event.data);
      else reject(new Error(event.data.error ?? 'Python runtime failed.'));
    };
    worker.onerror = event => {
      window.clearTimeout(timeout);
      worker.terminate();
      reject(new Error(event.message || 'Python worker failed to start.'));
    };
    worker.postMessage({ task, files, entry });
  });
}

export const pyRunner: PyRunner = {
  async preload() { await execute('preload'); },
  async runEntry(files, entry): Promise<RunResult> {
    const result = await execute('entry', files, entry);
    return { stdout: result.stdout ?? '', stderr: result.stderr ?? '', error: result.error };
  },
  async runTests(files): Promise<TestReport> {
    const result = await execute('tests', files);
    return result.report ?? { results: [], stdout: result.stdout ?? '', stderr: result.stderr ?? '', error: result.error };
  },
};
