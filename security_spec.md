# ROYCO MIX Firestore Security Specification

## 1. Data Invariants
1. **User Identity & Isolation**: A user may only read and write their own `/users/{userId}` profile where `userId == request.auth.uid`. Role privilege escalation (`role: 'admin'`) is prevented.
2. **Investment Integrity**: An investment document `/investments/{investmentId}` must have `userId == request.auth.uid`. A user can only purchase an investment for themselves, and cannot modify investment terms (such as `shareValueUGX`, `dailyReturnUGX`, or `contractDays`) after creation.
3. **Financial Ledger Tampering**: `/transactions/{transactionId}` records must belong to the authenticated user (`userId == request.auth.uid`). Users can create legitimate deposit/withdrawal/investment records and can only query their own ledger.
4. **Bonus Claims Anti-Duplicate**: `/bonusClaims/{claimId}` records require `userId == request.auth.uid`. Once claimed, records are immutable.
5. **PII and Financial Safety**: Account balances, phone numbers, and Mobile Money numbers cannot be enumerated or scraped by other unauthenticated or non-owner users.

## 2. The Dirty Dozen Payloads (Negative Test Cases)
1. **Unauthenticated Read on User Profile**: Attempting to read `/users/victim_123` with `request.auth == null` -> `PERMISSION_DENIED`.
2. **Cross-User Profile Theft**: User `attacker_456` attempting to read `/users/victim_123` -> `PERMISSION_DENIED`.
3. **Privilege Escalation**: User modifying their own `/users/{uid}` with `role: 'admin'` -> `PERMISSION_DENIED`.
4. **Ghost Field Injection**: User updating profile with an unauthorized ghost field like `backdoorKey: true` -> `PERMISSION_DENIED`.
5. **ID Poisoning Attack**: User injecting a 2KB non-alphanumeric string as a document ID -> `PERMISSION_DENIED`.
6. **Fake Investment Injection for Another User**: User `attacker_456` creating an investment document with `userId: 'victim_123'` -> `PERMISSION_DENIED`.
7. **Investment Yield Manipulation**: User updating their active investment to increase `dailyReturnUGX: 999999999` -> `PERMISSION_DENIED`.
8. **Transaction Forgery for Another User**: User injecting a transaction with `userId: 'victim_123'` -> `PERMISSION_DENIED`.
9. **Transaction History Deletion**: User attempting to delete financial transactions (`delete` operation) -> `PERMISSION_DENIED`.
10. **Bonus Claim Hijack**: User attempting to create a bonus claim with another user's UID -> `PERMISSION_DENIED`.
11. **Negative Value / Overflow Attack**: Creating transaction with negative or invalid type amounts -> `PERMISSION_DENIED`.
12. **Blanket Query Scraping**: Unauthenticated or cross-user querying `collection('transactions')` without `where('userId', '==', request.auth.uid)` -> `PERMISSION_DENIED`.

## 3. Test Runner Design
All write operations require authenticated identity checks, schema validation, and ownership verification.
