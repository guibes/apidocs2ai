# LAPIS v0.1.0

## Lightweight API Specification for Intelligent Systems

-----

### 1. Abstract

LAPIS is an API description format designed to be consumed by LLMs as context. It does not replace OpenAPI; it is a compact representation format into which an OpenAPI spec is converted when the goal is for an LLM to understand and reason about an API using as few tokens as possible.

LAPIS is not JSON, YAML, or XML. It is indentation-based semi-structured text with a function-signature syntax that LLMs process naturally, because it resembles how a human would describe an API on a whiteboard.

### 2. Goals

- **Token-minimal**: Every character must earn its place. Target: 70-80% fewer tokens than equivalent OpenAPI YAML.
- **LLM-native**: Designed around how LLMs process text, not for formal parsers.
- **Convertible**: OpenAPI 3.x -> LAPIS must be fully automatable.
- **Human-readable**: A human should be able to read and write it without documentation.
- **No semantic loss**: All information an LLM needs to reason about the API must be present.

### 3. Non-goals

- Not a runtime format. It does not replace function calling or MCP.
- Not bidirectional. Reconstructing a full OpenAPI from LAPIS is not intended.
- Does not define transport, detailed authentication, or full OAuth flows.
- Does not include extensive examples or detailed response headers.

-----

### 4. Document structure

A LAPIS document has the following sections, always in this order:

```
[meta]          # required
[types]         # optional
[ops]           # required
[webhooks]      # optional
[errors]        # optional
[limits]        # optional
[flows]         # optional
```

Sections are declared with `[name]` on its own line. Only `[meta]` and `[ops]` are required. The rest may be omitted if they do not apply.

-----

### 5. Section [meta]

Contains API metadata in `key: value` format, one per line.

#### Required keys

|Key   |Description                      |
|------|---------------------------------|
|`api` |API name                         |
|`base`|Base URL (no trailing slash)     |

#### Optional keys

|Key      |Description                                            |
|---------|-------------------------------------------------------|
|`version`|API version                                            |
|`desc`   |Brief description (single line)                        |
|`auth`   |Authentication method (see 5.1)                        |
|`format` |Default data format: `json` (default), `xml`           |

#### 5.1 Auth format

The `auth` key uses a compact syntax:

```
auth: bearer header:Authorization
auth: apikey header:X-API-Key
auth: apikey query:api_key
auth: basic
auth: oauth2 <token_url>
auth: none
```

Format: `<type> [location:name]`

#### 5.2 Full [meta] example

```
[meta]
api: Invoice Service
base: https://api.example.com/v2
version: 2.1.0
desc: Invoice, payment, and customer management
auth: bearer header:Authorization
```

-----

### 6. Section [types]

Defines reusable types referenced in operations, webhooks, and flows.

#### 6.1 Native scalar types

|Type      |Description              |
|----------|-------------------------|
|`str`     |Text string              |
|`int`     |Integer                  |
|`float`   |Decimal number           |
|`bool`    |Boolean                  |
|`date`    |ISO 8601 date (YYYY-MM-DD)|
|`datetime`|ISO 8601 date and time   |
|`file`    |Binary content           |
|`any`     |Any type                 |

#### 6.2 Type modifiers

|Syntax    |Meaning                       |
|----------|------------------------------|
|`[T]`     |Array of T                    |
|`{str:T}` |Map/dictionary from string to T|
|`T?`      |T or null                     |
|`T = value`|Default value                |

#### 6.3 Object definitions

```
TypeName:
  field: type
  field?: type
  field: type = defaultValue
  field: [OtherType]
```

- The type name is followed by `:` and fields are indented with 2 spaces.
- `?` after the field name indicates it is optional.
- Fields without `?` are required.

#### 6.4 Enumerations

```
EnumName: val1 | val2 | val3
```

Single-line enumerations with values separated by `|`.

#### 6.5 Field versioning

When a field was added in a later API version, it is annotated with `@since:X.Y`:

```
Invoice:
  id: str
  customer_id: str
  total: float
  metadata?: {str:any} @since:2.1
  refund_policy?: str @since:2.2
```

This tells the LLM that `metadata` is only available from API version 2.1 onward, and `refund_policy` from 2.2 onward. If the API version in `[meta]` is earlier, the LLM knows those fields do not exist.

Rules:

- `@since:X.Y` is placed at the end of the field line, after the type and default value.
- If `@since` is absent, the field has existed since the first API version.
- The `@since` value must be a partial semver version (major.minor).

#### 6.6 Field deprecation

When a field is deprecated, it is annotated with `@deprecated` optionally followed by a note:

```
Invoice:
  id: str
  legacy_id?: str @deprecated "Use id instead"
  tax_code?: str @deprecated
```

Rules:

