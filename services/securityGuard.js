const DEFAULT_PATTERNS = [
  /rm\s+-rf\s+\//i,
  /drop\s+table/i,
  /delete\s+from/i,
  /truncate\s+table/i,
  /chmod\s+777/i,
  /curl.*\|\s*sh/i,
  /wget.*\|\s*sh/i,
];

const SECRET_PATTERNS = [
  /AIza[0-9A-Za-z-_]{35}/,
  /sk-[0-9A-Za-z]{48}/,
  /sk-ant-api03-[0-9A-Za-z-_]{93}/,
  /ghp_[0-9A-Za-z]{36}/,
];

function classifySeverity(raw) {
  const command = String(raw || "").toLowerCase();
  if (command.includes("rm -rf") || command.includes("drop table") || command.includes("truncate")) {
    return "CRITICO";
  }
  if (
    command.includes("delete from") ||
    command.includes("chmod") ||
    command.includes("curl") ||
    command.includes("wget")
  ) {
    return "ALTO";
  }
  return "MEDIO";
}

export class SecurityViolation extends Error {
  constructor(message) {
    super(message);
    this.name = "SecurityViolation";
  }
}

export function validateCommandSecurity(command, args = []) {
  const enabled = String(process.env.DANGEROUS_COMMAND_BLOCKING_ENABLED || "true").toLowerCase() !== "false";
  if (!enabled) return true;

  const commandLine = [command, ...args].join(" ").trim();

  for (const pattern of DEFAULT_PATTERNS) {
    if (pattern.test(commandLine)) {
      const severity = classifySeverity(commandLine);
      throw new SecurityViolation(`[${severity}] comando bloqueado: pattern ${pattern}`);
    }
  }

  const blockSecrets = String(process.env.DANGEROUS_COMMAND_BLOCKING_SECRETS || "true").toLowerCase() !== "false";
  if (blockSecrets) {
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(commandLine)) {
        throw new SecurityViolation("[ALTO] comando bloqueado: possivel vazamento de segredo");
      }
    }
  }

  return true;
}
