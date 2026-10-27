# CogniCode

CogniCode is a code comprehension practice prototype. It helps learners inspect a small multi-file Python project, predict its output, run its tests, locate a bug, and compare a local assistant suggestion with the source code.

## Features

- Dark CogniCode homepage with a code execution flow illustration and four practice pillars: Understand, Predict, Debug, and Verify.
- One playable round, **E-commerce Cart Bug**, with a multi-file Python source tree and syntax-highlighted, read-only Monaco editor.
- Browser-based Python execution using Pyodide in a Web Worker for the demo output and `unittest` results.
- Output prediction, output reveal, per-file bug-line marking, hints, a round timer, and a results summary.
- A scripted local assistant decoy with Trust and Verify choices. The prototype does not contact an AI service.
- Self-hosted Pyodide assets under `public/pyodide` so runtime files are served by the app rather than fetched from a CDN.

## Technology

React 18, TypeScript, Vite, React Router, Monaco Editor, Pyodide 0.27.7, Lucide icons, and CSS. The Python demo uses only the Python standard library.

## Run locally

Requirements: Node.js 18 or newer and npm. Python 3 is only needed for the round verification script.

```sh
npm install
npm run dev
```

`npm install` runs `copy:pyodide` through the postinstall script and copies the pinned Pyodide distribution into `public/pyodide`. To copy it again manually, run `npm run copy:pyodide`.

## Checks

```sh
npm run build
npm run verify:round
```

The build runs TypeScript project checks and creates the Vite production bundle. `verify:round` runs the original Python unit tests (which are expected to expose the demo bug), applies the declared fix to a temporary copy, confirms the fixed tests pass, and prints the real buggy demo output. There are no separate npm lint or test scripts configured.

## Environment variables

None are required for the current prototype.

## Known limitations

- Only the E-commerce Cart Bug round is playable.
- Source files are displayed read-only in the workspace.
- Assistant text is a scripted demo suggestion; there is no model integration, backend, account system, or persistence service.
- Explanation text is shown as not graded yet.
- The demo timer and session state live in the browser and are not saved between sessions.
