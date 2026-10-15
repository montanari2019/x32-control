#!/bin/bash

unameOut="$(uname -s)"

echo "$unameOut"

if [ "$unameOut" = "Darwin" ] && [ -z "${CI}" ]; then
    cd ios || exit 1
    export BUNDLE_PATH="vendor/bundle"
    bundle install
    bundle exec pod install
fi