- `@deprecated` goes at the end of the line, after `@since` if both are present.
- The quoted text is optional and describes the alternative.

#### 6.7 Full [types] example

```
[types]
InvoiceStatus: draft | sent | paid | overdue | cancelled
Currency: EUR | USD | GBP

Address:
  street: str
  city: str
  zip: str
  country: str = "US"

InvoiceLine:
  product_id: str
  description?: str
  quantity: int
  unit_price: float

Invoice:
  id: str
  customer_id: str
  status: InvoiceStatus
  currency: Currency
  lines: [InvoiceLine]
  billing_address: Address
  subtotal: float
  tax: float
  total: float
  created_at: datetime
  due_date?: date
  paid_at?: datetime
  metadata?: {str:any} @since:2.1
  refund_policy?: str @since:2.2 @deprecated "Moved to Customer.refund_policy"

Customer:
  id: str
  name: str
  email: str
  company?: str
  address?: Address
  refund_policy?: str @since:2.2
```

-----

### 7. Section [ops]

Defines the API operations. This is the main section.

#### 7.1 Operation format

```
OPERATION_NAME METHOD /path/{param}
  Brief description of the operation.
  > field: type                  # required input
  > field?: type                 # optional input
  > field: type @location        # input with explicit location
  < field: type                  # output
```

#### 7.2 Syntax rules

**Header line:**

```
operation_name METHOD /path/{parameter}
```

- `operation_name`: Operation identifier. snake_case.
- `METHOD`: GET, POST, PUT, PATCH, DELETE. Always uppercase.
- `/path/{param}`: Path relative to `base`. Path params are enclosed in `{}`.

**Description line:**
Immediately after the header, indented with 2 spaces. A single line. If there is no description, it is omitted.

**Input parameters (`>`):**

```
  > field: type                  # body (default for POST/PUT/PATCH)
  > field?: type                 # optional
  > field: type = 20             # with default value
  > field: type @query           # query parameter
  > field: type @header          # header parameter
  > field: type @path            # path parameter (inferable from the path)
```

Default location rules (when `@` is not specified):

- Parameters appearing in the path `{}` are `@path`.
- For GET and DELETE: `@query`.
- For POST, PUT, and PATCH: `@body`.

**Output fields (`<`):**

```
  < field: type
  < [Type]
```

Output fields describe the structure of the successful response body (2xx). Error responses are not detailed in this section (see section 10 `[errors]`).

#### 7.3 Inline objects

When a type is only used in a single operation, it can be defined inline:

```
  > lines: [{product_id: str, quantity: int}]
  < pagination: {page: int, total: int, has_more: bool}
```

#### 7.4 Operation modifiers

Modifiers are appended after the path with the `+` prefix:

|Modifier     |Meaning                                                   |
|-------------|----------------------------------------------------------|
|`+paginated` |Paginated response. Accepts standard pagination params.   |
|`+deprecated`|Deprecated operation. May include a note in quotes.       |
|`+idempotent`|The operation is idempotent (safe to retry).              |
|`+stream`    |The response is a stream (SSE, chunked, etc.).            |

Multiple modifiers can be combined:

```
list_invoices GET /invoices +paginated +stream
```

#### 7.5 Operation versioning

Like fields, operations can be annotated with `@since:X.Y`:

```
bulk_create_invoices POST /invoices/bulk @since:2.1
  Creates multiple invoices in a single call.
  > invoices: [CreateInvoiceInput]
  < [Invoice]
```

#### 7.6 Bodyless operations

If an operation has no inputs or no outputs, the corresponding section is omitted:

```
delete_invoice DELETE /invoices/{invoice_id}
  Deletes an invoice by ID.
```

#### 7.7 Direct output reference

When the output is exactly a type defined in `[types]`, it is referenced directly:

```
  < Invoice          # returns the complete Invoice type
  < [Invoice]        # returns an array of Invoice
```

#### 7.8 Separation

Operations are separated by a blank line.

#### 7.9 Full [ops] example

