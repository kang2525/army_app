import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, update, push } from 'firebase/database';

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
  const [logs, setLogs] = useState([]); 
  const [view, setView] = useState('main'); 
  const [activeTab, setActiveTab] = useState('HHC');
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [myId, setMyId] = useState(localStorage.getItem('katusa_my_id'));

  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('HHC');
  const [newJoinDate, setNewJoinDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    onValue(ref(db, 'members'), (snapshot) => {
      const data = snapshot.val();
      setMembers(data ? Object.keys(data).map(key => ({ ...data[key], id: key })) : []);
    });
    onValue(ref(db, 'logs'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const logArr = Object.keys(data).map(key => ({ ...data[key], id: key }));
        setLogs(logArr.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50));
      } else { setLogs([]); }
    });
  }, []);

  const registerMyDevice = (member) => {
    if (myId) {
      alert("이 기기는 이미 등록되어 있습니다. 변경하려면 먼저 등록을 해제하세요.");
      return;
    }
    if (member.isRegistered) {
      alert("해당 대원은 이미 다른 기기에 등록되어 있습니다.");
      return;
    }

    if (window.confirm(`이 기기를 [${member.name}] 대원의 기기로 등록하시겠습니까?`)) {
      update(ref(db, `members/${member.id}`), { isRegistered: true });
      localStorage.setItem('katusa_my_id', member.id);
      setMyId(member.id);
    }
  };

  // ⭐ 기기 등록 해제 함수
  const unregisterDevice = (member) => {
    if (window.confirm(`[${member.name}] 등록을 해제하시겠습니까?\n해제 후에는 다시 본인 이름을 선택해야 합니다.`)) {
      update(ref(db, `members/${member.id}`), { isRegistered: false });
      localStorage.removeItem('katusa_my_id');
      setMyId(null);
      alert("등록이 해제되었습니다.");
    }
  };

  const calculatePercent = (joinDate) => {
    if(!joinDate) return "0";
    const start = new Date(joinDate);
    const end = new Date(start);
    end.setMonth(start.getMonth() + 18);
    const p = ((new Date() - start) / (end - start)) * 100;
    return Math.min(100, Math.max(0, p)).toFixed(1);
  };

  const handleStatusUpdate = (member, newStatus) => {
    if (member.id !== myId) {
      alert("본인의 이름 카드를 클릭하여 기기를 먼저 등록해 주세요.");
      return;
    }
    update(ref(db, `members/${member.id}`), { status: newStatus });
    const now = new Date();
    push(ref(db, 'logs'), {
      name: member.name, unit: member.unit, status: newStatus,
      timeString: now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      dateString: now.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }),
      timestamp: now.getTime()
    });
  };

  const addMember = () => {
    if (!newName) return;
    const id = Date.now().toString();
    set(ref(db, `members/${id}`), { 
      id, name: newName, unit: newUnit, joinDate: newJoinDate, 
      status: '미복귀', isRegistered: false 
    });
    setNewName('');
  };

  const currentMembers = members
    .filter(m => m.unit === activeTab)
    .sort((a, b) => {
      if (a.joinDate !== b.joinDate) return new Date(a.joinDate) - new Date(b.joinDate);
      return a.name.localeCompare(b.name, 'ko');
    });

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#f8f9fa', paddingBottom: '80px', fontFamily: 'sans-serif' }}>
      
      <div style={{ background: '#3b472e', padding: '30px 20px 20px 20px', borderRadius: '0 0 30px 30px', color: 'white', textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 10px 0', color: '#e9ce63', fontSize: '28px', fontWeight: '900' }}>Katusa Tracker</h2>
        
        <div style={{ display: 'grid', gap: '10px', marginBottom: '20px', background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '15px' }}>
           <div style={{ display: 'flex', gap: '8px' }}>
              <select style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none' }} value={newUnit} onChange={e => setNewUnit(e.target.value)}>
                {['HHC', 'Alpha', 'Bravo', 'Charlie'].map(u => <option key={u}>{u}</option>)}
              </select>
              <input type="date" style={{ flex: 1.5, padding: '12px', borderRadius: '10px', border: 'none' }} value={newJoinDate} onChange={e => setNewJoinDate(e.target.value)} />
           </div>
           <div style={{ display: 'flex', gap: '8px' }}>
              <input style={{ flex: 3, padding: '12px', borderRadius: '10px', border: 'none' }} placeholder="대원 성명 입력" value={newName} onChange={e => setNewName(e.target.value)} />
              <button style={{ flex: 1, background: '#e9ce63', border: 'none', borderRadius: '10px', fontWeight: 'bold', color: '#3b472e' }} onClick={addMember}>추가</button>
           </div>
        </div>

        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
          <button style={{ flex: 1, padding: '14px 0', border: 'none', background: view === 'main' ? '#e9ce63' : 'transparent', color: view === 'main' ? '#3b472e' : 'white', fontWeight: 'bold' }} onClick={() => setView('main')}>부대 관리</button>
          <button style={{ flex: 1, padding: '14px 0', border: 'none', background: view === 'logs' ? '#e9ce63' : 'transparent', color: view === 'logs' ? '#3b472e' : 'white', fontWeight: 'bold' }} onClick={() => setView('logs')}>기록 로그</button>
          <button style={{ flex: 1, padding: '14px 0', border: 'none', background: view === 'calendar' ? '#e9ce63' : 'transparent', color: view === 'calendar' ? '#3b472e' : 'white', fontWeight: 'bold' }} onClick={() => setView('calendar')}>휴가 일정</button>
        </div>
      </div>

      {view === 'main' ? (
        <>
          <div style={{ display: 'flex', gap: '10px', padding: '15px 20px', justifyContent: 'center' }}>
            {['HHC', 'Alpha', 'Bravo', 'Charlie'].map(u => (
              <button key={u} style={{ padding: '8px 20px', borderRadius: '20px', border: 'none', background: activeTab === u ? '#3b472e' : '#fff', color: activeTab === u ? '#e9ce63' : '#777', fontWeight: 'bold', fontSize: '13px' }} onClick={() => setActiveTab(u)}>{u}</button>
            ))}
          </div>

          {currentMembers.map(m => {
              const isMe = m.id === myId;
              const pct = calculatePercent(m.joinDate);
              return (
                <div key={m.id} style={{ background: 'white', padding: '20px', borderRadius: '25px', margin: '0 15px 15px', border: isMe ? '2px solid #e9ce63' : 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', position: 'relative' }}>
                  
                  <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div onClick={() => registerMyDevice(m)} style={{ cursor: (!myId && !m.isRegistered) ? 'pointer' : 'default', flex: 1 }}>
                      <span style={{ color: m.isRegistered ? '#333' : '#bbb', fontWeight: 'bold', fontSize: '19px' }}>
                        {m.name} {m.isRegistered && "📱"}
                      </span>
                      <span style={{ fontSize: '13px', color: '#ccc', marginLeft:'10px' }}>{pct}%</span>
                      {isMe && <span style={{ display: 'block', fontSize: '11px', color: '#73c088', marginTop: '2px' }}>나의 기기</span>}
                    </div>

                    {/* ⭐ 기기 해제 버튼: 오직 본인 카드에만 노출 */}
                    {isMe && (
                      <button 
                        onClick={() => unregisterDevice(m)} 
                        style={{ background: '#fff1f0', color: '#ff4d4f', border: '1px solid #ffa39e', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        등록 해제
                      </button>
                    )}
                  </div>

                  <div style={{ width: '100%', height: '7px', background: '#f1f3f5', borderRadius: '4px', marginBottom: '22px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#73c088' }} />
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button style={{ flex: 1, padding: '15px 0', borderRadius: '12px', border: 'none', background: m.status === '복귀' ? '#2ecc71' : '#f1f3f5', color: m.status === '복귀' ? 'white' : '#adb5bd', fontWeight: 'bold', opacity: isMe ? 1 : 0.4 }} onClick={() => handleStatusUpdate(m, '복귀')}>복귀</button>
                    <button style={{ flex: 1, padding: '15px 0', borderRadius: '12px', border: 'none', background: m.status === '미복귀' || !m.status ? '#e74c3c' : '#f1f3f5', color: m.status === '미복귀' || !m.status ? 'white' : '#adb5bd', fontWeight: 'bold', opacity: isMe ? 1 : 0.4 }} onClick={() => handleStatusUpdate(m, '미복귀')}>미복귀</button>
                    <button style={{ flex: 1, padding: '15px 0', borderRadius: '12px', border: 'none', background: m.status === '잔류' ? '#3498db' : '#f1f3f5', color: m.status === '잔류' ? 'white' : '#adb5bd', fontWeight: 'bold', opacity: isMe ? 1 : 0.4 }} onClick={() => handleStatusUpdate(m, '잔류')}>잔류</button>
                  </div>
                </div>
              );
          })}
        </>
      ) : (
        <div style={{ padding: '20px' }}>
          {view === 'logs' ? (
            logs.map(log => (
              <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'white', borderRadius: '15px', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '3px' }}>{log.dateString} {log.timeString}</div>
                  <b style={{ fontSize: '16px', color: '#333' }}>{log.name}</b>
                </div>
                <div style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', color: 'white', background: log.status === '복귀' ? '#2ecc71' : log.status === '잔류' ? '#3498db' : '#e74c3c' }}>
                  {log.status}
                </div>
              </div>
            ))
          ) : <Calendar onClickDay={setSelectedDate} value={selectedDate} />}
        </div>
      )}
    </div>
  );
}