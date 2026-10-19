---
name: enterprise-tech-writer
description: Creates comprehensive, enterprise-standard technical documentation using a rigorous, token-efficient, mostly sequential process that meets or exceeds Claude Fable 5.1 documentation standards.
---

# Enterprise Technical Documentation Protocol (2026 Fable 5.1 Agentic Standard)

This skill guides the agent to create highly professional, enterprise-grade technical documentation. The output quality must align with or exceed the **Claude Fable 5.1 Autonomous Agent** standard. You will utilize **RFC 2119 Constraints**, **Behavior-Driven Development (BDD) Syntax**, **Zero-Omission Exhaustive Scope**, and **RAG-Ready Markdown**.

## 1. Execution & Concurrency Limits

*   **Micro-Agent Constellation:** Do not exceed 5 concurrent subagents. Use `invoke_subagent` (with `flash` models) for isolated research tasks.
*   **Sequential Workflow:** Favor a mostly sequential workflow to preserve context integrity.
*   **Eliminate Agentic Waste:** Use targeted searches instead of blind full-file dumps.

## 2. Zero-Omission & Exhaustive Depth Policy (MANDATORY)

Enterprise specifications are authoritative technical and functional contracts. You **MUST NOT** substitute high-level bullet summaries for detailed requirements:
1.  **Atomic 1:1 Requirement Mapping:** Every module, sub-feature, counterparty interaction, business rule, and regulatory requirement identified in the discovery phase **MUST** have its own dedicated, atomic requirement record (`REQ-X.X [FRS.X.X.X]`). You **MUST NOT** group requirements into multi-item ranges (e.g., `REQ-2.3 [FRS.2.3.1 - FRS.2.3.6]`).
2.  **Programmatic Audit Cross-Verification:** Before declaring any specification complete, you **MUST** execute a programmatic script cross-referencing all normalized source requirement IDs against the target document to ensure 100% citation and coverage.
3.  **Mathematical & Algorithmic Precision:** All financial calculations, fee sliding scales, amortizations, NAV models, and allocation logic **MUST** be explicitly defined using formal KaTeX mathematical expressions, specifying variables, boundary conditions, and exact accounting journal entries (Debits/Credits).
4.  **End-to-End Lifecycle Modeling:** All multi-step operational workflows (e.g., Order-to-Settlement, Cheque Clearing State Machine, Purchase/Redemption, Corporate Actions, SIP Lifecycle) **MUST** be accompanied by formal Mermaid sequence or state transition diagrams.
5.  **Exhaustive Data & Entity Models:** Core entities, key attributes, foreign-key relationships, and status enumerations **MUST** be documented using formal Mermaid Entity-Relationship (`erDiagram`) models and structured schema dictionaries.

## 3. The Fable 5.1 AI-Ready Specification Standard

To ensure zero instruction drift for autonomous AI coding agents and engineering teams:
1.  **RFC 2119 Constraint Language:** Every functional and non-functional requirement **MUST** be formulated using capitalized IETF RFC 2119 keywords: `MUST`, `MUST NOT`, `REQUIRED`, `SHALL`, `SHALL NOT`, `SHOULD`, `SHOULD NOT`, `RECOMMENDED`, `MAY`, and `OPTIONAL`.
2.  **Behavior-Driven Development (BDD / Gherkin):** Every critical business scenario **MUST** be accompanied by Gherkin scenarios (`Given [Precondition], When [Action], Then [Expected Result]`) covering happy paths, boundary limits, and error/exception states.
3.  **Structured Hierarchy & Tables:** Override Fable 5.1's default tendency toward dense prose by enforcing clear Markdown section hierarchies, summary tables, parameter matrices, and explicit callouts.
4.  **Strategic Product Context:** Include Executive Problem Statements, Target Persona matrices, Measurable OKRs/KPIs, Guardrail Metrics, and Explicit Anti-Scope (Non-Goals).

## 4. RAG-Ready Markdown & Diátaxis Standards

*   **Strict Metadata Frontmatter:** Every markdown document **MUST** start with YAML frontmatter:
    ```yaml
    ---
    type: [tutorial | how-to | reference | explanation]
    topic: [topic]
    target_audience: [executive | product_manager | developer | devops | auditor]
    version: 2026.01
    ---
    ```
*   **Diátaxis Compliance:** Maintain strict classification into Tutorial, How-To, Reference, or Explanation without blurring boundaries.

## 5. Zero-Trust Fact-Checking & Regulatory Grounding Policy

