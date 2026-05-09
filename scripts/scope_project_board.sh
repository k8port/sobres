#!/usr/bin/env bash
set -euo pipefail

# Scope GitHub Project board items to SOBRES MVP definitions.
#
# Default behavior is dry-run (prints planned commands).
# Use --apply to execute mutations.
#
# Requirements:
# - gh CLI authenticated with project scopes.
# - jq available in PATH.

OWNER="k8port"
PROJECT_NUMBER="9"
REPO="k8port/sobres"
PROJECT_ID=""

STATUS_FIELD_ID="PVTSSF_lAHOAHbreM4A_J4szgyV68g"
STATUS_READY_OPTION_ID="61e4505c"

MVP_ISSUES=(4 5 6 7 8 19 37 38 41 43 44 54 55 56 57 58)
POST_MVP_ISSUES=(2 3 9 10)
MISSING_ON_BOARD_ISSUES=(54 55 56 57 58)

DRY_RUN=1

usage() {
  cat <<'EOF'
Usage:
  scripts/scope_project_board.sh [--apply] [--owner <owner>] [--project <number>] [--repo <owner/repo>]

Options:
  --apply             Execute changes (default is dry-run)
  --owner <owner>     GitHub project owner (default: k8port)
  --project <number>  GitHub project number (default: 9)
  --repo <owner/repo> Target repository for scoped board items (default: k8port/sobres)
  -h, --help          Show help
EOF
}

log() {
  printf '%s\n' "$*"
}

run_cmd() {
  if [[ "$DRY_RUN" -eq 1 ]]; then
    log "DRY-RUN: $*"
  else
    eval "$@"
  fi
}

require_tool() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "Missing required tool: $1"
    exit 1
  fi
}

join_by_pipe() {
  local IFS='|'
  echo "$*"
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --apply)
        DRY_RUN=0
        shift
        ;;
      --owner)
        OWNER="$2"
        shift 2
        ;;
      --project)
        PROJECT_NUMBER="$2"
        shift 2
        ;;
      --repo)
        REPO="$2"
        shift 2
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        log "Unknown argument: $1"
        usage
        exit 1
        ;;
    esac
  done
}

ensure_labels() {
  local label_name="$1"
  local color="$2"
  local description="$3"

  run_cmd "GH_PAGER=cat gh label create '$label_name' -R '$REPO' --color '$color' --description '$description' 2>/dev/null || true"
}

apply_labels() {
  local label_name="$1"
  shift
  local issues=("$@")

  for n in "${issues[@]}"; do
    run_cmd "GH_PAGER=cat gh issue edit '$n' -R '$REPO' --add-label '$label_name' >/dev/null"
  done
}

remove_non_repo_items() {
  local json
  json="$(GH_PAGER=cat gh project item-list "$PROJECT_NUMBER" --owner "$OWNER" --limit 200 --format json)"

  mapfile -t ids < <(echo "$json" | jq -r --arg repo "https://github.com/${REPO}" '.items[] | select(.repository != $repo) | .id')

  if [[ ${#ids[@]} -eq 0 ]]; then
    log "No out-of-scope repository items found."
    return
  fi

  for item_id in "${ids[@]}"; do
    run_cmd "GH_PAGER=cat gh project item-delete '$PROJECT_NUMBER' --owner '$OWNER' --id '$item_id' >/dev/null"
  done
}

add_missing_issues_to_board() {
  local json
  json="$(GH_PAGER=cat gh project item-list "$PROJECT_NUMBER" --owner "$OWNER" --limit 200 --format json)"

  local issue
  for issue in "${MISSING_ON_BOARD_ISSUES[@]}"; do
    if echo "$json" | jq -e --argjson n "$issue" '.items[] | select(.content.number == $n)' >/dev/null; then
      log "Issue #$issue already on project board; skipping add."
      continue
    fi
    run_cmd "GH_PAGER=cat gh project item-add '$PROJECT_NUMBER' --owner '$OWNER' --url 'https://github.com/${REPO}/issues/${issue}' >/dev/null"
  done
}

set_ready_status_for_issues() {
  local regex
  regex="^($(join_by_pipe "${MISSING_ON_BOARD_ISSUES[@]}"))$"

  local json
  json="$(GH_PAGER=cat gh project item-list "$PROJECT_NUMBER" --owner "$OWNER" --limit 200 --format json)"

  mapfile -t item_ids < <(echo "$json" | jq -r --arg re "$regex" '.items[] | select(.content.number != null) | select((.content.number|tostring) | test($re)) | .id')

  for item_id in "${item_ids[@]}"; do
    run_cmd "GH_PAGER=cat gh project item-edit --id '$item_id' --project-id '$PROJECT_ID' --field-id '$STATUS_FIELD_ID' --single-select-option-id '$STATUS_READY_OPTION_ID' >/dev/null"
  done
}

summary() {
  local json
  json="$(GH_PAGER=cat gh project item-list "$PROJECT_NUMBER" --owner "$OWNER" --limit 200 --format json)"

  echo "$json" | jq '{
    total: .totalCount,
    nonTargetRepo: [.items[] | select(.repository != ("https://github.com/" + $repo)) | .title],
    scopedIssues: [.items[]
      | select(.content.number != null)
      | select((.content.number == 54) or (.content.number == 55) or (.content.number == 56) or (.content.number == 57) or (.content.number == 58))
      | {number: .content.number, status: .status}
    ]
  }' --arg repo "$REPO"
}

main() {
  parse_args "$@"

  require_tool gh
  require_tool jq

  log "Project scope automation"
  log "Owner: $OWNER"
  log "Project: $PROJECT_NUMBER"
  log "Repo scope: $REPO"
  if [[ "$DRY_RUN" -eq 1 ]]; then
    log "Mode: dry-run"
  else
    log "Mode: apply"
  fi

  PROJECT_ID="$(GH_PAGER=cat gh project view "$PROJECT_NUMBER" --owner "$OWNER" --format json --jq '.id')"

  ensure_labels "post-mvp" "D4C5F9" "Deferred beyond MVP"
  ensure_labels "mvp" "0E8A16" "In MVP scope"

  apply_labels "post-mvp" "${POST_MVP_ISSUES[@]}"
  apply_labels "mvp" "${MVP_ISSUES[@]}"

  remove_non_repo_items
  add_missing_issues_to_board
  set_ready_status_for_issues

  log "Final board summary:"
  summary
}

main "$@"
