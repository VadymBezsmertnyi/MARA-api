import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "MARA API",
      version: "1.0.0",
      description: "API для M.A.R.A. (Motorcycle Auto Road Assistant)",
      contact: {
        name: "MARA Support",
        email: "support@mara.com",
      },
    },
    servers: [
      {
        url: "http://localhost:5008/api",
        description: "Development server",
      },
    ],
    tags: [
      {
        name: "User",
        description: "Ендпоінти для роботи з користувачами (MARA)",
      },
      {
        name: "Workshops",
        description: "Ендпоінти для роботи з майстернями (MARA)",
      },
      {
        name: "Events",
        description: "Ендпоінти для роботи з подіями (MARA)",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT токен авторизації",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Повідомлення про помилку",
            },
            message: {
              type: "string",
              description: "Повідомлення про помилку",
            },
          },
        },
        Success: {
          type: "object",
          properties: {
            result: {
              type: "boolean",
              description: "Результат операції",
            },
            code: {
              type: "number",
              description: "Код результату",
            },
            message: {
              type: "string",
              description: "Повідомлення про успіх",
            },
          },
        },
      },
    },
  },
  apis: [
    "./src/routers/user/*.swagger.ts",
    "./src/routers/workshops/*.swagger.ts",
    "./src/routers/events/*.swagger.ts",
  ],
};

export const specs = swaggerJsdoc(options);
