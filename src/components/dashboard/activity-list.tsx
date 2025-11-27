
"use client"

import * as React from "react"
import { MoreHorizontal, Pencil, PlusCircle, Trash2 } from "lucide-react"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Activity } from "@/lib/types"
import { cn } from "@/lib/utils"
import { ActivityDialog } from "./activity-dialog"
import { deleteActivity, getActiveSession } from "@/lib/firestore"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { useAppState } from "@/contexts/AppStateContext"

export function ActivityList() {
    const { activities, loading, user, removeActivityFromState } = useAppState();
    const [openDialog, setOpenDialog] = React.useState(false);
    const [selectedActivity, setSelectedActivity] = React.useState<Activity | null>(null);
    const { toast } = useToast();

    const handleEdit = (activity: Activity) => {
        setSelectedActivity(activity);
        setOpenDialog(true);
    };

    const handleAddNew = () => {
        setSelectedActivity(null);
        setOpenDialog(true);
    }

    const handleDelete = async (id: string) => {
        try {
            // Check for active session before deleting
            if (user) {
                const activeSession = await getActiveSession(user.uid);
                if (activeSession && activeSession.activityId === id) {
                    toast({
                        variant: "destructive",
                        title: "Cannot Delete Activity",
                        description: "Please stop the active timer before deleting this activity.",
                    });
                    return;
                }
            }
            
            // Confirm deletion
            const activity = activities.find(a => a.id === id);
            if (!confirm(`Delete "${activity?.title}"? This will also delete all associated study sessions.`)) {
                return;
            }
            
            // Optimistically remove from state for immediate UI feedback
            removeActivityFromState(id);
            await deleteActivity(id);
            toast({ title: "Activity deleted successfully!" });
        } catch (error) {
            toast({ variant: "destructive", title: "Error deleting activity."});
            // Note: In case of error, the context will automatically refresh from server
        }
    };

    const handleDialogSuccess = () => {
      setOpenDialog(false);
      setSelectedActivity(null);
      // No need to manually fetch activities - the context handles real-time updates
    };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.6, 
          ease: [0.16, 1, 0.3, 1],
          delay: 0.1 
        }}
      >
        <Card className="border-none shadow-xl shadow-black/5 overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <CardTitle className="text-2xl font-bold tracking-tight">My Activities</CardTitle>
                <CardDescription>Manage your tasks and study sessions.</CardDescription>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  size="sm" 
                  className="gap-1 transition-all duration-300 hover:shadow-md" 
                  onClick={handleAddNew} 
                  disabled={!user}
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Activity
                </Button>
              </motion.div>
            </div>
          </CardHeader>
          <CardContent>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="hidden md:table-cell">Priority</TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <LayoutGroup>
                    <AnimatePresence mode="wait">
                      {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <motion.tr
                            key={`skeleton-${i}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ 
                              duration: 0.3, 
                              delay: i * 0.1,
                              ease: "easeOut"
                            }}
                            className="border-b"
                          >
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                          </motion.tr>
                        ))
                      ) : !user ? (
                        <motion.tr
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.3 }}
                          className="border-b"
                        >
                          <TableCell colSpan={4} className="h-24 text-center">
                            Log in to see your activities.
                          </TableCell>
                        </motion.tr>
                      ) : activities.length === 0 ? (
                        <motion.tr
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.3 }}
                          className="border-b"
                        >
                          <TableCell colSpan={4} className="h-24 text-center">
                            No activities found. Add one to get started!
                          </TableCell>
                        </motion.tr>
                      ) : (
                        activities.map((activity, index) => (
                          <motion.tr
                            key={activity.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -100, scale: 0.95 }}
                            transition={{ 
                              duration: 0.3, 
                              delay: index * 0.05,
                              ease: "easeOut",
                              layout: { duration: 0.3 }
                            }}
                            whileHover={{ 
                              backgroundColor: "rgba(0, 0, 0, 0.02)",
                              scale: 1.01,
                              transition: { duration: 0.2 }
                            }}
                            className="hover:bg-muted/50 border-b"
                          >
                            <TableCell className="font-medium">{activity.title}</TableCell>
                            <TableCell>{activity.subject}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Badge variant="outline" className={cn(
                                  "font-semibold transition-all duration-300",
                                  activity.priority === 'high' && 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800',
                                  activity.priority === 'medium' && 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-800',
                                  activity.priority === 'low' && 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800'
                                )}>
                                  {activity.priority === 'high' ? 'High' : activity.priority === 'medium' ? 'Medium' : 'Low'}
                                </Badge>
                              </motion.div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <Button 
                                      aria-haspopup="true" 
                                      size="icon" 
                                      variant="ghost"
                                      className="transition-all duration-300 hover:shadow-md"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">Toggle menu</span>
                                    </Button>
                                  </motion.div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    onClick={() => handleEdit(activity)}
                                    className="transition-colors duration-200"
                                  >
                                    <Pencil className="mr-2 h-4 w-4"/> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive focus:bg-destructive/10 transition-colors duration-200"
                                    onClick={() => handleDelete(activity.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4"/> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </motion.tr>
                        ))
                      )}
                    </AnimatePresence>
                  </LayoutGroup>
                </TableBody>
              </Table>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
      <ActivityDialog 
        open={openDialog} 
        onOpenChange={setOpenDialog} 
        activity={selectedActivity} 
        onSuccess={handleDialogSuccess}
      />
    </>
  )
}
