# Security Specification & Threat Model (ABAC / Zero-Trust)

## 1. Data Invariants & Access Control Policy
1. **Student Record Protection**: Sensitive student PII (caste, annual income, contact details, mobile numbers) and financial ledgers (`pendingFee`, `paidFee`, `hallTicketBlocked`) are protected. Students can only read and update their own authorized profile fields. Only verified Staff and Administrators can adjust dues or modify academic statuses.
2. **Ledger Immutability & Anti-Tampering**: Fee transactions cannot be created by unauthorized clients with forged amounts, and transactions are immutable once created (`receiptNo`, `amount`, `studentId` cannot be altered). Students cannot delete or mark arbitrary transactions as 'Success'.
3. **Privilege Escalation Prevention**: Payment provider settings (`/paymentProvider/active`), administrator roles (`/admins/*`), and staff permissions (`/staffUsers/*`) are strictly writable only by verified system administrators (`kumaripallawi061@gmail.com` or indexed admins).
4. **No Blanket Queries**: Unauthenticated users or arbitrary students cannot execute unbounded list queries across all student records or financial transactions.

---

## 2. The "Dirty Dozen" Malicious Payloads (Penetration Test Suite)

1. **Payload 1: Unauthenticated Student Ledger Wipeout**
   - Target: `PATCH /students/STU-2025-001`
   - Payload: `{"pendingFee": 0, "paidFee": 25000, "hallTicketBlocked": false}`
   - Attack: Bypasses authentication to clear college dues.
   - Expected Result: `PERMISSION_DENIED`.

2. **Payload 2: Student Fee Transaction Forgery**
   - Target: `POST /transactions/TXN-FORGED-001`
   - Payload: `{"amount": 1, "status": "Success", "receiptNo": "REC-9999", "studentId": "VICTIM-002"}`
   - Attack: Student submits a 1-rupee transaction for another student's account.
   - Expected Result: `PERMISSION_DENIED`.

3. **Payload 3: Gateway Payment Hijacking**
   - Target: `PUT /paymentProvider/active`
   - Payload: `{"providerName": "AttackerPay", "merchantKey": "evil_key", "qrVpa": "attacker@upi"}`
   - Attack: Non-admin modifies payment gateway credentials to divert college fee payments.
   - Expected Result: `PERMISSION_DENIED`.

4. **Payload 4: Identity Spoofing in Admin Index**
   - Target: `POST /admins/attacker_uid`
   - Payload: `{"email": "attacker@evil.com", "role": "SuperAdmin"}`
   - Attack: Self-elevation of privileges by inserting oneself into `/admins/`.
   - Expected Result: `PERMISSION_DENIED`.

5. **Payload 5: Student PII Data Scraping (List Query)**
   - Target: `GET /students` (as authenticated student STU-001)
   - Attack: Student runs a collection query to download names, phones, and family incomes of all 1,500 students.
   - Expected Result: `PERMISSION_DENIED`.

6. **Payload 6: Ghost Field Injection (Shadow Update)**
   - Target: `PATCH /students/STU-2025-001` (by student STU-2025-001)
   - Payload: `{"phone": "+919876543210", "__isAdmin": true, "scholarshipWaiverPercent": 100}`
   - Attack: Injecting unauthorized waiver or administrative flag during legitimate profile update.
   - Expected Result: `PERMISSION_DENIED`.

7. **Payload 7: Denial of Wallet / Oversized Payload Injection**
   - Target: `POST /helpdeskTickets/TICK-001`
   - Payload: `{"title": "Bug", "description": "<1.5 MB junk string repeating 'A'>"}`
   - Attack: Consuming quota and exhausting Firestore storage limits.
   - Expected Result: `PERMISSION_DENIED`.

8. **Payload 8: No-Dues Clearance Status Manipulation**
   - Target: `PATCH /noDuesApplications/ND-2025-001` (by applicant student)
   - Payload: `{"overallStatus": "Approved", "libraryClearance": "Approved"}`
   - Attack: Student approves their own library/hostel clearance without department signoff.
   - Expected Result: `PERMISSION_DENIED`.

9. **Payload 9: Certificate Request Fraudulent Issuance**
   - Target: `PATCH /certificateRequests/CERT-2025-001` (by student)
   - Payload: `{"status": "Issued", "verificationHash": "FAKE-GOVT-HASH-2025"}`
   - Attack: Student issues themselves an official Bonafide or TC certificate.
   - Expected Result: `PERMISSION_DENIED`.

10. **Payload 10: Cashier Ledger Record Deletion**
    - Target: `DELETE /transactions/TXN-COLLECT-101`
    - Attack: Untrusted user or rogue cashier attempts to erase cash collection logs to hide embezzlement.
    - Expected Result: `PERMISSION_DENIED`.

11. **Payload 11: Id Poisoning with Junk Unicode**
    - Target: `GET /students/../../%00$junk_bad_path`
    - Attack: Directory traversal and ID poisoning attempt.
    - Expected Result: `PERMISSION_DENIED`.

12. **Payload 12: Staff Account Password Tampering by Third Party**
    - Target: `PATCH /staffUsers/STAFF-PRINCIPAL-001`
    - Payload: `{"password": "HackedPassword123"}` (by unauthorized user)
    - Attack: Overwrite principal's login credentials.
    - Expected Result: `PERMISSION_DENIED`.
