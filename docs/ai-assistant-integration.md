# AI Assistant Integration Plan

## Overview
Integrate Baserow's AI Assistant (Kuma) into the mobile app to enable natural language record creation and data manipulation.

## API Endpoints

Based on Baserow REST API documentation:

### 1. List Assistant Chats
```
GET /api/assistant/workspace/{workspace_id}/chats/
```
Lists all AI assistant chat sessions for a workspace.

### 2. Send Message to Assistant
```
POST /api/assistant/workspace/{workspace_id}/chat/{chat_id}/messages/
```
Send a message to the AI assistant and get a response.

**Request Body:**
```json
{
  "message": "Create a new task with title 'Review Q1 reports' and due date tomorrow"
}
```

**Response:**
```json
{
  "id": 123,
  "message": "I've created a new task...",
  "created_at": "2026-04-25T01:30:00Z",
  "role": "assistant"
}
```

### 3. Alternative Endpoint (UUID-based)
```
POST /assistant/chat/{chat_uuid}/messages/
```
Similar functionality with UUID-based chat identification.

### 4. Cancel Message Generation
```
DELETE /assistant/chat/{chat_uuid}/messages/
```
Cancel an ongoing AI response generation.

### 5. Submit Feedback
```
PUT /assistant/messages/{message_id}/feedback/
```
Provide thumbs up/down feedback on AI responses.

## Implementation Plan

### Phase 1: API Client Extension
Extend `artifacts/mobile/lib/baserow.ts` with AI assistant methods:

```typescript
// AI Assistant types
export interface AssistantChat {
  id: string;
  uuid: string;
  workspace_id: number;
  created_at: string;
  updated_at: string;
}

export interface AssistantMessage {
  id: number;
  message: string;
  role: 'user' | 'assistant';
  created_at: string;
}

// New methods
async listAssistantChats(workspaceId: number): Promise<AssistantChat[]>
async sendAssistantMessage(workspaceId: number, chatId: string, message: string): Promise<AssistantMessage>
async cancelAssistantMessage(chatUuid: string): Promise<void>
```

### Phase 2: UI Components

#### 2.1 AI Chat Screen
New screen: `artifacts/mobile/app/(app)/ai-chat/[workspaceId].tsx`

Features:
- Chat interface with message bubbles
- Text input for natural language queries
- Loading indicator during AI processing
- Error handling for failed requests

#### 2.2 Quick Actions
Add AI assistant quick actions to table screen:
- Floating action button with AI icon
- Quick prompts: "Add a row", "Summarize data", "Find duplicates"
- Voice input support (optional)

#### 2.3 Context-Aware Prompts
When viewing a table, pre-populate context:
```
"You are viewing the [Table Name] table with fields: [field1, field2, ...]"
```

### Phase 3: Features

#### 3.1 Record Creation
User: "Create a new customer named John Doe with email john@example.com"
AI: Parses intent → Creates row via API → Confirms action

#### 3.2 Data Queries
User: "Show me all tasks due this week"
AI: Generates filter → Applies to view → Returns results

#### 3.3 Bulk Operations
User: "Mark all completed tasks as archived"
AI: Identifies rows → Performs bulk update → Reports results

#### 3.4 Data Analysis
User: "What's the average project duration?"
AI: Analyzes data → Returns insights

### Phase 4: Mobile-Specific Enhancements

1. **Offline Queue**: Store AI requests when offline, sync when online
2. **Voice Input**: Integrate speech-to-text for hands-free operation
3. **Shortcuts**: iOS Shortcuts / Android App Actions integration
4. **Notifications**: Push notifications for long-running AI operations

## Technical Considerations

### Authentication
- Reuse existing JWT token from Baserow API client
- Handle token refresh for long chat sessions

### State Management
- Store chat history locally (AsyncStorage)
- Sync with server on app launch
- Clear old chats after 30 days

### Error Handling
- Network errors: Retry with exponential backoff
- AI errors: Show user-friendly messages
- Rate limiting: Queue requests, show wait time

### Performance
- Stream AI responses for better UX (if API supports SSE/WebSocket)
- Cache common queries
- Debounce user input

## Next Steps

1. Test AI Assistant API with test credentials
2. Implement basic API client methods
3. Create minimal chat UI
4. Add to existing table screen as feature flag
5. Iterate based on testing

## References
- Baserow AI Product Page: https://baserow.io/product/baserow-ai
- REST API Docs: https://baserow.io/docs/apis/rest-api
- AI Assistant Endpoints: https://api.baserow.io/api/redoc/#tag/AI-Assistant
