import React from 'react';

function App() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        borderRadius: '1rem',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h1 style={{
          fontSize: '3rem',
          marginBottom: '1rem',
          background: 'linear-gradient(45deg, #00bfff, #1e40af)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          FlexTime
        </h1>
        <p style={{
          fontSize: '1.2rem',
          color: '#94a3b8',
          marginBottom: '2rem'
        }}>
          Big 12 Conference Sports Scheduling Platform
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1rem',
          maxWidth: '500px'
        }}>
          {[
            { label: 'Teams', value: '16' },
            { label: 'Sports', value: '23' },
            { label: 'Optimization', value: '95%' },
            { label: 'Speed', value: '<2s' }
          ].map((stat, index) => (
            <div key={stat.label} style={{
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '0.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#00bfff' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        <div style={{
          marginTop: '2rem',
          padding: '0.75rem 1.5rem',
          background: 'linear-gradient(45deg, #00bfff, #1e40af)',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          display: 'inline-block'
        }}>
          Launch Dashboard →
        </div>
      </div>
    </div>
  );
}

export default App;