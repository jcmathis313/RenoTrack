# JobTread API Exploration

## Overview

The JobTread API is a project management API that uses **Pave query language**, which is similar to GraphQL. The API provides an interactive documentation and explorer interface at https://app.jobtread.com/docs.

## Key Features

### 1. Query Language: Pave
- Similar to GraphQL
- Allows you to query specific fields and relationships
- Supports nested queries and field selection

### 2. Authentication
- Uses **grant keys** for authorization
- Grant keys are passed as a global input parameter: `grantKey nullable string`
- Additional authentication options:
  - `timeZone nullable timeZone`: Set the IANA time zone for time-zone-aware data
  - `viaUserId nullable jobtreadId`: Restrict results to a specific user scope

### 3. API Endpoint
- Base URL: `http://api.jobtread.com/t/`
- The API appears to use a single endpoint with query-based operations

### 4. Webhooks
- Supports webhooks for real-time updates
- Webhooks send POST requests to user-defined URLs
- Examples of webhook events include:
  - File uploads
  - Task updates
  - Customer creation
- Configuration available on the "Webhooks page"

## API Explorer Interface

The documentation page provides a three-pane interface:

1. **Documentation Pane (Left)**: Contains overview, getting started guides, and examples
2. **Query Pane (Center)**: Interactive query editor where you can write and execute Pave queries
3. **Schema Pane (Right)**: Interactive schema explorer showing:
   - Available API objects and operations
   - Input parameters
   - Field types and relationships
   - Search functionality to find specific objects

## Getting Started

### Finding Your Organization ID

To get started, you need to find your organization ID. Use this query:

```yaml
currentGrant:
  user:
    id: {}
```

### Example Query Structure

Queries start from the `schema.root` object. Basic query structure:

```yaml
version: {}
```

## Global Input Parameters

- `grantKey` (nullable string): The grant key to use to authorize this request
- `timeZone` (nullable timeZone): Set the IANA time zone to use when handling time-zone-aware data
- `viaUserId` (nullable jobtreadId): Restrict results to a specific user scope

## Available Operations

Based on the schema explorer, the API includes operations such as:

- `account({ id }) nullable account` - Retrieve account information
- `can({ action, id }) boolean` - Check permissions
- `cancelWorkflowRun({ id }) root` - Cancel workflow runs
- `closeNegativePayable({ id, description, paidAt, type }) root` - Close negative payables

*Note: The full list of available operations would require further exploration of the schema explorer.*

## Query Format

The API supports both YAML and JSON formats for queries. You can toggle between formats in the API explorer interface.

## Additional Resources

- **Pave Documentation**: Link available in the documentation (likely explains the query language syntax)
- **Webhook Configuration**: Separate page for setting up webhooks
- **Grant Management**: Page for managing API access grants

## Notes

- The API appears to be designed for authenticated users/organizations
- The interactive explorer allows testing queries without writing code
- Queries can be saved for later use
- The schema is searchable to find specific objects and operations

## Next Steps for Integration

1. Obtain a grant key from JobTread (likely through account settings or grant management page)
2. Explore the schema to identify the specific objects and operations needed
3. Use the API explorer to test queries before implementing in code
4. Set up webhooks if real-time updates are needed
5. Implement the Pave query language client in your application

---

*This exploration was conducted on December 29, 2025. The API documentation is available at https://app.jobtread.com/docs*

