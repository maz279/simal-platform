# Surgical Search & Forensic Command Cookbook

This cookbook provides token-efficient, high-precision search recipes for Principal Codebase Auditors. Every command is optimized to return maximum diagnostic signal while consuming minimal LLM context tokens.

---

## 1. Ripgrep (`rg`) Surgical Sweeps

### 1.1 Secret & Credential Scanning
```bash
# Scan for API keys, bearer tokens, private keys, and passwords (capped at 120 chars per line)
rg -n -M 120 -i "(api_key|apikey|secret_key|private_key|auth_token|bearer\s+[a-zA-Z0-9_\-\.]{20,}|password\s*=\s*['\"][^'\"]+['\"])" \
  --glob "!*.min.*" --glob "!*lock*" --glob "!*.map" .
```

### 1.2 Swallowed Exceptions & Silent Failures
```bash
# Java / TypeScript / C#: Find empty catch blocks or catch blocks that only comment or printStackTrace
rg -n -U -C 1 "catch\s*\([^\)]+\)\s*\{\s*(\/\/.*|\/\*.*\*\/|\s*|e\.printStackTrace\(\);)\s*\}" \
  --glob "*.java" --glob "*.ts" --glob "*.js" --glob "*.cs" .
```

```bash
# Python: Find bare 'except:' or 'except Exception: pass'
rg -n "except(\s+Exception)?\s*:\s*(pass|\.\.\.)" --glob "*.py" .
```

### 1.3 SQL Injection Vectors
```bash
# Find raw string concatenation in SQL queries (Java, TypeScript, Python, Go)
rg -n -i "(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE).*(\+|\$\{).*(FROM|WHERE|\;|\")" \
  --glob "*.java" --glob "*.ts" --glob "*.py" --glob "*.go" .
```

### 1.4 Financial Floating-Point Math
```bash
# Detect double or float used for financial monetary calculations
rg -n -i "\b(double|float)\s+(interest|balance|principal|rate|amount|fee|penalty|tax|total|due|credit|debit)\b" \
  --glob "*.java" --glob "*.cs" --glob "*.go" .
```

### 1.5 Dangerous Functions & Execution
```bash
# Find eval, exec, innerHTML, MD5/SHA1, Math.random for crypto
rg -n -w "(eval|exec|dangerouslySetInnerHTML|createHash\(['\"]md5['\"]\)|MessageDigest\.getInstance\(['\"]MD5['\"]\)|Math\.random\(\))" .
```

### 1.6 Hardcoded Localhost & IP Addresses
```bash
# Find hardcoded IPv4 addresses and localhost strings (excluding tests and comments)
rg -n "\b(https?://)?(127\.0\.0\.1|localhost|0\.0\.0\.0|(192\.168\.\d+\.\d+)|(10\.\d+\.\d+\.\d+))\b" \
  --glob "!*test*" --glob "!*spec*" --glob "!*.md" .
```

### 1.7 ORM N+1 & Lazy Fetching Hazards
```bash
# Spring Data / Hibernate: Search for FetchType.EAGER or missing fetch joins in queries
rg -n "(fetch\s*=\s*FetchType\.EAGER|@OneToMany(?!.*mappedBy))" --glob "*.java" .
```

### 1.8 Unbounded Pagination Hazards
```bash
# Find endpoints accepting unvalidated page size parameters
rg -n -i "(size|limit|pageSize)\s*=\s*(1000|5000|10000|Integer\.MAX_VALUE)" .
```

---

## 2. Git Forensic History & Churn Analysis

### 2.1 File Volatility Ranking (Top 15 Most Churned Files)
```powershell
# Windows PowerShell:
git log --name-only --format="" | Where-Object { $_ -ne "" -and $_ -notmatch "(lock|\.min\.|package\.json|\.md)" } | Group-Object | Sort-Object Count -Descending | Select-Object -First 15 Count, Name
```

```bash
# Bash / Linux / macOS:
git log --name-only --format='' | grep -v '^$' | grep -vE '(lock|\.min\.|package\.json|\.md)' | sort | uniq -c | sort -nr | head -n 15
```

### 2.2 Hotspot Analysis (Files with High Commit Churn & High LOC)
Files with both high churn (frequent edits) and large file size are prime defect candidates:
```bash
# List top 10 largest code files
find . -type f \( -name "*.java" -o -name "*.ts" -o -name "*.py" -o -name "*.go" \) \
  -not -path "*/node_modules/*" -not -path "*/target/*" \
  -exec wc -l {} + | sort -nr | head -n 15
```

### 2.3 Author Concentration (Bus Factor Risk)
```bash
# Check commit distribution by author
git shortlog -sn --no-merges -n 10
```

### 2.4 Recent Emergency Bug Fix Density
```bash
# Search recent commit messages for bug/fix/hotfix/revert/patch
git log --oneline --grep="fix\|bug\|hotfix\|revert\|patch" -n 25
```

---

## 3. Dependency & Supply Chain Auditing

### 3.1 Node / TypeScript Ecosystem
```bash
# Audit dependencies for known vulnerabilities (JSON summary)
npm audit --json

# Check for outdated packages
npm outdated

# Detect circular dependencies in TypeScript
npx -y madge --circular --extensions ts,tsx src/
```

### 3.2 Java / Maven / Gradle Ecosystem
```bash
# Gradle: Check dependency tree for conflicts or CVEs
./gradlew dependencyCheckAnalyze --info

# Maven: List dependency updates
mvn versions:display-dependency-updates
```

### 3.3 Python Ecosystem
```bash
# Scan installed packages for vulnerabilities
pip-audit --format json

# Check for outdated packages
pip list --outdated
```

---

## 4. Docker & Container Security Probes

### 4.1 Root User Check
```bash
# Verify if Dockerfile defines an unprivileged user
rg -n -i "USER\s+" --glob "*Dockerfile*" .
```

### 4.2 Multi-Stage Build Check
```bash
# Count FROM statements (multi-stage builds should have >= 2)
rg -n "^FROM\s+" --glob "*Dockerfile*" .
```

### 4.3 Pinned Base Image Tags
```bash
# Check for unpinned or :latest base images
rg -n "^FROM\s+.*(:latest|(?<!:[\w\.\-]+)$)" --glob "*Dockerfile*" .
```

---

## 5. Architectural Boundary & Cyclic Sweep

### 5.1 Presentation Layer Bypassing Domain
```bash
# Search for Controllers directly importing Repositories/Mappers
rg -n "import.*(Repository|Mapper|Dao)" --glob "*Controller*.java" --glob "*controller*.ts" .
```

### 5.2 Domain Core Leaking Infrastructure Dependencies
```bash
# Search for Domain entities or services importing Spring/HTTP/SQL packages
rg -n "import\s+(org\.springframework\.web|jakarta\.servlet|javax\.servlet|java\.sql)" \
  --glob "*/domain/**/*.java" .
```

### 5.3 Monorepo Deep Internal Imports
```bash
# Detect imports bypassing package public index
rg -n "from\s+['\"][^'\"]*/(src|internal)/[^'\"]*['\"]" --glob "*.ts" --glob "*.tsx" .
```
