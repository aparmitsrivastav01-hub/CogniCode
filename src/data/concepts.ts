export interface Concept {
  id: string;
  title: string;
  summary: string;
  category: 'Python' | 'Debugging' | 'Predict output';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  buggySnippet: string;
  fixedSnippet: string;
  explanation: string;
  relatedChallengeSlug?: string;
}

export const concepts: Concept[] = [
  {
    id: 'off-by-one-indexing',
    title: 'Off-by-One Range Bounds',
    summary: 'Python range(start, stop) excludes the stop value, causing silent omissions in slice bounds and iteration loops.',
    category: 'Debugging',
    difficulty: 'Easy',
    buggySnippet: `# Expected: iterate over all indices 0 through 10 inclusive
def collect_window(items: list, end_index: int):
    # BUG: range(0, end_index) stops at end_index - 1
    return [items[i] for i in range(0, end_index)]`,
    fixedSnippet: `# Fixed: include end_index by extending upper bound by 1
def collect_window(items: list, end_index: int):
    return [items[i] for i in range(0, end_index + 1)]`,
    explanation:
      'Python sequences and `range()` use half-open intervals `[start, stop)` where the upper bound is strictly excluded. When translating mathematical index bounds or 1-indexed specifications, omitting `+ 1` silently leaves the boundary item unprocessed.',
  },
  {
    id: 'string-normalization-dedup',
    title: 'String Normalization & Case Sensitivity',
    summary: 'Comparing user-provided keys without whitespace trimming and case folding causes duplicate entries and failed lookups.',
    category: 'Predict output',
    difficulty: 'Easy',
    relatedChallengeSlug: 'ecommerce-cart-bug',
    buggySnippet: `# Checking membership in cart without normalization
def add_to_cart(cart: dict, item_sku: str, qty: int):
    # BUG: "SKU-101" != "sku-101 " -> creates duplicate item records
    if item_sku in cart:
        cart[item_sku] += qty
    else:
        cart[item_sku] = qty`,
    fixedSnippet: `# Normalizing the key with strip() and casefold()
def add_to_cart(cart: dict, item_sku: str, qty: int):
    norm_sku = item_sku.strip().casefold()
    if norm_sku in cart:
        cart[norm_sku] += qty
    else:
        cart[norm_sku] = qty`,
    explanation:
      'Raw input strings frequently carry inconsistent casing and stray whitespace. In hash lookups and dictionary keys, Python treats "SKU-101" and "sku-101" as distinct keys, leading to duplicate records in deduplication invariants.',
  },
  {
    id: 'mutable-default-arguments',
    title: 'Mutable Default Arguments',
    summary: 'Default argument expressions are evaluated once at function definition time, sharing the same list or dict across all invocations.',
    category: 'Python',
    difficulty: 'Medium',
    buggySnippet: `# Default argument evaluated once at function definition
def append_log(event: str, history: list = []):
    # BUG: history references the identical list on every call!
    history.append(event)
    return history`,
    fixedSnippet: `# Idiomatic sentinel pattern using None
def append_log(event: str, history: list | None = None):
    if history is None:
        history = []
    history.append(event)
    return history`,
    explanation:
      'In Python, def statement defaults are evaluated at compile/definition time, not invocation time. If a mutable object (list, dict, set) is used as a default, every call without an explicit parameter re-uses the same in-memory object.',
  },
  {
    id: 'dict-vs-list-lookup-complexity',
    title: 'Dict vs List Lookup Performance',
    summary: 'Using `in list` inside loops turns linear algorithms into quadratic O(N²) bottlenecks compared to O(1) set/dict lookups.',
    category: 'Debugging',
    difficulty: 'Medium',
    buggySnippet: `# Linear scan inside loop creates O(N * M) bottleneck
def find_unprocessed_ids(all_ids: list[str], processed_ids: list[str]):
    # BUG: "x in processed_ids" scans list linearly each time
    return [i for i in all_ids if i not in processed_ids]`,
    fixedSnippet: `# Convert list to set for O(1) average lookup time
def find_unprocessed_ids(all_ids: list[str], processed_ids: list[str]):
    processed_set = set(processed_ids)
    return [i for i in all_ids if i not in processed_set]`,
    explanation:
      'Membership checks (`item in collection`) operate in O(N) time for lists and tuples, but O(1) time on average for sets and dictionaries. For large data streams, converting the lookup target to a set prevents algorithmic performance collapse.',
  },
  {
    id: 'scope-and-closures',
    title: 'Late Binding in Closures',
    summary: 'Python closures bind variables by reference rather than by value, causing loop variables in lambdas to share the final iteration value.',
    category: 'Predict output',
    difficulty: 'Hard',
    buggySnippet: `# Late binding causes all functions to see final loop state
def create_multipliers():
    # BUG: 'i' is looked up when function runs, where i is always 3!
    return [lambda x: x * i for i in range(4)]`,
    fixedSnippet: `# Bind default argument at definition time
def create_multipliers():
    return [lambda x, i=i: x * i for i in range(4)]`,
    explanation:
      'Python closures resolve outer variables at runtime look-up, not at closure creation. When creating lambdas or nested functions in loops, using default parameters (`i=i`) forces immediate binding of the current loop iteration value.',
  },
  {
    id: 'integer-vs-float-division',
    title: 'Integer vs Float Division Invariants',
    summary: 'Mixing floor division (//) and true division (/) causes precision loss or unexpected float return types in index mathematics.',
    category: 'Python',
    difficulty: 'Easy',
    buggySnippet: `# True division '/' always returns float in Python 3
def get_middle_item(items: list):
    # BUG: len(items) / 2 returns float (e.g. 2.5), invalid as slice index!
    mid = len(items) / 2
    return items[mid]`,
    fixedSnippet: `# Floor division '//' returns integer index
def get_middle_item(items: list):
    mid = len(items) // 2
    return items[mid]`,
    explanation:
      'In Python 3, `/` always performs float division (e.g. `4 / 2 == 2.0`), which raises `TypeError: list indices must be integers` when used as sequence indexes. Use `//` for discrete index calculation.',
  },
];
