# The 100-Point Enterprise Forensic Codebase & Workspace Audit Checklist
## Institutional Standards Alignment: ISO/IEC 5055 • NIST SSDF SP 800-218 • OWASP ASVS v4.0.3 • SLSA L3

This checklist serves as the operational inspection standard for Principal Codebase Auditors. Every verification item is formally cross-referenced against authoritative international engineering, security, and quality standards.

---

## 1. Workspace, Repository & VCS Hygiene (Points 1–10)
*Standards: NIST SSDF [PS.1.1, PS.2.1] • SLSA Level 3 • ISO/IEC 25010 [Modularity]*

- [ ] **01. .gitignore Completeness:** Verified that OS files (`.DS_Store`, `Thumbs.db`), IDE configs (`.idea/`, `.vscode/`), and local caches (`.pytest_cache`, `.turbo`, `.next`) are comprehensively ignored. `[NIST SSDF PS.1.1]`
- [ ] **02. Build Artifact Isolation:** Confirmed zero committed build artifacts (`node_modules/`, `target/`, `dist/`, `build/`, `*.class`, `*.pyc`). `[SLSA L3 Build-Hermetic]`
- [ ] **03. Environment File Secrecy:** Verified no active `.env`, `.env.local`, or `.env.production` files exist in the repository; only `.env.example` templates exist. `[OWASP ASVS V14.2.1]`
- [ ] **04. Large Binary Bloat:** Checked git history and working tree for large binaries (>10MB), core dumps, or sqlite database files. `[ISO 5055 Maintainability]`
- [ ] **05. Branching & Tagging Discipline:** Main branch is protected; release tags follow Semantic Versioning (`vMAJOR.MINOR.PATCH`) with signed commits. `[SLSA L3 Source-Integrity]`
- [ ] **06. Git Commit Churn Distribution:** Verified whether churn is concentrated in healthy feature additions rather than continuous emergency defect patching in single files. `[DORA Stability]`
- [ ] **07. Monorepo Root Cleanliness:** Root directory contains only orchestration manifests, documentation, and configuration; zero loose scratch scripts or untracked test dumps. `[ISO 25010 Modularity]`
- [ ] **08. License Clarity & Compliance:** All third-party dependencies checked for licensing compatibility; zero viral copyleft licenses (AGPL) embedded in closed proprietary systems. `[Legal IP Risk]`
- [ ] **09. Line Ending & Encoding Parity:** `.gitattributes` enforces deterministic `lf` line endings across Windows and Unix environments. `[Build Determinism]`
- [ ] **10. Documentation Sync:** Workspace README and architectural guides reflect the actual active branch and technology stack version. `[ISO 25010 Understandability]`

---

## 2. Security, Authentication & Secret Hygiene (Points 11–20)
*Standards: OWASP ASVS v4.0.3 [V2, V3, V5] • NIST SSDF [PW.1.1, PW.2.1] • ISO/IEC 5055 [Security]*

