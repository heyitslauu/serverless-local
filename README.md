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

To successfully deploy this project to AWS, ensure you have the following tools installed and configured on your machine:

### 🔧 Prerequisites

#### ✅ [Node.js](https://nodejs.org/)

Install the LTS version of Node.js (v2x.x or later is recommended).

#### ✅ [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)

Install the AWS Command Line Interface (CLI) and configure it:

```bash
aws configure --profile your-aws-profile
```

#### ✅ [Serverless](https://www.serverless.com/framework/docs/getting-started/)

Install Serverless Framework globally:

```bash
npm install -g serverless
```

Confirm it's installed:

```bash
serverless --version
```

✅ AWS Credentials

You must have valid AWS credentials configured via ~/.aws/credentials under the profile name you'll use for deployment (e.g., your-aws-profile).

### 1. Clone the Repository

```bash
git clone https://github.com/heyitslauu/serverless-local.git
cd your-repo-name
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Local DynamoDB Container

In this repository, we will be using Docker Container. Run:

```bash
docker-compose up -d
```

Double check that container is running properly

### 4. Start the Offline Server

```bash
sls offline start
```

```
⚠️ **Note:**
To run `sls offline start`, you must have:
- An access key from [Serverless](https://www.serverless.com/)
- AWS credentials (Access Key ID and Secret Access Key) configured in your environment
```

\

### 5. AWS Deployment

```bash
serverless deploy --aws-profile {aws.profile}
```

```
⚠️ Note:
Ensure that the {aws.profile} used for deployment has the necessary AWS IAM permissions. Without these, deployment may fail due to unauthorized actions when provisioning resources like Lambda, DynamoDB, or API Gateway. Please contact your AWS Administrator for these policies.
```

### ✅ Required IAM Permissions / Policies

The IAM user or role associated with your AWS profile should have access to the following actions:

#### ✅ General (required by Serverless Framework)

- `ssm:GetParameter`
- `ssm:PutParameter`
- `s3:CreateBucket`
- `s3:PutObject`
- `s3:GetObject`
- `s3:ListBucket`
- `cloudformation:*`
  - _(or specifically: `CreateStack`, `UpdateStack`, `DescribeStack_`, `DeleteStack`)\*

#### ✅ Lambda Functions

- `lambda:CreateFunction`
- `lambda:UpdateFunctionCode`
- `lambda:UpdateFunctionConfiguration`
- `lambda:InvokeFunction`
- `iam:PassRole`

#### ✅ IAM Roles (for Lambda execution)

- `iam:CreateRole`
- `iam:PutRolePolicy`
- `iam:AttachRolePolicy`
- `iam:TagRole`

#### ✅ API Gateway

- `apigateway:*`
  - _(or at least: `POST`, `GET`, `PUT`, `DELETE`, `PATCH` on `restapis`)_

#### ✅ DynamoDB

- `dynamodb:CreateTable`
- `dynamodb:DeleteTable`
- `dynamodb:PutItem`
- `dynamodb:GetItem`
- `dynamodb:Scan`
- `dynamodb:UpdateItem`
- `dynamodb:DeleteItem`

---

#### ✅ Tip

You can attach AWS-managed policies such as:

- `AmazonDynamoDBFullAccess`
- `AWSLambda_FullAccess`
- `AmazonAPIGatewayAdministrator`
- `IAMFullAccess`
- `AmazonSSMFullAccess`
- `AmazonS3FullAccess`
- `AWSCloudFormationFullAccess`

> ℹ️ For **production environments**, it's best practice to create a custom IAM policy scoped only to the exact actions and resources your app needs.

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
