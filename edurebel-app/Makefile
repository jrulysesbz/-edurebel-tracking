.PHONY: export-students export-students-all seed-report
# Resolve repo root to THIS Makefile's directory:
ROOT    := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
APP     ?= http://127.0.0.1:3000
APP_DIR ?= $(ROOT)

PATTERN ?= Seeded Student %
OUT     ?= tmp/students.csv
TS      ?= $(shell date +%Y%m%d-%H%M%S)

export-students:
	@mkdir -p $(ROOT)/tmp
	@APP="$(APP)" APP_DIR="$(APP_DIR)" bash "$(ROOT)/scripts/admin-export.sh" "$(PATTERN)" "$(OUT)"

export-students-all:
	@mkdir -p $(ROOT)/tmp
	@OUT="$(ROOT)/tmp/students-$(TS).csv"; echo "▶ Exporting to $$OUT (pattern: $(PATTERN))"
	@APP="$(APP)" APP_DIR="$(APP_DIR)" bash "$(ROOT)/scripts/admin-export.sh" "$(PATTERN)" "$$OUT"

seed-report:
	@echo "▶ Report (pattern: $(PATTERN))"
	@APP="$(APP)" APP_DIR="$(APP_DIR)" bash "$(ROOT)/scripts/admin-report.sh" '$(PATTERN)'

.PHONY: seed-report-json export-students-open
APP ?= http://127.0.0.1:3000
APP_DIR ?= $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
PATTERN ?= Seeded Student %
OUT ?= tmp/students.csv
seed-report-json:
	@APP="$(APP)" APP_DIR="$(APP_DIR)" bash "$(APP_DIR)/scripts/admin-report-json.sh" '$(PATTERN)'
export-students-open:
	@$(MAKE) export-students APP="$(APP)" PATTERN='$(PATTERN)' OUT='$(OUT)'
	@command -v open >/dev/null 2>&1 && open '$(OUT)' || echo "open(1) not available; file at $(OUT)"

.PHONY: audit
# Fails when seeded rows are present; suitable for CI gating.
APP ?= http://127.0.0.1:3000
APP_DIR ?= $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
PATTERN ?= Seeded Student %
audit:
	@j=$$(APP="$(APP)" APP_DIR="$(APP_DIR)" bash "$(APP_DIR)/scripts/admin-report-json.sh" '$(PATTERN)'); \
	 echo "$$j"; \
	 m=$$(printf '%s' "$$j" | awk -F'"matches":' '{print $$2}' | awk -F'[ ,}]' '{print $$1}'); \
	 test "$$m" -eq 0 || { echo "❌ Audit failed: $$m seeded rows remain"; exit 2; }

.PHONY: audit-since
# Usage: HOURS=24 make audit-since PATTERN='Seeded Student %'
HOURS ?= 24
audit-since:
	@FROM="$$(date -u -v-$(HOURS)H '+%Y-%m-%dT%H:%M:%SZ')" TO="$$(date -u '+%Y-%m-%dT%H:%M:%SZ')" \
	  APP="$(APP)" APP_DIR="$(APP_DIR)" bash "$(APP_DIR)/scripts/admin-report-json.sh" '$(PATTERN)' | \
	  tee tmp/seed-report-last$$(printf '%s' "$(HOURS)")h.json | \
	  awk -F'"matches":' '{print $$2}' | awk -F'[ ,}]' '{print $$1}' | \
	  { read m; test "$$m" -eq 0 || { echo "❌ Audit-since failed: $$m matches in last $(HOURS)h"; exit 2; }; echo "✅ No matches in last $(HOURS)h"; }

.PHONY: audit-all doctor
# doctor is a convenience wrapper for scripts/doctor.sh
APP ?= http://127.0.0.1:3000
APP_DIR ?= $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
PATTERN ?= Seeded Student %
SAMPLE_OUT ?= tmp/sample-latest.csv
SAMPLE_LIMIT ?= 5
SAMPLE_ORDER ?= created_at.desc

doctor:
	@APP="$(APP)" bash "$(APP_DIR)/scripts/doctor.sh"

audit-all: doctor
	@echo "── audit (global) ──"
	@$(MAKE) -s audit PATTERN='$(PATTERN)' || true
	@echo "── audit-since (24h) ──"
	@$(MAKE) -s audit-since PATTERN='$(PATTERN)' HOURS=24 || true
	@echo "── seed-report-json ──"
	@$(MAKE) -s seed-report-json PATTERN='$(PATTERN)' | tee tmp/seed-report-latest.json
	@echo "── export sample ──"
	@$(MAKE) -s export-students PATTERN='%25' LIMIT=$(SAMPLE_LIMIT) ORDER=$(SAMPLE_ORDER) OUT='$(SAMPLE_OUT)'
	@echo "CSV sample → $(SAMPLE_OUT)"

.PHONY: audit-all-school
# Usage: SCHOOL=DEMO make audit-all-school
audit-all-school:
	@echo "── audit-all (school=$(SCHOOL)) ──"
	@SCHOOL="$(SCHOOL)" $(MAKE) -s audit PATTERN='$(PATTERN)' || true
	@SCHOOL="$(SCHOOL)" $(MAKE) -s audit-since PATTERN='$(PATTERN)' HOURS=24 || true
	@SCHOOL="$(SCHOOL)" $(MAKE) -s seed-report-json PATTERN='$(PATTERN)' | tee "tmp/seed-report-$(SCHOOL).json"
	@SCHOOL="$(SCHOOL)" $(MAKE) -s export-students PATTERN='%25' LIMIT=$(SAMPLE_LIMIT) ORDER=$(SAMPLE_ORDER) OUT="tmp/sample-$(SCHOOL).csv"
	@echo "CSV sample → tmp/sample-$(SCHOOL).csv"
