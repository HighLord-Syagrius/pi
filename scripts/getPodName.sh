#!/bin/sh

namespace=""

show_help() {
	echo "usage TBD"
	echo
	echo "Options"
	echo "  -n <namespace>"
}

while getopts "n:h" opt; do
  case $opt in
    n)
      namespace="$OPTARG"
    ;;
    h)
      show_help
      exit 0
    ;;
    \?)
      echo "invalid option: -$OPTARG" >&2
      show_help
      exit 1
    ;;
  esac
done




getPod() {
  NAMEREGEX=$1
  POD_NAME=$(kubectl get pods -A | awk "/$NAMEREGEX/ {print \$2}")
  echo "$POD_NAME"
}

getPod $1
