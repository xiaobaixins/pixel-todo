(function(){
'use strict';

var LS_KEY='pixeltodo.v1', THEME_KEY='pixeltodo.theme', SND_KEY='pixeltodo.sound',
    TARGET_KEY='pixeltodo.target', FOCUS_KEY='pixeltodo.focus';

var CATS=['数学','英语','408','政治','其他'];
var CAT_COLORS={'数学':'#3f7d4e','英语':'#3a6ea5','408':'#b5783a','政治':'#a53a5e','其他':'#8a7f68'};
var POMO_PRESETS=[15,25,45,60];

var state={
  todos:[],
  filter:'all',
  cat:'all',
  editing:null,
  theme:localStorage.getItem(THEME_KEY)||'light',
  sound:localStorage.getItem(SND_KEY)!=='0',
  target:localStorage.getItem(TARGET_KEY)||'2026-12-19',
  focus:null,
  heatOpen:true
};

var list=document.getElementById('list'),
    input=document.getElementById('input'),
    catSel=document.getElementById('catSel'),
    addForm=document.getElementById('addForm'),
    barFill=document.getElementById('barFill'),
    leftEl=document.getElementById('left'),
    doneEl=document.getElementById('done'),
    emptyEl=document.getElementById('empty'),
    clearBtn=document.getElementById('clearBtn'),
    themeBtn=document.getElementById('themeBtn'),
    soundBtn=document.getElementById('soundBtn'),
    cdWrap=document.getElementById('cdWrap'),
    cdDays=document.getElementById('cdDays'),
    cdEdit=document.getElementById('cdEdit'),
    cdInput=document.getElementById('cdInput'),
    heatSection=document.getElementById('heat'),
    heatToggle=document.getElementById('heatToggle'),
    heatBody=document.getElementById('heatBody'),
    heatGrid=document.getElementById('heatGrid'),
    streakEl=document.getElementById('streak'),
    pomoTime=document.getElementById('pomoTime'),
    pomoCtl=document.getElementById('pomoCtl'),
    pomoResetBtn=document.getElementById('pomoReset'),
    pomoStats=document.getElementById('pomoStats');

/* ---------- 工具 ---------- */
function pad(n){return String(n).padStart(2,'0');}
function dateKey(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function todayKey(){return dateKey(new Date());}

/* ---------- 像素音效 ---------- */
var actx=null;
function beep(freq,dur){
  if(!state.sound)return;
  try{
    actx=actx||new (window.AudioContext||window.webkitAudioContext)();
    var o=actx.createOscillator(),g=actx.createGain();
    o.type='square';o.frequency.value=freq;
    g.gain.setValueAtTime(0.045,actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001,actx.currentTime+dur);
    o.connect(g);g.connect(actx.destination);
    o.start();o.stop(actx.currentTime+dur);
  }catch(e){}
}

/* ---------- 数据存储 ---------- */
function save(){localStorage.setItem(LS_KEY,JSON.stringify(state.todos));}
function load(){
  try{state.todos=JSON.parse(localStorage.getItem(LS_KEY))||[];}
  catch(e){state.todos=[];}
  state.todos=state.todos.filter(function(t){return t&&typeof t.text==='string'&&typeof t.done==='boolean';});
  state.todos.forEach(function(t){
    if(!t.cat||CATS.indexOf(t.cat)<0)t.cat='其他';
    if(!t.doneAt)t.doneAt=null;
  });
}
function loadFocus(){
  try{state.focus=JSON.parse(localStorage.getItem(FOCUS_KEY))||{};}
  catch(e){state.focus={};}
}
function saveFocus(){localStorage.setItem(FOCUS_KEY,JSON.stringify(state.focus));}

/* ---------- 考研倒计时 ---------- */
function countdownDays(){
  var t=new Date(state.target+'T00:00:00'), now=new Date();
  now.setHours(0,0,0,0);
  return Math.max(0,Math.ceil((t-now)/86400000));
}
function renderCountdown(){cdDays.textContent=countdownDays();}
cdWrap.addEventListener('click',function(){
  cdEdit.hidden=false;cdWrap.hidden=true;
  cdInput.value=state.target;
  setTimeout(function(){cdInput.focus();},0);
});
function cdDone(){
  if(cdInput.value){state.target=cdInput.value;localStorage.setItem(TARGET_KEY,state.target);}
  renderCountdown();
  cdEdit.hidden=true;cdWrap.hidden=false;
}
cdInput.addEventListener('change',cdDone);
cdInput.addEventListener('blur',cdDone);
cdInput.addEventListener('keydown',function(e){if(e.key==='Enter')cdDone();});

/* ---------- 打卡热力图 ---------- */
function completionMap(){
  var m={};
  state.todos.forEach(function(t){if(t.done&&t.doneAt){m[t.doneAt]=(m[t.doneAt]||0)+1;}});
  return m;
}
function streakDays(m){
  var d=new Date(),n=0;
  if(!m[todayKey()])d.setDate(d.getDate()-1);
  while(m[dateKey(d)]){n++;d.setDate(d.getDate()-1);}
  return n;
}
function cellLevel(c){
  if(c===0)return 0;
  if(c===1)return 1;
  if(c<=3)return 2;
  if(c<=6)return 3;
  return 4;
}
function renderHeatmap(){
  var m=completionMap();
  streakEl.textContent='连续打卡 '+streakDays(m)+' 天';
  heatGrid.innerHTML='';
  var end=new Date();end.setHours(0,0,0,0);
  end.setDate(end.getDate()-end.getDay());
  for(var w=11;w>=0;w--){
    for(var day=0;day<7;day++){
      var d=new Date(end);
      d.setDate(end.getDate()-w*7+day);
      var c=m[dateKey(d)]||0;
      var cell=document.createElement('i');
      cell.className='cell l'+cellLevel(c);
      cell.title=dateKey(d)+' 完成 '+c+' 项';
      heatGrid.appendChild(cell);
    }
  }
}
heatToggle.addEventListener('click',function(){
  state.heatOpen=!state.heatOpen;
  heatSection.classList.toggle('open',state.heatOpen);
  heatBody.style.display=state.heatOpen?'block':'none';
});

/* ---------- 列表渲染 ---------- */
function visible(){
  return state.todos.filter(function(t){
    if(state.filter==='active'&&t.done)return false;
    if(state.filter==='done'&&!t.done)return false;
    if(state.cat!=='all'&&t.cat!==state.cat)return false;
    return true;
  });
}
function render(){
  var items=visible();
  list.innerHTML='';
  items.forEach(function(t){
    var li=document.createElement('li');
    li.className='item'+(t.done?' done':'');

    var chk=document.createElement('button');
    chk.type='button';chk.className='check';
    chk.setAttribute('aria-label',t.done?'标记为未完成':'标记为完成');
    chk.innerHTML='<i></i>';
    chk.addEventListener('click',function(){
      t.done=!t.done;
      t.doneAt=t.done?todayKey():null;
      beep(t.done?880:440,0.08);
      save();render();
    });
    li.appendChild(chk);

    if(state.editing===t.id){
      var ed=document.createElement('input');
      ed.className='edit';ed.maxLength=80;ed.value=t.text;
      var commit=function(){
        if(state.editing!==t.id)return;
        var v=ed.value.trim();
        state.editing=null;
        if(v){t.text=v;beep(660,0.05);}
        save();render();
      };
      var cancel=function(){state.editing=null;render();};
      ed.addEventListener('keydown',function(e){
        if(e.key==='Enter')commit();
        else if(e.key==='Escape'){e.preventDefault();cancel();}
      });
      ed.addEventListener('blur',commit);
      li.appendChild(ed);
      setTimeout(function(){ed.focus();ed.select();},0);
    }else{
      var txt=document.createElement('span');
      txt.className='text';
      txt.textContent=t.text;
      txt.addEventListener('click',function(){state.editing=t.id;render();});
      li.appendChild(txt);

      var tag=document.createElement('span');
      tag.className='tag';
      tag.textContent=t.cat;
      tag.style.color=CAT_COLORS[t.cat]||CAT_COLORS['其他'];
      tag.title='点按切换科目';
      tag.addEventListener('click',function(){
        t.cat=CATS[(CATS.indexOf(t.cat)+1)%CATS.length];
        beep(520,0.05);
        save();render();
      });
      li.appendChild(tag);

      var del=document.createElement('button');
      del.type='button';del.className='del';del.textContent='×';
      del.setAttribute('aria-label','删除任务');
      del.addEventListener('click',function(){
        state.todos=state.todos.filter(function(x){return x.id!==t.id;});
        beep(240,0.1);
        save();render();
      });
      li.appendChild(del);
    }
    list.appendChild(li);
  });

  var left=0,done=0,total=state.todos.length;
  state.todos.forEach(function(t){if(t.done)done++;else left++;});
  leftEl.textContent=left+' 项未完成';
  doneEl.textContent=done+' 项已完成';
  barFill.style.width=(total?Math.round(done/total*100):0)+'%';
  emptyEl.style.display=total?'none':'block';
  clearBtn.style.display=(done&&state.filter==='done')?'inline-block':'none';
  document.querySelectorAll('.chip[data-f]').forEach(function(c){
    c.classList.toggle('active',c.dataset.f===state.filter);
  });
  document.querySelectorAll('.chip[data-cat]').forEach(function(c){
    c.classList.toggle('active',c.dataset.cat===state.cat);
  });
  save();
  renderHeatmap();
}

/* ---------- 事件 ---------- */
addForm.addEventListener('submit',function(e){
  e.preventDefault();
  var v=input.value.trim();
  if(!v)return;
  state.todos.unshift({id:Date.now(),text:v,done:false,doneAt:null,cat:catSel.value||'其他'});
  input.value='';
  state.filter='all';state.cat='all';
  beep(660,0.06);
  save();render();
  input.focus();
});
document.querySelectorAll('.chip[data-f]').forEach(function(c){
  c.addEventListener('click',function(){state.filter=c.dataset.f;render();});
});
document.querySelectorAll('.chip[data-cat]').forEach(function(c){
  c.addEventListener('click',function(){state.cat=c.dataset.cat;render();});
});
clearBtn.addEventListener('click',function(){
  state.todos=state.todos.filter(function(t){return !t.done;});
  beep(330,0.08);
  save();render();
});
themeBtn.addEventListener('click',function(){
  state.theme=state.theme==='dark'?'light':'dark';
  localStorage.setItem(THEME_KEY,state.theme);
  applyTheme();
});
soundBtn.addEventListener('click',function(){
  state.sound=!state.sound;
  localStorage.setItem(SND_KEY,state.sound?'1':'0');
  applySound();
  if(state.sound)beep(880,0.06);
});

/* ---------- 番茄钟 ---------- */
var pomo={dur:25*60,remaining:25*60,running:false,tid:null};
function fmtTime(s){return pad(Math.floor(s/60))+':'+pad(s%60);}
function pomoTick(){
  pomo.remaining--;
  if(pomo.remaining<=0){pomoComplete();return;}
  renderPomo();updateTitle();
}
function pomoComplete(){
  clearInterval(pomo.tid);pomo.tid=null;pomo.running=false;
  beep(880,0.15);
  setTimeout(function(){beep(880,0.15);},250);
  setTimeout(function(){beep(660,0.2);},500);
  var k=todayKey(),f=state.focus[k]=state.focus[k]||{m:0,n:0};
  f.m+=pomo.dur/60;f.n++;
  saveFocus();
  pomo.remaining=pomo.dur;
  renderPomo();updateTitle();
}
function pomoStartPause(){
  if(pomo.running){
    clearInterval(pomo.tid);pomo.tid=null;pomo.running=false;
  }else{
    pomo.running=true;
    pomo.tid=setInterval(pomoTick,1000);
  }
  renderPomo();updateTitle();
}
function pomoReset(){
  clearInterval(pomo.tid);pomo.tid=null;pomo.running=false;
  pomo.remaining=pomo.dur;
  renderPomo();updateTitle();
}
function cycleDuration(){
  var idx=POMO_PRESETS.indexOf(pomo.dur/60);
  var next=POMO_PRESETS[(idx+1)%POMO_PRESETS.length];
  pomoReset();
  pomo.dur=next*60;pomo.remaining=pomo.dur;
  renderPomo();
}
function renderPomo(){
  pomoTime.textContent=fmtTime(pomo.remaining);
  pomoTime.classList.toggle('running',pomo.running);
  pomoCtl.textContent=pomo.running?'暂停':(pomo.remaining<pomo.dur?'继续':'开始');
  var f=state.focus[todayKey()];
  pomoStats.textContent=f&&f.n?('今日 '+f.m+' 分 · '+f.n+' 次'):'今日 0 分';
}
function updateTitle(){
  document.title=(pomo.running?fmtTime(pomo.remaining)+' · ':'')+'像素待办';
}
pomoTime.addEventListener('click',cycleDuration);
pomoCtl.addEventListener('click',pomoStartPause);
pomoResetBtn.addEventListener('click',pomoReset);

/* ---------- 主题 / 音效 ---------- */
function applyTheme(){
  document.documentElement.dataset.theme=state.theme;
  var meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.setAttribute('content',state.theme==='dark'?'#1b1917':'#efe6d0');
  themeBtn.textContent=state.theme==='dark'?'亮色':'暗色';
  themeBtn.classList.toggle('on',state.theme==='dark');
}
function applySound(){
  soundBtn.textContent=state.sound?'音效':'静音';
  soundBtn.classList.toggle('on',state.sound);
}

/* ---------- 日期 ---------- */
var D=['日','一','二','三','四','五','六'];
var d=new Date();
document.getElementById('date').textContent=
  d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+' 周'+D[d.getDay()];

/* ---------- 启动 ---------- */
load();
loadFocus();
applyTheme();
applySound();
renderCountdown();
renderPomo();
render();

if('serviceWorker' in navigator){
  window.addEventListener('load',function(){
    navigator.serviceWorker.register('sw.js').catch(function(){});
  });
}

/* 调试钩子（浏览器测试用） */
window.__pt={state:state,pomo:pomo,pomoStartPause:pomoStartPause,pomoReset:pomoReset};
})();
