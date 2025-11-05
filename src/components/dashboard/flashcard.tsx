"use client"

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface FlashcardQuestion {
  id: string;
  question: string;
  type: "multiple-choice" | "true-false";
  options?: string[];
  correctAnswer: string;
  gradient?: {
    color1: string;
    color2: string;
    color3: string;
  };
}

interface FlashcardProps {
  question: FlashcardQuestion;
  onAnswer?: (isCorrect: boolean) => void;
}

export function Flashcard({ question, onAnswer }: FlashcardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleAnswerClick = (answer: string) => {
    if (revealed) return;
    
    setSelectedAnswer(answer);
    setRevealed(true);
    
    const isCorrect = answer === question.correctAnswer;
    if (onAnswer) {
      onAnswer(isCorrect);
    }
  };

  const getButtonStyle = (option: string) => {
    if (!revealed) {
      return "bg-white/40 backdrop-blur-sm hover:bg-white/60";
    }
    
    if (option === question.correctAnswer) {
      return "bg-green-400/60 backdrop-blur-sm border-2 border-green-600";
    }
    
    if (option === selectedAnswer && option !== question.correctAnswer) {
      return "bg-red-400/60 backdrop-blur-sm border-2 border-red-600";
    }
    
    return "bg-white/30 backdrop-blur-sm opacity-50";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
      animate={{ 
        opacity: 1, 
        scale: revealed ? [1, 1.05, 1] : 1,
        rotateY: 0,
      }}
      exit={{ opacity: 0, scale: 0.9, rotateY: 15 }}
      whileHover={{ scale: 1.03, y: -8 }}
      transition={{ 
        type: "spring",
        stiffness: 400,
        damping: 25,
        duration: 0.2,
      }}
      className="w-[280px] h-[400px] rounded-xl p-8 flex flex-col items-center justify-start gap-5 shadow-xl hover:shadow-2xl transition-shadow duration-150"
      style={{
        background: question.gradient
          ? `radial-gradient(
              circle at 50% 50%,
              ${question.gradient.color1} 0%,
              ${question.gradient.color2} 50%,
              ${question.gradient.color3} 100%
            )`
          : `radial-gradient(
              circle at 50% 50%,
              rgba(255, 117, 140, 1) 0%,
              rgba(254, 164, 161, 1) 50%,
              rgba(253, 210, 181, 1) 100%
            )`,
      }}
    >
      {/* Question */}
      <motion.div 
        className="flex-1 flex items-center justify-center text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-lg font-semibold text-gray-900 leading-snug" style={{ textShadow: '0 1px 2px rgba(255, 255, 255, 0.3)' }}>
          {question.question}
        </p>
      </motion.div>

      {/* Options */}
      <div className="w-full flex flex-col gap-3">
        {question.type === "multiple-choice" && question.options ? (
          question.options.map((option, index) => (
            <motion.button
              key={option}
              onClick={() => handleAnswerClick(option)}
              disabled={revealed}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                delay: 0.3 + index * 0.1,
                type: "spring",
                stiffness: 500,
                damping: 30,
              }}
              whileHover={!revealed ? { scale: 1.05, y: -2 } : {}}
              whileTap={!revealed ? { scale: 0.96 } : {}}
              className={cn(
                "w-full h-[50px] px-3 py-2 rounded-lg text-xs font-medium text-gray-900 transition-all duration-100 flex items-center justify-center text-center leading-tight",
                getButtonStyle(option),
                !revealed && "hover:shadow-xl cursor-pointer"
              )}
            >
              <span className="break-words line-clamp-2 overflow-hidden">{option}</span>
            </motion.button>
          ))
        ) : (
          <>
            <motion.button
              onClick={() => handleAnswerClick("True")}
              disabled={revealed}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={!revealed ? { scale: 1.05, y: -2 } : {}}
              whileTap={!revealed ? { scale: 0.96 } : {}}
              className={cn(
                "w-full h-[50px] rounded-lg text-sm font-medium text-gray-900 transition-all duration-100 flex items-center justify-center",
                getButtonStyle("True"),
                !revealed && "hover:shadow-xl cursor-pointer"
              )}
            >
              True
            </motion.button>
            <motion.button
              onClick={() => handleAnswerClick("False")}
              disabled={revealed}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={!revealed ? { scale: 1.05, y: -2 } : {}}
              whileTap={!revealed ? { scale: 0.96 } : {}}
              className={cn(
                "w-full h-[50px] rounded-lg text-sm font-medium text-gray-900 transition-all duration-100 flex items-center justify-center",
                getButtonStyle("False"),
                !revealed && "hover:shadow-xl cursor-pointer"
              )}
            >
              False
            </motion.button>
          </>
        )}
      </div>
    </motion.div>
  );
}
