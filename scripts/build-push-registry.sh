#!/bin/bash

docker build -t registry.bearologics.cloud/xcodereleases-telegram-bot .

docker push registry.bearologics.cloud/xcodereleases-telegram-bot