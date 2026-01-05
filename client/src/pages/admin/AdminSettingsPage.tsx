import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Database, Mail, Shield, Bell, Palette } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage system-wide settings and configurations
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* System Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                <CardTitle>System Settings</CardTitle>
              </div>
              <CardDescription>
                Configure general system preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Maintenance Mode</span>
                <Badge variant="outline">Off</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">New Registrations</span>
                <Badge variant="default">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">API Rate Limiting</span>
                <Badge variant="default">Active</Badge>
              </div>
              <Button variant="outline" className="w-full mt-4">
                Configure System
              </Button>
            </CardContent>
          </Card>

          {/* Database */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                <CardTitle>Database</CardTitle>
              </div>
              <CardDescription>
                Database maintenance and backups
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Last Backup</span>
                <Badge variant="secondary">2 hours ago</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Auto Backup</span>
                <Badge variant="default">Daily</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Database Size</span>
                <Badge variant="outline">234 MB</Badge>
              </div>
              <Button variant="outline" className="w-full mt-4">
                Manage Database
              </Button>
            </CardContent>
          </Card>

          {/* Email Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                <CardTitle>Email Settings</CardTitle>
              </div>
              <CardDescription>
                Configure email notifications and templates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Email Service</span>
                <Badge variant="default">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Daily Limit</span>
                <Badge variant="outline">10,000</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Sent Today</span>
                <Badge variant="secondary">234</Badge>
              </div>
              <Button variant="outline" className="w-full mt-4">
                Configure Email
              </Button>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <CardTitle>Security</CardTitle>
              </div>
              <CardDescription>
                Security and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">2FA Required</span>
                <Badge variant="outline">Optional</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Session Timeout</span>
                <Badge variant="secondary">7 days</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Password Policy</span>
                <Badge variant="default">Strong</Badge>
              </div>
              <Button variant="outline" className="w-full mt-4">
                Security Settings
              </Button>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <CardTitle>Notifications</CardTitle>
              </div>
              <CardDescription>
                System notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Email Notifications</span>
                <Badge variant="default">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Push Notifications</span>
                <Badge variant="outline">Disabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Admin Alerts</span>
                <Badge variant="default">Enabled</Badge>
              </div>
              <Button variant="outline" className="w-full mt-4">
                Configure Notifications
              </Button>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                <CardTitle>Appearance</CardTitle>
              </div>
              <CardDescription>
                Customize system appearance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Default Theme</span>
                <Badge variant="secondary">System</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Logo</span>
                <Badge variant="default">Custom</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Branding</span>
                <Badge variant="default">Enabled</Badge>
              </div>
              <Button variant="outline" className="w-full mt-4">
                Customize Appearance
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Notice */}
        <Card className="bg-muted/50">
          <CardContent className="py-8 text-center">
            <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Settings Configuration</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Detailed settings configuration pages are coming soon.
              For now, contact system administrator for any configuration changes.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
