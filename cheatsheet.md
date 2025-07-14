# IMPORT SCHEMA

```bash
aws dynamodb create-table --cli-input-json file://src/db/schema.json --endpoint-url http://localhost:8000
```

# DELETE TABLE

```bash
aws dynamodb delete-table --table-name EmpowerexFinancedev --endpoint-url http://localhost:8000
```

# SCAN TABLE

```bash
aws dynamodb scan --table-name EmpowerexFinancedev --region ap-southeast-1 --endpoint-url http://localhost:8000
```

# VIEW TABLES

```bash
aws dynamodb list-tables --endpoint-url http://localhost:8000
```
