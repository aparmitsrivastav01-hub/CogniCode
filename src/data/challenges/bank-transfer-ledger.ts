import type { Challenge } from '../../types/round';

const modelsPy = `from dataclasses import dataclass
from enum import Enum

class AccountStatus(Enum):
    ACTIVE = "active"
    FROZEN = "frozen"
    CLOSED = "closed"

@dataclass
class Account:
    account_id: str
    owner: str
    balance: int
    status: AccountStatus = AccountStatus.ACTIVE

@dataclass(frozen=True)
class AuditResult:
    is_balanced: bool
    total_in_accounts: int
    total_fees_collected: int
    system_initial_capital: int
    discrepancy: int
`;

const accountsPy = `from typing import Optional
from .models import Account, AccountStatus

class AccountRepository:
    """In-memory account datastore with status checks."""

    def __init__(self) -> None:
        self._accounts: dict[str, Account] = {}

    def add_account(self, account: Account) -> None:
        self._accounts[account.account_id] = account

    def get(self, account_id: str) -> Optional[Account]:
        return self._accounts.get(account_id)

    def all_accounts(self) -> list[Account]:
        return list(self._accounts.values())
`;

const ledgerPy = `from dataclasses import dataclass
from .models import Account, AuditResult

@dataclass(frozen=True)
class LedgerEntry:
    entry_id: int
    entry_type: str  # DEBIT, CREDIT, FEE
    account_id: str
    amount: int

class SystemLedger:
    """Immutable audit trail for financial entries and reconciliation."""

    def __init__(self, initial_capital: int) -> None:
        self.initial_capital = initial_capital
        self._entries: list[LedgerEntry] = []
        self._seq = 0
        self.total_fees = 0

    def record_debit(self, account_id: str, amount: int) -> None:
        self._seq += 1
        self._entries.append(LedgerEntry(self._seq, "DEBIT", account_id, amount))

    def record_credit(self, account_id: str, amount: int) -> None:
        self._seq += 1
        self._entries.append(LedgerEntry(self._seq, "CREDIT", account_id, amount))

    def record_fee(self, amount: int) -> None:
        self.total_fees += amount

    def audit(self, accounts: list[Account]) -> AuditResult:
        total_in_accounts = sum(a.balance for a in accounts)
        total_system_funds = total_in_accounts + self.total_fees
        discrepancy = total_system_funds - self.initial_capital
        return AuditResult(
            is_balanced=(discrepancy == 0),
            total_in_accounts=total_in_accounts,
            total_fees_collected=self.total_fees,
            system_initial_capital=self.initial_capital,
            discrepancy=discrepancy,
        )
`;

const buggyTransferPy = `from .accounts import AccountRepository
from .ledger import SystemLedger
from .models import AccountStatus

class TransferError(Exception):
    """Raised when a transfer cannot be executed."""
    pass

class TransferService:
    """Coordinates account transfers, fee collection, and ledger audits."""

    def __init__(self, accounts: AccountRepository, ledger: SystemLedger, fee: int = 5) -> None:
        self.accounts = accounts
        self.ledger = ledger
        self.fee = fee

    def transfer(self, from_id: str, to_id: str, amount: int) -> bool:
        if amount <= 0:
            raise TransferError("Transfer amount must be positive")

        sender = self.accounts.get(from_id)
        if not sender or sender.status != AccountStatus.ACTIVE:
            raise TransferError(f"Sender account {from_id} is not eligible")

        total_deduction = amount + self.fee
        if sender.balance < total_deduction:
            raise TransferError("Insufficient funds for transfer and fee")

        # Deduct sender balance and post ledger debit entry
        sender.balance -= total_deduction
        self.ledger.record_debit(from_id, total_deduction)

        # Validate recipient account after deducting sender
        receiver = self.accounts.get(to_id)
        if not receiver or receiver.status != AccountStatus.ACTIVE:
            raise TransferError(f"Receiver account {to_id} is inactive or does not exist")

        receiver.balance += amount
        self.ledger.record_credit(to_id, amount)
        self.ledger.record_fee(self.fee)
        return True
`;

const fixedTransferPy = `from .accounts import AccountRepository
from .ledger import SystemLedger
from .models import AccountStatus

class TransferError(Exception):
    """Raised when a transfer cannot be executed."""
    pass

class TransferService:
    """Coordinates account transfers, fee collection, and ledger audits."""

    def __init__(self, accounts: AccountRepository, ledger: SystemLedger, fee: int = 5) -> None:
        self.accounts = accounts
        self.ledger = ledger
        self.fee = fee

    def transfer(self, from_id: str, to_id: str, amount: int) -> bool:
        if amount <= 0:
            raise TransferError("Transfer amount must be positive")

        sender = self.accounts.get(from_id)
        if not sender or sender.status != AccountStatus.ACTIVE:
            raise TransferError(f"Sender account {from_id} is not eligible")

        receiver = self.accounts.get(to_id)
        if not receiver or receiver.status != AccountStatus.ACTIVE:
            raise TransferError(f"Receiver account {to_id} is inactive or does not exist")

        total_deduction = amount + self.fee
        if sender.balance < total_deduction:
            raise TransferError("Insufficient funds for transfer and fee")

        # Mutate balances and post entries only after all accounts are verified
        sender.balance -= total_deduction
        self.ledger.record_debit(from_id, total_deduction)

        receiver.balance += amount
        self.ledger.record_credit(to_id, amount)
        self.ledger.record_fee(self.fee)
        return True
`;

