import type { Metadata } from "next";
import { DashboardApp } from "@/components/dashboard/DashboardApp";

export const metadata: Metadata = {
  title: "Dashboard — IndiRoute",
  description: "Manage your IndiRoute account and parcels.",
};

export default function DashboardPage() {
  return <DashboardApp />;
}
