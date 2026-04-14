
# Troopod — AI Ad-to-Landing Page Personalizer

## What We're Building
A tool where users input an ad creative (image upload or URL) and a landing page URL, then see a **side-by-side comparison** of the original vs. AI-personalized landing page with full CRO optimization.

## Assumptions
- The personalized page is a modified HTML version of the original (not a brand new page)
- We use **Firecrawl** to scrape the landing page HTML/content and branding
- We use **Lovable AI** to analyze the ad creative and generate CRO-optimized modifications
- For ad URL input, we use Firecrawl to scrape/screenshot the ad; for image upload, we send the image directly to the AI

## Flow
1. **Input Screen** — Clean form with:
   - Ad creative input: image upload dropzone + URL text field (toggle between modes)
   - Landing page URL field
   - "Generate" button

2. **Processing Screen** — Loading state with progress steps:
   - "Scraping landing page..." (Firecrawl fetches HTML + branding)
   - "Analyzing ad creative..." (AI extracts messaging, tone, offer, CTA, audience)
   - "Generating personalized page..." (AI produces modified HTML)

3. **Results Screen — Side-by-Side Comparison**:
   - Left panel: Original page rendered in iframe/preview
   - Right panel: Personalized page rendered in iframe
   - Below: Summary card listing all changes made (headline changes, CTA updates, color adjustments, layout tweaks) with CRO rationale
   - Option to download the personalized HTML

## Key Components

### Edge Functions
1. **`scrape-landing-page`** — Uses Firecrawl to fetch the landing page HTML, markdown, branding, and screenshot
2. **`analyze-and-personalize`** — Sends ad creative + scraped page to Lovable AI with a CRO-expert system prompt. Returns modified HTML + change summary

### AI Personalization (CRO Principles Applied)
- **Message match**: Align headline/subheadline with ad copy
- **CTA optimization**: Match CTA text to ad offer, improve visibility
- **Visual consistency**: Adjust hero colors/accents to match ad creative
- **Social proof placement**: Suggest trust signals near CTAs
- **Above-the-fold optimization**: Ensure key message is immediately visible
- **Scent trail**: Maintain consistent messaging from ad → page

### Guardrails (Handling Hallucinations & Broken UI)
- AI outputs a structured JSON of changes (not raw HTML rewrite) — changes are applied programmatically to reduce hallucination risk
- Original HTML structure is preserved; only targeted elements are modified
- Change summary lets users verify each modification
- Fallback: if personalization fails, show original page with error toast

## Pages
- **`/`** — Input form (ad + landing page URL)
- **`/results`** — Side-by-side comparison view

## Tech Stack
- Firecrawl connector for web scraping
- Lovable Cloud + Edge Functions for backend
- Lovable AI (Gemini) for ad analysis and CRO personalization
- React with Tailwind for the UI
