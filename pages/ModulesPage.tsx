
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import Header from '../components/Header';
import Spinner from '../components/Spinner';
import type { Module } from '../types';
import { useAuth } from '../hooks/useAuth';

interface ModuleWithHistory extends Module {
  bestScore?: number;
  attemptsCount?: number;
}

const getYouTubeId = (url: string): string => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2] && match[2].length === 11) {
        return match[2];
    }
    // Fallback for raw ID, just in case
    if (url.length === 11 && !url.includes(' ')) {
        return url;
    }
    return '';
};

const ModuleCard = ({ module, bestScore, attemptsCount }: { module: Module, bestScore?: number, attemptsCount?: number }) => {
  const formattedDate = new Date(module.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Link 
      to={`/module/${module.id}`}
      className="flex flex-col h-full bg-neutral-800/50 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-neutral-700 hover:border-primary transition-all duration-300 transform hover:-translate-y-2"
    >
      <div className="relative aspect-video mb-4 rounded-lg overflow-hidden">
          <img 
              src={`https://img.youtube.com/vi/${getYouTubeId(module.youtube_video_url)}/hqdefault.jpg`} 
              alt={module.title}
              className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/80"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          </div>
      </div>
      <div className="flex-grow flex flex-col justify-between">
        <div className="flex justify-between items-start">
            <div className="flex-1 pr-4">
                <h3 className="text-xl font-bold mb-2 text-white">{module.title}</h3>
                <p className="text-gray-400 line-clamp-2">{module.description}</p>
            </div>
            <div className="flex items-center text-sm text-gray-500 flex-shrink-0 whitespace-nowrap">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 flex-shrink-0"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span>{formattedDate}</span>
            </div>
        </div>
        
        <div>
           {bestScore !== undefined && attemptsCount !== undefined && (
            <div className="border-t border-neutral-700/50 mt-4 pt-4">
              <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                    <span>Score: <span className="font-bold text-primary">{bestScore}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M21 21v-5h-5"></path></svg>
                    <span>Percobaan: {attemptsCount} / 3</span>
                  </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};


const ModulesPage = () => {
  const { user } = useAuth();
  const [modulesWithHistory, setModulesWithHistory] = useState<ModuleWithHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModulesAndHistory = async () => {
      setLoading(true);

      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .order('created_at', { ascending: false });

      if (modulesError) {
        console.error('Error fetching modules:', modulesError);
        setLoading(false);
        return;
      }
      
      let attemptsHistory: { [moduleId: string]: { bestScore: number; attemptsCount: number } } = {};

      if (user) {
        const { data: attemptsData, error: attemptsError } = await supabase
          .from('quiz_attempts')
          .select('module_id, score')
          .eq('user_id', user.id);

        if (attemptsError) {
          console.error('Error fetching user attempts:', attemptsError);
        } else {
          (attemptsData || []).forEach(attempt => {
            const { module_id, score } = attempt;
            if (!attemptsHistory[module_id]) {
              attemptsHistory[module_id] = { bestScore: 0, attemptsCount: 0 };
            }
            if (score > attemptsHistory[module_id].bestScore) {
              attemptsHistory[module_id].bestScore = score;
            }
            attemptsHistory[module_id].attemptsCount += 1;
          });
        }
      }

      const combinedData = (modulesData as Module[]).map(module => ({
        ...module,
        bestScore: attemptsHistory[module.id]?.bestScore,
        attemptsCount: attemptsHistory[module.id]?.attemptsCount,
      }));

      setModulesWithHistory(combinedData);
      setLoading(false);
    };

    fetchModulesAndHistory();
  }, [user]);

  return (
    <>
      <Header />
      <main className="container mx-auto p-8">
        <h1 className="text-4xl font-bold mb-8 animate-fade-in-up">Learning Modules</h1>
        {loading ? (
          <Spinner />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {modulesWithHistory.map((module, index) => (
              <div key={module.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <ModuleCard 
                    module={module} 
                    bestScore={module.bestScore} 
                    attemptsCount={module.attemptsCount} 
                  />
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
};

export default ModulesPage;