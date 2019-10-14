#!/bin/bash

export PATH="${HOME}/bin:${PATH}"
export EDITOR='vim'
export GIT_EDITOR='vim'
export GIT_DUET_GLOBAL=true
export GIT_DUET_ROTATE_AUTHOR=true
export LPASS_AGENT_TIMEOUT=$((9 * 3600))
export OPENSSL_PATH="/usr/local/opt/openssl"
export HOMEBREW_NO_GITHUB_API=1
export DYLD_LIBRARY_PATH="$OPENSSL_PATH/lib"
export CFLAGS="-I$OPENSSL_PATH/include"
export LDFLAGS="-L$OPENSSL_PATH/lib"
export BASH_SILENCE_DEPRECATION_WARNING=1

BASH_CONFIG=$(ls -v "${HOME}"/etc/profile.d/*)

for profile_config in $BASH_CONFIG
do
  # shellcheck source=/dev/null
  . "$profile_config"
done
