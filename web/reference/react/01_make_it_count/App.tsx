import { useEffect, useState } from 'react';
import './App.css';
import { Button } from './components/button';

function App() {
  const [appCount, setAppCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAppCount((appCount) => appCount + 1);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="App">
      <h1>Make it Count!</h1>
      <button
        type="button"
        onClick={() => setAppCount((appCount) => appCount + 1)}
      >
        app count is {appCount}
      </button>
      <div className="card">
        <Button timerCount={appCount} />
        <Button timerCount={appCount} />
      </div>
    </div>
  );
}

export default App;
