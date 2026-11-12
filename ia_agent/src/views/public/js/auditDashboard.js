document.addEventListener('DOMContentLoaded', () => {
  const list = document.querySelector('#audit-list');

  if (!list) {
    return;
  }

  const rows = [
    { id: 'audit_001', entity: 'listing', decision: 'approved', confidence: '0.97' },
    { id: 'audit_002', entity: 'chat', decision: 'flagged', confidence: '0.89' },
    { id: 'audit_003', entity: 'moderation', decision: 'rejected', confidence: '0.92' },
  ];

  for (const row of rows) {
    const item = document.createElement('tr');
    item.innerHTML = `
      <td>${row.id}</td>
      <td>${row.entity}</td>
      <td><span class="badge">${row.decision}</span></td>
      <td>${row.confidence}</td>
    `;
    list.appendChild(item);
  }
});
