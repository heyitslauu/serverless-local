# IMPORT SCHEMA

```bash
aws dynamodb create-table --cli-input-json file://src/db/schema.json --endpoint-url http://localhost:8000
```

# CREATE TABLE

```bash
aws dynamodb create-table --table-name EmpowerexFinance --attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 --endpoint-url http://localhost:8000
```

# DELETE TABLE

```bash
aws dynamodb delete-table --table-name EmpowerexFinance --endpoint-url http://localhost:8000
```

# SCAN TABLE

```bash
aws dynamodb scan --table-name EmpowerexFinance --region ap-southeast-1 --endpoint-url http://localhost:8000
```

# VIEW TABLES

```bash
aws dynamodb list-tables --endpoint-url http://localhost:8000
```
