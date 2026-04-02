import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

export default function App() {
  const [members, setMembers] = useState(() => JSON.parse(localStorage.getItem('katusa-members') || '[]'));
  const [vacations, setVacations] = useState(() => JSON.parse(localStorage.getItem('katusa-vacations') || '[]'));
  
  const [view, setView] = useState('calendar'); // 캘린더 뷰를 기본으로 설정
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

  const calculatePercent = (joinDate) => {
    const start = new Date(joinDate);
    const today = new Date();
    const end = new Date(start);
    end.setMonth(start.getMonth() + 18);
    return Math.min(100, Math.max(0, ((today - start) / (end - start)) * 100)).toFixed(1);
  };

  const addVacation = () => {
    if (!vacationInput.name || !vacationInput.start || !vacationInput.end) return;
    setVacations([...vacations, { ...vacationInput, id: Date.now() }]);
    setShowModal(false);
    setVacationInput({ name: '', type: '연가', start: '', end: '' });
  };

  // 타임트리처럼 이름에 따라 막대 색상을 다르게 지정하는 함수
  const getColor = (name) => {
    const colors = ['#5fb2b2', '#73c088', '#f2bc57', '#e74c3c', '#3498db', '#9b59b6'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const stats = (() => {
    const list = members.filter(m => m.unit === activeTab);
    return {
      total: list.length,
      returned: list.filter(m => m.status === '복귀').length,
      notReturned: list.filter(m => !m.status || m.status === '미복귀').length,
      stay: list.filter(m => m.status === '잔류').length
    };
  })();

  const styles = {
    container: { maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#ffffff', fontFamily: '"Pretendard", sans-serif', position: 'relative', paddingBottom: '80px' },
    header: { background: 'linear-gradient(to bottom, #2d391e, #1a230e)', padding: '20px 20px 40px 20px', borderRadius: '0 0 40px 40px', position: 'relative', zIndex: 10 },
    nav: { display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' },
    navBtn: (active) => ({ background: 'none', border: 'none', padding: '10px', color: active ? '#e9ce63' : '#7d8a6b', fontWeight: 'bold', fontSize: '18px', borderBottom: active ? '3px solid #e9ce63' : 'none' }),
    inputCard: { background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '25px' },
    statsBar: { display: 'flex', justifyContent: 'space-around', background: 'white', margin: '20px 20px 20px', padding: '20px', borderRadius: '25px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', position: 'relative', zIndex: 5 },
    card: { background: 'white', padding: '25px 20px', borderRadius: '30px', margin: '0 20px 15px', boxShadow: '0 8px 20px rgba(0,0,0,0.03)', textAlign: 'center', position: 'relative', border: '1px solid #eee' },
    statusBtn: (active, color) => ({ flex: 1, padding: '12px 0', borderRadius: '12px', border: 'none', background: active ? color : '#f1f3f5', color: active ? 'white' : '#888', fontWeight: 'bold' }),
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(5px)' },
    // 우측 하단 플로팅 + 버튼 디자인
    fabBtn: { position: 'fixed', bottom: '30px', right: '50%', transform: 'translateX(210px)', width: '60px', height: '60px', borderRadius: '50%', background: '#2d391e', color: 'white', fontSize: '32px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', cursor: 'pointer', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }
  };

  // 모바일 화면 비율 맞추기 위한 트랜스폼 계산
  if (typeof window !== 'undefined' && window.innerWidth < 480) {
     styles.fabBtn.right = '20px';
     styles.fabBtn.transform = 'none';
  }

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
        <div style={{ marginTop: '20px' }}>
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
              <button style={{position:'absolute', top:'15px', right:'15px', border:'none', background:'none', color:'#ddd', fontSize:'18px'}} onClick={() => setMembers(members.filter(x => x.id !== m.id))}>✕</button>
              <div style={{fontSize: '22px', fontWeight: '800', marginBottom: '15px'}}>{m.name} <span style={{fontSize: '13px', color: '#bbb', fontWeight: '400'}}>{calculatePercent(m.joinDate)}%</span></div>
              <div style={{display: 'flex', gap: '8px'}}>
                <button style={styles.statusBtn(m.status === '복귀', '#2ecc71')} onClick={() => updateStatus(m.id, '복귀')}>복귀</button>
                <button style={styles.statusBtn(m.status === '미복귀', '#e74c3c')} onClick={() => updateStatus(m.id, '미복귀')}>미복귀</button>
                <button style={styles.statusBtn(m.status === '잔류', '#3498db')} onClick={() => updateStatus(m.id, '잔류')}>잔류</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '0px' }}>
          {/* 타임트리 스타일 달력 영역 */}
          <div style={{ background: 'white', padding: '10px 0' }}>
            <Calendar 
              onClickDay={setSelectedDate} 
              value={selectedDate} 
              formatDay={(l, d) => d.getDate()} 
              calendarType="US"
              tileContent={({date}) => {
                const d = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                const dayVacations = vacations.filter(v => d >= v.start && d <= v.end);
                return (
                  <div className="vacation-bar-container">
                    {dayVacations.map((v, i) => {
                      // 이름으로 랜덤 색상 지정하여 타임트리 느낌 살리기
                      const barColor = getColor(v.name);
                      return (
                        <div key={i} className="vacation-bar" style={{ backgroundColor: barColor }}>
                          {v.name} {v.type}
                        </div>
                      )
                    })}
                  </div>
                );
              }}
            />
          </div>
          
          {/* 하단 상세 명단 리스트 */}
          <div style={{ background: '#f8f9fa', padding: '25px 20px', minHeight: '300px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight:'800', color:'#333' }}>
              🚩 {selectedDate.toLocaleDateString()} 명단
            </h3>
            {vacations.filter(v => {
              const d = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
              return d >= v.start && d <= v.end;
            }).length === 0 ? (
                <p style={{textAlign:'center', color:'#aaa', marginTop:'40px'}}>등록된 휴가자가 없습니다.</p>
            ) : (
              vacations.filter(v => {
                const d = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                return d >= v.start && d <= v.end;
              }).map(v => (
                <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', background: 'white', padding: '15px', borderRadius: '15px', marginBottom: '10px', border: '1px solid #eee' }}>
                  <span>
                    <span style={{ display:'inline-block', width:'10px', height:'10px', borderRadius:'50%', backgroundColor: getColor(v.name), marginRight:'8px'}}></span>
                    <strong>{v.name}</strong> <small style={{color:'#888', marginLeft:'5px'}}>{v.type} ({v.start} ~ {v.end})</small>
                  </span>
                  <button style={{ border: 'none', background: 'none', color: '#ccc' }} onClick={() => setVacations(vacations.filter(x => x.id !== v.id))}>✕</button>
                </div>
              ))
            )}
          </div>

          {/* 타임트리 스타일 플로팅 + 버튼 */}
          <button style={styles.fabBtn} onClick={() => {
            const formatted = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            setVacationInput({ ...vacationInput, start: formatted, end: formatted });
            setShowModal(true);
          }}>+</button>
        </div>
      )}

      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '35px', width: '85%', maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ textAlign: 'center', marginBottom: '20px', fontWeight:'800' }}>휴가 등록</h3>
            <input style={{ width: '100%', padding: '15px', borderRadius: '15px', border: 'none', background: '#f1f3f5', marginBottom: '10px' }} placeholder="대원 이름 (예: 홍길동)" value={vacationInput.name} onChange={e => setVacationInput({...vacationInput, name: e.target.value})} />
            <input style={{ width: '100%', padding: '15px', borderRadius: '15px', border: 'none', background: '#f1f3f5', marginBottom: '10px' }} placeholder="휴가 종류 (예: 연가 3일)" value={vacationInput.type} onChange={e => setVacationInput({...vacationInput, type: e.target.value})} />
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
              <button style={{ flex: 1, padding: '15px', borderRadius: '15px', border: 'none', background: '#eee', fontWeight: 'bold' }} onClick={() => setShowModal(false)}>취소</button>
              <button style={{ flex: 1, padding: '15px', borderRadius: '15px', border: 'none', background: '#2d391e', color: 'white', fontWeight: 'bold' }} onClick={addVacation}>등록</button>
            </div>
          </div>
        </div>
      )}

      {/* 캘린더 그리드 및 막대 디자인 CSS (타임트리 스타일 핵심) */}
      <style>{`
        .react-calendar { width: 100% !important; border: none !important; font-family: inherit !important; background: white; }
        
        /* 요일 헤더 (일, 월, 화...) 선긋기 */
        .react-calendar__month-view__weekdays { border-bottom: 1px solid #eee; padding-bottom: 5px; font-size: 13px; color: #888; }
        .react-calendar__month-view__weekdays__weekday abbr { text-decoration: none; }
        .react-calendar__month-view__weekdays__weekday--weekend:nth-child(1) { color: #e74c3c; } /* 일요일 빨간색 */
        .react-calendar__month-view__weekdays__weekday--weekend:nth-child(7) { color: #3498db; } /* 토요일 파란색 */

        /* 달력 칸(그리드) 설정 */
        .react-calendar__month-view__days { border-left: 1px solid #f5f5f5; border-top: 1px solid #f5f5f5; }
        .react-calendar__tile { 
            height: 90px !important; 
            display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-start; 
            padding: 5px 0 0 0 !important; 
            border-right: 1px solid #f5f5f5 !important; 
            border-bottom: 1px solid #f5f5f5 !important; 
            background: white !important;
        }
        
        /* 날짜 숫자 위치 */
        .react-calendar__tile > abbr { margin-left: 5px; font-size: 13px; margin-bottom: 4px; font-weight: 500; }
        
        /* 오늘, 선택된 날짜 하이라이트 */
        .react-calendar__tile--now > abbr { background: #2d391e; color: white; border-radius: 50%; padding: 2px 6px; }
        .react-calendar__tile--active { background: #fdfdfd !important; box-shadow: inset 0 0 0 2px #2d391e; }
        
        /* 주말 날짜 색상 */
        .react-calendar__month-view__days__day--weekend:nth-child(7n+1) > abbr { color: #e74c3c; }
        .react-calendar__month-view__days__day--weekend:nth-child(7n) > abbr { color: #3498db; }

        /* 타임트리 스타일 컬러풀 막대 */
        .vacation-bar-container { width: 100%; display: flex; flex-direction: column; gap: 1px; }
        .vacation-bar { 
            width: 100%; 
            color: white; 
            font-size: 10.5px; 
            font-weight: 500;
            padding: 3px 4px; 
            white-space: nowrap; 
            overflow: hidden; 
            text-overflow: ellipsis; 
            text-align: left;
            box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}