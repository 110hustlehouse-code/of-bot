interface ProcessMessagePayload {
  fanId: string;
  creatorId: string;
  messageText: string;
  chatUrl: string;
}

interface ProcessMessageResponse {
  reply: string;
  shouldSend: boolean;
  heatScore: number;
  phase: string;
}

interface SessionStats {
  messagesProcessed: number;
  conversions: number;
  revenue: number;
}

export class AuraApiClient {
  private baseUrl: string;
  private token: string;

  private constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  static async create(): Promise<AuraApiClient> {
    return new Promise((resolve) => {
      chrome.storage.local.get(["aura_api_url", "aura_token"], (result) => {
        const baseUrl = (result.aura_api_url as string) || "https://api.aurafullsuite.it";
        const token = (result.aura_token as string) || "";
        resolve(new AuraApiClient(baseUrl, token));
      });
    });
  }

  async processMessage(payload: ProcessMessagePayload): Promise<ProcessMessageResponse> {
    return this.fetch<ProcessMessageResponse>("/api/v1/messages/process", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async activateTakeover(fanId: string, creatorId: string): Promise<void> {
    await this.fetch<void>("/api/v1/takeover/activate", {
      method: "POST",
      body: JSON.stringify({ fanId, creatorId }),
    });
  }

  async deactivateTakeover(fanId: string, creatorId: string): Promise<void> {
    await this.fetch<void>("/api/v1/takeover/deactivate", {
      method: "POST",
      body: JSON.stringify({ fanId, creatorId }),
    });
  }

  async getSessionStats(creatorId: string): Promise<SessionStats> {
    return this.fetch<SessionStats>(`/api/v1/stats/session?creatorId=${encodeURIComponent(creatorId)}`);
  }

  private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    };

    const response = await globalThis.fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers as Record<string, string> | undefined),
      },
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "Unknown error");
      throw new Error(`API ${response.status}: ${errorBody}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return response.json() as Promise<T>;
    }

    return undefined as unknown as T;
  }
}
