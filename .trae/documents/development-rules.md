# 开发规则文档

本文档定义了项目的开发规范和最佳实践，确保代码质量和团队协作的一致性。

MANDATORY CHECKLIST BEFORE EACH COMMIT:

Code tested and functional

No emojis in code

Errors corrected

Style consistent with existing code base

No unauthorized new dependencies

Accurate and necessary documentation

Meaningful tests added

Security verified

Acceptable performance

Direct editing of existing files

RULE 1: DIRECT EDITING

NEVER create new files without explicit authorization
ALWAYS edit original files directly
Analyze existing structure before any modification
Preserve the file architecture in place
If testing is needed, create folder and delete once tested
No new code with fix_(original code) pattern
RULE 2: CODE CLEANLINESS

ABSOLUTE PROHIBITION of emojis in code
Follow exactly the existing code base style
Avoid obvious comments ("// add numbers together")
Use only English for code and comments
RULE 3: IMMEDIATE CORRECTION

ALWAYS test and fix EVERY error immediately
Verify existence of methods/APIs before use
Never ignore compilation warnings
Validate that code actually works
Delete test code after testing
RULE 4: CONTEXTUAL ANALYSIS

Analyze ENTIRELY the existing code base before modification
Respect established patterns and conventions
Look for similar examples in the project
Ask for clarifications if context is missing
RULE 5: LOGICAL VERIFICATION

Validate each boolean condition
Write meaningful tests that test business logic
Delete tests once tested
Avoid premature optimizations
Document complex algorithmic decisions
RULE 6: SECURITY FIRST

NEVER hardcoded secrets/API keys
Validate and sanitize ALL user inputs
Use parameterized queries for databases
Apply principle of least privilege
RULE 7: VERSION MANAGEMENT

NEVER change versions without authorization
Use only APIs available in current version
Minimize new dependencies
Check compatibility before adding
RULE 8: PRECISE DOCUMENTATION

Explain the "why", not the "what"
Verify accuracy of any generated documentation
Keep comments concise and useful
Remove dead commented code
RULE 9: MEANINGFUL TESTS

Test business logic, not object existence
Delete tests once tested
Cover error cases and edge cases
Use fixed data, not random data
Validate actual expected behavior
RULE 10: PERFORMANCE CONSCIOUS

Clarity first, optimization second
Properly release resources
Avoid unnecessary complexity
Measure before optimizing
RULE 11: MINIMAL FALLBACK

For fallback: ONLY a clear error message
DO NOT create complex recovery logic
DO NOT mask errors with default data
Let errors bubble up with explicit message
Format: "Error: [clear problem description]"
CORRECT EXAMPLE: Bad: return mockData || fetchFromCache() || getDefaultValues() Good: return error("Service unavailable - Try again later")

RULE 12: REAL DATA ONLY

ALWAYS use database directly
ABSOLUTE PROHIBITION of hardcoded/mocked data
DO NOT create fake data "for testing"
Use real DB queries with real schemas
If no data: display "No data available"