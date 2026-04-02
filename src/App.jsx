import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

export default function App() {
  // 데이터 로드 (에러 방지 처리)
  const [members, setMembers] = useState(() => JSON.parse(localStorage.getItem('katusa-members') || '[]'));
  const [vacations, setVacations] = useState(() => JSON.parse(localStorage.getItem('katusa-vacations') || '[]'));
  
  const [view, setView] = useState('main'); 
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('HHC');

  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('HHC');
  const [newJoinDate, setNewJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [vacationInput, setVacationInput] = useState({ name: '', type: '연가', start: '', end: '' });

  useEffect(() => {
    localStorage.setItem('katusa-members', JSON.stringify(members));
    localStorage.setItem('katusa-vacations', JSON.stringify(vacations));
  }, [members, vacations]);

  // 인원 관리 기능: 상태 변경
  const updateStatus = (id, targetStatus) => {
    setMembers(members.map(m => m.id === id ? { ...m, status: targetStatus } : m));
  };

  // 인원 관리 기능: 삭제
  const deleteMember = (id) => {
    setMembers(members.filter(m => m.id !== id));
  };

  // 인원 관리 기능: 진급률 계산
  const calculatePercent = (joinDate) => {
    if(!joinDate) return "0";
    const start = new Date(joinDate);
    const today = new Date();
    const end = new Date(start);
    end.setMonth(start.getMonth() + 18);
    const p = ((today - start) / (end - start)) * 100;
    return Math.min(100, Math.max(0, p)).toFixed(1);
  };

  const getStats = (unit) => {
    const list = members.filter(m => m.unit === unit);
    return {
      total: list.length,
      returned: list.filter(m => m.status === '복귀').length,
      notReturned: list.filter(m => !m.status || m.status === '미복귀').length,
      stay: list.filter(m => m.status === '잔류').length
    };
  };

  const stats = getStats(activeTab);

  // 타임트리 스타일 색상
  const getColor = (name) => {
    const colors = ['#5fb2b2', '#73c088', '#f2bc57', '#e74c3c', '#3498db'];
    return colors[name.length % colors.length] || colors[0];
  };

  const styles = {
    container: { maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#f8f9fa', fontFamily: 'sans-serif', position: 'relative' },
    header: { background: '#2d391e', padding: '20px', borderRadius: '0 0 30px 30px', color: 'white' },
    nav: { display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '15px' },
    navBtn: (active) => ({ background: 'none', border: 'none', color: active ? '#e9ce63' : '#7d8a6b', fontWeight: 'bold', fontSize: '16px', borderBottom: active ? '2px solid #e9ce63' : 'none', padding: '5px' }),
    statsBar: { display: 'flex', justifyContent: 'space-around', background: 'white', margin: '15px 20px', padding: '15px', borderRadius: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' },
    card: { background: 'white', padding: '20px', borderRadius: '25px', margin: '0 20px 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', position: 'relative' },
    statusBtn: (active, color) => ({ flex: 1, padding: '10px 0', borderRadius: '10px', border: 'none', background: active ? color : '#f1f3f5', color: active ? 'white' : '#888', fontWeight: 'bold', fontSize: '13px' }),
    fab: { position: 'fixed', bottom: '30px', right: '20px', width: '56px', height: '56px', borderRadius: '28px', background: '#2d391e', color: '#e9ce63', fontSize: '30px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 100 }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.nav}>
          <button style={styles.navBtn(view === 'main')} onClick={() => setView('main')}>부대 관리</button>
          <button style={styles.navBtn(view === 'calendar')} onClick={() => setView('calendar')}>휴가 일정</button>
        </div>
        {view === 'main' && (
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select style={{ flex: 1, padding: '10px', borderRadius: '10px' }} value={newUnit} onChange={e => setNewUnit(e.target.value)}>
                <option>HHC</option><option>Alpha</option><option>Bravo</option><option>Charlie</option>
              </select>
              <input type="date" style={{ flex: 1.5, padding: '10px', borderRadius: '10px' }} value={newJoinDate} onChange={e => setNewJoinDate(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input style={{ flex: 4, padding: '10px', borderRadius: '10px', border: 'none' }} placeholder="이름 입력" value={newName} onChange={e => setNewName(e.target.value)} />
              <button style={{ flex: 1, background: '#e9ce63', border: 'none', borderRadius: '10px', fontWeight: 'bold' }} onClick={() => { if(newName){ setMembers([...members, { id: Date.now(), name: newName, unit: newUnit, joinDate: newJoinDate, status: '미복귀' }]); setNewName(''); } }}>추가</button>
            </div>
          </div>
        )}
      </div>

      {view === 'main' ? (
        <div style={{ marginTop: '10px' }}>
          <div style={{ display: 'flex', gap: '8px', padding: '10px 20px', overflowX: 'auto' }}>
            {['HHC', 'Alpha', 'Bravo', 'Charlie'].map(u => (
              <button key={u} style={{ padding: '8px 15px', borderRadius: '12px', border: 'none', background: activeTab === u ? '#2d391e' : 'white', color: activeTab === u ? '#e9ce63' : '#555' }} onClick={() => setActiveTab(u)}>{u}</button>
            ))}
          </div>

          <div style={styles.statsBar}>
            <div style={{textAlign:'center'}}><small style={{color:'#999'}}>총원</small><br/><b>{stats.total}</b></div>
            <div style={{textAlign:'center'}}><small style={{color:'#999'}}>복귀</small><br/><b style={{color:'#2ecc71'}}>{stats.returned}</b></div>
            <div style={{textAlign:'center'}}><small style={{color:'#999'}}>미복귀</small><br/><b style={{color:'#e74c3c'}}>{stats.notReturned}</b></div>
            <div style={{textAlign:'center'}}><small style={{color:'#999'}}>잔류</small><br/><b style={{color:'#3498db'}}>{stats.stay}</b></div>
          </div>

          {members.filter(m => m.unit === activeTab).map(m => (
            <div key={m.id} style={styles.card}>
              <button style={{ position:'absolute', top:'15px', right:'15px', border:'none', background:'none', color:'#ccc' }} onClick={() => deleteMember(m.id)}>✕</button>
              <div style={{ marginBottom: '15px', fontSize: '18px', fontWeight: 'bold' }}>
                {m.name} <span style={{ fontSize: '12px', color: '#aaa', fontWeight: 'normal' }}>{calculatePercent(m.joinDate)}%</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={styles.statusBtn(m.status === '복귀', '#2ecc71')} onClick={() => updateStatus(m.id, '복귀')}>복귀</button>
                <button style={styles.statusBtn(m.status === '미복귀', '#e74c3c')} onClick={() => updateStatus(m.id, '미복귀')}>미복귀</button>
                <button style={styles.statusBtn(m.status === '잔류', '#3498db')} onClick={() => updateStatus(m.id, '잔류')}>잔류</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '10px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
            <Calendar 
              onClickDay={setSelectedDate} value={selectedDate} formatDay={(l, d) => d.getDate()}
              tileContent={({date}) => {
                const d = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                const dayVacations = vacations.filter(v => d >= v.start && d <= v.end);
                return (
                  <div className="v-container">
                    {dayVacations.map((v, i) => (
                      <div key={i} className="v-bar" style={{ background: getColor(v.name) }}>{v.name}</div>
                    ))}
                  </div>
                );
              }}
            />
          </div>
          <div style={{ marginTop: '20px', padding: '0 10px' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>🚩 {selectedDate.toLocaleDateString()} 명단</h4>
            {vacations.filter(v => {
              const d = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
              return d >= v.start && d <= v.end;
            }).map(v => (
              <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', background: 'white', padding: '12px', borderRadius: '15px', marginBottom: '8px', border: '1px solid #eee' }}>
                <span><strong>{v.name}</strong> <small style={{color:'#888'}}>{v.type}</small></span>
                <button style={{ border: 'none', background: 'none', color: '#ccc' }} onClick={() => setVacations(vacations.filter(x => x.id !== v.id))}>✕</button>
              </div>
            ))}
          </div>
          <button style={styles.fab} onClick={() => setShowModal(true)}>+</button>
        </div>
      )}

      {showModal && (
        <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={() => setShowModal(false)}>
          <div style={{ background:'white', padding:'25px', borderRadius:'25px', width:'80%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>휴가 등록</h3>
            <input style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #eee', marginBottom: '10px', boxSizing: 'border-box' }} placeholder="이름" value={vacationInput.name} onChange={e => setVacationInput({...vacationInput, name: e.target.value})} />
            <input style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #eee', marginBottom: '10px', boxSizing: 'border-box' }} placeholder="종류 (연가/외출)" value={vacationInput.type} onChange={e => setVacationInput({...vacationInput, type: e.target.value})} />
            <div style={{ display: 'flex', gap: '5px', marginBottom: '20px' }}>
              <input type="date" style={{ flex: 1, padding: '10px' }} value={vacationInput.start} onChange={e => setVacationInput({...vacationInput, start: e.target.value})} />
              <input type="date" style={{ flex: 1, padding: '10px' }} value={vacationInput.end} onChange={e => setVacationInput({...vacationInput, end: e.target.value})} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '10px' }} onClick={() => setShowModal(false)}>취소</button>
              <button style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '10px', background: '#2d391e', color: 'white' }} onClick={() => { if(vacationInput.name){ setVacations([...vacations, { ...vacationInput, id: Date.now() }]); setShowModal(false); } }}>등록</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .react-calendar { width: 100% !important; border: none !important; }
        .react-calendar__tile { height: 80px !important; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding: 5px 0 !important; border: 0.5px solid #f0f0f0 !important; }
        .v-container { width: 100%; display: flex; flex-direction: column; gap: 1px; margin-top: 2px; overflow: hidden; }
        .v-bar { width: 100%; font-size: 9px; color: white; padding: 1px 2px; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
      `}</style>
    </div>
  );
}