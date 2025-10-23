'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Bell, BellOff, TestTube, Check, X, Mail, Smartphone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { simpleNotificationService } from '@/lib/simple-notifications';
import { auth } from '@/lib/firebase';
import type { NotificationPreferences } from '@/lib/simple-notifications';

export function NotificationSettings() {
  const [preferences, setPreferences] = React.useState<NotificationPreferences>(() => 
    simpleNotificationService.getPreferences()
  );
  const [permission, setPermission] = React.useState<NotificationPermission | null>(null);
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    // Check current permission status
    if (simpleNotificationService.isSupported()) {
      setPermission(simpleNotificationService.getPermissionStatus());
    }
    }
  }, []);

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: any) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    notificationService.savePreferences(newPreferences);
  };

  const requestPermission = async () => {
    setLoading(true);
    try {
      const granted = await notificationService.requestPermission();
      
      if (granted) {
        // Wait a moment for FCM token to be retrieved
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Update state immediately
        setPermission('granted');
        handlePreferenceChange('enabled', true);
        
        // Poll for token (it might take a moment)
        let attempts = 0;
        const maxAttempts = 10;
        while (attempts < maxAttempts) {
          const token = notificationService.getFCMToken();
          if (token) {
            setFcmToken(token);
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
        }
        
        toast({
          title: "Notifications Enabled! 🔔",
          description: "You'll now receive study reminders and timer notifications.",
        });
      } else {
        setPermission('denied');
        toast({
          title: "Permission Denied",
          description: "You can enable notifications later in your browser settings.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Permission request error:', error);
      toast({
        title: "Error",
        description: "Failed to request notification permission.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testNotification = async () => {
    try {
      await notificationService.testNotification();
      toast({
        title: "Test Sent! 🧪",
        description: "Check if you received the notification.",
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Could not send test notification.",
        variant: "destructive"
      });
    }
  };

  const testEmail = async () => {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        toast({
          title: "Not logged in",
          description: "You must be logged in to test emails.",
          variant: "destructive"
        });
        return;
      }

      console.log('Testing email for user:', user.email);

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'test',
          userEmail: user.email,
          userName: user.displayName || 'User'
        })
      });

      const result = await response.json();
      console.log('Email API response:', result);
      
      if (result.success) {
        toast({
          title: "Test Email Sent! 📧",
          description: `Check ${user.email} for the test email. It may take a minute to arrive.`,
        });
      } else {
        console.error('Email send failed:', result);
        toast({
          title: "Email Failed",
          description: result.error || result.message || "Could not send test email. Check console for details.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Email test error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send test email. Check console for details.",
        variant: "destructive"
      });
    }
  };

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge className="bg-green-100 text-green-800"><Check className="w-3 h-3 mr-1" />Allowed</Badge>;
      case 'denied':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Blocked</Badge>;
      default:
        return <Badge variant="secondary">Not Requested</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure how and when you want to receive study reminders
              </CardDescription>
            </div>
            {getPermissionBadge()}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Permission Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Browser Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  {permission === 'granted' 
                    ? 'Notifications are enabled for this browser'
                    : 'Allow notifications to receive study reminders'
                  }
                </p>
              </div>
              
              {permission !== 'granted' ? (
                <Button 
                  onClick={requestPermission} 
                  disabled={loading}
                  className="gap-2"
                >
                  <Bell className="w-4 h-4" />
                  {loading ? 'Requesting...' : 'Enable Notifications'}
                </Button>
              ) : (
                <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={testNotification}
                  className="gap-2"
                >
                  <TestTube className="w-4 h-4" />
                  Test Notification
                </Button>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    // Trigger missed-goal test: sample 60 min goal with 15 min completed
                    await notificationService.showMissedGoalNotification(15, 60);
                    toast({ title: 'Missed-goal test sent', description: 'Check your notifications.' });
                  }}
                >
                  <Mail className="w-4 h-4" />
                  Test Missed-Goal
                </Button>
                </div>
              )}
            </div>

            {fcmToken && (
              <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                FCM Token: {fcmToken.substring(0, 20)}...
              </div>
            )}
          </div>

          <Separator />

          {/* Notification Types */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Push Notification Types
            </h4>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="timer-completion">Timer Completion</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when your pomodoro sessions complete
                  </p>
                </div>
                <Switch
                  id="timer-completion"
                  checked={preferences.timerCompletion}
                  onCheckedChange={(checked) => handlePreferenceChange('timerCompletion', checked)}
                  disabled={!preferences.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="break-reminders">Break Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Reminders when your break time starts or ends
                  </p>
                </div>
                <Switch
                  id="break-reminders"
                  checked={preferences.breakReminders}
                  onCheckedChange={(checked) => handlePreferenceChange('breakReminders', checked)}
                  disabled={!preferences.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="study-reminders">Study Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Scheduled reminders to start studying specific activities
                  </p>
                </div>
                <Switch
                  id="study-reminders"
                  checked={preferences.studyReminders}
                  onCheckedChange={(checked) => handlePreferenceChange('studyReminders', checked)}
                  disabled={!preferences.enabled}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Email Notifications */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Notifications
            </h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="email-reminders">Email Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email reminders for important activities and weekly summaries
                </p>
              </div>
              <Switch
                id="email-reminders"
                checked={preferences.emailReminders}
                onCheckedChange={(checked) => handlePreferenceChange('emailReminders', checked)}
                disabled={!preferences.enabled}
              />
            </div>

            {preferences.emailReminders && (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                <div className="text-sm text-muted-foreground">
                  Test email delivery to verify your email settings
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={testEmail}
                  className="gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Test Email
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Reminder Timing */}
          <div className="space-y-4">
            <h4 className="font-medium">Reminder Timing</h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="reminder-time">Default Reminder Time</Label>
                <p className="text-sm text-muted-foreground">
                  How early should we remind you before scheduled activities?
                </p>
              </div>
              <Select
                value={preferences.reminderTime.toString()}
                onValueChange={(value) => handlePreferenceChange('reminderTime', parseInt(value))}
                disabled={!preferences.enabled}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {!notificationService.isSupported() && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <BellOff className="w-4 h-4" />
                <span className="font-medium">Notifications Not Supported</span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Your browser doesn't support notifications or they're disabled.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}