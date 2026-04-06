import { useState, useEffect } from 'react'
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, update, push, remove } from 'firebase/database';

// 1. Firebase 설정
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
  const [reasons, setReasons] = useState({}); 
  const [view, setView] = useState('main'); 
  const [activeTab, setActiveTab] = useState('HHC');
  
  const [myId, setMyId] = useState(localStorage.getItem('katusa_my_id'));

  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('HHC');
  const [newJoinDate, setNewJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [outReason, setOutReason] = useState(''); 

  useEffect(() => {
    document.title = "Katusa Tracker";

    onValue(ref(db, 'members'), (snapshot) => {
      const data = snapshot.val();
      const memberList = data ? Object.keys(data).map(key => ({ ...data[key], id: key })) : [];
      setMembers(memberList);

      const storedId = localStorage.getItem('katusa_my_id');
      if (storedId && !memberList.find(m => m.id === storedId)) {
        localStorage.removeItem('katusa_my_id');
        setMyId(null);
      }
    });

    onValue(ref(db, 'reasons'), (snapshot) => {
      const data = snapshot.val() || {};
      const todayStart = new Date().setHours(0, 0, 0, 0);
      const filtered = {};
      Object.keys(data).forEach(id => {
        if (data[id].timestamp >= todayStart) {
          filtered[id] = data[id];
        }
      });
      setReasons(filtered);
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

  const currentMembers = members
    .filter(m => m.unit === activeTab)
    .sort((a, b) => {
      if (a.name === "신준섭") return -1;
      if (b.name === "신준섭") return 1;
      if (a.joinDate !== b.joinDate) return new Date(a.joinDate) - new Date(b.joinDate);
      return a.name.localeCompare(b.name, 'ko');
    });

  const submitReason = () => {
    if (!myId) { alert("부대 관리 탭에서 본인 이름을 클릭하여 기기를 먼저 등록하세요."); return; }
    if (!outReason.trim()) { alert("사유를 입력해주세요."); return; }

    const now = new Date();
    set(ref(db, `reasons/${myId}`), {
      name: me.name,
      unit: me.unit,
      text: outReason,
      time: now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      timestamp: now.getTime()
    }).then(() => {
      setOutReason('');
      alert("외출 보고가 완료되었습니다.");
    });
  };

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#f8f9fa', paddingBottom: '80px', fontFamily: 'sans-serif' }}>
      
      <style>{`
        @keyframes shine { 0% { left: -100%; } 50% { left: 100%; } 100% { left: 100%; } }
        .senior-card { background: #1a1a1a !important; border: 2px solid #e9ce63 !important; }
        .senior-name { background: linear-gradient(to right, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 900 !important; }
      `}</style>

      {/* 헤더 섹션 */}
      <div style={{ background: '#3b472e', padding: '30px 20px 20px 20px', borderRadius: '0 0 30px 30px', color: 'white', textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#e9ce63', fontSize: '28px', fontWeight: '900' }}>Katusa Tracker</h2>
        
        {/* 탭 메뉴 (3개로 확장) */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
          <button style={{ flex: 1, padding: '14px 0', border: 'none', background: view === 'main' ? '#e9ce63' : 'transparent', color: view === 'main' ? '#3b472e' : 'white', fontWeight: 'bold', fontSize: '13px' }} onClick={() => setView('main')}>부대 관리</button>
          <button style={{ flex: 1, padding: '14px 0', border: 'none', background: view === 'report' ? '#e9ce63' : 'transparent', color: view === 'report' ? '#3b472e' : 'white', fontWeight: 'bold', fontSize: '13px' }} onClick={() => setView('report')}>외출 보고</button>
          <button style={{ flex: 1, padding: '14px 0', border: 'none', background: view === 'logs' ? '#e9ce63' : 'transparent', color: view === 'logs' ? '#3b472e' : 'white', fontWeight: 'bold', fontSize: '13px' }} onClick={() => setView('logs')}>로그 기록</button>
        </div>
      </div>

      {view === 'main' && (
        <>
          {/* 인원 추가 폼 - 부대 관리 탭에서만 노출 */}
          <div style={{ padding: '20px 15px 0' }}>
            <div style={{ display: 'grid', gap: '8px', background: 'white', padding: '15px', borderRadius: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #eee' }} value={newUnit} onChange={e => setNewUnit(e.target.value)}>
                  {['HHC', 'Alpha', 'Bravo', 'Charlie'].map(u => <option key={u}>{u}</option>)}
                </select>
                <input type="date" style={{ flex: 1.5, padding: '10px', borderRadius: '8px', border: '1px solid #eee' }} value={newJoinDate} onChange={e => setNewJoinDate(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input style={{ flex: 3, padding: '10px', borderRadius: '8px', border: '1px solid #eee' }} placeholder="이름 입력" value={newName} onChange={e => setNewName(e.target.value)} />
                <button style={{ flex: 1, background: '#3b472e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }} onClick={() => {
                  const trimmedName = newName.trim();
                  if (!trimmedName) { alert("이름을 입력해 주세요."); return; }
                  const id = Date.now().toString();
                  set(ref(db, `members/${id}`), { id, name: trimmedName, unit: newUnit, joinDate: newJoinDate, status: '미복귀', isRegistered: false }).then(() => setNewName(''));
                }}>추가</button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', padding: '15px 20px', justifyContent: 'center' }}>
            {['HHC', 'Alpha', 'Bravo', 'Charlie'].map(u => (
              <button key={u} style={{ padding: '8px 18px', borderRadius: '20px', border: 'none', background: activeTab === u ? '#3b472e' : '#fff', color: activeTab === u ? '#e9ce63' : '#777', fontWeight: 'bold', fontSize: '12px' }} onClick={() => setActiveTab(u)}>{u}</button>
            ))}
          </div>

          {currentMembers.map(m => {
            const isMe = m.id === myId;
            const pct = calculatePercent(m.joinDate);
            const myReason = reasons[m.id];
            return (
              <div key={m.id} className={m.name === "신준섭" ? "senior-card" : ""} style={{ background: 'white', padding: '20px', borderRadius: '25px', margin: '0 15px 15px', border: isMe ? '2px solid #e9ce63' : 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', position: 'relative' }}>
                <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div onClick={() => {
                    if (myId) return;
                    if (window.confirm(`[${m.name}]님으로 이 기기를 등록 하시겠습니까?`)) {
                      update(ref(db, `members/${m.id}`), { isRegistered: true });
                      localStorage.setItem('katusa_my_id', m.id);
                      setMyId(m.id);
                    }
                  }} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <span className={m.name === "신준섭" ? "senior-name" : ""} style={{ color: m.name === "신준섭" ? "transparent" : (m.isRegistered ? '#333' : '#bbb'), fontWeight: 'bold', fontSize: '18px' }}>{m.name}</span>
                    <span style={{ fontSize: '12px', color: '#ccc' }}>{pct}%</span>
                  </div>
                  {isMe && <button onClick={() => {
                    if (window.confirm("기기 등록을 해제하시겠습니까?")) {
                      update(ref(db, `members/${m.id}`), { isRegistered: false });
                      localStorage.removeItem('katusa_my_id');
                      setMyId(null);
                    }
                  }} style={{ background: '#fff1f0', color: '#ff4d4f', border: '1px solid #ffa39e', borderRadius: '6px', padding: '3px 8px', fontSize: '11px' }}>해제</button>}
                </div>
                {myReason && <div style={{ fontSize: '13px', color: '#666', background: '#f8f9fa', padding: '8px 12px', borderRadius: '10px', marginBottom: '12px' }}>📝 {myReason.text}</div>}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['복귀', '미복귀', '잔류'].map(status => (
                    <button key={status} style={{ flex: 1, padding: '12px 0', borderRadius: '10px', border: 'none', background: m.status === status ? (status === '복귀' ? '#2ecc71' : status === '잔류' ? '#3498db' : '#e74c3c') : '#f1f3f5', color: m.status === status ? 'white' : '#adb5bd', fontWeight: 'bold', opacity: (isMe || isSeniorKatusa) ? 1 : 0.4 }} onClick={() => {
                      if (m.id !== myId && !isSeniorKatusa) return;
                      update(ref(db, `members/${m.id}`), { status });
                    }}>{status}</button>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}

      {view === 'report' && (
        <div style={{ padding: '20px' }}>
          {/* 외출 보고 작성 칸 */}
          <div style={{ background: 'white', padding: '20px', borderRadius: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#3b472e' }}>📍 오늘의 외출 보고 작성</h4>
            {myId ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #eee' }} placeholder="사유를 입력하세요 (예: 개인정비 외출)" value={outReason} onChange={e => setOutReason(e.target.value)} />
                <button style={{ background: '#3b472e', color: 'white', border: 'none', borderRadius: '10px', padding: '0 20px', fontWeight: 'bold' }} onClick={submitReason}>보고</button>
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#ff4d4f', margin: 0 }}>'부대 관리' 탭에서 본인 이름을 클릭해 기기를 먼저 등록해야 작성할 수 있습니다.</p>
            )}
          </div>

          {/* 외출자 명단 */}
          <h4 style={{ margin: '0 0 12px 10px', color: '#777' }}>오늘의 외출자 명단</h4>
          {Object.keys(reasons).length > 0 ? Object.keys(reasons).map(id => (
            <div key={id} style={{ background: 'white', padding: '15px 20px', borderRadius: '20px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '2px' }}>{reasons[id].unit} · {reasons[id].time}</div>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{reasons[id].name}</div>
                <div style={{ fontSize: '14px', color: '#555', marginTop: '4px' }}>{reasons[id].text}</div>
              </div>
              <div style={{ background: '#e9ce63', color: '#3b472e', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>외출중</div>
            </div>
          )) : <div style={{ textAlign: 'center', padding: '40px', color: '#ccc' }}>오늘 보고된 외출 인원이 없습니다.</div>}
        </div>
      )}

      {view === 'logs' && (
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h4 style={{ margin: 0, color: '#555' }}>최근 로그</h4>
            {isSeniorKatusa && <button onClick={() => remove(ref(db, 'logs'))} style={{ color: '#ff4d4f', border: 'none', background: 'none', fontSize: '12px' }}>전체 초기화</button>}
          </div>
          {logs.map(log => (
            <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'white', borderRadius: '15px', marginBottom: '10px' }}>
              <div><div style={{ fontSize: '11px', color: '#aaa' }}>{log.dateString} {log.timeString}</div><b style={{ fontSize: '16px' }}>{log.name}</b></div>
              <div style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', color: 'white', background: log.status === '복귀' ? '#2ecc71' : log.status === '잔류' ? '#3498db' : '#e74c3c' }}>{log.status}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const calculatePercent = (joinDate) => {
  if(!joinDate) return "0";
  const start = new Date(joinDate);
  const end = new Date(start);
  end.setMonth(start.getMonth() + 18);
  const p = ((new Date() - start) / (end - start)) * 100;
  return Math.min(100, Math.max(0, p)).toFixed(1);
};