```
[ops]
create_invoice POST /invoices
  Creates an invoice for a customer.
  > customer_id: str
  > currency?: Currency
  > lines: [InvoiceLine]
  > billing_address?: Address
  > due_date?: date
  > notes?: str
  < Invoice

get_invoice GET /invoices/{invoice_id}
  Full invoice details.
  < Invoice

list_invoices GET /invoices +paginated
  Lists invoices with filters.
  > customer_id?: str
  > status?: InvoiceStatus
  > from_date?: date
  > to_date?: date
  > min_total?: float
  < [Invoice]

update_invoice PATCH /invoices/{invoice_id}
  Updates an existing invoice. Only in draft status.
  > status?: InvoiceStatus
  > due_date?: date
  > notes?: str
  > lines?: [InvoiceLine]
  < Invoice

delete_invoice DELETE /invoices/{invoice_id}
  Deletes an invoice. Only in draft status.

send_invoice POST /invoices/{invoice_id}/send +idempotent
  Sends the invoice to the customer via email. Changes status to sent.
  > email_to?: str
  > cc?: [str]
  < sent_at: datetime
  < status: InvoiceStatus

bulk_create_invoices POST /invoices/bulk @since:2.1
  Creates multiple invoices in a single call.
  > invoices: [{customer_id: str, lines: [InvoiceLine], due_date?: date}]
  < [Invoice]

export_invoices GET /invoices/export +stream +deprecated "Use /invoices with Accept: text/csv"
  Exports invoices as CSV via streaming.
  > status?: InvoiceStatus
  > from_date?: date
  < file

get_customer GET /customers/{customer_id}
  Customer details.
  < Customer

list_customers GET /customers +paginated
  Lists all customers.
  > search?: str
  > sort?: str = "name"
  < [Customer]

create_customer POST /customers
  Creates a new customer.
  > name: str
  > email: str
  > company?: str
  > address?: Address
  < Customer
```

-----

### 8. Section [webhooks]

Defines events the API proactively sends to consumer endpoints (push).

#### 8.1 Webhook format

```
EVENT_NAME -> METHOD /suggested_path
  Event description.
  ! condition that triggers the event
  < field: type
```

#### 8.2 Syntax rules

**Header line:**

```
event_name -> METHOD /path
```

- `->` distinguishes webhooks from regular operations.
- `METHOD` is the HTTP method the API will use to call the consumer's endpoint. Typically POST.
- `/path` is the suggested path for the receiving endpoint. It is informational, not prescriptive.

**Trigger (`!`):**
Indented line with `!` describing the condition that fires the webhook. There may be multiple triggers:

```
  ! When an invoice transitions to "paid" status
  ! When a partial payment is received
```

**Payload fields (`<`):**
Same as in operations, describes the fields the API sends in the webhook body.

#### 8.3 Webhook headers

If the webhook includes specific headers (signatures, identifiers), they are annotated with `@header`:

```
invoice_paid -> POST /webhooks/invoice-paid
  ! When an invoice is marked as paid.
  < event_id: str @header:X-Event-ID
  < signature: str @header:X-Webhook-Signature
  < invoice_id: str
  < amount: float
  < paid_at: datetime
  < payment_method: str
```

#### 8.4 Subscription mechanism

If the API has a webhook subscription mechanism, it is described as a regular operation in `[ops]` (e.g., `subscribe_webhook POST /webhooks`). The `[webhooks]` section only describes events and their payloads.

#### 8.5 Full [webhooks] example

```
[webhooks]
invoice_paid -> POST /webhooks/invoice-paid
  Notifies when an invoice is marked as paid.
  ! When invoice.status changes to "paid".
  < event_id: str @header:X-Event-ID
  < signature: str @header:X-Webhook-Signature
  < invoice_id: str
  < customer_id: str
  < amount: float
  < currency: Currency
  < paid_at: datetime
  < payment_method: str

invoice_overdue -> POST /webhooks/invoice-overdue
  Notifies when an invoice becomes past due.
  ! When due_date passes and status != "paid".
  < event_id: str @header:X-Event-ID
  < invoice_id: str
  < customer_id: str
  < amount_due: float
  < due_date: date
  < days_overdue: int

payment_failed -> POST /webhooks/payment-failed
  Notifies when an automatic charge attempt fails.
  ! When an automatic charge is declined by the payment processor.
  < event_id: str @header:X-Event-ID
  < invoice_id: str
  < attempt_number: int
  < failure_reason: str
  < next_retry_at?: datetime
```

-----

### 9. Section [errors]

Defines common errors the API may return. Described once and applied globally. The goal is not to replicate every possible HTTP status code, but to give the LLM context about the errors a consumer may encounter and how to interpret them.

#### 9.1 Error format

```
CODE error_name
  Description of when it occurs.
  ~ field: type
```

#### 9.2 Syntax rules

**Header line:**

```
CODE error_name
```

- `CODE`: Numeric HTTP code (400, 401, 404, etc.).
- `error_name`: Human-readable error identifier. snake_case.

**Description:**
Indented line with 2 spaces. Describes when and why the error occurs.

**Error body fields (`~`):**
If the API returns a structured body with errors, it is described with `~`:

```
  ~ field: type
```

The `~` prefix distinguishes error fields from input (`>`) and output (`<`) fields.

#### 9.3 Operation-specific errors

If an error is specific to an operation (not global), it can be linked with `@ops`:

```
409 invoice_already_sent @ops:send_invoice
  The invoice has already been sent. It cannot be resent.
  ~ invoice_id: str
  ~ sent_at: datetime
```

Multiple operations can be linked, separated by commas:

