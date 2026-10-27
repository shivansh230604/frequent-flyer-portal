import React, { useState, useMemo } from 'react';
import type { Tier } from '../types';
import { usePortal } from '../context/PortalContext';

type SortField = 'name' | 'email' | 'tier' | 'points' | 'joinDate';
type SortDirection = 'asc' | 'desc';

export const ManagerDashboard: React.FC = () => {
  const { members, transactions } = usePortal();
  const [tableSearch, setTableSearch] = useState('');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Metrics calculation
  const totalMembers = members.length;

  const tierBreakdown = useMemo(() => {
    const counts: Record<Tier, number> = {
      Bronze: 0,
      Silver: 0,
      Gold: 0,
      Platinum: 0,
    };
    members.forEach((m) => {
      if (counts[m.tier] !== undefined) {
        counts[m.tier] += 1;
      }
    });
    return counts;
  }, [members]);

  const pointsSummary = useMemo(() => {
    let issued = 0;
    let redeemed = 0;
    transactions.forEach((tx) => {
      if (tx.type === 'earn') {
        issued += tx.points;
      } else {
        redeemed += tx.points;
      }
    });
    return { issued, redeemed };
  }, [transactions]);

  // Filter & Sort table members
  const filteredAndSortedMembers = useMemo(() => {
    const lower = tableSearch.toLowerCase().trim();
    const result = members.filter(
      (m) =>
        m.name.toLowerCase().includes(lower) ||
        m.email.toLowerCase().includes(lower) ||
        m.tier.toLowerCase().includes(lower) ||
        m.id.toLowerCase().includes(lower)
    );

    if (sortField) {
      result.sort((a, b) => {
        let valA: string | number = a[sortField];
        let valB: string | number = b[sortField];

        if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = (valB as string).toLowerCase();
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [members, tableSearch, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortClass = (field: SortField) => {
    if (sortField !== field) return '';
    return sortDirection === 'asc' ? 'sort-asc' : 'sort-desc';
  };

  return (
    <main className="portal-main">
      <div className="dashboard-header">
        <h2 className="section-title">Manager Dashboard</h2>
        <span className="dashboard-badge">Executive Overview</span>
      </div>

      {/* Metrics Row */}
      <section className="metrics-grid" aria-label="Portal Metrics">
        <article className="metric-card" data-testid="metric-total-members">
          <span className="metric-label">Total Members</span>
          <span className="metric-value">{totalMembers}</span>
          <span className="metric-subtitle">Active Registered Accounts</span>
        </article>

        <article className="metric-card" data-testid="metric-tier-breakdown">
          <span className="metric-label">Members per Tier</span>
          <div className="tier-breakdown-list">
            <span className="tier-count">Platinum: {tierBreakdown.Platinum}</span>
            <span className="tier-count">Gold: {tierBreakdown.Gold}</span>
            <span className="tier-count">Silver: {tierBreakdown.Silver}</span>
            <span className="tier-count">Bronze: {tierBreakdown.Bronze}</span>
          </div>
        </article>

        <article className="metric-card" data-testid="metric-points-summary">
          <span className="metric-label">Points Summary</span>
          <div className="points-summary-values">
            <span className="points-issued">Issued: +{pointsSummary.issued.toLocaleString()}</span>
            <span className="points-redeemed">Redeemed: -{pointsSummary.redeemed.toLocaleString()}</span>
          </div>
        </article>
      </section>

      {/* Table Section */}
      <section className="dashboard-table-section" aria-labelledby="members-table-heading">
        <div className="table-controls">
          <h3 id="members-table-heading" className="table-title">
            All Frequent Flyer Members
          </h3>
          <div className="table-search">
            <label htmlFor="manager-table-search" className="search-label">
              Filter Table
            </label>
            <input
              id="manager-table-search"
              type="search"
              placeholder="Filter by name, email, tier..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              aria-label="Filter table members"
            />
          </div>
        </div>

        {filteredAndSortedMembers.length === 0 ? (
          <div className="empty-state" role="status" aria-live="polite">
            <p className="empty-message">No data found</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="corporate-table" aria-label="Frequent Flyer Members">
              <thead>
                <tr>
                  <th scope="col">
                    <button
                      type="button"
                      className={`sort-btn ${getSortClass('name')}`}
                      onClick={() => handleSort('name')}
                      aria-label="Sort by Name"
                    >
                      Name
                    </button>
                  </th>
                  <th scope="col">
                    <button
                      type="button"
                      className={`sort-btn ${getSortClass('email')}`}
                      onClick={() => handleSort('email')}
                      aria-label="Sort by Email"
                    >
                      Email
                    </button>
                  </th>
                  <th scope="col">
                    <button
                      type="button"
                      className={`sort-btn ${getSortClass('tier')}`}
                      onClick={() => handleSort('tier')}
                      aria-label="Sort by Tier"
                    >
                      Tier
                    </button>
                  </th>
                  <th scope="col">
                    <button
                      type="button"
                      className={`sort-btn ${getSortClass('points')}`}
                      onClick={() => handleSort('points')}
                      aria-label="Sort by Points"
                    >
                      Points
                    </button>
                  </th>
                  <th scope="col">
                    <button
                      type="button"
                      className={`sort-btn ${getSortClass('joinDate')}`}
                      onClick={() => handleSort('joinDate')}
                      aria-label="Sort by Join Date"
                    >
                      Join Date
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedMembers.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <strong>{member.name}</strong> ({member.id})
                    </td>
                    <td>{member.email}</td>
                    <td>
                      <span className={`tier-badge tier-${member.tier.toLowerCase()}`}>
                        {member.tier}
                      </span>
                    </td>
                    <td>{member.points.toLocaleString()}</td>
                    <td>{member.joinDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recent Activity Log */}
      <section
        className="activity-log-section"
        aria-label="Recent activity log"
      >
        <h3 className="table-title">Recent Activity Log</h3>
        {transactions.length === 0 ? (
          <p className="empty-message">No data found</p>
        ) : (
          <ul className="activity-list" aria-label="Transaction history">
            {transactions.slice(0, 10).map((tx) => (
              <li key={tx.id || `${tx.memberId}-${tx.date}`} className="activity-item">
                <span className={`activity-badge badge-${tx.type}`}>
                  {tx.type === 'earn' ? 'POINTS ISSUED' : 'POINTS REDEEMED'}
                </span>
                <span className="activity-details">
                  Member <strong>{tx.memberId}</strong> - {tx.points.toLocaleString()} pts on{' '}
                  {tx.date}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
};
