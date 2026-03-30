// 📆 Weekly Planner
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import './Planner.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SLOTS = ['6:00 AM','7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM',
  '12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM',
  '6:00 PM','7:00 PM','8:00 PM','9:00 PM','10:00 PM'];
const SUBJECTS = ['Physics','Chemistry','Biology','Mathematics','English','Revision','Break'];
const COLORS = {
  Physics:'#00d4ff',Chemistry:'#8b5cf6',Biology:'#00ff9d',
  Mathematics:'#ffd700',English:'#ff6b6b',Revision:'#ff9f43',Break:'#636e72',
};

export default function WeeklyPlanner() {
  const { currentUser } = useAuth();
  const [plan, setPlan] = useState({});
  const [editing, setEditing] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('Physics');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadPlan() {
      const snap = await getDoc(doc(db, 'weeklyPlans', currentUser.uid));
      if (snap.exists()) setPlan(snap.data().plan || {});
    }
    loadPlan();
  }, [currentUser]);

  const getCellKey = (day, slot) => `${day}_${slot}`;

  function handleCellClick(day, slot) {
    const key = getCellKey(day, slot);
    if (editing?.day === day && editing?.slot === slot) { setEditing(null); return; }
    setEditing({ day, slot });
    const existing = plan[key];
    if (existing) { setSelectedSubject(existing.subject); setNote(existing.note || ''); }
    else { setSelectedSubject('Physics'); setNote(''); }
  }

  function applyCell() {
    if (!editing) return;
    const key = getCellKey(editing.day, editing.slot);
    setPlan(prev => ({ ...prev, [key]: { subject: selectedSubject, note } }));
    setEditing(null);
  }

  function clearCell(day, slot, e) {
    e.stopPropagation();
    const key = getCellKey(day, slot);
    setPlan(prev => { const n = { ...prev }; delete n[key]; return n; });
  }

  async function savePlan() {
    setSaving(true);
    try {
      await setDoc(doc(db, 'weeklyPlans', currentUser.uid), { plan });
      toast.success('Planner saved!');
    } catch { toast.error('Failed to save'); }
    setSaving(false);
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="planner-page fade-in-up">
      <div className="planner-header">
        <div>
          <h1 className="page-title">WEEKLY PLANNER <span className="jp-small">週間計画</span></h1>
          <p className="page-sub">Plan Mon–Sat. Sunday is your rest day.</p>
        </div>
        <button className="btn-primary" onClick={savePlan} disabled={saving}>
          {saving ? '⏳ SAVING...' : '💾 SAVE PLAN'}
        </button>
      </div>
      <div className="subject-legend">
        {SUBJECTS.map(s => (
          <div key={s} className="legend-item">
            <div className="legend-dot" style={{ background: COLORS[s] }} />
            <span>{s}</span>
          </div>
        ))}
      </div>
      <div className="planner-scroll">
        <div className="planner-grid">
          <div className="planner-cell header-cell time-header" />
          {DAYS.map(day => (
            <div key={day} className={`planner-cell header-cell day-header ${day === today ? 'today' : ''}`}>
              <span className="day-name">{day.slice(0,3).toUpperCase()}</span>
              {day === today && <span className="today-dot" />}
            </div>
          ))}
          {SLOTS.map(slot => (
            <React.Fragment key={slot}>
              <div className="planner-cell time-cell">{slot}</div>
              {DAYS.map(day => {
                const key = getCellKey(day, slot);
                const cell = plan[key];
                const isEditing = editing?.day === day && editing?.slot === slot;
                return (
                  <div
                    key={day}
                    className={`planner-cell data-cell ${cell ? 'filled' : ''} ${isEditing ? 'editing' : ''}`}
                    onClick={() => handleCellClick(day, slot)}
                    style={cell ? { background: `${COLORS[cell.subject]}18`, borderColor: `${COLORS[cell.subject]}44` } : {}}
                  >
                    {cell ? (
                      <>
                        <div className="cell-subject" style={{ color: COLORS[cell.subject] }}>{cell.subject}</div>
                        {cell.note && <div className="cell-note">{cell.note}</div>}
                        <button className="cell-clear" onClick={e => clearCell(day, slot, e)}>×</button>
                      </>
                    ) : (
                      <div className="cell-plus">+</div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      {editing && (
        <div className="edit-popover elite-card">
          <div className="popover-header">
            <span className="popover-title">{editing.day} · {editing.slot}</span>
            <button className="popover-close" onClick={() => setEditing(null)}>×</button>
          </div>
          <div className="popover-subjects">
            {SUBJECTS.map(s => (
              <button
                key={s}
                className={`popover-subject-btn ${selectedSubject === s ? 'active' : ''}`}
                style={selectedSubject === s ? { background: `${COLORS[s]}22`, borderColor: COLORS[s], color: COLORS[s] } : {}}
                onClick={() => setSelectedSubject(s)}
              >{s}</button>
            ))}
          </div>
          <input className="elite-input" placeholder="Add a note..." value={note} onChange={e => setNote(e.target.value)} style={{ marginTop: 10 }} />
          <div className="popover-actions">
            <button className="btn-primary" onClick={applyCell}>APPLY</button>
            <button className="btn-secondary" onClick={() => setEditing(null)}>CANCEL</button>
          </div>
        </div>
      )}
    </div>
  );
}
