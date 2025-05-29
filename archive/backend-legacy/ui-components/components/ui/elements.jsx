import React, { useState } from 'react';

/**
 * Card component for displaying content in a highlighted box
 */
export const Card = ({ title, children, horizontal }) => {
  return (
    <div className={`card ${horizontal ? 'card-horizontal' : ''}`}>
      {title && <div className="card-title">{title}</div>}
      <div className="card-content">{children}</div>
    </div>
  );
};

/**
 * CardGroup component for organizing cards in a grid
 */
export const CardGroup = ({ children, cols = 1 }) => {
  return (
    <div className="card-group" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {children}
    </div>
  );
};

/**
 * Tabs component for creating tabbed interfaces
 */
export const Tabs = ({ children, activeTab, onChange }) => {
  const [active, setActive] = useState(activeTab || (children[0] && children[0].props.id));

  const handleTabClick = (tabId) => {
    setActive(tabId);
    if (onChange) {
      onChange(tabId);
    }
  };

  return (
    <div className="tabs-container">
      <div className="tabs-header">
        {React.Children.map(children, (child) => (
          <div 
            className={`tab-button ${active === child.props.id ? 'active' : ''}`}
            onClick={() => handleTabClick(child.props.id)}
          >
            {child.props.title}
          </div>
        ))}
      </div>
      <div className="tab-content">
        {React.Children.map(children, (child) => (
          <div className={`tab-panel ${active === child.props.id ? 'active' : ''}`}>
            {child}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Tab component for use within the Tabs component
 */
export const Tab = ({ id, title, children }) => {
  return (
    <div className="tab-content">
      {children}
    </div>
  );
};

/**
 * Note component for informational callouts
 */
export const Note = ({ children }) => {
  return (
    <div className="note">
      <div className="note-icon">ℹ️</div>
      <div className="note-content">{children}</div>
    </div>
  );
};

/**
 * AccordionGroup component for organizing accordions
 */
export const AccordionGroup = ({ children }) => {
  return (
    <div className="accordion-group">
      {children}
    </div>
  );
};

/**
 * Accordion component for expandable/collapsible content sections
 */
export const Accordion = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`accordion ${isOpen ? 'open' : ''}`}>
      <div className="accordion-header" onClick={toggleAccordion}>
        <span className="accordion-title">{title}</span>
        <span className="accordion-icon">{isOpen ? '▼' : '►'}</span>
      </div>
      {isOpen && (
        <div className="accordion-content">
          {children}
        </div>
      )}
    </div>
  );
};
