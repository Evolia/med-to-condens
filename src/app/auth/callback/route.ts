import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if user email is in allowed_users table
      const { data: allowedUser } = await supabase
        .from("allowed_users")
        .select("email")
        .eq("email", data.user.email?.toLowerCase())
        .single();

      if (!allowedUser) {
        // User not authorized, sign them out
        await supabase.auth.signOut();
        return NextResponse.redirect(
          `${origin}/login?error=unauthorized`
        );
      }

      // User is authorized
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth error
  return NextResponse.redirect(`${origin}/login?error=auth_error`);
}
