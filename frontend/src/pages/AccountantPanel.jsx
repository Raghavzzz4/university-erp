// frontend/src/pages/AccountantPanel.jsx
import { useEffect, useState } from 'react';
import API from '../api';

export default function AccountantPanel() {
  const [transactions, setTransactions] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    try {
      const { data } = await API.get('/auth/transactions');
      setTransactions(data.transactions);
      setTotalBalance(data.totalBalance);
    } catch (err) {
      console.error("Failed to fetch transactions", err);
    }
  };

  return (
    <>
      <nav className="navbar" style={{ backgroundColor: '#0f5132' }}> {/* Green nav for finance */}
        <h2>Finance Department</h2>
        <button className="logout-btn" onClick={() => { localStorage.clear(); window.location.href='/login'; }}>Sign Out</button>
      </nav>

      <div className="container">
        
        {/* BANK BALANCE WIDGET */}
        <div style={{
          background: 'linear-gradient(135deg, #198754, #146c43)', 
          color: 'white', 
          padding: '2rem', 
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', opacity: 0.9 }}>Total University Bank Balance</h3>
          <h1 style={{ margin: 0, fontSize: '3rem' }}>₹{totalBalance.toLocaleString()}</h1>
        </div>

        {/* MASTER LEDGER TABLE */}
        <h3>Master Transaction Ledger</h3>
        {transactions.length === 0 ? (
          <p style={{textAlign: 'center'}}>No transactions recorded yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="history-table" style={{ width: '100%', whiteSpace: 'nowrap' }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Course</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn, idx) => (
                  <tr key={idx}>
                    <td>{new Date(txn.date).toLocaleDateString()} <br/><small style={{color:'#888'}}>{new Date(txn.date).toLocaleTimeString()}</small></td>
                    <td style={{fontWeight: 'bold'}}>{txn.studentName}</td>
                    <td>{txn.studentEmail}</td>
                    <td>{txn.courseTitle}</td>
                    <td style={{fontWeight: 'bold', color: txn.type === 'refund' ? '#cc0000' : '#28a745'}}>
                      {txn.type.toUpperCase()}
                    </td>
                    <td>₹{txn.amount}</td>
                    <td>
                      <span className={`status-badge ${txn.type === 'refund' ? 'status-processing' : 'status-completed'}`}>
                        {txn.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}