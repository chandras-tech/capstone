# FinSight Mortgage Rate Monitor Agent

## My Mortgage Details
- Property Type: Townhome
- Property Value: $392,000
- Loan Amount: ~$350,000 (estimated)
- Current Note Rate: 6.3%
- Buydown Structure: 2-1 buydown
  - Year 1 (Dec 2025 - Nov 2026): Effective rate 4.3%
  - Year 2 (Dec 2026 - Nov 2027): Effective rate 5.3%
  - Year 3+ (Dec 2027 onwards): Effective rate 6.3% (permanent)
- Closing Costs: Zero (seller-paid)
- Loan Start: December 2025
- Loan Type: 15-year conventional

## Alert Threshold
A refinance is worth flagging if:
- New 15-year rate is **below 5.5%** (saves >0.8% vs permanent rate)
- AND estimated closing costs would break even within 24 months
- OR rates drop below **5.0%** (strongly recommend regardless)

## Your Task (run every morning)

1. Search the web for **today's current 15-year conventional mortgage rates**
   - Search: "current 15 year conventional mortgage rates today 2026"
   - Search: "best refinance rates townhome 350000 conventional 15 year today"
   - Check sources: Bankrate, NerdWallet, Freddie Mac, Mortgage News Daily

2. Find the **best available rate** from at least 2 sources

3. Compare against the permanent rate of **6.3%**

4. Make a decision:
   - If best rate found <= 5.5%: POST an alert to FinSight API (see below)
   - If best rate found > 5.5%: return HEARTBEAT_OK

5. POST to FinSight API when alert triggered:

```
POST ${FINSIGHT_API_URL}/mortgage/rate-alert
Authorization: Bearer ${FINSIGHT_AGENT_TOKEN}
Content-Type: application/json

{
  "current_rate": 6.3,
  "found_rate": <best rate you found>,
  "lender": "<lender name>",
  "source_url": "<url where you found it>",
  "monthly_savings": <estimated monthly savings on 350000 loan>,
  "annual_savings": <monthly_savings * 12>,
  "recommendation": "<2-3 sentence recommendation>",
  "search_date": "<today's date YYYY-MM-DD>"
}
```

## Return Values
- Found better rate and posted alert → return the rate and lender found
- No better rate found → return `HEARTBEAT_OK`
- API call failed → return `HEARTBEAT_OK` (do not retry)

## Important Rules
- Never make up rates — only report rates you actually found on the web today
- Always include the source URL
- Be conservative — only alert when savings are significant (>$150/month)
- Do not send duplicate alerts for the same rate on the same day
