import type { Challenge } from '../../types/round';
import { cartRound } from '../rounds';

const buggyCartContent = cartRound.files.find(f => f.path === 'app/cart.py')?.content || '';
const fixedCartContent = buggyCartContent.replace(
  'if item.product_id == product_id:',
  'if item.product_id == normalized_id:'
);

export const ecommerceCartChallenge: Challenge = {
  ...cartRound,
  slug: 'ecommerce-cart-bug',
  summary: 'A shopping cart service combines repeated additions of products into deduplicated line items.',
  story:
    'A customer added the same product to their cart multiple times during checkout. The billing service reported that two separate lines appeared on the receipt instead of one combined total. Customer support noted that the cart line count remains at 2 when it should be 1. Tracing how incoming product IDs are handled across normalization and cart storage will uncover the issue.',
  description:
    'A customer added the same product to their cart multiple times, but two separate lines appeared with quantity 1 instead of one merged line with quantity 3. Trace how incoming product IDs are normalized and compared across app/cart.py, app/models.py, and app/utils.py to identify why the duplicate check fails.',
  structuredDescription: {
    problem:
      'Adding the same product to the shopping cart twice creates two duplicate line items with separate quantities instead of merging them into a single line item.',
    context:
      'The store service receives user product additions, normalizes ID strings into integers, and checks existing lines in the Cart to accumulate item quantities.',
    task:
      'Investigate why the deduplication loop in app/cart.py fails to recognize that an item with the same product ID is already in the cart.',
    expectedBehavior:
      'Repeated additions of the same product must find the existing cart line and increase its quantity to reflect the total count added.',
    constraints: [
      'Product IDs may be submitted as strings or integers.',
      'Stored CartItem objects must maintain integer product IDs.',
      'Distinct products must still create separate lines.',
    ],
    successCriteria:
      'The unit test suite passes with 0 failures, and the demo prints a single merged line [(42, 3)].',
  },
  expectedInvariants: [
    'Must merge repeated additions of identical product IDs into a single cart line item.',
    'Must update the line quantity to reflect the sum of all added item counts.',
    'Must treat integer and string representations of the same product ID equivalently.',
  ],
  estimatedMinutes: 8,
  tags: ['E-Commerce', 'Normalization', 'State'],
  assistantHints: [],
  hints: [
    'Check how identifiers are formatted before they enter the cart loop.',
    'Compare the type and value of the identifier stored in CartItem against the variable tested in the comparison.',
    'In app/cart.py line 12, look closely at whether normalized_id or raw product_id is compared with item.product_id.',
  ],
  fixedFile: {
    path: 'app/cart.py',
    content: fixedCartContent,
  },
  expectedOutput: {
    buggy: '[(42, 1), (42, 2)]',
    fixed: '[(42, 3)]',
  },
  modelExplanation:
    'In app/cart.py, normalize_id() converts product_id to an integer (normalized_id). However, the deduplication loop compares item.product_id with the raw un-normalized product_id argument instead of normalized_id. Because the raw argument was passed as a string, "42" == 42 evaluates to False, causing a duplicate line to be appended.',
};
