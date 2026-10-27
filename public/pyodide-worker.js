/* Pyodide 0.27.7 worker entry. Runtime assets are served locally from /pyodide/. */
let runtimePromise;

async function getRuntime() {
  if (!runtimePromise) {
    importScripts('/pyodide/pyodide.js');
    runtimePromise = loadPyodide({ indexURL: self.location.origin + '/pyodide/' });
  }
  return runtimePromise;
}

function writeRoundFiles(pyodide, files) {
  pyodide.FS.mkdirTree('/workspace');
  for (const [relativePath, content] of Object.entries(files || {})) {
    const parts = relativePath.split('/');
    if (relativePath.startsWith('/') || parts.includes('..')) {
      throw new Error('Unsafe round file path: ' + relativePath);
    }
    const target = '/workspace/' + relativePath;
    pyodide.FS.mkdirTree(target.slice(0, target.lastIndexOf('/')));
    pyodide.FS.writeFile(target, content, { encoding: 'utf8' });
  }
}

const testHarness = [
  'import contextlib, importlib.util, io, json, os, sys, time, unittest',
  'sys.path.insert(0, "/workspace")',
  'os.chdir("/workspace")',
  'class JsonResult(unittest.TestResult):',
  '    def __init__(self):',
  '        super().__init__()',
  '        self.rows = []',
  '        self.started = {}',
  '    def startTest(self, test):',
  '        self.started[test] = time.perf_counter()',
  '        super().startTest(test)',
  '    def _record(self, test, status, message=""):',
  '        elapsed = round((time.perf_counter() - self.started.get(test, time.perf_counter())) * 1000)',
  '        self.rows.append({"name": test._testMethodName, "status": status, "message": message, "ms": elapsed})',
  '    def addSuccess(self, test):',
  '        self._record(test, "passed")',
  '        super().addSuccess(test)',
  '    def addFailure(self, test, err):',
  '        self._record(test, "failed", self._exc_info_to_string(err, test))',
  '        super().addFailure(test, err)',
  '    def addError(self, test, err):',
  '        self._record(test, "failed", self._exc_info_to_string(err, test))',
  '        super().addError(test, err)',
  'out, err, result = io.StringIO(), io.StringIO(), JsonResult()',
  'spec = importlib.util.spec_from_file_location("test_cart", "/workspace/tests/test_cart.py")',
  'module = importlib.util.module_from_spec(spec)',
  'spec.loader.exec_module(module)',
  'suite = unittest.defaultTestLoader.loadTestsFromModule(module)',
  'with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):',
  '    suite.run(result)',
  'json.dumps({"results": result.rows, "stdout": out.getvalue(), "stderr": err.getvalue()})',
].join('\n');

async function runJob(message) {
  try {
    const pyodide = await getRuntime();
    self.postMessage({ ok: true, task: 'runtime-ready' });
    if (message.task === 'preload') {
      self.postMessage({ ok: true, task: 'preload' });
      return;
    }
    writeRoundFiles(pyodide, message.files);
    pyodide.runPython('import os, sys\nsys.path.insert(0, "/workspace")\nos.chdir("/workspace")');
    if (message.task === 'entry') {
      const safeEntry = String(message.entry || '').replace(/\\/g, '/');
      if (safeEntry.startsWith('/') || safeEntry.split('/').includes('..')) throw new Error('Unsafe entry path: ' + safeEntry);
      const path = '/workspace/' + safeEntry;
      const code = 'import contextlib, io, runpy, sys, traceback\nstdout_buffer, stderr_buffer = io.StringIO(), io.StringIO()\nerror = ""\ntry:\n    with contextlib.redirect_stdout(stdout_buffer), contextlib.redirect_stderr(stderr_buffer):\n        runpy.run_path(' + JSON.stringify(path) + ', run_name="__main__")\nexcept BaseException as exc:\n    error = str(exc)\n    with contextlib.redirect_stderr(stderr_buffer):\n        traceback.print_exc()\n{"stdout": stdout_buffer.getvalue(), "stderr": stderr_buffer.getvalue(), "error": error}';
      const pyResult = await pyodide.runPythonAsync(code);
      const result = pyResult.toJs({ dict_converter: Object.fromEntries });
      pyResult.destroy();
      self.postMessage({ ok: true, task: 'entry', ...result });
      return;
    }
    if (message.task === 'tests') {
      const pyResult = await pyodide.runPythonAsync(testHarness);
      const report = JSON.parse(pyResult);
      self.postMessage({ ok: true, task: 'tests', report });
      return;
    }
    throw new Error('Unsupported Python task: ' + message.task);
  } catch (error) {
    self.postMessage({ ok: false, task: message?.task || 'unknown', error: error instanceof Error ? error.message : String(error) });
  }
}
self.onmessage = event => { void runJob(event.data); };
