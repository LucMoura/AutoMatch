#!/bin/bash
# Deploy das correcoes para o Vercel
# Executar da raiz do projeto: bash scripts/deploy.sh

set -e

echo "=== Commitando AutoMatch-Back ==="
cd AutoMatch-Back
git add -A
git commit -m "fix: suporte a autenticacao Supabase sem SERVICE_KEY + getAuthClientFromRequest"
cd ..

echo "=== Commitando AutoMatch-Front ==="
cd AutoMatch-Front
git add -A
git commit -m "fix: navegacao admin, car-details dinamico, auth service sem race condition"
cd ..

echo "=== Commitando raiz ==="
git add -A
git commit -m "fix: auditoria geral match e admin - RLS policies, navigation, auth"

echo "=== Push ==="
git push --recurse-submodules=on-demand

echo "=== Feito! ==="
