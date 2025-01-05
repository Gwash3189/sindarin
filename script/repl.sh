#! /bin/bash

function run() {
  deno run repl
  exit_status=$?
  if [ $exit_status -eq 5 ]; then
      run
  else
    exit $exit_status
  fi
}

run