```
422 insufficient_stock @ops:create_invoice,bulk_create_invoices
  Insufficient stock for one or more order lines.
  ~ product_id: str
  ~ available: int
  ~ requested: int
```

If `@ops` is absent, the error is considered global (it may occur in any operation).

#### 9.4 Common error structure

If all errors share a base structure, a type can be defined in `[types]` and referenced:

```
[types]
ApiError:
  code: str
  message: str
  request_id: str
  details?: any
```

Then in `[errors]`, only the semantics are described without repeating fields:

```
[errors]
# Base structure for all errors: ApiError

400 validation_error
  Invalid input data. details contains the fields with errors.

401 unauthorized
  Token is missing, expired, or invalid.

403 forbidden
  Valid token but insufficient permissions for this operation.

404 not_found
  Resource not found.

429 rate_limited
  Too many requests. See section [limits].
```

#### 9.5 Full [errors] example

```
[errors]
# Base structure: ApiError

400 validation_error
  Invalid input data. details contains the fields with errors.

401 unauthorized
  Token is missing, expired, or invalid.

403 forbidden
  Valid token but insufficient permissions.

404 not_found
  Resource not found.

409 invoice_already_sent @ops:send_invoice
  The invoice has already been sent.

409 duplicate_customer @ops:create_customer
  A customer with that email already exists.
  ~ existing_customer_id: str

422 invalid_state_transition @ops:update_invoice,send_invoice
  State transition not allowed (e.g., from paid to draft).
  ~ current_status: InvoiceStatus
  ~ attempted_status: InvoiceStatus
  ~ allowed_transitions: [InvoiceStatus]

429 rate_limited
  Rate limit exceeded. Retry after the Retry-After header.
  ~ retry_after: int

503 service_unavailable
  Service temporarily unavailable.
  ~ estimated_recovery: datetime?
```

-----

### 10. Section [limits]

Defines API usage constraints: rate limiting, quotas, and size limits.

#### 10.1 Rate limits

Rate limits are defined with the syntax:

```
rate: <count>/<window> [scope]
```

Where:

- `count`: Maximum number of requests.
- `window`: Time period. Values: `s` (second), `m` (minute), `h` (hour), `d` (day).
- `scope` (optional): What the limit applies to.

Available scopes:

|Scope        |Meaning                                        |
|-------------|-----------------------------------------------|
|`@global`    |API-wide, shared across all consumers          |
|`@key`       |Per API key / token (default if not specified)  |
|`@ip`        |Per source IP                                  |
|`@user`      |Per authenticated user                         |
|`@op:name`   |Applies only to a specific operation            |

#### 10.2 Quotas

Quotas are cumulative limits (not sliding windows):

```
quota: <count>/<period> [scope] "description"
```

Periods: `d` (day), `w` (week), `mo` (month), `y` (year).

#### 10.3 Size limits

```
max_body: <size>
max_upload: <size>
max_response: <size>
max_batch: <count>
```

Sizes use the format: `1KB`, `5MB`, `1GB`.

#### 10.4 Rate limit headers

If the API communicates rate limit status via headers, they are annotated:

```
headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
```

#### 10.5 Exceeded behavior

```
on_exceed: 429 retry_after
```

Indicates the API returns 429 with a Retry-After header when the limit is exceeded.

#### 10.6 Plans/tiers

If limits vary by plan, they are grouped with `plan:`:

```
plan: free
  rate: 100/h @key
  quota: 1000/mo @key "monthly calls"
  max_batch: 10

plan: pro
  rate: 1000/h @key
  quota: 50000/mo @key "monthly calls"
  max_batch: 100

plan: enterprise
  rate: 10000/h @key
  quota: unlimited
  max_batch: 1000
```

If there are no plans, limits are defined directly without `plan:`.

#### 10.7 Full [limits] example

```
[limits]
headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
on_exceed: 429 retry_after
max_body: 5MB
max_upload: 25MB

plan: free
  rate: 60/m @key
  rate: 10/m @op:bulk_create_invoices
  quota: 1000/mo @key "monthly requests"
  quota: 100/mo @key "invoices created"
  max_batch: 10

plan: pro
  rate: 600/m @key
  rate: 60/m @op:bulk_create_invoices
  quota: 50000/mo @key "monthly requests"
  quota: 10000/mo @key "invoices created"
  max_batch: 100

plan: enterprise
  rate: 6000/m @key
  rate: 300/m @op:bulk_create_invoices
  quota: unlimited
  max_batch: 1000
```

-----

### 11. Section [flows]

Describes sequences of operations that form common workflows. The goal is for the LLM to understand how operations are used together, not just individually.

#### 11.1 Flow format

```
FLOW_NAME "Flow description"
  step1_operation -> step2_operation -> step3_operation
  Full flow explanation.
```

#### 11.2 Syntax rules

**Header line:**

