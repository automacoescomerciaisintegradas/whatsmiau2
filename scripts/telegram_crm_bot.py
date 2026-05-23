import os
from decimal import Decimal, InvalidOperation

import requests
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes


TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
CRM_BASE_URL = os.getenv("CRM_BASE_URL", "http://localhost:3002").rstrip("/")

# Exemplo: TELEGRAM_ALLOWED_USERS=123456789,987654321
raw_allowed = os.getenv("TELEGRAM_ALLOWED_USERS", "").strip()
ALLOWED_USERS = {
    int(item.strip())
    for item in raw_allowed.split(",")
    if item.strip().isdigit()
}


def _is_authorized(update: Update) -> bool:
    user = update.effective_user
    if user is None:
        return False
    # Se não configurar lista, bloqueia por segurança.
    if not ALLOWED_USERS:
        return False
    return user.id in ALLOWED_USERS


def _fmt_money(value) -> str:
    try:
        amount = Decimal(str(value or 0))
        return f"{amount:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    except (InvalidOperation, TypeError, ValueError):
        return "0,00"


def _normalize(v) -> str:
    return str(v or "").strip()


def buscar_leads(termo: str):
    r = requests.get(f"{CRM_BASE_URL}/api/crm/leads", timeout=12)
    r.raise_for_status()

    data = r.json() if r.content else {}
    leads = data.get("leads", []) if isinstance(data, dict) else []

    termo_low = termo.lower()

    return [
        lead for lead in leads
        if termo_low in _normalize(lead.get("nome")).lower()
        or termo_low in _normalize(lead.get("whatsapp"))
        or termo_low in _normalize(lead.get("email")).lower()
        or termo_low in _normalize(lead.get("empresa")).lower()
        or termo_low in _normalize(lead.get("status")).lower()
    ]


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not _is_authorized(update):
        await update.message.reply_text("Acesso negado.")
        return
    await update.message.reply_text(
        "Bot CRM ativo.\n"
        "Comandos:\n"
        "/buscar <nome|telefone|email|empresa|status>\n"
        "/help"
    )


async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await cmd_start(update, context)


async def buscar(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not _is_authorized(update):
        await update.message.reply_text("Acesso negado.")
        return

    termo = " ".join(context.args).strip()
    if not termo:
        await update.message.reply_text("Use: /buscar nome, telefone, email, empresa ou status")
        return

    try:
        resultados = buscar_leads(termo)
    except requests.RequestException as e:
        await update.message.reply_text(f"Falha ao consultar CRM: {e}")
        return
    except Exception as e:
        await update.message.reply_text(f"Erro inesperado: {e}")
        return

    if not resultados:
        await update.message.reply_text("Nenhum lead encontrado.")
        return

    mensagens = []
    for lead in resultados[:5]:
        mensagens.append(
            f"👤 {_normalize(lead.get('nome')) or '-'}\n"
            f"🏢 {_normalize(lead.get('empresa')) or '-'}\n"
            f"📱 {_normalize(lead.get('whatsapp')) or '-'}\n"
            f"📧 {_normalize(lead.get('email')) or '-'}\n"
            f"💰 R$ {_fmt_money(lead.get('valor'))}\n"
            f"📌 Status: {_normalize(lead.get('status')) or '-'}"
        )

    sufixo = ""
    if len(resultados) > 5:
        sufixo = f"\n\nMostrando 5 de {len(resultados)} resultados."

    await update.message.reply_text("\n\n".join(mensagens) + sufixo)


def main():
    if not TELEGRAM_TOKEN:
        raise RuntimeError("TELEGRAM_BOT_TOKEN não configurado.")
    if not ALLOWED_USERS:
        raise RuntimeError("TELEGRAM_ALLOWED_USERS não configurado.")

    app = ApplicationBuilder().token(TELEGRAM_TOKEN).build()
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("help", cmd_help))
    app.add_handler(CommandHandler("buscar", buscar))
    app.run_polling()


if __name__ == "__main__":
    main()
