// frontend/src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import API from '../api';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('catalog'); 
  const [courses, setCourses] = useState([]);
  const [userData, setUserData] = useState(null); 
  const currentUserId = localStorage.getItem('userId');

  const [toast, setToast] = useState(null);
  const [courseToUnenroll, setCourseToUnenroll] = useState(null); 
  const [paymentCourse, setPaymentCourse] = useState(null); 
  const [paymentStep, setPaymentStep] = useState('idle');

  useEffect(() => {
    fetchCourses();
    fetchUserData();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data } = await API.get('/courses');
      setCourses(data);
    } catch(err) { console.error(err); }
  };

  const fetchUserData = async () => {
    try {
      const { data } = await API.get('/auth/me');
      setUserData(data);
    } catch(err) { console.error(err); }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000); 
  };

  const handleRegister = async (id) => {
    try {
      await API.post(`/courses/${id}/register`);
      showToast("Registered! Complete payment if required.", "success");
      fetchCourses();
    } catch (err) { showToast(err.response?.data?.message || 'Error', 'error'); }
  };

  const confirmUnenroll = async () => {
    try {
      const { data } = await API.post(`/courses/${courseToUnenroll._id}/unenroll`);
      if (data.refundInitiated) {
        showToast("Class Dropped. Refund initiated (5-7 working days).", "success");
      } else {
        showToast("Unenrolled successfully.", "success");
      }
      setCourseToUnenroll(null); 
      fetchCourses(); 
      fetchUserData(); 
    } catch (err) { showToast('Error unenrolling', 'error'); }
  };

  const startPayment = (courseId) => {
    setPaymentCourse(courseId);
    setPaymentStep('processing');
    setTimeout(async () => {
      try {
        await API.post(`/courses/${courseId}/pay`);
        setPaymentStep('success');
        setTimeout(() => {
          setPaymentCourse(null);
          setPaymentStep('idle');
          fetchCourses();
          fetchUserData(); 
        }, 2000);
      } catch (err) {
        showToast("Payment failed", "error");
        setPaymentCourse(null);
      }
    }, 2500);
  };

  // --- HELPER: Safely display the time object or string ---
  const displayTime = (timeSlot) => {
    if (!timeSlot) return 'TBA';
    // If it's the new object format
    if (typeof timeSlot === 'object') {
      return `${timeSlot.day || 'TBA'} | ${timeSlot.time || '--:--'} (${timeSlot.duration || '0'} hrs)`;
    }
    // If it's an old string left over in the database
    return timeSlot;
  };

  // --- TAB 1: CATALOG ---
  const renderCatalog = () => (
    <div className="course-grid">
      {courses.map(course => {
        const isRegistered = course.enrolledStudents.includes(currentUserId);
        const isFull = course.enrolledStudents.length >= course.capacity;
        const hasPaid = course.paidStudents?.includes(currentUserId);

        return (
          <div key={course._id} className="course-card" style={isRegistered ? { borderLeftColor: '#28a745', backgroundColor: '#fafffa' } : {}}>
            <div>
              <h4 className="course-title">{course.title}</h4>
              
              {/* 🛑 THIS IS WHERE THE CRASH HAPPENED! Fixed now using the helper function. */}
              <p style={{color: '#888', fontSize: '0.9rem', margin: '5px 0', fontWeight: 'bold'}}>
                🕒 {displayTime(course.timeSlot)}
              </p>
              
              <p className="course-desc">{course.description}</p>
            </div>
            <div>
              <div className="course-meta">
                <span><strong>Enrolled:</strong> {course.enrolledStudents.length}/{course.capacity}</span>
                <span style={{color: '#003366'}}><strong>{course.isFree ? "FREE" : `₹${course.price}`}</strong></span>
              </div>
              {isRegistered ? (
                <>
                  {course.isFree || hasPaid ? (
                    <button className="btn-success" disabled style={{ backgroundColor: '#17a2b8' }}>✅ Registered {hasPaid && !course.isFree && "& Paid"}</button>
                  ) : (
                    <button className="btn-warning" onClick={() => startPayment(course._id)} style={{ marginBottom: '8px' }}>💳 Pay Fees (₹{course.price})</button>
                  )}
                  <button className="btn-secondary" style={{ backgroundColor: '#cc0000', width: '100%', marginTop: '8px' }} onClick={() => setCourseToUnenroll(course)}>Drop Class</button>
                </>
              ) : (
                <button className="btn-success" onClick={() => handleRegister(course._id)} disabled={isFull} style={isFull ? { backgroundColor: '#ccc' } : {}}>
                  {isFull ? 'Class Full' : 'Register for Class'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  // --- TAB 2: SMART TIMETABLE ---
  const renderTimetable = () => {
    const myCourses = courses.filter(c => 
      c.enrolledStudents.includes(currentUserId) && (c.isFree || c.paidStudents?.includes(currentUserId))
    );

    if (myCourses.length === 0) return <p style={{textAlign: 'center'}}>You have no confirmed classes yet.</p>;

    const schedule = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], TBA: [] };

    myCourses.forEach(course => {
      // Safely check if it's an object, otherwise throw it in TBA
      const classDay = (typeof course.timeSlot === 'object' && course.timeSlot.day) ? course.timeSlot.day : 'TBA';
      
      if (schedule[classDay]) {
        schedule[classDay].push(course);
      } else {
        schedule.TBA.push(course);
      }
    });

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'TBA'];

    return (
      <div className="timetable-container">
        {daysOfWeek.map(day => {
          if (schedule[day].length === 0) return null;

          return (
            <div key={day} className="timetable-day">
              <div className="timetable-day-header">{day}</div>
              <div className="timetable-classes">
                {schedule[day].map(course => (
                  <div key={course._id} className="timetable-class-card">
                    <div className="timetable-time">
                      🕒 {typeof course.timeSlot === 'object' ? `${course.timeSlot.time} (${course.timeSlot.duration} hrs)` : 'TBA'}
                    </div>
                    <div style={{fontWeight: 'bold', color: '#333'}}>{course.title}</div>
                    <div style={{fontSize: '0.8rem', color: '#666'}}>ID: {course._id.slice(-6)}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // --- TAB 3: LEDGER ---
  const renderHistory = () => {
    if (!userData || !userData.paymentHistory || userData.paymentHistory.length === 0) {
      return <p style={{textAlign: 'center'}}>No transaction history found.</p>;
    }

    const sortedHistory = [...userData.paymentHistory].sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
      <table className="history-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Course</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {sortedHistory.map((record, idx) => (
            <tr key={idx}>
              <td>{new Date(record.date).toLocaleDateString()}</td>
              <td>{record.courseTitle}</td>
              <td style={{fontWeight: 'bold', color: record.type === 'refund' ? '#cc0000' : '#28a745'}}>
                {record.type.toUpperCase()}
              </td>
              <td>₹{record.amount}</td>
              <td>
                <span className={`status-badge ${record.type === 'refund' ? 'status-processing' : 'status-completed'}`}>
                  {record.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <>
      {toast && <div className="toast-overlay"><div className={`toast-message ${toast.type}`}><span>{toast.message}</span><span style={{cursor: 'pointer', marginLeft: '15px'}} onClick={() => setToast(null)}>×</span></div></div>}

      <nav className="navbar">
        <h2>Student Portal</h2>
        <button className="logout-btn" onClick={() => { localStorage.clear(); window.location.href='/login'; }}>Sign Out</button>
      </nav>

      <div className="container">
        
        <div className="tab-container">
          <button className={`tab-btn ${activeTab === 'catalog' ? 'active' : ''}`} onClick={() => setActiveTab('catalog')}>Course Catalog</button>
          <button className={`tab-btn ${activeTab === 'timetable' ? 'active' : ''}`} onClick={() => setActiveTab('timetable')}>My Timetable</button>
          <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Payment Ledger</button>
        </div>
        
        {activeTab === 'catalog' && renderCatalog()}
        {activeTab === 'timetable' && renderTimetable()}
        {activeTab === 'history' && renderHistory()}

      </div>

      {courseToUnenroll && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ color: '#003366', marginTop: 0 }}>Confirm Drop</h3>
            <p>Drop <strong>{courseToUnenroll.title}</strong>?</p>
            {courseToUnenroll.paidStudents?.includes(currentUserId) && !courseToUnenroll.isFree && (
              <div style={{ background: '#fff3cd', color: '#856404', padding: '12px', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'left' }}>
                ℹ️ <strong>Refund Notice:</strong> Fee will be refunded to your bank (5-7 days).
              </div>
            )}
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setCourseToUnenroll(null)}>Cancel</button>
              <button className="btn-secondary" style={{ backgroundColor: '#cc0000' }} onClick={confirmUnenroll}>Yes, Drop</button>
            </div>
          </div>
        </div>
      )}

      {paymentCourse && (
        <div className="modal-overlay">
          <div className="modal-content">
            {paymentStep === 'processing' ? (
              <><h3 style={{color: '#003366', marginTop: 0}}>Processing...</h3><div className="spinner"></div></>
            ) : (
              <><div className="success-checkmark">✔</div><h3 style={{color: '#28a745'}}>Payment Successful!</h3></>
            )}
          </div>
        </div>
      )}
    </>
  );
}