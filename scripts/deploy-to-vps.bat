@echo off
REM ============================================
REM Deploy Docker Images to VPS - WhatsMiau2
REM Script simples para deploy rápido
REM ============================================

set VPS_HOST=144.91.118.78
set VPS_USER=root
set TEMP_DIR=%TEMP%\docker-deploy

echo.
echo ======================================================
echo    DEPLOY DOCKER IMAGES TO VPS - WhatsMiau2
echo ======================================================
echo.
echo VPS: %VPS_USER%@%VPS_HOST%
echo.

REM Criar diretório temporário
if not exist "%TEMP_DIR%" mkdir "%TEMP_DIR%"

REM Testar conexão SSH
echo [1/6] Testando conexao SSH...
ssh -o ConnectTimeout=10 %VPS_USER%@%VPS_HOST% "echo SSH_OK" >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Falha na conexao SSH!
    echo Verifique se a chave SSH esta configurada.
    pause
    exit /b 1
)
echo [OK] Conexao SSH funcionando!

REM Verificar Docker na VPS
echo.
echo [2/6] Verificando Docker na VPS...
ssh %VPS_USER%@%VPS_HOST% "docker --version"

REM Exportar whatsmiau2
echo.
echo [3/6] Exportando whatsmiau2:latest...
docker save -o "%TEMP_DIR%\whatsmiau2_latest.tar" whatsmiau2:latest
if errorlevel 1 (
    echo [ERRO] Falha ao exportar whatsmiau2!
    pause
    exit /b 1
)
echo [OK] whatsmiau2 exportado!

REM Exportar qrserver
echo.
echo [4/6] Exportando qrserver:latest...
docker save -o "%TEMP_DIR%\qrserver_latest.tar" qrserver:latest
if errorlevel 1 (
    echo [AVISO] qrserver nao encontrado, pulando...
)

REM Criar diretório remoto
echo.
echo [5/6] Transferindo para VPS...
ssh %VPS_USER%@%VPS_HOST% "mkdir -p /tmp/docker-images"

REM Transferir arquivos
echo Enviando whatsmiau2_latest.tar...
scp "%TEMP_DIR%\whatsmiau2_latest.tar" %VPS_USER%@%VPS_HOST%:/tmp/docker-images/
if exist "%TEMP_DIR%\qrserver_latest.tar" (
    echo Enviando qrserver_latest.tar...
    scp "%TEMP_DIR%\qrserver_latest.tar" %VPS_USER%@%VPS_HOST%:/tmp/docker-images/
)

REM Carregar imagens na VPS
echo.
echo [6/6] Carregando imagens no Docker da VPS...
ssh %VPS_USER%@%VPS_HOST% "docker load -i /tmp/docker-images/whatsmiau2_latest.tar"
ssh %VPS_USER%@%VPS_HOST% "docker load -i /tmp/docker-images/qrserver_latest.tar" 2>nul

REM Limpar
echo.
echo Limpando arquivos temporarios...
ssh %VPS_USER%@%VPS_HOST% "rm -rf /tmp/docker-images"
rd /s /q "%TEMP_DIR%" 2>nul

echo.
echo ======================================================
echo    DEPLOY CONCLUIDO!
echo ======================================================
echo.
echo Imagens na VPS:
ssh %VPS_USER%@%VPS_HOST% "docker images | head -5"
echo.
echo Proximo passo:
echo   ssh %VPS_USER%@%VPS_HOST% "docker stack deploy -c /opt/whatsmiau2/docker-compose.swarm.yml whatsmiau2"
echo.
pause