*   Every technical claim, regulatory citation, fee percentage, and system parameter **MUST** be grounded in the source documents or validated external regulations. Never invent numbers, rates, or regulatory rules.
*   **Statutory Tax & Regulatory Grounding:**
    *   **Dividend TDS Schedule (Income Tax Act 2023):** 10% for individual unit holders with verified e-TIN; 15% for individuals without e-TIN; 20% for institutional unit holders.
    *   **CDBL Turnover Fee Tariff:** Exactly 1.75 basis points (0.0175%) on gross equity turnover + 15% statutory VAT.
    *   **BFIU AML/CFT & e-KYC Mandate (Deadline Dec 31, 2026):** Mandatory biometric/face-match and OCR verification, PEP/Sanctions screening, and natural person Beneficial Ownership capture ($\ge 20\%$) under BFIU Circulars 25, 26, and 31.
    *   **BSEC Mutual Fund Rules 2001:** Tripartite segregation of AMC, Trustee, and Custodian; statutory fee sliding scales; prohibition of cross-fund netting; mandatory 85% discounted NAV mutual fund provisions.

## 6. Technical Writing, KaTeX & Mermaid Syntax Safeguards

To prevent syntax rendering failures, escape character corruption, and visual degradation:
1.  **Python Script Generation Safeguards:** When generating or patching markdown documents via Python automation scripts, **ALWAYS** use raw string literals (`r'''...'''`) or double-escaped backslashes (`\\frac`). Unescaped literals evaluate LaTeX sequences as ASCII control characters:
    *   `\frac` evaluates as `\x0c` (Form Feed)
    *   `\begin` evaluates as `\x08` (Backspace)
    *   `\text` and `\times` evaluate as `\t` (Horizontal Tab)
    *   `\right` evaluates as `\r` (Carriage Return)
2.  **Mermaid Diagram Syntax Rules:**
    *   **Supported Diagram Types Only:** Strictly use `flowchart TD`, `flowchart LR`, `sequenceDiagram`, `stateDiagram-v2`, or `erDiagram`.
    *   **Avoid HTML Tags in Labels:** Do not use `<br/>`, `<b>`, or `<i>` inside node labels; use clean plain-text descriptions.
    *   **No Math Delimiters or Special Bullets:** Never place LaTeX math delimiters (`$`, `\le`, `\ge`) or Unicode bullets (`•`) inside Mermaid labels. Use plain comparisons (e.g., `<= 15 mins`, `>= 40%`).
    *   **Quote Special Characters:** Always quote node labels containing parentheses, brackets, or punctuation: `node["Label (Details)"]`.
3.  **Markdown Table Row Integrity:**
    *   Every Markdown table row **MUST** exist entirely on a single logical line starting and ending with `|`. Never allow embedded raw newlines or unescaped carriage returns inside table cells.

## 7. Business Requirements Document (BRD) Standards

In addition to PRD standards, an enterprise BRD **MUST** incorporate:
1.  **Tripartite Governance Architecture:** Explicitly map the statutory separation between Asset Manager, Fund Trustee, and Custodian.
2.  **AS-IS vs. TO-BE Operational Modeling:** Clear comparative analysis detailing operational bottlenecks, manual spreadsheet risks, and automated TO-BE target capabilities.
3.  **Comprehensive Business Traceability Matrix (B-RTM):** Every Business Requirement (`BR-X.X`) must map directly to its corresponding PRD Epic/Requirements (`REQ-X.X`) and baseline Functional Specification (`FRS.X.X.X`).
4.  **RACI Governance Matrix:** Detailed Responsibility, Accountability, Consulted, and Informed mapping across business departments and external counter-parties.

## 8. User Requirements Document (URD / StRS) Standards (ISO/IEC/IEEE 29148:2018)

When authoring a User Requirements Document (URD) or Stakeholder Requirements Specification (StRS):
1.  **Exhaustive Persona Modeling:** Capture deep, realistic user personas spanning external clients (retail, institutional, traditional), front-office managers, middle-office settlement officers, back-office accountants, treasury officers, compliance auditors, and external trustees/custodians.
2.  **End-to-End User Journeys:** Model operational workflows using formal Mermaid sequence, flowchart, and state transition diagrams illustrating human decision points and error states.
3.  **Atomic User Requirements (`UR-X.X`):** Define user stories with RFC 2119 constraints and Gherkin BDD acceptance criteria scenarios (`Given / When / Then`).
4.  **Ergonomics & Accessibility:** Benchmark against Nielsen Norman 10 Usability Heuristics, WCAG 2.1 Level AA accessibility standards, and bilingual localization (English & Bangla).
5.  **User Traceability Matrix (U-RTM):** Maintain 100% bi-directional mapping from `UR-X.X` to `BR-X.X`, `REQ-X.X`, `FRS.X.X.X`, and primary persona.

