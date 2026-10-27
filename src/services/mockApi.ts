import type { Member, Transaction } from '../types';

export const MEMBERS_KEY = 'frequent_flyer_members';
export const TRANSACTIONS_KEY = 'frequent_flyer_transactions';
export const FAILURE_KEY = 'frequent_flyer_simulate_failure';

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'MEM-101',
    name: 'Jane Doe',
    email: 'jane.doe@airline-demo.com',
    tier: 'Platinum',
    points: 85000,
    joinDate: '2023-01-15',
  },
  {
    id: 'MEM-102',
    name: 'John Smith',
    email: 'john.smith@airline-demo.com',
    tier: 'Gold',
    points: 42000,
    joinDate: '2023-04-10',
  },
  {
    id: 'MEM-103',
    name: 'Alice Johnson',
    email: 'alice.j@airline-demo.com',
    tier: 'Silver',
    points: 18500,
    joinDate: '2023-08-22',
  },
  {
    id: 'MEM-104',
    name: 'Bob Williams',
    email: 'bob.w@airline-demo.com',
    tier: 'Bronze',
    points: 4500,
    joinDate: '2024-02-01',
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'TX-501',
    memberId: 'MEM-101',
    points: 5000,
    type: 'earn',
    date: '2024-05-01',
  },
  {
    id: 'TX-502',
    memberId: 'MEM-101',
    points: 20000,
    type: 'redeem',
    date: '2024-05-15',
  },
  {
    id: 'TX-503',
    memberId: 'MEM-102',
    points: 3500,
    type: 'earn',
    date: '2024-06-02',
  },
  {
    id: 'TX-504',
    memberId: 'MEM-103',
    points: 1000,
    type: 'earn',
    date: '2024-06-18',
  },
];

const wait = (ms = 40) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockApi = {
  shouldSimulateFailure(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(FAILURE_KEY) === 'true';
  },

  setSimulateFailure(value: boolean): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(FAILURE_KEY, String(value));
  },

  getStoredMembers(): Member[] {
    const raw = localStorage.getItem(MEMBERS_KEY);
    if (raw === null) {
      localStorage.setItem(MEMBERS_KEY, JSON.stringify(INITIAL_MEMBERS));
      return INITIAL_MEMBERS;
    }
    try {
      return JSON.parse(raw) as Member[];
    } catch {
      return INITIAL_MEMBERS;
    }
  },

  getStoredTransactions(): Transaction[] {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    if (raw === null) {
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(INITIAL_TRANSACTIONS));
      return INITIAL_TRANSACTIONS;
    }
    try {
      return JSON.parse(raw) as Transaction[];
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  },

  async fetchMembers(): Promise<Member[]> {
    await wait();
    if (this.shouldSimulateFailure()) {
      throw new Error('Network error: Unable to fetch frequent flyer members. Please retry.');
    }
    return this.getStoredMembers();
  },

  async fetchTransactions(): Promise<Transaction[]> {
    await wait();
    if (this.shouldSimulateFailure()) {
      throw new Error('Network error: Unable to fetch transactions. Please retry.');
    }
    return this.getStoredTransactions();
  },

  async saveMember(
    memberData: Omit<Member, 'id' | 'joinDate'> & { id?: string }
  ): Promise<Member> {
    if (this.shouldSimulateFailure()) {
      throw new Error('Network error: Failed to save member details. Please retry.');
    }

    const currentMembers = this.getStoredMembers();
    let savedMember: Member;

    if (memberData.id) {
      const index = currentMembers.findIndex((m) => m.id === memberData.id);
      if (index === -1) {
        savedMember = {
          id: memberData.id,
          name: memberData.name,
          email: memberData.email,
          tier: memberData.tier,
          points: Number(memberData.points) || 0,
          joinDate: new Date().toISOString().split('T')[0],
        };
        currentMembers.push(savedMember);
      } else {
        savedMember = {
          ...currentMembers[index],
          ...memberData,
        };
        currentMembers[index] = savedMember;
      }
    } else {
      savedMember = {
        id: `MEM-${Math.floor(1000 + Math.random() * 9000)}`,
        name: memberData.name,
        email: memberData.email,
        tier: memberData.tier,
        points: Number(memberData.points) || 0,
        joinDate: new Date().toISOString().split('T')[0],
      };
      currentMembers.push(savedMember);
    }

    localStorage.setItem(MEMBERS_KEY, JSON.stringify(currentMembers));
    return savedMember;
  },

  async logTransaction(
    txData: Omit<Transaction, 'id' | 'date'> & { id?: string }
  ): Promise<Transaction> {
    if (this.shouldSimulateFailure()) {
      throw new Error('Network error: Failed to log points transaction. Please retry.');
    }

    const currentTxs = this.getStoredTransactions();
    if (txData.id) {
      const existingTx = currentTxs.find((t) => t.id === txData.id);
      if (existingTx) {
        return existingTx;
      }
    }

    const members = this.getStoredMembers();
    const member = members.find((m) => m.id === txData.memberId);
    if (!member) {
      throw new Error(`Member with ID ${txData.memberId} not found.`);
    }

    const pointsNum = Number(txData.points);
    if (txData.type === 'earn') {
      member.points += pointsNum;
    } else {
      member.points = Math.max(0, member.points - pointsNum);
    }
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));

    const newTx: Transaction = {
      id: txData.id || `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      memberId: txData.memberId,
      points: pointsNum,
      type: txData.type,
      date: new Date().toISOString().split('T')[0],
    };

    currentTxs.unshift(newTx);
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(currentTxs));
    return newTx;
  },
};
