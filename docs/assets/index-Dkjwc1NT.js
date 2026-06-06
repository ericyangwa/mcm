(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))l(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const a of s.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&l(a)}).observe(document,{childList:!0,subtree:!0});function o(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function l(r){if(r.ep)return;r.ep=!0;const s=o(r);fetch(r.href,s)}})();let f=20,b=0,m="stats";const g=["top","jungle","mid","bot","support"],$={top:"Top",jungle:"Jungle",mid:"Mid",bot:"Bot",support:"Support",flex:"Flex"},y={top:"🛡️",jungle:"🌿",mid:"⚡",bot:"🏹",support:"💙",flex:"🔀"},O={IRON:"#6a6a6a",BRONZE:"#a05000",SILVER:"#6a7f9a",GOLD:"#e5a330",PLATINUM:"#00b4b4",EMERALD:"#00c080",DIAMOND:"#576bce",MASTER:"#9d4dc6",GRANDMASTER:"#e84057",CHALLENGER:"#f4c874"},I={1:"I",2:"II",3:"III",4:"IV"},k={na1:"na",euw1:"euw",eune1:"eune",kr:"kr",br1:"br",la1:"lan",la2:"las",oc1:"oce",tr1:"tr",ru:"ru",jp1:"jp"};function L(e){return`https://www.op.gg/summoners/${k[e.region]??e.region.toLowerCase()}/${encodeURIComponent(e.gameName)}-${e.tagLine}`}function M(e){const t=I[e.division]??"";return`${e.tier.charAt(0)+e.tier.slice(1).toLowerCase()}${t?` ${t}`:""}`}function R(e){const t=e.wins+e.losses;return t?`${Math.round(e.wins/t*100)}%`:"0%"}function h(e){return e>=7?"#f4c874":e>=6?"#00c080":e>=5?"#4a9eff":e>=4?"#e5a330":"#e84057"}function w(e){const t=Math.floor((Date.now()-new Date(e).getTime())/6e4);if(t<1)return"just now";if(t<60)return`${t}m ago`;const o=Math.floor(t/60);return o<24?`${o}h ago`:`${Math.floor(o/24)}d ago`}function S(e){const t={};for(const l of e)!l.position||l.opScore==null||(t[l.position]||(t[l.position]=[]),t[l.position].push(l.opScore));const o={};for(const[l,r]of Object.entries(t)){const s=r.reduce((a,n)=>a+n,0)/r.length;o[l]={avgOpScore:Math.round(s*100)/100,games:r.length}}return o}function C(e){if(e.opScore==null)return"";const t=e.result==="WIN",o=e.result==="WIN"?"win":e.result==="LOSE"?"loss":"",l=h(e.opScore),r=e.champion??"?",s=e.createdAt?new Date(e.createdAt).toLocaleDateString(void 0,{month:"short",day:"numeric"}):"";return`
    <div class="game-row ${o}">
      <span class="game-result-dot" title="${e.result??""}">${t?"▲":"▼"}</span>
      <span class="game-champion">${r}</span>
      <span class="game-score" style="color:${l}">${e.opScore.toFixed(2)}</span>
      <span class="game-date">${s}</span>
    </div>`}function A(e,t,o){const l=e.rank?O[e.rank.tier]??"#888":"#555",r=h(o.avgOpScore),s=e.rank?`<div class="rank" style="color:${l}">
         ${M(e.rank)}<span class="lp">${e.rank.lp} LP</span>
       </div>
       <div class="winrate">${R(e.rank)} WR · ${e.rank.wins}W ${e.rank.losses}L</div>`:'<div class="rank unranked">Unranked</div>',a=e.recentGames.slice(0,f).filter(i=>i.position===t),n=a.length?`<div class="games-list">${a.map(C).join("")}</div>`:"",c=`${e.gameName}-${e.tagLine}-${t}`.replace(/[^a-zA-Z0-9-]/g,"_");return`
    <div class="card" id="card-${c}">
      <div class="card-header">
        <a class="player-name" href="${L(e)}" target="_blank" rel="noopener">
          ${e.gameName}<span class="tag">#${e.tagLine}</span>
        </a>
        <button class="toggle-btn" data-card="${c}" title="Show games">
          <span class="toggle-icon">▾</span>
        </button>
      </div>

      <div class="op-score" style="color:${r}">
        ${o.avgOpScore.toFixed(2)}
        <span class="op-label">OP Score</span>
      </div>
      <span class="sample-size">${o.games} game${o.games!==1?"s":""} as ${$[t]}</span>

      ${s}
      ${n}
    </div>`}function N(e,t){const o=[...t].sort((l,r)=>r.score.avgOpScore-l.score.avgOpScore);return`
    <div class="column">
      <div class="column-header">
        <span class="role-icon">${y[e]}</span>
        ${$[e]}
        <span class="player-count">${t.length}</span>
      </div>
      ${o.length?o.map(({player:l,score:r})=>A(l,e,r)).join(""):'<div class="empty">No players</div>'}
    </div>`}function B(e,t){const o=e.map(a=>{const n=S(a.recentGames.slice(0,f));return g.flatMap(c=>{const i=n[c];return!i||i.games<t?[]:[{role:c,avgOpScore:i.avgOpScore,games:i.games}]})});let l=-1/0,r=new Map;function s(a,n,c,i){if(a===g.length){i>l&&(l=i,r=new Map(c));return}const p=g[a];s(a+1,n,c,i);for(let d=0;d<e.length;d++){if(n.has(d))continue;const u=o[d].find(E=>E.role===p);u&&(c.set(p,{player:e[d],score:u.avgOpScore,games:u.games}),n.add(d),s(a+1,n,c,i+u.avgOpScore),n.delete(d),c.delete(p))}}return s(0,new Set,new Map,0),g.map(a=>{const n=r.get(a);return n?{role:a,player:n.player,score:n.score,games:n.games}:{role:a,player:null,score:null,games:0}})}function G(e){return`
    <div class="tb-wrapper">
      <div class="tb-controls">
        <div class="tb-section-label">Players</div>
        <div class="tb-players">${e.players.map((o,l)=>`
    <label class="tb-player-check">
      <input type="checkbox" class="tb-player-cb" data-idx="${l}" />
      <span class="tb-player-label">${o.gameName}<span class="tag">#${o.tagLine}</span></span>
    </label>`).join("")}</div>

        <div class="tb-row">
          <label class="tb-section-label" for="tb-min-games">Min games per role</label>
          <input id="tb-min-games" type="number" class="tb-number-input" value="3" min="1" max="200" />
        </div>

        <button id="tb-solve-btn" class="tb-btn">⚡ Find Best Lineup</button>
      </div>

      <div id="tb-result" class="tb-result-area"></div>
    </div>`}function j(e,t){const o=e.filter(s=>s.player).length,l=o?h(t/o):"#888",r=e.map(s=>{if(!s.player||s.score==null)return`
        <div class="lineup-row lineup-empty">
          <span class="lineup-role-icon">${y[s.role]}</span>
          <span class="lineup-role-name">${$[s.role]}</span>
          <span class="lineup-player muted">— No eligible player</span>
          <span></span>
        </div>`;const a=h(s.score);return`
      <div class="lineup-row">
        <span class="lineup-role-icon">${y[s.role]}</span>
        <span class="lineup-role-name">${$[s.role]}</span>
        <a class="lineup-player player-name" href="${L(s.player)}" target="_blank" rel="noopener">
          ${s.player.gameName}<span class="tag">#${s.player.tagLine}</span>
        </a>
        <span class="lineup-score" style="color:${a}">
          ${s.score.toFixed(2)}
          <span class="lineup-games">${s.games} games</span>
        </span>
      </div>`}).join("");return`
    <div class="lineup-card">
      <div class="lineup-header">
        Best lineup &mdash;
        <span style="color:${l}">${t.toFixed(2)}</span>
        <span class="muted"> total · ${o} role${o!==1?"s":""} filled</span>
      </div>
      ${r}
    </div>`}function x(e){var a;const t={};for(const n of e.players){const c=n.recentGames.slice(0,f),i=S(c);for(const[p,d]of Object.entries(i))b>0&&d.games<b||(t[p]||(t[p]=[]),t[p].push({player:n,score:d}))}const o=[...g];(a=t.flex)!=null&&a.length&&o.push("flex");const l=Math.max(...e.players.map(n=>n.recentGames.length),20),r=[5,10,20,50,100,200].filter(n=>n<=l||n===20).map(n=>`<option value="${n}" ${n===f?"selected":""}>${n} games</option>`).join(""),s=[0,1,2,3,4,5].map(n=>`<option value="${n}" ${n===b?"selected":""}>${n}</option>`).join("");return`
    <div class="controls">
      <label for="window-select">Look back</label>
      <select id="window-select">${r}</select>
      <span class="controls-divider">·</span>
      <label for="min-games-select">Min games per role</label>
      <select id="min-games-select">${s}</select>
    </div>
    <div class="grid">
      ${o.map(n=>N(n,t[n]??[])).join("")}
    </div>`}function v(e){var s;const t=document.getElementById("app");t.innerHTML=`
    <header>
      <h1>MCM League Tracker</h1>
      <div class="meta">
        Refreshed ${w(e.lastRefreshed??e.lastUpdated??"")}
        · Last game ${e.lastGameAt?w(e.lastGameAt):"unknown"}
        · ${e.players.length} players tracked
      </div>
      <div class="tabs">
        <button class="tab-btn ${m==="stats"?"active":""}" data-tab="stats">📊 Stats</button>
        <button class="tab-btn ${m==="builder"?"active":""}" data-tab="builder">⚙️ Team Builder</button>
      </div>
    </header>

    <div id="tab-stats"   class="tab-panel ${m==="stats"?"":"hidden"}">
      ${x(e)}
    </div>
    <div id="tab-builder" class="tab-panel ${m==="builder"?"":"hidden"}">
      ${G(e)}
    </div>`,t.querySelectorAll(".tab-btn").forEach(a=>{a.addEventListener("click",()=>{m=a.dataset.tab,v(e)})});const o=document.getElementById("window-select");o==null||o.addEventListener("change",()=>{f=parseInt(o.value,10),v(e)});const l=document.getElementById("min-games-select");l==null||l.addEventListener("change",()=>{b=parseInt(l.value,10),v(e)}),t.querySelectorAll(".toggle-btn").forEach(a=>{a.addEventListener("click",()=>{const n=a.dataset.card,i=document.getElementById(`card-${n}`).querySelector(".games-list"),p=a.querySelector(".toggle-icon");if(!i)return;const d=i.classList.toggle("open");p.textContent=d?"▴":"▾"})});function r(){const a=[...document.querySelectorAll(".tb-player-cb")],n=a.filter(c=>c.checked).length;for(const c of a)c.checked||(c.disabled=n>=5)}document.querySelectorAll(".tb-player-cb").forEach(a=>{a.addEventListener("change",r)}),(s=document.getElementById("tb-solve-btn"))==null||s.addEventListener("click",()=>{const a=[...document.querySelectorAll(".tb-player-cb:checked")].map(d=>parseInt(d.dataset.idx,10)),n=parseInt(document.getElementById("tb-min-games").value,10)||1,c=a.map(d=>e.players[d]).filter(Boolean);if(c.length===0){document.getElementById("tb-result").innerHTML='<div class="tb-msg">Select at least one player.</div>';return}const i=B(c,n),p=i.reduce((d,u)=>d+(u.score??0),0);document.getElementById("tb-result").innerHTML=j(i,p)})}async function T(){try{const e=await fetch("./data/cache.json");if(!e.ok)throw new Error(`HTTP ${e.status}`);const t=await e.json();v(t)}catch(e){document.getElementById("app").innerHTML=`
      <div class="error">
        Failed to load data. Run <code>npm run refresh</code> then <code>npm run build</code>.
      </div>`,console.error(e)}}T();
