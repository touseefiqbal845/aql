# AQL: A Declarative Query Language for Unified Discovery and Execution of Heterogeneous AI Capabilities

**Touseef Iqbal**

Research manuscript - high-level approach and evaluation protocol | Revised 17 November 2026

Manuscript status: A limited local prototype is available. The broader design, reliability policies, and use cases below are proposed future work; comparative experimental evaluation remains pending. No empirical performance or productivity claims are made.

## Abstract

The proliferation of AI agents, tool servers, and web services creates interoperability challenges when applications must discover, select, and compose capabilities exposed through heterogeneous protocols. The Model Context Protocol (MCP) standardizes tool-oriented interactions, Agent2Agent (A2A) supports agent communication and task lifecycles, and HTTP APIs expose diverse application operations. This paper proposes Agent Query Language (AQL), a declarative language and execution architecture for protocol-independent capability discovery and composition. The proposed design includes a typed capability representation, an intermediate representation, a registry, a dependency-aware planner, and protocol adapters. AQL explicitly models input/output contracts, authorization, side effects, and asynchronous lifecycles. We present preliminary syntax and operational rules, identify safety invariants, and specify a reproducible evaluation against direct SDK integration and workflow orchestration baselines. The central research question is whether declarative capability composition can improve developer productivity and provider portability without unacceptable runtime overhead or semantic loss. The paper describes a research agenda, not experimentally verified results.

Keywords: declarative programming; MCP; A2A; REST; agent interoperability; capability types; workflow orchestration.

## 1. Introduction

Modern applications may need to invoke a tool discovered through MCP, delegate an analysis task to an A2A agent, and execute a side-effecting operation through a REST endpoint. These interactions differ in discovery, invocation, state management, authentication, and failure handling. Application developers often implement bespoke adapters and orchestration logic for each combination. AQL investigates whether a shared declarative representation can reduce this duplication while preserving essential differences between protocols.

AQL does not replace MCP, A2A, OpenAPI, or HTTP. It sits above them as a compilation and execution layer. The hypothesis is not that JSON formats are incompatible; rather, similarly named operations may differ in meaning, contracts, permissions, effects, and lifecycle. AQL therefore requires explicit capability definitions and validation, not merely automatic name matching.

## 2. Background and related work

MCP: The Model Context Protocol specifies interfaces for discovering and calling tools and for other context-oriented interactions. AQL can import tool metadata and invoke tools through a conforming client [1].

A2A: Agent2Agent provides agent discovery and mechanisms for messaging and managing tasks, including asynchronous execution. AQL adapters must preserve task identity and status rather than treating every agent invocation as a synchronous function call [2].

OpenAPI and HTTP: OpenAPI describes HTTP operations and schemas, but descriptions do not by themselves establish that two endpoints are semantically interchangeable [3].

Declarative orchestration: Workflow engines, DAG schedulers, GraphQL, and federated query systems demonstrate established approaches to declarative composition, execution planning, and heterogeneous access [4-6]. The novelty of AQL must be evaluated against these systems and against current agent-specific DSLs in a systematic literature review. No first-of-its-kind claim is made here.

## 3. Problem statement

Let P be a set of providers exposing operations O through heterogeneous protocols. A user specifies a workflow W over canonical capability identifiers. The engine must select implementations, map arguments and outputs, enforce policy, and execute W with well-defined failure semantics. A correct translation must preserve relevant observable behavior: required inputs, outputs, authorization constraints, side effects, and task completion state.

The primary challenges are (i) semantic equivalence of capabilities, (ii) type and schema compatibility, (iii) policy enforcement across trust boundaries, (iv) asynchronous and partial failure handling, (v) safe retries and idempotency, and (vi) evidence and provenance.

## 4. AQL language and capability model

## 4.1 Illustrative syntax

```
LET invoices = INVOKE 'invoice.search'
  WITH customer_id = 'C123';
LET analysis = INVOKE 'invoice.analyze'
  WITH invoices = invoices.results;
INVOKE 'email.send'
  WITH recipient = 'customer@example.com',
       body = analysis.summary
  REQUIRE APPROVAL;
RETURN analysis;
```

