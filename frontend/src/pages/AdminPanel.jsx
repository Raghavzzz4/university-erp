// frontend/src/pages/AdminPanel.jsx
import { useEffect, useState } from 'react';
import API from '../api';

export default function AdminPanel() {
  const [courses, setCourses] = useState([]);
  const [toast, setToast] = useState(null);

  // Add Course States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newCapacity, setNewCapacity] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState('');
  
  // Clean Time States
  const [day, setDay] = useState('Monday');
  const [time, setTime] = useState('10:00'); 
  const [duration, setDuration] = useState('1');

  // Management Draft States
  const [editingId, setEditingId] = useState(null);
  const [draftCapacity, setDraftCapacity] = useState('');
  const [draftStudents, setDraftStudents] = useState([]);
  const [draftIsFree, setDraftIsFree] = useState(true);
  const [draftPrice, setDraftPrice] = useState('');
  
  // Clean Draft Time States
  const [draftDay, setDraftDay] = useState('Monday');
  const [draftTime, setDraftTime] = useState('10:00'); 
  const [draftDuration, setDraftDuration] = useState('1');

  const [courseToDelete, setCourseToDelete] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data } = await API.get('/courses');
      setCourses(data);
    } catch (err) {
      showToast('Failed to load catalog', 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000); 
  };

  // --- ADD COURSE (SENDING AN OBJECT NOW) ---
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const courseData = { 
        title, 
        description, 
        capacity: Number(newCapacity),
        isFree, 
        price: isFree ? 0 : Number(price), 
        // Send exactly what the database expects: a clean object
        timeSlot: { day, time, duration } 
      };
      
      await API.post('/courses', courseData);
      showToast('Course published successfully!', 'success');
      
      setTitle(''); setDescription(''); setNewCapacity(''); setPrice(''); setIsFree(true);
      setDay('Monday'); setTime('10:00'); setDuration('1');
      fetchCourses();
    } catch (err) { 
      showToast(err.response?.data?.message || 'Error creating course', 'error'); 
    }
  };

  // --- SAVE MODIFICATIONS (SENDING AN OBJECT NOW) ---
  const saveModifications = async (courseId) => {
    try {
      await API.put(`/courses/${courseId}`, {
        capacity: Number(draftCapacity),
        enrolledStudents: draftStudents,
        isFree: draftIsFree, 
        price: draftIsFree ? 0 : Number(draftPrice),
        // Send the clean object
        timeSlot: { day: draftDay, time: draftTime, duration: draftDuration }
      });
      showToast('Modifications saved successfully!', 'success');
      setEditingId(null);
      fetchCourses();
    } catch (err) { showToast('Error saving modifications', 'error'); }
  };

  // --- SIMPLE DATA LOADING (NO MORE STRING PARSERS!) ---
  const toggleManage = (course) => {
    if (editingId === course._id) {
      setEditingId(null);
    } else {
      setEditingId(course._id);
      setDraftCapacity(course.capacity);
      setDraftStudents([...course.enrolledStudents]);
      setDraftIsFree(course.isFree);
      setDraftPrice(course.price === 0 ? '' : course.price);
      
      // Look how clean this is now! Just grab the exact property from the database.
      setDraftDay(course.timeSlot?.day || 'Monday');
      setDraftTime(course.timeSlot?.time || '10:00');
      setDraftDuration(course.timeSlot?.duration || '1');
    }
  };

  const handleRemoveStudentDraft = (studentId) => setDraftStudents(draftStudents.filter(id => id !== studentId));

  const confirmDelete = async () => {
    try {
      await API.delete(`/courses/${courseToDelete}`);
      showToast('Course permanently deleted', 'success');
      setCourseToDelete(null); setEditingId(null); fetchCourses();
    } catch (err) { showToast('Error deleting course', 'error'); }
  };

  return (
    <>
      {toast && <div className="toast-overlay"><div className={`toast-message ${toast.type}`}><span>{toast.message}</span><span style={{cursor: 'pointer', marginLeft: '15px'}} onClick={() => setToast(null)}>×</span></div></div>}

      <nav className="navbar">
        <h2>Admin Management Suite</h2>
        <button className="logout-btn" onClick={() => { localStorage.clear(); window.location.href='/login'; }}>Sign Out</button>
      </nav>

      <div className="container">
        <h3>Live Course Catalog</h3>
        <div className="course-grid">
          {courses.map(course => (
            <div key={course._id} className="course-card">
              <h4 className="course-title">{course.title}</h4>
              
              {/* Display the object properties */}
              <div style={{color: '#cc0000', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '10px', background: '#fff3cd', padding: '5px 10px', borderRadius: '4px', display: 'inline-block'}}>
                🕒 {course.timeSlot?.day || 'TBA'} | {course.timeSlot?.time || '--:--'} ({course.timeSlot?.duration || '0'} hrs)
              </div>

              <div className="course-meta">
                <span>Enrolled: {course.enrolledStudents.length} / {course.capacity}</span>
                <span style={{color: '#003366', fontWeight: 'bold'}}>{course.isFree ? "FREE" : `₹${course.price}`}</span>
              </div>

              <button className="btn-primary" onClick={() => toggleManage(course)}>
                {editingId === course._id ? 'Cancel Management' : 'Manage Course'}
              </button>

              {editingId === course._id && (
                <div className="manage-overlay">
                  <label style={{fontSize: '0.8rem', fontWeight: 'bold', color: '#cc0000'}}>Overwrite Schedule:</label>
                  <div style={{display: 'flex', gap: '5px', marginBottom: '15px'}}>
                    <select className="form-control" value={draftDay} onChange={(e) => setDraftDay(e.target.value)}>
                      <option value="Monday">Monday</option><option value="Tuesday">Tuesday</option><option value="Wednesday">Wednesday</option><option value="Thursday">Thursday</option><option value="Friday">Friday</option><option value="Saturday">Saturday</option>
                    </select>
                    <input type="time" className="form-control" value={draftTime} onChange={(e) => setDraftTime(e.target.value)} />
                    <select className="form-control" value={draftDuration} onChange={(e) => setDraftDuration(e.target.value)}>
                      <option value="1">1 hr</option><option value="1.5">1.5 hrs</option><option value="2">2 hrs</option><option value="3">3 hrs</option>
                    </select>
                  </div>

                  <label style={{fontSize: '0.8rem', fontWeight: 'bold'}}>Course Pricing:</label>
                  <div style={{display: 'flex', gap: '10px', marginBottom: '10px'}}>
                    <select className="form-control" value={draftIsFree ? "free" : "paid"} onChange={(e) => setDraftIsFree(e.target.value === "free")}>
                      <option value="free">Free Course</option><option value="paid">Paid Course</option>
                    </select>
                    {!draftIsFree && <input type="number" className="form-control" placeholder="Price ₹" value={draftPrice} onChange={(e) => setDraftPrice(e.target.value)} min="1" />}
                  </div>

                  <label style={{fontSize: '0.8rem', fontWeight: 'bold'}}>Modify Capacity:</label>
                  <input type="number" className="form-control" value={draftCapacity} onChange={(e) => setDraftCapacity(e.target.value)} style={{marginBottom: '10px'}} />

                  <button className="btn-warning" onClick={() => saveModifications(course._id)}>💾 Save Modifications</button>
                  <button className="btn-secondary" style={{backgroundColor: '#cc0000', width: '100%', marginTop: '5px'}} onClick={() => setCourseToDelete(course._id)}>🗑️ Delete Course</button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="add-course-section">
          <div className="admin-card" style={{margin: 0, width: '100%'}}>
            <h3 style={{textAlign: 'center', color: '#003366'}}>Add New Course</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group"><input type="text" className="form-control" placeholder="Course Title" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
              <div className="form-group"><textarea className="form-control" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required /></div>
              <div className="form-group"><input type="number" className="form-control" placeholder="Max Capacity" value={newCapacity} onChange={(e) => setNewCapacity(e.target.value)} required /></div>

              <label style={{fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>Class Schedule</label>
              <div className="form-group" style={{display: 'flex', gap: '10px'}}>
                <select className="form-control" value={day} onChange={(e) => setDay(e.target.value)}>
                  <option value="Monday">Monday</option><option value="Tuesday">Tuesday</option><option value="Wednesday">Wednesday</option><option value="Thursday">Thursday</option><option value="Friday">Friday</option><option value="Saturday">Saturday</option>
                </select>
                <input type="time" className="form-control" value={time} onChange={(e) => setTime(e.target.value)} required />
                <select className="form-control" value={duration} onChange={(e) => setDuration(e.target.value)}>
                  <option value="1">1 hr</option><option value="1.5">1.5 hrs</option><option value="2">2 hrs</option><option value="3">3 hrs</option>
                </select>
              </div>

              <label style={{fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '5px'}}>Pricing</label>
              <div className="form-group" style={{display: 'flex', gap: '10px'}}>
                <select className="form-control" value={isFree ? "free" : "paid"} onChange={(e) => setIsFree(e.target.value === "free")}>
                  <option value="free">Free Course</option><option value="paid">Paid Course</option>
                </select>
                {!isFree && <input type="number" className="form-control" placeholder="Price in ₹" value={price} onChange={(e) => setPrice(e.target.value)} required min="1" />}
              </div>

              <button type="submit" className="btn-primary">Create & Publish</button>
            </form>
          </div>
        </div>
      </div>

      {courseToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ color: '#cc0000', marginTop: 0 }}>Warning!</h3>
            <p>Are you sure you want to permanently delete this course?</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setCourseToDelete(null)}>Cancel</button>
              <button className="btn-secondary" style={{ backgroundColor: '#cc0000' }} onClick={confirmDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}