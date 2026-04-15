# Personal Expense & Budget Tracker - Tech Stack and Architecture

This document summarizes the technology stack, implementation strategy, and major tools/patterns used in the project.

## 1) Project Overview

- **Application type:** Mobile-first expense and budget tracker
- **Frontend:** React Native app (Expo)
- **Backend:** Node.js + Express API
- **Database:** AWS DynamoDB
- **Authentication:** AWS Cognito (via Amplify in app, JWT verification in API)

---

## 2) Frontend Stack (MyApp)

### Core Technologies

- **React Native** (`react-native`)
- **Expo** (`expo`, `expo-dev-client`)
- **React** (`react`)
- **TypeScript** (`typescript`)

### Navigation and UI

- **React Navigation**
  - `@react-navigation/native`
  - `@react-navigation/native-stack`
- **Safe area support:** `react-native-safe-area-context`
- **Custom UI components/screens**
  - Auth: Login, Signup, OTP verification
  - Main: Dashboard, Add Expense, Profile, Comparison, Settings, Help & Support
  - Reusable sticky footer navigation

### Auth and Session (Frontend)

- **AWS Amplify Auth** (`aws-amplify`, `@aws-amplify/auth`)
  - Signup, OTP confirm, sign-in, sign-out
- **Token handling strategy**
  - Cognito `idToken` saved in AsyncStorage after successful sign-in
  - Shared helper returns auth headers for every API call:
    - `Authorization: Bearer <idToken>`
- **Storage package:** `@react-native-async-storage/async-storage`

### Frontend Data/Service Layer

- API-first services:
  - `src/services/userProfile.ts`
  - `src/services/expenseStorage.ts`
- Shared auth helper:
  - `src/services/authSession.ts`
- **Pattern used:** screen -> service -> API

### Frontend Strategy / Patterns Used

- **Progressive hydration on Profile screen**
  - Show Cognito user info first
  - Then try backend profile sync data
- **Guarded onboarding/setup flow**
  - User lands on `Profile` first after login
  - App blocks navigation until `Monthly Budget` and `Savings Goal` are saved
  - Route guard hook enforces this behavior
- **Componentized UI**
  - Reusable `AppFooter`
  - Screen-based feature boundaries

---

## 3) Backend Stack (api)

### Core Technologies

- **Node.js** (project configured for Node 20+)
- **Express.js** (`express`)
- **TypeScript** (`typescript`, `ts-node`, `nodemon`)

### Database and Cloud

- **AWS SDK v2** (`aws-sdk`)
- **DynamoDB** tables used:
  - Expenses table
  - Users table

### Validation, API Docs, Middleware

- **Validation:** `joi`
- **Swagger/OpenAPI docs:**
  - `swagger-jsdoc`
  - `swagger-ui-express`
  - Docs available at `/docs`
- **CORS:** `cors`
- **Environment config:** `dotenv`
- **Custom middleware examples:**
  - request logger
  - request validation
  - JWT auth verification

### Authentication (Backend)

- **JWT verification:** `aws-jwt-verify`
- API verifies Cognito-issued ID token from `Authorization` header
- Protected routes ensure:
  - token is valid
  - token user (`sub`) matches requested `userId`

### Backend Structure (High Level)

- `server.ts` - app bootstrap, middleware registration, routes, docs
- `src/routes/*` - route definitions
- `src/controllers/*` - HTTP request handlers
- `src/services/*` - business/data access logic
- `src/models/*` - data shape/normalization
- `src/validators/*` - Joi schemas
- `src/middlewares/*` - reusable middleware

---

## 4) Data Model Strategy

### User Profile (Users Table)

- Core fields:
  - `userId`, `email`, `name`, `phone`
  - `monthlyBudget`, `savingsGoal`
  - `setupCompleted`
  - timestamps
- Used to control mandatory setup gating and personalized finance values

### Expense Model (Expenses Table)

- Includes: `id`, `userId`, `title`, `amount`, `category`, `date`, etc.
- Sort-key uniqueness handled to prevent overwrite collisions

---

## 5) Security and Access Strategy

- **Frontend**
  - Cognito handles sign-up/sign-in
  - ID token persisted locally for API access
- **Backend**
  - Every protected endpoint checks bearer token
  - User-level authorization check prevents cross-user data access
- **Configuration**
  - API requires Cognito env variables (user pool + client id)
  - App reads runtime config from Expo public env variables

---

## 6) Development Tooling

### Frontend

- Expo CLI workflow
- ESLint for linting
- TypeScript type checks

### Backend

- `nodemon` + `ts-node` for dev runtime
- TypeScript compile support
- Swagger docs for quick endpoint testing

---

## 7) API and App Interaction Flow (Simplified)

1. User signs in with Cognito in mobile app.
2. App stores Cognito `idToken`.
3. Services attach token in `Authorization` header for API calls.
4. App renders personalized profile, budget, savings goal, and expenses.


