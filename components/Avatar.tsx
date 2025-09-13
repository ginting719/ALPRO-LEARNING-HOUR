import React from 'react';

interface AvatarProps {
  name: string;
  size?: number;
}

const Avatar = ({ name, size = 40 }: AvatarProps) => {
  const getInitial = (name: string) => {
    if (!name) return '?';
    const words = name.split(' ');
    return words[0][0]?.toUpperCase() || '?';
  };

  const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
  };

  const initial = getInitial(name);
  const backgroundColor = stringToColor(name);
  
  const style = {
    width: `${size}px`,
    height: `${size}px`,
    fontSize: `${size * 0.5}px`,
    backgroundColor: backgroundColor,
  };

  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white select-none"
      style={style}
    >
      {initial}
    </div>
  );
};

export default Avatar;