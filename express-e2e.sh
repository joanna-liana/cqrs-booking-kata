#!/usr/bin/env bash

yarn install && \
echo "Installed root deps" && \
yarn docker:test && \
echo "Started test docker" && \
cd express && yarn install && RABBIT_PORT=5673 PG_PORT=5435 PG_PASSWORD=postgres yarn start & sleep 5 && \
echo "Installed Express deps & started the app" && \
echo $PWD && \
yarn test:e2e
