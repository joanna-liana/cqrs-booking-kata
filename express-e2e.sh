#!/usr/bin/env bash

yarn install && \
yarn docker:test && \
cd express && yarn install && RABBIT_PORT=5673 PG_PORT=5435 PG_PASSWORD=postgres yarn start & sleep 5 \
cd .. && yarn test:e2e
