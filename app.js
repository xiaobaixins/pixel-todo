(function(){
'use strict';

var LS_KEY='pixeltodo.v1', THEME_KEY='pixeltodo.theme', SND_KEY='pixeltodo.sound';

var state={
  todos:[],
  filter:'all',
  editing:null,
  theme:localStorage.getItem(THEME_KEY)||'light',
  sound:localStorage.getItem(SND_KEY)!=='0'
};

var list=document.getElementById('list'),
    input=document.getElementById('input'),
    addForm=document.getElementById('addForm'),
    barFill=document.getElementById('barFill'),
    leftEl=document.getElementById('left'),
    doneEl=document.getElementById('done'),
    emptyEl=document.getElementById('empty'),
    clearBtn=document.getElementById('clearBtn'),
    themeBtn=document.getElementById('themeBtn'),
    soundBtn=document.getElementById('soundBtn');

/* ---------- pixel audio ---------- */
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

/* ---------- storage ---------- */
function save(){localStorage.setItem(LS_KEY,JSON.stringify(state.todos));}
function load(){
  try{state.todos=JSON.parse(localStorage.getItem(LS_KEY))||[];}
  catch(e){state.todos=[];}
  state.todos=state.todos.filter(function(t){return t&&typeof t.text==='string'&&typeof t.done==='boolean';});
}

/* ---------- render ---------- */
function visible(){
  return state.todos.filter(function(t){
    if(state.filter==='active')return !t.done;
    if(state.filter==='done')return t.done;
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
    chk.setAttribute('aria-label',t.done?'mark as not done':'mark as done');
    chk.innerHTML='<i></i>';
    chk.addEventListener('click',function(){
      t.done=!t.done;
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

      var del=document.createElement('button');
      del.type='button';del.className='del';del.textContent='×';
      del.setAttribute('aria-label','delete task');
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
  leftEl.textContent=left+' LEFT';
  doneEl.textContent=done+' DONE';
  barFill.style.width=(total?Math.round(done/total*100):0)+'%';
  emptyEl.style.display=total?'none':'block';
  clearBtn.style.display=(done&&state.filter==='done')?'inline-block':'none';
  document.querySelectorAll('.chip').forEach(function(c){
    c.classList.toggle('active',c.dataset.f===state.filter);
  });
  save();
}

/* ---------- events ---------- */
addForm.addEventListener('submit',function(e){
  e.preventDefault();
  var v=input.value.trim();
  if(!v)return;
  state.todos.unshift({id:Date.now(),text:v,done:false});
  input.value='';
  state.filter='all';
  beep(660,0.06);
  save();render();
  input.focus();
});
document.querySelectorAll('.chip').forEach(function(c){
  c.addEventListener('click',function(){state.filter=c.dataset.f;render();});
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

/* ---------- theme / sound ---------- */
function applyTheme(){
  document.documentElement.dataset.theme=state.theme;
  var meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.setAttribute('content',state.theme==='dark'?'#1b1917':'#efe6d0');
  themeBtn.textContent=state.theme==='dark'?'LIGHT':'DARK';
  themeBtn.classList.toggle('on',state.theme==='dark');
}
function applySound(){
  soundBtn.textContent=state.sound?'SND ON':'SND OFF';
  soundBtn.classList.toggle('on',state.sound);
}

/* ---------- date ---------- */
var D=['SUN','MON','TUE','WED','THU','FRI','SAT'];
var d=new Date();
document.getElementById('date').textContent=
  d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')+' '+D[d.getDay()];

/* ---------- boot ---------- */
load();
applyTheme();
applySound();
render();

if('serviceWorker' in navigator){
  window.addEventListener('load',function(){
    navigator.serviceWorker.register('sw.js').catch(function(){});
  });
}
})();
