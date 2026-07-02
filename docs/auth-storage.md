# Authentication Storage

DeployBoard authentication uses the `deployboard-users` DynamoDB table in
production.

- Partition key: `username`
- Stored fields: `id`, `username`, `password_hash`, `created_at`

The username partition key provides direct lookups during login and enforces
uniqueness through conditional writes. Passwords are stored only as secure
hashes.

Monitor ownership is intentionally outside this authentication foundation. The
next multi-user persistence task will add user ownership through these v2
tables:

- `deployboard-monitors-v2`
- `deployboard-checks-v2`
- `deployboard-incidents-v2`

`JWT_SECRET_KEY` must be configured outside local development. The optional
`JWT_ALGORITHM` and `JWT_EXPIRE_MINUTES` settings default to `HS256` and `1440`.
