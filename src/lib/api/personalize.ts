import { supabase } from '@/integrations/supabase/client';

export interface PersonalizeRequest {
  adImageBase64?: string;
  adUrl?: string;
  originalHtml: string;
  originalMarkdown: string;
  branding?: any;
  landingPageUrl: string;
}

export interface PersonalizationChange {
  element: string;
  original: string;
  modified: string;
  rationale: string;
}

export interface PersonalizeResponse {
  success: boolean;
  personalizedHtml?: string;
  changes?: PersonalizationChange[];
  error?: string;
}

export async function personalizeLanding(req: PersonalizeRequest): Promise<PersonalizeResponse> {
  const { data, error } = await supabase.functions.invoke('analyze-and-personalize', {
    body: req,
  });
  if (error) return { success: false, error: error.message };
  return data;
}
