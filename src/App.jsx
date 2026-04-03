import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, update, push, remove } from 'firebase/database';

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

  const me = members.find(m => m.id === myId);
  const isSeniorKatusa = me?.name === "신준섭";

  // ⭐ 시니어 > 짬순 > 가나다순 정렬 로직
  const currentMembers = members
    .filter(m => m.unit === activeTab)
    .sort((a, b) => {
      // 1. 시니어(신준섭) 우선순위
      if (a.name === "신준섭") return -1;
      if (b.name === "신준섭") return 1;

      // 2. 짬순 (입대일 빠른 순)
      if (a.joinDate !== b.joinDate) {
        return new Date(a.joinDate) - new Date(b.joinDate);
      }

      // 3. 가나다순
      return a.name.localeCompare(b.name, 'ko');
    });

  const stats = {
    total: currentMembers.length,
    returned: currentMembers.filter(m => m.status === '복귀').length,
    notReturned: currentMembers.filter(m => m.status === '미복귀').length,
    stay: currentMembers.filter(m => m.status === '잔류').length
  };

  const registerMyDevice = (member) => {
    if (myId) { alert("이미 등록된 기기입니다."); return; }
    if (member.isRegistered) { alert("이미 등록된 사람입니다."); return; }
    if (window.confirm(`[${member.name}] 대원으로 이 기기를 등록하시겠습니까?`)) {
      update(ref(db, `members/${member.id}`), { isRegistered: true });
      localStorage.setItem('katusa_my_id', member.id);
      setMyId(member.id);
    }
  };

  const unregisterDevice = (member) => {
    if (window.confirm("등록을 해제하시겠습니까?")) {
      update(ref(db, `members/${member.id}`), { isRegistered: false });
      localStorage.removeItem('katusa_my_id');
      setMyId(null);
    }
  };

  const resetAllStatus = () => {
    if (!isSeniorKatusa) return;
    if (window.confirm(`${activeTab} 본중 전체 미복귀로 변경 딸깍 기능`)) {
      const updates = {};
      currentMembers.forEach(m => {
        updates[`/members/${m.id}/status`] = '미복귀';
      });
      update(ref(db), updates);
      
      const now = new Date();
      push(ref(db, 'logs'), {
        name: "SYSTEM", unit: activeTab, status: "전체 초기화",
        timeString: now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        dateString: now.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }),
        timestamp: now.getTime()
      });
      alert("전원 미복귀로 처리 완료했습니다 주인님");
    }
  };

  const deleteMember = (member) => {
    if (window.confirm(`[${member.name}] 전역했으니깐 이제 내보낼려고?`)) {
      remove(ref(db, `members/${member.id}`));
    }
  };

  const clearLogs = () => {
    if (window.confirm("모든 활동 로그를 삭제하시겠습니까?")) {
      remove(ref(db, 'logs'));
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
    // ⭐ 시니어이거나 본인이면 수정 가능
    if (member.id !== myId && !isSeniorKatusa) { alert("본인 상태만 수정 가능합니다."); return; }
    
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
      id, name: newName, unit: newUnit, joinDate: newJoinDate, status: '미복귀', isRegistered: false 
    });
    setNewName('');
  };

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#f8f9fa', paddingBottom: '80px', fontFamily: 'sans-serif' }}>
      
      <style>{`
        @keyframes shine {
          0% { left: -100%; }
          50% { left: 100%; }
          100% { left: 100%; }
        }
        .senior-name {
          background: linear-gradient(to right, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 900 !important;
          text-shadow: 0 0 5px rgba(233, 206, 99, 0.2);
        }
        .senior-badge {
          position: relative;
          background: #000;
          color: #e9ce63;
          font-size: 10px;
          padding: 3px 8px;
          border-radius: 4px;
          font-weight: 900;
          overflow: hidden;
          box-shadow: 0 0 8px rgba(233, 206, 99, 0.4);
          border: 1px solid #e9ce63;
          display: inline-flex;
          align-items: center;
        }
        .senior-badge::after {
          content: "";
          position: absolute;
          top: 0; left: -100%;
          width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          transform: skewX(-20deg);
          animation: shine 3s infinite;
        }
      `}</style>

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
              <input style={{ flex: 3, padding: '12px', borderRadius: '10px', border: 'none' }} placeholder="이름 입력" value={newName} onChange={e => setNewName(e.target.value)} />
              <button style={{ flex: 1, background: '#e9ce63', border: 'none', borderRadius: '10px', fontWeight: 'bold', color: '#3b472e' }} onClick={addMember}>추가</button>
           </div>
        </div>

        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
          <button style={{ flex: 1, padding: '14px 0', border: 'none', background: view === 'main' ? '#e9ce63' : 'transparent', color: view === 'main' ? '#3b472e' : 'white', fontWeight: 'bold' }} onClick={() => setView('main')}>부대 관리</button>
          <button style={{ flex: 1, padding: '14px 0', border: 'none', background: view === 'logs' ? '#e9ce63' : 'transparent', color: view === 'logs' ? '#3b472e' : 'white', fontWeight: 'bold' }} onClick={() => setView('logs')}>로그 기록</button>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', margin: '0 15px 15px', background: 'white', padding: '20px', borderRadius: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', textAlign: 'center' }}>
            <div><div style={{ fontSize: '11px', color: '#aaa', marginBottom: '5px' }}>총원</div><div style={{ fontSize: '17px', fontWeight: 'bold', color: '#3b472e' }}>{stats.total}</div></div>
            <div><div style={{ fontSize: '11px', color: '#aaa', marginBottom: '5px' }}>복귀</div><div style={{ fontSize: '17px', fontWeight: 'bold', color: '#2ecc71' }}>{stats.returned}</div></div>
            <div><div style={{ fontSize: '11px', color: '#aaa', marginBottom: '5px' }}>미복귀</div><div style={{ fontSize: '17px', fontWeight: 'bold', color: '#e74c3c' }}>{stats.notReturned}</div></div>
            <div><div style={{ fontSize: '11px', color: '#aaa', marginBottom: '5px' }}>잔류</div><div style={{ fontSize: '17px', fontWeight: 'bold', color: '#3498db' }}>{stats.stay}</div></div>
          </div>

          {isSeniorKatusa && (
            <div style={{ padding: '0 15px 15px' }}>
              <button onClick={resetAllStatus} style={{ width: '100%', padding: '12px', borderRadius: '15px', border: '1px solid #e74c3c', background: 'white', color: '#e74c3c', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
                🔄 {activeTab} 전체 미복귀로 초기화
              </button>
            </div>
          )}

          {currentMembers.map(m => {
              const isMe = m.id === myId;
              const isTargetSenior = m.name === "신준섭";
              const pct = calculatePercent(m.joinDate);
              // ⭐ 시니어는 본인이 아니어도 버튼 활성화되도록 설정
              const canEdit = isMe || isSeniorKatusa;

              return (
                <div key={m.id} style={{ background: 'white', padding: '20px', borderRadius: '25px', margin: '0 15px 15px', border: isMe ? '2px solid #e9ce63' : 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', position: 'relative' }}>
                  
                  {isSeniorKatusa && !isMe && (
                    <button onClick={() => deleteMember(m)} style={{ position: 'absolute', top: '18px', right: '18px', border: 'none', background: 'none', color: '#ddd', cursor: 'pointer', fontSize: '18px' }}>✕</button>
                  )}

                  <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div onClick={() => registerMyDevice(m)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: (!myId && !m.isRegistered) ? 'pointer' : 'default' }}>
                      <span className={isTargetSenior ? "senior-name" : ""} style={{ 
                        color: isTargetSenior ? "transparent" : (m.isRegistered ? '#333' : '#bbb'), 
                        fontWeight: 'bold', fontSize: '19px', lineHeight: '1' 
                      }}>{m.name}</span>
                      {isTargetSenior && <span className="senior-badge">SENIOR</span>}
                      <span style={{ fontSize: '13px', color: '#ccc', lineHeight: '1' }}>{pct}%</span>
                    </div>
                    {isMe && <button onClick={() => unregisterDevice(m)} style={{ background: '#fff1f0', color: '#ff4d4f', border: '1px solid #ffa39e', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', fontWeight: 'bold' }}>해제</button>}
                  </div>

                  <div style={{ width: '100%', height: '7px', background: '#f1f3f5', borderRadius: '4px', marginBottom: '22px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: '#73c088' }} />
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    {['복귀', '미복귀', '잔류'].map(status => (
                      <button key={status} style={{ 
                        flex: 1, padding: '15px 0', borderRadius: '12px', border: 'none', 
                        background: m.status === status ? (status === '복귀' ? '#2ecc71' : status === '잔류' ? '#3498db' : '#e74c3c') : '#f1f3f5', 
                        color: m.status === status ? 'white' : '#adb5bd', fontWeight: 'bold', 
                        opacity: canEdit ? 1 : 0.4 
                      }} onClick={() => handleStatusUpdate(m, status)}>{status}</button>
                    ))}
                  </div>
                </div>
              );
          })}
        </>
      ) : (
        <div style={{ padding: '20px' }}>
          {view === 'logs' ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{ margin: 0, color: '#555' }}>활동 로그</h4>
                {isSeniorKatusa && <button onClick={clearLogs} style={{ color: '#ff4d4f', border: 'none', background: 'none', fontSize: '12px', cursor: 'pointer' }}>로그 초기화</button>}
              </div>
              {logs.map(log => (
                <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'white', borderRadius: '15px', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#aaa' }}>{log.dateString} {log.timeString}</div>
                    <b style={{ fontSize: '16px' }}>{log.name}</b>
                  </div>
                  <div style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', color: 'white', background: log.status === '복귀' ? '#2ecc71' : log.status === '잔류' ? '#3498db' : '#e74c3c' }}>{log.status}</div>
                </div>
              ))}
            </div>
          ) : <Calendar onClickDay={setSelectedDate} value={selectedDate} />}
        </div>
      )}
    </div>
  );
}