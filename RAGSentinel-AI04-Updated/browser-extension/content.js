(() => {
 if (window.__ragSentinelLoaded) return;
 window.__ragSentinelLoaded = true;
 const style = document.createElement('style');
 style.textContent = `
 #ragsentinel-host{all:initial;position:fixed;z-index:2147483647;right:24px;bottom:90px;width:0;height:0}
 #ragsentinel-host *{box-sizing:border-box;font-family:Segoe UI,Arial,sans-serif}
 #rs-bubble{all:initial;position:fixed;right:24px;bottom:90px;width:56px;height:56px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#55d6d2,#7aa2ff);color:#071321;font:bold 23px Segoe UI;box-shadow:0 5px 22px #0008,0 0 0 3px #55d6d233;cursor:grab;user-select:none;z-index:2147483647}
 #rs-bubble:active{cursor:grabbing}
 #rs-panel{position:fixed;right:20px;bottom:158px;width:360px;max-height:min(76vh,720px);overflow:auto;background:#0b1020;color:#e8eefb;border:1px solid #263653;border-radius:14px;box-shadow:0 12px 45px #0009;z-index:2147483647;display:none;font:12px/1.45 Segoe UI,Arial;padding:13px}
 #rs-panel *{box-sizing:border-box;font-family:Segoe UI,Arial,sans-serif}
 #rs-panel .rs-head{display:flex;justify-content:space-between;align-items:center;font-weight:800;margin-bottom:12px}
 #rs-panel .rs-muted{color:#91a2c1;font-size:10px}
 #rs-panel textarea,#rs-panel select{width:100%;background:#10192b;border:1px solid #263653;color:#e8eefb;border-radius:8px;padding:9px;margin:4px 0;font:12px Segoe UI,Arial}
 #rs-panel textarea{height:75px;resize:vertical}
 #rs-panel button{cursor:pointer;border-radius:7px;padding:8px;border:1px solid #263653;background:#15223a;color:#e8eefb;font-size:11px}
 #rs-panel .rs-run{width:100%;border:0;background:linear-gradient(110deg,#55d6d2,#7aa2ff);color:#071321;font-weight:800;margin:4px 0 8px}
 #rs-panel .rs-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin:8px 0}
 #rs-panel .rs-metric,#rs-panel .rs-box{border:1px solid #263653;border-radius:8px;background:#10192b;padding:8px;margin-top:8px}
 #rs-panel .rs-metric b{display:block;font-size:18px}
 #rs-panel .rs-label{font-size:9px;color:#91a2c1}
 #rs-panel h4{font-size:10px;margin:0 0 7px}
 #rs-panel .rs-item{border-bottom:1px solid #263653;padding:7px 0}
 #rs-panel .rs-item:last-child{border:0}
 #rs-panel .rs-item a{color:#a8bdff;font-weight:700;text-decoration:none;font-size:10px}
 #rs-panel .rs-item p{color:#91a2c1;font-size:10px;margin:4px 0}
 #rs-panel .rs-tag{float:right;font-size:9px;color:#ffc66d}
 #rs-panel .rs-node{border:1px solid #263653;border-radius:6px;padding:6px;margin:4px 0;background:#0b1528}
 #rs-panel .rs-node b{font-size:10px}#rs-panel .rs-node p{margin:3px 0 0;color:#91a2c1;font-size:10px}
 #rs-panel .rs-bar{height:5px;background:#263653;border-radius:8px;overflow:hidden;margin:4px 0 7px}#rs-panel .rs-bar i{display:block;height:100%}
 `;
 document.documentElement.appendChild(style);
 const panel = document.createElement('div'); panel.id='rs-panel';
 panel.innerHTML = `<div class="rs-head"><span>◉ RAGSentinel <span class="rs-muted">/ BROWSER</span></span><button id="rs-close">×</button></div>
 <div class="rs-muted">LIVE EVIDENCE CHECK · NO UPLOADS</div>
 <textarea id="rs-q" placeholder="Enter a question…">What are the latest developments in RAG evaluation?</textarea>
 <select id="rs-n"><option value="3">3 parallel checks</option><option value="5">5 parallel checks</option><option value="4">4 parallel checks</option><option value="2">2 parallel checks</option><option value="1">1 check</option></select>
 <button class="rs-run" id="rs-run">⚡ Run live verification</button><div id="rs-status" class="rs-muted">Ready.</div>
 <div class="rs-metrics"><div class="rs-metric"><span class="rs-label">Retrieval</span><b id="rs-rel">—</b></div><div class="rs-metric"><span class="rs-label">Corroboration</span><b id="rs-cor">—</b></div><div class="rs-metric"><span class="rs-label">Risk</span><b id="rs-risk">—</b></div></div>
 <div class="rs-box"><h4>PIPELINE</h4><div id="rs-flow" class="rs-muted">No run yet.</div></div>
 <div class="rs-box"><h4>RISK ANALYSIS</h4><div id="rs-bars" class="rs-muted">No analysis yet.</div></div>
 <div class="rs-box"><h4>FAILURE LOCALIZATION</h4><div id="rs-fail" class="rs-muted">No alerts.</div></div>
 <div class="rs-box"><h4>LIVE SOURCES <span id="rs-count" class="rs-muted"></span></h4><div id="rs-sources" class="rs-muted">No sources yet.</div></div>
 <div class="rs-box" id="rs-judgebox" style="display:none"><h4>LLM JUDGE</h4><div id="rs-judge" class="rs-muted"></div></div>
 <div class="rs-muted" style="margin-top:9px">Scores are heuristic indicators, not proof of truth.</div>`;
 document.documentElement.appendChild(panel);
 const bubble=document.createElement('button');bubble.id='rs-bubble';bubble.type='button';bubble.textContent='R';bubble.title='Drag me · Click to open RAGSentinel';
 document.documentElement.appendChild(bubble);
 const $=id=>document.getElementById(id);
 // Drag bubble using pointer events, clamped to visible viewport.
 let drag=null,moved=false;
 bubble.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,left:bubble.getBoundingClientRect().left,top:bubble.getBoundingClientRect().top};moved=false;bubble.setPointerCapture(e.pointerId)});
 bubble.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>4)moved=true;if(moved){bubble.style.left=Math.max(0,Math.min(innerWidth-56,drag.left+dx))+'px';bubble.style.top=Math.max(0,Math.min(innerHeight-56,drag.top+dy))+'px';bubble.style.right='auto';bubble.style.bottom='auto';panel.style.left=Math.max(0,Math.min(innerWidth-370,bubble.getBoundingClientRect().left-300))+'px';panel.style.top=Math.max(0,Math.min(innerHeight-250,bubble.getBoundingClientRect().top-220))+'px';panel.style.right='auto';panel.style.bottom='auto'}});
 bubble.addEventListener('pointerup',()=>{if(!moved){panel.style.display=panel.style.display==='block'?'none':'block';if(panel.style.left==='')positionPanel()}drag=null});
 function positionPanel(){const r=bubble.getBoundingClientRect();panel.style.left=Math.max(8,Math.min(innerWidth-370,r.left-300))+'px';panel.style.top=Math.max(8,Math.min(innerHeight-300,r.top-220))+'px';panel.style.right='auto';panel.style.bottom='auto'}
 $('rs-close').onclick=()=>panel.style.display='none';
 $('rs-run').onclick=async()=>{const question=$('rs-q').value.trim();if(question.length<3){$('rs-status').textContent='Enter at least 3 characters.';return}
  $('rs-run').disabled=true;$('rs-run').textContent='Checking live sources…';$('rs-status').textContent='Searching parallel query variants…';
  try{const response=await fetch('http://127.0.0.1:8765/api/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question,parallel_queries:Number($('rs-n').value)})});if(!response.ok)throw Error('HTTP '+response.status);const d=await response.json(),m=d.metrics;
   $('rs-rel').textContent=m.retrieval_relevance;$('rs-cor').textContent=m.source_corroboration;$('rs-risk').textContent=m.risk_index;$('rs-risk').style.color=m.risk_index>=60?'#ff727f':m.risk_index>=35?'#ffc66d':'#68e0a3';
   $('rs-status').textContent=d.status+' · '+new Date(d.created_at).toLocaleTimeString();$('rs-count').textContent='· '+m.sources_found+' results';
   $('rs-flow').innerHTML=d.flow.map((x,i)=>`<div class="rs-node"><b>${i+1}. ${escapeHtml(x.name)}</b><p>${escapeHtml(x.detail)}</p></div>`).join('');
   $('rs-bars').innerHTML=[['Retrieval',m.retrieval_relevance,'#55d6d2'],['Corroboration',m.source_corroboration,'#7aa2ff'],['Risk',m.risk_index,'#ff727f']].map(a=>`${a[0]} <b style="float:right">${a[1]}</b><div class="rs-bar"><i style="width:${a[1]}%;background:${a[2]}"></i></div>`).join('');
   $('rs-fail').innerHTML=d.failures.map(f=>`<div class="rs-node"><b>${escapeHtml(f.type)} <span class="rs-tag">${escapeHtml(f.severity)}</span></b><p>${escapeHtml(f.reason)}</p></div>`).join('');
   $('rs-sources').innerHTML=d.sources.slice(0,10).map(s=>`<div class="rs-item"><a href="${escapeAttr(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.title)}</a><p>${escapeHtml(s.snippet)}</p><span class="rs-muted">${escapeHtml(s.domain)} · relevance ${Math.round(s.relevance*100)}%</span></div>`).join('')||'No sources returned.';
   if(d.llm_judgement){$('rs-judgebox').style.display='block';$('rs-judge').textContent=d.llm_judgement}
  }catch(e){$('rs-status').textContent='Could not reach local backend. Start the desktop tool first. '+e.message}
  finally{$('rs-run').disabled=false;$('rs-run').textContent='⚡ Run live verification'}
 };
 function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
 function escapeAttr(s){return escapeHtml(s)}
})();
