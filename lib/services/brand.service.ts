import { createClient } from "@/lib/supabase/client";
import { Brand, BrandInput } from "@/lib/types/brand";

const supabase = createClient();

/**
 * All brand data is scoped to the signed-in user. Row Level Security
 * (see supabase/migrations/0001_multi_tenant_and_providers.sql) enforces
 * this at the database level; the explicit user_id filters below are
 * defense-in-depth so the app behaves correctly even before/without RLS.
 */
export class BrandService {
  static async getAll() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: [] as Brand[], error: new Error("Not authenticated") };
    }

    return await supabase
      .from("brands")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .returns<Brand[]>();
  }

  static async getById(id: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error("Not authenticated") };
    }

    return await supabase
      .from("brands")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single<Brand>();
  }

  static async create(values: BrandInput) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error("Not authenticated") };
    }

    return await supabase
      .from("brands")
      .insert({ ...values, user_id: user.id })
      .select()
      .single<Brand>();
  }

  static async update(id: string, values: BrandInput) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error("Not authenticated") };
    }

    return await supabase
      .from("brands")
      .update(values)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single<Brand>();
  }

  static async delete(id: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: new Error("Not authenticated") };
    }

    return await supabase
      .from("brands")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
  }
}
