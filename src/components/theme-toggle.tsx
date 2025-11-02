"use client";

import * as React from "react";
import { Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  showLabel?: boolean;
  variant?: "default" | "icon";
  className?: string;
}

// Theme toggling is intentionally disabled in this project per UX request.
// Render a non-interactive light-mode indicator so UI placements remain stable.
export function ThemeToggle({
  showLabel = true,
  variant = "default",
  className,
}: ThemeToggleProps) {
  return (
    <Button
      variant="outline"
      size={variant === "icon" ? "icon" : "sm"}
      className={cn("opacity-90 pointer-events-none", className)}
      title="Light mode (fixed)"
      aria-label="Light mode (fixed)"
    >
      <Sun className="h-4 w-4" />
      {showLabel && variant !== "icon" && <span className="ml-2">Light</span>}
    </Button>
  );
}

export function ThemeToggleCompact({ className }: { className?: string }) {
  return (
    <ThemeToggle showLabel={false} variant="icon" className={cn("size-8", className)} />
  );
}
