"use client";
import React, { useState, useEffect } from 'react';
import { conversationCriteriaCategories, turnCriteria } from './criteria.config';
import { useSession } from 'next-auth/react';

function getTurnPairs(conv: { role: string; content: string }[]) {
  const pairs = [];
  for (let i = 0; i < conv.length - 1; i += 2) {
    if (conv[i].role === 'user' && conv[i + 1]?.role === 'assistant') {
      pairs.push([conv[i], conv[i + 1]]);
    }
  }
  return pairs;
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  const percent = Math.round((step / total) * 100);
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className="bg-blue-500 h-2.5 rounded-full transition-all"
        style={{ width: `${percent}%` }}
      ></div>
    </div>
  );
}

function Tooltip({ text }: { text: string }) {
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => {
    setOpen(false);
    // For debugging
    // console.log('Tooltip closed');
  }, []);
  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);
  return (
    <span className="ml-1 cursor-pointer relative inline-block align-middle">
      <button
        type="button"
        className="text-gray-400 hover:text-blue-600 focus:outline-none"
        aria-label="Show rubric"
        onClick={() => setOpen(true)}
      >
        &#9432;
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/60"
          onClick={close}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 relative overflow-y-auto max-h-[80vh]"
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute top-2 right-2 text-gray-400 hover:text-blue-600 text-2xl font-bold focus:outline-none"
              onClick={close}
              aria-label="Close rubric"
            >
              &times;
            </button>
            <div className="text-gray-900 whitespace-pre-line text-sm">
              {text}
            </div>
          </div>
        </div>
      )}
    </span>
  );
}

