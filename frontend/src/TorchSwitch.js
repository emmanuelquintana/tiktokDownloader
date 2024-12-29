import React from 'react';
import './TorchSwitch.css';

const TorchSwitch = ({ darkMode, setDarkMode }) => {
  return (
    <div className="torch-switch">
      <input
        type="checkbox"
        id="mode-switch"
        checked={darkMode}
        onChange={() => setDarkMode(!darkMode)}
      />
      <label htmlFor="mode-switch" className="switch-label">
        <span className="icon">
          {darkMode ? '🌙' : '☀️'}
        </span>
      </label>
    </div>
  );
};

export default TorchSwitch;
