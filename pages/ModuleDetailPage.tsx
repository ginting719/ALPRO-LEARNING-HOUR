import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/Header';
import Spinner from '../components/Spinner';
import type { Module, Question, QuizAttempt } from '../types';
import Fireworks from '../components/Fireworks';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const getYouTubeId = (url: string): string => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2] && match[2].length === 11) {
        return match[2];
    }
    return '';
};

const QuizView = ({ questions, moduleId, attemptNumber }: { questions: Question[], moduleId: string, attemptNumber: number }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
    const [quizResult, setQuizResult] = useState<{ score: number; maxScore: number; isPerfect: boolean } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAnswerSelect = (optionIndex: number) => {
        const newAnswers = [...selectedAnswers];
        newAnswers[currentQuestionIndex] = optionIndex;
        setSelectedAnswers(newAnswers);
    };
    
    const handleNext = () => {
        if(currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };
    
    const handlePrev = () => {
        if(currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);

        // Verification Step: Check if the module still exists before submitting.
        const { data: existingModule, error: checkError } = await supabase
            .from('modules')
            .select('id')
            .eq('id', moduleId)
            .maybeSingle();

        if (checkError || !existingModule) {
            alert('Sorry, this module was deleted by an administrator while you were taking the quiz. Your score cannot be saved.');
            setIsSubmitting(false);
            navigate('/modules');
            return;
        }

        const maxScore = questions.reduce((acc, q) => acc + q.points, 0);
        let calculatedScore = 0;
        questions.forEach((q, index) => {
            if(selectedAnswers[index] === q.correct_option_index) {
                calculatedScore += q.points;
            }
        });
        
        const isPerfect = maxScore > 0 && calculatedScore === maxScore;
        setQuizResult({ score: calculatedScore, maxScore, isPerfect });

        if(user){
            const { error: insertError } = await supabase.from('quiz_attempts').insert({
                user_id: user.id,
                module_id: moduleId,
                score: calculatedScore,
            });

            if (insertError) {
                console.error("Failed to save quiz attempt:", insertError);
                alert("There was an error saving your score. Please try again.");
            }
        }
        setIsSubmitting(false);
    };
    
    if (quizResult) {
        const { score, maxScore, isPerfect } = quizResult;

        if (isPerfect) {
            return (
                <div className="relative text-center p-8 bg-neutral-800/50 rounded-lg animate-fade-in-up overflow-hidden">
                    <Fireworks />
                    <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 z-10 relative">
                        PERFECT SCORE!
                    </h2>
                    <p className="text-5xl font-extrabold mb-6 text-yellow-300 z-10 relative">
                        {score} <span className="text-2xl font-normal text-gray-400">/ {maxScore}</span>
                    </p>
                     <p className="text-lg text-gray-300 mb-6 z-10 relative">kamu sangat luar biasa</p>
                    <Link to="/modules" className="px-6 py-3 bg-primary hover:bg-indigo-700 rounded-md text-white font-semibold transition-all duration-300 transform hover:scale-105 z-10 relative">
                        Back to Modules
                    </Link>
                </div>
            );
        }

        const maxAttempts = 3;
        const attemptsLeft = maxAttempts - attemptNumber;
        const isLastAttempt = attemptsLeft <= 0;

        return (
            <div className="text-center p-8 bg-neutral-800/50 rounded-lg animate-fade-in-up border-2 border-primary/50">
                 <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                    Quiz Completed
                 </h2>
                <p className="text-5xl font-extrabold mb-6">
                    {score} <span className="text-2xl font-normal text-gray-400">/ {maxScore}</span>
                </p>

                {isLastAttempt ? (
                    <p className="text-lg text-gray-300 mb-6">tetap semangat dan terus belajar</p>
                ) : (
                    <>
                        <p className="text-lg text-gray-300 mb-2">Mari berjuang lagi untuk dapatkan nilai sempuna</p>
                        <p className="text-md text-yellow-400 mb-6">
                            Anda memiliki {attemptsLeft} sisa percobaan lagi.
                        </p>
                    </>
                )}
                
                <Link to="/modules" className="px-6 py-3 bg-primary hover:bg-indigo-700 rounded-md text-white font-semibold transition-all duration-300 transform hover:scale-105">
                    Back to Modules
                </Link>
            </div>
        );
    }
    
    const currentQuestion = questions[currentQuestionIndex];
    const maxAttempts = 3;

    return (
        <div className="p-6 bg-neutral-800/50 rounded-2xl shadow-lg border border-neutral-700">
            <h2 className="text-2xl font-bold mb-1">Quiz Time!</h2>
            <p className="text-sm text-gray-400 mb-4">Attempt {attemptNumber} of {maxAttempts}</p>
            <div className="mb-4">
                <p className="text-gray-400">Question {currentQuestionIndex + 1} of {questions.length}</p>
                <h3 className="text-xl my-2">{currentQuestion.question_text}</h3>
            </div>
            <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => handleAnswerSelect(index)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${selectedAnswers[currentQuestionIndex] === index ? 'bg-primary/30 border-primary' : 'bg-neutral-700/50 border-neutral-600 hover:border-primary/50'}`}
                    >
                        {option.text}
                    </button>
                ))}
            </div>
            <div className="flex justify-between mt-6">
                <button onClick={handlePrev} disabled={currentQuestionIndex === 0} className="px-4 py-2 bg-neutral-600 hover:bg-neutral-500 rounded-md disabled:opacity-50">Previous</button>
                {currentQuestionIndex === questions.length - 1 ? (
                     <button onClick={handleSubmit} disabled={isSubmitting || selectedAnswers.includes(null)} className="px-6 py-2 bg-accent hover:bg-green-600 rounded-md disabled:opacity-50 font-bold">
                        {isSubmitting ? 'Submitting...' : 'Submit'}
                     </button>
                ) : (
                    <button onClick={handleNext} disabled={selectedAnswers[currentQuestionIndex] === null} className="px-4 py-2 bg-primary hover:bg-indigo-700 rounded-md disabled:opacity-50">Next</button>
                )}
            </div>
        </div>
    );
};


const ModuleDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [module, setModule] = useState<Module | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAttempts, setUserAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVideoFinished, setIsVideoFinished] = useState(false);
  const [isTakingQuiz, setIsTakingQuiz] = useState(false);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    const fetchModule = async () => {
      if (!id) return;
      setLoading(true);
      
      const { data: moduleData, error: moduleError } = await supabase
        .from('modules')
        .select('*')
        .eq('id', id)
        .single();
        
      if (moduleError) {
        console.error('Error fetching module:', moduleError);
        setLoading(false);
        return;
      }
      setModule(moduleData as Module);

      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('module_id', id);
      
      if (questionsError) {
        console.error('Error fetching questions:', questionsError);
      } else {
        setQuestions(questionsData as Question[]);
      }
      
      if (user) {
        const { data: attemptsData, error: attemptsError } = await supabase
            .from('quiz_attempts')
            .select('*')
            .eq('user_id', user.id)
            .eq('module_id', id);

        if (attemptsError) {
            console.error('Error fetching user attempts:', attemptsError);
        } else {
            setUserAttempts(attemptsData as QuizAttempt[]);
        }
      }

      setLoading(false);
    };
    fetchModule();
  }, [id, user]);

  useEffect(() => {
    // Conditions under which we should NOT have a player
    if (loading || !module || isTakingQuiz) {
      return;
    }

    const videoId = getYouTubeId(module.youtube_video_url);
    if (!videoId) return;

    const setupPlayer = () => {
      // Ensure the target div exists and we don't have a lingering player reference
      if (!document.getElementById('youtube-player')) return;
      
      playerRef.current = new window.YT.Player('youtube-player', {
        videoId: videoId,
        playerVars: { 
            'playsinline': 1, 
            'rel': 0,
            'origin': window.location.origin
        },
        events: {
          'onStateChange': (event: any) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              setIsVideoFinished(true);
            }
          }
        }
      });
    };

    if (!window.YT || !window.YT.Player) {
      window.onYouTubeIframeAPIReady = setupPlayer;
    } else {
      setupPlayer();
    }

    // This cleanup function is CRITICAL. It runs when dependencies change or the component unmounts.
    // It ensures we destroy the old player, preventing conflicts and stale references.
    return () => {
      // Defensive check: ensure the ref exists and has the destroy method before calling it.
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.error("Error destroying YouTube player:", e);
        }
      }
      playerRef.current = null; // Always null out the ref after cleanup.
    };
  }, [loading, module, isTakingQuiz]); // Re-run effect if loading/module/quiz state changes

  const handleStartQuiz = () => {
    setIsTakingQuiz(true);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="container mx-auto p-8"><Spinner /></div>
      </>
    );
  }

  if (!module) {
    return (
      <>
        <Header />
        <div className="container mx-auto p-8 text-center">Module not found.</div>
      </>
    );
  }
  
  const attemptsCount = userAttempts.length;
  const maxAttempts = 3;
  
  const renderQuizLocker = () => {
    if (questions.length === 0) {
      return (
        <div className="p-6 bg-neutral-800/50 rounded-2xl text-center flex flex-col justify-center items-center h-full">
            <h2 className="text-xl font-bold">No quiz available for this module yet.</h2>
        </div>
      );
    }
    if (attemptsCount >= maxAttempts) {
       return (
        <div className="p-6 bg-neutral-800/50 rounded-2xl text-center flex flex-col justify-center h-full">
            <h2 className="text-2xl font-bold mb-2">Quiz Limit Reached</h2>
            <p className="text-gray-400 mb-4">You have used all {maxAttempts} attempts for this quiz.</p>
            <p className="text-xl">Your best score:</p>
            <p className="text-6xl font-extrabold text-primary my-2">
                {Math.max(0, ...userAttempts.map(a => a.score))}
            </p>
            <Link to="/modules" className="mt-4 inline-block px-6 py-3 bg-primary hover:bg-indigo-700 rounded-md text-white font-semibold transition-all duration-300 transform hover:scale-105">
                Back to Modules
            </Link>
        </div>
      );
    }
    if (isVideoFinished) {
      return (
        <div className="p-6 bg-neutral-800/50 rounded-2xl text-center flex flex-col justify-center items-center h-full">
            <h2 className="text-2xl font-bold mb-2">Ready for the Quiz?</h2>
            <p className="text-gray-400 mb-6">You've completed the video. Test your knowledge!</p>
            <button
                onClick={handleStartQuiz}
                className="px-8 py-3 bg-accent hover:bg-green-600 rounded-md text-white font-semibold transition-all duration-300 transform hover:scale-105"
            >
                Start Quiz
            </button>
        </div>
      );
    }
    return (
        <div className="p-6 bg-neutral-800/50 rounded-2xl text-center flex flex-col justify-center items-center h-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 mb-4"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <h2 className="text-2xl font-bold mb-2">Quiz Locked</h2>
            <p className="text-gray-400">Please finish watching the video to unlock the quiz.</p>
        </div>
    );
  };

  return (
    <>
      <Header />
      <main className="container mx-auto p-8">
        <div className="animate-fade-in-up">
            <h1 className="text-4xl font-bold mb-2">{module.title}</h1>
            <p className="text-gray-400 mb-8 max-w-3xl">{module.description}</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {!isTakingQuiz && (
                <div className="lg:col-span-2 aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <div id="youtube-player" className="w-full h-full"></div>
                </div>
            )}

            <div className={isTakingQuiz ? 'lg:col-span-3' : ''} style={{ animationDelay: '0.4s' }}>
                {isTakingQuiz ? (
                    <QuizView 
                        key={attemptsCount} 
                        questions={questions} 
                        moduleId={module.id} 
                        attemptNumber={attemptsCount + 1}
                    />
                ) : (
                   renderQuizLocker()
                )}
            </div>
        </div>
      </main>
    </>
  );
};

export default ModuleDetailPage;