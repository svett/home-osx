#!/bin/sh

# curl \
#   --key ~/workspace/hippo/certificates/STAR_hippo_engineering.key \
#   --cert ~/workspace/hippo/certificates/STAR_hippo_engineering.crt \
#   "$@"

  # --cacert ~/workspace/hippo/certificates/hippo_engineering_ca.crt \

curl \
  --key ~/workspace/hippo/certificates/hippo.engineering-2020.key \
  --cert ~/workspace/hippo/certificates/hippo.engineering-2020.crt \
  "$@"
