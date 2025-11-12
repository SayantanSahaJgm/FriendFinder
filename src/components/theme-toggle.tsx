"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  showLabel?: boolean;
  variant?: "default" | "icon";
  className?: string;
}

export function ThemeToggle({
  showLabel = true,
  variant = "default",
  className,
}: ThemeToggleProps) {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size={variant === "icon" ? "icon" : "sm"}
        className={cn("opacity-50", className)}
        disabled
      >
        <Sun className="h-4 w-4" />
        {showLabel && variant !== "icon" && <span className="ml-2">Loading...</span>}
      </Button>
    );
  }

  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <Button
      variant="outline"
      size={variant === "icon" ? "icon" : "sm"}
      className={className}
      // Prevent clicks from bubbling to parent elements (fixes accidental toggles
      // when clicking nearby controls) and ensure this is a button action
      type="button"
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        toggleTheme();
      }}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
      {showLabel && variant !== "icon" && (
        <span className="ml-2">{isDark ? "Dark" : "Light"}</span>
      )}
    </Button>
  );
}

export function ThemeToggleCompact({ className }: { className?: string }) {
  return <ThemeToggle showLabel={false} variant="icon" className={cn("size-8", className)} />;
}
