import React, { useState } from 'react';

interface ApprovalCardProps {
  command: string;
  onApprove: (id: string) => void;
}

export const ApprovalCard: React.FC<ApprovalCardProps> = ({ command, onApprove }) => {
  const [approved, setApproved] = useState(false);

  return (
    <section className="agy-approval-card" data-approved={approved}>
      <h3>Needs Approval</h3>
      <code>{`run: ${command}`}</code>
      <button type="button" onClick={() => { setApproved(true); onApprove(command); }}>
        Approve
      </button>
    </section>
  );
};
