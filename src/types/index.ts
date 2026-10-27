export type Tier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export type TransactionType = 'earn' | 'redeem';

export interface Member {
  id: string;
  name: string;
  email: string;
  tier: Tier;
  points: number;
  joinDate: string;
}

export interface Transaction {
  id?: string;
  memberId: string;
  points: number;
  type: TransactionType;
  date: string;
}

export type UserRole = 'staff' | 'manager';

export interface PortalContextType {
  members: Member[];
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  simulateFailure: boolean;
  setSimulateFailure: (value: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredMembers: Member[];
  addMember: (member: Omit<Member, 'joinDate'> & { id?: string }) => Promise<void>;
  updateMember: (id: string, updates: Partial<Omit<Member, 'id'>>) => Promise<void>;
  logTransaction: (transaction: Omit<Transaction, 'date'> & { id?: string }) => Promise<void>;
  retryLastAction: () => Promise<void>;
  clearLastAction: () => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
}
