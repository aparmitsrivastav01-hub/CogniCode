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
  expectedInvariants: [
    'Must merge repeated additions of identical product IDs into a single cart line item.',
    'Must update the line quantity to reflect the sum of all added item counts.',
    'Must treat integer and string representations of the same product ID equivalently.',
  ],
  estimatedMinutes: 8,
  tags: ['E-Commerce', 'Normalization', 'State'],
  assistantHints: [
    {
      id: 'cart-hint-1',
      text: 'The CartItem dataclass in app/models.py might be enforcing strict type checking on product_id.',
      pointsTo: 'app/models.py',
      isDecoy: true,
      recommendedChoice: 'verify',
    },
    {
      id: 'cart-hint-2',
      text: 'Notice that normalize_id in app/utils.py returns an integer, but check which variable app/cart.py tests against.',
      pointsTo: 'app/cart.py',
      isDecoy: false,
      recommendedChoice: 'trust',
    },
    {
      id: 'cart-hint-3',
      text: 'The main demo script in app/main.py might be initializing the Cart with incorrect default items.',
      pointsTo: 'app/main.py',
      isDecoy: true,
      recommendedChoice: 'verify',
    },
  ],
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
