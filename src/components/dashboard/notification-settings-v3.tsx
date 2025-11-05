'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Mail, TestTube, AlertCircle, CheckCircle2 } from 'lucide-react';
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
  const [testingEmail, setTestingEmail] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const { toast } = useToast();

  // Get email config
  const emailConfig = getEmailConfig();

  React.useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
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

  const handleTestEmail = async () => {
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
      const result = await sendTestEmail(currentUser.email, userName);

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
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
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
                Receive study reminders and summaries directly to your inbox
              </CardDescription>
            </div>
            <Badge variant={emailConfig.isConfigured ? 'default' : 'secondary'}>
              {emailConfig.isConfigured ? 'Active' : 'Not Configured'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!emailConfig.isConfigured ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">Email notifications are not configured yet.</p>
                <p className="text-sm mb-2">Add these environment variables to your <code className="bg-muted px-1 rounded">.env.local</code> file:</p>
                <pre className="mt-2 p-3 bg-muted rounded text-xs font-mono">
{`NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key`}
                </pre>
                <p className="text-sm mt-3 text-muted-foreground">
                  Visit <a href="https://www.emailjs.com/" target="_blank" rel="noopener noreferrer" className="underline">EmailJS</a> to set up your free email service.
                </p>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {currentUser?.email && (
                <Alert className="bg-primary/5 border-primary/20">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <AlertDescription>
                    <span className="text-sm">Notifications will be sent to: </span>
                    <strong className="text-primary">{currentUser.email}</strong>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors duration-200">
                <div className="space-y-0.5 flex-1">
                  <Label className="text-base font-medium cursor-pointer">Study Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get email reminders for your study sessions and goals
                  </p>
                </div>
                <Switch
                  checked={preferences.emailReminders}
                  onCheckedChange={(checked) => handlePreferenceChange('emailReminders', checked)}
                  className="ml-4"
                />
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={handleTestEmail}
                  disabled={testingEmail || !currentUser?.email}
                  className="w-full hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                >
                  {testingEmail ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Sending Test Email...
                    </>
                  ) : (
                    <>
                      <TestTube className="mr-2 h-4 w-4" />
                      Send Test Email
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Configuration Status Card */}
      {emailConfig.isConfigured && (
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Email Service Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center p-2 rounded hover:bg-background transition-colors">
                <span className="text-muted-foreground">Service Provider:</span>
                <span className="font-medium">EmailJS</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded hover:bg-background transition-colors">
                <span className="text-muted-foreground">Service ID:</span>
                <code className="bg-background px-2 py-1 rounded text-xs font-mono">{emailConfig.serviceId}</code>
              </div>
              <div className="flex justify-between items-center p-2 rounded hover:bg-background transition-colors">
                <span className="text-muted-foreground">Template ID:</span>
                <code className="bg-background px-2 py-1 rounded text-xs font-mono">{emailConfig.templateId}</code>
              </div>
              <div className="flex justify-between items-center p-2 rounded hover:bg-background transition-colors">
                <span className="text-muted-foreground">Status:</span>
                <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Connected
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
