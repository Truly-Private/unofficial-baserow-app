# AI Chatbot Feature - Create and Add Records

## Overview
Add AI-powered chatbot functionality to the Baserow mobile app that allows users to create and add records using natural language.

## Feature Requirements

### 1. AI Chat Interface
- Floating action button (FAB) to open chat interface
- Chat screen with message history
- Text input for natural language queries
- Support for voice input (optional)

### 2. Natural Language Processing
- Parse user intent (create record, add data, update field)
- Extract field names and values from natural language
- Handle ambiguous requests with clarification prompts
- Support multiple languages

### 3. Record Creation Flow
1. User describes what they want to create
2. AI parses the request and identifies:
   - Target table
   - Field values
   - Missing required fields
3. AI confirms the parsed data with user
4. User approves or modifies
5. Record is created via Baserow API

### 4. Integration Points

#### API Endpoints Needed
```typescript
// AI service endpoint (to be determined - could be OpenAI, Anthropic, or custom)
POST /api/ai/parse-intent
{
  "message": "Add a new task: Review Q4 budget by Friday",
  "context": {
    "tableId": 123,
    "fields": [...],
    "recentRecords": [...]
  }
}

Response:
{
  "intent": "create_record",
  "tableId": 123,
  "fields": {
    "Name": "Review Q4 budget",
    "Due Date": "2026-04-25",
    "Status": "To Do"
  },
  "confidence": 0.95,
  "missingFields": ["Assignee"]
}

// Use existing Baserow API for record creation
POST /api/database/rows/table/{tableId}/
```

#### Mobile Components
```
artifacts/mobile/
├── app/(app)/ai-chat.tsx          # Main chat screen
├── components/
│   ├── AIChatBubble.tsx           # Chat message component
│   ├── AIFloatingButton.tsx       # FAB to open chat
│   ├── RecordPreview.tsx          # Preview before creation
│   └── VoiceInput.tsx             # Voice input (optional)
├── lib/
│   ├── ai-service.ts              # AI API client
│   └── intent-parser.ts           # Parse AI responses
└── hooks/
    └── useAIChat.ts               # Chat state management
```

## Implementation Plan

### Phase 1: Basic Chat UI (Week 1)
- [ ] Create chat screen with message history
- [ ] Add floating action button
- [ ] Implement text input and send functionality
- [ ] Basic message rendering (user/assistant)

### Phase 2: AI Integration (Week 2)
- [ ] Set up AI service (OpenAI/Anthropic/Custom)
- [ ] Implement intent parsing
- [ ] Extract field values from natural language
- [ ] Handle table/field context

### Phase 3: Record Creation (Week 3)
- [ ] Build record preview component
- [ ] Implement confirmation flow
- [ ] Integrate with Baserow create row API
- [ ] Handle validation errors
- [ ] Show success/failure feedback

### Phase 4: Advanced Features (Week 4)
- [ ] Support for updating existing records
- [ ] Batch record creation
- [ ] Voice input integration
- [ ] Chat history persistence
- [ ] Smart suggestions based on table schema

## Technical Considerations

### AI Provider Options
1. **OpenAI GPT-4** - Best for complex parsing, requires API key
2. **Anthropic Claude** - Good balance of cost/performance
3. **Local LLM** - Privacy-focused, runs on device (limited capability)
4. **Custom fine-tuned model** - Optimized for Baserow schema

### Data Privacy
- User data sent to AI provider (requires consent)
- Option to use local processing for sensitive data
- Clear privacy policy and opt-in

### Error Handling
- Graceful degradation if AI service unavailable
- Fallback to manual form entry
- Clear error messages for users

### Performance
- Stream AI responses for better UX
- Cache common intents/patterns
- Optimize API calls (batch when possible)

## Example User Flows

### Flow 1: Simple Record Creation
```
User: "Add a new customer: John Smith, email john@example.com"

AI: "I'll create a new customer record with:
     - Name: John Smith
     - Email: john@example.com
     
     Should I proceed?"

User: "Yes"

AI: "✓ Customer record created successfully!"
```

### Flow 2: Ambiguous Request
```
User: "Add a meeting tomorrow"

AI: "I need a few more details:
     - What time is the meeting?
     - Who should attend?
     - What's the meeting about?"

User: "2pm, with Sarah, about Q4 planning"

AI: "I'll create a meeting record:
     - Title: Q4 Planning
     - Date: 2026-04-26
     - Time: 2:00 PM
     - Attendees: Sarah
     
     Looks good?"

User: "Perfect"

AI: "✓ Meeting scheduled!"
```

## Success Metrics
- Time to create record (target: <30 seconds)
- User satisfaction score
- AI parsing accuracy (target: >90%)
- Adoption rate among users
- Reduction in manual form entry

## Next Steps
1. Choose AI provider and set up API access
2. Design chat UI mockups
3. Implement basic chat interface
4. Build intent parsing logic
5. Integrate with Baserow API
6. User testing and iteration
