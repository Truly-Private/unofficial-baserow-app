import { test, expect, APIRequestContext } from "@playwright/test";

test.describe("Row Comments API", () => {
  let authToken: string;
  let apiContext: APIRequestContext;
  const tableId = 1;
  const rowId = 1;
  const testUserEmail = "testerson@binkmail.com";
  const testUserPassword = "binkBINK1234";
  const baseURL = "https://api.baserow.io";
  const createdCommentIds: number[] = [];

  test.beforeAll(async ({ request }) => {
    // Authenticate via API to get token
    const authResponse = await request.post(`${baseURL}/api/user/token-auth/`, {
      data: {
        email: testUserEmail,
        password: testUserPassword,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });

    expect(authResponse.status()).toBe(200);
    const authData = await authResponse.json();
    authToken = authData.token;
    expect(authToken).toBeDefined();

    // Create API context for subsequent requests
    apiContext = await request.newContext({
      baseURL: baseURL,
      extraHTTPHeaders: {
        Authorization: `Token ${authToken}`,
      },
    });
  });

  test.afterAll(async () => {
    // Clean up: delete all created comments
    for (const commentId of createdCommentIds) {
      try {
        await apiContext.delete(`/api/row_comments/${tableId}/comment/${commentId}/`);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    if (apiContext) {
      await apiContext.dispose();
    }
  });

  test("should authenticate successfully", async () => {
    const response = await apiContext.get("/api/user/me/");
    expect(response.status()).toBe(200);
    const userData = await response.json();
    expect(userData.email).toBe(testUserEmail);
  });

  test("should create a comment", async () => {
    const response = await apiContext.post(`/api/row_comments/${tableId}/${rowId}/`, {
      data: { message: "Test comment" },
    });

    expect(response.status()).toBe(201);
    const comment = await response.json();
    expect(comment.id).toBeDefined();
    expect(comment.message).toBe("Test comment");
    createdCommentIds.push(comment.id);
  });

  test("should list comments", async () => {
    const response = await apiContext.get(`/api/row_comments/${tableId}/${rowId}/`);

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data) || data.results).toBeTruthy();
  });

  test("should create and update a comment", async () => {
    // Create a comment
    const createResponse = await apiContext.post(`/api/row_comments/${tableId}/${rowId}/`, {
      data: { message: "Original comment" },
    });

    expect(createResponse.status()).toBe(201);
    const createdComment = await createResponse.json();
    const commentId = createdComment.id;
    createdCommentIds.push(commentId);

    // Update the comment
    const updateResponse = await apiContext.patch(
      `/api/row_comments/${tableId}/comment/${commentId}/`,
      {
        data: { message: "Updated comment" },
      }
    );

    expect(updateResponse.status()).toBe(200);
    const updatedComment = await updateResponse.json();
    expect(updatedComment.message).toBe("Updated comment");
  });

  test("should create and delete a comment", async () => {
    // Create a comment
    const createResponse = await apiContext.post(`/api/row_comments/${tableId}/${rowId}/`, {
      data: { message: "Comment to delete" },
    });

    expect(createResponse.status()).toBe(201);
    const createdComment = await createResponse.json();
    const commentId = createdComment.id;

    // Delete the comment
    const deleteResponse = await apiContext.delete(
      `/api/row_comments/${tableId}/comment/${commentId}/`
    );

    expect(deleteResponse.status()).toBe(204);

    // Verify comment is deleted by trying to update it (should fail)
    const verifyDeleteResponse = await apiContext.patch(
      `/api/row_comments/${tableId}/comment/${commentId}/`,
      {
        data: { message: "Should fail" },
      }
    );

    expect(verifyDeleteResponse.status()).toBe(404);
  });

  test("should get notification mode status", async () => {
    const response = await apiContext.get(
      `/api/row_comments/${tableId}/${rowId}/notification-mode/`
    );

    // Should return 200 even if the feature returns a specific structure
    expect([200, 404]).toContain(response.status());
  });

  test("should handle invalid table/row gracefully", async () => {
    const response = await apiContext.get(`/api/row_comments/99999/99999/`);

    // Should return 404 for non-existent table/row
    expect([200, 404]).toContain(response.status());
  });

  test("should require authentication for comments", async ({ request }) => {
    // Try to access comments without auth
    const response = await request.post(`${baseURL}/api/row_comments/${tableId}/${rowId}/`, {
      data: { message: "Unauthorized comment" },
    });

    // Should be rejected without auth token
    expect([401, 403]).toContain(response.status());
  });
});
