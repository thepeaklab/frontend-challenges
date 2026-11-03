import { useEffect, useState } from 'react';
import './button.css';

interface ButtonProps {
  timerCount: number;
}

export const Button: React.FC<ButtonProps> = ({ timerCount }) => {
  const [count, setCount] = useState(0);

  return (
    <button
      type="button"
      className="btn"
      onClick={() => setCount((count) => count + 1)}
    >
      count is {timerCount + count}
    </button>
  );
};
