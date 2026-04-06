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
  const [reasons, setReasons] = useState({}); // 외출 사유 저장용
  const [view, setView] = useState('main'); 
  const [activeTab, setActiveTab] = useState('HHC');
  
  const [myId, setMyId] = useState(localStorage.getItem('katusa_my_id'));

  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('HHC');
  const [newJoinDate, setNewJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [outReason, setOutReason] = useState(''); // 입력 중인 사유

  useEffect(() => {
    document.title = "Katusa Tracker";

    // 1. 멤버 데이터 & 자동 초기화 체크
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

    // 2. 외출 사유 동기화 (오늘 00시 이후 데이터만)
    onValue(ref(db, 'reasons'), (snapshot) => {
      const data = snapshot.val() || {};
      const todayStart = new Date().setHours(0, 0, 0, 0);
      const filtered = {};
      
      // 오늘 작성된 사유만 필터링해서 state에 저장
      Object.keys(data).forEach(id => {
        if (data[id].timestamp >= todayStart) {
          filtered[id] = data[id];
        }
      });
      setReasons(filtered);
    });

    // 3. 로그 데이터
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

  const stats = {
    total: currentMembers.length,
    returned: currentMembers.filter(m => m.status === '복귀').length,
    notReturned: currentMembers.filter(m => m.status === '미복귀').length,
    stay: currentMembers.filter(m => m.status === '잔류').length
  };

  // 외출 사유 제출 로직
  const submitReason = () => {
    if (!myId) { alert("먼저 본인 이름을 클릭하여 기기를 등록하세요."); return; }
    if (!outReason.trim()) { alert("사유를 입력해주세요."); return; }

    const now = new Date();
    set(ref(db, `reasons/${myId}`), {
      text: outReason,
      time: now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      timestamp: now.getTime()
    }).then(() => {
      setOutReason('');
      alert("외출 사유가 등록되었습니다.");
    });
  };

  const addMember = () => {
    const trimmedName = newName.trim();
    if (!trimmedName) { alert("이름을 입력해 주세요."); return; }
    const isDuplicate = members.some(m => m.name === trimmedName);
    if (isDuplicate) { alert(`[${trimmedName}]님은 이미 등록되어 있습니다.`); return; }

    const id = Date.now().toString();
    set(ref(db, `members/${id}`), { 
      id, name: trimmedName, unit: newUnit, joinDate: newJoinDate, status: '미복귀', isRegistered: false 
    }).then(() => setNewName(''));
  };

  const registerMyDevice = (member) => {
    if (myId) { 
      const currentMe = members.find(m => m.id === myId);
      alert(`이미 [${currentMe?.name || '다른 사람'}]으로 등록된 기기입니다.\n'해제'를 먼저 해주세요.`);
      return; 
    }
    if (member.isRegistered) { alert("이미 다른 기기에서 등록된 사람입니다."); return; }
    if (window.confirm(`[${member.name}]님으로 이 기기를 등록 하시겠습니까?`)) {
      update(ref(db, `members/${member.id}`), { isRegistered: true });
      localStorage.setItem('katusa_my_id', member.id);
      setMyId(member.id);
    }
  };

  const unregisterDevice = (member) => {
    if (window.confirm("기기 등록을 해제하시겠습니까?")) {
      update(ref(db, `members/${member.id}`), { isRegistered: false });
      localStorage.removeItem('katusa_my_id');
      setMyId(null);
    }
  };

  const handleStatusUpdate = (member, newStatus) => {
    if (member.id !== myId && !isSeniorKatusa) { alert("대리 수정은 금지되어 있습니다."); return; }
    update(ref(db, `members/${member.id}`), { status: newStatus });
    const now = new Date();
    push(ref(db, 'logs'), {
      name: member.name, unit: member.unit, status: newStatus,
      timeString: now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      dateString: now.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }),
      timestamp: now.getTime()
    });
  };

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#f8f9fa', paddingBottom: '80px', fontFamily: 'sans-serif' }}>
      
      <style>{`
        @keyframes shine { 0% { left: -100%; } 50% { left: 100%; } 100% { left: 100%; } }
        .senior-card { background: #1a1a1a !important; border: 2px solid #e9ce63 !important; }
        .senior-name { background: linear-gradient(to right, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 900 !important; }
        .senior-badge { position: relative; background: #e9ce63; color: #000; font-size: 10px; padding: 3px 8px; border-radius: 4px; font-weight: 900; overflow: hidden; display: inline-flex; align-items: center; }
        .senior-badge::after { content: ""; position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent); transform: skewX(-20deg); animation: shine 3s infinite; }
      `}</style>

      {/* 헤더 섹션 */}
      <div style={{ background: '#3b472e', padding: '30px 20px 20px 20px', borderRadius: '0 0 30px 30px', color: 'white', textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 15px 0', color: '#e9ce63', fontSize: '28px', fontWeight: '900' }}>Katusa Tracker</h2>
        
        {/* 1. 외출 사유 작성 섹션 (본인 등록 시에만 노출) */}
        {myId && (
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '15px', marginBottom: '15px', border: '1px solid rgba(233,206,99,0.3)' }}>
            <div style={{ fontSize: '12px', marginBottom: '8px', textAlign: 'left', color: '#e9ce63' }}>오늘의 외출 보고 ({me?.name})</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', fontSize: '14px' }} 
                placeholder="사유를 입력하세요 (예: 병원)" 
                value={outReason}
                onChange={e => setOutReason(e.target.value)}
              />
              <button 
                style={{ background: '#e9ce63', color: '#3b472e', border: 'none', borderRadius: '8px', padding: '0 15px', fontWeight: 'bold' }}
                onClick={submitReason}
              >보고</button>
            </div>
          </div>
        )}

        {/* 인원 추가 폼 */}
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
        
        {/* 탭 메뉴 */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', overflow: 'hidden' }}>
          <button style={{ flex: 1, padding: '14px 0', border: 'none', background: view === 'main' ? '#e9ce63' : 'transparent', color: view === 'main' ? '#3b472e' : 'white', fontWeight: 'bold' }} onClick={() => setView('main')}>부대 관리</button>
          <button style={{ flex: 1, padding: '14px 0', border: 'none', background: view === 'logs' ? '#e9ce63' : 'transparent', color: view === 'logs' ? '#3b472e' : 'white', fontWeight: 'bold' }} onClick={() => setView('logs')}>로그 기록</button>
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
            <div><div style={{ fontSize: '11px', color: '#aaa' }}>총원</div><div style={{ fontSize: '17px', fontWeight: 'bold', color: '#3b472e' }}>{stats.total}</div></div>
            <div><div style={{ fontSize: '11px', color: '#aaa' }}>복귀</div><div style={{ fontSize: '17px', fontWeight: 'bold', color: '#2ecc71' }}>{stats.returned}</div></div>
            <div><div style={{ fontSize: '11px', color: '#aaa' }}>미복귀</div><div style={{ fontSize: '17px', fontWeight: 'bold', color: '#e74c3c' }}>{stats.notReturned}</div></div>
            <div><div style={{ fontSize: '11px', color: '#aaa' }}>잔류</div><div style={{ fontSize: '17px', fontWeight: 'bold', color: '#3498db' }}>{stats.stay}</div></div>
          </div>

          {currentMembers.map(m => {
              const isMe = m.id === myId;
              const isTargetSenior = m.name === "신준섭";
              const pct = calculatePercent(m.joinDate);
              const canEdit = isMe || isSeniorKatusa;
              const myReason = reasons[m.id]; // 해당 인원의 외출 사유

              return (
                <div key={m.id} className={isTargetSenior ? "senior-card" : ""} style={{ 
                  background: 'white', padding: '20px', borderRadius: '25px', margin: '0 15px 15px', 
                  border: isMe ? '2px solid #e9ce63' : 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', position: 'relative' 
                }}>
                  {isSeniorKatusa && !isMe && (
                    <button onClick={() => { if(window.confirm(`[${m.name}]님을 삭제하시겠습니까?`)) remove(ref(db, `members/${m.id}`)); }} style={{ position: 'absolute', top: '18px', right: '18px', border: 'none', background: 'none', color: isTargetSenior ? '#555' : '#ddd', fontSize: '18px' }}>✕</button>
                  )}
                  <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div onClick={() => registerMyDevice(m)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <span className={isTargetSenior ? "senior-name" : ""} style={{ color: isTargetSenior ? "transparent" : (m.isRegistered ? '#333' : '#bbb'), fontWeight: 'bold', fontSize: '19px' }}>{m.name}</span>
                      {isTargetSenior && <span className="senior-badge">SENIOR</span>}
                      <span style={{ fontSize: '13px', color: isTargetSenior ? '#777' : '#ccc' }}>{pct}%</span>
                    </div>
                    {isMe && <button onClick={() => unregisterDevice(m)} style={{ background: isTargetSenior ? '#333' : '#fff1f0', color: '#ff4d4f', border: '1px solid #ffa39e', borderRadius: '6px', padding: '4px 8px', fontSize: '11px' }}>해제</button>}
                  </div>

                  {/* 사유 표시 부분 */}
                  {myReason && (
                    <div style={{ marginBottom: '12px', fontSize: '13px', color: isTargetSenior ? '#e9ce63' : '#555', background: isTargetSenior ? '#2a2a2a' : '#f8f9fa', padding: '8px 12px', borderRadius: '10px' }}>
                      <b>사유:</b> {myReason.text} <span style={{ fontSize: '11px', color: '#aaa', marginLeft: '5px' }}>({myReason.time})</span>
                    </div>
                  )}

                  <div style={{ width: '100%', height: '7px', background: isTargetSenior ? '#333' : '#f1f3f5', borderRadius: '4px', marginBottom: '22px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: isTargetSenior ? 'linear-gradient(90deg, #bf953f, #e9ce63)' : '#73c088' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {['복귀', '미복귀', '잔류'].map(status => (
                      <button key={status} style={{ 
                        flex: 1, padding: '15px 0', borderRadius: '12px', border: 'none', 
                        background: m.status === status ? (status === '복귀' ? '#2ecc71' : status === '잔류' ? '#3498db' : '#e74c3c') : (isTargetSenior ? '#2a2a2a' : '#f1f3f5'), 
                        color: m.status === status ? 'white' : (isTargetSenior ? '#555' : '#adb5bd'), fontWeight: 'bold', 
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