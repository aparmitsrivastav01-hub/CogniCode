import { useEffect, useRef, useState, useCallback } from 'react';

export interface DemoPlayerProps {
  videoSrc?: string;
  poster?: string;
  className?: string;
}

type DemoStageId = 'understand' | 'test' | 'find_bug' | 'predict_explain';

interface StageMeta {
  id: DemoStageId;
  stepNumber: string;
  label: string;
  headline: string;
  caption: string;
}

const STAGES: StageMeta[] = [
  {
    id: 'understand',
    stepNumber: '01',
    label: 'Understand',
    headline: 'Read multi-file code and explain it in your own words',
    caption: 'Gemma 4 verifies your conceptual understanding before unlocking the test runner.',
  },
  {
    id: 'test',
    stepNumber: '02',
    label: 'Run Tests',
    headline: 'Run unit tests in-browser with Pyodide WebAssembly',
    caption: 'Observe genuine assertion failures and trace execution evidence without spoilers.',
  },
  {
    id: 'find_bug',
    stepNumber: '03',
    label: 'Find Bug',
    headline: 'Mark the faulty line directly in the editor gutter',
    caption: 'Diagnose the root-cause bug across files and explain why the logic diverges.',
  },
  {
    id: 'predict_explain',
    stepNumber: '04',
    label: 'Predict & Explain',
    headline: 'Predict program output and explain the exact trace',
    caption: 'Verify predictions against live stdout and get graded on your reasoning.',
  },
];

const SCENE_DURATION_MS = 4500;

