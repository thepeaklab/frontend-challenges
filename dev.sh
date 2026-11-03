#!/usr/bin/env sh
# Wrapper around the docker dev environment of the web app.
# Usage: ./dev.sh <command> [args]
set -e
cd "$(dirname "$0")"

COMPOSE="docker compose"

usage() {
  cat <<USAGE
Usage: ./dev.sh <command> [args]

  setup           build the dev image and install dependencies
  start           start the dev server on http://localhost:5173 (detached)
  stop            stop all containers
  logs            follow the dev server logs
  install [pkg]   npm install (optionally a package) inside the container
  build           production build into web/dist
  preview         serve the production build on http://localhost:5173
  test            run unit tests (vitest)
  typecheck       run the TypeScript compiler
  e2e             run playwright end-to-end tests against a production build
  npm <args>      run any npm command inside the container
  sh              open a shell inside the container
  clean           remove containers, volumes and build output
USAGE
}

run() { $COMPOSE run --rm web "$@"; }

cmd="${1:-help}"
[ $# -gt 0 ] && shift

case "$cmd" in
  setup)     $COMPOSE build web && run npm install ;;
  start)     $COMPOSE up -d web && echo "Dev server: http://localhost:5173" ;;
  stop)      $COMPOSE down ;;
  logs)      $COMPOSE logs -f web ;;
  install)   run npm install "$@" ;;
  build)     run npm run build ;;
  preview)   run npm run build && $COMPOSE run --rm -p 5173:5173 web npm run preview -- --host 0.0.0.0 --port 5173 ;;
  test)      run npm run test -- "$@" ;;
  typecheck) run npm run typecheck ;;
  e2e)       run npm run build && $COMPOSE --profile test run --rm e2e npx playwright test "$@" ;;
  npm)       run npm "$@" ;;
  sh)        $COMPOSE run --rm web sh ;;
  clean)     $COMPOSE down -v && rm -rf web/dist ;;
  help|-h|--help) usage ;;
  *) echo "Unknown command: $cmd"; usage; exit 1 ;;
esac
