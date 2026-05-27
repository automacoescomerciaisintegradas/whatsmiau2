import json
import os
from pathlib import Path
from typing import Any, Dict, Optional


class ConfigView(dict):
    """Dict com suporte a leitura por chave com notação em ponto."""

    def get(self, key: str, default: Optional[Any] = None) -> Any:
        if key in self:
            return super().get(key, default)

        if "." not in key:
            return super().get(key, default)

        current: Any = self
        for part in key.split("."):
            if not isinstance(current, dict) or part not in current:
                return default
            current = current[part]
        return current


def _to_bool(value: str, default: bool) -> bool:
    if value is None:
        return default
    normalized = str(value).strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True
    if normalized in {"0", "false", "no", "off"}:
        return False
    return default


def _load_json_file(path: Path) -> Dict[str, Any]:
    if not path.exists():
        return {}
    try:
        raw = path.read_text(encoding="utf-8")
        data = json.loads(raw)
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def get_config() -> ConfigView:
    """
    Retorna configuração consolidada para o SecurityGuard.

    Fontes (ordem de prioridade):
    1) data/settings.json
    2) variáveis de ambiente
    """
    project_root = Path(__file__).resolve().parent.parent
    settings_path = project_root / "data" / "settings.json"

    cfg = ConfigView(_load_json_file(settings_path))

    # Mantém compatibilidade com configuração "flat" e "nested".
    # Exemplo nested:
    # {
    #   "dangerousCommandBlocking": {
    #     "enabled": true,
    #     "blockSecrets": true,
    #     "customPatterns": []
    #   }
    # }
    nested = cfg.get("dangerousCommandBlocking", {})
    if not isinstance(nested, dict):
        nested = {}

    enabled = _to_bool(
        os.getenv("DANGEROUS_COMMAND_BLOCKING_ENABLED"),
        bool(cfg.get("dangerousCommandBlocking.enabled", nested.get("enabled", True))),
    )
    block_secrets = _to_bool(
        os.getenv("DANGEROUS_COMMAND_BLOCKING_BLOCK_SECRETS"),
        bool(cfg.get("dangerousCommandBlocking.blockSecrets", nested.get("blockSecrets", True))),
    )

    custom_patterns = cfg.get("dangerousCommandBlocking.customPatterns", nested.get("customPatterns", []))
    if isinstance(custom_patterns, str):
        custom_patterns = [p.strip() for p in custom_patterns.split(",") if p.strip()]
    if not isinstance(custom_patterns, list):
        custom_patterns = []

    # Env opcional para append de padrões sem editar arquivo.
    extra_patterns = os.getenv("DANGEROUS_COMMAND_BLOCKING_CUSTOM_PATTERNS", "")
    if extra_patterns.strip():
        custom_patterns.extend([p.strip() for p in extra_patterns.split(",") if p.strip()])

    cfg["dangerousCommandBlocking"] = {
        **nested,
        "enabled": enabled,
        "blockSecrets": block_secrets,
        "customPatterns": custom_patterns,
    }

    # Também expõe chaves "flat" para compatibilidade total.
    cfg["dangerousCommandBlocking.enabled"] = enabled
    cfg["dangerousCommandBlocking.blockSecrets"] = block_secrets
    cfg["dangerousCommandBlocking.customPatterns"] = custom_patterns

    return cfg

