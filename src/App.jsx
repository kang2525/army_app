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
  // 신준섭 대원의 ID를 로컬에 저장하여 관리자 기기로 인식하게 함
  const [myId, setMyId] = useState(localStorage.getItem('katusa_my_id') || "1775170739870");

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

  // 현재 접속 대원 정보 및 시니어 여부 확인
  const me = members.find(m => m.id === myId);
  const isIAmSenior = me?.isSenior || false;

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

  const clearLogs = () => {
    if (!isIAmSenior) return;
    if (window.confirm("기록을 전부 삭제하시겠습니까?")) remove(ref(db, 'logs'));
  };

  const currentMembers = members.filter(m => m.unit === activeTab);
  const stats = {
    total: currentMembers.length,
    returned: currentMembers.filter(m => m.status === '복귀').length,
    notReturned: currentMembers.filter(m => m.status === '미복귀' || !m.status).length,
    stay: currentMembers.filter(m => m.status === '잔류').length
  };

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#f8f9fa', paddingBottom: '80px', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#2d391e', padding: '30px 20px 20px 20px', borderRadius: '0 0 30px 30px', color: 'white', textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 25px 0', color: '#e9ce63', fontSize: '28px', fontWeight: '900' }}>Katusa Tracker</h2>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden' }}>
          <button style={{ flex: 1, padding: '14px 0', border: 'none', background: view === 'main' ? '#e9ce63' : 'transparent', color: view === 'main' ? '#2d391e' : 'white', fontWeight: 'bold' }} onClick={() => setView('main')}>부대 관리</button>
          <button style={{ flex: 1, padding: '14px 0', border: 'none', background: view === 'logs' ? '#e9ce63' : 'transparent', color: view === 'logs' ? '#2d391e' : 'white', fontWeight: 'bold' }} onClick={() => setView('logs')}>기록 로그</button>
          <button style={{ flex: 1, padding: '14px 0', border: 'none', background: view === 'calendar' ? '#e9ce63' : 'transparent', color: view === 'calendar' ? '#2d391e' : 'white', fontWeight: 'bold' }} onClick={() => setView('calendar')}>휴가 일정</button>
        </div>
      </div>

      {view === 'main' ? (
        <>
          <div style={{ display: 'flex', gap: '8px', padding: '15px 20px 5px', overflowX: 'auto' }}>
            {['HHC', 'Alpha', 'Bravo', 'Charlie'].map(u => (
              <button key={u} style={{ padding: '8px 18px', borderRadius: '20px', border: 'none', background: activeTab === u ? '#2d391e' : '#fff', color: activeTab === u ? '#e9ce63' : '#555', fontWeight: 'bold' }} onClick={() => setActiveTab(u)}>{u}</button>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-around', background: 'white', margin: '15px', padding: '15px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <div style={{textAlign:'center'}}><small style={{color:'#999'}}>총원</small><br/><b>{stats.total}</b></div>
            <div style={{textAlign:'center'}}><small style={{color:'#999'}}>복귀</small><br/><b style={{color:'#2ecc71'}}>{stats.returned}</b></div>
            <div style={{textAlign:'center'}}><small style={{color:'#999'}}>미복귀</small><br/><b style={{color:'#e74c3c'}}>{stats.notReturned}</b></div>
            <div style={{textAlign:'center'}}><small style={{color:'#999'}}>잔류</small><br/><b style={{color:'#3498db'}}>{stats.stay}</b></div>
          </div>

          {currentMembers.map(m => {
              const isMe = m.id === myId;
              const pct = calculatePercent(m.joinDate);
              // 시니어 디자인 적용 (파란색 + 볼드 + 이모티콘)
              const nameStyle = m.isSenior 
                ? { color: '#007bff', fontWeight: '900', fontSize: '19px' } 
                : { color: '#333', fontWeight: 'bold', fontSize: '18px' };

              return (
                <div key={m.id} style={{ background: 'white', padding: '18px', borderRadius: '20px', margin: '12px 15px', position: 'relative', border: isMe ? '2px solid #e9ce63' : 'none' }}>
                  {isIAmSenior && (
                    <button style={{ position:'absolute', top:'18px', right:'18px', border:'none', background:'none', color:'#ddd' }} onClick={() => remove(ref(db, `members/${m.id}`))}>✕</button>
                  )}
                  <div style={{ marginBottom: '12px' }}>
                    <span style={nameStyle}>
                      {m.isSenior && "👑 "}
                      {m.name}
                      {m.isSenior && " ✨"}
                    </span>
                    <span style={{ fontSize: '12px', color: '#bbb', marginLeft:'8px' }}>{pct}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#eee', borderRadius: '3px', marginBottom: '20px' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#73c088', borderRadius: '3px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ flex: 1, padding: '12px 0', borderRadius: '10px', border: 'none', background: m.status === '복귀' ? '#2ecc71' : '#f1f3f5', color: m.status === '복귀' ? 'white' : '#777', fontWeight: 'bold', opacity: isMe ? 1 : 0.5 }} onClick={() => handleStatusUpdate(m, '복귀')}>복귀</button>
                    <button style={{ flex: 1, padding: '12px 0', borderRadius: '10px', border: 'none', background: m.status === '미복귀' || !m.status ? '#e74c3c' : '#f1f3f5', color: m.status === '미복귀' || !m.status ? 'white' : '#777', fontWeight: 'bold', opacity: isMe ? 1 : 0.5 }} onClick={() => handleStatusUpdate(m, '미복귀')}>미복귀</button>
                    <button style={{ flex: 1, padding: '12px 0', borderRadius: '10px', border: 'none', background: m.status === '잔류' ? '#3498db' : '#f1f3f5', color: m.status === '잔류' ? 'white' : '#777', fontWeight: 'bold', opacity: isMe ? 1 : 0.5 }} onClick={() => handleStatusUpdate(m, '잔류')}>잔류</button>
                  </div>
                </div>
              );
          })}
        </>
      ) : view === 'logs' ? (
        <div style={{ padding: '10px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 20px 10px' }}>
            <h4 style={{ color: '#666' }}>최근 기록</h4>
            {isIAmSenior && <button onClick={clearLogs} style={{ color: '#e74c3c', border: 'none', background: 'none', fontSize: '12px' }}>로그 초기화</button>}
          </div>
          {logs.map(log => (
            <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #eee', background: 'white' }}>
              <div><b>{log.name}</b> <small>{log.unit}</small></div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: log.status === '복귀' ? '#2ecc71' : '#e74c3c', fontWeight: 'bold' }}>{log.status}</span><br/>
                <small style={{ color: '#bbb' }}>{log.dateString} {log.timeString}</small>
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