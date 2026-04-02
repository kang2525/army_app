import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

export default function App() {
  const [members, setMembers] = useState(() => JSON.parse(localStorage.getItem('katusa-members') || '[]'));
  const [vacations, setVacations] = useState(() => JSON.parse(localStorage.getItem('katusa-vacations') || '[]'));
  const [lastResetTimestamp, setLastResetTimestamp] = useState(() => localStorage.getItem('last-reset-time') || Date.now());
  
  const [view, setView] = useState('main'); 
  const [activeTab, setActiveTab] = useState('HHC');
  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('HHC');
  const [newJoinDate, setNewJoinDate] = useState(new Date().toISOString().split('T')[0]);

  // --- 24시간 주기 초기화 로직 ---
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

  // 전역 통계 (미복귀 버튼은 없지만 수치로는 보여줌)
  const getStats = (unit) => {
    const list = members.filter(m => m.unit === unit);
    return {
      total: list.length,
      returned: list.filter(m => m.status === '복귀').length,
      notReturned: list.filter(m => !m.status || m.status === '미복귀').length,
      stay: list.filter(m => m.status === '잔류').length
    };
  };

  // 퍼센티지 계산
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
    return ((servedDays / totalDays) * 100).toFixed(1);
  };

  const addMember = () => {
    if (!newName) return;
    setMembers([...members, { id: Date.now(), name: newName, unit: newUnit, joinDate: newJoinDate, status: '미복귀' }]);
    setNewName('');
  };

  const deleteMember = (id) => {
    if (window.confirm("이 대원을 삭제하시겠습니까?")) {
      setMembers(members.filter(m => m.id !== id));
    }
  };

  const updateStatus = (id, currentStatus, targetStatus) => {
    // 이미 해당 상태라면 다시 '미복귀'로 (토글 기능)
    const nextStatus = currentStatus === targetStatus ? '미복귀' : targetStatus;
    setMembers(members.map(m => m.id === id ? { ...m, status: nextStatus } : m));
  };

  const filteredMembers = members.filter(m => m.unit === activeTab);
  const stats = getStats(activeTab);

  const styles = {
    container: { maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#f8f9fa', fontFamily: '"Pretendard", sans-serif' },
    nav: { display: 'flex', background: '#1a2e05', padding: '5px 10px' },
    navBtn: (isActive) => ({ flex: 1, padding: '15px', border: 'none', background: 'none', color: isActive ? '#e9ce63' : '#888', fontWeight: 'bold', borderBottom: isActive ? '3px solid #e9ce63' : 'none' }),
    header: { background: '#1a2e05', padding: '30px 20px', borderRadius: '0 0 30px 30px', textAlign: 'center', color: 'white' },
    inputArea: { background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '20px', marginTop: '15px' },
    input: { width: '100%', padding: '10px', borderRadius: '8px', border: 'none', marginBottom: '8px', boxSizing: 'border-box' },
    statsBar: { display: 'flex', justifyContent: 'space-between', background: 'white', margin: '20px', padding: '15px 25px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
    statBox: { textAlign: 'center' },
    statLabel: { fontSize: '11px', color: '#888', display: 'block', marginBottom: '4px' },
    statNum: (color) => ({ fontSize: '18px', fontWeight: 'bold', color: color || '#1a2e05' }),
    card: { background: 'white', padding: '20px', borderRadius: '25px', margin: '0 20px 15px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', position: 'relative' },
    nameTag: { fontSize: '19px', fontWeight: '800', color: '#1a1a1a', marginBottom: '15px' },
    percent: { fontSize: '14px', color: '#888', fontWeight: '400', marginLeft: '6px' },
    btnGroup: { display: 'flex', gap: '8px' },
    statusBtn: (active, color) => ({ flex: 1, padding: '14px 0', borderRadius: '12px', border: 'none', background: active ? color : '#f1f3f5', color: active ? 'white' : '#888', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', transition: '0.2s' }),
    deleteBtn: { position: 'absolute', top: '15px', right: '15px', border: 'none', background: 'none', color: '#eee', fontSize: '18px', cursor: 'pointer' }
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
            <h2 style={{ margin: 0, fontSize: '20px', color: 'white', fontWeight: '800' }}>🎖️ 지원대대 지원대</h2>
            <div style={styles.inputArea}>
              <div style={{ display: 'flex', gap: '5px' }}>
                <select style={{...styles.input, flex: 1}} value={newUnit} onChange={e => setNewUnit(e.target.value)}>
                  <option>HHC</option><option>Alpha</option><option>Bravo</option><option>Charlie</option>
                </select>
                <input type="date" style={{...styles.input, flex: 1.5}} value={newJoinDate} onChange={e => setNewJoinDate(e.target.value)} />
              </div>
              <input style={styles.input} placeholder="대원 성함 입력" value={newName} onChange={e => setNewName(e.target.value)} />
              <button style={{...styles.input, background: '#e9ce63', color: '#1a2e05', fontWeight: 'bold', marginBottom: 0}} onClick={addMember}>대원 추가</button>
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', gap: '8px', padding: '0 20px 20px', overflowX: 'auto' }}>
              {['HHC', 'Alpha', 'Bravo', 'Charlie'].map(u => (
                <button key={u} style={{ padding: '8px 18px', borderRadius: '20px', border: 'none', background: activeTab === u ? '#1a2e05' : 'white', color: activeTab === u ? '#e9ce63' : '#555', fontWeight: 'bold' }} onClick={() => setActiveTab(u)}>{u}</button>
              ))}
            </div>

            <div style={styles.statsBar}>
              <div style={styles.statBox}><span style={styles.statLabel}>총원</span><span style={styles.statNum()}>{stats.total}</span></div>
              <div style={styles.statBox}><span style={styles.statLabel}>복귀</span><span style={styles.statNum('#2ecc71')}>{stats.returned}</span></div>
              <div style={styles.statBox}><span style={styles.statLabel}>미복귀</span><span style={styles.statNum('#e74c3c')}>{stats.notReturned}</span></div>
              <div style={styles.statBox}><span style={styles.statLabel}>잔류</span><span style={styles.statNum('#3498db')}>{stats.stay}</span></div>
            </div>

            {filteredMembers.map(m => (
              <div key={m.id} style={styles.card}>
                <button style={styles.deleteBtn} onClick={() => deleteMember(m.id)}>✕</button>
                <div style={styles.nameTag}>
                  {m.name} <span style={styles.percent}>{calculatePercent(m.joinDate)}%</span>
                </div>
                <div style={styles.btnGroup}>
                  <button 
                    style={styles.statusBtn(m.status === '복귀', '#2ecc71')} 
                    onClick={() => updateStatus(m.id, m.status, '복귀')}
                  >
                    복귀
                  </button>
                  <button 
                    style={styles.statusBtn(m.status === '잔류', '#3498db')} 
                    onClick={() => updateStatus(m.id, m.status, '잔류')}
                  >
                    잔류
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding: '20px' }}>
            <Calendar value={selectedDate} />
            <p style={{textAlign: 'center', color: '#888', marginTop: '20px'}}>휴가 일정 기능 준비 중</p>
        </div>
      )}
    </div>
  );
}