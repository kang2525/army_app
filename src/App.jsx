import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, update, remove } from 'firebase/database';

// ⚠️ 분대장님의 실제 Firebase Config를 꼭 넣어주세요!
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
  const [view, setView] = useState('main'); // 'main' 또는 'calendar'
  const [activeTab, setActiveTab] = useState('HHC');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('HHC');
  const [newJoinDate, setNewJoinDate] = useState(new Date().toISOString().split('T')[0]);

  // 실시간 데이터 동기화
  useEffect(() => {
    const membersRef = ref(db, 'members');
    return onValue(membersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setMembers(Object.keys(data).map(key => ({ ...data[key], id: key })));
      } else {
        setMembers([]);
      }
    });
  }, []);

  const handleStatusUpdate = (id, newStatus) => update(ref(db, `members/${id}`), { status: newStatus });
  
  const addMember = () => {
    if (!newName) return;
    const id = Date.now().toString();
    set(ref(db, `members/${id}`), { id, name: newName, unit: newUnit, joinDate: newJoinDate, status: '미복귀' });
    setNewName('');
  };

  const calculatePercent = (joinDate) => {
    if(!joinDate) return "0";
    const start = new Date(joinDate);
    const end = new Date(start);
    end.setMonth(start.getMonth() + 18);
    const p = ((new Date() - start) / (end - start)) * 100;
    return Math.min(100, Math.max(0, p)).toFixed(1);
  };

  const currentMembers = members.filter(m => m.unit === activeTab);
  const stats = {
    total: currentMembers.length,
    returned: currentMembers.filter(m => m.status === '복귀').length,
    notReturned: currentMembers.filter(m => m.status === '미복귀' || !m.status).length,
    stay: currentMembers.filter(m => m.status === '잔류').length
  };

  const styles = {
    container: { maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#f8f9fa', paddingBottom: '60px' },
    header: { background: '#2d391e', padding: '20px', borderRadius: '0 0 25px 25px', color: 'white', textAlign: 'center' },
    navTabContainer: { display: 'flex', background: '#fff', margin: '0 15px', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginTop: '-20px' },
    navTab: (active) => ({ flex: 1, padding: '15px', border: 'none', background: active ? '#e9ce63' : '#fff', color: active ? '#2d391e' : '#888', fontWeight: 'bold', cursor: 'pointer' }),
    statsBar: { display: 'flex', justifyContent: 'space-around', background: 'white', margin: '15px', padding: '15px', borderRadius: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.03)' },
    card: { background: 'white', padding: '15px', borderRadius: '15px', margin: '10px 15px', boxShadow: '0 2px 5px rgba(0,0,0,0.02)', position: 'relative' },
    statusBtn: (active, color) => ({ flex: 1, padding: '12px 0', borderRadius: '10px', border: 'none', background: active ? color : '#f1f3f5', color: active ? 'white' : '#777', fontWeight: 'bold', cursor: 'pointer' })
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={{ margin: '0 0 25px 0', color: '#e9ce63' }}>Katusa Tracker</h2>
        {view === 'main' && (
          <div style={{ display: 'grid', gap: '10px' }}>
             <div style={{ display: 'flex', gap: '5px' }}>
                <select style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none' }} value={newUnit} onChange={e => setNewUnit(e.target.value)}>
                  {['HHC', 'Alpha', 'Bravo', 'Charlie'].map(u => <option key={u}>{u}</option>)}
                </select>
                <input type="date" style={{ flex: 1.5, padding: '10px', borderRadius: '8px', border: 'none' }} value={newJoinDate} onChange={e => setNewJoinDate(e.target.value)} />
             </div>
             <div style={{ display: 'flex', gap: '5px' }}>
                <input style={{ flex: 3, padding: '10px', borderRadius: '8px', border: 'none' }} placeholder="성명" value={newName} onChange={e => setNewName(e.target.value)} />
                <button style={{ flex: 1, background: '#e9ce63', border: 'none', borderRadius: '8px', fontWeight: 'bold' }} onClick={addMember}>추가</button>
             </div>
          </div>
        )}
      </div>

      {/* 상단 탭 전환 메뉴 */}
      <div style={styles.navTabContainer}>
        <button style={styles.navTab(view === 'main')} onClick={() => setView('main')}>부대 관리</button>
        <button style={styles.navTab(view === 'calendar')} onClick={() => setView('calendar')}>휴가 일정</button>
      </div>

      {view === 'main' ? (
        <>
          <div style={{ display: 'flex', gap: '8px', padding: '15px 15px 0', overflowX: 'auto' }}>
            {['HHC', 'Alpha', 'Bravo', 'Charlie'].map(u => (
              <button key={u} style={{ padding: '8px 15px', borderRadius: '15px', border: 'none', background: activeTab === u ? '#2d391e' : '#fff', color: activeTab === u ? '#e9ce63' : '#555', fontWeight: 'bold', whiteSpace: 'nowrap' }} onClick={() => setActiveTab(u)}>{u}</button>
            ))}
          </div>

          <div style={styles.statsBar}>
            <div style={{textAlign:'center'}}><small>총원</small><br/><b>{stats.total}</b></div>
            <div style={{textAlign:'center'}}><small>복귀</small><br/><b style={{color:'#2ecc71'}}>{stats.returned}</b></div>
            <div style={{textAlign:'center'}}><small>미복귀</small><br/><b style={{color:'#e74c3c'}}>{stats.notReturned}</b></div>
            <div style={{textAlign:'center'}}><small>잔류</small><br/><b style={{color:'#3498db'}}>{stats.stay}</b></div>
          </div>

          {currentMembers.sort((a,b) => new Date(a.joinDate) - new Date(b.joinDate)).map(m => (
            <div key={m.id} style={styles.card}>
              <button style={{ position:'absolute', top:'15px', right:'15px', border:'none', background:'none', color:'#ddd' }} onClick={() => remove(ref(db, `members/${m.id}`))}>✕</button>
              <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>{m.name} <small style={{color:'#999'}}>{calculatePercent(m.joinDate)}%</small></div>
              <div style={{ width: '100%', height: '5px', background: '#eee', borderRadius: '3px', marginBottom: '15px', overflow: 'hidden' }}>
                <div style={{ width: `${calculatePercent(m.joinDate)}%`, height: '100%', background: '#73c088' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={styles.statusBtn(m.status === '복귀', '#2ecc71')} onClick={() => handleStatusUpdate(m.id, '복귀')}>복귀</button>
                <button style={styles.statusBtn(m.status === '미복귀' || !m.status, '#e74c3c')} onClick={() => handleStatusUpdate(m.id, '미복귀')}>미복귀</button>
                <button style={styles.statusBtn(m.status === '잔류', '#3498db')} onClick={() => handleStatusUpdate(m.id, '잔류')}>잔류</button>
              </div>
            </div>
          ))}
        </>
      ) : (
        <div style={{ padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
            <Calendar onClickDay={setSelectedDate} value={selectedDate} />
          </div>
          <p style={{ textAlign: 'center', marginTop: '20px', color: '#888' }}>준비 중인 기능입니다: 날짜별 상세 일정</p>
        </div>
      )}

      {/* 진짜 앱처럼 보이게 하는 모바일 최적화 스타일 */}
      <style>{`
        body { margin: 0; background: #f8f9fa; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
        .react-calendar { width: 100% !important; border: none !important; font-family: sans-serif; }
        .react-calendar__tile--active { background: #2d391e !important; color: #e9ce63 !important; border-radius: 8px; }
      `}</style>
    </div>
  );
}