```
flow_name "Short description"
```

**Operation chain:**
Indented line with operation names connected by `->`:

```
  op1 -> op2 -> op3
```

**Branches (conditionals):**
When a flow branches based on the outcome, `|` is used:

```
  op1 -> op2 -> op3 | op4
```

This means: after `op2`, continue with `op3` OR `op4` depending on the condition.

To describe the conditions, lines prefixed with `?` are added:

```
  op1 -> op2 -> op3 | op4
  ? op3: if the payment succeeds
  ? op4: if the payment fails
```

**Loops:**
When a step may repeat, it is annotated with `*`:

```
  op1 -> op2* -> op3
```

This means `op2` may execute multiple times before proceeding to `op3`.

**Extended description:**
After the chain (and conditions, if any), a narrative description of the flow may follow. Lines indented with 2 spaces, free text.

#### 11.3 Flows with inter-step data

When it is important to indicate which data flows between operations, the `.field` notation is used:

```
  create_customer.id -> create_invoice(customer_id) -> send_invoice
```

This indicates the `id` returned by `create_customer` is used as `customer_id` in `create_invoice`.

#### 11.4 Flows with waiting

When a flow involves waiting for an external event (webhook, user action, time), `...` is used:

```
  send_invoice -> ... -> invoice_paid
```

The `...` represents a pause. It can be annotated:

```
  send_invoice -> ...(awaiting payment) -> invoice_paid
```

#### 11.5 Full [flows] example

```
[flows]
onboard_customer "Customer onboarding and first invoice"
  create_customer.id -> create_invoice(customer_id) -> send_invoice
  Typical onboarding flow: create the customer, generate their first
  invoice, and send it via email automatically.

invoice_lifecycle "Full invoice lifecycle"
  create_invoice -> update_invoice* -> send_invoice -> ...(awaiting payment) -> invoice_paid | invoice_overdue
  ? invoice_paid: the customer pays before the due date
  ? invoice_overdue: the due date passes without payment
  An invoice is created as draft, may be edited multiple times,
  sent to the customer, and left pending payment. If not paid
  on time, it is marked as overdue and the corresponding webhook fires.

retry_failed_payment "Failed charge retries"
  payment_failed -> ...(awaiting retry_after) -> send_invoice -> payment_failed | invoice_paid
  ? payment_failed: the retry fails again (max 3 attempts)
  ? invoice_paid: the retry succeeds
  When an automatic charge fails, wait for the time indicated
  in the webhook and retry. Up to 3 retries before marking
  as overdue.

bulk_import "Bulk invoice import"
  list_customers -> bulk_create_invoices* -> list_invoices
  For bulk imports: first retrieve existing customer IDs, then
  create invoices in batches using the bulk endpoint, and
  finally verify the results.
```

-----

### 12. Comments

Comments are introduced with `#` and are ignored during processing:

```
# This is a comment
create_invoice POST /invoices  # inline comment
```

-----

### 13. Full LAPIS example document

