import os
from typing import Optional

import requests


class LlmConfigurationError(RuntimeError):
    pass


class LlmProviderError(RuntimeError):
    pass


def get_env_value(name: str) -> str:
    value = os.getenv(name)

    if not value:
        raise LlmConfigurationError(
            f"{name} is not configured on the backend server."
        )

    return value


def generate_groq_answer(
    prompt: str,
    max_output_tokens: int = 500,
    temperature: float = 0.2,
    api_key: Optional[str] = None,
) -> str:
    key = api_key or get_env_value("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are an aviation analytics assistant for a research dashboard. "
                    "Explain results clearly. Do not invent numbers. "
                    "Only use the dashboard context provided by the backend. "
                    "State limitations when relevant. "
                    "Do not provide operational ATC instructions."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        "temperature": temperature,
        "max_tokens": max_output_tokens,
    }

    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=30,
    )

    if response.status_code != 200:
        raise LlmProviderError(
            f"Groq API request failed with status {response.status_code}: {response.text}"
        )

    data = response.json()

    try:
        return data["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError, TypeError) as error:
        raise LlmProviderError(
            "Groq API response did not contain a valid text answer."
        ) from error


def generate_llm_answer(
    prompt: str,
    max_output_tokens: int = 500,
    temperature: float = 0.2,
) -> str:
    return generate_groq_answer(
        prompt=prompt,
        max_output_tokens=max_output_tokens,
        temperature=temperature,
    )


if __name__ == "__main__":
    answer = generate_llm_answer(
        "Explain in one sentence what an aviation analytics dashboard does."
    )
    print(answer)