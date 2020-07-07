#!/bin/bash

VERSION=$(git describe --tags)

docker build -t registry.bearologics.cloud/xcodereleases-telegram-bot:$VERSION .

docker push registry.bearologics.cloud/xcodereleases-telegram-bot:$VERSION