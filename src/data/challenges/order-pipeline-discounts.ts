import type { Challenge } from '../../types/round';

const modelsPy = `from dataclasses import dataclass, field
from typing import Optional

@dataclass(frozen=True)
class OrderItem:
    sku: str
    name: str
    unit_price: int
    quantity: int

    @property
    def line_total(self) -> int:
        return self.unit_price * self.quantity

@dataclass
class CustomerOrder:
    order_id: str
    customer_id: str
    items: list[OrderItem]
    coupon_codes: list[str] = field(default_factory=list)

@dataclass(frozen=True)
class AppliedDiscount:
    code: str
    amount: int
    description: str

@dataclass(frozen=True)
class OrderReceipt:
    order_id: str
    subtotal: int
    discount_total: int
    tax: int
    final_total: int
    discounts_applied: list[AppliedDiscount]
`;

const rulesPy = `from typing import Optional
from .models import AppliedDiscount

AVAILABLE_PROMOTIONS: dict[str, int] = {
    "VIP25": 25,       # $25 off VIP member order
    "WELCOME10": 10,   # $10 off first order
    "SEASONAL5": 5,    # $5 seasonal credit
}

def resolve_coupon(code: str) -> Optional[AppliedDiscount]:
    amount = AVAILABLE_PROMOTIONS.get(code.upper().strip())
    if amount is not None:
        return AppliedDiscount(code.upper(), amount, f"Promotional discount: {code.upper()}")
    return None
`;

const buggyDiscountsPy = `from typing import Optional
from .models import CustomerOrder, AppliedDiscount
from .rules import resolve_coupon

def compute_order_discounts(
    order: CustomerOrder,
    discounts_accumulator: list[AppliedDiscount] = [],
) -> list[AppliedDiscount]:
    """Applies valid coupons to customer order and accumulates active discounts."""
    # BUG: mutable default argument discounts_accumulator persists across invocations!
    for code in order.coupon_codes:
        discount = resolve_coupon(code)
        if discount is not None:
            discounts_accumulator.append(discount)
    return discounts_accumulator
`;

const fixedDiscountsPy = `from typing import Optional
from .models import CustomerOrder, AppliedDiscount
from .rules import resolve_coupon

def compute_order_discounts(
    order: CustomerOrder,
    discounts_accumulator: Optional[list[AppliedDiscount]] = None,
) -> list[AppliedDiscount]:
    """Applies valid coupons to customer order and accumulates active discounts."""
    if discounts_accumulator is None:
        discounts_accumulator = []
    for code in order.coupon_codes:
        discount = resolve_coupon(code)
        if discount is not None:
            discounts_accumulator.append(discount)
    return discounts_accumulator
`;

const taxPy = `class TaxCalculator:
    """Computes state tax on discounted taxable subtotal."""

    def __init__(self, tax_rate_percent: int = 10) -> None:
        self.tax_rate_percent = tax_rate_percent

    def compute_tax(self, taxable_amount: int) -> int:
        # TODO: support jurisdictional tax exemptions
        if taxable_amount <= 0:
            return 0
        return (taxable_amount * self.tax_rate_percent) // 100
`;

const pipelinePy = `from .models import CustomerOrder, OrderReceipt
from .discounts import compute_order_discounts
from .tax import TaxCalculator

class OrderProcessingPipeline:
    """Processes e-commerce orders through subtotal, discounts, and tax stages."""

    def __init__(self, tax_calculator: TaxCalculator) -> None:
        self.tax_calculator = tax_calculator

    def process_order(self, order: CustomerOrder) -> OrderReceipt:
        subtotal = sum(item.line_total for item in order.items)
        discounts = compute_order_discounts(order)
        discount_total = sum(d.amount for d in discounts)

        taxable = max(0, subtotal - discount_total)
        tax = self.tax_calculator.compute_tax(taxable)
        final_total = taxable + tax

        return OrderReceipt(
            order_id=order.order_id,
            subtotal=subtotal,
            discount_total=discount_total,
            tax=tax,
            final_total=final_total,
            discounts_applied=list(discounts),
        )
`;