const mainPy = `from app.models import Account, AccountStatus
from app.accounts import AccountRepository
from app.ledger import SystemLedger
from app.transfer import TransferService, TransferError

def run_banking_scenario() -> None:
    # System starts with $1,000 total capital
    repo = AccountRepository()
    repo.add_account(Account("acc_alice", "Alice", 600, AccountStatus.ACTIVE))
    repo.add_account(Account("acc_bob", "Bob", 400, AccountStatus.ACTIVE))
    repo.add_account(Account("acc_charlie", "Charlie", 0, AccountStatus.FROZEN))

    ledger = SystemLedger(initial_capital=1000)
    service = TransferService(repo, ledger, fee=5)

    print("Initial check:")
    res = ledger.audit(repo.all_accounts())
    print(f"Balanced: {res.is_balanced} (Accounts: \${res.total_in_accounts}, Capital: \${res.system_initial_capital})")

    print("\\nTx 1: Alice transfers $100 to Bob (fee $5)")
    service.transfer("acc_alice", "acc_bob", 100)
    print(f"Alice balance: \${repo.get('acc_alice').balance}, Bob balance: \${repo.get('acc_bob').balance}")

    print("\\nTx 2: Alice attempts $200 transfer to Charlie (FROZEN account)")
    try:
        service.transfer("acc_alice", "acc_charlie", 200)
        print("Transfer succeeded unexpectedly")
    except TransferError as err:
        print(f"Caught expected failure: {err}")

    print("\\nPost-transactions reconciliation:")
    res = ledger.audit(repo.all_accounts())
    if res.is_balanced:
        print(f"AUDIT PASS: System balanced. Accounts: \${res.total_in_accounts}, Fees: \${res.total_fees_collected}")
    else:
        print(f"AUDIT FAIL: Unbalanced ledger! Discrepancy: \${res.discrepancy}")

if __name__ == "__main__":
    run_banking_scenario()
`;

const testTransferPy = `import unittest
from app.models import Account, AccountStatus
from app.accounts import AccountRepository
from app.ledger import SystemLedger
from app.transfer import TransferService, TransferError

class TestTransferLedger(unittest.TestCase):
    def test_failed_transfer_conserves_funds(self) -> None:
        repo = AccountRepository()
        repo.add_account(Account("a1", "Alice", 500, AccountStatus.ACTIVE))
        repo.add_account(Account("a2", "Bob", 500, AccountStatus.FROZEN))

        ledger = SystemLedger(initial_capital=1000)
        service = TransferService(repo, ledger, fee=5)

        with self.assertRaises(TransferError):
            service.transfer("a1", "a2", 100)

        # Alice's funds must NOT be deducted if the recipient was invalid!
        self.assertEqual(repo.get("a1").balance, 500)
        audit = ledger.audit(repo.all_accounts())
        self.assertTrue(audit.is_balanced)
        self.assertEqual(audit.discrepancy, 0)

if __name__ == "__main__":
    unittest.main()
`;

