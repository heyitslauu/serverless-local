# Serverless TypeScript DynamoDB API

A simple REST API built with the Serverless Framework, TypeScript, AWS Lambda, and DynamoDB.

---

## 🚀 Features

- Create, Read, and List API
- Written in TypeScript
- DynamoDB for database
- Local development support with `serverless-offline`

---

## 🛠️ Technologies (Currently Used)

- Node.js
- TypeScript
- AWS Lambda
- DynamoDB
- Serverless Framework
- serverless-offline
- uuid

---

## 📦 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/heyitslauu/serverless-local.git
cd your-repo-name
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a .env file in the root of your project (optional but recommended for local/offline dev):

```bash
DYNAMODB_TABLE_NAME=SampleTable
```

`Alternatively, ensure your serverless.yml has the correct DYNAMODB_TABLE_NAME value under environment.`

### 4. Start Local DynamoDB

In this repository, we will be using Docker Container. Run:

```bash
docker-compose up -d
```

Double check that container is running properly

### 5. Start the Offline Server

```bash
sls offline start
```

Developer must already have a `Serverless Framework Account` registered since this script with authenticate using the key.

## 📁 Project Structure

This project follows a modular and organized folder structure to keep responsibilities separated and maintainable.

```.
├── src
│ ├── api
│ │ └── posts
│ │ ├── createPost.ts # Lambda handler for creating a new post
│ │ ├── getPost.ts # Lambda handler for retrieving a single post by ID
│ │ └── getAllPosts.ts # Lambda handler for retrieving all posts
│ ├── services
│ │ └── postService.ts # Core logic interacting with DynamoDB (create, read, list)
│ ├── types
│ │ └── post.interface.ts # TypeScript interfaces for post data shape
│ └── utils
│ └── dbClient.ts # Shared DynamoDB client configuration
├── serverless.yml # Serverless Framework configuration (functions, resources, plugins)
├── tsconfig.json # TypeScript configuration
└── package.json # Project dependencies and scripts
```

---

## 🧱 Folder Purpose

### `src/api/**/`

Contains Lambda handlers for all post-related operations. Each file exports a handler function that responds to specific HTTP events defined in `serverless.yml`.

### `src/services/`

Holds core business logic and data layer functions that interface with DynamoDB. These functions are reused by the Lambda handlers.

### `src/types/`

Contains shared TypeScript interfaces or types. Centralizing types improves consistency and type safety across the codebase.

### `src/utils/`

Utility functions or shared configurations. In this case, `dbClient.ts` sets up and exports a configured DynamoDB client instance for use across services.

---

## 📘 Notes

- This structure is scalable — you can add more domains (e.g., `users`, `comments`) under `src/api/` and `src/services/`.
- All DynamoDB interaction is encapsulated in the service layer for better separation of concerns.
- TypeScript helps maintain strong types and reduce runtime errors.

---

Let me know if you want this added to your repo or need a more expanded version with examples per file.
