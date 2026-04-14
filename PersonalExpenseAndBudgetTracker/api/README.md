# Expense API (Node.js 20 + TypeScript)

Basic API to save and fetch expenses in DynamoDB using `AWS.DynamoDB.DocumentClient`.

## 1) Install and run

Requires **Node.js 20+** (for `tsc` and runtime).

```bash
cd api
npm install
cp .env.example .env
npm run dev
```

Development uses `ts-node` + `nodemon`. Production build:

```bash
npm run build
npm start
```

## 2) Required DynamoDB table

Use table name from `DYNAMODB_TABLE_NAME` with:

- Partition key: `userId` (String)
- Sort key: `id` (String)

## 3) Endpoints

- `GET /health`
- `GET /docs` (Swagger UI)
- `GET /docs.json` (OpenAPI JSON)
- `GET /api/expenses?userId=demo-user`
- `POST /api/expenses`
- `GET /api/users/:userId`
- `POST /api/users`

### POST body

```json
{
  "id": "1712660000-12345",
  "title": "Groceries",
  "amount": 1200,
  "category": "Food",
  "date": "2026-04-09T10:00:00.000Z",
  "notes": "Weekly shopping",
  "userId": "demo-user"
}
```