export const bankTransferLedgerChallenge: Challenge = {
  id: 'bank-transfer-ledger',
  slug: 'bank-transfer-ledger',
  title: 'Transfer Ledger That Loses Funds on Failed Transfers',
  category: 'Debugging',
  difficulty: 'Hard',
  estimatedMinutes: 15,
  tags: ['Financial', 'Ledger', 'Invariants'],
  entryFile: 'app/main.py',
  summary: 'A ledger-backed banking service transfers funds between customer accounts while recording audit entries and processing fees.',
  story:
    'Our payment gateway processes transfers between customer accounts with a flat transaction fee. An operations auditor discovered that our total ledger balance does not equal the sum of all customer accounts. When a customer attempted a transfer to a frozen or non-existent destination account, the sender lost money but the recipient never received it. The ledger entries show the withdrawal succeeded even though the overall transfer failed.',
  description:
    'When a transfer to a frozen or non-existent destination account fails, money is permanently lost from the system and the ledger audit fails. Trace the order of debit operations and validation checks in app/transfer.py to discover why failed transfers corrupt the balance.',
  structuredDescription: {
    problem:
      'Attempting a transfer to a frozen account raises an error, but the sender is debited anyway and the funds disappear from the total ledger capital.',
    context:
      'The TransferService handles account debits, credits, and flat fee collections, while SystemLedger audits the entire banking system for conservation of money.',
    task:
      'Inspect the sequence of operations in app/transfer.py to find why sender funds are deducted before the destination account is validated.',
    expectedBehavior:
      'All validation checks on sender and receiver accounts must succeed before any account balances are modified or debit records posted.',
    constraints: [
      'Total capital across all accounts plus fees must strictly equal initial system capital.',
      'Transfers to frozen or non-existent accounts must fail without deducting any money or fees.',
      'Sender accounts must possess sufficient funds to cover the transfer amount plus the transaction fee.',
    ],
    successCriteria:
      'The unit tests in tests/test_transfer.py pass, and the reconciliation audit in app/main.py outputs AUDIT PASS: System balanced with zero discrepancy.',
  },
  expectedInvariants: [
    'Must keep total system money conserved across all accounts and fee pools.',
    'Must validate recipient eligibility before debiting funds from the sender account.',
    'Must never deduct sender funds if the transfer operation cannot complete.',
  ],
  expectedBehaviour: [
    'Must keep total system money conserved across all accounts and fee pools.',
    'Must validate recipient eligibility before debiting funds from the sender account.',
    'Must never deduct sender funds if the transfer operation cannot complete.',
  ],
  bug: {
    file: 'app/transfer.py',
    line: 30,
  },
  fix: {
    file: 'app/transfer.py',
    line: 30,
    newText: `        receiver = self.accounts.get(to_id)
        if not receiver or receiver.status != AccountStatus.ACTIVE:
            raise TransferError(f"Receiver account {to_id} is inactive or does not exist")

        total_deduction = amount + self.fee
        if sender.balance < total_deduction:
            raise TransferError("Insufficient funds for transfer and fee")

        # Mutate balances and post entries only after all accounts are verified
        sender.balance -= total_deduction
        self.ledger.record_debit(from_id, total_deduction)`,
  },
  decoy: {
    text: 'Check the audit discrepancy formula in app/ledger.py line 40; the fee pool calculation might be subtracting total_fees twice.',
    pointsTo: 'app/ledger.py',
  },
  assistantHints: [],
  hints: [
    'Follow what happens to Alice balance when the transfer to Charlie raises an exception.',
    'Notice whether the sender balance is modified before or after checking if Charlie account is active.',
    'In app/transfer.py, sender.balance is debited before checking if receiver is valid or frozen, leaking funds on aborted transfers.',
  ],
  explainRubric: [
    'Identifies that sender funds and ledger debits are committed before receiver validation.',
    'Explains that when receiver validation fails with TransferError, the deduction is never rolled back.',
    'Recommends moving all validation checks before state mutation or wrapping in a rollback mechanism.',
  ],
  files: [
    { path: 'app/models.py', language: 'python', content: modelsPy },
    { path: 'app/accounts.py', language: 'python', content: accountsPy },
    { path: 'app/ledger.py', language: 'python', content: ledgerPy },
    { path: 'app/transfer.py', language: 'python', content: buggyTransferPy },
    { path: 'app/main.py', language: 'python', content: mainPy },
    { path: 'tests/test_transfer.py', language: 'python', content: testTransferPy },
    { path: 'tests/test_cart.py', language: 'python', content: testTransferPy },
  ],
  fixedFile: {
    path: 'app/transfer.py',
    content: fixedTransferPy,
  },
  expectedOutput: {
    buggy: `Initial check:
Balanced: True (Accounts: $1000, Capital: $1000)

Tx 1: Alice transfers $100 to Bob (fee $5)
Alice balance: $495, Bob balance: $500

Tx 2: Alice attempts $200 transfer to Charlie (FROZEN account)
Caught expected failure: Receiver account acc_charlie is inactive or does not exist

Post-transactions reconciliation:
AUDIT FAIL: Unbalanced ledger! Discrepancy: $-205`,
    fixed: `Initial check:
Balanced: True (Accounts: $1000, Capital: $1000)

Tx 1: Alice transfers $100 to Bob (fee $5)
Alice balance: $495, Bob balance: $500

Tx 2: Alice attempts $200 transfer to Charlie (FROZEN account)
Caught expected failure: Receiver account acc_charlie is inactive or does not exist

Post-transactions reconciliation:
AUDIT PASS: System balanced. Accounts: $995, Fees: $5`,
  },
  modelExplanation:
    'In app/transfer.py, the transfer method mutates sender.balance and records a ledger debit before validating whether the recipient account is active. When the recipient is frozen, an exception is raised, but the deduction from the sender is never refunded. This destroys the fundamental accounting invariant that total system capital must be conserved.',
};
