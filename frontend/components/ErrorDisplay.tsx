'use client';

import { AlertCircle, Info } from 'lucide-react';
import { getStreamError, formatErrorMessage } from '@/lib/errors';

interface ErrorDisplayProps {
  errorCode: number | bigint;
  className?: string;
}

/**
 * Display user-friendly error messages from contract error codes
 */
export function ErrorDisplay({ errorCode, className = '' }: ErrorDisplayProps) {
  const error = getStreamError(errorCode);
  
  if (!error) {
    return (
      <div className={`rounded-lg border border-red-200 bg-red-50 p-4 ${className}`}>
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-red-800">
              Unknown Error
            </h3>
            <p className="mt-1 text-sm text-red-700">
              An unknown error occurred (Code: {String(errorCode)}). Please try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-red-200 bg-red-50 p-4 ${className}`}>
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {error.userMessage}
          </h3>
          {error.suggestion && (
            <div className="mt-2 flex items-start">
              <Info className="h-4 w-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-700">
                {error.suggestion}
              </p>
            </div>
          )}
          <p className="mt-2 text-xs text-red-600">
            Error code: {error.code} ({error.name})
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline error message (smaller, for forms)
 */
export function InlineError({ errorCode, className = '' }: ErrorDisplayProps) {
  const message = formatErrorMessage(errorCode);
  
  return (
    <p className={`text-sm text-red-600 flex items-center ${className}`}>
      <AlertCircle className="h-4 w-4 mr-1.5" />
      {message}
    </p>
  );
}

/**
 * Toast-style error notification
 */
export function ErrorToast({ errorCode, onClose }: ErrorDisplayProps & { onClose?: () => void }) {
  const error = getStreamError(errorCode);
  
  return (
    <div className="fixed bottom-4 right-4 max-w-md animate-slide-up">
      <div className="rounded-lg border border-red-200 bg-white shadow-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                {error?.userMessage || 'Error'}
              </h3>
              {error?.suggestion && (
                <p className="mt-1 text-sm text-gray-600">
                  {error.suggestion}
                </p>
              )}
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

