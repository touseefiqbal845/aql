# Architecture

```mermaid
flowchart TD
  A[AQL source] --> B[Lexer and parser]
  B --> C[Registry resolution and validation]
  C --> D[Dependency graph]
  D --> E[Sequential executor]
  E --> M[MCP SDK and local server]
  E --> A2[A2A SDK and local agent]
  E --> P[Approval gate]
  P --> R[OpenAPI mapped REST service]
  M --> V[Envelopes and return value]
  A2 --> V
  R --> V
```
The registry contains manually reviewed mappings; the lexicographically first provider ID wins. The fixture A2A SDK serves an Agent Card and a JSON-RPC 1.0 interface and returns a message; the client also handles terminal tasks and polls working/submitted tasks. MCP uses a child-process stdio transport and tools/list then tools/call. REST derives request and response schemas and operation ID from the included OpenAPI file. Evidence is local runtime metadata, not cryptographically authenticated provider attestation.