const mainPy = `from app.models import OrderItem, CustomerOrder
from app.tax import TaxCalculator
from app.pipeline import OrderProcessingPipeline

def run_checkout_pipeline() -> None:
    pipeline = OrderProcessingPipeline(TaxCalculator(tax_rate_percent=10))

    print("Order 1: Alice checks out with VIP25 coupon ($25 off)")
    order_alice = CustomerOrder(
        order_id="ORD-101",
        customer_id="cust_alice",
        items=[OrderItem("SKU-KEYBOARD", "Mechanical Keyboard", 100, 1)],
        coupon_codes=["VIP25"],
    )
    receipt_1 = pipeline.process_order(order_alice)
    applied_codes = [d.code for d in receipt_1.discounts_applied]
    print(f"Receipt 1: Subtotal: \${receipt_1.subtotal}, Discounts: \${receipt_1.discount_total} ({applied_codes}), Total: \${receipt_1.final_total}")

    print("\\nOrder 2: Bob checks out with NO coupons")
    order_bob = CustomerOrder(
        order_id="ORD-102",
        customer_id="cust_bob",
        items=[OrderItem("SKU-MOUSE", "Gaming Mouse", 60, 1)],
        coupon_codes=[],  # No coupons provided!
    )
    receipt_2 = pipeline.process_order(order_bob)
    applied_codes_2 = [d.code for d in receipt_2.discounts_applied]
    print(f"Receipt 2: Subtotal: \${receipt_2.subtotal}, Discounts: \${receipt_2.discount_total} ({applied_codes_2}), Total: \${receipt_2.final_total}")

if __name__ == "__main__":
    run_checkout_pipeline()
`;

const testDiscountsPy = `import unittest
from app.models import OrderItem, CustomerOrder
from app.tax import TaxCalculator
from app.pipeline import OrderProcessingPipeline

class TestOrderDiscounts(unittest.TestCase):
    def test_discounts_do_not_leak_to_next_order(self) -> None:
        pipeline = OrderProcessingPipeline(TaxCalculator(10))

        order1 = CustomerOrder("O1", "c1", [OrderItem("S1", "Item", 100, 1)], ["VIP25"])
        receipt1 = pipeline.process_order(order1)
        self.assertEqual(receipt1.discount_total, 25)

        # Order 2 has no coupons and must have 0 discounts!
        order2 = CustomerOrder("O2", "c2", [OrderItem("S2", "Item", 50, 1)], [])
        receipt2 = pipeline.process_order(order2)
        self.assertEqual(receipt2.discount_total, 0)
        self.assertEqual(len(receipt2.discounts_applied), 0)

if __name__ == "__main__":
    unittest.main()
`;

