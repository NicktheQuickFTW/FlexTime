import React from 'react';
import FTIcon, { SPORT_ICONS, SportIcon, UIIcon } from '../ui/FTIcon';
import './IconShowcase.css';

const IconShowcase: React.FC = () => {
  // Group icons by category
  const sportIcons = [
    'football', 'basketball', 'baseball', 'softball', 'soccer', 'volleyball',
    'tennis', 'golf', 'swimming', 'wrestling', 'track', 'cross-country',
    'gymnastics', 'lacrosse', 'rowing', 'beach-volleyball', 'equestrian'
  ];
  
  const uiIcons = [
    'schedule', 'analytics', 'teams', 'constraints', 'dashboard', 'compass',
    'ai', 'optimization', 'collaboration', 'export', 'settings', 'home'
  ];
  
  const actionIcons = [
    'add', 'edit', 'save', 'delete', 'search', 'filter', 'refresh',
    'play', 'pause', 'stop', 'expand', 'collapse'
  ];
  
  const statusIcons = [
    'success', 'warning', 'error', 'info', 'loading'
  ];

  return (
    <div className="ft-icon-showcase">
      <div className="ft-container">
        <header className="showcase-header">
          <h1 className="showcase-title">
            <FTIcon name="compass" variant="glow" size={48} />
            FlexTime Icon System
          </h1>
          <p className="showcase-subtitle">
            Powered by Iconify with Big 12 Sports Integration
          </p>
        </header>

        {/* Sports Icons */}
        <section className="icon-section">
          <h2 className="section-title">
            <FTIcon name="football" variant="accent" size={32} />
            Big 12 Sports
          </h2>
          <div className="icon-grid">
            {sportIcons.map((sport) => (
              <div key={sport} className="icon-card">
                <div className="icon-display">
                  <SportIcon sport={sport as any} size={36} variant="default" />
                </div>
                <div className="icon-variants">
                  <SportIcon sport={sport as any} size={20} variant="glow" />
                  <SportIcon sport={sport as any} size={20} variant="accent" />
                  <SportIcon sport={sport as any} size={20} variant="muted" />
                </div>
                <span className="icon-name">{sport}</span>
              </div>
            ))}
          </div>
        </section>

        {/* UI Icons */}
        <section className="icon-section">
          <h2 className="section-title">
            <FTIcon name="dashboard" variant="accent" size={32} />
            Interface Elements
          </h2>
          <div className="icon-grid">
            {uiIcons.map((icon) => (
              <div key={icon} className="icon-card">
                <div className="icon-display">
                  <UIIcon type={icon as any} size={36} variant="default" />
                </div>
                <div className="icon-variants">
                  <UIIcon type={icon as any} size={20} variant="glow" />
                  <UIIcon type={icon as any} size={20} variant="accent" />
                  <UIIcon type={icon as any} size={20} variant="muted" />
                </div>
                <span className="icon-name">{icon}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Action Icons */}
        <section className="icon-section">
          <h2 className="section-title">
            <FTIcon name="edit" variant="accent" size={32} />
            Actions & Controls
          </h2>
          <div className="icon-grid">
            {actionIcons.map((icon) => (
              <div key={icon} className="icon-card">
                <div className="icon-display">
                  <FTIcon name={icon} size={36} variant="default" />
                </div>
                <div className="icon-variants">
                  <FTIcon name={icon} size={20} variant="glow" />
                  <FTIcon name={icon} size={20} variant="accent" />
                  <FTIcon name={icon} size={20} variant="muted" />
                </div>
                <span className="icon-name">{icon}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Status Icons */}
        <section className="icon-section">
          <h2 className="section-title">
            <FTIcon name="info" variant="accent" size={32} />
            Status & Feedback
          </h2>
          <div className="icon-grid">
            {statusIcons.map((icon) => (
              <div key={icon} className="icon-card">
                <div className="icon-display">
                  <FTIcon name={icon} size={36} variant="default" />
                </div>
                <div className="icon-variants">
                  <FTIcon name={icon} size={20} variant="glow" />
                  <FTIcon name={icon} size={20} variant="accent" />
                  <FTIcon name={icon} size={20} variant="muted" />
                </div>
                <span className="icon-name">{icon}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Usage Examples */}
        <section className="icon-section">
          <h2 className="section-title">
            <FTIcon name="ai" variant="accent" size={32} />
            Usage Examples
          </h2>
          <div className="usage-examples">
            <div className="example-card">
              <h3>Sport Selector</h3>
              <div className="example-content">
                <div className="sport-list">
                  <div className="sport-item">
                    <SportIcon sport="football" variant="glow" />
                    <span>Football</span>
                  </div>
                  <div className="sport-item">
                    <SportIcon sport="basketball" variant="glow" />
                    <span>Basketball</span>
                  </div>
                  <div className="sport-item">
                    <SportIcon sport="baseball" variant="glow" />
                    <span>Baseball</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="example-card">
              <h3>Action Buttons</h3>
              <div className="example-content">
                <div className="action-buttons">
                  <button className="ft-btn-primary">
                    <FTIcon name="add" size={20} />
                    Add Game
                  </button>
                  <button className="ft-btn-ghost">
                    <FTIcon name="edit" size={20} />
                    Edit
                  </button>
                  <button className="ft-btn-ghost">
                    <FTIcon name="export" size={20} />
                    Export
                  </button>
                </div>
              </div>
            </div>

            <div className="example-card">
              <h3>Status Indicators</h3>
              <div className="example-content">
                <div className="status-list">
                  <div className="status-item success">
                    <FTIcon name="success" variant="glow" />
                    <span>Schedule Optimized</span>
                  </div>
                  <div className="status-item warning">
                    <FTIcon name="warning" variant="accent" />
                    <span>Constraint Conflict</span>
                  </div>
                  <div className="status-item info">
                    <FTIcon name="info" variant="glow" />
                    <span>Processing...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default IconShowcase;