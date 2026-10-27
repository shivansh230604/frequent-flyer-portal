import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Member, Tier } from '../types';
import { usePortal } from '../context/PortalContext';

interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberToEdit?: Member | null;
}

export const MemberFormModal: React.FC<MemberFormModalProps> = ({
  isOpen,
  onClose,
  memberToEdit,
}) => {
  const { addMember, updateMember, clearLastAction } = usePortal();

  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [tier, setTier] = useState<Tier>('Bronze');
  const [points, setPoints] = useState<number>(0);

  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const pendingIdRef = useRef<string>('');
  const modalRef = useRef<HTMLDivElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  const resetForm = useCallback(() => {
    setName(memberToEdit ? memberToEdit.name : '');
    setEmail(memberToEdit ? memberToEdit.email : '');
    setTier(memberToEdit ? memberToEdit.tier : 'Bronze');
    setPoints(memberToEdit ? memberToEdit.points : 0);
    setErrors({});
    setIsSaving(false);
    setModalError(null);
    pendingIdRef.current = memberToEdit ? memberToEdit.id : '';
    clearLastAction();
  }, [memberToEdit, clearLastAction]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  // Synchronize initial state whenever isOpen transitions or memberToEdit changes
  useEffect(() => {
    if (isOpen) {
      setName(memberToEdit ? memberToEdit.name : '');
      setEmail(memberToEdit ? memberToEdit.email : '');
      setTier(memberToEdit ? memberToEdit.tier : 'Bronze');
      setPoints(memberToEdit ? memberToEdit.points : 0);
      setErrors({});
      setIsSaving(false);
      setModalError(null);
      pendingIdRef.current = memberToEdit ? memberToEdit.id : `MEM-${Math.floor(1000 + Math.random() * 9000)}`;
    } else {
      resetForm();
    }
  }, [isOpen, memberToEdit, resetForm]);

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

  const validate = (): boolean => {
    const errs: { name?: string; email?: string } = {};
    if (!name.trim()) {
      errs.name = 'Name is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      errs.email = 'Valid email is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const executeSave = async () => {
    if (isSaving) return;
    if (!validate()) {
      return;
    }

    setIsSaving(true);
    setModalError(null);

    try {
      if (memberToEdit) {
        await updateMember(memberToEdit.id, { name, email, tier, points });
      } else {
        const idToSave = pendingIdRef.current || `MEM-${Math.floor(1000 + Math.random() * 9000)}`;
        pendingIdRef.current = idToSave;
        await addMember({ id: idToSave, name, email, tier, points });
      }
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save member. Please retry.';
      setModalError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeSave();
  };

  return (
    <div
      ref={modalRef}
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-modal-title"
    >
      <div className="modal-content">
        <div className="modal-header">
          <h2 id="member-modal-title">{memberToEdit ? 'Edit Member' : 'Add New Member'}</h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={handleClose}
            aria-label="Close modal"
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
                aria-label="Saving member data"
                aria-live="polite"
              >
                <div className="spinner" aria-hidden="true" />
                <span className="loader-text">Saving member details...</span>
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
                  onClick={executeSave}
                  aria-label="Retry saving member"
                  disabled={isSaving}
                >
                  Retry
                </button>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="member-fullname">Full Name</label>
              <input
                id="member-fullname"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                  if (modalError) setModalError(null);
                }}
                aria-label="Full Name"
                aria-invalid={errors.name ? 'true' : 'false'}
                aria-describedby={errors.name ? 'name-error' : undefined}
                className={errors.name ? 'input-error' : ''}
                disabled={isSaving}
              />
              {errors.name && (
                <span id="name-error" className="error-text" role="alert">
                  {errors.name}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="member-email">Email Address</label>
              <input
                id="member-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  if (modalError) setModalError(null);
                }}
                aria-label="Email Address"
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className={errors.email ? 'input-error' : ''}
                disabled={isSaving}
              />
              {errors.email && (
                <span id="email-error" className="error-text" role="alert">
                  {errors.email}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="member-tier">Membership Tier</label>
              <select
                id="member-tier"
                value={tier}
                onChange={(e) => {
                  setTier(e.target.value as Tier);
                  if (modalError) setModalError(null);
                }}
                aria-label="Membership Tier"
                disabled={isSaving}
              >
                <option value="Bronze">Bronze</option>
                <option value="Silver">Silver</option>
                <option value="Gold">Gold</option>
                <option value="Platinum">Platinum</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="member-points">Initial Points</label>
              <input
                id="member-points"
                type="number"
                min={0}
                value={points}
                onChange={(e) => {
                  setPoints(Math.max(0, parseInt(e.target.value, 10) || 0));
                  if (modalError) setModalError(null);
                }}
                aria-label="Initial Points"
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              aria-label="Cancel member entry"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              aria-label="Save member"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
