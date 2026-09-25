export interface Brand {
  id: string;
  user_id: string;

  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;

  created_at: string;
}

export type BrandInput = Pick<
  Brand,
  "name" | "description" | "color" | "icon"
>;
