from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class ChatMessage:
    role: str  # "system" | "user" | "assistant"
    content: str


class AIProvider(ABC):
    """Abstraction so the evaluation/interview/chat engines (future phases) can
    swap between OpenAI and Gemini via ai_configuration without changing call sites."""

    @abstractmethod
    async def generate(self, prompt: str, *, temperature: float = 0.3, max_tokens: int = 2000) -> str:
        raise NotImplementedError

    @abstractmethod
    async def chat(self, messages: list[ChatMessage], *, temperature: float = 0.3, max_tokens: int = 2000) -> str:
        raise NotImplementedError


class OpenAIProvider(AIProvider):
    def __init__(self, api_key: str, model: str = "gpt-4o"):
        self.api_key = api_key
        self.model = model

    async def generate(self, prompt: str, *, temperature: float = 0.3, max_tokens: int = 2000) -> str:
        raise NotImplementedError("Wired up in the AI code review / roadmap generation phase.")

    async def chat(self, messages: list[ChatMessage], *, temperature: float = 0.3, max_tokens: int = 2000) -> str:
        raise NotImplementedError("Wired up in the AI viva / AI chat phase.")


class GeminiProvider(AIProvider):
    def __init__(self, api_key: str, model: str = "gemini-1.5-pro"):
        self.api_key = api_key
        self.model = model

    async def generate(self, prompt: str, *, temperature: float = 0.3, max_tokens: int = 2000) -> str:
        raise NotImplementedError("Wired up in the AI code review / roadmap generation phase.")

    async def chat(self, messages: list[ChatMessage], *, temperature: float = 0.3, max_tokens: int = 2000) -> str:
        raise NotImplementedError("Wired up in the AI viva / AI chat phase.")


def get_ai_provider(*, organization_id: str) -> AIProvider:
    """Future phase: read ai_configuration for organization_id and construct
    the configured provider. Foundation phase does not call this anywhere."""
    raise NotImplementedError("AI provider selection is not implemented in this phase.")
