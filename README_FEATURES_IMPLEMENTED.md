# Personal Expense Tracker - Implemented Features Documentation

This document summarizes all major features and fixes implemented in this development cycle across frontend (`app`) and backend (`api`).

---

## 1) Authentication and Social Login

### 1.1 Email/Password + Email Verification Flow

Implemented robust Cognito login behavior:

- Normal login via `Auth.signIn(email, password)`.
- If account is unconfirmed:
  - Redirect to OTP confirm flow (`ConfirmOtp` with `signupConfirm` mode).
- If account is confirmed but email attribute is not verified:
  - Redirect to OTP verify flow (`ConfirmOtp` with `verifyEmail` mode).

### 1.2 Google/Facebook Social Login Wiring

Implemented social login handlers on login buttons:

- Google login trigger via Cognito Hosted UI.
- Facebook login trigger via Cognito Hosted UI (button wiring preserved).

### 1.3 Social Callback Stability Improvements

Added reliability improvements so redirect completion does not bounce users back to login:

- Hub auth event listener integration in login flow.
- App resume (`AppState`) re-check support.
- Callback finalization retry loop for delayed session readiness.

### 1.4 Federated User Handling

Federated users should not be forced through email OTP verification screen:

- Social users are allowed through login flow when session is valid.
- App startup/splash logic now treats federated users correctly.

---

## 2) API Base URL and Environment Resolution

Improved API URL handling for Expo dev/staging behavior:

- Added dynamic environment resolution for API base URL.
- Removed stale-load issues where base URL was captured once at module load.
- Added fallback behavior around Expo/dev contexts.

---

## 3) Token/User Identity Consistency Fixes

Resolved multiple auth/user-id mismatch issues with backend authorization:

- Frontend now prefers Cognito token `sub` from `Auth.currentSession()` for user ID.
- Profile and expense APIs now align with backend `verifySameUser` middleware.
- Avoids sending `google_...` username where backend expects token-sub identity.

---

## 4) Profile API Validation and Email Normalization

Resolved profile save/update failures for social users:

- Social users without mapped email could fail Joi email validation.
- Added safe email normalization fallback (`<userId>@social.local`) where needed.
- Backend profile upsert now receives valid email shape from frontend payload path.

---

## 5) Login UX Improvements

Added pending-response loader behavior on login screen:

- Loading state for email/password login.
- Loading state for social login.
- Disabled controls during pending auth.
- Full-screen activity overlay while auth flow is in progress.

---

## 6) Expense Split Enhancements (Equal + Custom)

Implemented complete custom split support from frontend to backend.

### 6.1 Backend

Updated expense split model/validation:

- `splitMethod` now supports:
  - `equal`
  - `custom`
- Shares and participants are normalized and validated.

### 6.2 Frontend Add Expense

Updated `AddExpenseScreen`:

- Split toggle (existing).
- New equal/custom split toggle.
- If custom split:
  - Per-participant amount inputs.
  - Validation for numeric share values.
  - Validation that share total equals expense amount.

---

## 7) Profile Back Navigation Fix

Resolved profile back-button edge case:

- If screen has navigation history: `goBack()`.
- If profile is root route (after reset): fallback navigate to `Dashboard`.

---

## 8) Groups Feature (Splitwise-style) - Phase 1

Implemented initial group-sharing feature set end-to-end.

### 8.1 Backend Group Domain

Added:

- Group models
- Group validators
- Group service layer
- Group controllers
- Group routes
- Route mount in server
- Group table env config

Available API routes:

- `POST /api/groups` - create group
- `GET /api/groups` - list my groups
- `POST /api/groups/:groupId/invite` - invite member by email
- `POST /api/groups/:groupId/join` - join/accept group
- `GET /api/groups/:groupId/members` - list members
- `GET /api/groups/:groupId/expenses` - list group expenses
- `POST /api/groups/:groupId/expenses` - add group expense
- `GET /api/groups/:groupId/balances` - balance summary + net entries

### 8.2 Frontend Group UX

Added screens:

- `GroupsScreen`
  - Create group
  - Join by group ID
  - List user groups
- `GroupDetailsScreen`
  - Invite members
  - View members
  - View balances summary
  - View group expenses
  - Navigate to add group expense
- `AddGroupExpenseScreen`
  - Add split expense in group
  - Equal/custom share support

Added `groupService` API client for group endpoints.

Navigation updated with:

- `Groups`
- `GroupDetails`
- `AddGroupExpense`

Footer updated to include Groups shortcut.

---

## 9) Group Balance "Pay Now" Action (UI stub)

In group balances view:

- Added `Pay Now` button for each non-zero balance row.
- Button currently logs click payload to console (as requested), including:
  - group ID
  - target member
  - amount
  - direction (`you_pay` or `they_pay_you`)

No real payment/settlement API call yet in this phase.

---

## 10) DynamoDB Setup for Groups (Current MVP Schema)

Configured environment supports these tables:

- `groups`
  - PK: `groupId` (String)
- `group_members`
  - PK: `membershipId` (String)
- `group_expenses`
  - PK: `expenseId` (String)

Current implementation uses scan/filter in some paths (MVP-friendly).  
Production optimization can be done later with GSIs.

---

## 11) Files Added

Backend:

- `api/src/models/group.model.ts`
- `api/src/validators/group.validator.ts`
- `api/src/services/group.service.ts`
- `api/src/controllers/group.controller.ts`
- `api/src/routes/group.routes.ts`

Frontend:

- `app/src/services/groupService.ts`
- `app/src/screens/GroupsScreen.tsx`
- `app/src/screens/GroupDetailsScreen.tsx`
- `app/src/screens/AddGroupExpenseScreen.tsx`

Documentation:

- `README_FEATURES_IMPLEMENTED.md` (this file)

---

## 12) Files Updated (Major)

- `api/server.ts`
- `api/src/config/aws.ts`
- `api/src/middlewares/auth.ts`
- `api/src/models/expense.model.ts`
- `api/src/validators/expense.validator.ts`
- `app/src/navigation/RootNavigation.tsx`
- `app/src/components/AppFooter.tsx`
- `app/src/types/models.ts`
- `app/src/screens/LoginScreen.tsx`
- `app/src/screens/ProfileScreen.tsx`
- `app/src/screens/AddExpenseScreen.tsx`
- `app/src/services/userProfile.ts`

---

## 13) Recommended Next Steps

1. Replace group scan-based reads with query + GSIs for scale.
2. Add real invite acceptance UX (pending invites list).
3. Add settlement APIs (`POST /settlements`) and persist pay-now actions.
4. Add debt simplification logic ("who pays whom") in balances.
5. Add role-based permissions (owner/admin/member).
6. Add tests for auth edge cases + split math + balances.

---

## 14) Quick Verification Checklist

- Email/password login works.
- Social login works and does not bounce.
- User profile save works for social users.
- Add expense works for equal and custom split.
- Groups can be created and listed.
- Members can be invited and joined.
- Group expenses can be added and listed.
- Group balances are computed and displayed.
- Pay Now button appears for non-zero balances and logs action.

