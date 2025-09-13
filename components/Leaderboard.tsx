import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { LeaderboardEntry } from '../types';
import Avatar from './Avatar';

interface LeaderboardProps {
  title: string;
  data: LeaderboardEntry[];
}

const PodiumIcon = ({ color, size = 24 }: { color: string, size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M6 9v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9"/><path d="m12 12 3 3 3-3"/><path d="M12 2v5.72a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V2Z"/>
    </svg>
);

const Leaderboard = ({ title, data }: LeaderboardProps) => {
  const sortedData = [...data].sort((a, b) => b.total_score - a.total_score);
  const topThree = sortedData.slice(0, 3);
  const others = sortedData.slice(3);

  const podiumColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

  return (
    <div className="bg-neutral-800/50 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-neutral-700 animate-fade-in-up">
      <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">{title}</h2>
      
      {/* Podium for Top 3 */}
      <div className="flex justify-center items-end gap-4 mb-8 min-h-[220px]">
        {topThree[1] && (
          <div className="text-center flex flex-col items-center w-24">
            <Avatar name={topThree[1].full_name} size={48} />
            <div className="font-bold text-lg mt-2 truncate w-full">{topThree[1].full_name}</div>
            <div className="text-2xl font-extrabold text-gray-300">{topThree[1].total_score}</div>
            <div className="bg-gray-400 text-neutral-800 rounded-t-lg w-full h-24 flex items-center justify-center text-4xl font-bold mt-2">2</div>
          </div>
        )}
        {topThree[0] && (
          <div className="text-center flex flex-col items-center w-28 order-first mx-4">
             <Avatar name={topThree[0].full_name} size={64} />
            <div className="font-bold text-xl mt-2 truncate w-full">{topThree[0].full_name}</div>
            <div className="text-3xl font-extrabold text-yellow-300">{topThree[0].total_score}</div>
            <div className="bg-yellow-400 text-neutral-800 rounded-t-lg w-full h-36 flex items-center justify-center text-5xl font-bold mt-2">1</div>
          </div>
        )}
        {topThree[2] && (
          <div className="text-center flex flex-col items-center w-20">
            <Avatar name={topThree[2].full_name} size={40} />
            <div className="font-bold text-md mt-2 truncate w-full">{topThree[2].full_name}</div>
            <div className="text-xl font-extrabold text-orange-400">{topThree[2].total_score}</div>
            <div className="bg-orange-500 text-neutral-800 rounded-t-lg w-full h-16 flex items-center justify-center text-3xl font-bold mt-2">3</div>
          </div>
        )}
      </div>

      {others.length > 0 && <h3 className="text-xl font-semibold mb-4 mt-8 border-t border-neutral-700 pt-4">Full Rankings</h3>}
      <div className="space-y-3">
        {others.map((entry, index) => (
          <div key={entry.user_id} className="flex justify-between items-center bg-neutral-700/50 p-3 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="font-bold text-gray-400 w-6 text-center">{index + 4}</span>
              <Avatar name={entry.full_name} size={32} />
              <span className="font-semibold">{entry.full_name}</span>
            </div>
            <span className="font-bold text-primary">{entry.total_score} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;