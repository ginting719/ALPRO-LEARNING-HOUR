import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/Header';
import Spinner from '../components/Spinner';
import Leaderboard from '../components/Leaderboard';
import UserScoreCard from '../components/UserScoreCard';
import type { QuizAttempt, LeaderboardEntry, Module } from '../types';

const DashboardPage = () => {
  const { profile } = useAuth();
  const [overallLeaderboard, setOverallLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [allAttempts, setAllAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Step 1: Fetch all attempts, profiles, and modules in parallel
      const [
        { data: attemptsData, error: attemptsError },
        { data: profilesData, error: profilesError },
        { data: modulesData, error: modulesError }
      ] = await Promise.all([
        supabase.from('quiz_attempts').select('*').order('completed_at', { ascending: true }),
        supabase.from('profiles').select('id, full_name'),
        supabase.from('modules').select('*')
      ]);

      if (attemptsError) throw attemptsError;
      if (profilesError) throw profilesError;
      if (modulesError) throw modulesError;

      // Step 2: Create maps for efficient lookups
      // FIX: Explicitly type the Map to ensure values are strings, preventing type errors downstream.
      const profilesMap = new Map<string, string>((profilesData || []).map(p => [p.id, p.full_name]));
      const modulesMap = new Map((modulesData || []).map(m => [m.id, m.title]));
      
      // Step 3: Manually join the data to match the expected QuizAttempt structure
      const attempts = (attemptsData || []).map(attempt => ({
        ...attempt,
        profiles: { full_name: profilesMap.get(attempt.user_id) || 'Unknown User' },
        modules: { title: modulesMap.get(attempt.module_id) || 'Unknown Module' },
      })) as QuizAttempt[];
      
      // Step 4: Calculate overall leaderboard based on highest score per module
      const userModuleScores: { [userId: string]: { [moduleId: string]: number } } = {};
      attempts.forEach(attempt => {
        if (!userModuleScores[attempt.user_id]) {
          userModuleScores[attempt.user_id] = {};
        }
        const currentMax = userModuleScores[attempt.user_id][attempt.module_id] || 0;
        if (attempt.score > currentMax) {
          userModuleScores[attempt.user_id][attempt.module_id] = attempt.score;
        }
      });
      
      const userTotalScores: { [userId: string]: number } = {};
      for (const userId in userModuleScores) {
        userTotalScores[userId] = Object.values(userModuleScores[userId]).reduce((sum, score) => sum + score, 0);
      }

      const overallData: LeaderboardEntry[] = Object.entries(userTotalScores).map(([userId, totalScore]) => ({
        user_id: userId,
        full_name: profilesMap.get(userId) || 'Unknown User',
        total_score: totalScore,
      }));
      setOverallLeaderboard(overallData);

      // Step 5: For admin, aggregate user progress to show best score and total attempts
      if (profile?.role === 'admin') {
        const aggregatedAttempts: { [key: string]: QuizAttempt } = {};

        // attempts are sorted by completed_at ascending
        attempts.forEach(attempt => {
          const key = `${attempt.user_id}-${attempt.module_id}`;
          if (!aggregatedAttempts[key]) {
            // First time seeing this user/module combo
            aggregatedAttempts[key] = {
              ...attempt,
              id: key, // Use a composite key for React key prop
              attempt_number: 1, // Start counting attempts
            };
          } else {
            // Already exists, update it
            const existing = aggregatedAttempts[key];
            existing.attempt_number = (existing.attempt_number || 0) + 1;
            
            // Keep the highest score
            if (attempt.score > existing.score) {
              existing.score = attempt.score;
            }
            
            // The last attempt in the loop will have the latest date, so just update it
            existing.completed_at = attempt.completed_at;
          }
        });

        const finalAggregatedAttempts = Object.values(aggregatedAttempts)
          .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()); // Show most recent first
        
        setAllAttempts(finalAggregatedAttempts);
      }
      
    } catch (error: any) {
        console.error('Error fetching dashboard data:', error.message || error);
    } finally {
        setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);
  
  const currentUserLeaderboardEntry = overallLeaderboard.find(entry => entry.user_id === profile?.id);
  const currentUserScore = currentUserLeaderboardEntry ? currentUserLeaderboardEntry.total_score : 0;

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "User,Module,Best Score,Attempts,Last Attempt Date\n";

    allAttempts.forEach(attempt => {
        const row = [
            `"${attempt.profiles.full_name}"`,
            `"${attempt.modules.title}"`,
            attempt.score,
            `${attempt.attempt_number} / 3`,
            new Date(attempt.completed_at).toLocaleString()
        ].join(',');
        csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "user_progress_summary.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="container mx-auto p-8"><Spinner /></div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container mx-auto p-8">
        <h1 className="text-4xl font-bold mb-8 animate-fade-in-up">Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <Leaderboard title="Overall Leaderboard" data={overallLeaderboard} />
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <UserScoreCard 
                    userName={profile?.full_name || 'User'} 
                    totalScore={currentUserScore} 
                />
            </div>
        </div>

        {profile?.role === 'admin' && (
          <div className="mt-12 bg-neutral-800/50 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-neutral-700 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">All User Progress</h2>
                <button onClick={exportToCSV} className="px-4 py-2 bg-accent hover:bg-green-600 rounded-md text-white font-semibold transition-all duration-300 transform hover:scale-105">
                    Export to CSV
                </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-neutral-600">
                    <th className="p-3">User</th>
                    <th className="p-3">Module</th>
                    <th className="p-3">Best Score</th>
                    <th className="p-3">Attempts</th>
                    <th className="p-3">Last Attempt</th>
                  </tr>
                </thead>
                <tbody>
                  {allAttempts.map(attempt => (
                    <tr key={attempt.id} className="border-b border-neutral-700 hover:bg-neutral-700/50">
                      <td className="p-3">{attempt.profiles.full_name}</td>
                      <td className="p-3">{attempt.modules.title}</td>
                      <td className="p-3 font-bold text-primary">{attempt.score}</td>
                      <td className="p-3 text-gray-300">{attempt.attempt_number} / 3</td>
                      <td className="p-3 text-gray-400">{new Date(attempt.completed_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default DashboardPage;