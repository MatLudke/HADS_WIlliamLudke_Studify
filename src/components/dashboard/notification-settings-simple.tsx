'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Bell, BellOff, TestTube, Mail, Check, X } from 'lucide-react';
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
  const [isEmailConfigured, setIsEmailConfigured] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (simpleNotificationService.isSupported()) {
      setPermission(simpleNotificationService.getPermissionStatus());
    }
    
    // Check if EmailJS is configured
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
    
    console.log('🔍 EmailJS Environment Variables Check:', {
      serviceId,
      templateId,
      publicKey,
      hasServiceId: !!serviceId,
      hasTemplateId: !!templateId,
      hasPublicKey: !!publicKey,
      isConfigured: !!(serviceId && templateId && publicKey)
    });
    
    setIsEmailConfigured(!!(serviceId && templateId && publicKey));
  }, []);

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: any) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    simpleNotificationService.savePreferences(newPreferences);
  };

  const requestPermission = async () => {
    setLoading(true);
    try {
      const granted = await simpleNotificationService.requestPermission();
      
      if (granted) {
        setPermission('granted');
        handlePreferenceChange('enabled', true);
        
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

  const testNotification = () => {
    try {
      simpleNotificationService.testNotification();
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

      const success = await simpleNotificationService.sendTestEmail(
        user.email,
        user.displayName || 'User'
      );
      
      if (success) {
        toast({
          title: "Test Email Sent! 📧",
          description: `Check ${user.email} for the test email.`,
        });
      } else {
        toast({
          title: "Email Failed",
          description: "EmailJS not configured. See console for setup instructions.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Email test error:', error);
      
      let errorMsg = error.message || "Failed to send test email.";
      
      // Detect Gmail OAuth scope error
      if (error.text && error.text.includes('412')) {
        errorMsg = "Gmail service has insufficient permissions. Use 'EmailJS' service instead of Gmail in EmailJS dashboard.";
      }
      
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
    }
  };

  const permissionBadge = permission === 'granted' ? (
    <Badge variant="default" className="bg-green-500">
      <Check className="w-3 h-3 mr-1" />
      Enabled
    </Badge>
  ) : permission === 'denied' ? (
    <Badge variant="destructive">
      <X className="w-3 h-3 mr-1" />
      Blocked
    </Badge>
  ) : (
    <Badge variant="secondary">Not Set</Badge>
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {preferences.enabled ? (
                  <Bell className="w-6 h-6 text-primary" />
                ) : (
                  <BellOff className="w-6 h-6 text-muted-foreground" />
                )}
                <div>
                  <CardTitle>Browser Notifications</CardTitle>
                  <CardDescription>
                    Get desktop notifications for study reminders and timer completions
                  </CardDescription>
                </div>
              </div>
              {permissionBadge}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {permission !== 'granted' && (
              <div className="flex flex-col gap-4 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Enable browser notifications to receive study reminders and timer alerts.
                </p>
                <Button
                  onClick={requestPermission}
                  disabled={loading || permission === 'denied'}
                  className="w-full sm:w-auto"
                >
                  {loading ? 'Requesting...' : 'Enable Browser Notifications'}
                </Button>
                {permission === 'denied' && (
                  <p className="text-sm text-destructive">
                    Notifications were blocked. Please enable them in your browser settings.
                  </p>
                )}
              </div>
            )}

            {permission === 'granted' && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="timer-completion" className="flex-1">
                      <div>
                        <div className="font-medium">Timer Completion</div>
                        <div className="text-sm text-muted-foreground">
                          Notify when study timer completes
                        </div>
                      </div>
                    </Label>
                    <Switch
                      id="timer-completion"
                      checked={preferences.timerCompletion}
                      onCheckedChange={(checked) => handlePreferenceChange('timerCompletion', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <Label htmlFor="break-reminders" className="flex-1">
                      <div>
                        <div className="font-medium">Break Reminders</div>
                        <div className="text-sm text-muted-foreground">
                          Remind when break time is over
                        </div>
                      </div>
                    </Label>
                    <Switch
                      id="break-reminders"
                      checked={preferences.breakReminders}
                      onCheckedChange={(checked) => handlePreferenceChange('breakReminders', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <Label htmlFor="study-reminders" className="flex-1">
                      <div>
                        <div className="font-medium">Study Reminders</div>
                        <div className="text-sm text-muted-foreground">
                          Remind before scheduled activities
                        </div>
                      </div>
                    </Label>
                    <Switch
                      id="study-reminders"
                      checked={preferences.studyReminders}
                      onCheckedChange={(checked) => handlePreferenceChange('studyReminders', checked)}
                    />
                  </div>

                  {preferences.studyReminders && (
                    <div className="flex items-center gap-4 pl-6">
                      <Label htmlFor="reminder-time" className="text-sm">
                        Reminder time:
                      </Label>
                      <Select
                        value={String(preferences.reminderTime)}
                        onValueChange={(value) => handlePreferenceChange('reminderTime', Number(value))}
                      >
                        <SelectTrigger id="reminder-time" className="w-32">
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
                  )}
                </div>

                <div className="pt-4">
                  <Button
                    variant="outline"
                    onClick={testNotification}
                    className="w-full sm:w-auto"
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    Test Notification
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Mail className="w-6 h-6 text-primary" />
              <div>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>
                  Receive email reminders and weekly summaries
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-reminders" className="flex-1">
                <div>
                  <div className="font-medium">Email Reminders</div>
                  <div className="text-sm text-muted-foreground">
                    Send study reminders and goal updates via email
                  </div>
                </div>
              </Label>
              <Switch
                id="email-reminders"
                checked={preferences.emailReminders}
                onCheckedChange={(checked) => handlePreferenceChange('emailReminders', checked)}
              />
            </div>

            {preferences.emailReminders && isEmailConfigured && (
              <div className="pt-4">
                <Button
                  variant="outline"
                  onClick={testEmail}
                  className="w-full sm:w-auto"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  Test Email
                </Button>
              </div>
            )}

            {preferences.emailReminders && !isEmailConfigured && (
              <div className="p-4 bg-muted rounded-lg text-sm space-y-3">
                <p className="font-medium">📧 EmailJS Setup Required</p>
                <p className="text-muted-foreground">
                  To use email notifications:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Create free account at{' '}
                    <a href="https://www.emailjs.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      emailjs.com
                    </a>
                  </li>
                  <li><strong>IMPORTANT:</strong> Add Email Service → Choose <strong>"Outlook"</strong> or <strong>"Yahoo"</strong></li>
                  <li>Create an email template with variables: to_name, subject, message</li>
                  <li>Add credentials to .env.local:</li>
                </ol>
                <pre className="p-2 bg-background rounded text-xs overflow-x-auto">
{`NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key`}
                </pre>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  ⚠️ Don't use Gmail or Custom SMTP - they require complex setup. Outlook/Yahoo work with one click!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
