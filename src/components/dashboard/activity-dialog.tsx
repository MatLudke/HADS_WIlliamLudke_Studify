"use client"

import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Activity } from "@/lib/types"
import { addActivity, updateActivity } from "@/lib/firestore"
import { useToast } from "@/hooks/use-toast"
import { useAppState } from "@/contexts/AppStateContext"

const activitySchema = z.object({
  title: z.string().min(1, "Title is required."),
  subject: z.string().min(1, "Subject is required."),
  estimatedDuration: z.coerce.number().min(1, "Duration must be at least 1 minute."),
  priority: z.enum(["low", "medium", "high"]),
  // Goal fields (optional)
  goalType: z.enum(["none", "daily", "weekly", "monthly"]).optional(),
  goalTarget: z.coerce.number().min(0).optional(),
  goalRemindersEnabled: z.boolean().optional(),
});

type ActivityFormData = z.infer<typeof activitySchema>;

interface ActivityDialogProps {
  activity?: Activity | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void;
}

export function ActivityDialog({ open, onOpenChange, activity, onSuccess }: ActivityDialogProps) {
  const isEditing = !!activity;
  const { toast } = useToast();
  const { user, addActivityToState, updateActivityInState } = useAppState();

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      title: "",
      subject: "",
      estimatedDuration: 60,
      priority: "medium",
      goalType: "none",
      goalTarget: 0,
      goalRemindersEnabled: false,
    },
  });

  useEffect(() => {
    if (open) {
      if (activity) {
        reset({
          title: activity.title,
          subject: activity.subject,
          estimatedDuration: activity.estimatedDuration,
          priority: activity.priority,
        });
      } else {
        reset({
          title: "",
          subject: "",
          estimatedDuration: 60,
          priority: "medium",
        });
      }
    }
  }, [activity, reset, open]);

  const onSubmit = async (data: ActivityFormData) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be logged in to save an activity.",
      });
      return;
    }

    try {
      // Process goal data
      const goalData = data.goalType && data.goalType !== "none" ? {
        goalType: data.goalType,
        goalTarget: data.goalTarget || 0,
        goalStartDate: new Date(), // Start goal period from now
        goalRemindersEnabled: data.goalRemindersEnabled || false,
      } : {
        goalType: "none" as const,
        goalTarget: 0,
        goalStartDate: undefined,
        goalRemindersEnabled: false,
      };

      if (isEditing && activity) {
        // Optimistically update the state
        updateActivityInState(activity.id, { ...data, ...goalData, updatedAt: new Date() });
        await updateActivity(activity.id, { ...data, ...goalData, status: activity.status });
        toast({ title: "Activity updated successfully!" });
      } else {
        const newActivity: Activity = {
          id: '', // Will be set by Firestore
          ...data,
          ...goalData,
          status: 'todo',
          updatedAt: new Date(),
          userId: user.uid
        };
        
        // Create activity in Firestore first to get the ID
        const activityId = await addActivity(user.uid, { ...data, ...goalData, status: 'todo' });
        
        // Then add to state with the correct ID
        addActivityToState({ ...newActivity, id: activityId });
        toast({ 
          title: "Activity added successfully!",
          description: goalData.goalType !== "none" 
            ? `${goalData.goalType} goal: ${goalData.goalTarget} minutes` 
            : undefined
        });
      }
      onSuccess();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error saving activity",
        description: "An error occurred. Please try again.",
      });
      // In case of error, the context will automatically refresh from server
    }
  };


  const goalType = watch("goalType");
  const showGoalFields = goalType && goalType !== "none";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <AnimatePresence mode="wait">
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ 
                duration: 0.3, 
                ease: [0.16, 1, 0.3, 1] 
              }}
            >
              <form onSubmit={handleSubmit(onSubmit)}>
                <DialogHeader className="space-y-3">
                  <DialogTitle className="text-2xl">{isEditing ? '✏️ Edit Activity' : '➕ New Activity'}</DialogTitle>
                  <DialogDescription>
                    {isEditing ? 'Update your study activity details below.' : 'Create a new study activity and optionally set a goal.'}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-6">
                  {/* Basic Information Section */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-sm font-medium">
                        Title <span className="text-destructive">*</span>
                      </Label>
                      <Input 
                        id="title" 
                        placeholder="e.g., Math homework"
                        {...register("title")} 
                        className="transition-all duration-200 focus:ring-2"
                      />
                      <AnimatePresence>
                        {errors.title && (
                          <motion.p 
                            className="text-destructive text-xs mt-1"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            {errors.title.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-sm font-medium">
                        Subject <span className="text-destructive">*</span>
                      </Label>
                      <Input 
                        id="subject" 
                        placeholder="e.g., Mathematics"
                        {...register("subject")} 
                        className="transition-all duration-200 focus:ring-2"
                      />
                      <AnimatePresence>
                        {errors.subject && (
                          <motion.p 
                            className="text-destructive text-xs mt-1"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            {errors.subject.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="duration" className="text-sm font-medium">
                          Duration <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <Input 
                            id="duration" 
                            type="number" 
                            placeholder="60"
                            {...register("estimatedDuration")} 
                            className="transition-all duration-200 focus:ring-2 pr-12"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            min
                          </span>
                        </div>
                        <AnimatePresence>
                          {errors.estimatedDuration && (
                            <motion.p 
                              className="text-destructive text-xs mt-1"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                            >
                              {errors.estimatedDuration.message}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                  
                      <div className="space-y-2">
                        <Label htmlFor="priority" className="text-sm font-medium">
                          Priority <span className="text-destructive">*</span>
                        </Label>
                        <Controller
                          name="priority"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger className="transition-all duration-200 focus:ring-2">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">🟢 Low</SelectItem>
                                <SelectItem value="medium">🟡 Medium</SelectItem>
                                <SelectItem value="high">🔴 High</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Goal Tracking Section */}
                  <motion.div
                    className="space-y-4 pt-4 border-t"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎯</span>
                      <h3 className="text-sm font-semibold">Goal Tracking</h3>
                      <span className="text-xs text-muted-foreground">(Optional)</span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="goalType" className="text-sm font-medium">
                        Set a goal period
                      </Label>
                      <Controller
                        name="goalType"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} defaultValue={field.value || "none"}>
                            <SelectTrigger className="transition-all duration-200 focus:ring-2">
                              <SelectValue placeholder="No goal" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">⚪ No goal</SelectItem>
                              <SelectItem value="daily">📅 Daily Goal</SelectItem>
                              <SelectItem value="weekly">📆 Weekly Goal</SelectItem>
                              <SelectItem value="monthly">🗓️ Monthly Goal</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <p className="text-xs text-muted-foreground">
                        Track your study progress over time
                      </p>
                    </div>

                    <AnimatePresence>
                      {showGoalFields && (
                        <motion.div
                          className="space-y-4 p-4 bg-muted/50 rounded-lg border"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="space-y-2">
                            <Label htmlFor="goalTarget" className="text-sm font-medium">
                              Target minutes per {goalType}
                            </Label>
                            <div className="relative">
                              <Input 
                                id="goalTarget" 
                                type="number" 
                                placeholder="e.g., 60"
                                {...register("goalTarget")} 
                                className="transition-all duration-200 focus:ring-2 pr-12"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                min
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {goalType === "daily" && "How many minutes you want to study each day"}
                              {goalType === "weekly" && "Total minutes you want to study this week"}
                              {goalType === "monthly" && "Total minutes you want to study this month"}
                            </p>
                          </div>

                          <div className="flex items-start gap-3 p-3 bg-background rounded-md">
                            <input
                              id="goalReminders"
                              type="checkbox"
                              {...register("goalRemindersEnabled")}
                              className="h-4 w-4 mt-0.5 rounded border-input accent-primary"
                            />
                            <div className="flex-1">
                              <Label htmlFor="goalReminders" className="text-sm font-medium cursor-pointer">
                                📧 Email reminders
                              </Label>
                              <p className="text-xs text-muted-foreground mt-1">
                                Get notified if you&apos;re falling behind on your goal
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
                
                <DialogFooter className="gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="min-w-[100px]"
                  >
                    {isSubmitting ? "Saving..." : isEditing ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
