#!/bin/sh

curl \
  --key ~/workspace/hippo/env/dev/certs/hippo.engineering.key \
  --cert ~/workspace/hippo/env/dev/certs/STAR_hippo_engineering.crt \
  "$@"
