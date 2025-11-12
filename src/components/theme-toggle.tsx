"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  showLabel?: boolean;
  variant?: "default" | "icon" | "switch";
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
        {showLabel && variant !== "icon" && variant !== "switch" && (
          <span className="ml-2">Loading...</span>
        )}
      </Button>
    );
  }

  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  const toggleTheme = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTheme(isDark ? "light" : "dark");
  };

  // Switch variant with visible circle indicator
  if (variant === "switch") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          isDark 
            ? "bg-primary" 
            : "bg-gray-300 dark:bg-gray-600",
          className
        )}
        role="switch"
        aria-checked={isDark}
        aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
        title={`Switch to ${isDark ? "light" : "dark"} mode`}
      >
        {/* Circle indicator */}
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full transition-transform duration-200 shadow-lg flex items-center justify-center",
            isDark 
              ? "translate-x-6 bg-white" 
              : "translate-x-0.5 bg-white",
          )}
        >
          {isDark ? (
            <Moon className="h-3 w-3 text-primary" />
          ) : (
            <Sun className="h-3 w-3 text-yellow-500" />
          )}
        </span>
      </button>
    );
  }

  return (
    <Button
      variant="outline"
      size={variant === "icon" ? "icon" : "sm"}
      className={className}
      type="button"
      onClick={toggleTheme}
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

export function ThemeToggleSwitch({ className }: { className?: string }) {
  return <ThemeToggle showLabel={false} variant="switch" className={className} />;
}
