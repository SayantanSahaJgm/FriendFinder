"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Settings,
  Bell,
  Shield,
  MapPin,
  Eye,
  Moon,
  Sun,
  Smartphone,
  Globe,
  Lock,
  Trash2,
  Save,
  X,
  RefreshCw,
  Edit,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { signOut } from "next-auth/react";

export default function SettingsPage() {
  const { user, refreshUser, updateUserProfile, updateDiscoverySettings } =
    useAuth();

  // User preferences hook for persistent settings
  const {
    preferences,
    updateDiscovery,
    isLoading: preferencesLoading,
  } = useUserPreferences();

  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState<Record<string, any>>({});
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [verificationCode, setVerificationCode] = useState(""); // For dev mode display
  const [is2FALoading, setIs2FALoading] = useState(false);
  
  // Change Password Dialog
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    pushNotifications: false,
    emailNotifications: false,
    friendRequests: true,
    newMessages: true,
    nearbyFriends: true,
    profileVisibility: "friends",
    discoveryMode: false,
    locationSharing: false,
    readReceipts: true,
    twoFactorAuth: false,
    discoveryRange: 100,
    gpsDiscovery: false, // Will be updated from preferences
    wifiDiscovery: false, // Will be updated from preferences
    bluetoothDiscovery: false, // Will be updated from preferences
    soundEnabled: true, // Hidden from UI but available for app functionality
    vibrationEnabled: true, // Hidden from UI but available for app functionality
    language: "English",
    emailVisibleToFriends: false,
    phoneVisibleToFriends: false,
  });

  // Load user settings when component mounts
  useEffect(() => {
    if (user) {
      setSettings((prevSettings) => ({
        ...prevSettings,
        discoveryMode: user.isDiscoveryEnabled || false,
        discoveryRange: user.discoveryRange || 100,
        locationSharing: !!user.location,
        twoFactorAuth: (user as any).twoFactorEnabled || false,
      }));
    }
  }, [user]);

  // Load settings from API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings/update');
        const result = await response.json();
        
        if (result.success && result.settings) {
          setSettings((prevSettings) => ({
            ...prevSettings,
            ...result.settings,
          }));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Sync discovery method settings with preferences
  useEffect(() => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      gpsDiscovery: preferences.discovery.methods.gps,
      wifiDiscovery: preferences.discovery.methods.wifi,
      bluetoothDiscovery: preferences.discovery.methods.bluetooth,
    }));
  }, [preferences.discovery.methods]);

  const handleFieldEdit = (field: string) => {
    setEditingField(field);
    setTempValues({
      ...tempValues,
      [field]: settings[field as keyof typeof settings],
    });
  };

  const handleFieldSave = async (field: string) => {
    setIsLoading(true);
    try {
      const value = tempValues[field];

      // Update different types of settings based on field
      if (["discoveryMode", "discoveryRange"].includes(field)) {
        const updateData: any = {};
        if (field === "discoveryMode") {
          updateData.isDiscoveryEnabled = value;
        } else if (field === "discoveryRange") {
          updateData.discoveryRange = value;
        }

        const result = await updateDiscoverySettings(updateData);
        if (!result.success) {
          throw new Error(result.error || `Failed to update ${field}`);
        }
      } else if (["phone", "recoveryEmail"].includes(field)) {
        // Update user profile fields
        const result = await updateUserProfile({ [field]: value });
        if (!result.success) {
          throw new Error(result.error || `Failed to update ${field}`);
        }
        await refreshUser();
      } else {
        // Call API to update setting in database
        const response = await fetch('/api/settings/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            settingType: field,
            value: value,
          }),
        });

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || `Failed to update ${field}`);
        }
        
        // Update local state
        setSettings((prev) => ({ ...prev, [field]: value }));
      }

      setEditingField(null);
      setTempValues({});
      toast.success(
        `${field
          .replace(/([A-Z])/g, " $1")
          .toLowerCase()} updated successfully!`
      );

      if (["discoveryMode", "discoveryRange"].includes(field)) {
        await refreshUser();
      }
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      toast.error(
        error instanceof Error ? error.message : `Failed to update ${field}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldCancel = (field: string) => {
    setEditingField(null);
    setTempValues((prev) => {
      const newValues = { ...prev };
      delete newValues[field];
      return newValues;
    });
  };

  const handleToggle = async (field: string) => {
    const newValue = !settings[field as keyof typeof settings];
    setIsLoading(true);

    try {
      if (["discoveryMode"].includes(field)) {
        const result = await updateDiscoverySettings({
          isDiscoveryEnabled: newValue,
        });
        if (!result.success) {
          throw new Error(result.error || `Failed to update ${field}`);
        }
        await refreshUser();
      } else if (field === "locationSharing") {
        // Handle location sharing toggle - requires special handling
        const response = await fetch('/api/settings/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            settingType: field,
            value: newValue,
          }),
        });

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || `Failed to update ${field}`);
        }
        
        // Update local state
        setSettings((prev) => ({ ...prev, [field]: newValue }));
        
        // If disabling, also disable discovery mode
        if (!newValue) {
          await updateDiscoverySettings({
            isDiscoveryEnabled: false,
          });
          setSettings((prev) => ({ ...prev, discoveryMode: false }));
        }
        
        await refreshUser();
      } else if (
        ["gpsDiscovery", "wifiDiscovery", "bluetoothDiscovery"].includes(field)
      ) {
        // Handle discovery method toggles using updateDiscovery
        const methodMap = {
          gpsDiscovery: "gps",
          wifiDiscovery: "wifi",
          bluetoothDiscovery: "bluetooth",
        };

        const methodKey = methodMap[field as keyof typeof methodMap];
        const result = await updateDiscovery({
          methods: {
            ...preferences.discovery.methods,
            [methodKey]: newValue,
          },
        });

        if (!result.success) {
          throw new Error(result.error || `Failed to update ${field}`);
        }
      } else {
        // Call API to update setting in database
        const response = await fetch('/api/settings/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            settingType: field,
            value: newValue,
          }),
        });

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || `Failed to update ${field}`);
        }
        
        // Update local state
        setSettings((prev) => ({ ...prev, [field]: newValue }));
      }

      toast.success(
        `${field.replace(/([A-Z])/g, " $1").toLowerCase()} ${
          newValue ? "enabled" : "disabled"
        }`
      );
    } catch (error) {
      console.error(`Error toggling ${field}:`, error);
      toast.error(
        error instanceof Error ? error.message : `Failed to update ${field}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Two-Factor Authentication handlers
  const handle2FASetup = async () => {
    if (settings.twoFactorAuth) {
      // Disable 2FA
      setIs2FALoading(true);
      try {
        const response = await fetch('/api/auth/two-factor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'disable' }),
        });
        const result = await response.json();
        if (result.success) {
          setSettings((prev) => ({ ...prev, twoFactorAuth: false }));
          toast.success('Two-factor authentication disabled');
        } else {
          toast.error(result.error || 'Failed to disable 2FA');
        }
      } catch (error) {
        toast.error('Failed to disable 2FA');
      } finally {
        setIs2FALoading(false);
      }
    } else {
      // Enable 2FA - show dialog
      setShow2FADialog(true);
      // Request verification code
      setIs2FALoading(true);
      try {
        const response = await fetch('/api/auth/two-factor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'enable' }),
        });
        const result = await response.json();
        if (result.success) {
          toast.success(result.message);
          // In dev mode, show the code
          if (result.code) {
            setVerificationCode(result.code);
          }
        } else {
          toast.error(result.error || 'Failed to send verification code');
          setShow2FADialog(false);
        }
      } catch (error) {
        toast.error('Failed to send verification code');
        setShow2FADialog(false);
      } finally {
        setIs2FALoading(false);
      }
    }
  };

  const handle2FAVerify = async () => {
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setIs2FALoading(true);
    try {
      const response = await fetch('/api/auth/two-factor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', code: twoFactorCode }),
      });
      const result = await response.json();
      if (result.success) {
        setSettings((prev) => ({ ...prev, twoFactorAuth: true }));
        toast.success(result.message);
        setShow2FADialog(false);
        setTwoFactorCode('');
        setVerificationCode('');
      } else {
        toast.error(result.error || 'Invalid verification code');
      }
    } catch (error) {
      toast.error('Failed to verify code');
    } finally {
      setIs2FALoading(false);
    }
  };

  const handle2FACancel = () => {
    setShow2FADialog(false);
    setTwoFactorCode('');
    setVerificationCode('');
  };

  // Change Password handlers
  const handlePasswordChange = async () => {
    if (!passwordData.oldPassword || !passwordData.newPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    setIsPasswordLoading(true);
    try {
      const response = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success(result.message || 'Password changed successfully');
        setShowPasswordDialog(false);
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(result.error || 'Failed to change password');
      }
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleDownloadData = async () => {
    try {
      toast.info('Preparing your data export...');
      const response = await fetch('/api/account/download-data');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to download data');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `friendfinder-data-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Data downloaded successfully!');
    } catch (error: any) {
      console.error('Error downloading data:', error);
      toast.error(error.message || 'Failed to download data');
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account preferences and privacy settings
        </p>
      </div>

      {/* 2FA Setup Dialog */}
      {show2FADialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Setup Two-Factor Authentication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                A 6-digit verification code has been sent to your email. Enter it below to enable 2FA.
              </p>
              {verificationCode && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Development Mode:</strong> Your code is <strong className="text-lg">{verificationCode}</strong>
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="2fa-code">Verification Code</Label>
                <Input
                  id="2fa-code"
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-wider"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handle2FACancel}
                  variant="outline"
                  className="flex-1"
                  disabled={is2FALoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handle2FAVerify}
                  className="flex-1"
                  disabled={is2FALoading || twoFactorCode.length !== 6}
                >
                  {is2FALoading ? 'Verifying...' : 'Verify & Enable'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Change Password Dialog */}
      {showPasswordDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="old-password">Current Password</Label>
                <Input
                  id="old-password"
                  type="password"
                  placeholder="Enter current password"
                  value={passwordData.oldPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, oldPassword: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password (min 6 characters)"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Re-enter new password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => {
                    setShowPasswordDialog(false);
                    setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={isPasswordLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePasswordChange}
                  className="flex-1"
                  disabled={isPasswordLoading || !passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                >
                  {isPasswordLoading ? 'Changing...' : 'Change Password'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notifications</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Push Notifications</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Receive notifications on your device
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={() => handleToggle("pushNotifications")}
                    disabled={isLoading}
                  />
                  <Badge
                    variant={
                      settings.pushNotifications ? "default" : "secondary"
                    }
                    className={
                      settings.pushNotifications
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }
                  >
                    {settings.pushNotifications ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Email Notifications</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Get updates via email</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={() => handleToggle("emailNotifications")}
                    disabled={isLoading}
                  />
                  <Badge
                    variant={
                      settings.emailNotifications ? "default" : "secondary"
                    }
                    className={
                      settings.emailNotifications
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }
                  >
                    {settings.emailNotifications ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Friend Requests</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Notify when someone sends a friend request
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.friendRequests}
                    onCheckedChange={() => handleToggle("friendRequests")}
                    disabled={isLoading}
                  />
                  <Badge
                    variant={settings.friendRequests ? "default" : "secondary"}
                    className={
                      settings.friendRequests
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }
                  >
                    {settings.friendRequests ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">New Messages</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Notify when you receive new messages
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.newMessages}
                    onCheckedChange={() => handleToggle("newMessages")}
                    disabled={isLoading}
                  />
                  <Badge
                    variant={settings.newMessages ? "default" : "secondary"}
                    className={
                      settings.newMessages
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }
                  >
                    {settings.newMessages ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Nearby Friends</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Notify when friends are discovered nearby
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.nearbyFriends}
                    onCheckedChange={() => handleToggle("nearbyFriends")}
                    disabled={isLoading}
                  />
                  <Badge
                    variant={settings.nearbyFriends ? "default" : "secondary"}
                    className={
                      settings.nearbyFriends
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }
                  >
                    {settings.nearbyFriends ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Privacy & Security</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Profile Visibility</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Who can see your profile information
                  </p>
                </div>
                {editingField === "profileVisibility" ? (
                  <div className="flex items-center space-x-2">
                    <select
                      value={tempValues.profileVisibility || "friends"}
                      onChange={(e) =>
                        setTempValues((prev) => ({
                          ...prev,
                          profileVisibility: e.target.value,
                        }))
                      }
                      className="text-sm border rounded px-2 py-1"
                      aria-label="Profile visibility setting"
                    >
                      <option value="everyone">Everyone</option>
                      <option value="friends">Friends Only</option>
                      <option value="private">Private</option>
                    </select>
                    <Button
                      size="sm"
                      onClick={() => handleFieldSave("profileVisibility")}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <Save className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFieldCancel("profileVisibility")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">
                      {settings.profileVisibility === "friends"
                        ? "Friends Only"
                        : settings.profileVisibility === "everyone"
                        ? "Everyone"
                        : "Private"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleFieldEdit("profileVisibility")}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Discovery Mode</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Allow others to find you through discovery
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.discoveryMode}
                    onCheckedChange={() => handleToggle("discoveryMode")}
                    disabled={isLoading}
                  />
                  <Badge
                    variant={settings.discoveryMode ? "default" : "secondary"}
                    className={
                      settings.discoveryMode
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }
                  >
                    {settings.discoveryMode ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Location Sharing</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Share your location for friend discovery
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.locationSharing}
                    onCheckedChange={() => handleToggle("locationSharing")}
                    disabled={isLoading}
                  />
                  <Badge
                    variant={settings.locationSharing ? "default" : "secondary"}
                    className={
                      settings.locationSharing
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }
                  >
                    {settings.locationSharing ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Read Receipts</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Let others know when you've read their messages
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.readReceipts}
                    onCheckedChange={() => handleToggle("readReceipts")}
                    disabled={isLoading}
                  />
                  <Badge
                    variant={settings.readReceipts ? "default" : "secondary"}
                    className={
                      settings.readReceipts
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }
                  >
                    {settings.readReceipts ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Add extra security to your account
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={settings.twoFactorAuth ? "default" : "secondary"}
                    className={
                      settings.twoFactorAuth
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    }
                  >
                    {settings.twoFactorAuth ? "Enabled" : "Not Setup"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handle2FASetup}
                    disabled={is2FALoading}
                  >
                    {is2FALoading ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : settings.twoFactorAuth ? (
                      "Disable"
                    ) : (
                      "Setup"
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Sign Out</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Log out of your account on this device
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const confirm = window.confirm("Are you sure you want to sign out?");
                    if (confirm) {
                      toast.info("Signing out...");
                      await signOut({ callbackUrl: "/" });
                    }
                  }}
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings - Phone and Email */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Contact Privacy</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                {editingField === "phone" ? (
                  <div className="mt-2 flex items-center space-x-2">
                    <Input
                      type="tel"
                      value={tempValues.phone || ""}
                      onChange={(e) =>
                        setTempValues((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      placeholder="+1234567890"
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleFieldSave("phone")}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <Save className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFieldCancel("phone")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {user?.phone || "Not set"}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingField("phone");
                        setTempValues({ ...tempValues, phone: user?.phone || "" });
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Phone number for account recovery and 2FA
                </p>
              </div>

              <div>
                <Label htmlFor="recoveryEmail">Recovery Email</Label>
                {editingField === "recoveryEmail" ? (
                  <div className="mt-2 flex items-center space-x-2">
                    <Input
                      type="email"
                      value={tempValues.recoveryEmail || ""}
                      onChange={(e) =>
                        setTempValues((prev) => ({
                          ...prev,
                          recoveryEmail: e.target.value,
                        }))
                      }
                      placeholder="recovery@example.com"
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleFieldSave("recoveryEmail")}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <Save className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFieldCancel("recoveryEmail")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {user?.recoveryEmail || "Not set"}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingField("recoveryEmail");
                        setTempValues({ ...tempValues, recoveryEmail: (user as any)?.recoveryEmail || "" });
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Alternative email for account recovery
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Show Email to Friends</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Let your friends see your email address
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.emailVisibleToFriends || false}
                    onCheckedChange={() => handleToggle("emailVisibleToFriends")}
                    disabled={isLoading}
                  />
                  <Badge
                    variant={settings.emailVisibleToFriends ? "default" : "secondary"}
                    className={
                      settings.emailVisibleToFriends
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }
                  >
                    {settings.emailVisibleToFriends ? "Visible" : "Hidden"}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Show Phone to Friends</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Let your friends see your phone number
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.phoneVisibleToFriends || false}
                    onCheckedChange={() => handleToggle("phoneVisibleToFriends")}
                    disabled={isLoading}
                  />
                  <Badge
                    variant={settings.phoneVisibleToFriends ? "default" : "secondary"}
                    className={
                      settings.phoneVisibleToFriends
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }
                  >
                    {settings.phoneVisibleToFriends ? "Visible" : "Hidden"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Discovery Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Discovery Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="discovery-range">
                  Discovery Range (meters)
                </Label>
                {editingField === "discoveryRange" ? (
                  <div className="mt-2 flex items-center space-x-2">
                    <Input
                      type="number"
                      value={tempValues.discoveryRange || 100}
                      onChange={(e) =>
                        setTempValues((prev) => ({
                          ...prev,
                          discoveryRange: parseInt(e.target.value) || 100,
                        }))
                      }
                      min={10}
                      max={10000}
                      step={10}
                      className="w-24"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      meters (10-10000m)
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleFieldSave("discoveryRange")}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <Save className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFieldCancel("discoveryRange")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center space-x-4">
                    <span className="text-sm font-medium">
                      {settings.discoveryRange}m
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      How far others can discover you
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleFieldEdit("discoveryRange")}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">GPS Discovery</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Use GPS coordinates for location-based discovery
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.gpsDiscovery}
                    onCheckedChange={() => handleToggle("gpsDiscovery")}
                    disabled={isLoading || preferencesLoading}
                  />
                  <Badge
                    variant={settings.gpsDiscovery ? "default" : "secondary"}
                    className={
                      settings.gpsDiscovery
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }
                  >
                    {settings.gpsDiscovery ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">WiFi Discovery</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Find friends on the same WiFi network
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.wifiDiscovery}
                    onCheckedChange={() => handleToggle("wifiDiscovery")}
                    disabled={isLoading || preferencesLoading}
                  />
                  <Badge
                    variant={settings.wifiDiscovery ? "default" : "secondary"}
                    className={
                      settings.wifiDiscovery
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }
                  >
                    {settings.wifiDiscovery ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Bluetooth Discovery</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Discover nearby friends via Bluetooth
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.bluetoothDiscovery}
                    onCheckedChange={() => handleToggle("bluetoothDiscovery")}
                    disabled={isLoading || preferencesLoading}
                  />
                  <Badge
                    variant={
                      settings.bluetoothDiscovery ? "default" : "secondary"
                    }
                    className={
                      settings.bluetoothDiscovery
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }
                  >
                    {settings.bluetoothDiscovery ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="h-5 w-5" />
                <span>Account Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Change Password</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Update your account password
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowPasswordDialog(true)}
                >
                  Change
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Download Data</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Export your personal data
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadData}
                >
                  Download
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-red-600">Delete Account</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Permanently delete your account and data
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={async () => {
                    const confirmation = window.prompt(
                      'This will permanently delete your account and all associated data. This action CANNOT be undone.\n\nType "DELETE" to confirm:'
                    );
                    
                    if (confirmation === 'DELETE') {
                      try {
                        const response = await fetch('/api/account/delete', {
                          method: 'DELETE',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({ confirmation: 'DELETE' }),
                        });
                        
                        const result = await response.json();
                        
                        if (result.success) {
                          toast.success('Account deleted successfully. Redirecting...');
                          // Sign out and redirect to home
                          setTimeout(() => {
                            window.location.href = '/auth/signin';
                          }, 2000);
                        } else {
                          toast.error(result.error || 'Failed to delete account');
                        }
                      } catch (error) {
                        console.error('Error deleting account:', error);
                        toast.error('Failed to delete account. Please try again.');
                      }
                    } else if (confirmation !== null) {
                      toast.error('Confirmation text did not match. Account deletion cancelled.');
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sun className="h-4 w-4" />
                  <span className="text-sm">Theme</span>
                </div>
                <ThemeToggle />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4" />
                  <span className="text-sm">Language</span>
                </div>
                {editingField === "language" ? (
                  <div className="flex items-center space-x-2">
                    <select
                      value={tempValues.language || "English"}
                      onChange={(e) =>
                        setTempValues((prev) => ({
                          ...prev,
                          language: e.target.value,
                        }))
                      }
                      className="text-sm border rounded px-2 py-1 dark:bg-gray-800 dark:border-gray-700"
                      aria-label="Language setting"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">हिंदी (Hindi)</option>
                      <option value="Bengali">বাংলা (Bengali)</option>
                      <option value="Telugu">తెలుగు (Telugu)</option>
                      <option value="Tamil">தமிழ் (Tamil)</option>
                      <option value="Marathi">मराठी (Marathi)</option>
                      <option value="Gujarati">ગુજરાતી (Gujarati)</option>
                      <option value="Kannada">ಕನ್ನಡ (Kannada)</option>
                      <option value="Malayalam">മലയാളം (Malayalam)</option>
                      <option value="Odia">ଓଡ଼ିଆ (Odia)</option>
                      <option value="Punjabi">ਪੰਜਾਬੀ (Punjabi)</option>
                      <option value="Assamese">অসমীয়া (Assamese)</option>
                      <option value="Urdu">اردو (Urdu)</option>
                      <option value="Spanish">Español (Spanish)</option>
                      <option value="French">Français (French)</option>
                      <option value="German">Deutsch (German)</option>
                      <option value="Japanese">日本語 (Japanese)</option>
                    </select>
                    <Button
                      size="sm"
                      onClick={() => handleFieldSave("language")}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <Save className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFieldCancel("language")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {settings.language}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleFieldEdit("language")}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Support */}
          <Card>
            <CardHeader>
              <CardTitle>Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  window.open("/help", "_blank");
                }}
              >
                Help Center
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  window.location.href = "tel:+919474652645";
                }}
              >
                Call Support: +91 9474652645
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  window.location.href = "mailto:sayantan@starnexx.in";
                }}
              >
                Email: sayantan@starnexx.in
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  window.location.href = "/report";
                }}
              >
                Report a Bug
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  window.open("/privacy", "_blank");
                }}
              >
                Privacy Policy
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  window.open("/terms", "_blank");
                }}
              >
                Terms of Service
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
