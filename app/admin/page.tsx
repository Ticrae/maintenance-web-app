import { redirect } from "next/navigation";

// Bare "/admin" has no page of its own — reports is the default landing tab
export default function AdminIndexPage() {
  redirect("/admin/reports");
}
