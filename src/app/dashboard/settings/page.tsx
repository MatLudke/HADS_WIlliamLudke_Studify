
"use client"

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Header } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "next-themes";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { auth } from '@/lib/firebase';
import { deleteUser, reauthenticateWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationSettings } from '@/components/dashboard/notification-settings';
import GoalsManager from '@/components/dashboard/goals-manager';


export default function SettingsPage() {
  const { setTheme, theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleClearSessionHistory = async () => {
    setIsClearingHistory(true);
    const user = auth.currentUser;
    if (!user) {
      toast({ variant: "destructive", title: "No user logged in." });
      setIsClearingHistory(false);
      return;
    }

    try {
      const { deleteSessionHistory } = await import('@/lib/firestore');
      await deleteSessionHistory(user.uid);

      toast({ 
        title: "Session history cleared",
        description: "All study sessions and reports have been removed. Your activities are preserved."
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to clear session history",
        description: error.message || "Please try again.",
      });
    } finally {
      setIsClearingHistory(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    const user = auth.currentUser;
    if (!user) {
      toast({ variant: "destructive", title: "No user logged in." });
      setIsDeleting(false);
      setOpen(false);
      return;
    }

    try {
      // First delete all user data from Firestore
      const { deleteUserAccount } = await import('@/lib/firestore');
      await deleteUserAccount(user.uid);

      // Re-authentication is required for security-sensitive operations
      const provider = new GoogleAuthProvider();
      await reauthenticateWithPopup(user, provider);
      
      // Finally delete the user account
      await deleteUser(user);

      toast({ title: "Account and all data deleted successfully." });
      router.push('/login');

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to delete account",
        description: error.message || "Please try again.",
      });
    } finally {
      setIsDeleting(false);
      setOpen(false);
    }
  };


  return (
    <>
      <Header title="Settings" />
      <main className="flex-1 overflow-auto p-4 md:p-6 pt-40">
        <motion.div 
          className="mx-auto w-full max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          >
            <h1 className="text-3xl font-headline font-bold tracking-tight mb-2">Settings</h1>
            <p className="text-muted-foreground mb-8">Manage your account and application preferences.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          >
            <Tabs defaultValue="appearance" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="data">Data</TabsTrigger>
                <TabsTrigger value="danger">Danger Zone</TabsTrigger>
              </TabsList>
              <TabsContent value="appearance">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Appearance</CardTitle>
                      <CardDescription>
                        Customize the look and feel of the application.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!isMounted ? (
                        <div className="grid max-w-md grid-cols-2 gap-8 pt-2 mx-auto">
                          <Skeleton className="h-[150px] w-full" />
                          <Skeleton className="h-[150px] w-full" />
                        </div>
                      ) : (
                        <RadioGroup
                          defaultValue={theme}
                          onValueChange={setTheme}
                          className="grid max-w-md grid-cols-2 gap-8 pt-2 mx-auto"
                        >
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.5, ease: "easeOut" }}
                          >
                            <Label className="[&:has([data-state=checked])>div]:border-primary">
                              <RadioGroupItem value="light" className="sr-only" />
                              <div className="items-center rounded-md border-2 border-muted p-1 hover:border-accent transition-all duration-300">
                                <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
                                  <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                                    <div className="h-2 w-4/5 rounded-lg bg-[#ecedef]" />
                                    <div className="h-2 w-full rounded-lg bg-[#ecedef]" />
                                  </div>
                                  <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                                    <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                                    <div className="h-2 w-full rounded-lg bg-[#ecedef]" />
                                  </div>
                                  <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                                    <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                                    <div className="h-2 w-full rounded-lg bg-[#ecedef]" />
                                  </div>
                                </div>
                              </div>
                              <span className="block w-full p-2 text-center font-normal">
                                Light
                              </span>
                            </Label>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.6, ease: "easeOut" }}
                          >
                            <Label className="[&:has([data-state=checked])>div]:border-primary">
                              <RadioGroupItem value="dark" className="sr-only" />
                              <div className="items-center rounded-md border-2 border-muted bg-popover p-1 hover:border-accent transition-all duration-300">
                                <div className="space-y-2 rounded-sm bg-slate-950 p-2">
                                  <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                                    <div className="h-2 w-4/5 rounded-lg bg-slate-400" />
                                    <div className="h-2 w-full rounded-lg bg-slate-400" />
                                  </div>
                                  <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                                    <div className="h-4 w-4 rounded-full bg-slate-400" />
                                    <div className="h-2 w-full rounded-lg bg-slate-400" />
                                  </div>
                                  <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                                    <div className="h-4 w-4 rounded-full bg-slate-400" />
                                    <div className="h-2 w-full rounded-lg bg-slate-400" />
                                  </div>
                                </div>
                              </div>
                              <span className="block w-full p-2 text-center font-normal">
                                Dark
                              </span>
                            </Label>
                          </motion.div>
                        </RadioGroup>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
              <TabsContent value="notifications">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
                >
                  <NotificationSettings />
                </motion.div>
              </TabsContent>
              <TabsContent value="goals">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Goals</CardTitle>
                      <CardDescription>
                        Create weekly study goals and get reminders when you're behind.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <GoalsManager />
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
              <TabsContent value="data">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Session History</CardTitle>
                      <CardDescription>
                        Manage your study session data and reports.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Clear Session History</h4>
                          <p className="text-sm text-muted-foreground">
                            Remove all study session data and reports. Activities will be preserved.
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={handleClearSessionHistory}
                          disabled={isClearingHistory}
                        >
                          {isClearingHistory ? "Clearing..." : "Clear History"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
              <TabsContent value="danger">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
                >
                  <Card className="border-destructive">
                    <CardHeader>
                      <CardTitle>Delete Account</CardTitle>
                      <CardDescription>
                        This action is permanent and cannot be undone. This will permanently delete your account and remove all your data from our servers.
                      </CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Button variant="destructive" onClick={() => setOpen(true)}>Delete My Account</Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </main>
       <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Yes, delete my account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    