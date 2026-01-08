#!/bin/bash
CID=$(docker ps -q -f name=whatsmiau2_qrserver | head -n 1)
echo "Updating Container: $CID"
docker cp /tmp/server.js $CID:/app/
docker cp /tmp/services/. $CID:/app/services/
docker cp /tmp/new_public/. $CID:/app/public/
docker restart $CID
