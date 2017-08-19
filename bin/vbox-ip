#!/bin/bash

for f in $(VBoxManage list runningvms | awk -F\" '{print $2}'); do
  echo "$f:"
  VBoxManage guestproperty enumerate "$f" | grep IP
done
