"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, CheckCircle, Upload, X } from "lucide-react";

export default function ReportBug() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "bug",
    description: "",
    steps: "",
    expectedBehavior: "",
    actualBehavior: "",
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments((prev) => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      attachments.forEach((file) => {
        formDataToSend.append("attachments", file);
      });

      const response = await fetch("/api/report", {
        method: "POST",
        body: formDataToSend,
      });

      const result = await response.json();

      if (result.success) {
        alert("Report submitted successfully! We'll review it shortly.");
        // Reset form
        setFormData({
          name: "",
          email: "",
          subject: "",
          category: "bug",
          description: "",
          steps: "",
          expectedBehavior: "",
          actualBehavior: "",
        });
        setAttachments([]);
      } else {
        alert(result.message || "Failed to submit report");
      }
    } catch (error) {
      console.error("Report submission error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Report an Issue
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Help us improve FriendFinder by reporting bugs or issues
          </p>
        </div>

        {/* Alert */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-900 dark:text-yellow-200">
                Before you report
              </h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                Please check if the issue is already known and try basic troubleshooting
                (clearing cache, restarting app). For urgent security issues, email us
                directly at security@friendfinder.com
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Report Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Your Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              {/* Issue Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Issue Category *</Label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                >
                  <option value="bug">Bug / Technical Issue</option>
                  <option value="feature">Feature Request</option>
                  <option value="performance">Performance Issue</option>
                  <option value="security">Security Concern</option>
                  <option value="ui">UI/UX Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="Brief description of the issue"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the issue in detail..."
                  rows={4}
                  required
                  className="resize-none"
                />
              </div>

              {/* Steps to Reproduce */}
              <div className="space-y-2">
                <Label htmlFor="steps">Steps to Reproduce</Label>
                <Textarea
                  id="steps"
                  name="steps"
                  value={formData.steps}
                  onChange={handleInputChange}
                  placeholder="1. Go to...&#10;2. Click on...&#10;3. See error..."
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* Expected vs Actual */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expectedBehavior">Expected Behavior</Label>
                  <Textarea
                    id="expectedBehavior"
                    name="expectedBehavior"
                    value={formData.expectedBehavior}
                    onChange={handleInputChange}
                    placeholder="What should happen..."
                    rows={3}
                    className="resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="actualBehavior">Actual Behavior</Label>
                  <Textarea
                    id="actualBehavior"
                    name="actualBehavior"
                    value={formData.actualBehavior}
                    onChange={handleInputChange}
                    placeholder="What actually happens..."
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>

              {/* File Attachments */}
              <div className="space-y-2">
                <Label htmlFor="attachments">Attachments (Screenshots, Videos)</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="attachments"
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("attachments")?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Max 10MB per file
                  </span>
                </div>
                {attachments.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded"
                      >
                        <span className="text-sm truncate">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.history.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Submit Report
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