The syntax is a proposed DSL, not a recognized industry standard. LET binds invocation results; INVOKE resolves a canonical capability; WITH supplies typed arguments; REQUIRE APPROVAL marks a policy-gated side effect; RETURN selects the workflow output.

## 4.2 Capability abstraction

Define a capability as C = (I, O, E, P, L, V), where I is an input contract, O an output contract, E an effect classification, P a permission and approval policy, L an execution lifecycle, and V a versioned provider binding. E may distinguish read-only, idempotent write, and non-idempotent write. L may distinguish immediate result, asynchronous task, and streaming operation. A registry entry additionally records provider identity, authentication mechanism, and provenance of imported metadata.

Composition of C1 followed by C2 is permitted only if the projected output of C1 is compatible with the required input of C2, authorization policies are satisfiable, and the execution engine supports the required lifecycle transitions. Type compatibility alone does not prove semantic equivalence; mappings of units, business meaning, and side effects require explicit declarations or review.

## 4.3 Simplified grammar

```
program     := statement* RETURN expression ';'
statement   := LET ident '=' invoke ';' | invoke ';'
invoke      := INVOKE string WITH argument_list approval?
approval    := REQUIRE APPROVAL
argument_list := ident '=' expression (',' ident '=' expression)*
expression  := string | number | ident ('.' ident)*
```

A production grammar would add structured literals, escaping, static types, error recovery, control flow, and version negotiation. This limited grammar is sufficient for a first executable vertical slice.

## 5. Architecture

The proposed pipeline is: source query  ->  lexer/parser  ->  typed AST  ->  capability resolver  ->  policy/type validator  ->  dependency planner  ->  runtime  ->  MCP/A2A/REST adapters  ->  normalized result envelope. The registry ingests MCP tool listings, A2A Agent Cards, and OpenAPI documents. Importers preserve source descriptions and version information. Explicit canonical mappings connect protocol-specific operations to AQL capability identifiers.

## 5.1 Execution example

First, invoice.search resolves to an MCP tool and returns normalized invoice records. Second, invoice.analyze resolves to an A2A agent; the runtime submits a message and waits for the relevant task terminal state, respecting timeouts. Third, email.send resolves to an HTTP operation. The runtime freezes the exact recipient and payload and requests authorization. If approved, it sends the HTTP request; otherwise, no email side effect occurs. Finally, RETURN emits the analysis and an execution-status record.

## 5.2 Result and provenance

```
{
  "invocation_id": "inv-001",
  "capability": "invoice.search",
  "provider": "accounting-mcp",
  "protocol": "mcp",
  "status": "completed",
  "output": {"results": []},
  "duration_ms": 12
}
```

This example is illustrative, not a measured invocation. Results should distinguish transport success, task completion, and semantic correctness. Provenance may include provider identifiers, timestamps, versions, policy decisions, and sanitized trace references; it should not expose credentials or sensitive payloads.

## 6. Safety and correctness properties

Authorization: Every invocation must pass provider-specific authentication and local authorization policy. Discovery does not grant permission. Approval: Approval is bound to a specific payload, identity, and operation, and expires if any material element changes. Idempotency: Non-idempotent writes must not be retried automatically without explicit idempotency support. Isolation: Credentials are scoped per provider, and untrusted tool outputs cannot alter executable plans without validation. Lifecycle: Asynchronous A2A tasks require explicit pending, completed, failed, and canceled handling. Auditability: A trace records decisions without asserting that a completed execution produced a correct business answer.

## 7. Prototype status and implementation plan

The current repository contains a TypeScript/Node.js CLI, Chevrotain parser, Ajv schema validation, a manually configured capability registry, dependency recording, sequential execution, and MCP/A2A/REST adapters. One local invoice workflow connects all three protocols and requests in-process approval before a simulated email. No real email is delivered. The runtime stops on the first unsuccessful operation and performs no automatic retries.

