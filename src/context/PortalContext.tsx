import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Member, Transaction, PortalContextType, UserRole } from '../types';
import { mockApi } from '../services/mockApi';
import { sanitizeInput } from '../utils/sanitize';
import { logTelemetry } from '../utils/telemetry';

export const PortalContext = createContext<PortalContextType | null>(null);

export const PortalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [members, setMembers] = useState<Member[]>(() => {
    if (typeof window === 'undefined') return [];
    return mockApi.getStoredMembers();
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (typeof window === 'undefined') return [];
    return mockApi.getStoredTransactions();
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [simulateFailure, setSimulateFailureState] = useState<boolean>(() => mockApi.shouldSimulateFailure());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentRole, setCurrentRoleState] = useState<UserRole>('staff');
  const [lastAction, setLastAction] = useState<(() => Promise<void>) | null>(null);

  const setSimulateFailure = useCallback((value: boolean) => {
    mockApi.setSimulateFailure(value);
    setSimulateFailureState(value);
  }, []);

  const setCurrentRole = useCallback((role: UserRole) => {
    setCurrentRoleState(role);
    logTelemetry('switch_role', { role });
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedMembers, fetchedTransactions] = await Promise.all([
        mockApi.fetchMembers(),
        mockApi.fetchTransactions(),
      ]);
      setMembers(fetchedMembers);
      setTransactions(fetchedTransactions);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    setLastAction(() => loadData);
  }, [loadData]);

  const addMember = useCallback(
    async (memberData: Omit<Member, 'joinDate'> & { id?: string }) => {
      setError(null);
      const action = async () => {
        const sanitizedData = {
          id: memberData.id,
          name: sanitizeInput(memberData.name),
          email: sanitizeInput(memberData.email),
          tier: memberData.tier,
          points: Number(memberData.points) || 0,
        };
        const saved = await mockApi.saveMember(sanitizedData);
        setMembers((prev) => {
          const index = prev.findIndex((m) => m.id === saved.id);
          if (index !== -1) {
            const next = [...prev];
            next[index] = saved;
            return next;
          }
          return [...prev, saved];
        });
        logTelemetry('add_member', { memberId: saved.id, name: saved.name });
      };

      try {
        await action();
        setLastAction(null);
        setError(null);
      } catch (err: unknown) {
        setLastAction(() => action);
        throw err;
      }
    },
    []
  );

  const updateMember = useCallback(
    async (id: string, updates: Partial<Omit<Member, 'id'>>) => {
      setError(null);
      const action = async () => {
        const sanitizedUpdates: Partial<Omit<Member, 'id'>> = {
          ...updates,
          ...(updates.name ? { name: sanitizeInput(updates.name) } : {}),
          ...(updates.email ? { email: sanitizeInput(updates.email) } : {}),
          ...(updates.points !== undefined ? { points: Number(updates.points) } : {}),
        };
        const saved = await mockApi.saveMember({ id, ...sanitizedUpdates } as any);
        setMembers((prev) => prev.map((m) => (m.id === id ? saved : m)));
        logTelemetry('edit_member', { memberId: id });
      };

      try {
        await action();
        setLastAction(null);
        setError(null);
      } catch (err: unknown) {
        setLastAction(() => action);
        throw err;
      }
    },
    []
  );

  const logTransaction = useCallback(
    async (txData: Omit<Transaction, 'date'> & { id?: string }) => {
      setError(null);
      const action = async () => {
        const newTx = await mockApi.logTransaction(txData);
        setTransactions((prev) => {
          if (prev.some((t) => t.id === newTx.id)) return prev;
          return [newTx, ...prev];
        });

        setMembers((prev) =>
          prev.map((m) => {
            if (m.id !== txData.memberId) return m;
            const pts = Number(txData.points);
            const updatedPoints = txData.type === 'earn' ? m.points + pts : Math.max(0, m.points - pts);
            return { ...m, points: updatedPoints };
          })
        );

        const telemetryAction = txData.type === 'earn' ? 'earn_points' : 'redeem_points';
        logTelemetry(telemetryAction, { memberId: txData.memberId, points: txData.points });
      };

      try {
        await action();
        setLastAction(null);
        setError(null);
      } catch (err: unknown) {
        setLastAction(() => action);
        throw err;
      }
    },
    []
  );

  const retryLastAction = useCallback(async () => {
    setError(null);
    if (lastAction) {
      await lastAction();
      setLastAction(null);
      setError(null);
    } else {
      await loadData();
    }
  }, [lastAction, loadData]);

  const clearLastAction = useCallback(() => {
    setLastAction(null);
    setError(null);
  }, []);

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const lower = searchQuery.toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(lower) ||
        m.email.toLowerCase().includes(lower) ||
        m.id.toLowerCase().includes(lower) ||
        m.tier.toLowerCase().includes(lower)
    );
  }, [members, searchQuery]);

  const value: PortalContextType = {
    members,
    transactions,
    isLoading,
    error,
    simulateFailure,
    setSimulateFailure,
    searchQuery,
    setSearchQuery,
    filteredMembers,
    addMember,
    updateMember,
    logTransaction,
    retryLastAction,
    clearLastAction,
    currentRole,
    setCurrentRole,
  };

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
};

export const usePortal = (): PortalContextType => {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error('usePortal must be used within a PortalProvider');
  }
  return context;
};
