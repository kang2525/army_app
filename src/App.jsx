import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, update, remove, push } from 'firebase/database';

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
  const [myId, setMyId] = useState(localStorage.getItem('katusa_my_id') || null);

  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('HHC');
  const [isSenior, setIsSenior] = useState(false); // 시니어 체크 상태
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

  const calculatePercent = (joinDate) => {
    if(!joinDate) return "0";
    const start = new Date(joinDate);
    const end = new Date(start);
    end.setMonth(start.getMonth() + 18);
    const p = ((new Date() - start) / (end - start)) * 100;
    return Math.min(100, Math.max(0, p)).toFixed(1);
  };

  const handleStatusUpdate = (member, newStatus) => {
    if (member.id !== myId) return;
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
      status: '미복귀', isRegistered: false, isSenior: isSenior 
    });
    setNewName('');
    setIsSenior(false);
  };

  // 로그 전체 삭제 기능
  const clearLogs = () => {
    if (window.confirm("모든 활동 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      remove(ref(db, 'logs'));
    }
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
    title: { margin: '0 0 25px 0', color: '#e9ce63', fontSize: '28px', fontWeight: '900' },
    navTab: (active) => ({ flex: 1, padding: '14px 0', border: 'none', background: active ? '#e9ce63' : 'transparent', color: active ? '#2d391e' : 'rgba(255,255,255,0.6)', fontWeight: 'bold', fontSize: '13px' }),
    card: (isMe) => ({ background: 'white', padding: '18px', borderRadius: '20px', margin: '12px 15px', boxShadow: isMe ? '0 0 15px rgba(233, 206, 99, 0.4)' : '0 2px 5px rgba(0,0,0,0.02)', position: 'relative', border: isMe ? '2px solid #e9ce63' : '2px solid transparent' }),
    seniorBadge: { background: '#2d391e', color: '#e9ce63', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', verticalAlign: 'middle', marginLeft: '5px' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Katusa Tracker</h2>
        <div style={{ display: 'grid', gap: '10px' }}>
             <div style={{ display: 'flex', gap: '8px' }}>
                <select style={{ flex: 1, padding: '12px', borderRadius: '10px' }} value={newUnit} onChange={e => setNewUnit(e.target.value)}>
                  {['HHC', 'Alpha', 'Bravo', 'Charlie'].map(u => <option key={u}>{u}</option>)}
                </select>
                <input type="date" style={{ flex: 1.5, padding: '12px', borderRadius: '10px', border: 'none' }} value={newJoinDate} onChange={e => setNewJoinDate(e.target.value)} />
             </div>
             <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input style={{ flex: 3, padding: '12px', borderRadius: '10px', border: 'none' }} placeholder="성명" value={newName} onChange={e => setNewName(e.target.value)} />
                <label style={{ color: '#e9ce63', fontSize: '12px', whiteSpace: 'nowrap', cursor:'pointer' }}>
                   <input type="checkbox" checked={isSenior} onChange={e => setIsSenior(e.target.checked)} /> Senior
                </label>
                <button style={{ flex: 1, background: '#e9ce63', border: 'none', borderRadius: '10px', fontWeight: 'bold', color: '#2d391e', padding:'12px' }} onClick={addMember}>추가</button>
             </div>
        </div>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', marginTop: '20px', borderRadius: '12px', overflow: 'hidden' }}>
          <button style={styles.navTab(view === 'main')} onClick={() => setView('main')}>부대 관리</button>
          <button style={styles.navTab(view === 'logs')} onClick={() => setView('logs')}>기록 로그</button>
          <button style={styles.navTab(view === 'calendar')} onClick={() => setView('calendar')}>휴가 일정</button>
        </div>
      </div>

      {view === 'main' ? (
        <>
          <div style={{ display: 'flex', gap: '8px', padding: '15px 20px 5px', overflowX: 'auto' }}>
            {['HHC', 'Alpha', 'Bravo', 'Charlie'].map(u => (
              <button key={u} style={{ padding: '8px 18px', borderRadius: '20px', border: 'none', background: activeTab === u ? '#2d391e' : '#fff', color: activeTab === u ? '#e9ce63' : '#555', fontWeight: 'bold', fontSize: '12px' }} onClick={() => setActiveTab(u)}>{u}</button>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-around', background: 'white', margin: '15px', padding: '15px', borderRadius: '15px' }}>
            <div style={{textAlign:'center'}}><small>총원</small><br/><b>{stats.total}</b></div>
            <div style={{textAlign:'center'}}><small>복귀</small><br/><b style={{color:'#2ecc71'}}>{stats.returned}</b></div>
            <div style={{textAlign:'center'}}><small>미복귀</small><br/><b style={{color:'#e74c3c'}}>{stats.notReturned}</b></div>
            <div style={{textAlign:'center'}}><small>잔류</small><br/><b style={{color:'#3498db'}}>{stats.stay}</b></div>
          </div>

          {currentMembers.sort((a,b)=>new Date(a.joinDate)-new Date(b.joinDate)).map(m => {
              const isMe = m.id === myId;
              const pct = calculatePercent(m.joinDate);
              return (
                <div key={m.id} style={styles.card(isMe)}>
                  {/* 삭제 버튼: 등록된 본인만 본인 카드 또는 다른 카드 삭제 가능하게 하거나, 관리 편의상 X 노출 */}
                  <button style={{ position:'absolute', top:'18px', right:'18px', border:'none', background:'none', color:'#ddd', cursor:'pointer' }} 
                    onClick={(e) => { e.stopPropagation(); if(window.confirm(`${m.name} 대원을 명단에서 삭제하시겠습니까?`)) remove(ref(db, `members/${m.id}`)); }}>✕</button>
                  
                  <div style={{ marginBottom: '12px', fontWeight: 'bold', fontSize: '18px' }}>
                    {m.name} 
                    {m.isSenior && <span style={styles.seniorBadge}>Senior</span>}
                    <span style={{ fontSize: '12px', color: '#bbb', fontWeight: 'normal', marginLeft:'8px' }}>{pct}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#eee', borderRadius: '3px', marginBottom: '20px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#73c088' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ flex: 1, padding: '14px 0', borderRadius: '10px', border: 'none', background: m.status === '복귀' ? '#2ecc71' : '#f1f3f5', color: m.status === '복귀' ? 'white' : '#777', fontWeight: 'bold' }} onClick={(e) => { e.stopPropagation(); handleStatusUpdate(m, '복귀'); }}>복귀</button>
                    <button style={{ flex: 1, padding: '14px 0', borderRadius: '10px', border: 'none', background: m.status === '미복귀' || !m.status ? '#e74c3c' : '#f1f3f5', color: m.status === '미복귀' || !m.status ? 'white' : '#777', fontWeight: 'bold' }} onClick={(e) => { e.stopPropagation(); handleStatusUpdate(m, '미복귀'); }}>미복귀</button>
                    <button style={{ flex: 1, padding: '14px 0', borderRadius: '10px', border: 'none', background: m.status === '잔류' ? '#3498db' : '#f1f3f5', color: m.status === '잔류' ? 'white' : '#777', fontWeight: 'bold' }} onClick={(e) => { e.stopPropagation(); handleStatusUpdate(m, '잔류'); }}>잔류</button>
                  </div>
                </div>
              );
          })}
        </>
      ) : view === 'logs' ? (
        <div style={{ padding: '10px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px 10px' }}>
            <h4 style={{ color: '#666', margin: 0 }}>최근 기록</h4>
            <button onClick={clearLogs} style={{ background: '#eee', border: 'none', padding: '5px 10px', borderRadius: '5px', fontSize: '11px', color: '#999', cursor: 'pointer' }}>전체 초기화</button>
          </div>
          {logs.map(log => (
            <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #eee', background: 'white' }}>
              <div><b>{log.name}</b> <small style={{ color: '#888' }}>{log.unit}</small></div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: log.status === '복귀' ? '#2ecc71' : log.status === '잔류' ? '#3498db' : '#e74c3c', fontWeight: 'bold' }}>{log.status}</span>
                <br/><small style={{ color: '#bbb' }}>{log.dateString} {log.timeString}</small>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '20px' }}><Calendar onClickDay={setSelectedDate} value={selectedDate} /></div>
      )}
    </div>
  );
}