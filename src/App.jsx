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
  const [myId, setMyId] = useState(localStorage.getItem('katusa_my_id') || null);

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

  // 기기 등록 함수 (중복 체크 포함)
  const registerMe = (member) => {
    if (myId) return; // 이미 내가 등록된 상태면 중단

    if (member.isRegistered) {
      alert("이미 다른 기기에 등록된 대원입니다.");
      return;
    }

    if (window.confirm(`'${member.name}' 대원으로 이 기기를 등록하시겠습니까?\n등록 후에는 다른 기기에서 이 이름을 사용할 수 없습니다.`)) {
      // 1. DB에 등록 상태 저장
      update(ref(db, `members/${member.id}`), { isRegistered: true });
      // 2. 내 로컬 스토리지에 저장
      localStorage.setItem('katusa_my_id', member.id);
      setMyId(member.id);
    }
  };

  // 등록 해제
  const resetMe = () => {
    if (window.confirm("기기 등록을 해제하시겠습니까? (다른 사람도 이 이름을 등록할 수 있게 됩니다.)")) {
      // 1. DB 상태 복구
      update(ref(db, `members/${myId}`), { isRegistered: false });
      // 2. 로컬 비우기
      localStorage.removeItem('katusa_my_id');
      setMyId(null);
    }
  };

  const handleStatusUpdate = (id, newStatus) => {
    if (id !== myId) return;
    update(ref(db, `members/${id}`), { status: newStatus });
  };
  
  const addMember = () => {
    if (!newName) return;
    const id = Date.now().toString();
    set(ref(db, `members/${id}`), { id, name: newName, unit: newUnit, joinDate: newJoinDate, status: '미복귀', isRegistered: false });
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
    container: { maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#f8f9fa', paddingBottom: '80px', fontFamily: 'sans-serif' },
    header: { background: '#2d391e', padding: '30px 20px 20px 20px', borderRadius: '0 0 30px 30px', color: 'white', textAlign: 'center' },
    title: { margin: '0 0 25px 0', color: '#e9ce63', fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px' },
    navTabContainer: { 
      display: 'flex', background: 'rgba(255,255,255,0.1)', margin: '20px 0 10px 0', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)'
    },
    navTab: (active) => ({ 
      flex: 1, padding: '14px', border: 'none', background: active ? '#e9ce63' : 'transparent', color: active ? '#2d391e' : 'rgba(255,255,255,0.6)', fontWeight: 'bold', fontSize: '15px'
    }),
    statsBar: { display: 'flex', justifyContent: 'space-around', background: 'white', margin: '15px', padding: '15px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
    card: (isMe, isOtherReg) => ({ 
      background: 'white', padding: '18px', borderRadius: '20px', margin: '12px 15px', 
      boxShadow: isMe ? '0 0 15px rgba(233, 206, 99, 0.4)' : '0 2px 5px rgba(0,0,0,0.02)', 
      position: 'relative', border: isMe ? '2px solid #e9ce63' : '2px solid transparent',
      opacity: (myId && !isMe) || (isOtherReg && !isMe) ? 0.5 : 1, // 내꺼 아니거나 이미 임자 있으면 흐리게
      cursor: (!myId && !isOtherReg) ? 'pointer' : 'default'
    }),
    statusBtn: (active, color, isMe) => ({ 
      flex: 1, padding: '14px 0', borderRadius: '10px', border: 'none', 
      background: active ? color : '#f1f3f5', color: active ? 'white' : '#777', 
      fontWeight: 'bold', cursor: isMe ? 'pointer' : 'default'
    }),
    badge: { fontSize: '11px', padding: '3px 8px', borderRadius: '8px', marginLeft: '8px', fontWeight: 'bold' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Katusa Tracker</h2>
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
        <div style={styles.navTabContainer}>
          <button style={styles.navTab(view === 'main')} onClick={() => setView('main')}>부대 관리</button>
          <button style={styles.navTab(view === 'calendar')} onClick={() => setView('calendar')}>휴가 일정</button>
        </div>
      </div>

      {view === 'main' ? (
        <>
          <div style={{ display: 'flex', gap: '8px', padding: '15px 20px 5px', overflowX: 'auto' }}>
            {['HHC', 'Alpha', 'Bravo', 'Charlie'].map(u => (
              <button key={u} style={{ padding: '8px 18px', borderRadius: '20px', border: 'none', background: activeTab === u ? '#2d391e' : '#fff', color: activeTab === u ? '#e9ce63' : '#555', fontWeight: 'bold', whiteSpace: 'nowrap', fontSize: '13px' }} onClick={() => setActiveTab(u)}>{u}</button>
            ))}
          </div>
          <div style={styles.statsBar}>
            <div style={{textAlign:'center'}}><small style={{color:'#999'}}>총원</small><br/><b>{stats.total}</b></div>
            <div style={{textAlign:'center'}}><small style={{color:'#999'}}>복귀</small><br/><b style={{color:'#2ecc71'}}>{stats.returned}</b></div>
            <div style={{textAlign:'center'}}><small style={{color:'#999'}}>미복귀</small><br/><b style={{color:'#e74c3c'}}>{stats.notReturned}</b></div>
            <div style={{textAlign:'center'}}><small style={{color:'#999'}}>잔류</small><br/><b style={{color:'#3498db'}}>{stats.stay}</b></div>
          </div>

          {!myId && <div style={{textAlign:'center', color:'#e74c3c', fontSize:'13px', margin:'10px 0'}}>⚠️ 본인 이름을 눌러 기기를 등록하세요 (중복 불가)</div>}

          {currentMembers
            .sort((a, b) => {
              const dateA = new Date(a.joinDate);
              const dateB = new Date(b.joinDate);
              if (dateA - dateB !== 0) return dateA - dateB;
              return a.name.localeCompare(b.name, 'ko');
            })
            .map(m => {
              const isMe = m.id === myId;
              const isOtherReg = m.isRegistered && !isMe;
              return (
                <div key={m.id} style={styles.card(isMe, isOtherReg)} onClick={() => registerMe(m)}>
                  <button style={{ position:'absolute', top:'18px', right:'18px', border:'none', background:'none', color:'#ddd', fontSize: '18px' }} onClick={(e) => { e.stopPropagation(); remove(ref(db, `members/${m.id}`)); }}>✕</button>
                  <div style={{ marginBottom: '12px', fontWeight: 'bold', fontSize: '18px' }}>
                    {m.name} 
                    {isMe && <span style={{...styles.badge, background:'#e9ce63', color:'#2d391e'}}>내 기기</span>}
                    {isOtherReg && <span style={{...styles.badge, background:'#eee', color:'#bbb'}}>등록됨</span>}
                    <span style={{ fontSize: '12px', color: '#bbb', fontWeight: 'normal', marginLeft:'8px' }}>{calculatePercent(m.joinDate)}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#eee', borderRadius: '3px', marginBottom: '20px', overflow: 'hidden' }}>
                    <div style={{ width: `${calculatePercent(m.joinDate)}%`, height: '100%', background: '#73c088' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={styles.statusBtn(m.status === '복귀', '#2ecc71', isMe)} onClick={() => handleStatusUpdate(m.id, '복귀')}>복귀</button>
                    <button style={styles.statusBtn(m.status === '미복귀' || !m.status, '#e74c3c', isMe)} onClick={() => handleStatusUpdate(m.id, '미복귀')}>미복귀</button>
                    <button style={styles.statusBtn(m.status === '잔류', '#3498db', isMe)} onClick={() => handleStatusUpdate(m.id, '잔류')}>잔류</button>
                  </div>
                </div>
              );
          })}
          {myId && <div style={{textAlign:'center', fontSize:'12px', color:'#bbb', marginTop:'20px', cursor:'pointer'}} onClick={resetMe}>등록 해제 (기기 변경 시)</div>}
        </>
      ) : (
        <div style={{ padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '25px', padding: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <Calendar onClickDay={setSelectedDate} value={selectedDate} formatDay={(l, d) => d.getDate()} />
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