This vertical slice demonstrates a narrow integration path, not the full architecture proposed here. Registry ingestion, authenticated provider identity, durable execution, comprehensive lifecycle handling, and the reliability policies in Section 10 remain future work. MCP connection and A2A discovery are not completely bounded by timeouts. A2A task-polling branches require independent task-producing-agent and conformance testing. The repository specification defines the implemented language subset; the grammar and result envelope in this manuscript are illustrative.

## 8. Experimental evaluation methodology

## 8.1 Research questions

RQ1: What percentage of representative MCP, A2A, and OpenAPI operations can AQL express without custom escape hatches? RQ2: Does AQL reduce implementation time and integration code relative to direct SDK usage? RQ3: How often can workflows switch providers without query changes? RQ4: What latency and resource overhead does the engine add? RQ5: Does AQL enforce approval and effect policies under faults and adversarial inputs?

## 8.2 Baselines and workloads

Compare (B1) direct SDK/client integration, (B2) an established workflow orchestrator configured with protocol adapters, and (B3) AQL. Use identical underlying services, authentication assumptions, payload sizes, and hardware. Workloads should include sequential pipelines, asynchronous tasks, parallel read-only calls, provider substitution, schema mismatches, unavailable services, and write operations requiring approval. Proposed registry scales are 3, 30, 300, and 1,000 capabilities; these are experimental settings, not observed results.

## 8.3 Metrics and analysis

Measure developer task completion time, integration LOC, implementation defects, percentage of portable workflows, parse/plan overhead, p50/p95/p99 end-to-end latency, CPU/memory use, task completion rate, policy violations, and error-classification accuracy. Report repetitions, variance, confidence intervals, and environment details. For developer studies, counterbalance task order and disclose participants' familiarity with each approach. Publish fixture services, workloads, scripts, and raw anonymized measurements.

## 8.4 Threats to validity

Small synthetic workloads may not represent enterprise systems; manually curated capability mappings may hide semantic complexity; comparing against poorly optimized baselines can exaggerate gains; and latency results depend on remote service behavior. Separate adapter overhead from network and provider latency. Test both success and failure paths.

## 9. Limitations and open questions

AQL cannot guarantee that two capabilities with similar descriptions have equivalent business meaning. JSON Schema cannot capture every domain constraint. External authorization remains provider-specific. Asynchronous agents may produce nondeterministic outputs, and retries may duplicate effects. Capability registry freshness, schema evolution, privacy-preserving provenance, streaming semantics, and multi-tenant isolation remain open design challenges. The initial prototype should explicitly reject unsupported operations rather than silently approximate them.

## 10. Planned reliability model and use cases

This section presents a high-level approach for upcoming work. It is a design agenda, not a delivery commitment, implemented feature list, or validated guarantee. Concrete syntax, defaults, and protocol-specific behavior will require specification and testing.

### 10.1 Failure classification and workflow outcomes

Proposed failure categories include invalid query or schema, missing capability, authentication failure, authorization or approval denial, rate limiting, transient transport failure, provider rejection, task failure, cancellation, deadline expiry, and unknown remote outcome. A completed transport exchange does not establish business correctness. Each operation should preserve its provider error and task identity alongside a normalized category and an explicit record of whether side effects may have occurred.

The default should remain stop-on-failure. Future workflows may explicitly select partial-result collection, skipping independent branches, or a reviewed fallback. Downstream steps must not receive missing outputs as successful values. Invalid inputs, denied approval, and policy failures should fail without automatic retry.

### 10.2 Bounded retries and idempotency

For retryable reads and writes with documented idempotency support, explore bounded exponential backoff with jitter, maximum attempts, an overall deadline, and provider retry guidance where available. Attempt limits must prevent retry storms. Preserve separate attempt records under a single logical invocation identifier.

A connection loss or timeout after submission may leave a write's outcome unknown. Do not automatically resend a non-idempotent action. Where supported, persist an idempotency key across attempts and query provider status before retrying. Otherwise request reconciliation or human review. The same arguments alone do not make a write safe to repeat. Approval must remain valid for the same reviewed operation, provider binding, and payload; material changes require new approval.

### 10.3 Deadlines, cancellation, and asynchronous tasks

