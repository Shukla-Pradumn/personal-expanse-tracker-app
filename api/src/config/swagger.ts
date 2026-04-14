import swaggerJSDoc from 'swagger-jsdoc';

export function buildSwaggerSpec(port: number) {
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Expense Budget API',
        version: '1.0.0',
        description: 'API documentation for expenses and users.',
      },
      servers: [
        {
          url: `http://localhost:${port}`,
          description: 'Local server',
        },
      ],
      tags: [
        { name: 'Health', description: 'Health checks' },
        { name: 'Expenses', description: 'Expense operations' },
        { name: 'Users', description: 'User operations' },
      ],
      components: {
        schemas: {
          Expense: {
            type: 'object',
            required: ['id', 'title', 'amount', 'category', 'date', 'userId'],
            properties: {
              id: { type: 'string', example: '1712660000-12345' },
              title: { type: 'string', example: 'Groceries' },
              amount: { type: 'number', example: 1200 },
              category: { type: 'string', example: 'Food' },
              date: { type: 'string', format: 'date-time' },
              notes: { type: 'string', example: 'Weekly shopping' },
              userId: { type: 'string', example: 'demo-user' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
          User: {
            type: 'object',
            required: ['userId', 'email', 'name'],
            properties: {
              userId: {
                type: 'string',
                example: '81b35d1a-8051-7018-7f0f-186e1be597ac',
              },
              email: {
                type: 'string',
                format: 'email',
                example: 'john@example.com',
              },
              name: { type: 'string', example: 'John Doe' },
              phone: { type: 'string', example: '+919876543210' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      paths: {
        '/health': {
          get: {
            tags: ['Health'],
            summary: 'Health check',
            responses: {
              200: {
                description: 'Service status',
              },
            },
          },
        },
        '/api/expenses': {
          get: {
            tags: ['Expenses'],
            summary: 'Get expenses by userId',
            parameters: [
              {
                in: 'query',
                name: 'userId',
                required: false,
                schema: { type: 'string', default: 'demo-user' },
              },
            ],
            responses: {
              200: { description: 'Expense list' },
              500: { description: 'Server error' },
            },
          },
          post: {
            tags: ['Expenses'],
            summary: 'Create expense',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Expense' },
                },
              },
            },
            responses: {
              201: { description: 'Expense created' },
              400: { description: 'Validation error' },
              500: { description: 'Server error' },
            },
          },
        },
        '/api/users': {
          post: {
            tags: ['Users'],
            summary: 'Create or update user',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' },
                },
              },
            },
            responses: {
              201: { description: 'User upserted' },
              400: { description: 'Validation error' },
              500: { description: 'Server error' },
            },
          },
        },
        '/api/users/{userId}': {
          get: {
            tags: ['Users'],
            summary: 'Get user by id',
            parameters: [
              {
                in: 'path',
                name: 'userId',
                required: true,
                schema: { type: 'string' },
              },
            ],
            responses: {
              200: { description: 'User found' },
              404: { description: 'User not found' },
              500: { description: 'Server error' },
            },
          },
        },
      },
    },
    apis: [] as string[],
  };

  return swaggerJSDoc(options as never);
}
