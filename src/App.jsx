import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

export default function App() {
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

  const updateStatus = (id, targetStatus) => {
    setMembers(members.map(m => m.id === id ? { ...m, status: targetStatus } : m));
  };

  const handleDateClick = (date) => setSelectedDate(date);

  const handleAddBtnClick = () => {
    const formatted = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    setVacationInput({ ...vacationInput, start: formatted, end: formatted });
    setShowModal(true);
  };

  const addVacation = () => {
    if (!vacationInput.name || !vacationInput.start || !vacationInput.end) return;
    setVacations([...vacations, { ...vacationInput, id: Date.now() }]);
    setShowModal(false);
    setVacationInput({ name: '', type: '연가', start: '', end: '' });
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

  const styles = {
    container: { maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#f8f9fa', fontFamily: '"Pretendard", sans-serif' },
    header: { background: 'linear-gradient(to bottom, #2d391e, #1a230e)', padding: '20px 20px 40px 20px', borderRadius: '0 0 40px 40px', textAlign: 'center' },
    nav: { display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' },
    navBtn: (active) => ({ background: 'none', border: 'none', padding: '10px', color: active ? '#e9ce63' : '#7d8a6b', fontWeight: 'bold', fontSize: '18px', borderBottom: active ? '3px solid #e9ce63' : 'none' }),
    inputCard: { background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '25px' },
    statsBar: { display: 'flex', justifyContent: 'space-around', background: 'white', margin: '-20px 20px 20px', padding: '20px', borderRadius: '25px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' },
    card: { background: 'white', padding: '25px 20px', borderRadius: '30px', margin: '0 20px 15px', boxShadow: '0 8px 20px rgba(0,0,0,0.03)', textAlign: 'center' },
    statusBtn: (active, color) => ({ flex: 1, padding: '12px 0', borderRadius: '12px', border: 'none', background: active ? color : '#f1f3f5', color: active ? 'white' : '#888', fontWeight: 'bold' }),
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(5px)' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.nav}>
          <button style={styles.navBtn(view === 'main')} onClick={() => setView('main')}>부대 관리</button>
          <button style={styles.navBtn(view === 'calendar')} onClick={() => setView('calendar')}>휴가 일정</button>
        </div>
        {view === 'main' && (
          <div style={styles.inputCard}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <select style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none' }} value={newUnit} onChange={e => setNewUnit(e.target.value)}>
                <option>HHC</option><option>Alpha</option><option>Bravo</option><option>Charlie</option>
              </select>
              <input type="date" style={{ flex: 1.5, padding: '12px', borderRadius: '12px', border: 'none' }} value={newJoinDate} onChange={e => setNewJoinDate(e.target.value)} />
            </div>
            <input style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', marginBottom: '10px', boxSizing: 'border-box' }} placeholder="대원 성함 입력" value={newName} onChange={e => setNewName(e.target.value)} />
            <button style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background:'#e9ce63', color: '#2d391e', fontWeight:'bold' }} onClick={() => { if(newName){ setMembers([...members, { id: Date.now(), name: newName, unit: newUnit, joinDate: newJoinDate, status: '미복귀' }]); setNewName(''); } }}>대원 추가</button>
          </div>
        )}
      </div>

      {view === 'main' ? (
        <div style={{ marginTop: '40px' }}>
          <div style={{ display: 'flex', gap: '10px', padding: '0 20px 20px', overflowX: 'auto' }}>
            {['HHC', 'Alpha', 'Bravo', 'Charlie'].map(u => (
              <button key={u} style={{ padding: '10px 20px', borderRadius: '15px', border: 'none', background: activeTab === u ? '#25311b' : 'white', color: activeTab === u ? '#e9ce63' : '#555', fontWeight: 'bold' }} onClick={() => setActiveTab(u)}>{u}</button>
            ))}
          </div>

          <div style={styles.statsBar}>
            <div style={{textAlign:'center'}}><span style={{fontSize:'12px', color:'#aaa'}}>총원</span><br/><b>{stats.total}</b></div>
            <div style={{textAlign:'center'}}><span style={{fontSize:'12px', color:'#aaa'}}>복귀</span><br/><b style={{color:'#2ecc71'}}>{stats.returned}</b></div>
            <div style={{textAlign:'center'}}><span style={{fontSize:'12px', color:'#aaa'}}>미복귀</span><br/><b style={{color:'#e74c3c'}}>{stats.notReturned}</b></div>
            <div style={{textAlign:'center'}}><span style={{fontSize:'12px', color:'#aaa'}}>잔류</span><br/><b style={{color:'#3498db'}}>{stats.stay}</b></div>
          </div>

          {members.filter(m => m.unit === activeTab).map(m => (
            <div key={m.id} style={styles.card}>
              <div style={{fontSize: '22px', fontWeight: '800', marginBottom: '15px'}}>{m.name} <span style={{fontSize:'12px', color:'#ccc', fontWeight:'normal'}}>{m.unit}</span></div>
              <div style={{display: 'flex', gap: '8px'}}>
                <button style={styles.statusBtn(m.status === '복귀', '#2ecc71')} onClick={() => updateStatus(m.id, '복귀')}>복귀</button>
                <button style={styles.statusBtn(m.status === '미복귀', '#e74c3c')} onClick={() => updateStatus(m.id, '미복귀')}>미복귀</button>
                <button style={styles.statusBtn(m.status === '잔류', '#3498db')} onClick={() => updateStatus(m.id, '잔류')}>잔류</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '30px', padding: '15px', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}>
            <Calendar onClickDay={handleDateClick} value={selectedDate} formatDay={(l, d) => d.getDate()} 
              tileContent={({date}) => {
                const d = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                const count = vacations.filter(v => d >= v.start && d <= v.end).length;
                return count > 0 ? <div style={{ background: '#e74c3c', color: 'white', fontSize: '10px', borderRadius: '4px', marginTop: '4px' }}>{count}명</div> : null;
              }}
            />
          </div>
          <div style={{ background: 'white', padding: '25px', borderRadius: '30px', marginTop: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight:'800' }}>🚩 {selectedDate.toLocaleDateString()} 명단</h3>
                <button style={{ background: '#25311b', color: '#e9ce63', border: 'none', width: '35px', height: '35px', borderRadius: '50%', fontSize: '24px' }} onClick={handleAddBtnClick}>+</button>
            </div>
            {vacations.filter(v => {
              const d = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
              return d >= v.start && d <= v.end;
            }).map(v => (
              <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', background: '#f8f9fa', padding: '15px', borderRadius: '15px', marginBottom: '10px' }}>
                <span><strong>{v.name}</strong> <small style={{color:'#e74c3c'}}>{v.type}</small></span>
                <button style={{ border: 'none', background: 'none', color: '#ccc' }} onClick={() => setVacations(vacations.filter(x => x.id !== v.id))}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '35px', width: '85%', maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ textAlign: 'center', marginBottom: '20px', fontWeight:'800' }}>휴가 등록</h3>
            <input style={{ width: '100%', padding: '15px', borderRadius: '15px', border: 'none', background: '#f1f3f5', marginBottom: '10px' }} placeholder="이름" value={vacationInput.name} onChange={e => setVacationInput({...vacationInput, name: e.target.value})} />
            <input style={{ width: '100%', padding: '15px', borderRadius: '15px', border: 'none', background: '#f1f3f5', marginBottom: '10px' }} placeholder="휴가 종류" value={vacationInput.type} onChange={e => setVacationInput({...vacationInput, type: e.target.value})} />
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '12px', color: '#888' }}>시작일</span>
                <input type="date" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: 'none', background: '#f1f3f5' }} value={vacationInput.start} onChange={e => setVacationInput({...vacationInput, start: e.target.value})} />
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '12px', color: '#888' }}>종료일</span>
                <input type="date" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: 'none', background: '#f1f3f5' }} value={vacationInput.end} onChange={e => setVacationInput({...vacationInput, end: e.target.value})} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{ flex: 1, padding: '15px', borderRadius: '15px', border: 'none', background: '#eee' }} onClick={() => setShowModal(false)}>취소</button>
              <button style={{ flex: 1, padding: '15px', borderRadius: '15px', border: 'none', background: '#25311b', color: 'white', fontWeight: 'bold' }} onClick={addVacation}>등록</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .react-calendar { width: 100% !important; border: none !important; }
        .react-calendar__tile--active { background: #25311b !important; border-radius: 12px !important; color: #e9ce63 !important; }
      `}</style>
    </div>
  );
}