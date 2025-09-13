import React from 'react';
import Avatar from './Avatar';

interface UserScoreCardProps {
  userName: string;
  totalScore: number;
}

const UserScoreCard = ({ userName, totalScore }: UserScoreCardProps) => {
  return (
    <div className="bg-neutral-800/50 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-neutral-700 h-full flex flex-col justify-center items-center text-center">
      <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-accent to-info">My Total Points</h2>
      <Avatar name={userName} size={80} />
      <p className="text-xl font-bold mt-4">{userName}</p>
      <p className="text-7xl font-extrabold text-yellow-300 mt-2">{totalScore}</p>
      <p className="text-gray-400">Points Accumulated</p>
    </div>
  );
};

export default UserScoreCard;