- [ ] **11. Hardcoded Secret Zero-Tolerance:** Zero hardcoded API keys, bearer tokens, private keys, HMAC secrets, or database passwords in source code. `[CWE-798, ASVS V14.2.1]`
- [ ] **12. Broken Object-Level Authorization (BOLA/IDOR):** Every data-access route validates that the authenticated principal possesses legitimate ownership of the requested record. `[CWE-639, ASVS V4.1.1]`
- [ ] **13. SQL Injection Defense:** 100% of database queries use parameterized prepared statements, ORM criteria builders, or typed query abstractions; zero raw string concatenation. `[CWE-89, ASVS V5.3.4]`
- [ ] **14. Cross-Site Scripting (XSS) Sanitization:** User inputs rendered in web views are HTML-escaped; zero unescaped `dangerouslySetInnerHTML` or `v-html` without DOMPurify. `[CWE-79, ASVS V5.2.2]`
- [ ] **15. Server-Side Request Forgery (SSRF) Hardening:** Webhook receivers and URL fetching services validate target domains against strict allowlists and block RFC 1918 private IP ranges. `[CWE-918, ASVS V12.6.1]`
- [ ] **16. Cryptographic Rigor:** Passwords hashed exclusively using Argon2id, bcrypt (work factor $\ge 12$), or PBKDF2; zero MD5, SHA-1, or plaintext storage. `[CWE-327, ASVS V2.4.1]`
- [ ] **17. CORS Configuration:** CORS headers restricted to verified enterprise domain origins; zero wildcard `Access-Control-Allow-Origin: *` on authenticated endpoints. `[CWE-942, ASVS V14.4.1]`
- [ ] **18. Token Validation & Expiry:** JWT tokens validate signature algorithm (`RS256`), issuer, audience, and have short expiration lifetimes ($\le 15$ mins) paired with rotating refresh tokens. `[CWE-347, ASVS V3.5.1]`
- [ ] **19. Secure Deserialization:** Jackson, fastjson, or Python pickle configured to prohibit untrusted polymorphic type instantiation. `[CWE-502, ASVS V5.5.1]`
- [ ] **20. Security Headers:** API gateways enforce `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, and `X-Frame-Options: DENY`. `[OWASP ASVS V14.4.2]`

---

## 3. Architectural Topology & Structural Coupling (Points 21–30)
*Standards: ISO/IEC 5055 [Maintainability] • IEEE 1471 / ISO 42010 Architecture Models*

- [ ] **21. Layering Inversion Compliance:** Dependencies flow strictly inward from Presentation -> Application -> Domain Core; Domain Core has zero imports from Infrastructure or Web layers. `[CWE-1048, ISO 5055]`
- [ ] **22. Cyclic Dependency Elimination:** Packages and modules form a strict Directed Acyclic Graph (DAG); zero circular imports. `[CWE-1047, ISO 5055]`
- [ ] **23. Single Responsibility & God Class Elimination:** No class exceeds 1,500 LOC or 10 injected collaborators. `[CWE-1061, ISO 5055]`
- [ ] **24. Anti-Corruption Layers (ACL):** Third-party APIs and legacy systems are wrapped behind internal domain interfaces and translation adapters. `[Domain-Driven Design]`
- [ ] **25. Entity Encapsulation:** JPA/Hibernate entities and database models are never exposed directly on public REST/GraphQL controller surfaces; separate DTOs are enforced. `[CWE-1058, ISO 5055]`
- [ ] **26. Shared Mutable State:** Zero static collections or global singletons caching mutable operational state across concurrent requests. `[CWE-366, ISO 5055]`
- [ ] **27. Monorepo Boundary Enforcement:** In multi-package repositories, internal modules interact only through declared public APIs/index exports; zero deep internal file imports (`../../src/internal/...`). `[Modular Architecture]`
- [ ] **28. Interface Segregation:** Client-specific interfaces prevent consumers from depending on methods they do not execute. `[SOLID Principles]`
- [ ] **29. Event Schema Versioning:** Asynchronous domain events (Kafka, RabbitMQ) follow versioned schemas (Avro/Protobuf/JSON Schema) allowing backward-compatible evolution. `[Enterprise Integration Patterns]`
- [ ] **30. Transactional Outbox Pattern:** Cross-boundary event publishing paired with database mutations uses an Outbox table to guarantee at-least-once delivery. `[Distributed Consistency]`

---

## 4. Dependency Supply Chain & SCA (Points 31–40)
*Standards: NIST SSDF [PW.4.1] • SLSA Level 3 • OpenSSF Scorecard*

- [ ] **31. Lockfile Determinism:** Lockfiles (`package-lock.json`, `pnpm-lock.yaml`, `poetry.lock`, `Cargo.lock`) are committed and synchronized with root manifests. `[SLSA L3 Build-Reproducibility]`
- [ ] **32. Vulnerability-Free Dependencies:** Zero known critical or high-severity CVEs in direct or transitive dependency trees. `[NIST SSDF PW.4.1]`
- [ ] **33. Pinned Dependency Ranges:** Core enterprise dependencies avoid floating wildcards (`*`, `^latest`, `latest`); explicit versions or tested minor ranges are enforced. `[OpenSSF Scorecard]`
- [ ] **34. Transitive Dependency Pruning:** Unused or redundant transitive libraries pruned to reduce attack surface and build footprint. `[CWE-1104]`
- [ ] **35. Upstream Package Vitality:** Dependencies have active maintenance within the past 18 months and reputable maintenance teams. `[OpenSSF Maintained]`
- [ ] **36. Typosquatting Verification:** External packages verified against official namespace repositories; zero suspicious package name variations. `[Supply Chain Defense]`
- [ ] **37. Minimal Dependency Footprint:** Avoidance of single-function micro-packages (e.g., `is-odd`, `left-pad`) where standard language runtime built-ins suffice. `[Software Hygiene]`
- [ ] **38. Private Artifact Repository Mirroring:** Corporate builds pull from internal proxy caches (Artifactory, Nexus) rather than unauthenticated public registries. `[SLSA L3 Hermetic]`
- [ ] **39. Software Bill of Materials (SBOM):** Automated CycloneDX or SPDX SBOM generation configured in the build pipeline. `[Executive Order 14028, NIST SSDF PS.3.2]`
- [ ] **40. Deprecation Audit:** Zero deprecated core libraries (e.g., Log4j 1.x, Spring Boot 2.x, Python 2.x, AngularJS) remaining in production code paths. `[Technical Debt Audit]`

---

## 5. Code Quality & Cognitive Complexity (Points 41–50)
*Standards: ISO/IEC 5055 [Maintainability] • Sonar Clean Code Taxonomy*

- [ ] **41. Cognitive Complexity Thresholds:** Functions maintain Cognitive Complexity $\le 15$; deeply nested logic extracted into declarative helpers. `[Sonar Clean Code]`
- [ ] **42. Cyclomatic Complexity Limits:** Method branches (if, switch, loops) kept $\le 10$ decision points per method. `[CWE-1061, ISO 5055]`
- [ ] **43. Dead & Unreachable Code Elimination:** Zero zombie classes, unused functions, or unreachable conditional branches. `[CWE-561, ISO 5055]`
- [ ] **44. DRY vs WET Balance:** Identical business validation logic deduplicated, while avoiding premature abstraction of coincidental structural similarities. `[Clean Architecture]`
- [ ] **45. Function Parameter Caps:** Functions accept $\le 5$ arguments; complex inputs grouped into typed parameter objects. `[CWE-1062, ISO 5055]`
- [ ] **46. Type Strictness:** TypeScript configured with `strict: true`; Python with `mypy --strict`; zero unchecked `any` casts in critical business paths. `[Type Safety Assurance]`
- [ ] **47. Naming Conventions & Semantics:** Variable and class names reflect ubiquitously understood domain vocabulary (e.g., `calculateAccruedInterest` vs `doCalc`). `[Clean Code]`
- [ ] **48. Magic Number Eradication:** Numeric constants and business thresholds defined as typed, descriptive domain constants. `[CWE-1094, ISO 5055]`
- [ ] **49. Code Duplication Percentage:** Code duplication across the repository maintained below 5% of total volume. `[Technical Debt Ratio]`
- [ ] **50. Technical Debt Ratio:** Calculated static debt ratio maintained below 5% of total development replacement effort. `[Gartner Technical Debt Standard]`

---

## 6. Concurrency, Memory & Runtime Performance (Points 51–60)
*Standards: ISO/IEC 5055 [Performance Efficiency & Reliability]*

- [ ] **51. ORM N+1 Query Elimination:** All parent-child entity traversals use `JOIN FETCH`, batch fetching, or explicit query projections. `[CWE-1050, ISO 5055]`
- [ ] **52. Database Index Coverage:** High-frequency query filter columns, foreign keys, and sorting fields backed by matching B-Tree or composite indexes. `[Database Health]`
- [ ] **53. Connection Pool Sizing & Lifecycle:** Database connection pools (HikariCP, pgpool) configured with realistic `maximumPoolSize`, `connectionTimeout`, and `leakDetectionThreshold`. `[CWE-400, ISO 5055]`
- [ ] **54. Deterministic Resource Disposal:** Streams, sockets, result sets, and HTTP responses enclosed in `try-with-resources` or `using` statements. `[CWE-459, ISO 5055]`
- [ ] **55. Event Loop Non-Blocking Discipline:** Node.js/async event loops never execute heavy synchronous file operations, blocking regexes, or unchunked array transforms. `[Node.js Runtime Health]`
- [ ] **56. Memory Leak Resistance:** Detached event listeners, WebSocket connections, and unbounded caches equipped with TTL eviction policies (Caffeine, Guava, Redis). `[CWE-772, ISO 5055]`
- [ ] **57. Atomic Concurrency Controls:** Balance and inventory deductions utilize atomic SQL updates or optimistic locking (`@Version`) to prevent double-spending. `[CWE-362, Race Condition Defense]`
- [ ] **58. Pagination Hard Caps:** All listing endpoints enforce mandatory pagination with a hard maximum limit ($\le 100$ records per request). `[API DOS Defense]`
- [ ] **59. Cache Invalidation Coherence:** Caching layers (Redis) enforce explicit TTLs and write-through/invalidate semantics on entity mutation. `[Cache Coherence]`
- [ ] **60. Gzip/Brotli & Compression:** API payloads exceeding 1KB compressed over HTTP transport. `[Network Efficiency]`

---

## 7. Reliability, Error Handling & Failure Semantics (Points 61–70)
*Standards: ISO/IEC 5055 [Reliability] • Resilience4j / Reactive System Protocols*

- [ ] **61. Zero Swallowed Exceptions:** Zero empty catch blocks (`catch (Exception e) {}`); all caught exceptions either logged, wrapped, or recovered. `[CWE-398, ISO 5055]`
- [ ] **62. Spring Rollback Poisoning Prevention:** Service methods that catch exceptions from nested transactional beans do not trigger unhandled rollback-only contamination. `[Transaction Integrity]`
- [ ] **63. External Call Timeouts:** Every external HTTP, RPC, or database request has explicit connection ($\le 3s$) and read ($\le 10s$) timeouts. `[CWE-400, Fault Tolerance]`
- [ ] **64. Circuit Breakers & Fallbacks:** Downstream external dependencies wrapped in circuit breakers (Resilience4j) with graceful degradation strategies. `[Resilience Engineering]`
- [ ] **65. Retry Storm Defense:** Retries utilize exponential backoff paired with randomized jitter to prevent self-inflicted denial-of-service. `[Distributed Stability]`
- [ ] **66. Dead Letter Queues (DLQ):** Message consumers route unprocessable or poison messages to DLQs after bounded retries. `[Messaging Resilience]`
- [ ] **67. Idempotency Key Enforcement:** Payment, transfer, and loan disbursement endpoints require unique idempotency keys to prevent duplicate processing. `[Financial Integrity]`
- [ ] **68. Graceful Shutdown Hooks:** Applications intercept `SIGTERM` signals, drain in-flight requests, and cleanly close database pools before exit. `[12-Factor App Discipline]`
- [ ] **69. Standardized API Error Contracts:** Errors returned in RFC 7807 Problem Details format with consistent error codes and tracking IDs. `[API Ergonomics]`
- [ ] **70. Health & Readiness Probes:** Dedicated `/health/liveness` and `/health/readiness` endpoints accurately reflect internal database and queue connectivity. `[Kubernetes Production Readiness]`

---

## 8. Test Suite Confidence & Quality Engineering (Points 71–80)
*Standards: ISO/IEC 29119 Software Testing • DORA Quality Metrics*

- [ ] **71. Assertion Validity:** Every unit test contains at least one meaningful assertion validating state change or return values; zero assertion fraud. `[Test Quality Assurance]`
- [ ] **72. Mock-to-Code Ratio Health:** Unit tests test real domain logic; tests do not mock the internal algorithms being tested. `[Mock Integrity]`
- [ ] **73. Test Independence & Isolation:** Tests run deterministically in random order without shared mutable state or inter-test dependencies. `[Test Reliability]`
- [ ] **74. Flakiness Elimination:** Zero tests relying on arbitrary thread sleeps (`Thread.sleep()`) or external live network services. `[Deterministic Testing]`
- [ ] **75. Boundary & Edge Case Coverage:** Tests explicitly evaluate nulls, empty collections, zero values, negative numbers, and boundary limits. `[Equivalence Partitioning]`
- [ ] **76. Database Integration Slices:** Integration tests execute against real containerized database instances (Testcontainers) rather than in-memory H2 divergence. `[Production Parity]`
- [ ] **77. Contract Boundary Verification:** Automated contract tests (Pact / OpenAPI validation) enforce schema parity between frontend and backend. `[Contract Testing]`
- [ ] **78. Security & Negative Path Tests:** Test suite includes negative assertions verifying that unauthorized roles receive HTTP 403 Forbidden. `[Negative Testing]`
- [ ] **79. Performance Regression Tests:** Critical calculation engines (amortization, interest, NAV) evaluated under benchmark suites to detect regression. `[Performance Testing]`
- [ ] **80. Test Suite Execution Speed:** Developer unit test suite completes in under 3 minutes to maintain rapid feedback loops. `[DORA Feedback Velocity]`

---

## 9. DevOps, CI/CD & Build Determinism (Points 81–90)
*Standards: SLSA Level 3 • CIS Docker & Kubernetes Benchmarks • Twelve-Factor App*

- [ ] **81. Multi-Stage Docker Builds:** Container images built using multi-stage Dockerfiles, leaving build tools and compilers out of final runtime images. `[CIS Docker 4.1]`
- [ ] **82. Non-Root Container Execution:** Containers run under a dedicated unprivileged user (`USER appuser`); zero containers running as root. `[CIS Docker 4.3]`
- [ ] **83. Base Image Pinning & Scanning:** Container base images pinned to specific SHA256 digests or specific patch versions (avoiding `:latest`). `[SLSA L3 Hermetic]`
- [ ] **84. CI Pipeline Gate Enforcement:** CI builds automatically fail if linters, type checks, unit tests, or security audits fail. `[NIST SSDF PO.2.2]`
- [ ] **85. Twelve-Factor Configuration:** All environment-specific settings (database hosts, credentials, log levels) injected via environment variables; zero hardcoding. `[Twelve-Factor III]`
- [ ] **86. Infrastructure-as-Code (IaC) Parity:** Deployment manifests (Terraform, Helm, Kubernetes) version-controlled alongside application code. `[GitOps Discipline]`
- [ ] **87. Zero Secret Infiltration in CI Artifacts:** Build logs and compiled artifacts sanitised against secret token exposure. `[NIST SSDF PS.2.1]`
- [ ] **88. Artifact Immutability:** Built deployment images are immutable, tagged with Git commit SHAs, and promoted across environments without recompilation. `[SLSA L3 Immutable]`
- [ ] **89. Fast CI Feedback:** Full CI build and test pipeline completes in $\le 10$ minutes. `[DORA Lead Time]`
- [ ] **90. Automated Rollback Mechanics:** Deployment pipelines support instant automated rollback upon health check failure. `[Site Reliability Engineering]`

---

## 10. Regulatory, Audit Trail & Statutory Compliance (Points 91–100)
*Standards: Bangladesh Bank BRPD 15/2024 • BFIU e-KYC/AML • IFRS-9 • Basel III • GDPR • PCI-DSS v4.0*

- [ ] **91. Non-Repudiation & Audit Trail:** Every financial transaction, loan status change, and user permission modification records an immutable audit log with operator ID, timestamp, and IP. `[PCI-DSS 10.2]`
- [ ] **92. Financial Arithmetic Precision:** Zero use of IEEE 754 floating-point types (`float`, `double`) in monetary balances, interest accruals, or fee calculations; strict `BigDecimal` / Banker's Rounding enforced. `[Financial Audit Standard]`
- [ ] **93. PII & Sensitive Data Masking:** Passwords, NIDs, bank account numbers, and credit cards masked or tokenized in application logs, database exports, and user interfaces. `[GDPR Art. 32, BFIU AML]`
- [ ] **94. Data Retention & Archival Policies:** Database schemas support soft deletes and regulatory data archiving timelines (e.g. 5–7 years for banking records). `[Statutory Recordkeeping]`
- [ ] **95. Statutory Classification Rules:** (e.g. Bangladesh Bank BRPD 15/2024): Loan classification stages (STD-0 to B/L) and overdue calculation logic match statutory circulars exactly. `[Central Bank Mandate]`
- [ ] **96. AML/CFT Transaction Monitoring:** High-value transactions exceed CTR/STR thresholds trigger automated compliance reporting alerts (BFIU mandates). `[BFIU Circular 25/26/31]`
- [ ] **97. Cryptographic Key Management:** Master keys managed in dedicated HSMs or KMS (HashiCorp Vault, AWS KMS) with automatic annual key rotation. `[NIST SP 800-57]`
- [ ] **98. Tamper-Evident Ledger Integrity:** Financial audit entries cryptographically linked via hash chains or append-only ledgers to prevent retroactive tampering. `[Accounting Non-Repudiation]`
- [ ] **99. Data Residency & Sovereignty:** In-scope customer financial data physically constrained to sovereign database clusters per central bank regulations. `[National ICT Security Guidelines V4.0]`
- [ ] **100. Regular Vulnerability Cadence:** System architecture supports non-intrusive automated vulnerability scanning and quarterly penetration testing. `[ISO 27001 A.12.6.1]`
