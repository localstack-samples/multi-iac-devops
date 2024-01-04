#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Check if MAPPING_DIR_NAME and CI_TEST_NAME are set
if [ -z "${MAPPING_DIR_NAME}" ] || [ -z "${CI_TEST_NAME}" ]; then
  echo "MAPPING_DIR_NAME and CI_TEST_NAME must be set"
  exit 1
fi

# cd to mount directory
cd ${MAPPING_DIR_NAME}

# Initialize Python env
eval "$(pyenv init --path)"
pyenv global 3.10

# Create Python virtual environment and install dependencies
python3 -m venv .venv
source .venv/bin/activate
pip3 install --no-cache-dir -r /tmp/requirements.txt

# Replace current shell with the CI test script 
exec ${CI_TEST_NAME}
