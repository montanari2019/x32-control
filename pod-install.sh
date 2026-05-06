#!/bin/bash

unameOut="$(uname -s)"

echo "$unameOut"

if [ "$unameOut" = "Darwin" ] && [ -z "${CI}" ]; then
    cd ios || exit 1
    bundle install
    bundle exec pod install
fi