Plan separate discovery, connection, execution, and whole-workflow deadlines. Propagate cancellation where each protocol supports it, distinguish local abandonment from confirmed remote cancellation, and record late or ambiguous outcomes. Polling should use bounded intervals and stop at a deadline. Persist provider task identifiers so a future durable runner can reconnect rather than submit duplicate work.

Streaming support would require ordering rules, backpressure, partial-output semantics, disconnect recovery, and validation of final completion. Streaming and durable task resumption are outside the current prototype.

### 10.4 Recovery, fallback, and compensation

Explore durable checkpoints and restart recovery without claiming exactly-once execution across arbitrary services. A checkpoint should preserve resolved inputs, approval state, attempt history, and external operation IDs while protecting sensitive data. Recovery must reconcile pending writes before continuing.

Provider fallback should require reviewed semantic compatibility, schema and unit compatibility, and valid authorization. A new provider identity or changed payload requires renewed approval where applicable. Circuit breakers and concurrency limits may isolate repeatedly failing services. Multi-step writes may use explicit compensation actions with their own permissions and approval; compensation can itself fail and does not guarantee atomic rollback.

### 10.5 Candidate use cases

- Invoice operations: search invoices, analyze discrepancies, draft a customer message, and approve sending. Exercise duplicate-send prevention and uncertain delivery outcomes.
- Customer support: retrieve account context, delegate case analysis, propose a ticket update, and obtain approval for a refund or account change. Exercise authorization and escalation on incomplete evidence.
- Document research: retrieve documents from tools and APIs, delegate synthesis, and return source-linked findings. Exercise partial results, provenance, and conflicting information.
- Incident response: collect telemetry, request agent diagnosis, and prepare an approved remediation action. Exercise deadlines, cancellation, unavailable providers, and compensation failure.
- Inventory and fulfillment: query stock, compare alternatives, and approve a reservation or order. Exercise stale reads, idempotency, concurrent updates, and reconciliation.
- Human review workflows: pause for approval, resume after review, or expire an authorization request. Exercise durable state, changed payloads, identity binding, and cancellation during review.

These scenarios are proposed evaluation workloads. The repository currently implements only the local invoice demonstration; domain-specific business rules and real integrations remain to be developed.

### 10.6 Milestones and acceptance evidence

First, specify failure categories and extend fixture-driven tests for invalid outputs, rate limits, task failure, rejection, cancellation, and unknown write outcomes. Second, add bounded retry policies and idempotency-aware fixtures, proving that denied actions are never submitted and ambiguous writes are not blindly retried. Third, explore authenticated providers, durable recovery, reviewed fallback, and streaming with independent implementations.

Publish fault-injection workloads and raw measurements. Measure duplicate effects, policy violations, recovery correctness, abandoned tasks, attempt counts, and latency under faults alongside the comparative metrics in Section 8. A feature should be described as supported only after its semantics, tests, and remaining limitations are documented.

## 11. Conclusion

AQL is proposed as a declarative layer for typed discovery and composition of capabilities across MCP, A2A, and REST. Its potential contribution lies not in converting JSON formats but in defining safe composition and execution semantics across heterogeneous operations. The proposed language, capability abstraction, and evaluation protocol provide a basis for a reproducible implementation and empirical investigation. Claims of productivity gains, portability, or performance improvements require experimental validation before publication as findings.

## References and primary specifications

[1] Model Context Protocol. Official specification and documentation. https://modelcontextprotocol.io/specification

[2] Agent2Agent Protocol. Official specification and documentation. https://a2a-protocol.org/

[3] OpenAPI Initiative. OpenAPI Specification. https://spec.openapis.org/oas/latest.html

[4] GraphQL Foundation. GraphQL Specification. https://spec.graphql.org/

[5] Apache Airflow. Documentation. https://airflow.apache.org/docs/

[6] W3C. Verifiable Credentials Data Model v2.0 (relevant to provenance; not a semantic-correctness guarantee). https://www.w3.org/TR/vc-data-model-2.0/ Bibliographic note: This reference list is a starter set of authoritative specifications, not a complete systematic related-work review. Before submission, add and verify peer-reviewed literature on agent DSLs, workflow engines, federated query processing, type-and-effect systems, and protocol interoperability.
