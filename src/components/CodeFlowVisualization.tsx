export function CodeFlowVisualization() {
  return <figure className="flow-viz" aria-label="Illustrative Python code execution flow">
    <svg className="flow-connectors" viewBox="0 0 540 420" aria-hidden="true">
      <defs>
        <filter id="flow-node-glow" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <path className="flow-path flow-path--purple" d="M148 84 C161 84 161 76 174 76"/>
      <path className="flow-path flow-path--purple" d="M389 106 C399 106 399 112 410 112"/>
      <path className="flow-path flow-path--red" d="M469 205 C469 238 359 234 359 270"/>
      <path className="flow-path flow-path--purple flow-path--delayed" d="M271 224 C271 246 126 238 126 270"/>
      <path className="flow-path flow-path--red flow-path--delayed" d="M210 321 C220 321 222 321 231 321"/>
      <path className="flow-path flow-path--purple flow-path--delayed" d="M397 321 C407 321 410 321 420 321"/>
      <circle className="flow-node flow-node--purple" cx="148" cy="84" r="3"/>
      <circle className="flow-node flow-node--purple" cx="389" cy="106" r="3"/>
      <circle className="flow-node flow-node--red" cx="469" cy="205" r="3"/>
      <circle className="flow-node flow-node--red" cx="210" cy="321" r="3"/>
    </svg>

    <section className="flow-panel flow-input" aria-label="Example input">
      <div className="flow-panel-heading"><span className="flow-icon flow-icon--input">↳</span><span>INPUT</span><i className="flow-live-dot"/></div>
      <div className="flow-input-value"><span>requested_state</span><b>"ready"</b></div>
      <div className="flow-input-value"><span>limit</span><b>3</b></div>
    </section>

    <section className="flow-panel flow-code" aria-label="Python code">
      <div className="flow-panel-heading"><span className="flow-icon flow-icon--code">‹›</span><span>records.py</span><span className="flow-file-tag">PY</span></div>
      <div className="flow-code-body">
        <div><span className="flow-line-no">16</span><code><span className="syntax-name">requested</span> <span className="syntax-op">=</span> request.state</code></div>
        <div><span className="flow-line-no">17</span><code><span className="syntax-key">for</span> row <span className="syntax-key">in</span> records:</code></div>
        <div className="flow-code-gap"><span className="flow-line-no"> </span><code> </code></div>
        <div className="flow-code-error"><span className="flow-line-no">18</span><code><span className="syntax-key">if</span> row.state <span className="syntax-op">==</span> requested:</code><span className="flow-error-marker">branch check</span></div>
        <div className="flow-code-indent"><span className="flow-line-no">19</span><code><span className="syntax-key">return</span> row</code></div>
        <div><span className="flow-line-no">20</span><code><span className="syntax-key">return</span> <span className="syntax-key">None</span></code></div>
      </div>
    </section>

    <section className="flow-panel flow-steps" aria-label="Execution flow">
      <div className="flow-panel-heading"><span className="flow-icon flow-icon--steps">⌁</span><span>EXECUTION FLOW</span></div>
      <ol className="flow-step-list">
        <li><b>1</b><span>Read requested state</span><code>"ready"</code></li>
        <li className="flow-step-fault"><b>2</b><span>Check current row</span><code>"paused" == "ready"</code></li>
        <li className="flow-step-fault"><b>3</b><span>Condition is false</span><code>continue</code></li>
        <li><b>4</b><span>Check next record</span><code>loop continues</code></li>
      </ol>
    </section>

    <section className="flow-panel flow-variables" aria-label="Variable values at the branch">
      <div className="flow-panel-heading"><span className="flow-icon flow-icon--vars">{ }</span><span>VARIABLES AT BRANCH</span></div>
      <div className="flow-var"><span>row.state</span><b>"paused" <small>str</small></b></div>
      <div className="flow-var"><span>requested</span><b>"ready" <small>str</small></b></div>
      <div className="flow-var"><span>row.id</span><b>17 <small>int</small></b></div>
    </section>

    <section className="flow-panel flow-error" aria-label="Branch outcome">
      <div className="flow-panel-heading"><span className="flow-error-symbol">!</span><span>BRANCH CHECK</span><span className="flow-error-tag">NOT TAKEN</span></div>
      <p>Current row does not match</p>
      <code>"paused" <em>!=</em> "ready"</code>
      <small>records.py · line 18</small>
    </section>

    <section className="flow-panel flow-hint" aria-label="AI suggested correction">
      <div className="flow-panel-heading"><span className="flow-icon flow-icon--hint">✳</span><span>TRACE NOTE</span></div>
      <p>Follow the values through each branch</p>
      <code>row.state ==<br/><b>requested</b></code>
    </section>
  </figure>;
}
