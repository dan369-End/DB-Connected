import React from 'react';

interface ProgressBarProps {
  completed: number;
  total: number;
  showDetails?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  completed,
  total,
  showDetails = true,
  className = '',
}) => {
  const percentage = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

  return (
    <div className={`academy-progress-wrapper ${className}`}>
      {showDetails && (
        <div className="progress-labels">
          <span className="progress-fraction">
            {completed} / {total} {total <= 1 ? 'leçon terminée' : 'leçons terminées'}
          </span>
          <span className="progress-percent">{percentage}%</span>
        </div>
      )}
      <div className="progress-track" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
        <div
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
