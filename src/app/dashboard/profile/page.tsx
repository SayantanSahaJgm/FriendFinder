"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAuth } from "@/context/AuthContext";
import { useFriends } from "@/context/FriendsContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Edit,
  MapPin,
  Calendar,
  Mail,
  Camera,
  Save,
  X,
  RefreshCw,
  Heart,
  Eye,
  Users,
  Image as ImageIcon,
  TrendingUp,
  Star,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { data: session } = useSession();
  const { user, refreshUser, updateUserProfile } = useAuth();
  const { friends } = useFriends();

  // Editing states
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    interests: [] as string[],
  });

  // Temporary field values for inline editing
  const [tempValues, setTempValues] = useState<Record<string, any>>({});
  const [newInterest, setNewInterest] = useState("");

  // Stats data (mock for now - can be fetched from API later)
  const [stats] = useState({
    posts: 0,
    stories: 0,
    postViews: 0,
    storyViews: 0,
    profileViews: 0,
  });

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        bio: user.bio || "",
        interests: (user as any).interests || [],
      });
    }
  }, [user]);

  const displayName = user?.username || session?.user?.name || "User";
  const userEmail = user?.email || session?.user?.email;

  const handleFieldEdit = (field: string) => {
    setEditingField(field);
    if (field === "interests") {
      setTempValues({
        ...tempValues,
        [field]: [...((user as any)?.interests || [])],
      });
    } else {
      setTempValues({
        ...tempValues,
        [field]:
          (user as any)?.[field] ||
          formData[field as keyof typeof formData] ||
          "",
      });
    }
  };

  const handleFieldSave = async (field: string) => {
    setIsLoading(true);
    try {
      const updateData = { [field]: tempValues[field] };
      
      const result = await updateUserProfile(updateData);
      if (!result.success) {
        throw new Error(result.error || `Failed to update ${field}`);
      }

      setFormData((prev) => ({ ...prev, [field]: tempValues[field] }));
      setEditingField(null);
      setTempValues({});
      toast.success(
        `${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully!`
      );
      await refreshUser();
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

  const handleAddInterest = () => {
    if (newInterest.trim() && tempValues.interests) {
      const interests = [...tempValues.interests, newInterest.trim()];
      setTempValues((prev) => ({ ...prev, interests }));
      setNewInterest("");
    }
  };

  const handleRemoveInterest = (index: number) => {
    if (tempValues.interests) {
      const interests = tempValues.interests.filter((_: any, i: number) => i !== index);
      setTempValues((prev) => ({ ...prev, interests }));
    }
  };

  const handlePhotoUpload = () => {
    toast.info("Photo upload feature coming soon!");
    // TODO: Implement photo upload
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage your personal information
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Header Card */}
          <Card className="relative overflow-hidden">
            {/* Cover Photo Area */}
            <div className="h-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
            
            <CardContent className="pt-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-end space-y-4 sm:space-y-0 sm:space-x-6 -mt-16 sm:-mt-12">
                {/* Profile Picture */}
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-white dark:border-gray-800">
                    <AvatarImage
                      src={session?.user?.image || undefined}
                      alt={displayName}
                    />
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-4xl">
                      {displayName ? displayName.charAt(0).toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute bottom-0 right-0 h-10 w-10 rounded-full p-0 bg-white dark:bg-gray-800"
                    onClick={handlePhotoUpload}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>

                {/* Name and Basic Info */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {displayName}
                      </h2>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <Mail className="h-4 w-4" />
                        <span>{userEmail}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Joined {user?.createdAt
                            ? new Date(user.createdAt).toLocaleDateString()
                            : "Today"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bio Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>About Me</CardTitle>
                {editingField !== "bio" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleFieldEdit("bio")}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingField === "bio" ? (
                <div className="space-y-3">
                  <Textarea
                    value={tempValues.bio || ""}
                    onChange={(e) =>
                      setTempValues((prev) => ({
                        ...prev,
                        bio: e.target.value,
                      }))
                    }
                    placeholder="Tell others about yourself..."
                    rows={4}
                    maxLength={500}
                    className="resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {(tempValues.bio || "").length}/500 characters
                    </span>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleFieldSave("bio")}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <RefreshCw className="h-3 w-3 animate-spin mr-2" />
                        ) : (
                          <Save className="h-3 w-3 mr-2" />
                        )}
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFieldCancel("bio")}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700 dark:text-gray-300">
                  {user?.bio || "No bio added yet. Click edit to add one!"}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Interests Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Interests</CardTitle>
                {editingField !== "interests" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleFieldEdit("interests")}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingField === "interests" ? (
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      placeholder="Add an interest..."
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddInterest();
                        }
                      }}
                    />
                    <Button
                      onClick={handleAddInterest}
                      disabled={!newInterest.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {(tempValues.interests || []).map((interest: string, index: number) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="pl-3 pr-2 py-1 flex items-center space-x-2"
                      >
                        <span>{interest}</span>
                        <button
                          onClick={() => handleRemoveInterest(index)}
                          className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => handleFieldSave("interests")}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <RefreshCw className="h-3 w-3 animate-spin mr-2" />
                      ) : (
                        <Save className="h-3 w-3 mr-2" />
                      )}
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFieldCancel("interests")}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  {((user as any)?.interests || []).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {((user as any)?.interests || []).map((interest: string, index: number) => (
                        <Badge key={index} variant="secondary" className="px-3 py-1">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">
                      No interests added yet. Click edit to add some!
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Content Dashboard</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Posts Stats */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <ImageIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <h3 className="font-medium text-blue-900 dark:text-blue-100">Posts</h3>
                    </div>
                    <Badge variant="secondary">{stats.posts}</Badge>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-blue-700 dark:text-blue-300">
                    <Eye className="h-4 w-4" />
                    <span>{stats.postViews} total views</span>
                  </div>
                </div>

                {/* Stories Stats */}
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Star className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <h3 className="font-medium text-purple-900 dark:text-purple-100">Stories</h3>
                    </div>
                    <Badge variant="secondary">{stats.stories}</Badge>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-purple-700 dark:text-purple-300">
                    <Eye className="h-4 w-4" />
                    <span>{stats.storyViews} total views</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  📊 Start posting and sharing stories to see your stats grow!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Friends</span>
                </div>
                <span className="font-semibold text-blue-600">{friends.length}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Profile Views</span>
                </div>
                <span className="font-semibold text-purple-600">{stats.profileViews}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Posts</span>
                </div>
                <span className="font-semibold text-green-600">{stats.posts}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Stories</span>
                </div>
                <span className="font-semibold text-orange-600">{stats.stories}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Edit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handlePhotoUpload}
              >
                <Camera className="mr-2 h-4 w-4" />
                Change Photo
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleFieldEdit("bio")}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Bio
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleFieldEdit("interests")}
              >
                <Heart className="mr-2 h-4 w-4" />
                Update Interests
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  window.location.href = "/dashboard/settings";
                }}
              >
                <User className="mr-2 h-4 w-4" />
                Go to Settings
              </Button>
            </CardContent>
          </Card>

          {/* Profile Completion */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(() => {
                  const completionItems = [
                    { label: "Email verified", completed: !!userEmail },
                    {
                      label: "Profile photo",
                      completed: !!session?.user?.image,
                    },
                    {
                      label: "Bio added",
                      completed: !!(user?.bio && user.bio.trim()),
                    },
                    {
                      label: "Interests added",
                      completed: !!((user as any)?.interests?.length > 0),
                    },
                    {
                      label: "Has friends",
                      completed: friends.length > 0,
                    },
                  ];

                  const completedCount = completionItems.filter(
                    (item) => item.completed
                  ).length;
                  const progress = Math.round(
                    (completedCount / completionItems.length) * 100
                  );

                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Overall Progress</span>
                        <span className="text-sm font-bold text-blue-600">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="space-y-2">
                        {completionItems.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2 text-sm"
                          >
                            <div
                              className={`h-4 w-4 rounded-full flex items-center justify-center ${
                                item.completed
                                  ? "bg-green-500"
                                  : "bg-gray-300 dark:bg-gray-600"
                              }`}
                            >
                              {item.completed && (
                                <svg
                                  className="h-3 w-3 text-white"
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path d="M5 13l4 4L19 7"></path>
                                </svg>
                              )}
                            </div>
                            <span
                              className={
                                item.completed
                                  ? "text-gray-700 dark:text-gray-300"
                                  : "text-gray-500 dark:text-gray-400"
                              }
                            >
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
