#!/bin/bash

VERSION=$(git describe --tags)

docker build -t registry.digitalocean.com/bearologics-cloud/xcodereleases-telegram-bot:$VERSION .

docker push registry.digitalocean.com/bearologics-cloud/xcodereleases-telegram-bot:$VERSION