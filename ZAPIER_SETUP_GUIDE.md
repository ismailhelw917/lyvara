# Zapier Automation Setup Guide

## Quick Start: 5 Steps to Automate Backlinks & Partnerships

### Step 1: Get Your Webhook URLs

1. Log in to your Manus dashboard
2. Go to your project settings
3. Call the endpoint: `GET /api/trpc/zapier.getWebhookUrls`
4. Copy the three webhook URLs provided

**Or manually construct them:**
```
https://lyvarajewels.com/api/trpc/zapier.onBlogPostPublished
https://lyvarajewels.com/api/trpc/zapier.onPartnershipOpportunity
https://lyvarajewels.com/api/trpc/zapier.onBacklinkFound
```

### Step 2: Create Zapier Account

1. Go to [zapier.com](https://zapier.com)
2. Sign up for a free account
3. Click "Create a Zap"

### Step 3: Set Up First Automation (Guest Post Outreach)

**Trigger Setup:**
1. Search for "Webhooks by Zapier"
2. Select "Catch Hook"
3. Copy this webhook URL into Zapier:
   ```
   https://lyvarajewels.com/api/trpc/zapier.onBlogPostPublished
   ```
4. Click "Test Trigger"
5. Publish a blog post on your site to test

**Action Setup:**
1. Add action: "Gmail" or "Outlook"
2. Compose email to jewelry blog editors:
   ```
   Subject: Guest Post Opportunity - [Blog Post Title]
   
   Hi [Blog Name] Team,
   
   I've created a comprehensive guide on [topic]. I think your readers would love it!
   
   [Blog Post Title]
   [URL]
   
   Would you be interested in featuring this as a guest post?
   
   Best regards,
   LYVARA JEWELS Team
   ```
3. Set up email list of jewelry blogs (50-100 contacts)
4. Turn on the Zap

### Step 4: Set Up Second Automation (Social Media Syndication)

**Trigger:** Blog post published (same as above)

**Actions:**
1. Add "Twitter/X" action
2. Post: "[Blog Title] - New guide on jewelry styling tips. Read more: [URL] #jewelry #fashion"
3. Add "LinkedIn" action
4. Post: "Just published: [Blog Title]. Check out our latest insights on [topic]"
5. Add "Pinterest" action
6. Create pin with blog title and link
7. Add "Facebook" action
8. Share blog post

### Step 5: Set Up Third Automation (Directory Submissions)

**Trigger:** Blog post published

**Actions:**
1. Add "Google Sheets" action
2. Create new row with:
   - Blog Title
   - URL
   - Category
   - Date Published
   - Status: "Pending Submission"
3. Manually review and submit to directories:
   - DMOZ
   - Jewelry.com
   - Fashion directories
   - Lifestyle directories

---

## Advanced Automations

### Automation 6: Influencer Outreach

**Trigger:** Blog post with styling tips published

**Setup:**
1. Use "Webhooks by Zapier" trigger
2. Action: "Gmail" to send influencer outreach emails
3. Template:
   ```
   Subject: Collaboration Opportunity - [Blog Title]
   
   Hi [Influencer Name],
   
   Love your content on [topic]! I created a guide that complements your style.
   
   [Blog Title]: [URL]
   
   Would you be interested in sharing this with your followers?
   
   Best,
   LYVARA JEWELS
   ```

### Automation 7: Podcast Guest Pitches

**Trigger:** Expert article published

**Setup:**
1. Use "Webhooks by Zapier" trigger
2. Action: "Gmail" to podcast hosts
3. Template:
   ```
   Subject: Guest Expert for Your Podcast - [Topic]
   
   Hi [Podcast Host],
   
   I'm an expert in jewelry and would love to be a guest on your podcast.
   
   Topic: [Blog Title]
   [URL]
   
   Let me know if you're interested!
   ```

### Automation 8: Broken Link Building

**Trigger:** Daily (or weekly)

**Setup:**
1. Use "Schedule by Zapier" trigger
2. Action: "Check My Links" (Chrome extension integration)
3. Find broken links on competitor sites
4. Action: "Gmail" to send replacement suggestions
5. Template:
   ```
   Subject: Broken Link Fix - [Your Topic]
   
   Hi [Website Owner],
   
   I noticed you have a broken link on [page]. I have a great resource on that topic:
   
   [Your Blog Title]: [URL]
   
   Would you consider linking to it?
   ```

### Automation 9: Press Release Distribution

**Trigger:** Major milestone (100 posts, 1 year anniversary)

**Setup:**
1. Use "Schedule by Zapier" trigger
2. Action: "PRWeb" to distribute press release
3. Action: "eReleasesonline" to distribute
4. Action: "PR.com" to distribute
5. Action: "Gmail" to notify media contacts

### Automation 10: Partnership CRM Update

**Trigger:** Partnership opportunity found

**Setup:**
1. Use "Webhooks by Zapier" trigger
2. Action: "Airtable" or "Google Sheets" to create new record
3. Fields:
   - Partner Name
   - Partner Type (influencer, brand, blog, podcast)
   - Contact Email
   - Website
   - Relevance Score
   - Status (prospect, contacted, negotiating, active)
   - Estimated Value
4. Action: "Gmail" to send follow-up reminders

---

## Webhook Payload Examples

### Blog Post Published Webhook

```json
{
  "id": "post-123",
  "title": "The Ultimate Guide to Gold Jewelry Care",
  "slug": "ultimate-guide-gold-jewelry-care",
  "url": "https://lyvarajewels.com/blog/ultimate-guide-gold-jewelry-care",
  "excerpt": "Learn how to care for your gold jewelry...",
  "content": "Full blog post content...",
  "keywords": ["gold jewelry care", "cleaning gold", "jewelry maintenance"],
  "category": "care_tips",
  "heroImageUrl": "https://cdn.example.com/image.jpg",
  "publishedAt": "2026-03-31T10:55:00Z",
  "domain": "lyvarajewels.com"
}
```

### Partnership Opportunity Webhook

```json
{
  "partnerName": "Jewelry Influencer Sarah",
  "partnerType": "influencer",
  "contactEmail": "sarah@example.com",
  "website": "https://sarahjewelry.com",
  "socialHandle": "@sarahjewelry",
  "followers": 50000,
  "relevanceScore": 92,
  "proposedCollaboration": "Feature our gold jewelry guide on her Instagram",
  "estimatedValue": 5000
}
```

### Backlink Found Webhook

```json
{
  "sourceUrl": "https://fashionblog.com/article",
  "targetUrl": "https://lyvarajewels.com/blog/gold-jewelry-trends",
  "anchorText": "luxury gold jewelry",
  "domain": "fashionblog.com",
  "domainAuthority": 52,
  "referralTraffic": 150,
  "foundAt": "2026-03-31T10:55:00Z"
}
```

---

## Testing Your Zapier Automations

### Test Blog Post Published Trigger

1. Go to your admin dashboard
2. Call: `POST /api/trpc/zapier.testWebhook`
3. Select: `webhookType: "blog_post"`
4. Check Zapier dashboard for test trigger
5. Verify email/social posts were created

### Test Partnership Opportunity Trigger

1. Call: `POST /api/trpc/zapier.testWebhook`
2. Select: `webhookType: "partnership"`
3. Check Zapier dashboard
4. Verify CRM record was created

### Test Backlink Found Trigger

1. Call: `POST /api/trpc/zapier.testWebhook`
2. Select: `webhookType: "backlink"`
3. Check Zapier dashboard
4. Verify backlink was tracked

---

## Environment Variables Required

Add these to your `.env` file:

```env
# Zapier Webhook URLs
ZAPIER_GUEST_POST_WEBHOOK=https://hooks.zapier.com/hooks/catch/...
ZAPIER_SOCIAL_SYNDICATION_WEBHOOK=https://hooks.zapier.com/hooks/catch/...
ZAPIER_DIRECTORY_SUBMISSION_WEBHOOK=https://hooks.zapier.com/hooks/catch/...
ZAPIER_INFLUENCER_OUTREACH_WEBHOOK=https://hooks.zapier.com/hooks/catch/...
ZAPIER_PRESS_RELEASE_WEBHOOK=https://hooks.zapier.com/hooks/catch/...
ZAPIER_PARTNERSHIP_OUTREACH_WEBHOOK=https://hooks.zapier.com/hooks/catch/...
ZAPIER_CRM_UPDATE_WEBHOOK=https://hooks.zapier.com/hooks/catch/...
ZAPIER_OWNER_NOTIFICATION_WEBHOOK=https://hooks.zapier.com/hooks/catch/...
ZAPIER_BACKLINK_TRACKING_WEBHOOK=https://hooks.zapier.com/hooks/catch/...
```

---

## Monitoring & Optimization

### Track These Metrics

1. **Backlinks Generated**
   - Track in Google Sheets
   - Update daily from Zapier logs

2. **Domain Authority**
   - Check monthly with Moz or Ahrefs
   - Target: +15-25 points in 6 months

3. **Referral Traffic**
   - Track in Google Analytics
   - Expected: 2,000-5,000 monthly visitors

4. **Conversion Rate**
   - Track affiliate clicks by source
   - Expected: 5-15% conversion to sales

5. **Partnership ROI**
   - Track revenue per partnership
   - Expected: $500-1,500/month additional revenue

### Optimize Your Automations

1. **A/B Test Email Templates**
   - Test different subject lines
   - Test different CTAs
   - Track open rates and response rates

2. **Optimize Timing**
   - Send emails at optimal times (9 AM, 2 PM)
   - Schedule posts for peak engagement

3. **Segment Your Outreach**
   - Different templates for different partner types
   - Different messaging for different niches

4. **Track What Works**
   - Which strategies generate most backlinks
   - Which strategies drive most traffic
   - Which strategies generate most revenue

---

## Troubleshooting

### Webhook Not Triggering

1. Check webhook URL is correct
2. Verify blog post is being published
3. Check Zapier logs for errors
4. Test webhook manually using test endpoint

### Emails Not Sending

1. Check Gmail/Outlook integration is authorized
2. Verify email addresses are valid
3. Check Zapier logs for errors
4. Test email template manually

### No Backlinks Generated

1. Verify outreach emails are being sent
2. Check response rates
3. Follow up with non-responders
4. Optimize email templates

---

## Next Steps

1. **Set up first 3 automations** (Guest posts, social, directories)
2. **Monitor results** for 2 weeks
3. **Optimize based on performance**
4. **Add more automations** (influencers, podcasts, press releases)
5. **Scale to maximum capacity**

Expected timeline: 6 months to 500-1,000 backlinks and 10-50x revenue increase.
