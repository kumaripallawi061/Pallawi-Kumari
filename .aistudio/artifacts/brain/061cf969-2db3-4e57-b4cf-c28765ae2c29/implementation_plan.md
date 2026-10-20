# Implementation Plan: Authentication Security, Self-Service Profile Guardrails, Fee Engine & Data Sync Hardening

## 1. Executive Summary & Problem Analysis
A rigorous codebase audit revealed critical security vulnerabilities and functional defects:
1. **Authentication Bypass & Account Takeover**:
   - System Administrator login never verified passwords, granting root admin on any input.
   - Staff login fell back to the first staff member of a role, accepting demo credentials (`11111111`, `Account@123`) even after password changes.
   - Student signup check failed on reload because Firestore stripped passwords, allowing anyone with a roll number and birthdate to hijack activated accounts. Excel date serials (`38353`) prevented valid signups.
2. **Self-Service Student Fee Manipulation**:
   - Students could alter income, domicile state, hostel residence, and quota in self-service profile screens, instantly slashing their fee schedules without verification.
3. **Recurring Fee Manager & Stream Calculation**:
   - Inferred stream defaulted to `CSE` for non-matching branches, billing Civil/Electrical students CSE fees.
   - Recurring campaigns summed all active stream subjects across all semesters, billing semester 1 students for entire degree courses, and inverted `isDeactivated` status when `hasNoEndDate` was true.
4. **Report Engine & Safe String Matching**:
   - `safeMatchStrings(undefined, undefined)` returned `true`, causing unassociated records to falsely cross-match in 58 locations.
   - Stream code `EE` matched any branch containing "Engineering". Date range filters were ignored.
5. **Data Synchronization in `App.tsx`**:
   - Listeners dropped local unsaved records during remote snapshots, ignored empty snapshot events (preventing deletion sync), and re-subscribed all listeners on every session update. Active student fallback exposed `students[0]` to unauthenticated sessions.

---

## 2. Technical Decisions & Architecture Alignment (Based on User Clarifications)
- **Authentication & Persistence**: Enforce real Firebase Auth integration with secure Firestore credential synchronization. Eliminate plaintext comparisons and remove all hardcoded backdoor fallbacks.
- **Governing Fee-Impacting Profile Fields**: Sensitive fields (`annualFamilyIncome`, `quota`, `domicileState`, `hostelResident`, `sports_quota`, `physically_handicapped`) submitted by students will be marked as **`pendingProfileModifications`** (Unverified Status) and will **not** alter the authoritative student record or trigger fee reductions until approved by an authorized Accounts Officer or Administrator.
- **Admin & Staff Portal Access**: Enforce strict individual credential checks matching exact email or employee code. Strip role-based fallbacks and eliminate generic demo passwords.

---

## 3. Detailed Proposed Changes

### Phase 1: Authentication & Account Security (`LoginPortal.tsx`, `authService.ts`)
- **System Admin Login Verification**:
  - Add strict verification comparing against authenticated root admin credentials. Reject empty, mismatched, or unauthorized logins.
- **Staff Login Hardening**:
  - Remove fallback `staffUsers.find((u) => u.role === staffRole)` when email doesn't match.
  - Require exact email or employee code match. Remove persistent acceptance of `11111111` or `Account@123` once passwords are set.
  - Persist staff password updates in Firestore with proper encryption/hashing so changes survive reloads.
- **Student Activation & Signup Fixes**:
  - Guard `handleStudentVerifyForSignup` using `matched.isActivated === true` (independent of stripped password field).
  - Add Excel date serial conversion (e.g., serial 38353 to `YYYY-MM-DD`) so imported students can sign up.
  - Remove matching against guessable internal `id` (`STU-1234`), restricting verification strictly to `rollNo` or `registerNo`.
  - Trim passwords consistently across validation and storage.

