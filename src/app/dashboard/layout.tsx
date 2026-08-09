"use client";

import type { ReactNode } from "react";
import { DashboardGate } from "@/components/dashboard/DashboardGate";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <DashboardGate>{children}</DashboardGate>;
}
