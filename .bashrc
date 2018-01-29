#!/bin/bash

export PATH="${HOME}/bin:${PATH}"
export EDITOR='vim'
export GIT_EDITOR='vim'
export GIT_DUET_GLOBAL=true
export GIT_DUET_ROTATE_AUTHOR=true
export LPASS_AGENT_TIMEOUT=$((9 * 3600))
export DYLD_LIBRARY_PATH="/usr/local/opt/openssl/lib"
export HOMEBREW_NO_GITHUB_API=1

for profile_config in ${HOME}/etc/profile.d/*
do
  # shellcheck source=/dev/null
  . "$profile_config"
done

export PATH="$HOME/.cargo/bin:$PATH"
