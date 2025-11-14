'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wifi, 
  Bluetooth, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Info
} from 'lucide-react';

interface DiscoveryStatus {
  user: {
    id: string;
    username: string;
    email: string;
  };
  discovery: {
    enabled: boolean;
    range: number;
  };
  wifi: {
    configured: boolean;
    hashedBSSID: string | null;
    lastSeen: string | null;
    minutesAgo: number | null;
    isRecent: boolean;
    isExpired: boolean;
    threshold: string;
    potentialMatches: number;
    status: string;
  };
  bluetooth: {
    configured: boolean;
    bluetoothId: string | null;
    bluetoothName: string | null;
    lastUpdated: string | null;
    minutesAgo: number | null;
    isRecent: boolean;
    isExpired: boolean;
    threshold: string;
    potentialMatches: number;
    status: string;
  };
  recommendations: string[];
}

export default function DiscoveryDiagnosticPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [status, setStatus] = useState<DiscoveryStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/users/discovery-status');
      if (!response.ok) {
        throw new Error('Failed to fetch discovery status');
      }
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchStatus();
    }
  }, [sessionStatus]);

  const getStatusIcon = (statusText: string) => {
    if (statusText.startsWith('✅')) return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    if (statusText.startsWith('⚠️')) return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    if (statusText.startsWith('❌')) return <XCircle className="h-5 w-5 text-red-500" />;
    return <Info className="h-5 w-5 text-blue-500" />;
  };

  const getSeverityColor = (text: string) => {
    if (text.includes('CRITICAL') || text.startsWith('🔴')) return 'destructive';
    if (text.startsWith('⚠️')) return 'warning';
    if (text.startsWith('💡')) return 'default';
    return 'default';
  };

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (sessionStatus === 'unauthenticated') {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>
            Please sign in to view discovery diagnostics.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchStatus} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (!status) return null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Discovery Diagnostics</h1>
          <p className="text-muted-foreground mt-1">
            Check why you can or cannot see nearby users
          </p>
        </div>
        <Button onClick={fetchStatus} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Overall Discovery Status */}
      <Card>
        <CardHeader>
          <CardTitle>Discovery Mode</CardTitle>
          <CardDescription>Your overall discovery settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">Status:</span>
            <Badge variant={status.discovery.enabled ? 'default' : 'destructive'}>
              {status.discovery.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Range:</span>
            <span>{status.discovery.range}m</span>
          </div>
          {!status.discovery.enabled && (
            <Alert variant="destructive">
              <AlertDescription>
                ⚠️ Discovery is disabled. Enable it in Settings to be discovered by other users.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* WiFi Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            WiFi Discovery
          </CardTitle>
          <CardDescription>
            Find users on the same WiFi network
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
            {getStatusIcon(status.wifi.status)}
            <div className="flex-1">
              <p className="font-medium">{status.wifi.status}</p>
              {status.wifi.configured && (
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <p>Last seen: {status.wifi.minutesAgo !== null ? `${status.wifi.minutesAgo} minutes ago` : 'Never'}</p>
                  <p>Network ID: {status.wifi.hashedBSSID || 'Not set'}</p>
                  <p>Potential matches: {status.wifi.potentialMatches}</p>
                </div>
              )}
            </div>
          </div>

          {status.wifi.isExpired && (
            <Alert variant="default">
              <AlertDescription>
                Your WiFi connection has expired. Please reconnect from Settings → Discovery → WiFi
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Bluetooth Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bluetooth className="h-5 w-5" />
            Bluetooth Discovery
          </CardTitle>
          <CardDescription>
            Find users within Bluetooth range (~50m)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
            {getStatusIcon(status.bluetooth.status)}
            <div className="flex-1">
              <p className="font-medium">{status.bluetooth.status}</p>
              {status.bluetooth.configured && (
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <p>Device name: {status.bluetooth.bluetoothName || 'Not set'}</p>
                  <p>Last updated: {status.bluetooth.minutesAgo !== null ? `${status.bluetooth.minutesAgo} minutes ago` : 'Never'}</p>
                  <p>Device ID: {status.bluetooth.bluetoothId || 'Not set'}</p>
                  <p>Potential matches: {status.bluetooth.potentialMatches}</p>
                </div>
              )}
            </div>
          </div>

          {status.bluetooth.isExpired && (
            <Alert variant="default">
              <AlertDescription>
                Your Bluetooth connection has expired. Please reconnect from Settings → Discovery → Bluetooth
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {status.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>
              Steps to fix discovery issues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {status.recommendations.map((recommendation, index) => (
              <Alert 
                key={index} 
                variant={getSeverityColor(recommendation) as any}
              >
                <AlertDescription>{recommendation}</AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <a href="/dashboard/settings">
              Go to Settings
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="/dashboard/discover">
              View Nearby Users
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
