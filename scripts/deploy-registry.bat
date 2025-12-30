@echo off
REM ============================================
REM Deploy via Registry - RAPIDO!
REM WhatsMiau2 - Automações Comerciais
REM ============================================

set VPS_HOST=144.91.118.78
set VPS_USER=root
set STACK_NAME=whatsmiau2

echo.
echo ======================================================
echo    DEPLOY VIA REGISTRY - WhatsMiau2
echo    (Muito mais rapido que transferir arquivos!)
echo ======================================================
echo.

REM Passo 1: Enviar docker-compose
echo [1/4] Enviando docker-compose.swarm.yml...
scp docker-compose.swarm.yml %VPS_USER%@%VPS_HOST%:/opt/whatsmiau2/

REM Passo 2: Criar volumes na VPS
echo.
echo [2/4] Criando volumes...
ssh %VPS_USER%@%VPS_HOST% "docker volume create whatsmiau2_data 2>/dev/null; docker volume create qrserver_data 2>/dev/null; docker volume create whatsmiau2_redis_data 2>/dev/null; echo OK"

REM Passo 3: Pull das imagens
echo.
echo [3/4] Baixando imagens do registry (isso e rapido!)...
ssh %VPS_USER%@%VPS_HOST% "docker pull ghcr.io/automacoescomerciaisintegradas/whatsmiau2:latest && docker pull ghcr.io/automacoescomerciaisintegradas/whatsmiau2-web:latest"

REM Passo 4: Deploy do stack
echo.
echo [4/4] Fazendo deploy do stack...
ssh %VPS_USER%@%VPS_HOST% "cd /opt/whatsmiau2 && docker stack deploy -c docker-compose.swarm.yml %STACK_NAME%"

echo.
echo ======================================================
echo    DEPLOY CONCLUIDO!
echo ======================================================
echo.
echo Verificando servicos...
ssh %VPS_USER%@%VPS_HOST% "docker stack services %STACK_NAME%"
echo.
echo URLs:
echo   API: http://%VPS_HOST%:8085
echo   QR:  http://%VPS_HOST%:3001
echo.
pause