export function DemoPlayer({ videoSrc, poster, className = '' }: DemoPlayerProps) {
  // If videoSrc is provided, render video element per spec
  if (videoSrc) {
    return (
      <div className={`demo-player-container ${className}`}>
        <video
          src={videoSrc}
          poster={poster}
          controls
          className="demo-player-video"
          playsInline
        />
      </div>
    );
  }

  // Interactive self-contained animated walkthrough
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasTriggeredView = useRef<boolean>(false);

  // Check prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Autoplay when scrolled into view
  useEffect(() => {
    if (prefersReducedMotion) {
      setIsPlaying(false);
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasTriggeredView.current) {
          hasTriggeredView.current = true;
          setIsPlaying(true);
        }
      },
      { threshold: 0.25 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  // Scene timer loop
  useEffect(() => {
    if (!isPlaying || prefersReducedMotion) return;

    const intervalMs = 50;
    const stepIncrement = (intervalMs / SCENE_DURATION_MS) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setActiveStageIndex(curr => (curr + 1) % STAGES.length);
          return 0;
        }
        return prev + stepIncrement;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, prefersReducedMotion]);

  const selectStage = useCallback((index: number) => {
    setActiveStageIndex(index);
    setProgress(0);
  }, []);

  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  const restartDemo = () => {
    setActiveStageIndex(0);
    setProgress(0);
    setIsPlaying(true);
  };

  const currentStage = STAGES[activeStageIndex];

  return (
    <div
      ref={containerRef}
      className={`demo-player-wrap ${className}`}
      aria-label="CogniCode Interactive Workspace Demo"
    >
      <style>{`
        .demo-player-wrap {
          width: 100%;
          max-width: 1000px;
          margin: 0 auto;
          background: #08070d;
          border: 1px solid #2d2444;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), 0 0 35px rgba(124, 92, 255, 0.08);
          font-family: 'DM Sans', Inter, system-ui, sans-serif;
          color: #fff;
          box-sizing: border-box;
        }

        .demo-player-wrap * {
          box-sizing: border-box;
        }

        /* Top control header */
        .demo-top-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          background: #050408;
          border-bottom: 1px solid #1e182e;
          gap: 12px;
          flex-wrap: wrap;
        }

        .demo-window-controls {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .demo-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .demo-dot.red { background: #ff5f57; }
        .demo-dot.yellow { background: #febc2e; }
        .demo-dot.green { background: #28c840; }

        .demo-title-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-family: 'DM Mono', monospace;
          color: #bfaee3;
          background: rgba(124, 92, 255, 0.09);
          padding: 3px 10px;
          border-radius: 999px;
          border: 1px solid rgba(124, 92, 255, 0.2);
        }

        .demo-playback-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .demo-control-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          color: #d1c9e3;
          background: #141021;
          border: 1px solid #33274f;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .demo-control-btn:hover {
          color: #fff;
          background: #1f1833;
          border-color: #63479a;
        }

        .demo-control-btn:focus-visible {
          outline: 2px solid #a48cff;
          outline-offset: 2px;
        }

        /* Stage Stepper Tabs */
        .demo-stage-nav {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          background: #0a0812;
          border-bottom: 1px solid #1f1830;
        }

        .demo-nav-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 10px 8px;
          font-size: 11.5px;
          font-weight: 600;
          color: #8c8599;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .demo-nav-btn:hover {
          color: #e5e0f0;
          background: rgba(255, 255, 255, 0.02);
        }

        .demo-nav-btn.active {
          color: #fff;
          background: rgba(124, 92, 255, 0.08);
          border-bottom-color: #a48cff;
        }

        .demo-nav-btn:focus-visible {
          outline: 2px solid #a48cff;
          outline-offset: -2px;
        }

        .demo-nav-num {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          padding: 1px 4px;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.08);
          color: #a48cff;
        }

        .demo-progress-bar {
          position: absolute;
          bottom: -2px;
          left: 0;
          height: 2px;
          background: #a48cff;
          transition: width 0.05s linear;
        }

        /* Workspace Main Body Simulation */
        .demo-workspace-body {
          display: grid;
          grid-template-rows: auto 1fr;
          background: #000;
          min-height: 420px;
        }

        /* Code Editor Window */
        .demo-editor-section {
          background: #040407;
          border-bottom: 1px solid #1d172e;
          display: flex;
          flex-direction: column;
        }

        .demo-file-tabs {
          display: flex;
          align-items: center;
          background: #020205;
          border-bottom: 1px solid #161224;
          padding: 0 8px;
        }

        .demo-file-tab {
          padding: 7px 14px;
          font-size: 11px;
          font-family: 'DM Mono', monospace;
          color: #79718a;
          border-right: 1px solid #161224;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .demo-file-tab.active {
          color: #fff;
          background: #0a0812;
          border-top: 2px solid #7c5cff;
        }

        .demo-code-lines {
          padding: 12px 14px;
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          line-height: 1.6;
          overflow-x: auto;
        }

        .demo-code-line {
          display: flex;
          align-items: center;
          white-space: pre;
          border-radius: 3px;
          padding: 1px 4px;
        }

        .demo-code-line.bug-highlight {
          background: rgba(239, 68, 68, 0.18);
          border-left: 2px solid #ef4444;
        }

        .demo-line-num {
          width: 32px;
          color: #554e66;
          user-select: none;
          text-align: right;
          padding-right: 14px;
          flex-shrink: 0;
        }

        .demo-bug-glyph {
          color: #ef4444;
          margin-right: 4px;
          font-size: 10px;
        }

        .tok-kw { color: #a78bfa; font-weight: 600; }
        .tok-fn { color: #60a5fa; }
        .tok-str { color: #86efac; }
        .tok-cm { color: #6b7280; font-style: italic; }
        .tok-num { color: #fbbf24; }
        .tok-err { color: #fca5a5; font-weight: 600; }

        /* Bottom Stage Panel Simulation */
        .demo-bottom-panel {
          padding: 16px 20px;
          background: #08070d;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .demo-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #1e1830;
          padding-bottom: 8px;
        }

        .demo-panel-tag {
          font-size: 10.5px;
          font-family: 'DM Mono', monospace;
          font-weight: 700;
          color: #818cf8;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .demo-panel-desc {
          font-size: 12px;
          color: #c7c1d6;
          margin: 0;
        }

        .demo-card-box {
          background: #0f0d1a;
          border: 1px solid #261f38;
          border-radius: 8px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .demo-badge-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .demo-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 10.5px;
          font-weight: 600;
          font-family: 'DM Mono', monospace;
        }
        .demo-badge.success {
          background: rgba(74, 222, 128, 0.15);
          color: #4ade80;
          border: 1px solid rgba(74, 222, 128, 0.3);
        }
        .demo-badge.fail {
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        .demo-badge.purple {
          background: rgba(124, 92, 255, 0.15);
          color: #c7b5ff;
          border: 1px solid rgba(124, 92, 255, 0.3);
        }

        .demo-text-preview {
          font-size: 12px;
          color: #e5e0f2;
          line-height: 1.5;
        }

        .demo-input-mock {
          background: #06050a;
          border: 1px solid #32284c;
          border-radius: 6px;
          padding: 8px 12px;
          font-family: 'DM Mono', monospace;
          font-size: 11.5px;
          color: #a48cff;
        }

        /* Mobile adjustments */
        @media (max-width: 640px) {
          .demo-stage-nav {
            grid-template-columns: repeat(2, 1fr);
          }
          .demo-nav-btn {
            font-size: 11px;
            padding: 8px 6px;
          }
          .demo-top-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      {/* 1. Header Toolbar */}
      <div className="demo-top-header">
        <div className="demo-window-controls">
          <span className="demo-dot red" />
          <span className="demo-dot yellow" />
          <span className="demo-dot green" />
          <span className="demo-title-pill">
            <span>●</span>
            <span>challenge / ecommerce-cart-bug</span>
          </span>
        </div>

        <div className="demo-playback-actions">
          <button
            className="demo-control-btn"
            onClick={togglePlayPause}
            title={isPlaying ? 'Pause walkthrough' : 'Resume walkthrough'}
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            className="demo-control-btn"
            onClick={restartDemo}
            title="Restart walkthrough from stage 1"
          >
            ↺ Restart
          </button>
        </div>
      </div>

      {/* 2. Stage Navigation Bar */}
      <div className="demo-stage-nav" role="tablist">
        {STAGES.map((st, idx) => {
          const isActive = idx === activeStageIndex;
          return (
            <button
              key={st.id}
              role="tab"
              aria-selected={isActive}
              className={`demo-nav-btn ${isActive ? 'active' : ''}`}
              onClick={() => selectStage(idx)}
            >
              <span className="demo-nav-num">{st.stepNumber}</span>
              <span>{st.label}</span>
              {isActive && (
                <div
                  className="demo-progress-bar"
                  style={{ width: `${progress}%` }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Workspace Simulation Body */}
      <div className="demo-workspace-body">
        {/* Monaco-like Code Editor */}
        <div className="demo-editor-section">
          <div className="demo-file-tabs">
            <span className="demo-file-tab active">app/cart.py</span>
            <span className="demo-file-tab">app/main.py</span>
            <span className="demo-file-tab">tests/test_cart.py</span>
          </div>

          <div className="demo-code-lines">
            <div className="demo-code-line">
              <span className="demo-line-num">1</span>
              <span><span className="tok-kw">class</span> <span className="tok-fn">ShoppingCart</span>:</span>
            </div>
            <div className="demo-code-line">
              <span className="demo-line-num">2</span>
              <span>    <span className="tok-kw">def</span> <span className="tok-fn">add_item</span>(<span className="tok-kw">self</span>, product_id: <span className="tok-fn">str</span>, quantity: <span className="tok-fn">int</span>):</span>
            </div>
            <div className="demo-code-line">
              <span className="demo-line-num">3</span>
              <span>        <span className="tok-kw">for</span> item <span className="tok-kw">in</span> <span className="tok-kw">self</span>.items:</span>
            </div>
            <div className="demo-code-line">
              <span className="demo-line-num">4</span>
              <span>            <span className="tok-kw">if</span> item.product_id == product_id:</span>
            </div>
            <div
              className={`demo-code-line ${
                currentStage.id === 'find_bug' ? 'bug-highlight' : ''
              }`}
            >
              <span className="demo-line-num">
                {currentStage.id === 'find_bug' && <span className="demo-bug-glyph">●</span>}
                5
              </span>
              <span>
                {'                '}
                <span className={currentStage.id === 'find_bug' ? 'tok-err' : ''}>
                  item.quantity = quantity
                </span>{' '}
                <span className="tok-cm"># &lt;-- overwrites instead of += quantity!</span>
              </span>
            </div>
            <div className="demo-code-line">
              <span className="demo-line-num">6</span>
              <span>                <span className="tok-kw">return</span> item</span>
            </div>
            <div className="demo-code-line">
              <span className="demo-line-num">7</span>
              <span>        <span className="tok-kw">self</span>.items.append(CartItem(product_id, quantity))</span>
            </div>
          </div>
        </div>

        {/* Dynamic Bottom Stage Panel */}
        <div className="demo-bottom-panel">
          <div className="demo-panel-header">
            <div className="demo-panel-tag">
              <span>{currentStage.stepNumber}</span>
              <span>{currentStage.label.toUpperCase()}</span>
            </div>
            <p className="demo-panel-desc">{currentStage.caption}</p>
          </div>

          {/* Scene 1: Understand */}
          {currentStage.id === 'understand' && (
            <div className="demo-card-box">
              <div className="demo-badge-row">
                <span className="demo-badge purple">STAGE 1: CONCEPTUAL UNDERSTANDING</span>
                <span className="demo-badge success">✓ Explanation Accepted</span>
              </div>
              <div className="demo-input-mock">
                "The ShoppingCart loops through items. If product_id matches, it should increment the count, but it currently assigns quantity directly."
              </div>
              <div className="demo-text-preview">
                <strong>Gemma 4 Mentor:</strong> Great conceptual breakdown! You identified the loop traversal and state invariant. You may now proceed to run the test suite.
              </div>
            </div>
          )}

          {/* Scene 2: Run Tests */}
          {currentStage.id === 'test' && (
            <div className="demo-card-box">
              <div className="demo-badge-row">
                <span className="demo-badge fail">1 FAILED, 1 PASSED (EXPECTED)</span>
                <span className="demo-badge purple">Pyodide 0.27.7</span>
              </div>
              <div className="demo-text-preview">
                <div>✓ <code>test_empty_cart</code> — passed (4ms)</div>
                <div style={{ color: '#fca5a5' }}>
                  ✗ <code>test_duplicate_item_quantity</code> — FAILED (8ms)
                </div>
              </div>
              <div className="demo-input-mock" style={{ color: '#fca5a5' }}>
                AssertionError: Expected quantity 2, but received 1 (line 5 in app/cart.py)
              </div>
            </div>
          )}

          {/* Scene 3: Find Bug */}
          {currentStage.id === 'find_bug' && (
            <div className="demo-card-box">
              <div className="demo-badge-row">
                <span className="demo-badge fail">● app/cart.py : line 5</span>
                <span className="demo-badge success">✓ Diagnosis Consistent</span>
              </div>
              <div className="demo-input-mock">
                "Line 5 overwrites existing quantity with the new input, violating the addition invariant."
              </div>
              <div className="demo-text-preview">
                <strong>Gemma 4 Mentor:</strong> Spot on diagnosis. Line 5 is the exact faulty mutation causing test_duplicate_item_quantity to fail. Proceed to predict output.
              </div>
            </div>
          )}

          {/* Scene 4: Predict & Explain */}
          {currentStage.id === 'predict_explain' && (
            <div className="demo-card-box">
              <div className="demo-badge-row">
                <span className="demo-badge success">✓ PREDICTION MATCHED STDOUT</span>
                <span className="demo-badge purple">Round Complete: 100/100</span>
              </div>
              <div className="demo-input-mock" style={{ color: '#4ade80' }}>
                Predicted: "Total: $45.00" == Live Python stdout: "Total: $45.00"
              </div>
              <div className="demo-text-preview">
                <strong>Gemma 4 Mentor:</strong> Both your predicted output and execution reasoning are accurate. You have mastered all 4 stages of this challenge!
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DemoPlayer;
