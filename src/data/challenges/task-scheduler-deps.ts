import type { Challenge } from '../../types/round';

const modelsPy = `from dataclasses import dataclass, field
from enum import Enum

class TaskState(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

@dataclass
class PipelineTask:
    name: str
    description: str
    dependencies: list[str] = field(default_factory=list)
    state: TaskState = TaskState.PENDING
`;

const graphPy = `from typing import Optional
from .models import PipelineTask

class DependencyGraph:
    """Directed acyclic graph resolving task dependencies in topological order."""

    def __init__(self) -> None:
        self.tasks: dict[str, PipelineTask] = {}

    def add_task(self, task: PipelineTask) -> None:
        self.tasks[task.name] = task

    def get_execution_order(self) -> list[str]:
        visited: set[str] = set()
        order: list[str] = []

        def visit(task_name: str) -> None:
            if task_name in visited:
                return
            # BUG: adds task to execution order before visiting its prerequisites
            visited.add(task_name)
            order.append(task_name)
            for dep in self.tasks[task_name].dependencies:
                visit(dep)

        # Process root tasks in deterministic alphabetical order
        for name in sorted(self.tasks.keys()):
            visit(name)

        return order
`;

const fixedGraphPy = `from typing import Optional
from .models import PipelineTask

class DependencyGraph:
    """Directed acyclic graph resolving task dependencies in topological order."""

    def __init__(self) -> None:
        self.tasks: dict[str, PipelineTask] = {}

    def add_task(self, task: PipelineTask) -> None:
        self.tasks[task.name] = task

    def get_execution_order(self) -> list[str]:
        visited: set[str] = set()
        order: list[str] = []

        def visit(task_name: str) -> None:
            if task_name in visited:
                return
            # Visit all prerequisite dependencies before scheduling current task
            for dep in self.tasks[task_name].dependencies:
                visit(dep)
            visited.add(task_name)
            order.append(task_name)

        # Process root tasks in deterministic alphabetical order
        for name in sorted(self.tasks.keys()):
            visit(name)

        return order
`;

const validatorPy = `from .models import PipelineTask

class GraphValidator:
    """Validates pipeline integrity and detects missing task definitions."""

    def __init__(self, tasks: dict[str, PipelineTask]) -> None:
        self.tasks = tasks

    def validate_definitions(self) -> bool:
        # TODO: Add cycle detection via Tarjan's algorithm
        for name, task in self.tasks.items():
            for dep in task.dependencies:
                if dep not in self.tasks:
                    raise KeyError(f"Task '{name}' references unknown dependency '{dep}'")
        return True
`;

const executorPy = `from .graph import DependencyGraph
from .models import PipelineTask, TaskState
from .validator import GraphValidator

class PrerequisiteError(Exception):
    """Raised when a task is triggered before all its dependencies have finished."""
    pass

class PipelineExecutor:
    """Executes scheduled tasks while enforcing dependency completion."""

    def __init__(self, graph: DependencyGraph) -> None:
        self.graph = graph
        self.validator = GraphValidator(graph.tasks)

    def run_pipeline(self) -> list[str]:
        self.validator.validate_definitions()
        order = self.graph.get_execution_order()
        completed: set[str] = set()
        execution_log: list[str] = []

        for task_name in order:
            task = self.graph.tasks[task_name]
            # Ensure every prerequisite has actually completed
            for dep in task.dependencies:
                if dep not in completed:
                    raise PrerequisiteError(
                        f"CRITICAL: Task '{task_name}' executed before prerequisite '{dep}' finished!"
                    )

            task.state = TaskState.COMPLETED
            completed.add(task_name)
            execution_log.append(f"SUCCESS: {task_name}")

        return execution_log
`;

const mainPy = `from app.models import PipelineTask
from app.graph import DependencyGraph
from app.executor import PipelineExecutor, PrerequisiteError

def run_build_pipeline() -> None:
    # Diamond-shaped deployment pipeline:
    #        setup_env
    #       /         \\
    # build_image    migrate_db
    #       \\         /
    #       deploy_app
    graph = DependencyGraph()
    graph.add_task(PipelineTask("setup_env", "Prepare build workspace", []))
    graph.add_task(PipelineTask("build_image", "Compile container image", ["setup_env"]))
    graph.add_task(PipelineTask("migrate_db", "Run SQL schema migrations", ["setup_env"]))
    graph.add_task(PipelineTask("deploy_app", "Deploy container to production", ["build_image", "migrate_db"]))

    print("Computed execution order:")
    order = graph.get_execution_order()
    print(" -> ".join(order))

    print("\\nExecuting pipeline:")
    executor = PipelineExecutor(graph)
    try:
        logs = executor.run_pipeline()
        for line in logs:
            print(line)
        print("\\nPipeline status: ALL_PASSED")
    except PrerequisiteError as err:
        print(f"PIPELINE CRASH: {err}")

if __name__ == "__main__":
    run_build_pipeline()
`;

const testSchedulerPy = `import unittest
from app.models import PipelineTask
from app.graph import DependencyGraph
from app.executor import PipelineExecutor

class TestTaskScheduler(unittest.TestCase):
    def test_diamond_dependencies_respected(self) -> None:
        graph = DependencyGraph()
        graph.add_task(PipelineTask("init", "Init", []))
        graph.add_task(PipelineTask("step_a", "Step A", ["init"]))
        graph.add_task(PipelineTask("step_b", "Step B", ["init"]))
        graph.add_task(PipelineTask("final", "Final", ["step_a", "step_b"]))

        executor = PipelineExecutor(graph)
        logs = executor.run_pipeline()
        self.assertEqual(len(logs), 4)
        self.assertEqual(graph.tasks["final"].state.value, "completed")

if __name__ == "__main__":
    unittest.main()
`;

