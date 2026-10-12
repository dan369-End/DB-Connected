import React from 'react';
import { ORDER_TIMELINE_STEPS, getOrderStatusConfig } from '../utils';

interface OrderTimelineProps {
  status?: string | null;
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ status }) => {
  const currentConfig = getOrderStatusConfig(status);

  // If order is cancelled, render a dedicated clear banner without deceptive progress
  if (status === 'cancelled') {
    return (
      <div className="order-cancelled-banner">
        <span className="cancelled-badge-icon">&#10006;</span>
        <div className="cancelled-text-block">
          <span className="cancelled-title">Commande annulée</span>
          <span className="cancelled-desc">
            Cette commande a été clôturée et ne fera pas l'objet d'une livraison.
          </span>
        </div>
      </div>
    );
  }

  const currentStepIndex = currentConfig.stepIndex;

  return (
    <div className="order-timeline-stepper">
      {ORDER_TIMELINE_STEPS.map((step, idx) => {
        const isCompleted = idx < currentStepIndex;
        const isCurrent = idx === currentStepIndex;

        return (
          <div
            key={step.key}
            className={`timeline-step-item ${isCompleted ? 'step-completed' : ''} ${isCurrent ? 'step-current' : ''}`}
          >
            <div className="step-marker-container">
              <div className="step-circle">
                {isCompleted ? '✓' : idx + 1}
              </div>
              {idx < ORDER_TIMELINE_STEPS.length - 1 && (
                <div className={`step-connector-line ${idx < currentStepIndex ? 'line-filled' : ''}`} />
              )}
            </div>
            <span className="step-label-text">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
};