```
[meta]
api: Invoice Service
base: https://api.example.com/v2
version: 2.2.0
desc: Invoice, customer, and payment management
auth: bearer header:Authorization

[types]
InvoiceStatus: draft | sent | paid | overdue | cancelled
Currency: EUR | USD | GBP
PaymentMethod: card | transfer | direct_debit

ApiError:
  code: str
  message: str
  request_id: str
  details?: any

Address:
  street: str
  city: str
  zip: str
  country: str = "US"

InvoiceLine:
  product_id: str
  description?: str
  quantity: int
  unit_price: float

Invoice:
  id: str
  customer_id: str
  status: InvoiceStatus
  currency: Currency
  lines: [InvoiceLine]
  billing_address: Address
  subtotal: float
  tax: float
  total: float
  created_at: datetime
  due_date?: date
  paid_at?: datetime
  metadata?: {str:any} @since:2.1
  refund_policy?: str @since:2.2 @deprecated "Moved to Customer"

Customer:
  id: str
  name: str
  email: str
  company?: str
  address?: Address
  refund_policy?: str @since:2.2

[ops]
create_invoice POST /invoices
  Creates an invoice for a customer.
  > customer_id: str
  > currency?: Currency
  > lines: [InvoiceLine]
  > billing_address?: Address
  > due_date?: date
  > notes?: str
  < Invoice

get_invoice GET /invoices/{invoice_id}
  Full invoice details.
  < Invoice

list_invoices GET /invoices +paginated
  Lists invoices with filters.
  > customer_id?: str
  > status?: InvoiceStatus
  > from_date?: date
  > to_date?: date
  > min_total?: float
  < [Invoice]

update_invoice PATCH /invoices/{invoice_id}
  Updates an invoice. Only in draft status.
  > status?: InvoiceStatus
  > due_date?: date
  > notes?: str
  > lines?: [InvoiceLine]
  < Invoice

delete_invoice DELETE /invoices/{invoice_id}
  Deletes an invoice. Only in draft status.

send_invoice POST /invoices/{invoice_id}/send +idempotent
  Sends the invoice to the customer via email.
  > email_to?: str
  > cc?: [str]
  < sent_at: datetime
  < status: InvoiceStatus

bulk_create_invoices POST /invoices/bulk @since:2.1
  Creates multiple invoices in a single call.
  > invoices: [{customer_id: str, lines: [InvoiceLine], due_date?: date}]
  < [Invoice]

export_invoices GET /invoices/export +stream +deprecated "Use /invoices with Accept: text/csv"
  Exports invoices as CSV via streaming.
  > status?: InvoiceStatus
  > from_date?: date
  < file

get_customer GET /customers/{customer_id}
  Customer details.
  < Customer

list_customers GET /customers +paginated
  Lists customers.
  > search?: str
  > sort?: str = "name"
  < [Customer]

create_customer POST /customers
  Creates a new customer.
  > name: str
  > email: str
  > company?: str
  > address?: Address
  < Customer

[webhooks]
invoice_paid -> POST /webhooks/invoice-paid
  Notifies when an invoice is paid.
  ! When invoice.status changes to "paid".
  < event_id: str @header:X-Event-ID
  < signature: str @header:X-Webhook-Signature
  < invoice_id: str
  < customer_id: str
  < amount: float
  < currency: Currency
  < paid_at: datetime
  < payment_method: PaymentMethod

invoice_overdue -> POST /webhooks/invoice-overdue
  Notifies when an invoice becomes past due.
  ! When due_date passes and status != "paid".
  < event_id: str @header:X-Event-ID
  < invoice_id: str
  < customer_id: str
  < amount_due: float
  < days_overdue: int

payment_failed -> POST /webhooks/payment-failed
  Notifies when an automatic charge fails.
  ! When a charge is declined by the processor.
  < event_id: str @header:X-Event-ID
  < invoice_id: str
  < attempt_number: int
  < failure_reason: str
  < next_retry_at?: datetime

[errors]
# Base structure for all errors: ApiError

400 validation_error
  Invalid input data.

401 unauthorized
  Token is missing, expired, or invalid.

403 forbidden
  Valid token but insufficient permissions.

404 not_found
  Resource not found.

409 invoice_already_sent @ops:send_invoice
  The invoice has already been sent.

409 duplicate_customer @ops:create_customer
  A customer with that email already exists.
  ~ existing_customer_id: str

422 invalid_state_transition @ops:update_invoice,send_invoice
  State transition not allowed.
  ~ current_status: InvoiceStatus
  ~ attempted_status: InvoiceStatus
  ~ allowed_transitions: [InvoiceStatus]

429 rate_limited
  Rate limit exceeded.
  ~ retry_after: int

503 service_unavailable
  Service temporarily unavailable.
  ~ estimated_recovery: datetime?

[limits]
headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
on_exceed: 429 retry_after
max_body: 5MB
max_upload: 25MB

plan: free
  rate: 60/m @key
  rate: 10/m @op:bulk_create_invoices
  quota: 1000/mo @key "monthly requests"
  max_batch: 10

plan: pro
  rate: 600/m @key
  rate: 60/m @op:bulk_create_invoices
  quota: 50000/mo @key "monthly requests"
  max_batch: 100

plan: enterprise
  rate: 6000/m @key
  quota: unlimited
  max_batch: 1000

[flows]
onboard_customer "Customer onboarding and first invoice"
  create_customer.id -> create_invoice(customer_id) -> send_invoice
  Creates customer, generates their first invoice, and sends it via email.

invoice_lifecycle "Invoice lifecycle"
  create_invoice -> update_invoice* -> send_invoice -> ...(awaiting payment) -> invoice_paid | invoice_overdue
  ? invoice_paid: the customer pays before the due date
  ? invoice_overdue: becomes past due without payment
  Invoice is created as draft, edited, sent, and left pending payment.

retry_failed_payment "Charge retries"
  payment_failed -> ...(awaiting next_retry_at) -> send_invoice -> payment_failed | invoice_paid
  ? payment_failed: retry fails (max 3)
  ? invoice_paid: retry succeeds
  Automatic retry after a failed charge.

bulk_import "Bulk import"
  list_customers -> bulk_create_invoices* -> list_invoices
  Retrieves customers, creates invoices in batches, verifies results.
```

-----

### 14. Conversion rules from OpenAPI

To generate a LAPIS document from OpenAPI 3.x:

