# 2. Prefer REST standard over RPC

Date: 2025-06-19

## Status

Accepted

## Context

The team discussed adopting an RPC-style API instead of a RESTful one. Encore defaults to an RPC-like pattern if no explicit path and method are provided in the API definition.

We had been using POST methods for several data retrieval endpoints due to the need to send complex filters as JSON objects. Something that is not feasible with standard GET query parameters. However, this pattern violates REST conventions.

One proposal was to embrace a full RPC-style API, using POST for all operations to maintain consistency and avoid ambiguity. However, this approach sacrifices REST semantics and can lead to confusion when integrating with other systems.

This decision is especially important because our public API will be used extensively by external clients as well as our own frontend. Adhering to REST standards improves clarity, predictability, and compatibility with widely used tools and conventions. It also helps us retain control and reduce ambiguity in endpoint behavior.

## Decision

- We will adhere to REST standards wherever possible.
- Only retrieval operations that require complex filters will break REST conventions by using POST instead of GET.
- To avoid route collisions (e.g., POST /resource used for both creation and filtering), we will follow a new explicit naming convention for paths.

### Endpoint Conventions

| Operation        | HTTP Method | Endpoint Path           | Notes                                          |
| ---------------- | ----------- | ----------------------- | ---------------------------------------------- |
| Create           | POST        | /[collection]/create    |                                                |
| Update           | PUT         | /[collection]/id/update | `id` is the resource identifier                |
| Get One          | GET         | /[collection]/id/       | REST-compliant retrieval                       |
| List (paginated) | POST        | /[collection]/list      | Accepts complex filters in request body        |
| List (all)       | POST        | /[collection]/list/all  | No pagination, accepts filters in request body |
| Delete           | DELETE      | /[collection]/id/delete |                                                |

## Consequences

- ✅ Promotes clarity and consistency for both internal and external consumers.
- ✅ Keeps API intent explicit and aligned with widely understood REST conventions.
- ❗ Retrieval operations with complex filters will break REST by using POST.
- ❗ Requires clear documentation and discipline in naming to avoid confusion.
- ❗ Developers must be aware of the exception cases and follow the standard strictly.
