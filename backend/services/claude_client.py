"""
Shared Claude API caller.
Handles streaming SSE responses (DataExpert.io proxy returns SSE by default).
Supports both text and vision (image) inputs.
"""
import base64
import json
import os
import httpx


def call_claude(prompt: str, max_tokens: int = 1024, model: str = "claude-haiku-4-5-20251001") -> str:
    """Call Claude with a text prompt and return the response text."""
    content = [{"type": "text", "text": prompt}]
    return _call(content, max_tokens, model)


def call_claude_vision(image_bytes_list: list, prompt: str, max_tokens: int = 4096) -> str:
    """Call Claude with one or more PNG images + a text prompt (vision mode)."""
    content = []
    for img in image_bytes_list:
        content.append({
            "type": "image",
            "source": {
                "type":       "base64",
                "media_type": "image/png",
                "data":       base64.b64encode(img).decode(),
            },
        })
    content.append({"type": "text", "text": prompt})
    return _call(content, max_tokens, model="claude-haiku-4-5-20251001")


def _call(content: list, max_tokens: int, model: str) -> str:
    api_key  = os.getenv("ANTHROPIC_API_KEY", "")
    base_url = os.getenv("ANTHROPIC_BASE_URL", "https://api.anthropic.com").rstrip("/")
    url      = f"{base_url}/v1/messages"

    headers = {
        "x-api-key":         api_key,
        "anthropic-version": "2023-06-01",
        "content-type":      "application/json",
        "x-session-id":      "finsight",
        "x-correlation-id":  "finsight-session",
    }

    body = {
        "model":      model,
        "max_tokens": max_tokens,
        "messages":   [{"role": "user", "content": content}],
        "metadata":   {"user_id": "finsight"},
    }

    resp = httpx.post(url, headers=headers, json=body, timeout=120)
    resp.raise_for_status()

    raw = resp.text.strip()
    if not raw:
        raise ValueError("Empty response from API proxy")

    if "event:" in raw or raw.startswith(":"):
        return _parse_sse(raw)

    data = json.loads(raw)
    if isinstance(data, dict):
        if "content" in data:
            return data["content"][0]["text"]
        if "text" in data:
            return data["text"]
        if "choices" in data:
            return data["choices"][0].get("message", {}).get("content", "")
    if isinstance(data, str):
        return data

    raise ValueError(f"Unrecognised response: {raw[:300]}")


def _parse_sse(raw: str) -> str:
    parts = []
    for line in raw.splitlines():
        line = line.strip()
        if not line.startswith("data:"):
            continue
        data_str = line[5:].strip()
        if not data_str or data_str == "[DONE]":
            continue
        try:
            data = json.loads(data_str)
        except json.JSONDecodeError:
            continue
        if data.get("type") == "content_block_delta":
            delta = data.get("delta", {})
            if delta.get("type") == "text_delta":
                parts.append(delta.get("text", ""))
    return "".join(parts)
