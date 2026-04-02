import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set } from 'firebase/database';

// ⚠️ 분대장님의 실제 Config를 여기에 다시 넣으세요!
const firebaseConfig = {
  apiKey: "AIzaSyBbqaA06Uq05IFDbWDOMeBOlRy2eqF0OR0E",
  authDomain: "armyapp-f95eb.firebaseapp.com",
  databaseURL: "https://armyapp-f95eb-default-rtdb.asia-southeast1.firebasedatabase.app/", 
  projectId: "armyapp-f95eb",
  storageBucket: "armyapp-f95eb.firebasestorage.app",
  messagingSenderId: "985720950178",
  appId: "1:985720950178:web:4a4c0cc37a21a56d0576fb"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default function App() {
  const [members, setMembers] = useState([]);
  const [vacations, setVacations] = useState([]);
  const [view, setView] = useState('main'); 
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('HHC');

  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('HHC');
  const [newJoinDate, setNewJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [vacationInput, setVacationInput] = useState({ name: '', type: '연가', start: '', end: '' });

  // 데이터 실시간 동기화
  useEffect(() => {
    onValue(ref(db, 'members'), (s) => setMembers(s.val() ? Object.values(s.val()) : []));
    onValue(ref(db, 'vacations'), (s) => setVacations(s.val() ? Object.values(s.val()) : []));
  }, []);

  const syncMembers = (newList) => set(ref(db, 'members'), newList);
  const syncVacations = (newList) => set(ref(db, 'vacations'), newList);

  // 짬순 정렬 + D-Day 계산 로직
  const sortedMembers = [...members]
    .filter(m => m.unit === activeTab)
    .sort((a, b) => new Date(a.joinDate) - new Date(b.joinDate));

  const getDday = (joinDate) => {
    const end = new Date(joinDate);
    end.setMonth(end.getMonth() + 18); // 18개월 복무 기준
    const diff = end - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `D-${days}` : '전역';
  };

  const calculatePercent = (joinDate) => {
    if(!joinDate) return "0";
    const start = new Date(joinDate);
    const today = new Date();
    const end = new Date(start);
    end.setMonth(start.getMonth() + 18);
    const p = ((today - start) / (end - start)) * 100;
    return Math.min(100, Math.max(0, p)).toFixed(1);
  };

  const styles = {
    container: { maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#f1f3f5', fontFamily: 'Pretendard, -apple-system, sans-serif', paddingBottom: '80px' },
    header: { background: '#2d391e', padding: '25px 20px', borderRadius: '0 0 25px 25px', color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    navBtn: (active) => ({ background: active ? '#e9ce63' : 'transparent', border: 'none', color: active ? '#2d391e' : '#aaa', fontWeight: 'bold', padding: '8px 20px', borderRadius: '15px', transition: '0.3s' }),
    card: { background: 'white', padding: '20px', borderRadius: '20px', margin: '12px 15px', boxShadow: '0 8px 16px rgba(0,0,0,0.04)', position: 'relative' },
    statusBtn: (active, color) => ({ flex: 1, padding: '14px 0', borderRadius: '12px', border: 'none', background: active ? color : '#f8f9fa', color: active ? 'white' : '#adb5bd', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }),
    fab: { position: 'fixed', bottom: '30px', right: '20px', width: '60px', height: '60px', borderRadius: '30px', background: '#2d391e', color: '#e9ce63', fontSize: '32px', border: 'none', boxShadow: '0 8px 25px rgba(0,0,0,0.2)', zIndex: 1000 }
  };

  return (
    <div style={styles.container}>
      {/* 고정 상단바 */}
      <div style={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
          <button style={styles.navBtn(view === 'main')} onClick={() => setView('main')}>부대 관리</button>
          <button style={styles.navBtn(view === 'calendar')} onClick={() => setView('calendar')}>휴가 타임트리</button>
        </div>
        
        {view === 'main' && (
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '15px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none' }} placeholder="이름" value={newName} onChange={e => setNewName(e.target.value)} />
              <input type="date" style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none' }} value={newJoinDate} onChange={e => setNewJoinDate(e.target.value)} />
            </div>
            <button style={{ width: '100%', padding: '12px', background: '#e9ce63', color: '#2d391e', border: 'none', borderRadius: '10px', fontWeight: 'bold' }} onClick={() => { if(newName){ syncMembers([...members, { id: Date.now(), name: newName, unit: newUnit, joinDate: newJoinDate, status: '미복귀' }]); setNewName(''); } }}>신규 대원 등록</button>
          </div>
        )}
      </div>

      {view === 'main' ? (
        <div style={{ padding: '10px 0' }}>
          {/* 부대 탭 */}
          <div style={{ display: 'flex', gap: '10px', padding: '10px 20px', overflowX: 'auto' }}>
            {['HHC', 'Alpha', 'Bravo', 'Charlie'].map(u => (
              <button key={u} style={{ padding: '8px 18px', borderRadius: '20px', border: 'none', background: activeTab === u ? '#2d391e' : 'white', color: activeTab === u ? '#e9ce63' : '#555', fontWeight: 'bold' }} onClick={() => setActiveTab(u)}>{u}</button>
            ))}
          </div>

          {/* 대원 카드 (짬순) */}
          {sortedMembers.map((m, idx) => (
            <div key={m.id} style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div>
                  <span style={{ fontSize: '14px', color: '#2d391e', fontWeight: 'bold', background: '#e9ce6333', padding: '2px 8px', borderRadius: '5px', marginRight: '8px' }}>No.{idx + 1}</span>
                  <strong style={{ fontSize: '20px' }}>{m.name}</strong>
                  <span style={{ marginLeft: '10px', color: '#e74c3c', fontWeight: 'bold' }}>{getDday(m.joinDate)}</span>
                </div>
                <button style={{ border: 'none', background: 'none', color: '#dee2e6', fontSize: '20px' }} onClick={() => set(ref(db, `members/${m.id}`), null)}>✕</button>
              </div>
              
              {/* 진행바 */}
              <div style={{ width: '100%', height: '8px', background: '#f1f3f5', borderRadius: '4px', marginBottom: '15px', overflow: 'hidden' }}>
                <div style={{ width: `${calculatePercent(m.joinDate)}%`, height: '100%', background: '#73c088', transition: '0.5s' }} />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={styles.statusBtn(m.status === '복귀', '#2ecc71')} onClick={() => set(ref(db, `members/${m.id}/status`), '복귀')}>복귀</button>
                <button style={styles.statusBtn(m.status === '미복귀', '#e74c3c')} onClick={() => set(ref(db, `members/${m.id}/status`), '미복귀')}>미복귀</button>
                <button style={styles.statusBtn(m.status === '잔류', '#3498db')} onClick={() => set(ref(db, `members/${m.id}/status`), '잔류')}>잔류</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 달력 뷰는 기존과 동일하게 유지 */
        <div style={{ padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '25px', padding: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <Calendar onClickDay={setSelectedDate} value={selectedDate} formatDay={(l, d) => d.getDate()} />
          </div>
          <button style={styles.fab} onClick={() => setShowModal(true)}>+</button>
        </div>
      )}

      <style>{`
        body { margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        .react-calendar { width: 100% !important; border: none !important; }
        .react-calendar__tile--active { background: #2d391e !important; border-radius: 10px; }
        * { user-select: none; -webkit-user-drag: none; }
      `}</style>
    </div>
  );
}