"use client"

import { motion } from "framer-motion";
import { Header } from "@/components/dashboard/header";
import { ActivityList } from "@/components/dashboard/activity-list";
import { StudyTimerV2 } from "@/components/dashboard/study-timer-v2";
import { useGoalReminders } from "@/hooks/use-goal-reminders";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const itemVariants = {
  hidden: { 
    y: 30, 
    opacity: 0, 
    scale: 0.95,
    filter: "blur(4px)",
  },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 25,
      duration: 0.8,
    },
  },
};

export default function DashboardPage() {
  // Automatically check goals and send reminders when dashboard loads
  useGoalReminders();

  return (
    <>
      <Header title="Dashboard" />
      <main className="flex-1 overflow-auto p-6 md:p-8 pt-24 md:pt-32 lg:pt-40">
        <motion.div 
          className="grid gap-8 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="lg:col-span-2" variants={itemVariants}>
            <ActivityList />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StudyTimerV2 />
          </motion.div>
        </motion.div>
      </main>
    </>
  );
}