### Phase 2: Student Profile Guardrails & Fee Protection (`StudentProfileSection.tsx`, `MandatoryProfileCompletionModal.tsx`)
- **Unverified Pending Status Flow**:
  - Disallow direct client-side mutation of fee-impacting fields: `annualFamilyIncome`, `domicileState`, `hostelResident`, `quota`, and custom quota fields (`sports_quota`, `physically_handicapped`).
  - When a student saves changes to these fields, package them into `student.pendingProfileModifications` with a timestamp and reason, showing an "Under Administrative Verification" notice.
  - Ensure the fee engine continues calculating fees using only verified authoritative fields until staff approves the change.
  - Validate contact information with strict regex: mobile phone (10 digits), parent phone (10 digits), and institutional/personal email format. Reject `0` or blank family income from qualifying for BPL/EWS concessions without uploaded verification documents.

### Phase 3: Recurring Fee Manager & Stream Calculation (`PermanentCampaignManager.tsx`, `campaign.ts`)
- **Stream & Subject Alignment**:
  - Replace naive `CSE` stream fallback with dynamic lookup from the student's actual `streamCode` and `branch`.
  - Filter applicable subjects strictly by the student's current `semester` and `subjectsEnrolled` rather than summing all subjects in the department.
  - Ensure consistent inclusion of lab fees across Monthly, Semester, and Annual modes.
  - Fix `isDeactivated` calculation to properly recognize active campaigns with `hasNoEndDate: true`.
  - Isolate payment links by appending campaign and due IDs (`/pay/${campaign.id}/${due.id}`).

### Phase 4: Core Helper & Report Engine Correction (`safeHelpers.ts`, `ReportGenerationEngine.tsx`)
- **Safe String Matching Bug**:
  - Update `safeMatchStrings(a, b)`: If either `a` or `b` is `null`, `undefined`, or empty string, immediately return `false`.
- **Report Engine Accuracy**:
  - Fix stream matching in `ReportGenerationEngine`: Use exact code comparison `s.streamCode === code` or word-boundary token matching to prevent `EE` from matching "Engineering" or `ME` matching "Mechanical".
  - Implement active date filtering against transaction `timestamp`.
  - Harmonize fee-status labels (`DUE` vs `PARTIAL`) to prevent overlapping counts in Excel exports.

### Phase 5: Data Synchronization & Authorization Hardening (`App.tsx`, `firestore.rules`)
- **Firestore Snapshot Stability**:
  - Update listener dependencies: decouple from `session` object recreation by listening on stable user IDs.
  - Handle empty snapshots properly so deletions propagate to the client state.
  - Prevent active student identity from falling back to `students[0]` for unauthenticated sessions.
  - Ensure staff deletion and updates persist remotely to Firestore.
- **Firestore Rules Update**:
  - Ensure student update rules enforce `affectedKeys` to prevent self-modification of `totalFee`, `paidFee`, `pendingFee`, `scholarshipWaiverPercent`, `quota`, or `hallTicketBlocked`.

---

## 4. Verification Plan
### Automated & Unit Tests
1. Run `npm test` to verify existing 68 ledger invariant and integer Paisa tests remain 100% green.
2. Add test cases in `test-fee-engine.ts` verifying:
   - `safeMatchStrings(undefined, undefined)` returns `false`.
   - Excel serial DOB conversion accurately matches `YYYY-MM-DD`.
   - Pending student profile modifications do not alter `calculateStudentFeeScheduleServer`.
3. Run `npm run lint` (`tsc --noEmit`) to verify zero TypeScript errors.
4. Run `compile_applet` to confirm successful production build.

### Manual Verification Flows
1. **Admin & Staff Login**: Attempt login with incorrect credentials, fallback role emails, and verified admin credentials to confirm strict access control.
2. **Student Signup & Verification**: Verify that accounts with Excel DOB serials can sign up, activated accounts cannot be hijacked, and guessable `STU-` IDs are rejected.
3. **Student Profile Updates**: Change income and quota in student profile; verify changes appear as "Pending Office Verification" and do not modify the net dues.
4. **Recurring Fee & Reports**: Check recurring campaign due amounts for semester-1 students; verify reports filter stream `EE` without matching every Engineering student.
