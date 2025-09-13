
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import Header from '../components/Header';
import Spinner from '../components/Spinner';
import type { Module, Question } from '../types';

const getYouTubeId = (url: string): string => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);

    if (match && match[2].length === 11) {
        return match[2];
    }
    // If no match, maybe the input is the ID itself
    if (url.length === 11 && !url.includes(' ')) {
        return url;
    }
    return '';
};


const AdminModuleEditPage = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [module, setModule] = useState<Partial<Module>>({ title: '', description: '', youtube_video_url: '' });
  const [questions, setQuestions] = useState<Partial<Question>[]>([{ question_text: '', options: [{text:''}, {text:''}], correct_option_index: 0, points: 10 }]);
  const [loading, setLoading] = useState(false);
  const isEditing = Boolean(id);

  useEffect(() => {
    if (isEditing) {
      setLoading(true);
      const fetchModuleAndQuestions = async () => {
        const { data: moduleData, error: moduleError } = await supabase.from('modules').select('*').eq('id', id).single();
        if (moduleError) {
          console.error(moduleError);
          navigate('/admin/modules');
          return;
        }
        setModule(moduleData);
        
        const { data: questionsData, error: questionsError } = await supabase.from('questions').select('*').eq('module_id', id);
        if (questionsError) {
          console.error(questionsError);
        } else if (questionsData && questionsData.length > 0) {
          setQuestions(questionsData);
        } else {
          setQuestions([{ question_text: '', options: [{text:''}, {text:''}], correct_option_index: 0, points: 10 }]);
        }
        setLoading(false);
      };
      fetchModuleAndQuestions();
    }
  }, [id, isEditing, navigate]);

  const handleModuleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setModule(prev => ({ ...prev, [name]: value }));
  };

  const handleQuestionChange = (qIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newQuestions = [...questions];
    const question = { ...newQuestions[qIndex] };
    if (name === 'question_text') {
        question.question_text = value;
    } else if (name === 'points') {
        question.points = parseInt(value, 10) || 0;
    }
    newQuestions[qIndex] = question;
    setQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex: number, oIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuestions = [...questions];
    const options = [...(newQuestions[qIndex]?.options || [])];
    options[oIndex] = { text: e.target.value };
    newQuestions[qIndex] = { ...newQuestions[qIndex], options };
    setQuestions(newQuestions);
  };

  const handleCorrectOptionChange = (qIndex: number, oIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex] = { ...newQuestions[qIndex], correct_option_index: oIndex };
    setQuestions(newQuestions);
  };

  const addOption = (qIndex: number) => {
    const newQuestions = [...questions];
    const options = [...(newQuestions[qIndex]?.options || [])];
    options.push({ text: '' });
    newQuestions[qIndex] = { ...newQuestions[qIndex], options };
    setQuestions(newQuestions);
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const newQuestions = [...questions];
    const question = { ...newQuestions[qIndex] };
    const options = [...(question.options || [])];
    if (options.length > 2) {
      options.splice(oIndex, 1);
      question.options = options;
      if (question.correct_option_index !== undefined && question.correct_option_index >= oIndex) {
        question.correct_option_index = Math.max(0, question.correct_option_index - 1);
      }
      newQuestions[qIndex] = question;
      setQuestions(newQuestions);
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, { question_text: '', options: [{text:''}, {text:''}], correct_option_index: 0, points: 10 }]);
  };

  const removeQuestion = (qIndex: number) => {
    if (questions.length > 0) {
      const newQuestions = [...questions];
      newQuestions.splice(qIndex, 1);
      setQuestions(newQuestions);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!module.title || !module.youtube_video_url) {
      alert('Title and YouTube Video URL are required.');
      setLoading(false);
      return;
    }
    
    if(!getYouTubeId(module.youtube_video_url)){
        alert('Please enter a valid YouTube Video URL.');
        setLoading(false);
        return;
    }

    const modulePayload = {
      title: module.title,
      description: module.description,
      youtube_video_url: module.youtube_video_url,
    };
    
    let moduleId = id;
    
    try {
        if (isEditing) {
          const { error } = await supabase.from('modules').update(modulePayload).eq('id', id);
          if (error) throw error;
        } else {
          const { data, error } = await supabase.from('modules').insert(modulePayload).select().single();
          if (error) throw error;
          moduleId = data.id;
        }

        if (moduleId) {
            // Delete existing questions
            await supabase.from('questions').delete().eq('module_id', moduleId);

            // Filter out empty questions/options before inserting
            const validQuestions = questions.filter(q => 
                q.question_text && 
                q.options && 
                q.options.length >= 2 && 
                q.options.every(o => o.text.trim() !== '')
            ).map(q => ({
                module_id: moduleId,
                question_text: q.question_text,
                options: q.options,
                correct_option_index: q.correct_option_index,
                points: q.points
            }));
            
            if (validQuestions.length > 0) {
                 const { error: questionsError } = await supabase.from('questions').insert(validQuestions);
                 if (questionsError) throw questionsError;
            }
        }
        
        navigate('/admin/modules');

    } catch(error: any) {
        alert('An error occurred: ' + error.message);
    } finally {
        setLoading(false);
    }
  };

  if (loading && isEditing) {
      return (<> <Header /> <div className="container mx-auto p-8"><Spinner /></div> </>);
  }

  const videoId = getYouTubeId(module.youtube_video_url || '');

  return (
    <>
      <Header />
      <main className="container mx-auto p-8">
        <h1 className="text-4xl font-bold mb-8 animate-fade-in-up">{isEditing ? 'Edit Module' : 'Create New Module'}</h1>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-neutral-800/50 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-neutral-700 animate-fade-in-up">
            <h2 className="text-2xl font-bold mb-6">Module Details</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-300">Title</label>
                <input type="text" name="title" id="title" required value={module.title || ''} onChange={handleModuleChange} className="mt-1 block w-full bg-neutral-700 border border-neutral-600 rounded-md shadow-sm py-3 px-4 text-white focus:outline-none focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300">Description</label>
                <textarea name="description" id="description" rows={4} value={module.description || ''} onChange={handleModuleChange} className="mt-1 block w-full bg-neutral-700 border border-neutral-600 rounded-md shadow-sm py-3 px-4 text-white focus:outline-none focus:ring-primary focus:border-primary"></textarea>
              </div>
              <div>
                <label htmlFor="youtube_video_url" className="block text-sm font-medium text-gray-300">YouTube Video URL</label>
                <input type="text" name="youtube_video_url" id="youtube_video_url" required value={module.youtube_video_url || ''} onChange={handleModuleChange} placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ" className="mt-1 block w-full bg-neutral-700 border border-neutral-600 rounded-md shadow-sm py-3 px-4 text-white focus:outline-none focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Video Preview</label>
                <div className="mt-2 aspect-video bg-black rounded-lg overflow-hidden border border-neutral-600">
                  {videoId ? (
                    <iframe className="w-full h-full" src={`https://www.youtube-nocookie.com/embed/${videoId}`} title="YouTube video preview" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen referrerPolicy="no-referrer-when-downgrade"></iframe>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Enter a valid YouTube URL to see a preview.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-neutral-800/50 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-neutral-700 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-2xl font-bold mb-6">Quiz Questions</h2>
            <div className="space-y-6">
                {questions.map((q, qIndex) => (
                    <div key={qIndex} className="bg-neutral-700/50 p-4 rounded-lg border border-neutral-600 space-y-4 relative">
                        <button type="button" onClick={() => removeQuestion(qIndex)} className="absolute -top-3 -right-3 bg-error rounded-full p-1 text-white hover:bg-red-500" aria-label="Remove Question">
                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                        <div>
                            <label htmlFor={`q-text-${qIndex}`} className="block text-sm font-medium text-gray-300">Question {qIndex + 1}</label>
                            <input type="text" name="question_text" id={`q-text-${qIndex}`} value={q.question_text || ''} onChange={(e) => handleQuestionChange(qIndex, e)} required className="mt-1 block w-full bg-neutral-600 border border-neutral-500 rounded-md py-2 px-3 text-white" />
                        </div>
                        <div>
                            <label htmlFor={`q-points-${qIndex}`} className="block text-sm font-medium text-gray-300">Points</label>
                            <input type="number" name="points" id={`q-points-${qIndex}`} value={q.points || 10} onChange={(e) => handleQuestionChange(qIndex, e)} required className="mt-1 block w-40 bg-neutral-600 border border-neutral-500 rounded-md py-2 px-3 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Options</label>
                            <div className="mt-2 space-y-2">
                                {q.options?.map((opt, oIndex) => (
                                    <div key={oIndex} className="flex items-center gap-2">
                                        <input type="radio" name={`correct-opt-${qIndex}`} checked={q.correct_option_index === oIndex} onChange={() => handleCorrectOptionChange(qIndex, oIndex)} className="form-radio h-5 w-5 text-primary bg-neutral-600 border-neutral-500 focus:ring-primary" />
                                        <input type="text" value={opt.text} onChange={(e) => handleOptionChange(qIndex, oIndex, e)} required className="block w-full bg-neutral-600 border border-neutral-500 rounded-md py-2 px-3 text-white" />
                                        <button type="button" onClick={() => removeOption(qIndex, oIndex)} className="text-gray-400 hover:text-error" aria-label="Remove Option">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                             <button type="button" onClick={() => addOption(qIndex)} className="mt-3 text-sm text-accent hover:text-green-400">Add Option</button>
                        </div>
                    </div>
                ))}
            </div>
             <button type="button" onClick={addQuestion} className="mt-6 px-4 py-2 border border-dashed border-neutral-500 text-gray-300 rounded-md hover:border-accent hover:text-accent transition-colors">Add Another Question</button>
          </div>

          <div className="flex justify-end gap-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <button type="button" onClick={() => navigate('/admin/modules')} className="px-6 py-3 bg-neutral-600 hover:bg-neutral-500 rounded-md text-white font-semibold transition-all duration-300 transform hover:scale-105">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-3 bg-primary hover:bg-indigo-700 rounded-md text-white font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Module'}
            </button>
          </div>
        </form>
      </main>
    </>
  );
};

export default AdminModuleEditPage;