import { corsHeaders } from '@supabase/supabase-js/cors';

const SYSTEM_PROMPT = `You are a CRO (Conversion Rate Optimization) expert. You analyze ad creatives and personalize landing pages to maximize conversion.

Your task: Given an ad creative (image or description) and the original landing page HTML, produce a personalized version of the HTML that:

1. **Message Match**: Align the headline and subheadline with the ad copy/messaging
2. **CTA Optimization**: Match CTA text to the ad's offer, make CTAs more prominent
3. **Visual Consistency**: Adjust hero section colors/accents to complement the ad creative
4. **Social Proof**: Ensure trust signals are near CTAs
5. **Above-the-fold**: Ensure the key value proposition is immediately visible
6. **Scent Trail**: Maintain consistent messaging from ad → page

CRITICAL RULES:
- Preserve the overall page structure and layout
- Only modify text content, colors, and CTA styling — do NOT restructure the page
- Keep all existing functionality (links, forms, scripts)
- Make surgical, targeted changes — not a complete rewrite
- All CSS changes should be inline styles added to existing elements
- Do NOT remove any sections or elements
- Do NOT add new sections

Return a JSON response using the provided tool.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { adImageBase64, adUrl, originalHtml, originalMarkdown, branding, landingPageUrl } = await req.json();

    if (!originalHtml) {
      return new Response(
        JSON.stringify({ success: false, error: 'Original HTML is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build user prompt
    let userPrompt = `## Landing Page URL
${landingPageUrl}

## Original Landing Page Content (Markdown)
${originalMarkdown?.substring(0, 8000) || 'Not available'}

## Original Landing Page Branding
${branding ? JSON.stringify(branding, null, 2) : 'Not available'}

## Ad Creative Information
`;

    if (adUrl) {
      userPrompt += `Ad URL: ${adUrl}\n`;
    }
    if (adImageBase64) {
      userPrompt += `An ad image has been provided (see attached image).\n`;
    }

    userPrompt += `
## Original HTML (to be modified)
\`\`\`html
${originalHtml.substring(0, 30000)}
\`\`\`

Please analyze the ad creative and produce a personalized version of the HTML with targeted CRO improvements. Use the tool to return your response.`;

    const messages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    if (adImageBase64) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: adImageBase64.startsWith('data:') ? adImageBase64 : `data:image/png;base64,${adImageBase64}` },
          },
          { type: 'text', text: userPrompt },
        ],
      });
    } else {
      messages.push({ role: 'user', content: userPrompt });
    }

    console.log('Calling AI for personalization...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        tools: [
          {
            type: 'function',
            function: {
              name: 'personalize_landing_page',
              description: 'Return the personalized HTML and a list of changes made',
              parameters: {
                type: 'object',
                properties: {
                  personalizedHtml: {
                    type: 'string',
                    description: 'The complete modified HTML of the landing page',
                  },
                  changes: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        element: { type: 'string', description: 'The element that was changed (e.g. "Hero Headline", "Primary CTA")' },
                        original: { type: 'string', description: 'The original text/value' },
                        modified: { type: 'string', description: 'The new text/value' },
                        rationale: { type: 'string', description: 'CRO rationale for this change' },
                      },
                      required: ['element', 'original', 'modified', 'rationale'],
                    },
                  },
                },
                required: ['personalizedHtml', 'changes'],
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'personalize_landing_page' } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI error:', response.status, errText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limited. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI credits exhausted. Please add funds.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: 'AI processing failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error('No tool call in response:', JSON.stringify(aiData));
      return new Response(
        JSON.stringify({ success: false, error: 'AI did not return structured output' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log('Personalization complete, changes:', result.changes?.length);

    return new Response(
      JSON.stringify({
        success: true,
        personalizedHtml: result.personalizedHtml,
        changes: result.changes,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
