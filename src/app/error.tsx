"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);

    // TODO: Send error to monitoring service
    // if (process.env.NODE_ENV === 'production') {
    //   sendToMonitoring(error);
    // }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md shadow-2xl border-2 border-red-200 dark:border-red-800">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shadow-lg">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400 animate-pulse" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Something went wrong!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-gray-700 dark:text-gray-300 font-medium">
              We apologize for the inconvenience. An error occurred while
              processing your request.
            </p>
          </div>

          {process.env.NODE_ENV === "development" && (
            <details className="text-left bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm border border-gray-300 dark:border-gray-700">
              <summary className="cursor-pointer font-semibold mb-3 text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                🐛 Error Details (Development Mode)
              </summary>
              <div className="mt-3 space-y-2">
                <div className="bg-white dark:bg-gray-900 p-3 rounded border border-red-300 dark:border-red-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Message:</p>
                  <code className="text-red-600 dark:text-red-400 break-all text-sm font-mono">
                    {error.message}
                  </code>
                </div>
                {error.digest && (
                  <div className="bg-white dark:bg-gray-900 p-3 rounded border border-gray-300 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Digest:</p>
                    <code className="text-gray-700 dark:text-gray-300 text-xs font-mono">
                      {error.digest}
                    </code>
                  </div>
                )}
                {error.stack && (
                  <div className="bg-white dark:bg-gray-900 p-3 rounded border border-gray-300 dark:border-gray-700 max-h-40 overflow-auto">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Stack Trace:</p>
                    <pre className="text-gray-700 dark:text-gray-300 text-xs font-mono whitespace-pre-wrap">
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button 
              onClick={reset} 
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 shadow-lg"
            >
              <RefreshCw className="w-5 h-5" />
              Try again
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/dashboard")}
              className="flex-1 flex items-center justify-center gap-2 border-2 py-6 font-semibold"
            >
              <Home className="w-5 h-5" />
              Go to Dashboard
            </Button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            If this problem persists, please contact support or try refreshing the page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