export const orderPipelineDiscountsChallenge: Challenge = {
  id: 'order-pipeline-discounts',
  slug: 'order-pipeline-discounts',
  title: 'Order Pipeline That Leaks Discounts Across Customers',
  category: 'Debugging',
  difficulty: 'Hard',
  estimatedMinutes: 15,
  tags: ['Mutable State', 'Pricing', 'Pipeline'],
  entryFile: 'app/main.py',
  summary: 'An e-commerce pricing engine calculates item subtotal, applies coupon promotions, and computes taxes and shipping.',
  story:
    'Our store uses an order calculation pipeline to compute totals, promotional discounts, and shipping fees. Customers without any promo codes began receiving unexpected VIP and seasonal discounts on their receipts. The billing service is losing revenue because discounts applied to one customer appear on subsequent customer orders. Tracing the discount processor will reveal how promotion state persists between independent orders.',
  description:
    'Our store uses an order calculation pipeline to compute totals, promotional discounts, and shipping fees. Customers without any promo codes began receiving unexpected VIP and seasonal discounts on their receipts. The billing service is losing revenue because discounts applied to one customer appear on subsequent customer orders. Tracing the discount processor will reveal how promotion state persists between independent orders.',
  expectedInvariants: [
    'Must only apply promotional discounts that are explicitly attached to the current order.',
    'Must compute each customer order independently without leaking previous order state.',
    'Must produce identical pricing calculations regardless of execution order.',
  ],
  expectedBehaviour: [
    'Must only apply promotional discounts that are explicitly attached to the current order.',
    'Must compute each customer order independently without leaking previous order state.',
    'Must produce identical pricing calculations regardless of execution order.',
  ],
  bug: {
    file: 'app/discounts.py',
    line: 7,
  },
  fix: {
    file: 'app/discounts.py',
    line: 7,
    newText: `def compute_order_discounts(
    order: CustomerOrder,
    discounts_accumulator: Optional[list[AppliedDiscount]] = None,
) -> list[AppliedDiscount]:
    """Applies valid coupons to customer order and accumulates active discounts."""
    if discounts_accumulator is None:
        discounts_accumulator = []`,
  },
  decoy: {
    text: 'Check the coupon resolution map in app/rules.py line 12; string casing or whitespace might be triggering false positive matches.',
    pointsTo: 'app/rules.py',
  },
  assistantHints: [
    {
      id: 'pipeline-hint-1',
      text: 'The coupon matching in app/rules.py normalizes codes to uppercase and might be matching unexpected codes.',
      pointsTo: 'app/rules.py',
      isDecoy: true,
      recommendedChoice: 'verify',
    },
    {
      id: 'pipeline-hint-2',
      text: 'Inspect the parameter defaults in app/discounts.py for compute_order_discounts, specifically discounts_accumulator.',
      pointsTo: 'app/discounts.py',
      isDecoy: false,
      recommendedChoice: 'trust',
    },
    {
      id: 'pipeline-hint-3',
      text: 'The TaxCalculator in app/tax.py contains a TODO comment regarding jurisdictional exemptions that might distort final totals.',
      pointsTo: 'app/tax.py',
      isDecoy: true,
      recommendedChoice: 'verify',
    },
  ],
  hints: [
    'Observe why Bob receives a VIP25 discount on Order 2 even though his coupon_codes list is empty.',
    'Check when the default list in compute_order_discounts is created in Python.',
    'In app/discounts.py, discounts_accumulator uses a mutable default list ([]), which is evaluated once at module load and shared across all order calls.',
  ],
  explainRubric: [
    'Identifies that compute_order_discounts uses a mutable default argument ([]).',
    'Explains that Python evaluates default arguments once at function definition time, sharing the list across subsequent invocations.',
    'States that using None as a sentinel default and initializing a fresh list inside the function fixes the issue.',
  ],
  files: [
    { path: 'app/models.py', language: 'python', content: modelsPy },
    { path: 'app/rules.py', language: 'python', content: rulesPy },
    { path: 'app/discounts.py', language: 'python', content: buggyDiscountsPy },
    { path: 'app/tax.py', language: 'python', content: taxPy },
    { path: 'app/pipeline.py', language: 'python', content: pipelinePy },
    { path: 'app/main.py', language: 'python', content: mainPy },
    { path: 'tests/test_discounts.py', language: 'python', content: testDiscountsPy },
    { path: 'tests/test_cart.py', language: 'python', content: testDiscountsPy },
  ],
  fixedFile: {
    path: 'app/discounts.py',
    content: fixedDiscountsPy,
  },
  expectedOutput: {
    buggy: `Order 1: Alice checks out with VIP25 coupon ($25 off)
Receipt 1: Subtotal: $100, Discounts: $25 (['VIP25']), Total: $82

Order 2: Bob checks out with NO coupons
Receipt 2: Subtotal: $60, Discounts: $25 (['VIP25']), Total: $38`,
    fixed: `Order 1: Alice checks out with VIP25 coupon ($25 off)
Receipt 1: Subtotal: $100, Discounts: $25 (['VIP25']), Total: $82

Order 2: Bob checks out with NO coupons
Receipt 2: Subtotal: $60, Discounts: $0 ([]), Total: $66`,
  },
  modelExplanation:
    'In app/discounts.py, the function compute_order_discounts defines discounts_accumulator: list[AppliedDiscount] = []. In Python, default argument expressions are evaluated once at function definition time. When Alice applies her VIP25 coupon, it is appended to this shared list. When Bob subsequently checks out with no coupons, the function reuses the same list, erroneously applying Alice’s discount to Bob’s order.',
};
