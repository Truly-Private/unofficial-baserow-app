import { test, expect, APIRequestContext } from '@playwright/test';

const API_BASE = 'https://api.baserow.io';
const TEST_EMAIL = 'testerson@binkmail.com';
const TEST_PASSWORD = 'binkBINK1234';

test.describe('User Profile API', () => {
  let authToken: string;
  let apiContext: APIRequestContext;

  test.beforeAll(async ({ request }) => {
    // Authenticate and get token
    const authResponse = await request.post(`${API_BASE}/api/user/token-auth/`, {
      data: {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(authResponse.status()).toBe(200);
    const authData = await authResponse.json();
    authToken = authData.token;

    // Create API request context with auth
    apiContext = await request.newContext({
      baseURL: API_BASE,
      extraHTTPHeaders: {
        Authorization: `Token ${authToken}`,
      },
    });
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test('GET /api/user/account/ returns 200 and user object', async () => {
    const response = await apiContext.get('/api/user/account/');
    
    expect(response.status()).toBe(200);
    
    const user = await response.json();
    
    // Verify user object structure
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('username');
    expect(user).toHaveProperty('first_name');
    expect(user).toHaveProperty('last_name');
    
    // Verify types
    expect(typeof user.id).toBe('number');
    expect(typeof user.email).toBe('string');
    expect(typeof user.username).toBe('string');
  });

  test('PATCH /api/user/account/ with first_name update returns 200', async () => {
    const response = await apiContext.patch('/api/user/account/', {
      data: { first_name: 'Test' },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(response.status()).toBe(200);

    const updatedUser = await response.json();
    expect(updatedUser).toHaveProperty('first_name');
    expect(updatedUser.first_name).toBe('Test');
  });

  test('PATCH /api/user/account/ with last_name update returns 200', async () => {
    const response = await apiContext.patch('/api/user/account/', {
      data: { last_name: 'Testerson' },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(response.status()).toBe(200);

    const updatedUser = await response.json();
    expect(updatedUser).toHaveProperty('last_name');
    expect(updatedUser.last_name).toBe('Testerson');
  });
});
