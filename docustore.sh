#!/bin/bash

# DocuStore Query Helper Script
# Usage: ./docustore.sh [command] [args...]

cd "$(dirname "$0")/.."
npm run docustore "$@"
