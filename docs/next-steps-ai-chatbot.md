# Baserow Mobile AI Chatbot — Next Steps

## Current State

Branch: `feat/ai-chatbot`

The AI chatbot work has moved beyond the original research/docs stage. Current implementation includes:

- AI chat UI and floating action button
- Corrected Baserow AI Assistant endpoints and `ui_context` handling
- Workspace/app creation flows
- Template/import workspace flows
- Table creation flow
- Passing TypeScript check via:

```bash
pnpm --dir artifacts/mobile typecheck
```

## Recommended Next Steps

### 1. Manually Verify AI Flows

Test the core flows in the app:

- Login with test credentials
- Open the AI chat screen
- Send basic assistant messages
- Verify workspace creation
- Verify app/database creation
- Verify template/import flows
- Verify table creation
- Confirm the AI chat behaves correctly on mobile/web Expo

### 2. Clean Up Test Scripts

There are several untracked one-off endpoint test scripts in the repo root, including files like:

- `test-ai-api.js`
- `test-ai-correct.js`
- `test-ai-endpoints.js`
- `test-ai-paths.js`
- `test-ai-send*.js`
- `test-workspace-ai.js`

Decide whether to:

- Move useful scripts into `scripts/`
- Convert them into documented developer utilities
- Or delete them before opening/updating the PR

### 3. Polish Natural Language Record Creation

The biggest remaining UX improvement is a confirmation flow before creating rows.

Target flow:

1. User asks AI to create a record.
2. AI parses the intended table and field values.
3. App shows a preview of the proposed record.
4. User taps **Confirm** or edits/cancels.
5. App creates the row via Baserow API.
6. AI confirms success or explains validation errors.

### 4. Improve Error Handling

Add friendly handling for:

- AI Assistant unavailable
- AI Assistant premium feature disabled
- Network failures
- Malformed assistant responses
- Baserow validation errors
- Expired auth/session errors
- Unsupported or ambiguous user requests

### 5. Persist Chat History

Add local chat persistence so reopening the app preserves recent context.

Possible implementation:

- Store recent chat messages in AsyncStorage
- Restore chat state on screen load
- Clear old chat messages after a defined period
- Optionally sync with server-side Baserow assistant chat history

### 6. Open or Update PR

After cleanup and manual verification:

- Commit cleaned-up AI chatbot work
- Push `feat/ai-chatbot`
- Open or update a PR describing:
  - AI chat integration
  - Baserow Assistant endpoint support
  - Workspace/app/table creation flows
  - Remaining known limitations

## Suggested Immediate Next Task

Do **manual verification + repo cleanup** first, then implement the **record preview/confirmation** flow.
