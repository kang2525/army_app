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
  const [editingId, setEditingId] = useState(null); // 수정 중인 항목 ID
  const [editValue, setEditValue] = useState(''); // 수정 중인 텍스트

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

  // 사유 제출 (새로 등록)
  const submitReason = () => {
    if (!myId) { alert("기기 등록을 먼저 해주세요."); return; }
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
      alert("보고되었습니다.");
    });
  };

  // 사유 수정 저장
  const saveEdit = (id) => {
    if (!editValue.trim()) return;
    update(ref(db, `reasons/${id}`), { text: editValue }).then(() => {
      setEditingId(null);
      setEditValue('');
    });
  };

  // 사유 삭제
  const deleteReason = (id) => {
    if (window.confirm("보고된 외출 사유를 삭제하시겠습니까?")) {
      remove(ref(db, `reasons/${id}`));
    }
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
        
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
          <button style={{ flex: 1, padding: '14px 0', border: 'none', background: view === 'main' ? '#e9ce63' : 'transparent', color: view === 'main' ? '#3b472e' : 'white', fontWeight: 'bold', fontSize: '13px' }} onClick={() => setView('main')}>부대 관리</button>
          <button style={{ flex: 1, padding: '14px 0', border: 'none', background: view === 'report' ? '#e9ce63' : 'transparent', color: view === 'report' ? '#3b472e' : 'white', fontWeight: 'bold', fontSize: '13px' }} onClick={() => setView('report')}>외출 보고</button>
          <button style={{ flex: 1, padding: '14px 0', border: 'none', background: view === 'logs' ? '#e9ce63' : 'transparent', color: view === 'logs' ? '#3b472e' : 'white', fontWeight: 'bold', fontSize: '13px' }} onClick={() => setView('logs')}>로그 기록</button>
        </div>
      </div>

      {view === 'main' && (
        <>
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
                  if (!trimmedName) return;
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
          <div style={{ background: 'white', padding: '20px', borderRadius: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '25px' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#3b472e' }}>📝 외출 사유 작성</h4>
            {myId ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #eee' }} placeholder="사유를 입력하세요" value={outReason} onChange={e => setOutReason(e.target.value)} />
                <button style={{ background: '#3b472e', color: 'white', border: 'none', borderRadius: '10px', padding: '0 20px', fontWeight: 'bold' }} onClick={submitReason}>보고</button>
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#ff4d4f', margin: 0 }}>'부대 관리'에서 기기 등록 후 작성 가능합니다.</p>
            )}
          </div>

          <h4 style={{ margin: '0 0 15px 10px', color: '#777' }}>오늘의 외출 보고 목록</h4>
          {Object.keys(reasons).length > 0 ? Object.keys(reasons).map(id => {
            const isMyPost = id === myId; // 내 글인지 확인
            const isEditing = editingId === id;

            return (
              <div key={id} style={{ background: 'white', padding: '18px 20px', borderRadius: '22px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontWeight: 'bold', fontSize: '17px', color: '#333' }}>{reasons[id].name}</span>
                    <span style={{ fontSize: '11px', color: '#bbb', marginLeft: '8px' }}>{reasons[id].time}</span>
                  </div>
                  {/* 내 글일 때만 수정/삭제 버튼 노출 */}
                  {isMyPost && !isEditing && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => { setEditingId(id); setEditValue(reasons[id].text); }} style={{ border: 'none', background: 'none', color: '#3498db', fontSize: '12px', cursor: 'pointer' }}>수정</button>
                      <button onClick={() => deleteReason(id)} style={{ border: 'none', background: 'none', color: '#e74c3c', fontSize: '12px', cursor: 'pointer' }}>삭제</button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                    <input 
                      style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                    />
                    <button onClick={() => saveEdit(id)} style={{ background: '#2ecc71', color: 'white', border: 'none', borderRadius: '6px', padding: '0 10px', fontSize: '12px' }}>저장</button>
                    <button onClick={() => setEditingId(null)} style={{ background: '#95a5a6', color: 'white', border: 'none', borderRadius: '6px', padding: '0 10px', fontSize: '12px' }}>취소</button>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: '14px', color: '#555', lineHeight: '1.4' }}>{reasons[id].text}</div>
                    <div style={{ fontSize: '11px', color: '#ddd', marginTop: '8px' }}>{reasons[id].unit}</div>
                  </>
                )}
              </div>
            );
          }) : <div style={{ textAlign: 'center', padding: '50px', color: '#ccc' }}>현재 보고된 내역이 없습니다.</div>}
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