import { NextResponse, type NextRequest } from "next/server";

/**
 * Auth middleware — disabled for MVP demo.
 * To re-enable Supabase auth enforcement, replace this with the full
 * @supabase/ssr session refresh + redirect logic.
 */
export function updateSession(_request: NextRequest) {
  return NextResponse.next();
}
