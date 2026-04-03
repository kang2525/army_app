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
      }
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

  const registerMe = (member) => {
    if (myId || member.isRegistered) return;
    if (window.confirm(`'${member.name}' 대원으로 이 기기를 등록하시겠습니까?`)) {
      update(ref(db, `members/${member.id}`), { isRegistered: true });
      localStorage.setItem('katusa_my_id', member.id);
      setMyId(member.id);
    }
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
    set(ref(db, `members/${id}`), { id, name: newName, unit: newUnit, joinDate: newJoinDate, status: '미복귀', isRegistered: false });
    setNewName('');
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
    navTabContainer: { display: 'flex', background: 'rgba(255,255,255,0.1)', margin: '20px 0 10px 0', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)' },
    navTab: (active) => ({ flex: 1, padding: '14px 0', border: 'none', background: active ? '#e9ce63' : 'transparent', color: active ? '#2d391e' : 'rgba(255,255,255,0.6)', fontWeight: 'bold', fontSize: '13px' }),
    statsBar: { display: 'flex', justifyContent: 'space-around', background: 'white', margin: '15px', padding: '15px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
    card: (isMe, isOtherReg) => ({ background: 'white', padding: '18px', borderRadius: '20px', margin: '12px 15px', boxShadow: isMe ? '0 0 15px rgba(233, 206, 99, 0.4)' : '0 2px 5px rgba(0,0,0,0.02)', position: 'relative', border: isMe ? '2px solid #e9ce63' : '2px solid transparent', opacity: (myId && !isMe) || (isOtherReg && !isMe) ? 0.5 : 1 }),
    statusBtn: (active, color) => ({ flex: 1, padding: '14px 0', borderRadius: '10px', border: 'none', background: active ? color : '#f1f3f5', color: active ? 'white' : '#777', fontWeight: 'bold' }),
    progressBar: (pct) => ({ width: `${pct}%`, height: '100%', background: '#73c088', borderRadius: '3px' })
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Katusa Tracker</h2>
        <div style={{ display: 'grid', gap: '10px' }}>
             <div style={{ display: 'flex', gap: '8px' }}>
                <select style={{ flex: 1, padding: '12px', borderRadius: '10px', color: '#333' }} value={newUnit} onChange={e => setNewUnit(e.target.value)}>
                  {['HHC', 'Alpha', 'Bravo', 'Charlie'].map(u => <option key={u}>{u}</option>)}
                </select>
                <input type="date" style={{ flex: 1.5, padding: '12px', borderRadius: '10px', border: 'none' }} value={newJoinDate} onChange={e => setNewJoinDate(e.target.value)} />
             </div>
             <div style={{ display: 'flex', gap: '8px' }}>
                <input style={{ flex: 3, padding: '12px', borderRadius: '10px', border: 'none' }} placeholder="성명" value={newName} onChange={e => setNewName(e.target.value)} />
                <button style={{ flex: 1, background: '#e9ce63', border: 'none', borderRadius: '10px', fontWeight: 'bold', color: '#2d391e' }} onClick={addMember}>추가</button>
             </div>
        </div>
        <div style={styles.navTabContainer}>
          <button style={styles.navTab(view === 'main')} onClick={() => setView('main')}>부대 관리</button>
          <button style={styles.navTab(view === 'logs')} onClick={() => setView('logs')}>기록 로그</button>
          <button style={styles.navTab(view === 'calendar')} onClick={() => setView('calendar')}>휴가 일정</button>
        </div>
      </div>

      {view === 'main' ? (
        <>
          <div style={{ display: 'flex', gap: '8px', padding: '15px 20px 5px', overflowX: 'auto' }}>
            {['HHC', 'Alpha', 'Bravo', 'Charlie'].map(u => (
              <button key={u} style={{ padding: '8px 18px', borderRadius: '20px', border: 'none', background: activeTab === u ? '#2d391e' : '#fff', color: activeTab === u ? '#e9ce63' : '#555', fontWeight: 'bold', whiteSpace: 'nowrap', fontSize: '12px' }} onClick={() => setActiveTab(u)}>{u}</button>
            ))}
          </div>

          <div style={styles.statsBar}>
            <div style={{textAlign:'center'}}><small style={{color:'#999'}}>총원</small><br/><b>{stats.total}</b></div>
            <div style={{textAlign:'center'}}><small style={{color:'#999'}}>복귀</small><br/><b style={{color:'#2ecc71'}}>{stats.returned}</b></div>
            <div style={{textAlign:'center'}}><small style={{color:'#999'}}>미복귀</small><br/><b style={{color:'#e74c3c'}}>{stats.notReturned}</b></div>
            <div style={{textAlign:'center'}}><small style={{color:'#999'}}>잔류</small><br/><b style={{color:'#3498db'}}>{stats.stay}</b></div>
          </div>

          {currentMembers.sort((a, b) => {
              const dateA = new Date(a.joinDate);
              const dateB = new Date(b.joinDate);
              if (dateA - dateB !== 0) return dateA - dateB;
              return a.name.localeCompare(b.name, 'ko');
            }).map(m => {
              const isMe = m.id === myId;
              const isOtherReg = m.isRegistered && !isMe;
              const pct = calculatePercent(m.joinDate);
              return (
                <div key={m.id} style={styles.card(isMe, isOtherReg)} onClick={() => registerMe(m)}>
                  <button style={{ position:'absolute', top:'18px', right:'18px', border:'none', background:'none', color:'#ddd' }} onClick={(e) => { e.stopPropagation(); remove(ref(db, `members/${m.id}`)); }}>✕</button>
                  <div style={{ marginBottom: '12px', fontWeight: 'bold', fontSize: '18px' }}>
                    {m.name} <span style={{ fontSize: '12px', color: '#bbb', fontWeight: 'normal' }}>{pct}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#eee', borderRadius: '3px', marginBottom: '20px', overflow: 'hidden' }}>
                    <div style={styles.progressBar(pct)} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={styles.statusBtn(m.status === '복귀', '#2ecc71')} onClick={(e) => { e.stopPropagation(); handleStatusUpdate(m, '복귀'); }}>복귀</button>
                    <button style={styles.statusBtn(m.status === '미복귀' || !m.status, '#e74c3c')} onClick={(e) => { e.stopPropagation(); handleStatusUpdate(m, '미복귀'); }}>미복귀</button>
                    <button style={styles.statusBtn(m.status === '잔류', '#3498db')} onClick={(e) => { e.stopPropagation(); handleStatusUpdate(m, '잔류'); }}>잔류</button>
                  </div>
                </div>
              );
          })}
        </>
      ) : view === 'logs' ? (
        <div style={{ padding: '10px 0' }}>
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