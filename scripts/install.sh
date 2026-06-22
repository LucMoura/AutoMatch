#!/bin/bash
set -e
rm -rf AutoMatch-Back AutoMatch-Front
git clone https://github.com/AugustoSodre/AutoMatch-Back.git AutoMatch-Back
git clone https://github.com/AugustoSodre/AutoMatch-Front.git AutoMatch-Front
cd AutoMatch-Back && npm ci
cd ../AutoMatch-Front && npm ci
