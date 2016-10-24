#!/bin/bash

export PATH="${HOME}/bin:${PATH}"
export EDITOR='vim'
export GIT_EDITOR='vim'
export GIT_DUET_GLOBAL=true
export GIT_DUET_ROTATE_AUTHOR=true
export LPASS_AGENT_TIMEOUT=$((9 * 3600))
export DYLD_LIBRARY_PATH="/usr/local/opt/openssl/lib"

for profile_config in ${HOME}/etc/profile.d/*
do
  # shellcheck source=/dev/null
  . "$profile_config"
done
