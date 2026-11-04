# Nodd · Fast, GPU-Accelerated Minimalist API Workbench

Nodd is a fast, GPU-accelerated minimalist HTTP client and API workbench built with [GPUIX](https://github.com/gpuix).

No enterprise bloat, no sign-in walls, no background tracking. Just razor-sharp speed, calm ergonomics, and pure focus.

## Features

- **Blazing Fast HTTP Engine**: Instant execution of `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `HEAD`, and `OPTIONS`.
- **Calm Minimalist Interface**:
  - Dark graphite aesthetics with zero UI bloat.
  - Borderless frameless window with native OS modal dragging via Win32 FFI.
  - Single-line calm empty states and precise optical alignment.
- **Request Builder**:
  - URL bar with method selection and instant query parameter synchronization.
  - Key-value tables for query parameters, headers, and form data.
  - Authentication support for Bearer Token, Basic Auth, and API Key.
  - Request Body: JSON editor with formatting and validation, raw text, and URL-encoded.
- **Response Inspector**:
  - Color-coded status pills (`200 OK`, `404 Not Found`, `500 Server Error`).
  - Response duration and payload size metrics.
  - Formatted JSON response viewer with line numbers and one-click copy.
  - Response headers table.
- **Collections & History**:
  - Organize requests into collections and folders.
  - Automatically recorded chronological request history with one-click reload.
  - Sliding resizable sidebar with zero-latency drag handle.
- **Environments & Variables**:
  - Dynamic `{{variable}}` substitution in URLs, headers, and request bodies.
  - Switch between Development, Staging, and Production effortlessly.
- **Calm Settings Surface**:
  - Replaces the main surface without modal popups.
  - Configurable timeouts, SSL certificate validation, and default headers.

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl+Enter` / `Cmd+Enter` | Send Request |
| `Ctrl+S` / `Cmd+S` | Save Request |
| `Ctrl+N` / `Cmd+N` | New Request |
| `Ctrl+B` / `Cmd+B` | Toggle Sidebar |
| `,` | Open Settings |
| `Esc` | Close Settings / Modal |

## Development

```bash
# Run locally with hot reload
bun --hot app.tsx

# Run unit tests
bun test

# Type check
bun run typecheck

# Build binary
bun run build
```
