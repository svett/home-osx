#!/bin/bash

export PATH="${HOME}/bin:${PATH}"

for profile_config in ${HOME}/etc/profile.d/*
do
  # shellcheck source=/dev/null
  . "$profile_config"
done
