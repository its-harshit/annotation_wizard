"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface TimerContextType {
  sessionTime: string;
  annotationTime: string;
  isAnnotationActive: boolean;
  startAnnotation: (conversationId?: string) => void;
  stopAnnotation: () => void;
  getAnnotationDuration: () => string;
  resetAnnotationTimer: () => void;
  pauseAnnotation: () => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

// Helper function to format time
const formatTime = (milliseconds: number): string => {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export function TimerProvider({ children }: { children: ReactNode }) {
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [annotationStartTime, setAnnotationStartTime] = useState<Date | null>(null);
  const [accumulatedTime, setAccumulatedTime] = useState<number>(0);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [sessionTime, setSessionTime] = useState<string>('00:00:00');
  const [annotationTime, setAnnotationTime] = useState<string>('00:00:00');
  const [isAnnotationActive, setIsAnnotationActive] = useState(false);

  // Initialize session timer on mount
  useEffect(() => {
    const savedSessionStart = localStorage.getItem('sessionStartTime');
    if (savedSessionStart) {
      setSessionStartTime(new Date(savedSessionStart));
    } else {
      const now = new Date();
      setSessionStartTime(now);
      localStorage.setItem('sessionStartTime', now.toISOString());
    }
  }, []);

  // Session timer effect
  useEffect(() => {
    if (!sessionStartTime) return;

    const timer = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - sessionStartTime.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setSessionTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionStartTime]);

  // Annotation timer effect
  useEffect(() => {
    console.log('Annotation timer effect:', { annotationStartTime, isAnnotationActive, accumulatedTime });
    if (!annotationStartTime || !isAnnotationActive) return;

    const timer = setInterval(() => {
      const now = new Date();
      const currentSessionTime = now.getTime() - annotationStartTime.getTime();
      const totalTime = accumulatedTime + currentSessionTime;
      
      const newTime = formatTime(totalTime);
      console.log('Updating annotation time:', newTime, 'Total ms:', totalTime);
      setAnnotationTime(newTime);
    }, 1000);

    return () => clearInterval(timer);
  }, [annotationStartTime, isAnnotationActive, accumulatedTime]);

  const startAnnotation = useCallback((conversationId?: string) => {
    console.log('Starting annotation timer for conversation:', conversationId);
    
    if (conversationId) {
      setCurrentConversationId(conversationId);
      
      try {
        // Check if we have saved time for this conversation
        const savedData = localStorage.getItem(`annotation_${conversationId}`);
        if (savedData) {
          const { startTime, accumulatedTime: savedAccumulated, isCompleted } = JSON.parse(savedData);
          
          // If annotation is completed, don't start timer
          if (isCompleted) {
            console.log('Annotation already completed, showing final time');
            setAccumulatedTime(savedAccumulated || 0);
            setAnnotationStartTime(null);
            setIsAnnotationActive(false);
            setAnnotationTime(formatTime(savedAccumulated || 0));
            return;
          }
          
          const now = new Date();
          
          // Resume with accumulated time
          setAccumulatedTime(savedAccumulated || 0);
          setAnnotationStartTime(now);
          setIsAnnotationActive(true);
          
          // Update the saved data with new start time
          localStorage.setItem(`annotation_${conversationId}`, JSON.stringify({
            startTime: now.toISOString(),
            accumulatedTime: savedAccumulated || 0,
            isCompleted: false
          }));
          
          console.log('Resumed annotation timer with accumulated time:', savedAccumulated);
        } else {
          // First time opening this conversation
          const now = new Date();
          setAnnotationStartTime(now);
          setAccumulatedTime(0);
          setIsAnnotationActive(true);
          
          // Save initial data
          localStorage.setItem(`annotation_${conversationId}`, JSON.stringify({
            startTime: now.toISOString(),
            accumulatedTime: 0,
            isCompleted: false
          }));
          
          console.log('Started new annotation timer');
        }
      } catch (error) {
        console.error('Error handling annotation timer:', error);
        // Fallback: start fresh
        const now = new Date();
        setAnnotationStartTime(now);
        setAccumulatedTime(0);
        setIsAnnotationActive(true);
      }
    } else {
      // Fallback for backward compatibility
      const now = new Date();
      setAnnotationStartTime(now);
      setIsAnnotationActive(true);
      setAnnotationTime('00:00:00');
    }
  }, []);

  const stopAnnotation = useCallback(() => {
    setIsAnnotationActive(false);
  }, []);

  const pauseAnnotation = useCallback(() => {
    if (isAnnotationActive && annotationStartTime && currentConversationId) {
      const now = new Date();
      const currentSessionTime = now.getTime() - annotationStartTime.getTime();
      const newAccumulatedTime = accumulatedTime + currentSessionTime;
      
      // Save the accumulated time and mark as completed
      localStorage.setItem(`annotation_${currentConversationId}`, JSON.stringify({
        startTime: annotationStartTime.toISOString(),
        accumulatedTime: newAccumulatedTime,
        isCompleted: true
      }));
      
      setAccumulatedTime(newAccumulatedTime);
      setIsAnnotationActive(false);
      setAnnotationTime(formatTime(newAccumulatedTime));
      
      console.log('Paused annotation timer, accumulated time:', newAccumulatedTime);
    }
  }, [isAnnotationActive, annotationStartTime, currentConversationId, accumulatedTime]);

  const getAnnotationDuration = useCallback(() => {
    if (!annotationStartTime && !accumulatedTime) return '00:00:00';
    
    if (annotationStartTime) {
      const now = new Date();
      const currentSessionTime = now.getTime() - annotationStartTime.getTime();
      const totalTime = accumulatedTime + currentSessionTime;
      return formatTime(totalTime);
    } else {
      return formatTime(accumulatedTime);
    }
  }, [annotationStartTime, accumulatedTime]);

  const resetAnnotationTimer = useCallback(() => {
    setAnnotationStartTime(null);
    setIsAnnotationActive(false);
    setAnnotationTime('00:00:00');
    setAccumulatedTime(0);
    if (currentConversationId) {
      localStorage.removeItem(`annotation_${currentConversationId}`);
    }
  }, [currentConversationId]);

  const value: TimerContextType = {
    sessionTime,
    annotationTime,
    isAnnotationActive,
    startAnnotation,
    stopAnnotation,
    getAnnotationDuration,
    resetAnnotationTimer,
    pauseAnnotation,
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
} 