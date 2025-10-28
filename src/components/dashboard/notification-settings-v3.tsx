'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Bell, BellOff, TestTube, Mail, Check, X, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { simpleNotificationService } from '@/lib/simple-notifications';
import { getEmailConfig, sendTestEmail } from '@/lib/email-notifications';
import { auth } from '@/lib/firebase';
import type { NotificationPreferences } from '@/lib/simple-notifications';

export function NotificationSettings() {
  const [preferences, setPreferences] = React.useState<NotificationPreferences>(() => 
    simpleNotificationService.getPreferences()
  );
  const [permission, setPermission] = React.useState<NotificationPermission | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [testingEmail, setTestingEmail] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const { toast } = useToast();

  // Get email config
  const emailConfig = getEmailConfig();

  React.useEffect(() => {
    if (simpleNotificationService.isSupported()) {
      setPermission(simpleNotificationService.getPermissionStatus());
    }

    console.log('📧 Email Configuration:', emailConfig);

    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('👤 Auth state changed:', {
        hasUser: !!user,
        email: user?.email,
        displayName: user?.displayName,
        uid: user?.uid
      });
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: any) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    simpleNotificationService.savePreferences(newPreferences);
    
    toast({
      title: "Settings Updated",
      description: "Your notification preferences have been saved.",
    });
  };

  const handleEnableBrowserNotifications = async () => {
    setLoading(true);
    try {
      const granted = await simpleNotificationService.requestPermission();
      setPermission(granted ? 'granted' : 'denied');
      
      if (granted) {
        toast({
          title: "Notifications Enabled! 🎉",
          description: "You'll now receive browser notifications.",
        });
      } else {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to enable notifications.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestBrowserNotification = () => {
    simpleNotificationService.testNotification();
    toast({
      title: "Test Sent!",
      description: "Check for the notification on your screen.",
    });
  };

  const handleTestEmail = async () => {
    console.log('🔍 Testing email - Current user state:', {
      hasCurrentUser: !!currentUser,
      email: currentUser?.email,
      displayName: currentUser?.displayName,
      authCurrentUser: auth.currentUser?.email
    });

    if (!currentUser || !currentUser.email) {
      toast({
        title: "No User",
        description: "Please sign in to test email notifications.",
        variant: "destructive"
      });
      return;
    }

    setTestingEmail(true);
    
    try {
      const userName = currentUser.displayName?.split(' ')[0] || 'Student';
      
      console.log('📧 Sending test email with params:', {
        to_email: currentUser.email,
        to_name: userName
      });
      
      const result = await sendTestEmail(currentUser.email, userName);

      console.log('📧 Email result:', result);

      if (result.success) {
        toast({
          title: "Test Email Sent! 📧",
          description: `Check your inbox at ${currentUser.email}`,
        });
      } else {
        toast({
          title: "Email Failed",
          description: result.error || "Failed to send test email",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('❌ Email error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send test email",
        variant: "destructive"
      });
    } finally {
      setTestingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Browser Notifications Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Browser Notifications
              </CardTitle>
              <CardDescription>
                Get instant notifications right on your desktop
              </CardDescription>
            </div>
            <Badge variant={permission === 'granted' ? 'default' : 'secondary'}>
              {permission === 'granted' ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {permission !== 'granted' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Enable browser notifications to get instant reminders when timers complete and breaks end.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Allow Studify to send you notifications
              </p>
            </div>
            <Button
              variant={permission === 'granted' ? 'outline' : 'default'}
              onClick={handleEnableBrowserNotifications}
              disabled={loading || permission === 'granted'}
            >
              {permission === 'granted' ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Enabled
                </>
              ) : (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  Enable
                </>
              )}
            </Button>
          </div>

          {permission === 'granted' && (
            <Button
              variant="outline"
              onClick={handleTestBrowserNotification}
              className="w-full"
            >
              <TestTube className="mr-2 h-4 w-4" />
              Test Browser Notification
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Email Notifications Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>
                Receive study reminders and summaries via email
              </CardDescription>
            </div>
            <Badge variant={emailConfig.isConfigured ? 'default' : 'secondary'}>
              {emailConfig.isConfigured ? 'Configured' : 'Not Configured'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!emailConfig.isConfigured ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">Email notifications are not configured yet.</p>
                <p className="text-sm">Add these to your <code className="bg-muted px-1 rounded">.env.local</code>:</p>
                <pre className="mt-2 p-2 bg-muted rounded text-xs">
{`NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key`}
                </pre>
                <p className="text-sm mt-2">
                  See <code className="bg-muted px-1 rounded">docs/NOTIFICATIONS_SETUP.md</code> for setup instructions.
                </p>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {currentUser?.email && (
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    Emails will be sent to: <strong>{currentUser.email}</strong>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get study reminders via email
                  </p>
                </div>
                <Switch
                  checked={preferences.emailReminders}
                  onCheckedChange={(checked) => handlePreferenceChange('emailReminders', checked)}
                />
              </div>

              <Button
                variant="outline"
                onClick={handleTestEmail}
                disabled={testingEmail || !currentUser?.email}
                className="w-full"
              >
                {testingEmail ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Sending...
                  </>
                ) : (
                  <>
                    <TestTube className="mr-2 h-4 w-4" />
                    Send Test Email
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Configuration Info */}
      {emailConfig.isConfigured && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Configuration Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service ID:</span>
                <code className="bg-muted px-2 py-1 rounded text-xs">{emailConfig.serviceId}</code>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Template ID:</span>
                <code className="bg-muted px-2 py-1 rounded text-xs">{emailConfig.templateId}</code>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="text-green-600 font-medium">✓ Ready</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
