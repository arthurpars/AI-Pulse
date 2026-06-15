import React from 'react';
import { Theme } from '../../hooks/useTheme';
import './ThemeToggle.css';

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle }) => {
  return (
    <button className="theme-toggle-nav" onClick={onToggle} aria-label="Toggle theme">
      <span className="theme-toggle-icon">{theme === 'dark' ? '🌙' : '☀️'}</span>
      <span className="theme-toggle-label">{theme === 'dark' ? 'Dark' : 'Light'}</span>
    </button>
  );
};
