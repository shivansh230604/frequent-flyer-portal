import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Member, TransactionType } from '../types';
import { usePortal } from '../context/PortalContext';

interface PointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMember?: Member | null;
}

export const PointsModal: React.FC<PointsModalProps> = ({
  isOpen,
  onClose,
  selectedMember,
}) => {
  const { members, logTransaction, clearLastAction } = usePortal();

  const [memberId, setMemberId] = useState<string>('');
  const [type, setType] = useState<TransactionType>('earn');
  const [points, setPoints] = useState<number>(100);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const pendingTxIdRef = useRef<string>('');
  const modalRef = useRef<HTMLDivElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  const resetForm = useCallback(() => {
    setMemberId(selectedMember ? selectedMember.id : members[0]?.id || '');
    setType('earn');
    setPoints(100);
    setValidationError(null);
    setIsSaving(false);
    setModalError(null);
    pendingTxIdRef.current = '';
    clearLastAction();
  }, [selectedMember, members, clearLastAction]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  // Synchronize initial state whenever isOpen transitions or selectedMember changes
  useEffect(() => {
    if (isOpen) {
      setMemberId(selectedMember ? selectedMember.id : members[0]?.id || '');
      setType('earn');
      setPoints(100);
      setValidationError(null);
      setIsSaving(false);
      setModalError(null);
      pendingTxIdRef.current = `TX-${Math.floor(1000 + Math.random() * 9000)}`;
    } else {
      resetForm();
    }
  }, [isOpen, selectedMember, members, resetForm]);

  useEffect(() => {
    if (!isOpen) return;

    previousActiveElementRef.current = document.activeElement as HTMLElement | null;

    const focusTimer = setTimeout(() => {
      if (modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length > 0) {
          focusables[0].focus();
        }
      }
    }, 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || !modalRef.current.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement || !modalRef.current.contains(document.activeElement)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    const handleWindowClick = (e: MouseEvent) => {
      if (modalRef.current && e.target === modalRef.current && !isSaving) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleWindowClick);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleWindowClick);
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, handleClose, isSaving]);

  if (!isOpen) return null;

  const executeLogPoints = async () => {
    if (isSaving) return;
    if (!memberId) {
      setValidationError('Please select a member');
      return;
    }
    if (points <= 0) {
      setValidationError('Points amount must be greater than zero');
      return;
    }

    setIsSaving(true);
    setModalError(null);
    setValidationError(null);

    try {
      const txIdToSave = pendingTxIdRef.current || `TX-${Math.floor(1000 + Math.random() * 9000)}`;
      pendingTxIdRef.current = txIdToSave;
      await logTransaction({
        id: txIdToSave,
        memberId,
        points,
        type,
      });
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to log points. Please retry.';
      setModalError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeLogPoints();
  };

  return (
    <div
      ref={modalRef}
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="points-modal-title"
    >
      <div className="modal-content">
        <div className="modal-header">
          <h2 id="points-modal-title">Log Frequent Flyer Points</h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={handleClose}
            aria-label="Close points modal"
            disabled={isSaving}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form" noValidate>
          <div className="modal-body">
            {/* In-Modal Loading Indicator */}
            {isSaving && (
              <div
                className="modal-loader"
                role="status"
                aria-label="Logging points transaction"
                aria-live="polite"
              >
                <div className="spinner" aria-hidden="true" />
                <span className="loader-text">Processing points transaction...</span>
              </div>
            )}

            {/* In-Modal Error Alert with Retry */}
            {modalError && (
              <div
                className="modal-error-alert"
                role="alert"
                aria-live="assertive"
              >
                <div className="alert-content">
                  <span className="alert-icon" aria-hidden="true">⚠️</span>
                  <span className="alert-message">{modalError}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-retry"
                  onClick={executeLogPoints}
                  aria-label="Retry logging points"
                  disabled={isSaving}
                >
                  Retry
                </button>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="points-member-select">Select Member</label>
              <select
                id="points-member-select"
                value={memberId}
                onChange={(e) => {
                  setMemberId(e.target.value);
                  if (validationError) setValidationError(null);
                  if (modalError) setModalError(null);
                }}
                aria-label="Select Member"
                disabled={isSaving}
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.tier} - {m.points} pts)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="points-type-select">Transaction Type</label>
              <select
                id="points-type-select"
                value={type}
                onChange={(e) => {
                  setType(e.target.value as TransactionType);
                  if (modalError) setModalError(null);
                }}
                aria-label="Transaction Type"
                disabled={isSaving}
              >
                <option value="earn">Earn Points</option>
                <option value="redeem">Redeem Points</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="points-amount-input">Points Amount</label>
              <input
                id="points-amount-input"
                type="number"
                min={1}
                value={points}
                onChange={(e) => {
                  setPoints(parseInt(e.target.value, 10) || 0);
                  if (validationError) setValidationError(null);
                  if (modalError) setModalError(null);
                }}
                aria-label="Points Amount"
                aria-invalid={validationError ? 'true' : 'false'}
                aria-describedby={validationError ? 'points-error' : undefined}
                className={validationError ? 'input-error' : ''}
                disabled={isSaving}
              />
              {validationError && (
                <span id="points-error" className="error-text" role="alert">
                  {validationError}
                </span>
              )}
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              aria-label="Cancel points logging"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              aria-label="Submit points transaction"
              disabled={isSaving}
            >
              {isSaving ? 'Processing...' : 'Submit Points'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
