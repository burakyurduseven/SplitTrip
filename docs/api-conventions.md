# API conventions

## Resource paths

- API resources use the `/api/v1` prefix.
- Paths use plural nouns and lowercase kebab-case.
- Actions are represented by resource state where practical.
- Authentication endpoints live under `/api/v1/auth`.

## Payloads

- JSON property names use camelCase.
- Dates use ISO 8601 (`YYYY-MM-DD`).
- Timestamps use ISO 8601 UTC values.
- Currency uses ISO 4217 codes such as `TRY`, `EUR`, and `USD`.
- Monetary values are JSON numbers and are processed with decimal arithmetic.

## Status codes

- `200 OK`: successful read or update
- `201 Created`: a resource was created; the `Location` header identifies it
- `204 No Content`: successful operation with no response body
- `400 Bad Request`: validation or malformed input
- `401 Unauthorized`: authentication is missing or invalid
- `403 Forbidden`: the authenticated user lacks permission
- `404 Not Found`: the resource is absent or intentionally hidden
- `409 Conflict`: the request conflicts with current state

## Errors

Errors follow RFC 9457 Problem Details. Validation errors include an `errors` object keyed by field name.

```json
{
  "type": "https://splittrip.app/problems/validation-failed",
  "title": "Validation failed",
  "status": 400,
  "detail": "One or more request fields are invalid.",
  "instance": "/api/v1/auth/register",
  "errors": {
    "email": "must be a well-formed email address"
  }
}
```

## Authentication

- `POST /api/v1/auth/register` creates an account.
- `POST /api/v1/auth/login` returns a short-lived bearer access token and creates a refresh session.
- `POST /api/v1/auth/refresh` rotates the refresh session and returns a new access token.
- `DELETE /api/v1/auth/logout` revokes the current refresh session.
- `GET /api/v1/users/me` returns the profile associated with a valid access token.

Access tokens are sent in the `Authorization: Bearer <token>` header. Refresh tokens are opaque,
stored only in an `HttpOnly` and `SameSite=Strict` cookie, rotated whenever they are used, and stored
as SHA-256 hashes in the database. Production environments must enable the cookie's `Secure` flag
and provide a private Base64-encoded `JWT_SECRET` containing at least 256 bits.
