import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>🧬 Pheromone Dating</h1>
        <p>Science-based matching through scent compatibility</p>
        <div className="hero-section">
          <h2>Find Your Perfect Match Through Science</h2>
          <p>
            Discover compatibility based on your unique biological signature.
            Our revolutionary app uses pheromone analysis to find your ideal partner.
          </p>
          <div className="features">
            <div className="feature">
              <h3>🔬 Scientific Matching</h3>
              <p>HLA genetic compatibility analysis</p>
            </div>
            <div className="feature">
              <h3>🧪 Scent Profiling</h3>
              <p>Personalized pheromone assessment</p>
            </div>
            <div className="feature">
              <h3>🔒 Secure & Private</h3>
              <p>Encrypted biological data protection</p>
            </div>
          </div>
          <button className="cta-button">
            Join the Beta
          </button>
        </div>
      </header>
    </div>
  );
}

export default App;
