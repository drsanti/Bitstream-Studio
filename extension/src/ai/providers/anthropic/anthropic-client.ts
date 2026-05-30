export interface AnthropicToolDescriptor {
  name: string;
  description: string;
  input_schema: unknown;
}

export type AnthropicMessageContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: unknown }
  // Some Anthropic models can emit `thinking`. We do not expose it verbatim to UI.
  | { type: "thinking"; thinking: string }
  | { type: "redacted_thinking"; data: string };

export interface AnthropicMessagesResponse {
  id: string;
  type: "message";
  role: "assistant";
  model: string;
  content: AnthropicMessageContentBlock[];
  stop_reason: string | null;
  stop_sequence: string | null;
  usage?: { input_tokens?: number; output_tokens?: number };
}

export type AnthropicInputMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; content: Array<{ type: "text"; text: string } | { type: "tool_use"; id: string; name: string; input: unknown }> }
  | { role: "user"; content: Array<{ type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean }> };

export interface AnthropicCreateMessageParams {
  model: string;
  max_tokens: number;
  temperature?: number;
  system?: string;
  messages: AnthropicInputMessage[];
  tools?: AnthropicToolDescriptor[];
}

export class AnthropicClient {
  constructor(private readonly apiKey: string) {}

  async createMessage(params: AnthropicCreateMessageParams): Promise<AnthropicMessagesResponse> {
    const { tools, ...rest } = params;
    const bodyPayload: Record<string, unknown> = { ...rest };
    if (tools != null && tools.length > 0) {
      bodyPayload.tools = tools;
    }
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        // This version header is required by Anthropic.
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(bodyPayload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const hint = (() => {
        if (res.status === 401 || res.status === 403) {
          return " (check ANTHROPIC_API_KEY permissions)";
        }
        if (res.status === 404) {
          return " (model not found; try ANTHROPIC_MODEL=claude-sonnet-4-6)";
        }
        if (res.status === 429) {
          return " (rate limited; retry later)";
        }
        if (res.status >= 500) {
          return " (provider error; retry later)";
        }
        return "";
      })();
      throw new Error(
        `Anthropic API error ${res.status}${hint}: ${text || res.statusText}`,
      );
    }
    return (await res.json()) as AnthropicMessagesResponse;
  }
}

