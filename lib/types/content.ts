export interface Content {
  id: string;
  brand_id: string;

  platform: string;
  content_type: string;
  tone: string;

  topic: string;
  prompt: string;

  generated_content: string | null;

  status: string;

  created_at: string;
  scheduled_at: string | null;
  brands: {
    name: string;
  } | null;
}