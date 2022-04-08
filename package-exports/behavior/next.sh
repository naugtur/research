#!/bin/bash
prev=0
for i in {1..100}; do
    if [ ! -d ./node_modules/pkg$i ]; then
        cp -r ./node_modules/pkg$prev ./node_modules/pkg$i
        sed -i s/pkg[0-9]*/pkg$i/g ./node_modules/pkg$i/package.json
        code ./node_modules/pkg$i/package.json
        exit 0
    fi
    prev=$i
done
