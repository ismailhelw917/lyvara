import { describe, it, expect } from "vitest";

describe("Facebook API Credentials", () => {
  it("should validate Facebook Page Access Token and Page ID", async () => {
    const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    const pageId = process.env.FACEBOOK_PAGE_ID;

    expect(accessToken).toBeDefined();
    expect(pageId).toBeDefined();

    // Test API call to verify credentials are valid
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}?access_token=${accessToken}`
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBe(pageId);
    expect(data.name).toBeDefined();
  });
});
