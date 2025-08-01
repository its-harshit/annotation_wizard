"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { conversationCriteriaCategories, turnCriteria } from '../criteria.config';
import { useTimer } from '../contexts/TimerContext';
import ReactMarkdown from 'react-markdown';
import { createPortal } from 'react-dom';

function getTurnPairs(conv: { role: string; content: string; tool_calls?: Array<{
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}>; tool_call_id?: string }[]) {
  const pairs = [];
  let i = 0;
  
  while (i < conv.length) {
    const currentTurn = conv[i];
    
    if (currentTurn.role === 'user') {
      // Start a new turn segment with the user message
      const turnSegment = [currentTurn];
      let j = i + 1;
      
      // Collect all subsequent messages until we hit the next user message
      while (j < conv.length && conv[j].role !== 'user') {
        turnSegment.push(conv[j]);
        j++;
      }
      
      // Add the complete turn segment (user + all responses)
      pairs.push(turnSegment);
      
      // Move to the next user message
      i = j;
    } else {
      // Skip any non-user messages at the beginning
      i++;
    }
  }
  
  return pairs;
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  const percent = Math.round((step / total) * 100);
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
      <div
        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out shadow-sm"
        style={{ width: `${percent}%` }}
      ></div>
    </div>
  );
}

function Tooltip({ text, label, critId, onPanelOpen }: { text: string, label?: string, critId?: string, onPanelOpen?: (critId: string, position: { top: number; left: number }) => void }) {
  const handleClick = (e: React.MouseEvent) => {
    if (critId && onPanelOpen) {
      const rect = e.currentTarget.getBoundingClientRect();
      onPanelOpen(critId, { top: rect.top, left: rect.right + 10 });
    }
  };

  return (
    <span className="ml-1 cursor-pointer relative inline-block align-middle">
      <button
        type="button"
        className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors shadow focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label="Show rubric"
        onClick={handleClick}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <line x1="12" y1="16" x2="12" y2="12" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="8" r="1" fill="currentColor" />
        </svg>
      </button>
    </span>
  );
}

function AnnotatePageContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationId = searchParams.get('conversationId');
  const projectId = searchParams.get('projectId');
  // Set initial step based on conversation length - single turn conversations go directly to conversation level
  const [step, setStep] = useState<'conversation' | 'turns'>('turns');
  const [turnIndex, setTurnIndex] = useState(0);
  const [conversationRatings, setConversationRatings] = useState<Record<string, number | null>>({});
  const [turnRatings, setTurnRatings] = useState<Array<Record<string, number | null>>>([]);
  const [conversationComment, setConversationComment] = useState('');
  const [turnComments, setTurnComments] = useState<string[]>([]);
  const [conversationSkipped, setConversationSkipped] = useState(false);
  const [turnSkipped, setTurnSkipped] = useState<boolean[]>([]);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [conversation, setConversation] = useState<{ 
    role: string; 
    content: string; 
    turnId?: string;
    tool_calls?: Array<{
      id: string;
      type: string;
      function: {
        name: string;
        arguments: string;
      };
    }>;
    tool_call_id?: string;
  }[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [saveError, setSaveError] = useState('');
  // Add hovered state above the criteria rendering loop
  const [hovered, setHovered] = useState<{ critId: string, value: number } | null>(null);
  const [validationMessage, setValidationMessage] = useState('');
  const [encouragementMessage, setEncouragementMessage] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  // Add active tab state for the new tabbed interface
  const [activeTab, setActiveTab] = useState<string>('safety_and_biasness');
  // Add panel state for slide-out descriptions
  const [openPanel, setOpenPanel] = useState<{ critId: string; position: { top: number; left: number } } | null>(null);
  // Timer context
  const { startAnnotation, stopAnnotation, getAnnotationDuration, pauseAnnotation } = useTimer();
  // Remove showFullConversation state since we'll always show full conversation

  // Fetch the specific conversation by conversationId
  useEffect(() => {
    if (!conversationId) {
      setError('No conversation selected.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    fetch(`/api/conversations/item?conversationId=${conversationId}`)
      .then(res => {
        if (!res.ok) throw new Error('Conversation not found');
        return res.json();
      })
      .then(data => {
        setConversation(data.conversation || []);
        // For single-turn conversations, start directly at conversation level
        const conversationTurns = data.conversation || [];
        const pairs = getTurnPairs(conversationTurns);
        if (pairs.length === 1) {
          setStep('conversation');
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [conversationId]);

  type Turn = { 
    role: string; 
    content: string; 
    turnId?: string;
    tool_calls?: Array<{
      id: string;
      type: string;
      function: {
        name: string;
        arguments: string;
      };
    }>;
    tool_call_id?: string;
  };
  const turnPairs = getTurnPairs(conversation as Turn[]) as unknown as [Turn, Turn][];
  const isSingleTurnConversation = turnPairs.length === 1;
  const LOCAL_STORAGE_KEY = 'annotationWizardProgress';

  // Show welcome message on first load
  useEffect(() => {
    const lastVisit = localStorage.getItem('lastAnnotationVisit');
    const today = new Date().toDateString();
    
    if (lastVisit !== today) {
      setEncouragementMessage("🌟 Welcome back! Ready to make AI smarter today? Let's do this! 💪✨");
      localStorage.setItem('lastAnnotationVisit', today);
      setTimeout(() => setEncouragementMessage(''), 5000);
    }
  }, []);

  // Remove keyboard shortcut since we always show full conversation now

  // Restore state from backend or localStorage on mount
  useEffect(() => {
    async function restoreProgress() {
      if (!conversationId || !projectId || !session?.user?.email) return;
      setLoading(true);
      setError('');
      try {
        // Try backend first
        const res = await fetch(`/api/annotations/item?conversationId=${conversationId}&projectId=${projectId}&userId=${encodeURIComponent(session.user.email)}`);
        if (res.ok) {
          const data = await res.json();
          setStep(data.step || 'turns');
          setTurnIndex(0);
          setConversationRatings(data.conversationRatings || {});
          setTurnRatings(data.turnRatings || []);
          setConversationComment(data.conversationComment || '');
          setTurnComments(data.turnComments || []);
          setConversationSkipped(data.conversationSkipped || false);
          setTurnSkipped(data.turnSkipped || []);
          setActiveTab(data.activeTab || 'safety_and_biasness');
          setLoading(false);
          return;
        }
      } catch {
        // ignore, fallback to localStorage
      }
      // Fallback: localStorage
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setStep(data.step || 'turns');
        setTurnIndex(data.turnIndex || 0);
        setConversationRatings(data.conversationRatings || {});
        setTurnRatings(data.turnRatings || []);
        setConversationComment(data.conversationComment || '');
        setTurnComments(data.turnComments || []);
        setConversationSkipped(data.conversationSkipped || false);
        setTurnSkipped(data.turnSkipped || []);
        setActiveTab(data.activeTab || 'safety_and_biasness');
      }
      setLoading(false);
    }
    restoreProgress();
  }, [conversationId, projectId, session?.user?.email]);
  // Auto-save state to localStorage on change
  useEffect(() => {
    const data = {
      step,
      turnIndex,
      conversationRatings,
      turnRatings,
      conversationComment,
      turnComments,
      conversationSkipped,
      turnSkipped,
      activeTab,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  }, [step, turnIndex, conversationRatings, turnRatings, conversationComment, turnComments, conversationSkipped, turnSkipped, activeTab]);

  // Auto-save state to backend on change (debounced)
  useEffect(() => {
    const userEmail = session?.user?.email || '';
    if (!userEmail || !conversationId || !projectId) return;
    const timeout = setTimeout(() => {
      fetch('/api/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          projectId,
          userId: userEmail,
          conversationRatings,
          conversationComment,
          turnRatings,
          turnComments,
          turnSkipped,
          conversationSkipped,
          activeTab,
          status: 'in_progress',
        }),
      });
    }, 1000); // 1s debounce
    return () => clearTimeout(timeout);
  }, [conversationId, projectId, session, conversationRatings, conversationComment, turnRatings, turnComments, turnSkipped, conversationSkipped, activeTab]);

  // Auto-clear skip/flag if all required ratings are filled
  useEffect(() => {
    const allConversationCriteria = conversationCriteriaCategories.flatMap(category => category.criteria);
    if ((step === 'conversation' || isSingleTurnConversation) && conversationSkipped && !allConversationCriteria.some((c) => conversationRatings[c.id] == null)) {
      setConversationSkipped(false);
    }
    if (step === 'turns' && turnSkipped[turnIndex] && !turnCriteria.some((c) => turnRatings[turnIndex]?.[c.id] == null)) {
      setTurnSkipped((prev) => {
        const updated = [...prev];
        updated[turnIndex] = false;
        return updated;
      });
    }
  }, [step, conversationRatings, turnRatings, turnIndex, conversationSkipped, turnSkipped, isSingleTurnConversation]);

  const handleUnskip = () => {
    if (step === 'conversation' || isSingleTurnConversation) {
      setConversationSkipped(false);
    } else {
      setTurnSkipped((prev) => {
        const updated = [...prev];
        updated[turnIndex] = false;
        return updated;
      });
    }
  };

  const showEncouragement = (type: 'turn' | 'conversation' | 'milestone') => {
    const messages = {
      turn: [
        "Great job! You're making excellent progress! 🎉",
        "Well done! Your attention to detail is impressive! ✨",
        "Excellent work! You're helping improve AI responses! 🚀",
        "Brilliant! Your precision is outstanding! 🎯",
        "Fantastic! You're a natural at this! 🌟",
        "Amazing! Your insights are invaluable! 💎",
        "Outstanding! You're making AI smarter! 🧠",
        "Perfect! Your expertise shines through! ⭐",
        "Incredible! You're a quality champion! 🏆",
        "Superb! Your dedication is inspiring! 💫",
        "Wonderful! You're helping shape the future! 🌈",
        "Exceptional! Your work ethic is admirable! 💪",
        "Phenomenal! You're a true professional! 👑",
        "Magnificent! Your contributions matter! 🎊",
        "Spectacular! You're exceeding expectations! 🚀"
      ],
      conversation: [
        "Fantastic! You've completed another conversation! 🎊",
        "Amazing work! Your contributions are valuable! 💪",
        "Outstanding! You're making a real difference! 🌟",
        "Congratulations! Another conversation conquered! 🎉",
        "Incredible! You're building better AI! 🤖",
        "Phenomenal! Your work is making waves! 🌊",
        "Spectacular! You're a conversation master! 👑",
        "Brilliant! You've nailed this conversation! 💎",
        "Magnificent! Your expertise is unmatched! ⭐",
        "Superb! You're helping AI understand humans! 🧠",
        "Wonderful! Another step toward better AI! 🚀",
        "Exceptional! Your attention to detail is legendary! 🏆",
        "Perfect! You're a conversation wizard! 🧙‍♂️",
        "Outstanding! Your insights are pure gold! 💰",
        "Amazing! You're making AI more human! ❤️"
      ],
      milestone: [
        "Milestone reached! You're on fire! 🔥",
        "Incredible progress! Keep up the great work! 🎯",
        "You're crushing it! This is fantastic work! 🏆",
        "🎉 Milestone unlocked! You're unstoppable! 💪",
        "🔥 Hot streak! You're absolutely killing it! ⚡",
        "🌟 Achievement unlocked! You're a legend! 👑",
        "🚀 Rocket progress! You're flying high! ✈️",
        "💎 Diamond performance! You're priceless! 💰",
        "⭐ Star quality! You're shining bright! ✨",
        "🏅 Medal earned! You're a champion! 🎖️",
        "🎊 Celebration time! You're amazing! 🎈",
        "⚡ Lightning speed! You're electric! ⚡",
        "🌈 Rainbow progress! You're magical! 🦄",
        "🎯 Bullseye! You're hitting all the targets! 🎯",
        "🚀 Launch sequence! You're reaching new heights! 🌟",
        "💫 Shooting star! You're leaving trails of excellence! 🌠",
        "🏆 Trophy earned! You're a winner! 🏅",
        "🎪 Circus level skills! You're entertaining and efficient! 🎭",
        "🌟 Supernova! You're exploding with talent! 💥",
        "🎊 Party time! You're the life of the annotation party! 🎉"
      ]
    };
    
    const messageList = messages[type];
    const randomMessage = messageList[Math.floor(Math.random() * messageList.length)];
    setEncouragementMessage(randomMessage);
    
    // Clear after 4 seconds
    setTimeout(() => setEncouragementMessage(''), 4000);
  };

  const handleConversationRating = (id: string, value: number) => {
    setConversationRatings((prev: Record<string, number | null>) => ({
      ...prev,
      [id]: prev[id] === value ? null : value,
    }));
    
    // Check if all conversation criteria are rated
    const newRatings = { ...conversationRatings, [id]: value };
    const allConversationCriteria = conversationCriteriaCategories.flatMap(category => category.criteria);
    const allRated = allConversationCriteria.every(c => newRatings[c.id] != null);
    if (allRated) {
      showEncouragement('conversation');
    }
  };
  const handleTurnRating = (id: string, value: number) => {
    setTurnRatings((prev) => {
      const updated = [...prev];
      updated[turnIndex] = {
        ...updated[turnIndex],
        [id]: updated[turnIndex]?.[id] === value ? null : value,
      };
      return updated;
    });
    
    // Check if all criteria for this turn are rated
    const currentTurnRatings = turnRatings[turnIndex] || {};
    const newRatings = { ...currentTurnRatings, [id]: value };
    const allRated = turnCriteria.every(c => newRatings[c.id] != null);
    if (allRated) {
      showEncouragement('turn');
    }
  };
  const handleConversationComment = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setConversationComment(e.target.value);
  };
  const handleTurnComment = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTurnComments((prev) => {
      const updated = [...prev];
      updated[turnIndex] = e.target.value;
      return updated;
    });
  };

  const handlePanelOpen = (critId: string, position: { top: number; left: number }) => {
    setOpenPanel({ critId, position });
  };

  const handlePanelClose = () => {
    setOpenPanel(null);
  };

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openPanel && !(event.target as Element).closest('.panel-content')) {
        setOpenPanel(null);
      }
    };

    if (openPanel) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openPanel]);

  // Start annotation timer when page loads
  useEffect(() => {
    if (conversationId) {
      console.log('Annotation page loaded, starting timer for conversation:', conversationId);
      startAnnotation(conversationId);
    }
    return () => {
      console.log('Annotation page unmounting, stopping timer...');
      stopAnnotation();
    };
  }, [conversationId, startAnnotation, stopAnnotation]); // Add all dependencies

  // Auto-save functionality
  useEffect(() => {
    const autoSave = async () => {
      if (!conversationId || !projectId || !session?.user?.email) return;
      
      try {
        const annotationData = {
          conversationId,
          projectId,
          userId: session.user.email,
          step,
          turnIndex,
          conversationRatings,
          turnRatings,
          conversationComment,
          turnComments,
          conversationSkipped,
          turnSkipped,
          activeTab,
          completed: false,
          updatedAt: new Date().toISOString()
        };
        
        await fetch('/api/annotations/item', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(annotationData)
        });
        
        console.log('Auto-save completed');
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    };

    const interval = setInterval(autoSave, 30000); // Auto-save every 30 seconds
    return () => clearInterval(interval);
  }, [conversationId, projectId, session?.user?.email, step, turnIndex, conversationRatings, turnRatings, conversationComment, turnComments, conversationSkipped, turnSkipped, activeTab]);

  // Navigation prevention
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Check if there's unsaved progress
      const hasProgress = Object.keys(conversationRatings).length > 0 || 
                         turnRatings.some(ratings => Object.keys(ratings).length > 0) ||
                         conversationComment.trim() !== '' ||
                         turnComments.some(comment => comment.trim() !== '');
      
      if (hasProgress) {
        e.preventDefault();
        e.returnValue = ''; // This shows the browser's default "Leave Site?" dialog
        return '';
      }
    };

    const handleUnload = async () => {
      // Final save attempt when page is actually unloading
      if (!conversationId || !projectId || !session?.user?.email) return;
      
      try {
        const annotationData = {
          conversationId,
          projectId,
          userId: session.user.email,
          step,
          turnIndex,
          conversationRatings,
          turnRatings,
          conversationComment,
          turnComments,
          conversationSkipped,
          turnSkipped,
          activeTab,
          completed: false,
          updatedAt: new Date().toISOString()
        };
        
        // Use sendBeacon for reliable delivery during page unload
        navigator.sendBeacon('/api/annotations/item', JSON.stringify(annotationData));
      } catch (error) {
        console.error('Final save failed:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, [conversationId, projectId, session?.user?.email, step, turnIndex, conversationRatings, turnRatings, conversationComment, turnComments, conversationSkipped, turnSkipped, activeTab]);
  const checkValidation = () => {
    if (step === 'conversation' || isSingleTurnConversation) {
      const allConversationCriteria = conversationCriteriaCategories.flatMap(category => category.criteria);
      const missingCriteria = allConversationCriteria.filter(c => conversationRatings[c.id] == null);
      if (missingCriteria.length > 0) {
        return `Almost there! Just a few more criteria to rate for this conversation.\n\nMissing: ${missingCriteria.map(c => c.label).join(', ')}`;
      }
    } else if (step === 'turns') {
      const missingCriteria = turnCriteria.filter(c => turnRatings[turnIndex]?.[c.id] == null);
      if (missingCriteria.length > 0) {
        return `Almost there! Just a few more criteria to rate for this turn.\n\nMissing: ${missingCriteria.map(c => c.label).join(', ')}`;
      }
    }
    return '';
  };

  const handleNext = () => {
    const validationError = checkValidation();
    if (validationError) {
      setValidationMessage(validationError);
      // Clear the message after 3 seconds
      setTimeout(() => setValidationMessage(''), 5000);
      return;
    }
    
    setValidationMessage(''); // Clear any existing validation message
    
    if (step === 'turns' && turnIndex < turnPairs.length - 1) {
      setTurnIndex(turnIndex + 1);
      // Show milestone encouragement at various progress points
      const newTurnIndex = turnIndex + 1;
      const totalTurns = turnPairs.length;
      
      // Different milestone triggers
      if (newTurnIndex === 1) {
        showEncouragement('milestone'); // First turn completed
      } else if (newTurnIndex === Math.ceil(totalTurns * 0.25)) {
        showEncouragement('milestone'); // 25% milestone
      } else if (newTurnIndex === Math.ceil(totalTurns * 0.5)) {
        showEncouragement('milestone'); // 50% milestone
      } else if (newTurnIndex === Math.ceil(totalTurns * 0.75)) {
        showEncouragement('milestone'); // 75% milestone
      } else if (newTurnIndex === totalTurns) {
        showEncouragement('milestone'); // Last turn completed
      } else if (newTurnIndex % 3 === 0) {
        showEncouragement('milestone'); // Every 3rd turn
      }
    } else if (step === 'turns' && turnIndex === turnPairs.length - 1) {
      setStep('conversation');
      showEncouragement('milestone'); // Moving to conversation step
    } else if (step === 'conversation') {
      setShowFinishDialog(true);
    }
  };
  const handleBack = () => {
    if (step === 'conversation') {
      // For single-turn conversations, there's no back step
      // For multi-turn conversations, go back to turns
      if (!isSingleTurnConversation) {
        setStep('turns');
        setTurnIndex(turnPairs.length - 1);
      }
    } else if (step === 'turns' && turnIndex > 0) {
      setTurnIndex(turnIndex - 1);
    }
  };
  const handleSkip = () => {
    if (step === 'conversation') {
      setConversationSkipped(true);
      // For single-turn conversations, go directly to finish
      // For multi-turn conversations, go back to turns
      if (isSingleTurnConversation) {
        setShowFinishDialog(true);
      } else {
        setStep('turns');
      }
    } else {
      setTurnSkipped((prev) => {
        const updated = [...prev];
        updated[turnIndex] = true;
        return updated;
      });
      if (turnIndex < turnPairs.length - 1) {
        setTurnIndex(turnIndex + 1);
      } else {
        setShowFinishDialog(true);
      }
    }
  };
  const handleFinish = async () => {
    setShowFinishDialog(false);
    
    // Pause the annotation timer
    pauseAnnotation();
    
    const annotationDuration = getAnnotationDuration();
    
    // Show subtle celebration with completion time
    setShowCelebration(true);
    setEncouragementMessage(`🎉 Congratulations! Annotation completed in ${annotationDuration}! 🎊`);
    
    // Hide celebration after 3 seconds and then save
    setTimeout(async () => {
      setShowCelebration(false);
      setSaveStatus('saving');
      setSaveError('');
      try {
        const res = await fetch('/api/annotations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            projectId,
            userId: session?.user?.email || 'anonymous',
            conversationRatings,
            conversationComment,
            turnRatings,
            turnComments,
            turnSkipped,
            conversationSkipped,
            activeTab,
            status: 'completed',
          }),
        });
        if (!res.ok) throw new Error('Failed to save annotation');
        setSaveStatus('success');
        alert('Annotation saved!');
        setStep('conversation');
        setTurnIndex(0);
        setConversationRatings({});
        setTurnRatings([]);
        setConversationComment('');
        setTurnComments([]);
        setConversationSkipped(false);
        setTurnSkipped([]);
        setActiveTab('safety_and_biasness');
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        // Redirect back to project detail page
        router.push(`/projects/${projectId}`);
      } catch (err: unknown) {
        setSaveStatus('error');
        const errorMessage = err instanceof Error ? err.message : 'Failed to save annotation';
        setSaveError(errorMessage);
        alert('Failed to save annotation: ' + errorMessage);
      }
    }, 2000); // Wait 2 seconds for celebration
  };

  // Progress calculation: for single-turn conversations, only 1 step (conversation level)
  // For multi-turn conversations: turns first, then conversation as last step
  const totalSteps = isSingleTurnConversation ? 1 : turnPairs.length + 1;
  const currentStep = isSingleTurnConversation ? 1 : (step === 'turns' ? turnIndex + 1 : totalSteps);

  if (loading) {
    return <main className="min-h-screen flex items-center justify-center"><div>Loading conversation...</div></main>;
  }
  if (error) {
    return <main className="min-h-screen flex items-center justify-center text-red-600">{error}</main>;
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center font-sans">
      <header className="w-full max-w-8xl sticky top-0 z-20 bg-gray-50 border-b border-gray-200 px-4 py-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Annotation Wizard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-500 text-sm">Step {currentStep} of {totalSteps}</span>
          </div>
        </div>
        <ProgressBar step={currentStep} total={totalSteps} />
      </header>
      <div className="w-full max-w-8xl flex-1 flex flex-col md:flex-row gap-0 md:gap-8 px-2 md:px-4 py-8">
        <section className="md:w-7/12 w-full mb-8 md:mb-0 flex flex-col">
          <div className="bg-white shadow-lg rounded-xl p-6 flex flex-col sticky top-4 max-h-[calc(100vh-140px)] overflow-y-auto">
            {(step === 'conversation' || isSingleTurnConversation) ? (
              <>
                <h2 className="text-lg font-semibold mb-4 text-blue-700">Full Conversation</h2>
                <div className="space-y-3 pr-2">
                  {conversation.map((turn, idx) => (
                    <div key={idx} className={`flex items-start gap-2 p-3 rounded-lg transition-all duration-200 hover:shadow-md ${
                      turn.role === 'user' ? 'bg-blue-50 border border-blue-200' : 
                      turn.role === 'assistant' ? 'bg-green-50 border border-green-200' :
                      turn.role === 'tool' ? 'bg-purple-50 border border-purple-200' :
                      'bg-gray-50 border border-gray-200'
                    }`}> 
                      <span className={`font-bold capitalize ${
                        turn.role === 'user' ? 'text-blue-700' : 
                        turn.role === 'assistant' ? 'text-green-700' :
                        turn.role === 'tool' ? 'text-purple-700' :
                        'text-gray-700'
                      }`}>{turn.role}:</span>
                      <div className="flex-1">
                        <div className="text-gray-800">
                          <ReactMarkdown>{turn.content}</ReactMarkdown>
                        </div>
                        {turn.tool_calls && turn.tool_calls.length > 0 && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                            <div className="font-semibold text-yellow-800 mb-1">Tool Calls:</div>
                            {turn.tool_calls.map((toolCall, toolIdx: number) => (
                              <div key={toolIdx} className="mb-1">
                                <span className="font-medium text-yellow-700">Function:</span> {toolCall.function.name}
                                <br />
                                <span className="font-medium text-yellow-700">Arguments:</span> {toolCall.function.arguments}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-blue-700">
                    {isSingleTurnConversation ? 'Single Turn Conversation' : `Turn ${turnIndex + 1} of ${turnPairs.length}`}
                  </h2>
                </div>
                
                {/* Display turnId for the current turn pair */}
                <div className="mb-2 text-xs text-gray-500">
                  <span>Turn IDs: </span>
                  {turnPairs[turnIndex].map((turn, idx) => (
                    <span key={idx} className="inline-block mr-2">
                      {turn.role}: {turn.turnId ?? '(no id)'}
                    </span>
                  ))}
                </div>
                
                {/* Full conversation with current turn highlighted */}
                <div className="space-y-3 pr-2">
                  {conversation.map((turn, idx) => {
                    // Check if this turn is part of the current turn being annotated
                    const currentTurnTurns = turnPairs[turnIndex] || [];
                    const isCurrentTurn = currentTurnTurns.some(t => t.turnId === turn.turnId);
                    
                                          return (
                        <div key={idx} className={`flex items-start gap-2 p-3 rounded-lg transition-all duration-200 ${
                          isCurrentTurn ? (
                            turn.role === 'user' ? 'bg-blue-50 border border-blue-200' : 
                            turn.role === 'assistant' ? 'bg-green-50 border border-green-200' :
                            turn.role === 'tool' ? 'bg-purple-50 border border-purple-200' :
                            'bg-gray-50 border border-gray-200'
                          ) : 'bg-gray-100 border border-gray-200'
                        } ${isCurrentTurn ? 'ring-2 ring-blue-400 shadow-md' : 'opacity-60'}`}>
                          <span className={`font-bold capitalize ${
                            isCurrentTurn ? (
                              turn.role === 'user' ? 'text-blue-700' : 
                              turn.role === 'assistant' ? 'text-green-700' :
                              turn.role === 'tool' ? 'text-purple-700' :
                              'text-gray-700'
                            ) : 'text-gray-500'
                          }`}>{turn.role}:</span>
                        <div className="flex-1">
                          <div className="text-gray-800">
                            <ReactMarkdown>{turn.content}</ReactMarkdown>
                          </div>
                          {turn.tool_calls && turn.tool_calls.length > 0 && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                              <div className="font-semibold text-yellow-800 mb-1">Tool Calls:</div>
                              {turn.tool_calls.map((toolCall, toolIdx: number) => (
                                <div key={toolIdx} className="mb-1">
                                  <span className="font-medium text-yellow-700">Function:</span> {toolCall.function.name}
                                  <br />
                                  <span className="font-medium text-yellow-700">Arguments:</span> {toolCall.function.arguments}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {isCurrentTurn && (
                          <div className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                            Current
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>
        <div className="hidden md:block w-px bg-gray-200 mx-2"></div>
        <section className="md:w-7/12 w-full flex flex-col">
          <div className="bg-white shadow-lg rounded-xl p-6 flex flex-col">

            <h3 className="font-semibold mb-4 text-gray-700">{(step === 'conversation' || isSingleTurnConversation) ? 'Conversation-level Criteria' : 'Turn-level Criteria'}</h3>
            
            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-1 mb-6 border-b border-gray-200">
              {conversationCriteriaCategories.map((category) => {
                // Calculate completion status for this category
                const categoryCriteria = category.criteria;
                const completedCount = categoryCriteria.filter(crit => {
                  if (step === 'conversation' || isSingleTurnConversation) {
                    return conversationRatings[crit.id] != null;
                  } else {
                    return turnRatings[turnIndex]?.[crit.id] != null;
                  }
                }).length;
                const isCompleted = completedCount === categoryCriteria.length;
                const hasPartialProgress = completedCount > 0 && !isCompleted;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveTab(category.id)}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 relative ${
                      activeTab === category.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : isCompleted
                        ? 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-300'
                        : hasPartialProgress
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{category.label}</span>
                      {isCompleted && (
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {hasPartialProgress && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold">{completedCount}/{categoryCriteria.length}</span>
                        </div>
                      )}
                    </div>
                    {/* Progress indicator */}
                    {hasPartialProgress && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-300 rounded-b-lg">
                        <div 
                          className="h-full bg-yellow-500 rounded-b-lg transition-all duration-300"
                          style={{ width: `${(completedCount / categoryCriteria.length) * 100}%` }}
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="mb-6 space-y-6">
              {(() => {
                const currentCriteria = conversationCriteriaCategories.find(cat => cat.id === activeTab)?.criteria || [];
                
                // Check if all criteria in current tab are completed
                const completedCount = currentCriteria.filter(crit => {
                  if (step === 'conversation' || isSingleTurnConversation) {
                    return conversationRatings[crit.id] != null;
                  } else {
                    return turnRatings[turnIndex]?.[crit.id] != null;
                  }
                }).length;
                const isTabCompleted = completedCount === currentCriteria.length;
                
                return (
                  <>
                    {/* Tab completion indicator */}
                    {isTabCompleted && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-700">
                          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">All criteria in this category have been rated!</span>
                        </div>
                      </div>
                    )}
                    
                    {currentCriteria.map((crit) => {
                      const isRated = (step === 'conversation' || isSingleTurnConversation)
                        ? conversationRatings[crit.id] != null
                        : turnRatings[turnIndex]?.[crit.id] != null;
                      
                      return (
                        <div key={crit.id} className="flex flex-col gap-2">
                          <label className="font-medium text-gray-800 flex items-center">
                            {crit.label}
                            {isRated && (
                              <svg className="w-4 h-4 ml-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                            <Tooltip text={crit.description} label={crit.label} critId={crit.id} onPanelOpen={handlePanelOpen} />
                          </label>
                          <div className="flex gap-3 mt-2">
                            {crit.type === 'rating' && crit.options.map((opt: number) => (
                              <div key={opt} className="relative inline-block">
                                <button
                                  type="button"
                                  className={`w-8 h-8 flex items-center justify-center rounded-full border-2 transition-all duration-200 ease-out shadow-sm mx-1 transform hover:scale-110 active:scale-95
                                    ${
                                      ((step === 'conversation' || isSingleTurnConversation)
                                        ? conversationRatings[crit.id] === opt
                                        : turnRatings[turnIndex]?.[crit.id] === opt)
                                        ? 'bg-blue-500 border-blue-600 text-white font-bold shadow-lg scale-105'
                                        : 'bg-white border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-600 hover:shadow-md'
                                    }
                                  `}
                                  onClick={() =>
                                    (step === 'conversation' || isSingleTurnConversation)
                                      ? handleConversationRating(crit.id, opt)
                                      : handleTurnRating(crit.id, opt)
                                  }
                                  aria-pressed={
                                    (step === 'conversation' || isSingleTurnConversation)
                                      ? conversationRatings[crit.id] === opt
                                      : turnRatings[turnIndex]?.[crit.id] === opt
                                  }
                                  onMouseEnter={() => setHovered({ critId: crit.id, value: opt })}
                                  onMouseLeave={() => setHovered(null)}
                                >
                                  {opt}
                                </button>
                                {hovered && hovered.critId === crit.id && hovered.value === opt && crit.ratingDescriptions && crit.ratingDescriptions[String(opt)] && (
                                  <div className="absolute z-50 left-1/2 -translate-x-1/2 mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg p-2 text-xs text-gray-800 whitespace-pre-line">
                                    {crit.ratingDescriptions[String(opt)]}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </>
                );
              })()}
            </div>

            {/* Slide-out Panel for Criterion Descriptions */}
            {openPanel && (
              <div 
                className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-4 max-w-md w-full animate-slide-in panel-content"
                style={{
                  top: `${openPanel.position.top}px`,
                  left: `${openPanel.position.left}px`,
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-800 text-sm">
                    {(() => {
                      const currentCriteria = conversationCriteriaCategories.find(cat => cat.id === activeTab)?.criteria || [];
                      const criterion = currentCriteria.find(c => c.id === openPanel.critId);
                      return criterion?.label || 'Criteria Description';
                    })()}
                  </h4>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600 text-lg font-bold focus:outline-none"
                    onClick={handlePanelClose}
                    aria-label="Close description"
                  >
                    &times;
                  </button>
                </div>
                <div className="text-gray-700 text-sm whitespace-pre-line">
                  {(() => {
                    const currentCriteria = conversationCriteriaCategories.find(cat => cat.id === activeTab)?.criteria || [];
                    const criterion = currentCriteria.find(c => c.id === openPanel.critId);
                    return criterion?.description || '';
                  })()}
                </div>
              </div>
            )}
            <div className="mb-6">
              <label className="font-medium text-gray-800 flex items-center mb-1">
                {(step === 'conversation' || isSingleTurnConversation) ? 'Comment (optional)' : 'Turn Comment (optional)'}
                <Tooltip text={step === 'conversation' ? 'Leave any notes or feedback about the whole conversation.' : 'Leave any notes or feedback about this turn.'} />
              </label>
              <textarea
                className="w-full min-h-[60px] border border-gray-300 rounded-lg p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                placeholder={(step === 'conversation' || isSingleTurnConversation) ? 'Add a comment about the conversation...' : 'Add a comment about this turn...'}
                value={(step === 'conversation' || isSingleTurnConversation) ? conversationComment : (turnComments[turnIndex] || '')}
                onChange={(step === 'conversation' || isSingleTurnConversation) ? handleConversationComment : handleTurnComment}
              />
            </div>
            {validationMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg animate-pulse">
                <div className="flex items-center gap-2 text-red-700">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="font-medium">{validationMessage}</span>
                </div>
              </div>
            )}
            {encouragementMessage && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
                <div className="flex items-center gap-2 text-green-700">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">{encouragementMessage}</span>
                </div>
              </div>
            )}
            <div className="flex justify-between mt-auto gap-2">
              <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold text-lg shadow transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleBack}
                disabled={(step === 'turns' && turnIndex === 0) || (step === 'conversation' && isSingleTurnConversation)}
              >
                Previous
              </button>
              <button
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-semibold text-lg shadow transition-all duration-200 transform hover:scale-105 active:scale-95"
                onClick={handleSkip}
              >
                {step === 'conversation' ? (conversationSkipped ? 'Skipped' : 'Skip/Flag') : (turnSkipped[turnIndex] ? 'Skipped' : 'Skip/Flag')}
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold text-lg shadow transition-all duration-200 transform hover:scale-105 active:scale-95"
                onClick={handleNext}
              >
                {step === 'conversation' ? 'Finish' : 'Next'}
              </button>
            </div>
            {step === 'conversation' && conversationSkipped && (
              <div className="mt-2 text-yellow-600 font-semibold flex items-center gap-2">
                This conversation was skipped/flagged.
                <button
                  className="ml-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 border border-yellow-300 text-sm font-medium"
                  onClick={handleUnskip}
                >
                  Unskip
                </button>
              </div>
            )}
            {step === 'turns' && turnSkipped[turnIndex] && (
              <div className="mt-2 text-yellow-600 font-semibold flex items-center gap-2">
                This turn was skipped/flagged.
                <button
                  className="ml-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 border border-yellow-300 text-sm font-medium"
                  onClick={handleUnskip}
                >
                  Unskip
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
      {showFinishDialog && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-sm w-full flex flex-col items-center">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Confirm Completion</h2>
            <p className="mb-6 text-gray-600 text-center">Are you sure you want to finish and submit your annotation?</p>
            <div className="flex gap-4">
              <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold shadow"
                onClick={() => setShowFinishDialog(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow"
                onClick={handleFinish}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Subtle celebration overlay */}
      {showCelebration && (
        <div className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-green-200 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="text-4xl">🎉</div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-700">Great Job!</div>
                <div className="text-sm text-green-600">Annotation completed successfully</div>
              </div>
              <div className="text-4xl">🎊</div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function AnnotatePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AnnotatePageContent />
    </Suspense>
  );
} 