import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, update, remove } from 'firebase/database';

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
  const [view, setView] = useState('main'); 
  const [activeTab, setActiveTab] = useState('HHC');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('HHC');
  const [newJoinDate, setNewJoinDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const membersRef = ref(db, 'members');
    return onValue(membersRef, (snapshot) => {
      const data = snapshot.val();
      setMembers(data ? Object.keys(data).map(key => ({ ...data[key], id: key })) : []);
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
    container: { maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#f8f9fa', paddingBottom: '60px', fontFamily: 'sans-serif' },
    // 1. 헤더: 탭을 안으로 포함하기 위해 패딩 조정
    header: { background: '#2d391e', padding: '30px 20px 20px 20px', borderRadius: '0 0 30px 30px', color: 'white', textAlign: 'center' },
    // 2. 타이틀: 더 두껍게 (FontWeight 900)
    title: { margin: '0 0 25px 0', color: '#e9ce63', fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px' },
    // 3. 탭 메뉴: 헤더 안으로 완전히 이동
    navTabContainer: { 
      display: 'flex', 
      background: 'rgba(255,255,255,0.1)', // 헤더 안에서 살짝 투명하게
      margin: '20px 0 10px 0', 
      borderRadius: '12px', 
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.2)'
    },
    navTab: (active) => ({ 
      flex: 1, padding: '14px', border: 'none', 
      background: active ? '#e9ce63' : 'transparent', 
      color: active ? '#2d391e' : 'rgba(255,255,255,0.6)', 
      fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', transition: '0.3s'
    }),
    statsBar: { display: 'flex', justifyContent: 'space-around', background: 'white', margin: '15px', padding: '15px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
    card: { background: 'white', padding: '18px', borderRadius: '20px', margin: '12px 15px', boxShadow: '0 2px 5px rgba(0,0,0,0.02)', position: 'relative' },
    statusBtn: (active, color) => ({ 
      flex: 1, padding: '14px 0', borderRadius: '10px', border: 'none', 
      background: active ? color : '#f1f3f5', color: active ? 'white' : '#777', 
      fontWeight: 'bold', cursor: 'pointer'
    })
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Katusa Tracker</h2>
        
        {/* 입력 영역 */}
        {view === 'main' && (
          <div style={{ display: 'grid', gap: '10px' }}>
             <div style={{ display: 'flex', gap: '8px' }}>
                <select style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none' }} value={newUnit} onChange={e => setNewUnit(e.target.value)}>
                  {['HHC', 'Alpha', 'Bravo', 'Charlie'].map(u => <option key={u}>{u}</option>)}
                </select>
                <input type="date" style={{ flex: 1.5, padding: '12px', borderRadius: '10px', border: 'none' }} value={newJoinDate} onChange={e => setNewJoinDate(e.target.value)} />
             </div>
             <div style={{ display: 'flex', gap: '8px' }}>
                <input style={{ flex: 3, padding: '12px', borderRadius: '10px', border: 'none' }} placeholder="성명" value={newName} onChange={e => setNewName(e.target.value)} />
                <button style={{ flex: 1, background: '#e9ce63', border: 'none', borderRadius: '10px', fontWeight: 'bold', color: '#2d391e' }} onClick={addMember}>추가</button>
             </div>
          </div>
        )}

        {/* 탭 메뉴 (헤더 안으로 깔끔하게 이동) */}
        <div style={styles.navTabContainer}>
          <button style={styles.navTab(view === 'main')} onClick={() => setView('main')}>부대 관리</button>
          <button style={styles.navTab(view === 'calendar')} onClick={() => setView('calendar')}>휴가 일정</button>
        </div>
      </div>

      {view === 'main' ? (
        <>
          <div style={{ display: 'flex', gap: '8px', padding: '15px 20px 5px', overflowX: 'auto' }}>
            {['HHC', 'Alpha', 'Bravo', 'Charlie'].map(u => (
              <button key={u} style={{ padding: '8px 18px', borderRadius: '20px', border: 'none', background: activeTab === u ? '#2d391e' : '#fff', color: activeTab === u ? '#e9ce63' : '#555', fontWeight: 'bold', whiteSpace: 'nowrap', fontSize: '13px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} onClick={() => setActiveTab(u)}>{u}</button>
            ))}
          </div>

          <div style={styles.statsBar}>
            <div style={{textAlign:'center'}}><small style={{color:'#999'}}>총원</small><br/><b>{stats.total}</b></div>
            <div style={{textAlign:'center'}}><small style={{color:'#999'}}>복귀</small><br/><b style={{color:'#2ecc71'}}>{stats.returned}</b></div>
            <div style={{textAlign:'center'}}><small style={{color:'#999'}}>미복귀</small><br/><b style={{color:'#e74c3c'}}>{stats.notReturned}</b></div>
            <div style={{textAlign:'center'}}><small style={{color:'#999'}}>잔류</small><br/><b style={{color:'#3498db'}}>{stats.stay}</b></div>
          </div>

          {currentMembers.sort((a,b) => new Date(a.joinDate) - new Date(b.joinDate)).map(m => (
            <div key={m.id} style={styles.card}>
              <button style={{ position:'absolute', top:'18px', right:'18px', border:'none', background:'none', color:'#ddd', fontSize: '18px' }} onClick={() => remove(ref(db, `members/${m.id}`))}>✕</button>
              <div style={{ marginBottom: '12px', fontWeight: 'bold', fontSize: '18px' }}>
                {m.name} <span style={{ fontSize: '12px', color: '#bbb', fontWeight: 'normal' }}>{calculatePercent(m.joinDate)}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: '#eee', borderRadius: '3px', marginBottom: '20px', overflow: 'hidden' }}>
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
          <div style={{ background: 'white', borderRadius: '25px', padding: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <Calendar onClickDay={setSelectedDate} value={selectedDate} formatDay={(l, d) => d.getDate()} />
          </div>
          <div style={{ marginTop: '20px', padding: '20px', textAlign: 'center', background: 'white', borderRadius: '15px', color: '#888' }}>
            📅 {selectedDate.toLocaleDateString()} 상세 일정 준비 중
          </div>
        </div>
      )}

      <style>{`
        body { margin: 0; background: #f8f9fa; -webkit-tap-highlight-color: transparent; }
        .react-calendar { width: 100% !important; border: none !important; border-radius: 15px; }
        .react-calendar__tile--active { background: #2d391e !important; color: #e9ce63 !important; border-radius: 10px; }
      `}</style>
    </div>
  );
}