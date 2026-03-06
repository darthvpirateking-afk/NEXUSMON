"""
NEXUSMON Telegram Channel
Operator-bound companion access via Telegram Bot API.
Uses long-polling over httpx — no webhook, no public URL required.
"""
from __future__ import annotations

import asyncio
import logging
import os
from typing import Any

import httpx

logger = logging.getLogger("nexusmon.telegram")

TELEGRAM_API = "https://api.telegram.org/bot{token}/{method}"


class TelegramChannel:
    """Long-poll Telegram bot that routes messages through the companion."""

    def __init__(self, token: str, companion_url: str = "http://localhost:8000/v1/companion/nexusmon") -> None:
        self._token = token
        self._companion_url = companion_url
        self._offset: int = 0
        self._running = False
        self._task: asyncio.Task | None = None
        self._client: httpx.AsyncClient | None = None

    def _url(self, method: str) -> str:
        return TELEGRAM_API.format(token=self._token, method=method)

    async def _call(self, method: str, **kwargs: Any) -> dict:
        assert self._client is not None
        resp = await self._client.post(self._url(method), json=kwargs, timeout=35.0)
        resp.raise_for_status()
        return resp.json()

    async def _send(self, chat_id: int, text: str) -> None:
        try:
            await self._call("sendMessage", chat_id=chat_id, text=text, parse_mode="Markdown")
        except Exception as exc:
            logger.warning("[telegram] send failed: %s", exc)

    async def _get_updates(self) -> list[dict]:
        try:
            data = await self._call(
                "getUpdates",
                offset=self._offset,
                timeout=30,
                allowed_updates=["message"],
            )
            return data.get("result", [])
        except Exception as exc:
            logger.warning("[telegram] getUpdates failed: %s", exc)
            await asyncio.sleep(5)
            return []

    async def _handle_message(self, message: dict) -> None:
        chat_id: int = message["chat"]["id"]
        text: str = message.get("text", "").strip()
        username: str = message.get("from", {}).get("username", "operator")

        if not text:
            return

        # Mode detection from prefix
        mode = "strategic"
        if text.lower().startswith("/combat "):
            mode = "combat"
            text = text[8:].strip()
        elif text.lower().startswith("/guardian "):
            mode = "guardian"
            text = text[10:].strip()
        elif text.lower().startswith("/strategic "):
            mode = "strategic"
            text = text[11:].strip()
        elif text.startswith("/"):
            # Handle slash commands
            await self._handle_command(chat_id, text, username)
            return

        logger.info("[telegram] %s (%d): %s [mode=%s]", username, chat_id, text[:60], mode)
        await self._send(chat_id, "_thinking…_")

        try:
            assert self._client is not None
            resp = await self._client.post(
                self._companion_url,
                json={"prompt": text, "mode": mode},
                timeout=300.0,
            )
            data = resp.json()
            if data.get("error"):
                reply = f"⚠️ `{data['error']}`"
            else:
                tier = data.get("tier_used", "")
                reply_text = data.get("reply", "No response.")
                reply = f"*[{tier}]* {reply_text}" if tier else reply_text
        except Exception as exc:
            reply = f"⚠️ Bridge error: `{exc}`"

        await self._send(chat_id, reply)

    async def _handle_command(self, chat_id: int, text: str, username: str) -> None:
        cmd = text.lower().split()[0]
        if cmd == "/start":
            await self._send(
                chat_id,
                "*NEXUSMON online.*\n\nOperator `{}` connected.\n\n"
                "Send any message to speak with the companion.\n"
                "Prefix with `/combat` or `/strategic` to set mode.\n"
                "`/status` — system health\n"
                "`/xp` — evolution status".format(username),
            )
        elif cmd == "/status":
            try:
                assert self._client is not None
                resp = await self._client.get("http://localhost:8000/api/health/deep", timeout=10.0)
                data = resp.json()
                lines = ["*SYSTEM HEALTH*"]
                for k, v in data.items():
                    if isinstance(v, dict):
                        status = v.get("status", v.get("ok", "?"))
                    else:
                        status = v
                    lines.append(f"`{k}`: {status}")
                await self._send(chat_id, "\n".join(lines))
            except Exception as exc:
                await self._send(chat_id, f"⚠️ Health check failed: `{exc}`")
        elif cmd == "/xp":
            try:
                assert self._client is not None
                resp = await self._client.get("http://localhost:8000/api/avatar/xp", timeout=10.0)
                data = resp.json()
                summary = data.get("summary", data)
                rank = summary.get("rank", "?")
                xp = summary.get("xp", 0)
                to_next = summary.get("xp_to_next_rank", "?")
                missions = summary.get("missions_complete", 0)
                await self._send(
                    chat_id,
                    f"*AVATAR STATUS*\n`{rank}` — {xp:,} XP\n{to_next:,} to next rank\n{missions} missions complete",
                )
            except Exception as exc:
                await self._send(chat_id, f"⚠️ XP fetch failed: `{exc}`")
        else:
            await self._send(chat_id, f"Unknown command `{cmd}`. Send any text to speak with NEXUSMON.")

    async def _poll_loop(self) -> None:
        logger.info("[telegram] long-poll loop started")
        while self._running:
            updates = await self._get_updates()
            for update in updates:
                self._offset = update["update_id"] + 1
                message = update.get("message")
                if message:
                    asyncio.create_task(self._handle_message(message))
        logger.info("[telegram] long-poll loop stopped")

    async def start(self) -> None:
        if self._running:
            return
        self._running = True
        self._client = httpx.AsyncClient()
        # Verify token
        try:
            me = await self._call("getMe")
            name = me.get("result", {}).get("username", "unknown")
            logger.info("[telegram] bot @%s is online", name)
        except Exception as exc:
            logger.error("[telegram] token verification failed: %s", exc)
            self._running = False
            await self._client.aclose()
            return
        self._task = asyncio.create_task(self._poll_loop())

    async def stop(self) -> None:
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        if self._client:
            await self._client.aclose()
        logger.info("[telegram] channel stopped")


# Module-level singleton
_channel: TelegramChannel | None = None


def get_telegram_channel() -> TelegramChannel | None:
    return _channel


async def start_telegram_channel(token: str | None = None) -> TelegramChannel | None:
    global _channel
    tok = token or os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    if not tok:
        logger.info("[telegram] TELEGRAM_BOT_TOKEN not set — channel disabled")
        return None
    _channel = TelegramChannel(tok)
    await _channel.start()
    return _channel
