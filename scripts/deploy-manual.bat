@echo off
REM ============================================
REM Deploy Docker Images to VPS - COM SENHA
REM WhatsMiau2 - Automações Comerciais  
REM ============================================

set VPS_HOST=144.91.118.78
set VPS_USER=root
set TEMP_DIR=%TEMP%\docker-deploy

echo.
echo ======================================================
echo    DEPLOY DOCKER IMAGES TO VPS - WhatsMiau2
echo    (Este script vai pedir sua senha varias vezes)
echo ======================================================
echo.
echo VPS: %VPS_USER%@%VPS_HOST%
echo.

REM Criar diretório temporário
if not exist "%TEMP_DIR%" mkdir "%TEMP_DIR%"

REM Passo 1: Exportar whatsmiau2
echo.
echo [1/5] Exportando whatsmiau2:latest...
docker save -o "%TEMP_DIR%\whatsmiau2.tar" whatsmiau2:latest
if errorlevel 1 (
    echo [ERRO] Falha ao exportar whatsmiau2!
    pause
    exit /b 1
)
echo [OK] whatsmiau2 exportado!

REM Passo 2: Exportar qrserver
echo.
echo [2/5] Exportando qrserver:latest...
docker save -o "%TEMP_DIR%\qrserver.tar" qrserver:latest 2>nul
if errorlevel 1 (
    echo [AVISO] qrserver nao encontrado, pulando...
)

REM Passo 3: Criar diretório remoto e enviar arquivos
echo.
echo [3/5] Criando diretorio remoto (digite sua senha)...
ssh %VPS_USER%@%VPS_HOST% "mkdir -p /tmp/docker-images"

echo.
echo [4/5] Enviando imagens (pode demorar alguns minutos)...
echo       Enviando whatsmiau2.tar...
scp "%TEMP_DIR%\whatsmiau2.tar" %VPS_USER%@%VPS_HOST%:/tmp/docker-images/

if exist "%TEMP_DIR%\qrserver.tar" (
    echo       Enviando qrserver.tar...
    scp "%TEMP_DIR%\qrserver.tar" %VPS_USER%@%VPS_HOST%:/tmp/docker-images/
)

REM Passo 4: Carregar imagens na VPS
echo.
echo [5/5] Carregando imagens no Docker da VPS...
ssh %VPS_USER%@%VPS_HOST% "docker load -i /tmp/docker-images/whatsmiau2.tar && docker load -i /tmp/docker-images/qrserver.tar 2>/dev/null; rm -rf /tmp/docker-images; docker images | head -5"

REM Limpar local
echo.
echo Limpando arquivos temporarios locais...
rd /s /q "%TEMP_DIR%" 2>nul

echo.
echo ======================================================
echo    IMAGENS ENVIADAS COM SUCESSO!
echo ======================================================
echo.
echo Proximo passo - Execute na VPS:
echo   docker stack deploy -c /opt/whatsmiau2/docker-compose.swarm.yml whatsmiau2
echo.
pause