export const taskSchedulerDepsChallenge: Challenge = {
  id: 'task-scheduler-deps',
  slug: 'task-scheduler-deps',
  title: 'Task Scheduler That Runs Dependent Jobs Out of Order',
  category: 'Debugging',
  difficulty: 'Hard',
  estimatedMinutes: 15,
  tags: ['Graphs', 'Topological Sort', 'Algorithms'],
  entryFile: 'app/main.py',
  summary: 'A workflow orchestrator resolves task dependency graphs and executes build steps in topological order.',
  story:
    'Our build system schedules multi-step deployment pipelines with complex dependencies. Developers noticed that database migration tasks sometimes run before the database container starts, causing the build to crash. The scheduler uses a topological sort to sequence the dependency graph. In diamond-shaped pipelines, certain dependent tasks are executed before their required parent tasks finish.',
  description:
    'A diamond-shaped task pipeline crashes because dependent tasks run before their required parents finish. Examine the DFS topological ordering in app/graph.py to discover why tasks are added to the execution schedule in preorder instead of postorder.',
  structuredDescription: {
    problem:
      'Tasks in a multi-step build pipeline are scheduled out of order, causing downstream deployment steps to execute before their necessary database and build dependencies finish.',
    context:
      'The DependencyGraph resolves tasks using a recursive depth-first search to produce a linear topological execution schedule executed by PipelineExecutor.',
    task:
      'Inspect the visit() helper in app/graph.py and determine why task nodes are appended to the execution list before their prerequisite dependencies are traversed.',
    expectedBehavior:
      'All prerequisite dependencies must appear strictly before dependent tasks in the generated schedule, guaranteeing safe execution.',
    constraints: [
      'Topological ordering must enforce postorder insertion (prerequisites before dependents).',
      'Cyclic graphs or unknown dependencies must be rejected.',
      'Graph traversal must produce deterministic results across identical pipeline definitions.',
    ],
    successCriteria:
      'All unit tests in tests/test_scheduler.py pass, and the diamond pipeline demo runs to completion with Pipeline status: ALL_PASSED.',
  },
  expectedInvariants: [
    'Must execute all prerequisite dependencies before running any dependent task.',
    'Must detect circular dependency cycles and raise a descriptive error.',
    'Must produce a deterministic execution order for identical dependency graphs.',
  ],
  expectedBehaviour: [
    'Must execute all prerequisite dependencies before running any dependent task.',
    'Must detect circular dependency cycles and raise a descriptive error.',
    'Must produce a deterministic execution order for identical dependency graphs.',
  ],
  bug: {
    file: 'app/graph.py',
    line: 21,
  },
  fix: {
    file: 'app/graph.py',
    line: 21,
    newText: `            # Visit all prerequisite dependencies before scheduling current task
            for dep in self.tasks[task_name].dependencies:
                visit(dep)
            visited.add(task_name)
            order.append(task_name)`,
  },
  decoy: {
    text: 'Check the GraphValidator in app/validator.py line 12; missing cycle detection might allow cyclic graphs to proceed.',
    pointsTo: 'app/validator.py',
  },
  assistantHints: [],
  hints: [
    'Look at the computed execution order printed at the beginning of the demo.',
    'Check why deploy_app appears at the front of the list even though it requires build_image and migrate_db.',
    'In app/graph.py line 21, order.append(task_name) is called before the loop that visits dependencies, scheduling tasks in preorder instead of postorder.',
  ],
  explainRubric: [
    'Identifies that DFS traversal in get_execution_order appends tasks to the order list in preorder.',
    'Explains that in a topological sort, a node must only be placed into the schedule after all its prerequisites have been processed.',
    'Shows that moving the order.append call after the dependency loop ensures prerequisite tasks execute first.',
  ],
  files: [
    { path: 'app/models.py', language: 'python', content: modelsPy },
    { path: 'app/graph.py', language: 'python', content: graphPy },
    { path: 'app/validator.py', language: 'python', content: validatorPy },
    { path: 'app/executor.py', language: 'python', content: executorPy },
    { path: 'app/main.py', language: 'python', content: mainPy },
    { path: 'tests/test_scheduler.py', language: 'python', content: testSchedulerPy },
    { path: 'tests/test_cart.py', language: 'python', content: testSchedulerPy },
  ],
  fixedFile: {
    path: 'app/graph.py',
    content: fixedGraphPy,
  },
  expectedOutput: {
    buggy: `Computed execution order:
build_image -> setup_env -> deploy_app -> migrate_db

Executing pipeline:
PIPELINE CRASH: CRITICAL: Task 'build_image' executed before prerequisite 'setup_env' finished!`,
    fixed: `Computed execution order:
setup_env -> build_image -> migrate_db -> deploy_app

Executing pipeline:
SUCCESS: setup_env
SUCCESS: build_image
SUCCESS: migrate_db
SUCCESS: deploy_app

Pipeline status: ALL_PASSED`,
  },
  modelExplanation:
    'In app/graph.py, the visit() function appends task_name to the order list before visiting its dependencies. In topological sorting, a node must only be added after all its prerequisites have finished (postorder traversal). Because of this preorder placement, tasks like deploy_app and build_image are scheduled before their prerequisites, causing the pipeline executor to crash.',
};
