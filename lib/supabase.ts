// filepath: d:\Projects\react ts\klicktiv\lib\supabase.ts
import { createClient } from "@/utils/supabase/client";

export const supabase = createClient();

if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
	(window as Window & { __supabase?: typeof supabase }).__supabase = supabase;
}
