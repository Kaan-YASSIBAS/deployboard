# Authentication Storage

DeployBoard authentication uses the `deployboard-users` DynamoDB table in
production.

- Partition key: `username`
- Stored fields: `id`, `username`, `password_hash`, `created_at`

The username partition key provides direct lookups during login and enforces
uniqueness through conditional writes. Passwords are stored only as secure
hashes.

## Multi-user ownership

Monitors, checks, and incidents carry the authenticated user's `user_id`.
Public API operations always scope monitor and incident access to that value.
Legacy records without `user_id` remain readable by the application models but
are not exposed through authenticated endpoints.

The planned v2 DynamoDB tables use these keys:

- `deployboard-monitors-v2`: partition key `user_id`, sort key `id`
- `deployboard-checks-v2`: partition key `monitor_id`, sort key `checked_at`;
  each item also stores `user_id` and the TTL field `expires_at`
- `deployboard-incidents-v2`: partition key `user_id`, sort key `started_at`;
  each item also stores `id`, `monitor_id`, status, monitor details, lifecycle
  timestamps, and the latest failure details

Active incidents are currently found by querying one user's incident partition
and filtering by status. If incident volume grows, a GSI with `user_id` as its
partition key and a status-prefixed sort key can make active-history queries
more selective.

`expires_at` is a Unix epoch timestamp calculated from `checked_at` using
`CHECK_HISTORY_TTL_DAYS`, which defaults to `30`. DynamoDB TTL should target
this field when the v2 check table is created.

The application defaults remain configurable through the existing table-name
environment variables. AWS resources and data migration will be handled in a
later infrastructure step.

After those resources exist, production can point `DYNAMODB_MONITORS_TABLE`,
`DYNAMODB_CHECKS_TABLE`, and `DYNAMODB_INCIDENTS_TABLE` to the corresponding v2
tables without changing application code.

`JWT_SECRET_KEY` must be configured outside local development. The optional
`JWT_ALGORITHM` and `JWT_EXPIRE_MINUTES` settings default to `HS256` and `1440`.
