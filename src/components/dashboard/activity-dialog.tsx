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
    formState: { errors, isSubmitting },
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      title: "",
      subject: "",
      estimatedDuration: 60,
      priority: "medium",
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
      if (isEditing && activity) {
        // Optimistically update the state
        updateActivityInState(activity.id, { ...data, updatedAt: new Date() });
        await updateActivity(activity.id, { ...data, status: activity.status });
        toast({ title: "Activity updated successfully!" });
      } else {
        const newActivity: Activity = {
          id: '', // Will be set by Firestore
          ...data,
          status: 'todo',
          updatedAt: new Date(),
          userId: user.uid
        };
        
        // Create activity in Firestore first to get the ID
        const activityId = await addActivity(user.uid, { ...data, status: 'todo' });
        
        // Then add to state with the correct ID
        addActivityToState({ ...newActivity, id: activityId });
        toast({ title: "Activity added successfully!" });
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


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden">
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
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Activity' : 'Add Activity'}</DialogTitle>
                    <DialogDescription>
                      {isEditing ? 'Update the details of your study activity.' : 'Fill in the details for the new study activity.'}
                    </DialogDescription>
                  </DialogHeader>
                </motion.div>
                
                <motion.div 
                  className="grid gap-4 py-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <motion.div 
                    className="grid grid-cols-4 items-center gap-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                  >
                    <Label htmlFor="title" className="text-right">
                      Title
                    </Label>
                    <div className="col-span-3">
                      <Input 
                        id="title" 
                        {...register("title")} 
                        className="transition-all duration-300 focus:shadow-md"
                      />
                      <AnimatePresence>
                        {errors.title && (
                          <motion.p 
                            className="text-destructive text-xs mt-1"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {errors.title.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="grid grid-cols-4 items-center gap-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                  >
                    <Label htmlFor="subject" className="text-right">
                      Subject
                    </Label>
                    <div className="col-span-3">
                      <Input 
                        id="subject" 
                        {...register("subject")} 
                        className="transition-all duration-300 focus:shadow-md"
                      />
                      <AnimatePresence>
                        {errors.subject && (
                          <motion.p 
                            className="text-destructive text-xs mt-1"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {errors.subject.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="grid grid-cols-4 items-center gap-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                  >
                    <Label htmlFor="duration" className="text-right">
                      Duration (min)
                    </Label>
                    <div className="col-span-3">
                      <Input 
                        id="duration" 
                        type="number" 
                        {...register("estimatedDuration")} 
                        className="transition-all duration-300 focus:shadow-md"
                      />
                      <AnimatePresence>
                        {errors.estimatedDuration && (
                          <motion.p 
                            className="text-destructive text-xs mt-1"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {errors.estimatedDuration.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="grid grid-cols-4 items-center gap-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 }}
                  >
                    <Label htmlFor="priority" className="text-right">
                      Priority
                    </Label>
                    <Controller
                      name="priority"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="col-span-3 transition-all duration-300 hover:shadow-md">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </motion.div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.7 }}
                >
                  <DialogFooter>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="transition-all duration-300 hover:shadow-md"
                      >
                        {isSubmitting ? "Saving..." : "Save"}
                      </Button>
                    </motion.div>
                  </DialogFooter>
                </motion.div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
