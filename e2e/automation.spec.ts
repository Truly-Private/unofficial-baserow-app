import { expect, test, type Page } from "@playwright/test";

const fakeUser = {
  id: 101,
  first_name: "E2E",
  username: "e2e@example.com",
  email: "e2e@example.com",
};

const automationApp = {
  id: 10,
  name: "E2E Automation",
  type: "automation",
  order: 1,
  workspace: { id: 1, name: "E2E Workspace" },
  workflows: [
    { id: 20, name: "Welcome workflow", order: 1, state: "draft", published: false },
    { id: 21, name: "Published workflow", order: 2, state: "published", published: true },
  ],
};

const workflow = {
  id: 20,
  name: "Welcome workflow",
  order: 1,
  state: "draft",
  published: false,
};

const nodes = [
  {
    id: 30,
    name: "Rows created",
    type: "local_baserow_rows_created",
    order: 1,
  },
  {
    id: 31,
    name: "HTTP request",
    type: "http_request",
    order: 2,
    previous_node_id: 30,
  },
];

async function bootstrapSignedInAutomationApi(page: Page) {
  await page.addInitScript(({ user }) => {
    window.localStorage.setItem(
      "baserow.auth.meta.v1",
      JSON.stringify({ baseUrl: "https://api.baserow.io", user }),
    );
    window.localStorage.setItem("baserow_auth_jwt_v1", "e2e-jwt");
    window.localStorage.setItem("baserow_auth_refresh_v1", "e2e-refresh");
  }, { user: fakeUser });

  await page.route("**/api/applications/", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([automationApp]),
    });
  });

  await page.route("**/api/automation/workflows/20/", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(workflow),
    });
  });

  await page.route("**/api/automation/workflow/20/nodes/", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(nodes),
    });
  });

  await page.route("**/api/automation/workflows/20/history/", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([{ id: 40, started_on: "2026-01-01T00:00:00Z", state: "success" }]),
    });
  });
}

test.describe("Automation API screens", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await bootstrapSignedInAutomationApi(page);
  });

  test("loads automation workflows and view controls", async ({ page }) => {
    await page.goto("/(app)/automation/10");

    await expect(page.getByText("Automation")).toBeVisible();
    await expect(page.getByRole("heading", { name: "E2E Automation" })).toBeVisible();
    await expect(page.getByText("2 workflows")).toBeVisible();
    await expect(page.getByText("New workflow")).toBeVisible();
    await expect(page.getByText("Create workflow JSON")).toBeVisible();
    await expect(page.getByText("Cards")).toBeVisible();
    await expect(page.getByText("Table")).toBeVisible();
    await expect(page.getByText("Map")).toBeVisible();
    await expect(page.getByText("Welcome workflow")).toBeVisible();
    await expect(page.getByText("Published workflow")).toBeVisible();
  });

  test("switches automation workflow list into table and map modes", async ({ page }) => {
    await page.goto("/(app)/automation/10");

    await page.getByText("Table").click();
    await expect(page.getByText("Name")).toBeVisible();
    await expect(page.getByText("Status")).toBeVisible();
    await expect(page.getByText("Open").first()).toBeVisible();

    await page.getByText("Map").click();
    await expect(page.getByText("Automation map")).toBeVisible();
    await expect(page.getByText("2 lanes")).toBeVisible();
    await expect(page.getByText("Lane 1 · draft")).toBeVisible();
  });

  test("opens workflow detail with nodes and action controls", async ({ page }) => {
    await page.goto("/(app)/automation/workflow/20?name=Welcome%20workflow&automation=E2E%20Automation");

    await expect(page.getByText("Workflow")).toBeVisible();
    await expect(page.getByText("Welcome workflow")).toBeVisible();
    await expect(page.getByText("2 nodes · Draft")).toBeVisible();
    await expect(page.getByText("New node")).toBeVisible();
    await expect(page.getByText("Test")).toBeVisible();
    await expect(page.getByText("Publish")).toBeVisible();
    await expect(page.getByText("Rows created")).toBeVisible();
    await expect(page.getByText("HTTP request")).toBeVisible();
  });
});
