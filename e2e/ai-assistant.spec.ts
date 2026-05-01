import { test, expect, type Page } from "@playwright/test";

const authMeta = {
  baseUrl: "https://mock-baserow.test",
  user: {
    id: 7,
    first_name: "E2E",
    username: "ai-tester@example.com",
    email: "ai-tester@example.com",
  },
};

async function seedAuth(page: Page) {
  await page.addInitScript(({ meta }) => {
    window.localStorage.setItem("baserow.auth.meta.v1", JSON.stringify(meta));
    window.localStorage.setItem("baserow_auth_jwt_v1", "fake-jwt-token");
    window.localStorage.setItem("baserow_auth_refresh_v1", "fake-refresh-token");
  }, { meta: authMeta });
}

test.describe("AI Assistant API", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await seedAuth(page);

    await page.route("https://mock-baserow.test/api/workspaces/", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: 42, name: "E2E Workspace", order: 1 },
        ]),
      });
    });

    await page.route("https://mock-baserow.test/api/applications/", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: 77,
            name: "E2E Database",
            type: "database",
            order: 1,
            workspace: { id: 42, name: "E2E Workspace", order: 1 },
            tables: [],
          },
        ]),
      });
    });

    await page.route("https://mock-baserow.test/assistant/chat/?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              id: 11,
              uuid: "chat-e2e-uuid",
              workspace_id: 42,
              title: "E2E Assistant Chat",
              created_at: "2026-05-01T12:00:00Z",
              updated_at: "2026-05-01T12:10:00Z",
            },
          ],
        }),
      });
    });

    await page.route("https://mock-baserow.test/assistant/chat/chat-e2e-uuid/messages/?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          count: 2,
          next: null,
          previous: null,
          results: [
            {
              id: 202,
              role: "assistant",
              message: "You have 3 overdue project tasks.",
              created_at: "2026-05-01T12:02:00Z",
            },
            {
              id: 201,
              role: "user",
              message: "Summarize my workspace",
              created_at: "2026-05-01T12:01:00Z",
            },
          ],
        }),
      });
    });

    await page.route("https://mock-baserow.test/assistant/chat/chat-e2e-uuid/messages/", async (route) => {
      const request = route.request();
      if (request.method() === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ id: 303, content: "Message accepted" }),
        });
        return;
      }
      await route.continue();
    });
  });

  test("opens Kuma AI from the workspace dashboard", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("E2E Workspace", { exact: true })).toBeVisible();
    await expect(page.getByText("Ask Kuma AI")).toBeVisible();
    await page.getByText("Ask Kuma AI").click();

    await expect(page).toHaveURL(/\/ai-chat\/42/);
    await expect(page.getByText("Summarize my workspace")).toBeVisible();
    await expect(page.getByPlaceholder("Ask me anything...")).toBeVisible();
  });

  test("loads an existing assistant chat and message history", async ({ page }) => {
    await page.goto("/(app)/ai-chat/42");

    await expect(page.getByText("Summarize my workspace")).toBeVisible();
    await expect(page.getByText("You have 3 overdue project tasks.")).toBeVisible();
    await expect(page.getByPlaceholder("Ask me anything...")).toBeVisible();
    await expect(page.getByText("Send")).toBeVisible();
  });

  test("sends a message through the assistant API", async ({ page }) => {
    const sentRequests: unknown[] = [];
    await page.route("https://mock-baserow.test/assistant/chat/chat-e2e-uuid/messages/", async (route) => {
      if (route.request().method() === "POST") {
        sentRequests.push(route.request().postDataJSON());
        await route.fulfill({
          status: 200,
          contentType: "text/event-stream",
          body: 'data: {"content":"Here is a useful assistant response."}\n\n',
        });
        return;
      }
      await route.continue();
    });

    await page.goto("/(app)/ai-chat/42");
    await page.getByPlaceholder("Ask me anything...").fill("Create a status report");
    await page.getByText("Send").click();

    await expect(page.getByText("Create a status report")).toBeVisible();
    await expect(page.getByText("Here is a useful assistant response.")).toBeVisible();
    await expect.poll(() => sentRequests.length).toBe(1);
    expect(sentRequests[0]).toMatchObject({
      content: "Create a status report",
      ui_context: { workspace: { id: 42 } },
    });
  });

  test("shows the premium requirement error from the assistant API", async ({ page }) => {
    await page.route("https://mock-baserow.test/assistant/chat/?**", async (route) => {
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Premium subscription required" }),
      });
    });

    await page.goto("/(app)/ai-chat/42");

    await expect(page.getByText("Premium subscription required")).toBeVisible();
    await expect(page.getByText("Dismiss")).toBeVisible();
  });
});