export default function Home() {
  const { data: session } = useSession();
  const [step, setStep] = useState<'conversation' | 'turns'>('conversation');
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
  const [conversation, setConversation] = useState<{ role: string; content: string }[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [saveError, setSaveError] = useState('');

  const LOCAL_STORAGE_KEY = 'annotationWizardProgress';

  // Fetch conversation on mount
  useEffect(() => {
    setLoading(true);
    setError('');
    fetch('/api/conversations/next')
      .then(res => {
        if (!res.ok) throw new Error('No conversation found');
        return res.json();
      })
      .then(data => {
        setConversation(data.turns || []);
        setConversationId(data._id || null);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const turnPairs = getTurnPairs(conversation);

  // Restore state from localStorage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      setStep(data.step || 'conversation');
      setTurnIndex(data.turnIndex || 0);
      setConversationRatings(data.conversationRatings || {});
      setTurnRatings(data.turnRatings || []);
      setConversationComment(data.conversationComment || '');
      setTurnComments(data.turnComments || []);
      setConversationSkipped(data.conversationSkipped || false);
      setTurnSkipped(data.turnSkipped || []);
    }
  }, []);
  // Auto-save state to localStorage on change
  React.useEffect(() => {
    const data = {
      step,
      turnIndex,
      conversationRatings,
      turnRatings,
      conversationComment,
      turnComments,
      conversationSkipped,
      turnSkipped,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  }, [step, turnIndex, conversationRatings, turnRatings, conversationComment, turnComments, conversationSkipped, turnSkipped]);

  // Handlers
  const handleConversationRating = (id: string, value: number) => {
    setConversationRatings((prev: Record<string, number | null>) => ({
      ...prev,
      [id]: prev[id] === value ? null : value,
    }));
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
  const handleNext = () => {
    if (step === 'conversation') {
      setStep('turns');
    } else if (turnIndex < turnPairs.length - 1) {
      setTurnIndex(turnIndex + 1);
    } else {
      setShowFinishDialog(true);
    }
  };
  const handleBack = () => {
    if (step === 'turns' && turnIndex === 0) {
      setStep('conversation');
    } else if (step === 'turns') {
      setTurnIndex(turnIndex - 1);
    }
  };
  const handleSkip = () => {
    if (step === 'conversation') {
      setConversationSkipped(true);
      setStep('turns');
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
    setSaveStatus('saving');
    setSaveError('');
    try {
      const res = await fetch('/api/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          userId: session?.user?.email || 'anonymous', // Use email as userId for now
          conversationRatings,
          conversationComment,
          turnRatings,
          turnComments,
          turnSkipped,
          conversationSkipped,
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
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (err: unknown) {
      setSaveStatus('error');
      const errorMessage = err instanceof Error ? err.message : 'Failed to save annotation';
      setSaveError(errorMessage);
      alert('Failed to save annotation: ' + errorMessage);
    }
  };

  // Auto-clear skip/flag if all required ratings are filled
  React.useEffect(() => {
    const allConversationCriteria = conversationCriteriaCategories.flatMap(category => category.criteria);
    if (step === 'conversation' && conversationSkipped && !allConversationCriteria.some((c) => conversationRatings[c.id] == null)) {
      setConversationSkipped(false);
    }
    if (step === 'turns' && turnSkipped[turnIndex] && !turnCriteria.some((c) => turnRatings[turnIndex]?.[c.id] == null)) {
      setTurnSkipped((prev) => {
        const updated = [...prev];
        updated[turnIndex] = false;
        return updated;
      });
    }
  }, [step, conversationRatings, turnRatings, turnIndex, conversationSkipped, turnSkipped]);

  const handleUnskip = () => {
    if (step === 'conversation') {
      setConversationSkipped(false);
    } else {
      setTurnSkipped((prev) => {
        const updated = [...prev];
        updated[turnIndex] = false;
        return updated;
      });
    }
  };

  // Progress calculation
  const totalSteps = 1 + turnPairs.length;
  const currentStep = step === 'conversation' ? 1 : turnIndex + 2;

  if (loading) {
    return <main className="min-h-screen flex items-center justify-center"><div>Loading conversation...</div></main>;
  }
  if (error) {
    return <main className="min-h-screen flex items-center justify-center text-red-600">{error}</main>;
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center font-sans">
      {/* Sticky header */}
      <header className="w-full max-w-5xl sticky top-0 z-20 bg-gray-50 border-b border-gray-200 px-4 py-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Annotation Wizard</h1>
          <span className="text-gray-500 text-sm">Step {currentStep} of {totalSteps}</span>
        </div>
        <ProgressBar step={currentStep} total={totalSteps} />
      </header>
      {/* Main content split left-right */}
      <div className="w-full max-w-5xl flex flex-1 flex-col md:flex-row gap-0 md:gap-8 px-2 md:px-4 py-8">
        {/* Left: Conversation/Turn */}
        <section className="md:w-1/2 w-full mb-8 md:mb-0">
          <div className="bg-white shadow-lg rounded-xl p-6 h-full flex flex-col">
            {step === 'conversation' ? (
              <>
                <h2 className="text-lg font-semibold mb-4 text-blue-700">Full Conversation</h2>
                <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-2">
                  {conversation.map((turn, idx) => (
                    <div key={idx} className={`flex items-start gap-2 p-3 rounded-lg ${turn.role === 'user' ? 'bg-blue-50' : 'bg-green-50'}`}> 
                      <span className={`font-bold capitalize ${turn.role === 'user' ? 'text-blue-700' : 'text-green-700'}`}>{turn.role}:</span>
                      <span className="text-gray-800">{turn.content}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold mb-4 text-blue-700">Turn {turnIndex + 1} of {turnPairs.length}</h2>
                <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-2">
                  {turnPairs[turnIndex].map((turn, idx) => (
                    <div key={idx} className={`flex items-start gap-2 p-3 rounded-lg border-2 ${turn.role === 'user' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'} ${idx === 1 ? 'ring-2 ring-blue-400' : ''}`}> 
                      <span className={`font-bold capitalize ${turn.role === 'user' ? 'text-blue-700' : 'text-green-700'}`}>{turn.role}:</span>
                      <span className="text-gray-800">{turn.content}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
        {/* Divider */}
        <div className="hidden md:block w-px bg-gray-200 mx-2"></div>
        {/* Right: Annotation Criteria */}
        <section className="md:w-1/2 w-full">
          <div className="bg-white shadow-lg rounded-xl p-6 h-full flex flex-col">
            <h3 className="font-semibold mb-4 text-gray-700">{step === 'conversation' ? 'Conversation-level Criteria' : 'Turn-level Criteria'}</h3>
            <div className="mb-6 space-y-6">
              {(step === 'conversation' ? conversationCriteriaCategories.flatMap(category => category.criteria) : turnCriteria).map((crit) => (
                <div key={crit.id} className="flex flex-col gap-1">
                  <label className="font-medium text-gray-800 flex items-center">
                    {crit.label}
                    <Tooltip text={crit.description} />
                  </label>
                  <div className="flex gap-3 mt-1">
                    {crit.type === 'rating' && crit.options.map((opt: number) => (
                      <button
                        key={opt}
                        type="button"
                        className={`w-8 h-8 flex items-center justify-center rounded-full border-2 transition-all shadow-sm mx-1
                          ${
                            (step === 'conversation'
                              ? conversationRatings[crit.id] === opt
                              : turnRatings[turnIndex]?.[crit.id] === opt)
                              ? 'bg-blue-500 border-blue-600 text-white font-bold'
                              : 'bg-white border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-600'
                          }
                        `}
                        onClick={() =>
                          step === 'conversation'
                            ? handleConversationRating(crit.id, opt)
                            : handleTurnRating(crit.id, opt)
                        }
                        aria-pressed={
                          step === 'conversation'
                            ? conversationRatings[crit.id] === opt
                            : turnRatings[turnIndex]?.[crit.id] === opt
                        }
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {/* Comment box */}
            <div className="mb-6">
              <label className="font-medium text-gray-800 flex items-center mb-1">
                {step === 'conversation' ? 'Comment (optional)' : 'Turn Comment (optional)'}
                <Tooltip text={step === 'conversation' ? 'Leave any notes or feedback about the whole conversation.' : 'Leave any notes or feedback about this turn.'} />
              </label>
              <textarea
                className="w-full min-h-[60px] border border-gray-300 rounded-lg p-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                placeholder={step === 'conversation' ? 'Add a comment about the conversation...' : 'Add a comment about this turn...'}
                value={step === 'conversation' ? conversationComment : (turnComments[turnIndex] || '')}
                onChange={step === 'conversation' ? handleConversationComment : handleTurnComment}
              />
            </div>
            <div className="flex justify-between mt-auto gap-2">
              <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold text-lg shadow transition"
                onClick={handleBack}
                disabled={step === 'conversation'}
              >
                Back
              </button>
              <button
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-semibold text-lg shadow transition"
                onClick={handleSkip}
              >
                {step === 'conversation' ? (conversationSkipped ? 'Skipped' : 'Skip/Flag') : (turnSkipped[turnIndex] ? 'Skipped' : 'Skip/Flag')}
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold text-lg shadow transition disabled:opacity-50"
                onClick={handleNext}
                disabled={
                  (step === 'conversation' && conversationCriteriaCategories.flatMap(category => category.criteria).some((c) => conversationRatings[c.id] == null)) ||
                  (step === 'turns' && turnCriteria.some((c) => turnRatings[turnIndex]?.[c.id] == null))
                }
              >
                {step === 'turns' && turnIndex === turnPairs.length - 1 ? 'Finish' : 'Next'}
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
      {/* Finish confirmation dialog */}
      {showFinishDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
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
    </main>
  );
}
