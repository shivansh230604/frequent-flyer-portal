import React, { useState } from 'react';
import type { Member } from '../types';
import { usePortal } from '../context/PortalContext';
import { MemberFormModal } from './MemberFormModal';
import { PointsModal } from './PointsModal';

export const StaffPortal: React.FC = () => {
  const { filteredMembers, searchQuery, setSearchQuery } = usePortal();

  const [operatorNotes, setOperatorNotes] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const handleEdit = (member: Member) => {
    setSelectedMember(member);
    setIsAddModalOpen(true);
  };

  const handlePoints = (member?: Member) => {
    setSelectedMember(member || null);
    setIsPointsModalOpen(true);
  };

  return (
    <main className="portal-main">
      <section className="operations-toolbar" aria-labelledby="operations-heading">
        <div className="toolbar-header">
          <h2 id="operations-heading" className="section-title">
            Floor Staff Operations
          </h2>
          <div className="toolbar-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setSelectedMember(null);
                setIsAddModalOpen(true);
              }}
              aria-label="Add Member"
            >
              + Add Member
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handlePoints()}
              aria-label="Log Points"
            >
              Log Points
            </button>
          </div>
        </div>

        <div className="search-box-wrapper">
          <label htmlFor="staff-search-input" className="search-label">
            Search Members
          </label>
          <input
            id="staff-search-input"
            role="searchbox"
            type="search"
            className="search-input"
            placeholder="Search by name, email, tier, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search members"
          />
        </div>

        <div className="operator-notes-wrapper">
          <label htmlFor="staff-operator-notes" className="search-label">
            Operator Notes
          </label>
          <input
            id="staff-operator-notes"
            type="text"
            className="search-input"
            placeholder="Floor shift notes or station log..."
            value={operatorNotes}
            onChange={(e) => setOperatorNotes(e.target.value)}
            aria-label="Operator notes"
          />
        </div>
      </section>

      <section
        className="members-section"
        aria-labelledby="members-list-heading"
        data-testid="member-list-container"
      >
        <h3 id="members-list-heading" className="sr-only">
          Frequent Flyer Directory
        </h3>

        {filteredMembers.length === 0 ? (
          <div className="empty-state" role="status" aria-live="polite">
            <p className="empty-message">No data found</p>
            <p className="empty-hint">Try adjusting your search query or registering a new member.</p>
          </div>
        ) : (
          <div className="members-grid">
            {filteredMembers.map((member) => (
              <article key={member.id} className="member-card" aria-labelledby={`member-name-${member.id}`}>
                <div className="member-card-header">
                  <div>
                    <span className="member-id">{member.id}</span>
                    <h4 id={`member-name-${member.id}`} className="member-name">
                      {member.name}
                    </h4>
                  </div>
                  <span className={`tier-badge tier-${member.tier.toLowerCase()}`}>
                    {member.tier}
                  </span>
                </div>

                <div className="member-details">
                  <p className="detail-item">
                    <span className="detail-label">Email:</span> {member.email}
                  </p>
                  <p className="detail-item">
                    <span className="detail-label">Points Balance:</span>{' '}
                    <strong>{member.points.toLocaleString()} pts</strong>
                  </p>
                  <p className="detail-item">
                    <span className="detail-label">Joined:</span> {member.joinDate}
                  </p>
                </div>

                <div className="member-card-actions">
                  <button
                    type="button"
                    className="btn btn-small btn-secondary"
                    onClick={() => handleEdit(member)}
                    aria-label={`Edit Member ${member.name}`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-small btn-primary"
                    onClick={() => handlePoints(member)}
                    aria-label={`Adjust points for ${member.name}`}
                  >
                    Adjust Points
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <MemberFormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedMember(null);
        }}
        memberToEdit={selectedMember}
      />

      <PointsModal
        isOpen={isPointsModalOpen}
        onClose={() => {
          setIsPointsModalOpen(false);
          setSelectedMember(null);
        }}
        selectedMember={selectedMember}
      />
    </main>
  );
};
