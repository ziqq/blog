import type { ServiceDefinition } from './types';

export const SERVICES: ServiceDefinition[] = [
  { key: 'chatgpt', name: 'ChatGPT', host: 'chatgpt.com', vendor: 'OpenAI' },
  { key: 'openai-api', name: 'OpenAI API', host: 'api.openai.com', vendor: 'OpenAI' },
  { key: 'openai-auth', name: 'OpenAI Auth', host: 'auth.openai.com', vendor: 'OpenAI' },
  { key: 'sora', name: 'Sora', host: 'sora.chatgpt.com', vendor: 'OpenAI' },
  { key: 'claude', name: 'Claude', host: 'claude.ai', vendor: 'Anthropic' },
  { key: 'claude-api', name: 'Claude API', host: 'api.anthropic.com', vendor: 'Anthropic' },
  { key: 'claude-console', name: 'Claude Console', host: 'platform.claude.com', vendor: 'Anthropic' },
  { key: 'perplexity', name: 'Perplexity', host: 'www.perplexity.ai', vendor: null },
  { key: 'grok', name: 'Grok', host: 'grok.com', vendor: null },
  { key: 'mistral', name: 'Le Chat', host: 'chat.mistral.ai', vendor: null },
  { key: 'copilot', name: 'Copilot', host: 'copilot.microsoft.com', vendor: null },
  { key: 'midjourney', name: 'Midjourney', host: 'www.midjourney.com', vendor: null },
  { key: 'suno', name: 'Suno', host: 'suno.com', vendor: null },
  { key: 'openrouter', name: 'OpenRouter', host: 'openrouter.ai', vendor: null },
  { key: 'poe', name: 'Poe', host: 'poe.com', vendor: null },
  { key: 'character', name: 'Character.AI', host: 'character.ai', vendor: null },
  { key: 'lmarena', name: 'LMArena', host: 'lmarena.ai', vendor: null },
  { key: 'notion', name: 'Notion', host: 'www.notion.so', vendor: null },
];

export const TRACE_TIMEOUT_MS = 8_000;
export const WEBRTC_TIMEOUT_MS = 6_000;
