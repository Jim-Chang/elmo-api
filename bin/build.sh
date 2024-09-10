#!/bin/bash

SCRIPT_DIR=$(dirname "$0")
cd "$SCRIPT_DIR/.."

docker build -t elmo.api:latest -f docker/Dockerfile .
