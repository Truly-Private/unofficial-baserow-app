/**
 * AI Service for natural language processing and intent parsing
 * Supports multiple AI providers (OpenAI, Anthropic, local)
 */

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface ParsedIntent {
  intent: 'create_record' | 'update_record' | 'query_data' | 'unknown';
  tableId?: number;
  tableName?: string;
  fields: Record<string, any>;
  confidence: number;
  missingFields?: string[];
  clarificationNeeded?: boolean;
  clarificationPrompt?: string;
}

export interface AIServiceConfig {
  provider: 'openai' | 'anthropic' | 'local';
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export class AIService {
  private config: AIServiceConfig;
  private conversationHistory: AIMessage[] = [];

  constructor(config: AIServiceConfig) {
    this.config = config;
  }

  /**
   * Parse user message and extract intent
   */
  async parseIntent(
    message: string,
    context: {
      tableId?: number;
      tableName?: string;
      fields?: Array<{ id: number; name: string; type: string }>;
      recentRecords?: any[];
    }
  ): Promise<ParsedIntent> {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: message,
      timestamp: Date.now(),
    });

    // Build system prompt with context
    const systemPrompt = this.buildSystemPrompt(context);

    try {
      const response = await this.callAI(systemPrompt, message);
      
      // Parse AI response
      const parsed = this.parseAIResponse(response, context);
      
      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: JSON.stringify(parsed),
        timestamp: Date.now(),
      });

      return parsed;
    } catch (error) {
      console.error('AI service error:', error);
      return {
        intent: 'unknown',
        fields: {},
        confidence: 0,
        clarificationNeeded: true,
        clarificationPrompt: "I'm having trouble understanding. Could you rephrase that?",
      };
    }
  }

  /**
   * Build system prompt with table context
   */
  private buildSystemPrompt(context: any): string {
    let prompt = `You are an AI assistant helping users create and manage records in a Baserow database.

Your job is to:
1. Understand user intent (create, update, or query records)
2. Extract field names and values from natural language
3. Ask for clarification when needed
4. Return structured JSON responses

`;

    if (context.tableName) {
      prompt += `Current table: ${context.tableName}\n`;
    }

    if (context.fields && context.fields.length > 0) {
      prompt += `\nAvailable fields:\n`;
      context.fields.forEach((field: any) => {
        prompt += `- ${field.name} (${field.type})\n`;
      });
    }

    prompt += `\nRespond with JSON in this format:
{
  "intent": "create_record" | "update_record" | "query_data" | "unknown",
  "fields": { "fieldName": "value", ... },
  "confidence": 0.0-1.0,
  "clarificationNeeded": boolean,
  "clarificationPrompt": "question to ask user if needed"
}`;

    return prompt;
  }

  /**
   * Call AI provider API
   */
  private async callAI(systemPrompt: string, userMessage: string): Promise<string> {
    switch (this.config.provider) {
      case 'openai':
        return this.callOpenAI(systemPrompt, userMessage);
      case 'anthropic':
        return this.callAnthropic(systemPrompt, userMessage);
      case 'local':
        return this.callLocalLLM(systemPrompt, userMessage);
      default:
        throw new Error(`Unsupported AI provider: ${this.config.provider}`);
    }
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(systemPrompt: string, userMessage: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          ...this.conversationHistory.slice(-5), // Last 5 messages for context
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Call Anthropic API
   */
  private async callAnthropic(systemPrompt: string, userMessage: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-3-sonnet-20240229',
        max_tokens: 500,
        system: systemPrompt,
        messages: [
          ...this.conversationHistory.slice(-5),
          { role: 'user', content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  /**
   * Call local LLM (placeholder for future implementation)
   */
  private async callLocalLLM(systemPrompt: string, userMessage: string): Promise<string> {
    // TODO: Implement local LLM integration
    // This could use a lightweight model running on-device
    throw new Error('Local LLM not yet implemented');
  }

  /**
   * Parse AI response into structured intent
   */
  private parseAIResponse(response: string, context: any): ParsedIntent {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and normalize
      return {
        intent: parsed.intent || 'unknown',
        tableId: context.tableId,
        tableName: context.tableName,
        fields: parsed.fields || {},
        confidence: parsed.confidence || 0.5,
        missingFields: parsed.missingFields,
        clarificationNeeded: parsed.clarificationNeeded || false,
        clarificationPrompt: parsed.clarificationPrompt,
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return {
        intent: 'unknown',
        fields: {},
        confidence: 0,
        clarificationNeeded: true,
        clarificationPrompt: 'Could you provide more details?',
      };
    }
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Get conversation history
   */
  getHistory(): AIMessage[] {
    return [...this.conversationHistory];
  }
}
