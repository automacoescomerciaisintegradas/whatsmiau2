import logging
import re
from datetime import datetime
from typing import Any, List

from core.config_manager import get_config

# =========================
# CONFIGURACAO DE LOG
# =========================
logger = logging.getLogger(__name__)


# =========================
# EXCECOES
# =========================
class SecurityViolation(Exception):
    """Excecao levantada quando um comando viola as regras de seguranca."""


# =========================
# SECURITY GUARD
# =========================
class SecurityGuard:
    """
    Sentinela de seguranca para validacao de comandos perigosos.
    Implementa o Protocolo de Defesa Preditiva.
    """

    DEFAULT_PATTERNS = [
        r"rm\s+-rf\s+/",
        r"DROP\s+TABLE",
        r"DELETE\s+FROM",
        r"TRUNCATE\s+TABLE",
        r"chmod\s+777",
        r"curl.*\|\s*sh",
        r"wget.*\|\s*sh",
    ]

    # Padroes de segredos para evitar exposicao acidental em comandos
    SECRET_PATTERNS = [
        r"AIza[0-9A-Za-z-_]{35}",  # Google API Key
        r"sk-[0-9A-Za-z]{48}",  # OpenAI
        r"sk-ant-api03-[0-9A-Za-z-_]{93}",  # Anthropic
        r"ghp_[0-9A-Za-z]{36}",  # GitHub Personal Access Token
    ]

    def __init__(self):
        self.refresh_config()

    def refresh_config(self):
        """Atualiza as configuracoes do Security Guard a partir do config manager."""
        self.config = get_config()
        self.enabled = self.config.get("dangerousCommandBlocking.enabled", True)
        self.block_secrets = self.config.get("dangerousCommandBlocking.blockSecrets", True)
        self.patterns = self._compile_patterns()
        self.secret_regex = [re.compile(p) for p in self.SECRET_PATTERNS]

    # =========================
    # CONFIG
    # =========================
    def _compile_patterns(self) -> List[re.Pattern]:
        custom = self.config.get("dangerousCommandBlocking.customPatterns", [])
        all_patterns = self.DEFAULT_PATTERNS + custom

        compiled: List[re.Pattern] = []
        for pattern in all_patterns:
            try:
                compiled.append(re.compile(pattern, re.IGNORECASE))
            except re.error as err:
                logger.warning("Regex invalida ignorada: %s | erro: %s", pattern, err)
        return compiled

    # =========================
    # NORMALIZACAO
    # =========================
    def _normalize(self, command: str) -> str:
        return command.strip().lower()

    # =========================
    # CLASSIFICACAO
    # =========================
    def _classify_severity(self, command: str) -> str:
        if any(x in command for x in ["rm -rf", "drop table", "truncate"]):
            return "CRITICO"
        if any(x in command for x in ["delete from", "chmod", "curl", "wget"]):
            return "ALTO"
        return "MEDIO"

    # =========================
    # LOG DE AUDITORIA
    # =========================
    def _log_event(self, command: str, status: str, reason: str, severity: str, user: str):
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "user": user,
            "command": command,
            "status": status,
            "reason": reason,
            "severity": severity,
        }

        if status == "BLOCKED":
            logger.error("[SECURITY GUARD] BLOQUEADO: %s", log_entry)
        else:
            logger.info("[SECURITY GUARD] PERMITIDO: %s", log_entry)

    # =========================
    # VALIDACAO PRINCIPAL
    # =========================
    def validate(self, command: str, user: str = "unknown") -> bool:
        """
        Valida se um comando e seguro para execucao.

        Raises:
            SecurityViolation: Se o comando for considerado perigoso ou contiver segredos.
        """
        if not self.enabled:
            return True

        normalized = self._normalize(command)

        # 1. Verificar padroes de comandos perigosos
        for pattern in self.patterns:
            if pattern.search(normalized):
                severity = self._classify_severity(normalized)
                reason = f"Pattern match: {pattern.pattern}"

                self._log_event(command, "BLOCKED", reason, severity, user)

                raise SecurityViolation(f"[{severity}] Comando bloqueado por seguranca: {reason}")

        # 2. Verificar exposicao de segredos (se habilitado)
        if self.block_secrets:
            for pattern in self.secret_regex:
                if pattern.search(command):  # comando original para preservar case das chaves
                    reason = "Deteccao de segredo/chave de API no comando"
                    self._log_event("[REDACTED COMMAND]", "BLOCKED", reason, "ALTO", user)
                    raise SecurityViolation("[ALTO] Comando bloqueado: Possivel vazamento de segredo detectado.")

        self._log_event(command, "ALLOWED", "No threats detected", "BAIXO", user)
        return True

    # =========================
    # EXECUCAO SEGURA
    # =========================
    def execute(self, command: str, executor_func: Any, user: str = "unknown"):
        """
        Wrapper para execucao segura de comandos.

        executor_func: funcao que executa o comando real.
        """
        try:
            self.validate(command, user=user)
            return executor_func(command)

        except SecurityViolation as err:
            return {
                "status": "blocked",
                "error": str(err),
            }

        except Exception as err:
            logger.exception("Erro na execucao via Security Guard")
            return {
                "status": "error",
                "error": str(err),
            }


# Instancia global para uso em todo o sistema
security_guard = SecurityGuard()

