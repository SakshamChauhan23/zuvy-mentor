import { redirect } from "next/navigation";

// Sign-up is handled via Google OAuth on the login page.
// Visiting /signup redirects there directly.
export default function SignupPage() {
  redirect("/login");
}
