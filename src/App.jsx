import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, update } from 'firebase/database';

// ⚠️ 분대장님의 실제 Config를 여기에 유지하세요!
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

  // 1. 데이터 실시간 동기화 (읽기)
  useEffect(() => {
    const mRef = ref(db, 'members');
    const vRef = ref(db, 'vacations');
    
    onValue(mRef, (snapshot) => {
      const data = snapshot.val();
      setMembers(data ? Object.values(data) : []);
    });
    
    onValue(vRef, (snapshot) => {
      const data = snapshot.val();
      setVacations(data ? Object.values(data) : []);
    });
  }, []);

  // 2. 상태 변경 함수 (클릭 시 실행)
  const handleStatusUpdate = (id, newStatus) => {
    const memberRef = ref(db, `members/${id}`);
    update(memberRef, { status: newStatus });
  };

  const deleteMember = (id) => {
    const memberRef = ref(db, `members/${id}`);
    set(memberRef, null);
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

  // 3. 통계 계산 (총원, 복귀, 미복귀, 잔류)
  const currentMembers = members.filter(m => m.unit === activeTab);
  const stats = {
    total: currentMembers.length,
    returned: currentMembers.filter(m => m.status === '복귀').length,
    notReturned: currentMembers.filter(m => !m.status || m.status === '미복귀').length,
    stay: currentMembers.filter(m => m.status === '잔류').length
  };

  const sortedMembers = [...currentMembers].sort((a, b) => new Date(a.joinDate) - new Date(b.joinDate));

  const styles = {
    container: { maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#f8f9fa', fontFamily: 'sans-serif' },
    header: { background: '#2d391e', padding: '20px', borderRadius: '0 0 25px 25px', color: 'white' },
    statsBar: { display: 'flex', justifyContent: 'space-around', background: 'white', margin: '15px 15px', padding: '15px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' },
    card: { background: 'white', padding: '18px', borderRadius: '20px', margin: '12px 15px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', position: 'relative' },
    statusBtn: (active, color) => ({ flex: 1, padding: '12px 0', borderRadius: '10px', border: 'none', background: active ? color : '#f1f3f5', color: active ? 'white' : '#888', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }),
    fab: { position: 'fixed', bottom: '30px', right: '20px', width: '56px', height: '56px', borderRadius: '28px', background: '#2d391e', color: '#e9ce63', fontSize: '30px', border: 'none', zIndex: 100 }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '15px' }}>
          <button style={{ background: 'none', border: 'none', color: view === 'main' ? '#e9ce63' : '#7d8a6b', fontWeight: 'bold', borderBottom: view === 'main' ? '2px solid #e9ce63' : 'none' }} onClick={() => setView('main')}>부대 관리</button>
          <button style={{ background: 'none', border: 'none', color: view === 'calendar' ? '#e9ce63' : '#7d8a6b', fontWeight: 'bold', borderBottom: view === 'calendar' ? '2px solid #e9ce63' : 'none' }} onClick={() => setView('calendar')}>휴가 일정</button>
        </div>
        
        {view === 'main' && (
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select style={{ flex: 1, padding: '10px', borderRadius: '10px' }} value={newUnit} onChange={e => setNewUnit(e.target.value)}>
                <option>HHC</option><option>Alpha</option><option>Bravo</option><option>Charlie</option>
              </select>
              <input type="date" style={{ flex: 1.5, padding: '10px', borderRadius: '10px' }} value={newJoinDate} onChange={e => setNewJoinDate(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input style={{ flex: 4, padding: '10px', borderRadius: '10px', border: 'none' }} placeholder="이름 입력" value={newName} onChange={e => setNewName(e.target.value)} />
              <button style={{ flex: 1, background: '#e9ce63', border: 'none', borderRadius: '10px', fontWeight: 'bold' }} onClick={() => { if(newName){ const id = Date.now(); set(ref(db, `members/${id}`), { id, name: newName, unit: newUnit, joinDate: newJoinDate, status: '미복귀' }); setNewName(''); } }}>추가</button>
            </div>
          </div>
        )}
      </div>

      {view === 'main' ? (
        <>
          <div style={{ display: 'flex', gap: '8px', padding: '15px 15px 5px', overflowX: 'auto' }}>
            {['HHC', 'Alpha', 'Bravo', 'Charlie'].map(u => (
              <button key={u} style={{ padding: '8px 15px', borderRadius: '12px', border: 'none', background: activeTab === u ? '#2d391e' : 'white', color: activeTab === u ? '#e9ce63' : '#555', whiteSpace: 'nowrap' }} onClick={() => setActiveTab(u)}>{u}</button>
            ))}
          </div>

          <div style={styles.statsBar}>
            <div style={{textAlign:'center'}}><small style={{color:'#999'}}>총원</small><br/><b>{stats.total}</b></div>
            <div style={{textAlign:'center'}}><small style={{color:'#999'}}>복귀</small><br/><b style={{color:'#2ecc71'}}>{stats.returned}</b></div>
            <div style={{textAlign:'center'}}><small style={{color:'#999'}}>미복귀</small><br/><b style={{color:'#e74c3c'}}>{stats.notReturned}</b></div>
            <div style={{textAlign:'center'}}><small style={{color:'#999'}}>잔류</small><br/><b style={{color:'#3498db'}}>{stats.stay}</b></div>
          </div>

          {sortedMembers.map(m => (
            <div key={m.id} style={styles.card}>
              <button style={{ position:'absolute', top:'15px', right:'15px', border:'none', background:'none', color:'#ccc' }} onClick={() => deleteMember(m.id)}>✕</button>
              <div style={{ marginBottom: '10px', fontSize: '18px', fontWeight: 'bold' }}>
                {m.name} <span style={{ fontSize: '12px', color: '#aaa', fontWeight: 'normal' }}>{calculatePercent(m.joinDate)}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: '#eee', borderRadius: '3px', marginBottom: '15px', overflow: 'hidden' }}>
                <div style={{ width: `${calculatePercent(m.joinDate)}%`, height: '100%', background: '#73c088' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={styles.statusBtn(m.status === '복귀', '#2ecc71')} onClick={() => handleStatusUpdate(m.id, '복귀')}>복귀</button>
                <button style={styles.statusBtn(m.status === '미복귀', '#e74c3c')} onClick={() => handleStatusUpdate(m.id, '미복귀')}>미복귀</button>
                <button style={styles.statusBtn(m.status === '잔류', '#3498db')} onClick={() => handleStatusUpdate(m.id, '잔류')}>잔류</button>
              </div>
            </div>
          ))}
        </>
      ) : (
        <div style={{ padding: '15px' }}>
           <div style={{ background: 'white', borderRadius: '20px', padding: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
            <Calendar onClickDay={setSelectedDate} value={selectedDate} formatDay={(l, d) => d.getDate()} />
          </div>
          <button style={styles.fab} onClick={() => setShowModal(true)}>+</button>
        </div>
      )}
    </div>
  );
}