1. **[meta]**
- `api` <- `info.title`
- `version` <- `info.version`
- `base` <- `servers[0].url`
- `desc` <- `info.description` (truncate to a single line)
- `auth` <- interpret `securitySchemes`
1. **[types]**
- Each schema in `components.schemas` referenced more than once becomes a LAPIS type.
- Schemas referenced only once are inlined in the operation.
- `enum` values are converted to the `val1 | val2 | val3` syntax.
- Discarded: `example`, `externalDocs`, `xml`, `discriminator`, `x-*`.
- `allOf`/`oneOf`/`anyOf` are resolved (flattened) before conversion.
- `x-since` extensions are mapped to `@since:X.Y`.
- `x-deprecated` extensions or the `deprecated` flag are mapped to `@deprecated`.
1. **[ops]**
- Each `operationId` becomes the operation name. If `operationId` is absent, it is generated from the method + path in snake_case.
- `summary` or `description` (whichever is shorter) is used as the description. One line maximum.
- Path, query, and header parameters are mapped with their `@location`.
- The `requestBody` is decomposed into `>` fields.
- The schema from `responses.2xx.content.application/json.schema` is decomposed into `<` fields.
- Discarded: `tags`, `callbacks`, `security` at the operation level, `servers`.
- Operations with `deprecated: true` are tagged with `+deprecated`.
- If the `x-paginated` extension or similar exists, tagged with `+paginated`.
- If the `x-idempotent` extension exists, tagged with `+idempotent`.
1. **[webhooks]**
- OpenAPI 3.1 natively supports webhooks under `webhooks:`. Each webhook is converted to LAPIS syntax.
- For OpenAPI 3.0, webhooks may reside in `x-webhooks` or in specific paths (at the converter's discretion).
1. **[errors]**
- All unique 4xx/5xx response schemas are collected from all operations.
- They are grouped by code + identical schema.
- If an error appears in all operations, it is marked as global.
- If it appears in specific operations, it is linked with `@ops`.
- Common error schemas (used across multiple responses) are extracted as a type in `[types]`.
1. **[limits]**
- There is no direct mapping from standard OpenAPI.
- They can be extracted from `x-rateLimit`, `x-quota`, etc. extensions if present.
- Or from the `info.description` field if it contains rate limiting information.
1. **[flows]**
- There is no direct mapping from OpenAPI.
- They can be generated using heuristics (dependency analysis between schemas) or with LLM assistance.
- OpenAPI 3.x `links` (`responses.*.links`) are the closest source of information.
1. **General discards**
   Removed: `openapi` version, `info.contact`, `info.license`, `info.termsOfService`, `externalDocs`, `tags` definitions, `paths.*.servers`, all unrecognized `x-*`.

-----

### 15. Token comparison

Estimation for an API with 11 operations, 8 types, 3 webhooks, 10 errors, limits, and 4 flows:

|Format              |Estimated tokens|Ratio vs OpenAPI|
|--------------------|----------------|----------------|
|OpenAPI YAML        |~6,500          |1x (baseline)   |
|OpenAPI JSON        |~8,400          |1.3x            |
|OpenAPI minified    |~3,900          |0.6x            |
|LAPIS               |~1,500          |0.23x           |

The main reduction comes from:

- Elimination of LLM-irrelevant metadata (~30%).
- Signature syntax vs nested structure (~25%).
- No JSON/YAML key repetition (~15%).
- Single-line descriptions vs paragraphs (~10%).
- Grouped errors vs repeated per operation (~10%).
- Flows as narrative text vs formal links (~5%).

-----

### 16. Formal grammar (simplified EBNF)

```ebnf
document        = meta_section types_section? ops_section
                  webhooks_section? errors_section?
                  limits_section? flows_section?

(* === META === *)
meta_section    = "[meta]" NL (meta_line NL)+
meta_line       = key ":" SP value

(* === TYPES === *)
types_section   = "[types]" NL (type_def NL)*
type_def        = enum_def | object_def
enum_def        = IDENT ":" SP enum_value (SP "|" SP enum_value)*
object_def      = IDENT ":" NL (field_line NL)+
field_line      = SP SP IDENT "?"? ":" SP type_expr
                  (SP "=" SP default_value)?
                  (SP annotation)*
annotation      = "@since:" VERSION
                | "@deprecated" (SP QUOTED_STRING)?

(* === OPS === *)
ops_section     = "[ops]" NL (operation NL)*
operation       = op_header NL op_desc? (param_line NL)* (output_line NL)*
op_header       = IDENT SP METHOD SP path (SP modifier)* (SP "@since:" VERSION)?
modifier        = "+" IDENT (SP QUOTED_STRING)?
op_desc         = SP SP text NL
param_line      = SP SP ">" SP IDENT "?"? ":" SP type_expr
                  (SP "=" SP default_value)? (SP "@" location)?
output_line     = SP SP "<" SP (IDENT ":" SP type_expr | type_ref)
                  (SP "@header:" IDENT)?
location        = "query" | "header" | "path" | "body"

(* === WEBHOOKS === *)
webhooks_section = "[webhooks]" NL (webhook NL)*
webhook         = webhook_header NL wh_desc? (trigger_line NL)* (wh_output NL)*
webhook_header  = IDENT SP "->" SP METHOD SP path
wh_desc         = SP SP text NL
trigger_line    = SP SP "!" SP text NL
wh_output       = SP SP "<" SP IDENT "?"? ":" SP type_expr
                  (SP "@header:" IDENT)?

(* === ERRORS === *)
errors_section  = "[errors]" NL (comment NL)* (error_def NL)*
error_def       = error_header NL error_desc? (error_field NL)*
error_header    = HTTP_CODE SP IDENT (SP "@ops:" IDENT ("," IDENT)*)?
error_desc      = SP SP text NL
error_field     = SP SP "~" SP IDENT "?"? ":" SP type_expr

(* === LIMITS === *)
limits_section  = "[limits]" NL (limit_line NL | plan_block NL)*
limit_line      = limit_directive
plan_block      = "plan:" SP IDENT NL (SP SP limit_directive NL)+
limit_directive = rate_limit | quota_limit | size_limit | config_line
rate_limit      = "rate:" SP NUMBER "/" WINDOW (SP scope)?
quota_limit     = "quota:" SP (NUMBER "/" PERIOD | "unlimited") (SP scope)? (SP QUOTED_STRING)?
size_limit      = ("max_body" | "max_upload" | "max_response" | "max_batch")
                  ":" SP SIZE_OR_NUMBER
config_line     = ("headers" | "on_exceed") ":" SP text
scope           = "@global" | "@key" | "@ip" | "@user"
                | "@op:" IDENT

(* === FLOWS === *)
flows_section   = "[flows]" NL (flow NL)*
flow            = flow_header NL flow_chain NL flow_conditions? flow_desc?
flow_header     = IDENT SP QUOTED_STRING
flow_chain      = SP SP flow_step (SP "->" SP flow_step)*
flow_step       = IDENT ("." IDENT)? ("(" IDENT ")")? "*"?
                | "...(" text ")"
                | flow_step SP "|" SP flow_step
flow_conditions = (SP SP "?" SP IDENT ":" SP text NL)*
flow_desc       = (SP SP text NL)+

(* === COMMON === *)
type_expr       = scalar | IDENT | "[" type_expr "]" | "{" field_list "}"
                | "{" scalar ":" type_expr "}"
scalar          = "str" | "int" | "float" | "bool" | "date" | "datetime"
                | "file" | "any"
type_ref        = IDENT | "[" IDENT "]"
field_list      = inline_field ("," SP inline_field)*
inline_field    = IDENT "?"? ":" SP type_expr
comment         = "#" text

METHOD          = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
HTTP_CODE       = DIGIT DIGIT DIGIT
path            = "/" (segment ("/" segment)*)?
segment         = text | "{" IDENT "}"
IDENT           = [a-zA-Z_][a-zA-Z0-9_]*
VERSION         = DIGIT+ "." DIGIT+
WINDOW          = "s" | "m" | "h" | "d"
PERIOD          = "d" | "w" | "mo" | "y"
SIZE_OR_NUMBER  = NUMBER UNIT?
UNIT            = "KB" | "MB" | "GB"
QUOTED_STRING   = '"' [^"]* '"'
NUMBER          = DIGIT+
NL              = newline
SP              = " "
```

-----

### 17. Implementation notes

An OpenAPI -> LAPIS converter should:

1. Resolve all `$ref` entries before processing.
2. Flatten `allOf` by merging properties.
3. For `oneOf`/`anyOf`, pick the most common variant or use `any` if the union is complex.
4. Truncate descriptions to 80 characters maximum.
5. Omit operations marked as `deprecated` if configured to do so (default: include with `+deprecated`).
6. Generate operation names from `operationId`, or synthesize as `method_resource`.
7. Collect errors from all operations, deduplicate by code+schema, and generate `[errors]`.
8. Generate `[webhooks]` from OpenAPI 3.1 `webhooks:` or `x-webhooks` extensions.
9. Infer `[flows]` from `links` if available, or leave the section empty to be filled in manually.
10. Generate `[limits]` from `x-rateLimit` extensions or similar, or leave empty.

-----

### 18. File extensions

- LAPIS documents use the `.lapis` extension.
- The suggested MIME type is `text/lapis` (not formally registered).
- Encoding must always be UTF-8 without BOM.

-----

### 19. Spec versioning

The LAPIS specification version is indicated on the first line of the document as a comment:

```
# LAPIS v0.1.0
```

This is not required, but recommended so that tools and LLMs can identify the syntax version.

-----

### 20. License

LAPIS specification v0.1.0 - Released under CC BY 4.0.
