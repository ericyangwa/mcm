(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))r(o);new MutationObserver(o=>{for(const t of o)if(t.type==="childList")for(const n of t.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&r(n)}).observe(document,{childList:!0,subtree:!0});function a(o){const t={};return o.integrity&&(t.integrity=o.integrity),o.referrerPolicy&&(t.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?t.credentials="include":o.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function r(o){if(o.ep)return;o.ep=!0;const t=a(o);fetch(o.href,t)}})();let g=20,u="stats";const m=["top","jungle","mid","bot","support"],b={top:"Top",jungle:"Jungle",mid:"Mid",bot:"Bot",support:"Support",flex:"Flex"},$={top:"🛡️",jungle:"🌿",mid:"⚡",bot:"🏹",support:"💙",flex:"🔀"},S={IRON:"#6a6a6a",BRONZE:"#a05000",SILVER:"#6a7f9a",GOLD:"#e5a330",PLATINUM:"#00b4b4",EMERALD:"#00c080",DIAMOND:"#576bce",MASTER:"#9d4dc6",GRANDMASTER:"#e84057",CHALLENGER:"#f4c874"},O={1:"I",2:"II",3:"III",4:"IV"},E={na1:"na",euw1:"euw",eune1:"eune",kr:"kr",br1:"br",la1:"lan",la2:"las",oc1:"oce",tr1:"tr",ru:"ru",jp1:"jp"};function y(e){return`https://www.op.gg/summoners/${E[e.region]??e.region.toLowerCase()}/${encodeURIComponent(e.gameName)}-${e.tagLine}`}function k(e){const s=O[e.division]??"";return`${e.tier.charAt(0)+e.tier.slice(1).toLowerCase()}${s?` ${s}`:""}`}function I(e){const s=e.wins+e.losses;return s?`${Math.round(e.wins/s*100)}%`:"0%"}function v(e){return e>=7?"#f4c874":e>=6?"#00c080":e>=5?"#4a9eff":e>=4?"#e5a330":"#e84057"}function M(e){const s=Math.floor((Date.now()-new Date(e).getTime())/6e4);if(s<1)return"just now";if(s<60)return`${s}m ago`;const a=Math.floor(s/60);return a<24?`${a}h ago`:`${Math.floor(a/24)}d ago`}function w(e){const s={};for(const r of e)!r.position||r.opScore==null||(s[r.position]||(s[r.position]=[]),s[r.position].push(r.opScore));const a={};for(const[r,o]of Object.entries(s)){const t=o.reduce((n,l)=>n+l,0)/o.length;a[r]={avgOpScore:Math.round(t*100)/100,games:o.length}}return a}function R(e){if(e.opScore==null)return"";const s=e.result==="WIN",a=e.result==="WIN"?"win":e.result==="LOSE"?"loss":"",r=v(e.opScore),o=e.champion??"?",t=e.createdAt?new Date(e.createdAt).toLocaleDateString(void 0,{month:"short",day:"numeric"}):"";return`
    <div class="game-row ${a}">
      <span class="game-result-dot" title="${e.result??""}">${s?"▲":"▼"}</span>
      <span class="game-champion">${o}</span>
      <span class="game-score" style="color:${r}">${e.opScore.toFixed(2)}</span>
      <span class="game-date">${t}</span>
    </div>`}function C(e,s,a){const r=e.rank?S[e.rank.tier]??"#888":"#555",o=v(a.avgOpScore),t=e.rank?`<div class="rank" style="color:${r}">
         ${k(e.rank)}<span class="lp">${e.rank.lp} LP</span>
       </div>
       <div class="winrate">${I(e.rank)} WR · ${e.rank.wins}W ${e.rank.losses}L</div>`:'<div class="rank unranked">Unranked</div>',n=e.recentGames.slice(0,g).filter(i=>i.position===s),l=n.length?`<div class="games-list">${n.map(R).join("")}</div>`:"",c=`${e.gameName}-${e.tagLine}-${s}`.replace(/[^a-zA-Z0-9-]/g,"_");return`
    <div class="card" id="card-${c}">
      <div class="card-header">
        <a class="player-name" href="${y(e)}" target="_blank" rel="noopener">
          ${e.gameName}<span class="tag">#${e.tagLine}</span>
        </a>
        <button class="toggle-btn" data-card="${c}" title="Show games">
          <span class="toggle-icon">▾</span>
        </button>
      </div>

      <div class="op-score" style="color:${o}">
        ${a.avgOpScore.toFixed(2)}
        <span class="op-label">OP Score</span>
      </div>
      <span class="sample-size">${a.games} game${a.games!==1?"s":""} as ${b[s]}</span>

      ${t}
      ${l}
    </div>`}function N(e,s){const a=[...s].sort((r,o)=>o.score.avgOpScore-r.score.avgOpScore);return`
    <div class="column">
      <div class="column-header">
        <span class="role-icon">${$[e]}</span>
        ${b[e]}
        <span class="player-count">${s.length}</span>
      </div>
      ${a.length?a.map(({player:r,score:o})=>C(r,e,o)).join(""):'<div class="empty">No players</div>'}
    </div>`}function A(e,s){const a=e.map(n=>{const l=w(n.recentGames.slice(0,g));return m.flatMap(c=>{const i=l[c];return!i||i.games<s?[]:[{role:c,avgOpScore:i.avgOpScore,games:i.games}]})});let r=-1/0,o=new Map;function t(n,l,c,i){if(n===m.length){i>r&&(r=i,o=new Map(c));return}const d=m[n];t(n+1,l,c,i);for(let p=0;p<e.length;p++){if(l.has(p))continue;const f=a[p].find(L=>L.role===d);f&&(c.set(d,{player:e[p],score:f.avgOpScore,games:f.games}),l.add(p),t(n+1,l,c,i+f.avgOpScore),l.delete(p),c.delete(d))}}return t(0,new Set,new Map,0),m.map(n=>{const l=o.get(n);return l?{role:n,player:l.player,score:l.score,games:l.games}:{role:n,player:null,score:null,games:0}})}function B(e){return`
    <div class="tb-wrapper">
      <div class="tb-controls">
        <div class="tb-section-label">Players</div>
        <div class="tb-players">${e.players.map((a,r)=>`
    <label class="tb-player-check">
      <input type="checkbox" class="tb-player-cb" data-idx="${r}" />
      <span class="tb-player-label">${a.gameName}<span class="tag">#${a.tagLine}</span></span>
    </label>`).join("")}</div>

        <div class="tb-row">
          <label class="tb-section-label" for="tb-min-games">Min games per role</label>
          <input id="tb-min-games" type="number" class="tb-number-input" value="3" min="1" max="200" />
        </div>

        <button id="tb-solve-btn" class="tb-btn">⚡ Find Best Lineup</button>
      </div>

      <div id="tb-result" class="tb-result-area"></div>
    </div>`}function j(e,s){const a=e.filter(t=>t.player).length,r=a?v(s/a):"#888",o=e.map(t=>{if(!t.player||t.score==null)return`
        <div class="lineup-row lineup-empty">
          <span class="lineup-role-icon">${$[t.role]}</span>
          <span class="lineup-role-name">${b[t.role]}</span>
          <span class="lineup-player muted">— No eligible player</span>
          <span></span>
        </div>`;const n=v(t.score);return`
      <div class="lineup-row">
        <span class="lineup-role-icon">${$[t.role]}</span>
        <span class="lineup-role-name">${b[t.role]}</span>
        <a class="lineup-player player-name" href="${y(t.player)}" target="_blank" rel="noopener">
          ${t.player.gameName}<span class="tag">#${t.player.tagLine}</span>
        </a>
        <span class="lineup-score" style="color:${n}">
          ${t.score.toFixed(2)}
          <span class="lineup-games">${t.games}g</span>
        </span>
      </div>`}).join("");return`
    <div class="lineup-card">
      <div class="lineup-header">
        Best lineup &mdash;
        <span style="color:${r}">${s.toFixed(2)}</span>
        <span class="muted"> total · ${a} role${a!==1?"s":""} filled</span>
      </div>
      ${o}
    </div>`}function x(e){var t;const s={};for(const n of e.players){const l=n.recentGames.slice(0,g),c=w(l);for(const[i,d]of Object.entries(c))s[i]||(s[i]=[]),s[i].push({player:n,score:d})}const a=[...m];(t=s.flex)!=null&&t.length&&a.push("flex");const r=Math.max(...e.players.map(n=>n.recentGames.length),20);return`
    <div class="controls">
      <label for="window-select">Look back</label>
      <select id="window-select">${[5,10,20,50,100,200].filter(n=>n<=r||n===20).map(n=>`<option value="${n}" ${n===g?"selected":""}>${n} games</option>`).join("")}</select>
    </div>
    <div class="grid">
      ${a.map(n=>N(n,s[n]??[])).join("")}
    </div>`}function h(e){var o;const s=document.getElementById("app");s.innerHTML=`
    <header>
      <h1>MCM League Tracker</h1>
      <div class="meta">
        Updated ${M(e.lastUpdated)} · ${e.players.length} players tracked
      </div>
      <div class="tabs">
        <button class="tab-btn ${u==="stats"?"active":""}" data-tab="stats">📊 Stats</button>
        <button class="tab-btn ${u==="builder"?"active":""}" data-tab="builder">⚙️ Team Builder</button>
      </div>
    </header>

    <div id="tab-stats"   class="tab-panel ${u==="stats"?"":"hidden"}">
      ${x(e)}
    </div>
    <div id="tab-builder" class="tab-panel ${u==="builder"?"":"hidden"}">
      ${B(e)}
    </div>`,s.querySelectorAll(".tab-btn").forEach(t=>{t.addEventListener("click",()=>{u=t.dataset.tab,h(e)})});const a=document.getElementById("window-select");a==null||a.addEventListener("change",()=>{g=parseInt(a.value,10),h(e)}),s.querySelectorAll(".toggle-btn").forEach(t=>{t.addEventListener("click",()=>{const n=t.dataset.card,c=document.getElementById(`card-${n}`).querySelector(".games-list"),i=t.querySelector(".toggle-icon");if(!c)return;const d=c.classList.toggle("open");i.textContent=d?"▴":"▾"})});function r(){const t=[...document.querySelectorAll(".tb-player-cb")],n=t.filter(l=>l.checked).length;for(const l of t)l.checked||(l.disabled=n>=5)}document.querySelectorAll(".tb-player-cb").forEach(t=>{t.addEventListener("change",r)}),(o=document.getElementById("tb-solve-btn"))==null||o.addEventListener("click",()=>{const t=[...document.querySelectorAll(".tb-player-cb:checked")].map(d=>parseInt(d.dataset.idx,10)),n=parseInt(document.getElementById("tb-min-games").value,10)||1,l=t.map(d=>e.players[d]).filter(Boolean);if(l.length===0){document.getElementById("tb-result").innerHTML='<div class="tb-msg">Select at least one player.</div>';return}const c=A(l,n),i=c.reduce((d,p)=>d+(p.score??0),0);document.getElementById("tb-result").innerHTML=j(c,i)})}async function T(){try{const e=await fetch("./data/cache.json");if(!e.ok)throw new Error(`HTTP ${e.status}`);const s=await e.json();h(s)}catch(e){document.getElementById("app").innerHTML=`
      <div class="error">
        Failed to load data. Run <code>npm run refresh</code> then <code>npm run build</code>.
      </div>`,console.error(e)}}T();
