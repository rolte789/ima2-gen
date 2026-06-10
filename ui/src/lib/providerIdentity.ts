import type { Provider } from "../types";

export type ProviderFamily = "gpt" | "grok" | "gemini";
export type ProviderMethod = "oauth" | "api-key" | "local-cli";
export type ProviderStatusKind = "oauth" | "api-key" | "local-cli";

export type ProviderIdentity = {
  provider: Provider;
  company: "OpenAI" | "xAI" | "Google";
  product: "GPT" | "Grok" | "Gemini";
  method: ProviderMethod;
  methodLabel: string;
  compactLabel: string;
  longLabel: string;
  detailLabel: string;
  family: ProviderFamily;
  statusKind: ProviderStatusKind;
  accentVar: string;
};

export const PROVIDER_IDENTITIES: Record<Provider, ProviderIdentity> = {
  oauth: {
    provider: "oauth",
    company: "OpenAI",
    product: "GPT",
    method: "oauth",
    methodLabel: "OAuth",
    compactLabel: "GPT OAuth",
    longLabel: "OpenAI GPT OAuth",
    detailLabel: "Codex login",
    family: "gpt",
    statusKind: "oauth",
    accentVar: "--provider-gpt-accent",
  },
  api: {
    provider: "api",
    company: "OpenAI",
    product: "GPT",
    method: "api-key",
    methodLabel: "API",
    compactLabel: "GPT API",
    longLabel: "OpenAI GPT API",
    detailLabel: "OpenAI key",
    family: "gpt",
    statusKind: "api-key",
    accentVar: "--provider-gpt-accent",
  },
  grok: {
    provider: "grok",
    company: "xAI",
    product: "Grok",
    method: "oauth",
    methodLabel: "OAuth",
    compactLabel: "Grok OAuth",
    longLabel: "xAI Grok OAuth",
    detailLabel: "Local proxy",
    family: "grok",
    statusKind: "oauth",
    accentVar: "--provider-grok-accent",
  },
  "grok-api": {
    provider: "grok-api",
    company: "xAI",
    product: "Grok",
    method: "api-key",
    methodLabel: "API",
    compactLabel: "Grok API",
    longLabel: "xAI Grok API",
    detailLabel: "xAI key",
    family: "grok",
    statusKind: "api-key",
    accentVar: "--provider-grok-accent",
  },
  agy: {
    provider: "agy",
    company: "Google",
    product: "Gemini",
    method: "local-cli",
    methodLabel: "CLI",
    compactLabel: "Gemini CLI",
    longLabel: "Google Gemini CLI",
    detailLabel: "Antigravity",
    family: "gemini",
    statusKind: "local-cli",
    accentVar: "--provider-gemini-accent",
  },
  "gemini-api": {
    provider: "gemini-api",
    company: "Google",
    product: "Gemini",
    method: "api-key",
    methodLabel: "API",
    compactLabel: "Gemini API",
    longLabel: "Google Gemini API",
    detailLabel: "Google key",
    family: "gemini",
    statusKind: "api-key",
    accentVar: "--provider-gemini-accent",
  },
};

export const PROVIDER_COLUMNS: Array<{
  family: ProviderFamily;
  header: string;
  providers: Provider[];
}> = [
  { family: "gpt", header: "GPT", providers: ["oauth", "api"] },
  { family: "grok", header: "Grok", providers: ["grok", "grok-api"] },
  { family: "gemini", header: "Gemini", providers: ["agy", "gemini-api"] },
];

export function getProviderIdentity(provider: Provider): ProviderIdentity {
  return PROVIDER_IDENTITIES[provider];
}
