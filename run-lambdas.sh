#!/usr/bin/env bash
APP_ROOT=$(git rev-parse --show-toplevel)

for i in {1..20}
do
  echo $1?name=$i
  curl --request GET \
    --url $1?name=$i &
done

wait;