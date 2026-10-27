import { useEffect, useMemo, useRef, useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { ArrowLeft, Bot, Check, ChevronDown, ChevronRight, CircleHelp, Clock3, FileCode2, FileText, Folder, Lightbulb, Play, ShieldCheck, Sparkles, X } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { BugAnswer, Interaction, RoundSession, TestReport } from '../types/round';
import { cartRound, roundFiles } from '../data/rounds';
import { pyRunner } from '../lib/pyRunner';

type PanelTab = 'Output' | 'Find Bug' | 'Test Results' | 'Explain';
type RuntimeState = 'loading' | 'ready' | 'offline';
const normaliseOutput = (text: string) => text.trim().replace(/\s+/g, ' ');

export default function ChallengeWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activePath, setActivePath] = useState(cartRound.entryFile);
  const [openPaths, setOpenPaths] = useState<string[]>([cartRound.entryFile]);
  const [markedLines, setMarkedLines] = useState<Record<string, number>>({});
  const [finalMark, setFinalMark] = useState<BugAnswer | null>(null);
  const [activeTab, setActiveTab] = useState<PanelTab>('Output');
  const [outputAnswer, setOutputAnswer] = useState('');
  const [outputAttempts, setOutputAttempts] = useState(0);
  const [outputCorrect, setOutputCorrect] = useState(false);
  const [revealedOutput, setRevealedOutput] = useState<string | null>(null);
  const [outputFeedback, setOutputFeedback] = useState('');
  const [checkingOutput, setCheckingOutput] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [testReport, setTestReport] = useState<TestReport | null>(null);
  const [testRunning, setTestRunning] = useState(false);
  const [seconds, setSeconds] = useState(10 * 60);
  const [hintReveals, setHintReveals] = useState<number[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [runtimeState, setRuntimeState] = useState<RuntimeState>('loading');
  const [runtimeError, setRuntimeError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [openResponsivePanel, setOpenResponsivePanel] = useState<'problem' | 'assistant' | null>(null);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const decorationRef = useRef<string[]>([]);
  const finishedRef = useRef(false);
  const round = cartRound;
  const activeFile = useMemo(() => round.files.find(file => file.path === activePath) ?? round.files[0], [activePath]);
  const markedBug = markedLines[activePath] === undefined ? null : { file: activePath, line: markedLines[activePath] };
  const locked = seconds <= 0 || finishedRef.current;
  const pythonFiles = roundFiles;

  useEffect(() => {
    if (id !== round.id) navigate('/challenges', { replace: true });
  }, [id, navigate, round.id]);
  useEffect(() => {
    let active = true;
    void pyRunner.preload().then(() => {
      if (active) setRuntimeState('ready');
    }).catch(error => {
      if (!active) return;
      setRuntimeState('offline');
      setRuntimeError(error instanceof Error ? error.message : String(error));
    });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const timer = window.setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000);
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
    navigate('/results', { state: session });
  };
  useEffect(() => {
    if (seconds === 0) finish();
  }, [seconds]);

  const openFile = (path: string) => {
    setActivePath(path);
    setOpenPaths(paths => paths.includes(path) ? paths : [...paths, path]);
  };
  const closeTab = (path: string) => {
    const next = openPaths.filter(item => item !== path);
    setOpenPaths(next);
    if (activePath === path && next.length) setActivePath(next[next.length - 1]);
  };
  const markLine = (line: number) => {
    if (line < 1 || locked || !activeFile.path.endsWith('.py')) return;
    setMarkedLines(lines => ({ ...lines, [activePath]: line }));
    setFinalMark({ file: activePath, line });
    setStatusMessage('Marked ' + activePath + ' : ' + line);
    const editor = editorRef.current;
    if (editor) decorationRef.current = editor.deltaDecorations(decorationRef.current, [{
      range: { startLineNumber: line, startColumn: 1, endLineNumber: line, endColumn: 1 },
      options: { isWholeLine: true, className: 'bug-line-highlight', glyphMarginClassName: 'bug-line-glyph' },
    }]);
  };
  const onEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monaco.editor.defineTheme('cognicode-black', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'B9A6FF' },
        { token: 'string', foreground: 'D7C1FF' },
        { token: 'comment', foreground: '847B90' },
      ],
      colors: {
        'editor.background': '#000000',
        'editor.foreground': '#E8E4EF',
        'editorLineNumber.foreground': '#756D80',
        'editorLineNumber.activeForeground': '#D8D0E4',
        'editorGutter.background': '#000000',
        'editor.lineHighlightBackground': '#08060B',
        'editor.selectionBackground': '#5B43A855',
        'editorCursor.foreground': '#A48CFF',
        'editorWidget.background': '#050505',
        'editorWidget.border': '#392B52',
      },
    });
    monaco.editor.setTheme('cognicode-black');
    const markedLine = markedLines[activePath];
    if (markedLine) decorationRef.current = editor.deltaDecorations([], [{
      range: { startLineNumber: markedLine, startColumn: 1, endLineNumber: markedLine, endColumn: 1 },
      options: { isWholeLine: true, className: 'bug-line-highlight', glyphMarginClassName: 'bug-line-glyph' },
    }]);
    editor.onMouseDown(event => {
      const position = event.target.position;
      if (position && (event.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS || event.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN)) markLine(position.lineNumber);
    });
  };
  const revealHint = () => {
    if (locked) return;
    if (hintReveals.length >= round.explainRubric.length) {
      setStatusMessage('All hints have been revealed.');
      return;
    }
    setHintReveals(items => [...items, items.length]);
  };
  const recordDecoyChoice = (choice: Interaction['choice']) => {
    if (locked) return;
    setInteractions(items => [...items, { message: round.decoy.text, choice }]);
    setStatusMessage(choice === 'trust' ? 'Trust choice recorded.' : 'Verify choice recorded.');
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
      setOutputCorrect(previous => previous || correct);
      setOutputFeedback(correct ? 'Correct. Your prediction matches the program output.' : 'Not quite. Try again or reveal the output.');
      if (correct) setRevealedOutput(result.stdout);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setRuntimeState('offline');
      setRuntimeError(message);
      setOutputFeedback('Python execution failed: ' + message);
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
      setOutputFeedback('Output revealed from a real Python run.');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setRuntimeState('offline');
      setRuntimeError(message);
      setOutputFeedback('Python execution failed: ' + message);
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
      setRuntimeState('offline');
      setRuntimeError(message);
      setTestReport({ results: [], stdout: '', stderr: '', error: message });
    } finally {
      setTestRunning(false);
    }
  };

  const leftFiles = round.files.filter(file => file.path.startsWith('app/'));
  const testFile = round.files.find(file => file.path.startsWith('tests/'));
  const readme = round.files.find(file => file.path === 'README.md');
  const formatted = Math.floor(seconds / 60).toString().padStart(2, '0') + ':' + (seconds % 60).toString().padStart(2, '0');
  const tabs: PanelTab[] = ['Output', 'Find Bug', 'Test Results', 'Explain'];
  return <div className="workspace-page">
    <header className="workspace-topbar">
      <Link to="/challenges" className="workspace-back"><ArrowLeft size={16}/><span>Challenges</span></Link><span className="topbar-divider"/>
      <strong>{round.title}</strong><span className="difficulty medium">{round.difficulty}</span><span className="category-pill">{round.category}</span><span className="workspace-spacer"/>
      <div className="workspace-panel-toggles">
        <button className={openResponsivePanel === 'problem' ? 'active' : ''} onClick={() => setOpenResponsivePanel(panel => panel === 'problem' ? null : 'problem')} aria-expanded={openResponsivePanel === 'problem'}>Problem</button>
        <button className={openResponsivePanel === 'assistant' ? 'active' : ''} onClick={() => setOpenResponsivePanel(panel => panel === 'assistant' ? null : 'assistant')} aria-expanded={openResponsivePanel === 'assistant'}>Assistant</button>
      </div>
      <span className="runtime-state">{runtimeState === 'loading' ? 'Python runtime loading' : runtimeState === 'ready' ? 'Python ready' : 'Offline fallback'}</span>
      <span className="timer"><Clock3 size={15}/>{formatted}</span><button className="button button-quiet compact" onClick={revealHint} disabled={locked}><Lightbulb size={15}/>Hints ({hintReveals.length}/{round.explainRubric.length})</button>
      <button className="button button-primary compact" onClick={finish} disabled={locked}>Submit <ArrowLeft size={14} className="rotate-icon"/></button>
    </header>
    <div className="workspace-layout" data-open-panel={openResponsivePanel ?? ''}>
      <aside className="problem-panel">
        <div className="panel-topline"><span>PROBLEM</span><span className="round-id">{round.id}</span></div>
        <div className="problem-content"><span className="eyebrow">DEBUGGING · PYTHON</span><h1>{round.title}</h1><p>{round.description}</p>
          <h2>Expected behaviour</h2><ul>{round.expectedBehaviour.map(text=><li key={text}>{text}</li>)}</ul>
          {hintReveals.length > 0 && <div className="hint-callout"><Sparkles size={16}/><div><b>Hint {hintReveals.length}</b><p>{round.explainRubric[hintReveals[hintReveals.length - 1]]}</p></div></div>}
          <div className="problem-bottom"><span><Clock3 size={14}/>Timed round</span><span>{round.files.filter(file => file.language === 'python').length} Python files</span></div>
        </div>
      </aside>
      <section className="editor-column">
        <div className="explorer"><div className="explorer-title">EXPLORER <ChevronDown size={13}/></div><div className="explorer-root"><ChevronDown size={13}/><span>CogniCode CART</span></div>
          <div className="tree-folder"><ChevronDown size={13}/><Folder size={14}/><span>app</span></div>
          {leftFiles.map(file=><button key={file.path} className={'tree-file' + (activePath===file.path?' selected':'')} onClick={()=>openFile(file.path)}><FileCode2 size={14}/><span>{file.path.split('/').pop()}</span>{markedLines[file.path]!==undefined&&<span className="file-bug-dot" aria-label="Bug line marked"/>}</button>)}
          <div className="tree-folder"><ChevronRight size={13}/><Folder size={14}/><span>tests</span></div>
          {testFile&&<button className={'tree-file nested' + (activePath===testFile.path?' selected':'')} onClick={()=>openFile(testFile.path)}><FileCode2 size={14}/><span>{testFile.path.split('/').pop()}</span></button>}
          {readme&&<button className={'tree-file root-file' + (activePath===readme.path?' selected':'')} onClick={()=>openFile(readme.path)}><FileText size={14}/><span>README.md</span></button>}
        </div>
        <div className="editor-area">
          <div className="editor-tabs">{openPaths.map(path=><div key={path} className={'editor-tab' + (path===activePath?' active':'')}><button onClick={()=>setActivePath(path)}>{path.endsWith('.py')?<FileCode2 size={13}/>:<FileText size={13}/>}<span>{path.split('/').pop()}</span></button><button className="tab-close" onClick={()=>closeTab(path)} aria-label={'Close ' + path}><X size={12}/></button></div>)}</div>
          <div className="editor-path"><span>{activePath}</span><span>{activeFile.language === 'python' ? 'Python' : 'Markdown'} · read only</span></div>
          <Editor key={activePath} height="100%" language={activeFile.language} value={activeFile.content} theme="cognicode-black" onMount={onEditorMount} options={{ readOnly:true, minimap:{enabled:false}, fontSize:13, fontFamily:'JetBrains Mono, monospace', lineNumbers:'on', glyphMargin:true, scrollBeyondLastLine:false, wordWrap:'on', padding:{top:12}, renderLineHighlight:'none', overviewRulerLanes:0, scrollbar:{verticalScrollbarSize:8,horizontalScrollbarSize:8}, contextmenu:false }} />
        </div>
        <div className="bottom-panel">
          <div className="bottom-tabs">{tabs.map(tab=><button key={tab} className={activeTab===tab?'active':''} onClick={()=>setActiveTab(tab)}>{tab}{tab==='Test Results'&&testReport&&<span className="tab-count">{testReport.results.length}</span>}</button>)}</div>
          <div className="bottom-content">
            {activeTab==='Output'&&<div className="output-form"><label htmlFor="output-answer">What output do you expect?</label><div><input id="output-answer" value={outputAnswer} onChange={e=>setOutputAnswer(e.target.value)} placeholder="Enter the expected output" disabled={locked||runtimeState!=='ready'}/><button className="button button-quiet compact" onClick={()=>void checkOutput()} disabled={locked||runtimeState!=='ready'||checkingOutput}>{checkingOutput?'Running…':'Check output'}</button><button className="button button-quiet compact" onClick={()=>void revealOutput()} disabled={locked||runtimeState!=='ready'||checkingOutput}>Reveal</button></div>{outputFeedback&&<small>{outputFeedback}</small>}{revealedOutput!==null&&<pre className="real-output">{revealedOutput}</pre>}{runtimeState==='offline'&&<div className="offline-fallback"><b>Offline fallback</b><span>Python could not start, so output and tests are unavailable. {runtimeError}</span></div>}</div>}
            {activeTab==='Find Bug'&&<div className="findbug-panel"><div><b>Mark the faulty line</b><small>Click a line number in the editor. Marks persist when switching files.</small></div>{markedBug?<span className="marked-location"><span className="bug-glyph">●</span>{markedBug.file} : {markedBug.line}</span>:<span className="muted-label">No line marked in this file</span>}<button className="button button-primary compact" onClick={finish} disabled={locked}>Submit answer</button></div>}
            {activeTab==='Test Results'&&<div className="tests-panel">{runtimeState==='offline'?<div className="offline-fallback"><b>Offline fallback</b><span>Python could not start, so tests are unavailable. {runtimeError}</span></div>:<><div className="test-empty"><span>Run tests/test_cart.py with Python unittest.</span><button className="button button-primary compact" onClick={()=>void runTests()} disabled={locked||runtimeState!=='ready'||testRunning}><Play size={13}/>{testRunning?'Running…':'Run Tests'}</button></div>{testReport&&<><div className="test-list">{testReport.results.map(test=><div key={test.name} className="test-row"><span className={test.status==='passed'?'test-status pass':'test-status fail'}>{test.status==='passed'?<Check size={13}/>:<X size={13}/>}<span>{test.status}</span></span><code>{test.name}</code><span className="test-ms">{test.ms} ms</span>{test.message&&<small>{test.message}</small>}</div>)}</div>{testReport.stderr&&<pre className="test-stderr">{testReport.stderr}</pre>}</>}</>}</div>}
            {activeTab==='Explain'&&<div className="explain-panel"><label htmlFor="explanation">Explain why the cart behaves this way</label><textarea id="explanation" value={explanation} onChange={e=>setExplanation(e.target.value)} placeholder="Describe how the IDs flow through the code…" disabled={locked}/><span>Explanation is not graded yet.</span></div>}
          </div>
        </div>
      </section>
      <aside className="assistant-panel"><div className="assistant-heading"><span className="assistant-avatar"><Bot size={18}/></span><div><b>Assistant suggestion</b><small>Scripted demo decoy</small></div><span className="online-dot"/></div>
        <div className="assistant-context"><span className="context-tag">ROUND CONTEXT</span><p>{round.title}</p><span>Local suggestion · no network</span></div>
        <div className="chat-messages"><article className="chat-message"><div className="message-label"><span className="message-avatar"><Bot size={15}/></span><b>Insight</b><small>Demo</small></div><p>{round.decoy.text}</p><section className="suggested-direction"><span className="context-tag">SUGGESTED FILE</span><code>{round.decoy.pointsTo}</code></section><div className="message-actions"><button onClick={()=>recordDecoyChoice('trust')} disabled={locked}><Check size={14}/>Trust</button><button onClick={()=>recordDecoyChoice('verify')} disabled={locked}><ShieldCheck size={14}/>Verify</button></div></article>{statusMessage&&<p className="interaction-status">{statusMessage}</p>}</div>
        <div className="assistant-footnote"><CircleHelp size={13}/><span>Compare this suggestion with the source before deciding.</span></div>
      </aside>
    </div>
    <footer className="workspace-status"><span className="status-brand"><span className="status-dot"/>CogniCode</span><span>{Object.keys(markedLines).length ? 'Bug line marked' : 'No bug marked'}</span><span className="status-spacer"/><span>{runtimeState === 'loading' ? 'Python runtime loading' : runtimeState === 'ready' ? 'Python · Pyodide 0.27.7' : 'Offline fallback'}</span></footer>
  </div>;
}
