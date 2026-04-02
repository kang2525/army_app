import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

export default function App() {
  const [members, setMembers] = useState(() => JSON.parse(localStorage.getItem('katusa-members') || '[]'));
  const [vacations, setVacations] = useState(() => JSON.parse(localStorage.getItem('katusa-vacations') || '[]'));
  const [lastResetTimestamp, setLastResetTimestamp] = useState(() => localStorage.getItem('last-reset-time') || Date.now());
  
  const [view, setView] = useState('main'); 
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('HHC');

  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('HHC');
  const [newJoinDate, setNewJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [vacationInput, setVacationInput] = useState({ name: '', type: '연가', start: '', end: '' });

  // --- 24시간 주기 초기화 로직 (유지) ---
  useEffect(() => {
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (now - lastResetTimestamp > twentyFourHours) {
      const resetMembers = members.map(m => ({ ...m, status: '미복귀' }));
      setMembers(resetMembers);
      setLastResetTimestamp(now);
      localStorage.setItem('katusa-members', JSON.stringify(resetMembers));
      localStorage.setItem('last-reset-time', now.toString());
    }
  }, [lastResetTimestamp, members]);

  useEffect(() => {
    localStorage.setItem('katusa-members', JSON.stringify(members));
    localStorage.setItem('katusa-vacations', JSON.stringify(vacations));
  }, [members, vacations]);

  // --- 퍼센티지 계산 (복구) ---
  const calculatePercent = (joinDate) => {
    if (!joinDate) return "0.0";
    const start = new Date(joinDate);
    const today = new Date();
    const end = new Date(start);
    end.setMonth(start.getMonth() + 18);
    if (today < start) return "0.0";
    if (today > end) return "100.0";
    const totalDays = (end - start) / (1000 * 60 * 60 * 24);
    const servedDays = (today - start) / (1000 * 60 * 60 * 24);
    return Math.min(100, Math.max(0, (servedDays / totalDays) * 100)).toFixed(1);
  };

  // --- 중대별 통계 계산 (유지) ---
  const getStats = (unit) => {
    const list = members.filter(m => m.unit === unit);
    return {
      total: list.length,
      returned: list.filter(m => m.status === '복귀').length,
      notReturned: list.filter(m => !m.status || m.status === '미복귀').length,
      stay: list.filter(m => m.status === '잔류').length
    };
  };

  const addMember = () => {
    if (!newName) return;
    setMembers([...members, { id: Date.now(), name: newName, unit: newUnit, joinDate: newJoinDate, status: '미복귀' }]);
    setNewName('');
  };

  const updateStatus = (id, currentStatus, targetStatus) => {
    // 토글 기능 (미복귀 버튼 제거 반영)
    const nextStatus = currentStatus === targetStatus ? '미복귀' : targetStatus;
    setMembers(members.map(m => m.id === id ? { ...m, status: nextStatus } : m));
  };

  // --- 휴가 관련 로직 (유지) ---
  const getVacationersByDate = (date) => {
    const d = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    return vacations.filter(v => d >= v.start && d <= v.end);
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    const d = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    setVacationInput({ ...vacationInput, start: d, end: d });
  };

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    const dayVacations = getVacationersByDate(date);
    if (dayVacations.length === 0) return null;
    return (
      <div style={{ background: '#e74c3c', color: 'white', fontSize: '9px', padding: '2px', borderRadius: '4px', marginTop: '3px' }}>
        {dayVacations.length}명
      </div>
    );
  };

  const stats = getStats(activeTab);

  const styles = {
    container: { maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#f8f9fa', fontFamily: '"Pretendard", sans-serif' },
    // --- 예전 디자인 레이아웃 및 색감 복구 ---
    nav: { display: 'flex', background: '#25311b', padding: '5px 10px' },
    navBtn: (isActive) => ({ flex: 1, padding: '15px', border: 'none', background: 'none', color: isActive ? '#e9ce63' : '#a0a79a', fontWeight: 'bold', fontSize: '16px', borderBottom: isActive ? '3px solid #e9ce63' : 'none', textShadow: isActive ? '0 0 5px rgba(233,206,99,0.5)' : 'none' }),
    header: { background: '#25311b', padding: '40px 25px', borderRadius: '0 0 40px 40px', textAlign: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' },
    title: { margin: '0 0 25px 0', color: 'white', fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px' },
    inputArea: { background: 'rgba(255,255,255,0.08)', padding: '20px', borderRadius: '25px', backdropFilter: 'blur(5px)' },
    input: { width: '100%', padding: '12px', borderRadius: '12px', border: 'none', fontSize: '15px', marginBottom: '10px', boxSizing: 'border-box', background: 'white' },
    regBtn: { width: '100%', background: '#e9ce63', padding: '15px', borderRadius: '12px', border: 'none', fontWeight: 'bold', color: '#1a2e05', fontSize: '16px', cursor: 'pointer' },
    // --- 중대별 필터바 (예전 느낌 스타일링) ---
    filterBar: { display: 'flex', gap: '10px', padding: '25px 20px', overflowX: 'auto' },
    filterBtn: (isActive) => ({ padding: '10px 20px', borderRadius: '15px', border: 'none', background: isActive ? '#25311b' : 'white', color: isActive ? '#e9ce63' : '#555', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', whiteSpace: 'nowrap', cursor: 'pointer' }),
    // --- 통계바 (예전 느낌 스타일링) ---
    statsBar: { display: 'flex', justifyContent: 'space-around', background: 'white', margin: '0 20px 20px', padding: '18px', borderRadius: '20px', boxShadow: '0 8px 20px rgba(0,0,0,0.04)' },
    statLabel: { fontSize: '12px', color: '#888', display: 'block', marginBottom: '6px' },
    statNum: (color) => ({ fontSize: '20px', fontWeight: 'bold', color: color || '#1a2e05' }),
    // --- 대원 카드 (예전 느낌 스타일링 + 퍼센티지 + 삭제 버튼) ---
    card: { background: 'white', padding: '25px', borderRadius: '25px', margin: '0 20px 15px', boxShadow: '0 8px 20px rgba(0,0,0,0.03)', position: 'relative', textAlign: 'center' },
    nameTag: { fontSize: '21px', fontWeight: '800', color: '#1a1a1a', marginBottom: '18px' },
    percent: { fontSize: '15px', color: '#888', fontWeight: '400', marginLeft: '6px' },
    btnGroup: { display: 'flex', gap: '8px' },
    statusBtn: (active, color) => ({ flex: 1, padding: '15px 0', borderRadius: '12px', border: 'none', background: active ? color : '#f1f3f5', color: active ? 'white' : '#888', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }),
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(5px)' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.nav}>
        <button style={styles.navBtn(view === 'main')} onClick={() => setView('main')}>부대 관리</button>
        <button style={styles.navBtn(view === 'calendar')} onClick={() => setView('calendar')}>휴가 일정</button>
      </div>

      {view === 'main' ? (
        <div>
          <div style={styles.header}>
            <h2 style={styles.title}>지원대대 지원대</h2>
            <div style={styles.inputArea}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select style={{...styles.input, flex: 1}} value={newUnit} onChange={e => setNewUnit(e.target.value)}>
                  <option>HHC</option><option>Alpha</option><option>Bravo</option><option>Charlie</option>
                </select>
                <input type="date" style={{...styles.input, flex: 1.5}} value={newJoinDate} onChange={e => setNewJoinDate(e.target.value)} />
              </div>
              <input style={styles.input} placeholder="대원 성함 입력" value={newName} onChange={e => setNewName(e.target.value)} />
              <button style={styles.regBtn} onClick={addMember}>대원 추가</button>
            </div>
          </div>

          <div style={{ marginTop: '10px' }}>
            <div style={styles.filterBar}>
              {['HHC', 'Alpha', 'Bravo', 'Charlie'].map(u => (
                <button key={u} style={styles.filterBtn(activeTab === u)} onClick={() => setActiveTab(u)}>{u}</button>
              ))}
            </div>

            <div style={styles.statsBar}>
              <div style={{textAlign:'center'}}><span style={styles.statLabel}>총원</span><span style={styles.statNum()}>{stats.total}</span></div>
              <div style={{textAlign:'center'}}><span style={styles.statLabel}>복귀</span><span style={styles.statNum('#2ecc71')}>{stats.returned}</span></div>
              <div style={{textAlign:'center'}}><span style={styles.statLabel}>미복귀</span><span style={styles.statNum('#e74c3c')}>{stats.notReturned}</span></div>
              <div style={{textAlign:'center'}}><span style={styles.statLabel}>잔류</span><span style={styles.statNum('#3498db')}>{stats.stay}</span></div>
            </div>

            {members.filter(m => m.unit === activeTab).map(m => (
              <div key={m.id} style={styles.card}>
                <button style={{position:'absolute', top:'18px', right:'18px', border:'none', background:'none', color:'#eee', fontSize:'18px'}} onClick={() => { if(window.confirm("삭제하시겠습니까?")) setMembers(members.filter(x => x.id !== m.id)) }}>✕</button>
                <div style={styles.nameTag}>{m.name} <span style={styles.percent}>{calculatePercent(m.joinDate)}%</span></div>
                <div style={styles.btnGroup}>
                  <button style={styles.statusBtn(m.status === '복귀', '#2ecc71')} onClick={() => updateStatus(m.id, m.status, '복귀')}>복귀</button>
                  <button style={styles.statusBtn(m.status === '잔류', '#3498db')} onClick={() => updateStatus(m.id, m.status, '잔류')}>잔류</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* 휴가 일정 뷰 (기능 유지하되 디자인 톤앤매너 예전느낌으로 살짝 조정) */
        <div style={{ padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '30px', padding: '15px', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}>
            <Calendar onClickDay={handleDateClick} tileContent={tileContent} value={selectedDate} formatDay={(locale, date) => date.getDate()} />
          </div>
          
          <div style={{ background: 'white', padding: '25px', borderRadius: '30px', marginTop: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', color:'#25311b' }}>🚩 {selectedDate.toLocaleDateString()}</h3>
              <button style={{ background: '#25311b', color: '#e9ce63', border: 'none', padding: '10px 18px', borderRadius: '12px', fontWeight: 'bold', fontSize:'14px' }} onClick={() => setShowModal(true)}>+ 휴가 추가</button>
            </div>
            {getVacationersByDate(selectedDate).map(v => (
              <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', background: '#f8f9fa', padding: '15px', borderRadius: '15px', marginBottom: '10px' }}>
                <span><strong>{v.name}</strong> <small style={{color:'#e74c3c', marginLeft:'5px'}}>{v.type}</small></span>
                <button style={{ border: 'none', background: 'none', color: '#ccc', fontSize:'16px' }} onClick={() => setVacations(vacations.filter(x => x.id !== v.id))}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 모달 디자인 예전 느낌으로 */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '30px', width: '85%', maxWidth: '380px', boxShadow:'0 15px 30px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, marginBottom:'20px', color:'#25311b' }}>휴가 일정 등록</h3>
            <input style={{...styles.input, background:'#f1f3f5'}} placeholder="이름" value={vacationInput.name} onChange={e => setVacationInput({...vacationInput, name: e.target.value})} />
            <input style={{...styles.input, background:'#f1f3f5'}} placeholder="휴가 종류 (연가, 외출 등)" value={vacationInput.type} onChange={e => setVacationInput({...vacationInput, type: e.target.value})} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="date" style={{...styles.input, background:'#f1f3f5'}} value={vacationInput.start} onChange={e => setVacationInput({...vacationInput, start: e.target.value})} />
              <input type="date" style={{...styles.input, background:'#f1f3f5'}} value={vacationInput.end} onChange={e => setVacationInput({...vacationInput, end: e.target.value})} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button style={{ flex: 1, padding: '15px', borderRadius: '12px', border: 'none', background: '#eee', fontWeight:'bold' }} onClick={() => setShowModal(false)}>취소</button>
              <button style={{ flex: 1, padding: '15px', borderRadius: '12px', border: 'none', background: '#25311b', color: 'white', fontWeight:'bold' }} onClick={() => {
                if(!vacationInput.name || !vacationInput.start || !vacationInput.end) return;
                setVacations([...vacations, { ...vacationInput, id: Date.now() }]);
                setShowModal(false);
              }}>등록</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .react-calendar { width: 100% !important; border: none !important; font-family: inherit !important; }
        .react-calendar__tile--active { background: #25311b !important; border-radius: 10px !important; color: #e9ce63 !important; }
        .react-calendar__tile--now { background: #fdf3d0 !important; border-radius: 10px !important; color: #25311b !important; }
        .react-calendar__navigation button:enabled:hover { background-color: #f8f9fa; }
        .react-calendar__tile:enabled:hover { border-radius: 10px; }
      `}</style>
    </div>
  );
}