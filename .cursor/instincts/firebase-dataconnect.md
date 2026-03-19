# Instinct: Firebase Data Connect (GQL)

## Context
This project uses Firebase Data Connect for the backend. The source of truth is in `/dataconnect/`.

## Constraints
- **NEVER** edit files inside `/mobile-app/lib/dataconnect-generated/` or any folder marked as generated.
- **ALWAYS** edit the `.gql` files in `/dataconnect/schema/` or `/dataconnect/operations/`.
- If a schema change is made, use the **Shell MCP** to run `firebase dataconnect:sql:generate` to update the SDK.
- **Data Types**: All book IDs are `UUID` types in the Postgres layer; ensure TypeScript interfaces reflect this.
