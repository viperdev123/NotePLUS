import React, { useState, useEffect, useMemo } from 'react';
import './Dashboard.css';
import read from '../assets/read.png';
import { Timestamp } from 'firebase/firestore';

function Dashboard() {
  const [showPopup, setShowPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [category, setCategory] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState([]);
  const [editNote, setEditNote] = useState(null);
  const [sortOption, setSortOption] = useState('ByCategory');

  //  ตัวแปร Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [notesPerPage, setNotesPerPage] = useState(6); 

  // กำหนดจำนวนหน้า ต่อ 1 page < desktop = 3 page
  useEffect(() => {
    const updateNotesPerPage = () => {
      if (window.innerWidth >= 1024) {
        setNotesPerPage(6);
      } else {
        setNotesPerPage(3); 
      }
    };
    updateNotesPerPage();
    window.addEventListener('resize', updateNotesPerPage);
    return () => window.removeEventListener('resize', updateNotesPerPage);
  }, []);

  //สีแต่ละ Category
  const categoryColors = {
    'งาน': '#E9E582',
    'ทั่วไป': '#FFD7D5',
    'To-do': '#A1E3F9',
    'เตือนความจำ': '#F2B28C'
  };
  //สีอื่น == ขาว
  const getCategoryColor = (category) => {
    return categoryColors[category] || '#FFFFFF';
  };

  const openPopup = () => setShowPopup(true);
  const closePopup = () => {
    setShowPopup(false);
    setCategory('');
    setNoteTitle('');
    setNoteContent('');
    setError('');
  };

  const openEditPopup = (note) => {
    setEditNote(note);
    setCategory(note.category);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setShowEditPopup(true);
  };
  const closeEditPopup = () => {
    setShowEditPopup(false);
    setEditNote(null);
    setCategory('');
    setNoteTitle('');
    setNoteContent('');
    setError('');
  };
  const saveNote = async () => {
    if (!category || !noteTitle || !noteContent) {
      setError("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    setLoading(true);
    setError('');
    const token = localStorage.getItem("token");
    if (!token) {
      setError("คุณยังไม่ได้เข้าสู่ระบบ");
      setLoading(false);
      return;
    }
    const newNote = {
      category,
      title: noteTitle,
      content: noteContent,
      createdAt: Timestamp.now()
    };
    try {
      // Api บันทึก Note ลง FireStore
      const response = await fetch("http://localhost:5000/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(newNote),
      });
      if (!response.ok) throw new Error("บันทึกไม่สำเร็จ");
      fetchNotes();
      closePopup();
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการบันทึกโน้ต");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const updateNote = async () => {
    if (!editNote || !editNote.noteId) {
      setError("เกิดข้อผิดพลาด: Note ID ไม่ถูกต้อง");
      return;
    }
    setLoading(true);
    setError('');
    const token = localStorage.getItem("token");
    if (!token) {
      setError("คุณยังไม่ได้เข้าสู่ระบบ");
      setLoading(false);
      return;
    }
    const updatedNote = {
      ...editNote,
      category,
      title: noteTitle,
      content: noteContent,
      updatedAt: Timestamp.now() // ✅ บันทึกเวลาแก้ไข
    };
    try {

      // Api อัพเดท Note
      const response = await fetch(`http://localhost:5000/api/notes/${editNote.noteId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(updatedNote),
      });
      if (!response.ok) throw new Error("อัปเดตไม่สำเร็จ");
      fetchNotes();
      closeEditPopup();
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการอัปเดตโน้ต");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("คุณยังไม่ได้เข้าสู่ระบบ");
      return;
    }
    try {
      //Api ดึง Note มาแสดงในหน้า page
      const response = await fetch("http://localhost:5000/api/notes", {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("ไม่สามารถดึงข้อมูลโน้ตได้");
      const data = await response.json();
      setNotes(data);
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการดึงข้อมูลโน้ต");
      console.error(err);
    }
  };

  //ระบบ Sort Note
  const handleSortChange = (event) => {
    setSortOption(event.target.id);
  };

  const sortedNotes = [...notes].sort((a, b) => {
    switch (sortOption) {
      case 'ByCategory':
        return a.category.localeCompare(b.category);
      case 'Bydate':
        const aCreatedDate = a.createdAt
          ? new Date(a.createdAt._seconds * 1000 + a.createdAt._nanoseconds / 1000000)
          : new Date(0); 
        const bCreatedDate = b.createdAt
          ? new Date(b.createdAt._seconds * 1000 + b.createdAt._nanoseconds / 1000000)
          : new Date(0); 
        return bCreatedDate.getTime() - aCreatedDate.getTime(); // เรียงจากใหม่สุดไปเก่า
      case 'Byedit':
        const aUpdatedDate = a.updatedAt
          ? new Date(a.updatedAt.seconds * 1000 + a.updatedAt.nanoseconds / 1000000)
          : new Date(0); 
        const bUpdatedDate = b.updatedAt
          ? new Date(b.updatedAt.seconds * 1000 + b.updatedAt.nanoseconds / 1000000)
          : new Date(0); 
        return bUpdatedDate.getTime() - aUpdatedDate.getTime();
      default:
        return 0;
    }
  });

  // Pagination Logic
  const indexOfLastNote = currentPage * notesPerPage;
  const indexOfFirstNote = indexOfLastNote - notesPerPage;
  const currentNotes = sortedNotes.slice(indexOfFirstNote, indexOfLastNote);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const deleteNote = async (noteId, event) => {
    event.stopPropagation()
    const token = localStorage.getItem("token");
    if (!token) {
      setError("คุณยังไม่ได้เข้าสู่ระบบ");
      return;
    }
    try {
      // Api ลบNote อิงจากNoteId
      const response = await fetch(`http://localhost:5000/api/notes/${noteId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("ลบโน้ตไม่สำเร็จ");

      setNotes(notes.filter(note => note.noteId !== noteId));
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการลบโน้ต");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  return (
    <div className='container-dashboard'>
      <div className='add-note'>
        <div className='btn-add-note'>
          <button className='btn-add' onClick={openPopup}>
            <ion-icon name="add-outline"></ion-icon>
          </button>
          <img src={read} alt="" />
        </div>
      </div>

      <div className='container-Show-note'>
        <div className='top-note'>
          <h1>My Notes</h1>
          <div className="pagination">
            <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}  >
              <ion-icon name="arrow-back-outline"></ion-icon>
            </button>
            <span>{currentPage}</span>
            <button onClick={() => paginate(currentPage + 1)} disabled={currentPage * notesPerPage >= sortedNotes.length} >
              <ion-icon name="arrow-forward-outline"></ion-icon>
            </button>
          </div>
          <div className='sortBy'>
            <span>เรียงตาม :</span>
            <div className='group'>
              <input id='ByCategory' type="radio" checked={sortOption === 'ByCategory'} onChange={handleSortChange} />
              <label htmlFor="ByCategory">หมวดหมู่</label>
            </div>
            <div className='group'>
              <input id='Bydate' type="radio" checked={sortOption === 'Bydate'} onChange={handleSortChange} />
              <label htmlFor="Bydate">วันที่</label>
            </div>
            <div className='group'>
              <input id='Byedit' type="radio" checked={sortOption === 'Byedit'} onChange={handleSortChange} />
              <label htmlFor="Byedit">แก้ไขล่าสุด</label>
            </div>
          </div>
        </div>
        <div className='show-note'>
          {currentNotes.length > 0 ? (
            currentNotes.map((note) => {
              let createdAtDate = note.createdAt
                ? (note.createdAt instanceof Timestamp ? note.createdAt.toDate() : new Date(note.createdAt._seconds * 1000))
                : null;

              let updatedAtDate = note.updatedAt
                ? (note.updatedAt instanceof Timestamp ? note.updatedAt.toDate() : new Date(note.updatedAt.seconds * 1000))
                : null;

              return (
                <div key={note.noteId}
                  className='Note'
                  style={{ backgroundColor: getCategoryColor(note.category) }}
                  onClick={() => openEditPopup(note)}>
                  <div className='title'>{note.title}</div>
                  <div className='category'>หมวดหมู่ : {note.category}</div>
                  <div className='content'>{note.content}</div>
                  <ion-icon
                    name="trash-outline"
                    onClick={(event) => deleteNote(note.noteId, event)}
                  ></ion-icon>

                  <div className='time'>
                    <div className='time-create'>สร้างเมื่อ: {createdAtDate ? createdAtDate.toLocaleString() : "ไม่มีข้อมูล"}</div>
                    <div className='time-edit'>{updatedAtDate ? `แก้ไขล่าสุด: ${updatedAtDate.toLocaleString()}` : "ยังไม่มีการแก้ไข"}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p>No notes found</p>
          )}
        </div>

        {/* Pagination */}

      </div>
      {/* Popup แก้ไข */}
      {showEditPopup && (
        <div className='popup-overlay'>
          <div className='popup-content'>
            <h2>Edit Note</h2>
            {error && <p className="error-message">{error}</p>}
            <div className='label-input'>
              <label htmlFor="title">Title</label>
              <input maxLength='25' type="text" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} />
            </div>
            <div className='label-input'>
              <label htmlFor="content">เนื้อหา</label>
              <textarea maxLength='120' value={noteContent} onChange={(e) => setNoteContent(e.target.value)} />
            </div>
            <div className='popup-buttons'>
              <button onClick={updateNote} className="btn-save" disabled={loading}>{loading ? "Saving..." : "อัพเดท"}</button>
              <button onClick={closeEditPopup} className="btn-cancel">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
      {/* Popup สำหรับสร้างโน้ต */}
      {showPopup && (
        <div className='popup-overlay'>
          <div className='popup-content'>
            <h2>สร้าง Note ใหม่</h2>
            {error && <p className="error-message">{error}</p>}
            <select
              className='category-dropdown'
              value={category}
              onChange={(e) => setCategory(e.target.value)}>
              <option value="">เลือกหมวดหมู่</option>
              <option value="งาน">งาน</option>
              <option value="ทั่วไป">ทั่วไป</option>
              <option value="To-do">To-do</option>
              <option value="เตือนความจำ">เตือนความจำ</option>
            </select>
            <div className='label-input'>
            <label htmlFor="title">Title</label>
            <input
              maxLength='25'
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Title"
            />
            </div>
            <div className='label-input'>
            <label htmlFor="content">เนื้อหา</label>
            <textarea
              maxLength='120'
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Content"
            />
            </div>
            <div className='popup-buttons'>
              <button onClick={saveNote} className="btn-save" disabled={loading}>{loading ? "Saving..." : "บันทึก"}</button>
              <button onClick={closePopup} className="btn-cancel">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
      {/* Popup code remains unchanged */}
    </div>
  );
}

export default Dashboard;
