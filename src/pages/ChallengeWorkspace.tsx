import { useEffect, useMemo, useRef, useState } from 'react';
import { type OnMount } from '@monaco-editor/react';
import { useNavigate, useParams } from 'react-router-dom';
import type { BugAnswer, Interaction, RoundSession, TestReport } from '../types/round';
import { getChallengeBySlug, challenges } from '../data/challenges';
import { pyRunner } from '../lib/pyRunner';
import { WorkspaceTopBar, type WorkspaceStep } from '../components/workspace/WorkspaceTopBar';
import { WorkspaceLeftPanel } from '../components/workspace/WorkspaceLeftPanel';
import { WorkspaceEditor } from '../components/workspace/WorkspaceEditor';
import { WorkspaceBottomPanel, type WorkspaceBottomTab } from '../components/workspace/WorkspaceBottomPanel';
import { WorkspaceAssistant } from '../components/workspace/WorkspaceAssistant';
import { WorkspaceStatusBar } from '../components/workspace/WorkspaceStatusBar';

const normaliseOutput = (text: string) => text.trim().replace(/\s+/g, ' ');

export default function ChallengeWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();

  const round = useMemo(() => getChallengeBySlug(id) || challenges[0], [id]);
  const pythonFiles = useMemo(
    () => Object.fromEntries(round.files.map(file => [file.path, file.content])),
    [round.files]
  );

  // Tab & Path navigation
  const [activePath, setActivePath] = useState(round.entryFile);
  const [openPaths, setOpenPaths] = useState<string[]>([round.entryFile]);

  // Synchronize workspace state when round/slug changes
  useEffect(() => {
    finishedRef.current = false;
    setActivePath(round.entryFile);
    setOpenPaths([round.entryFile]);
    setMarkedLines({});
    setFinalMark(null);
    setOutputAnswer('');
    setOutputAttempts(0);
    setOutputCorrect(false);
    setRevealedOutput(null);
    setOutputFeedback('');
    setExplanation('');
    setTestReport(null);
    setSeconds((round.estimatedMinutes || 10) * 60);
    setHintReveals([]);
    setInteractions([]);
  }, [round.id]);
  const [leftTab, setLeftTab] = useState<'problem' | 'explorer'>('problem');
  const [activeBottomTab, setActiveBottomTab] = useState<WorkspaceBottomTab>('Output');
  const [activeStep, setActiveStep] = useState<WorkspaceStep>('predict');

  // Editor state & cursor
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [markedLines, setMarkedLines] = useState<Record<string, number>>({});
  const [finalMark, setFinalMark] = useState<BugAnswer | null>(null);

  // Prediction Output State
  const [outputAnswer, setOutputAnswer] = useState('');
  const [outputAttempts, setOutputAttempts] = useState(0);
  const [outputCorrect, setOutputCorrect] = useState(false);
  const [revealedOutput, setRevealedOutput] = useState<string | null>(null);
  const [outputFeedback, setOutputFeedback] = useState('');
  const [checkingOutput, setCheckingOutput] = useState(false);

  // Explanation State
  const [explanation, setExplanation] = useState('');

  // Tests State
  const [testReport, setTestReport] = useState<TestReport | null>(null);
  const [testRunning, setTestRunning] = useState(false);

  // Timer & Hints
  const [seconds, setSeconds] = useState(10 * 60);
  const [hintReveals, setHintReveals] = useState<number[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);

  // Runtime State
  const [runtimeState, setRuntimeState] = useState<'loading' | 'ready' | 'offline'>('loading');
  const [runtimeError, setRuntimeError] = useState('');

  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const decorationRef = useRef<string[]>([]);
  const finishedRef = useRef(false);

  const activeFile = useMemo(
    () => round.files.find(file => file.path === activePath) ?? round.files[0],
    [activePath, round.files]
  );
  const markedBug = markedLines[activePath] === undefined ? null : { file: activePath, line: markedLines[activePath] };
  const locked = seconds <= 0 || finishedRef.current;

  // Preload Pyodide runtime
  useEffect(() => {
    let active = true;
    void pyRunner
      .preload()
      .then(() => {
        if (active) setRuntimeState('ready');
      })
      .catch(error => {
        if (!active) return;
        setRuntimeState('offline');
        setRuntimeError(error instanceof Error ? error.message : String(error));
      });
    return () => {
      active = false;
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    const timer = window.setInterval(() => setSeconds(val => Math.max(0, val - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const session: RoundSession = {
      outputAttempts,
      outputCorrect,
      markedBug: finalMark,
      interactions,
      hintsRevealed: hintReveals,
      submitted: true,
      timedOut: seconds <= 0,
      explanation,
    };
    navigate('/results', { state: { ...session, roundId: round.id } });
  };

  useEffect(() => {
    if (seconds === 0) finish();
  }, [seconds]);

  const openFile = (path: string) => {
    setActivePath(path);
    setOpenPaths(paths => (paths.includes(path) ? paths : [...paths, path]));
  };

  const closeTab = (path: string) => {
    const next = openPaths.filter(item => item !== path);
    setOpenPaths(next);
    if (activePath === path && next.length) {
      setActivePath(next[next.length - 1]);
    }
  };

  const markLine = (line: number) => {
    if (line < 1 || locked || !activeFile.path.endsWith('.py')) return;
    setMarkedLines(lines => ({ ...lines, [activePath]: line }));
    setFinalMark({ file: activePath, line });

    const editor = editorRef.current;
    if (editor) {
      decorationRef.current = editor.deltaDecorations(decorationRef.current, [
        {
          range: { startLineNumber: line, startColumn: 1, endLineNumber: line, endColumn: 1 },
          options: {
            isWholeLine: true,
            className: 'bug-line-highlight',
            glyphMarginClassName: 'bug-line-glyph',
          },
        },
      ]);
    }
  };

  const clearMark = () => {
    setMarkedLines(lines => {
      const copy = { ...lines };
      delete copy[activePath];
      return copy;
    });
    setFinalMark(null);
    if (editorRef.current) {
      decorationRef.current = editorRef.current.deltaDecorations(decorationRef.current, []);
    }
  };

  const onEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Custom theme matching the tokens from the visual design
    monaco.editor.defineTheme('cognicode-studio', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'A78BFA', fontStyle: 'bold' },
        { token: 'string', foreground: '86EFAC' },
        { token: 'number', foreground: 'FBBF24' },
        { token: 'comment', foreground: '6B7280', fontStyle: 'italic' },
        { token: 'identifier', foreground: 'E5E7EB' },
        { token: 'type', foreground: '67E8F9' },
        { token: 'function', foreground: '60A5FA' },
      ],
      colors: {
        'editor.background': '#000000',
        'editor.foreground': '#e5e7eb',
        'editorLineNumber.foreground': '#4b5563',
        'editorLineNumber.activeForeground': '#e5e7eb',
        'editorGutter.background': '#000000',
        'editor.lineHighlightBackground': '#0d0d12',
        'editor.selectionBackground': '#6366f133',
        'editorCursor.foreground': '#6366f1',
        'editorWidget.background': '#08080a',
        'editorWidget.border': '#1a1a24',
      },
    });
    monaco.editor.setTheme('cognicode-studio');

    const markedLine = markedLines[activePath];
    if (markedLine) {
      decorationRef.current = editor.deltaDecorations([], [
        {
          range: { startLineNumber: markedLine, startColumn: 1, endLineNumber: markedLine, endColumn: 1 },
          options: {
            isWholeLine: true,
            className: 'bug-line-highlight',
            glyphMarginClassName: 'bug-line-glyph',
          },
        },
      ]);
    }

    editor.onDidChangeCursorPosition(e => {
      setCursorPos({ line: e.position.lineNumber, col: e.position.column });
    });

    editor.onMouseDown(event => {
      const position = event.target.position;
      if (
        position &&
        (event.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS ||
          event.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN)
      ) {
        markLine(position.lineNumber);
      }
    });
  };

  const revealHint = () => {
    if (locked) return;
    if (hintReveals.length >= round.explainRubric.length) return;
    setHintReveals(items => [...items, items.length]);
  };

  const recordDecoyChoice = (messageText: string, choice: 'trust' | 'verify') => {
    if (locked) return;
    setInteractions(items => [...items, { message: messageText, choice }]);
  };

  const checkOutput = async () => {
    if (locked || runtimeState !== 'ready' || checkingOutput) return;
    setCheckingOutput(true);
    setOutputFeedback('');
    try {
      const result = await pyRunner.runEntry(pythonFiles, round.entryFile);
      setOutputAttempts(count => count + 1);
      if (result.error) throw new Error(result.stderr || result.error);
      const correct = normaliseOutput(outputAnswer) === normaliseOutput(result.stdout);
      setOutputCorrect(prev => prev || correct);
      setOutputFeedback(
        correct
          ? 'Correct. Your prediction matches the program output.'
          : 'Not quite. Try again or run the entry to inspect output.'
      );
      if (correct) setRevealedOutput(result.stdout);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setOutputFeedback('Execution error: ' + message);
    } finally {
      setCheckingOutput(false);
    }
  };

  const revealOutput = async () => {
    if (locked || runtimeState !== 'ready' || checkingOutput) return;
    setCheckingOutput(true);
    try {
      const result = await pyRunner.runEntry(pythonFiles, round.entryFile);
      if (result.error) throw new Error(result.stderr || result.error);
      setRevealedOutput(result.stdout);
      setOutputFeedback('Output revealed from live Python run.');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setOutputFeedback('Execution error: ' + message);
    } finally {
      setCheckingOutput(false);
    }
  };

  const runTests = async () => {
    if (locked || runtimeState !== 'ready' || testRunning) return;
    setTestRunning(true);
    setTestReport(null);
    try {
      const result = await pyRunner.runTests(pythonFiles);
      setTestReport(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setTestReport({ results: [], stdout: '', stderr: '', error: message });
    } finally {
      setTestRunning(false);
    }
  };

  const handleStepChange = (step: WorkspaceStep) => {
    setActiveStep(step);
    if (step === 'predict') {
      setActiveBottomTab('Output');
    } else if (step === 'debug') {
      setActiveBottomTab('Find Bug');
    } else if (step === 'explain') {
      setActiveBottomTab('Explain');
    }
  };

  const formattedTime = `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  const assistantMessages = round.assistantHints?.length
    ? round.assistantHints.map(h => ({
        id: h.id,
        text: h.text,
        pointsTo: h.pointsTo,
      }))
    : [
        {
          text: round.decoy.text,
          pointsTo: round.decoy.pointsTo,
        },
      ];

  return (
    <div className="ws-viewport">
      {/* 1. TOP BAR */}
      <WorkspaceTopBar
        category={round.category}
        roundTitle={round.title}
        difficulty={round.difficulty}
        activeStep={activeStep}
        onStepChange={handleStepChange}
        runtimeStatus={runtimeState}
        formattedTime={formattedTime}
        hintsRevealedCount={hintReveals.length}
        totalHintsCount={round.explainRubric.length}
        onRevealHint={revealHint}
        onSubmit={finish}
        locked={locked}
      />

      {/* 3-COLUMN WORKSPACE BODY */}
      <div className="ws-columns-body">
        {/* 2. LEFT PANEL */}
        <WorkspaceLeftPanel
          activeTab={leftTab}
          onTabChange={setLeftTab}
          category={round.category}
          title={round.title}
          description={round.description}
          expectedBehaviour={round.expectedBehaviour}
          hintsRevealed={hintReveals}
          hintsRubric={round.explainRubric}
          files={round.files}
          activePath={activePath}
          onOpenFile={openFile}
          markedLines={markedLines}
        />

        {/* 3. CENTER PANEL: Editor + Bottom Tool Panel */}
        <div className="ws-center-panel">
          <WorkspaceEditor
            openPaths={openPaths}
            activePath={activePath}
            activeFile={activeFile}
            markedLines={markedLines}
            onSelectTab={openFile}
            onCloseTab={closeTab}
            onEditorMount={onEditorMount}
          />

          <WorkspaceBottomPanel
            activeTab={activeBottomTab}
            onTabChange={setActiveBottomTab}
            entryFile={round.entryFile}
            outputAnswer={outputAnswer}
            onOutputAnswerChange={setOutputAnswer}
            onCheckOutput={checkOutput}
            onRunEntry={revealOutput}
            checkingOutput={checkingOutput}
            revealedOutput={revealedOutput}
            outputFeedback={outputFeedback}
            outputCorrect={outputCorrect}
            runtimeState={runtimeState}
            runtimeError={runtimeError}
            locked={locked}
            markedBug={markedBug}
            onClearMark={clearMark}
            onSubmit={finish}
            onRunTests={runTests}
            testRunning={testRunning}
            testReport={testReport}
            explanation={explanation}
            onExplanationChange={setExplanation}
          />
        </div>

        {/* 4. RIGHT PANEL: Assistant Sidebar */}
        <WorkspaceAssistant
          roundTitle={round.title}
          entryFile={round.entryFile}
          messages={assistantMessages}
          interactions={interactions}
          onRecordChoice={recordDecoyChoice}
          onSelectTarget={openFile}
          locked={locked}
        />
      </div>

      {/* 5. STATUS BAR */}
      <WorkspaceStatusBar
        activePath={activePath}
        cursorPos={cursorPos}
        markedBug={markedBug}
        pyodideVersion="0.27.7"
      />
    </div>
  );
}
