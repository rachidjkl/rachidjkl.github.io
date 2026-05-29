const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, i * 100);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

async function checkPwned() {
  const input = document.getElementById('pwned-email');
  const btn = document.getElementById('pwned-btn');
  const btnText = document.getElementById('pwned-btn-text');
  const spinner = document.getElementById('pwned-spinner');
  const result = document.getElementById('pwned-result');
  const email = input.value.trim().toLowerCase();

  if (!email || !email.includes('@')) {
    result.className = 'pwned-result pwned-warn';
    result.innerHTML = '<span>⚠️ Introduce un email válido.</span>';
    return;
  }

  btn.disabled = true;
  btnText.textContent = 'Comprobando...';
  spinner.classList.remove('hidden');
  result.className = 'pwned-result hidden';

  try {
    const response = await fetch(`https://api.xposedornot.com/v1/breach-analytics?email=${encodeURIComponent(email)}`);

    spinner.classList.add('hidden');
    btn.disabled = false;
    btnText.textContent = 'Comprobar';

    // 404 = email limpio
    if (response.status === 404) {
      result.className = 'pwned-result pwned-safe';
      result.innerHTML = `
        <div class="pwned-result-icon">✅</div>
        <div class="pwned-result-body">
          <div class="pwned-result-title">¡Estás a salvo!</div>
          <div class="pwned-result-desc">
            Tu email no aparece en ninguna filtración conocida. Aun así, usa contraseñas únicas y un gestor de contraseñas.
          </div>
        </div>`;
      return;
    }

    if (!response.ok) throw new Error('Error API');

    const data = await response.json();
    const breaches = data.ExposedBreaches?.breaches_details || [];
    const risk = data.BreachMetrics?.risk?.[0] || {};
    const riskScore = risk.risk_score || 0;
    const riskLabel = risk.risk_label || '';

    if (breaches.length > 0) {
      const riskColor = riskScore >= 70 ? '#e24b4a' : riskScore >= 40 ? '#ef9f27' : '#00E5A0';

      const breachCards = breaches.map(b => `
        <div class="breach-card">
          <div class="breach-card-header">
            ${b.logo ? `<img src="${b.logo}" class="breach-logo" onerror="this.style.display='none'">` : ''}
            <div>
              <div class="breach-card-name">${b.breach}</div>
              <div class="breach-card-date">${b.domain} · ${b.xposed_date}</div>
            </div>
            <span class="breach-card-risk breach-risk-${b.password_risk}">${b.password_risk}</span>
          </div>
          <div class="breach-card-data">${b.xposed_data.split(';').map(d => `<span class="breach-data-tag">${d.trim()}</span>`).join('')}</div>
        </div>
      `).join('');

      result.className = 'pwned-result pwned-danger';
      result.innerHTML = `
        <div style="width:100%">
          <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.2rem">
            <div class="pwned-result-icon">☠️</div>
            <div>
              <div class="pwned-result-title">¡Comprometido en ${breaches.length} filtración${breaches.length > 1 ? 'es' : ''}!</div>
            </div>
            <div class="pwned-risk-badge" style="margin-left:auto;color:${riskColor};border-color:${riskColor}">
              ${riskLabel} · ${riskScore}/100
            </div>
          </div>
          <div class="breach-cards-list">${breachCards}</div>
          <div class="pwned-result-desc" style="margin-top:1rem">
            <strong>Acción recomendada:</strong> cambia tus contraseñas en los servicios afectados y activa la autenticación en dos pasos (2FA).
          </div>
        </div>`;
    } else {
      result.className = 'pwned-result pwned-safe';
      result.innerHTML = `
        <div class="pwned-result-icon">✅</div>
        <div class="pwned-result-body">
          <div class="pwned-result-title">¡Estás a salvo!</div>
          <div class="pwned-result-desc">
            Tu email no aparece en ninguna filtración conocida. Aun así, usa contraseñas únicas y un gestor de contraseñas.
          </div>
        </div>`;
    }
  } catch (e) {
    spinner.classList.add('hidden');
    btn.disabled = false;
    btnText.textContent = 'Comprobar';
    result.className = 'pwned-result pwned-warn';
    result.innerHTML = '<span>⚠️ No se pudo conectar con la API. Inténtalo de nuevo más tarde.</span>';
  }
}

document.getElementById('pwned-email').addEventListener('keydown', e => {
  if (e.key === 'Enter') checkPwned();
});

// ══════════════════════════════════
// SCANNER DEMO
// ══════════════════════════════════
const DEMO_DATA = {
  "45.33.32.156":    "scanme",
  "scanme.nmap.org": "scanme",
  "192.168.1.1":     "router",
  "10.0.0.1":        "router",
  "default":         "scanme"
};

const PRESETS = {
  scanme: {
    ip: "45.33.32.156",
    hostname: "scanme.nmap.org",
    services: [
      {
        port: "22", proto: "tcp", service: "ssh", product: "OpenSSH", version: "6.6.1p1",
        badge: "alto",
        cves: [
          { id: "CVE-2016-0777", score: 7.8, cls: "score-alto", desc: "Memory disclosure vulnerability in the client roaming feature of OpenSSH." },
          { id: "CVE-2016-6515", score: 7.5, cls: "score-alto", desc: "Auth password field denial of service via long string in OpenSSH." },
          { id: "CVE-2015-5600", score: 8.5, cls: "score-alto", desc: "MaxAuthTries limit bypass in OpenSSH 6.x before 6.9 via keyboard-interactive." }
        ]
      },
      {
        port: "80", proto: "tcp", service: "http", product: "Apache httpd", version: "2.4.7",
        badge: "critico",
        cves: [
          { id: "CVE-2017-7679", score: 9.8, cls: "score-critico", desc: "mod_mime buffer overread — allows attacker to read past end of buffer." },
          { id: "CVE-2017-9798", score: 7.5, cls: "score-alto",    desc: "Optionsbleed: HTTP OPTIONS method can leak memory if Limit directive is used." },
          { id: "CVE-2021-41773", score: 9.8, cls: "score-critico", desc: "Path traversal and RCE in Apache 2.4.49 via specially crafted requests." }
        ]
      },
      {
        port: "443", proto: "tcp", service: "https", product: "Apache httpd", version: "2.4.7",
        badge: "critico",
        cves: [
          { id: "CVE-2022-22720", score: 9.8, cls: "score-critico", desc: "HTTP request smuggling via failure to flush forward proxy error body." },
          { id: "CVE-2021-42013", score: 9.8, cls: "score-critico", desc: "Path traversal beyond root via %2e%2e in Apache 2.4.49/50." }
        ]
      },
      {
        port: "31337", proto: "tcp", service: "Elite", product: "ncat", version: "7.80",
        badge: "seguro",
        cves: []
      }
    ]
  },
  router: {
    ip: "192.168.1.1",
    hostname: "gateway.local",
    services: [
      {
        port: "22", proto: "tcp", service: "ssh", product: "Dropbear sshd", version: "2019.78",
        badge: "medio",
        cves: [
          { id: "CVE-2020-36254", score: 5.3, cls: "score-medio", desc: "Dropbear SSH server allows bypass of authentication in certain configurations." }
        ]
      },
      {
        port: "80", proto: "tcp", service: "http", product: "lighttpd", version: "1.4.53",
        badge: "alto",
        cves: [
          { id: "CVE-2019-11072", score: 7.3, cls: "score-alto", desc: "lighttpd before 1.4.54 has a signed integer overflow in http_request_parse." }
        ]
      },
      {
        port: "53", proto: "tcp", service: "dns", product: "dnsmasq", version: "2.80",
        badge: "critico",
        cves: [
          { id: "CVE-2020-25681", score: 9.8, cls: "score-critico", desc: "Heap-based buffer overflow in dnsmasq before 2.83 — remote code execution." },
          { id: "CVE-2020-25684", score: 4.0, cls: "score-medio",   desc: "Insufficient randomness in TXID and source port in dnsmasq DNS." }
        ]
      },
      {
        port: "443", proto: "tcp", service: "https", product: "mini_httpd", version: "1.30",
        badge: "seguro",
        cves: []
      }
    ]
  }
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function addLine(text, cls = '') {
  const out = document.getElementById('terminal-output');
  const div = document.createElement('div');
  div.className = 't-line' + (cls ? ' ' + cls : '');
  div.textContent = text;
  out.appendChild(div);
  const body = document.getElementById('terminal-body');
  body.scrollTop = body.scrollHeight;
}

async function typeLines(lines, delay = 40) {
  for (const [text, cls] of lines) {
    addLine(text, cls);
    await sleep(delay + Math.random() * 60);
  }
}

async function iniciarDemo() {
  const ipInput = document.getElementById('scanner-ip');
  const ip = ipInput ? ipInput.value.trim() || '45.33.32.156' : '45.33.32.156';

  // Bloquear input y botones
  if (ipInput) ipInput.disabled = true;
  document.querySelectorAll('.t-enter-btn, #demo-btn').forEach(b => b.disabled = true);

  // Limpiar output anterior
  document.getElementById('terminal-output').innerHTML = '';
  document.getElementById('scanner-result').className = 'scanner-result hidden';

  // Elegir preset
  const key = DEMO_DATA[ip.toLowerCase()] || 'scanme';
  const data = PRESETS[key];
  const displayIp = ip || data.ip;

  await sleep(300);
  addLine(`→ ${displayIp}`, 'green');
  await sleep(500);

  // Paso 1: ping
  addLine('');
  addLine('[*] Comprobando si el host está activo (-sP) ...', '');
  await sleep(1200);
  addLine(`[+] Host ${displayIp} activo.`, 'green');
  await sleep(400);

  // Paso 2: escaneo
  addLine('');
  addLine('[*] Escaneando todos los puertos con -sCV ...', '');
  addLine('    Por favor espera, no cierres la terminal...', 'yellow');
  await sleep(600);

  for (let i = 0; i < 4; i++) {
    await sleep(500 + Math.random() * 400);
    addLine(`    Scanning ${displayIp} [${Math.floor(Math.random()*60000 + 1000)} ports]`, 'muted');
  }

  await sleep(800);
  addLine('[+] Escaneo completado.', 'green');
  await sleep(400);

  // Paso 3: resultados de puertos
  addLine('');
  addLine('[*] Analizando resultados del escaneo ...', '');
  await sleep(500);

  for (const svc of data.services) {
    await sleep(300 + Math.random() * 200);
    addLine(`  ABIERTO  ${svc.port}/${svc.proto}  ${svc.product} ${svc.version}`, 'cyan');
  }

  addLine(`[*] Total puertos abiertos: ${data.services.length}`, '');
  await sleep(500);

  // Paso 4: CVEs
  addLine('');
  addLine(`[*] Buscando vulnerabilidades en NVD para ${data.services.length} servicios ...`, '');
  await sleep(400);

  let totalCves = 0;
  for (const svc of data.services) {
    await sleep(600 + Math.random() * 500);
    addLine(`  [*] ${svc.port}/${svc.proto} → ${svc.product} ${svc.version}`, '');
    await sleep(400);
    if (svc.cves.length > 0) {
      const top = Math.max(...svc.cves.map(c => c.score));
      const cls = top >= 9 ? 'red' : top >= 7 ? 'yellow' : 'cyan';
      addLine(`  [+] ${svc.cves.length} CVEs encontrados | Score máx: ${top}`, cls);
      totalCves += svc.cves.length;
    } else {
      addLine('  [+] Sin vulnerabilidades conocidas ✓', 'green');
    }
  }

  await sleep(500);

  // Paso 5: informe
  addLine('');
  const criticos = data.services.reduce((a, s) => a + s.cves.filter(c => c.score >= 9).length, 0);
  const altos    = data.services.reduce((a, s) => a + s.cves.filter(c => c.score >= 7 && c.score < 9).length, 0);
  addLine('════════════════════════════════════════════', 'cyan');
  addLine(`[+] Informe generado: informe_${displayIp.replace(/\./g,'_')}.html`, 'green');
  addLine(`  Puertos abiertos  : ${data.services.length}`, '');
  addLine(`  CVEs encontrados  : ${totalCves}`, '');
  addLine(`  Críticos (≥9.0)   : ${criticos}`, criticos > 0 ? 'red' : 'green');
  addLine('════════════════════════════════════════════', 'cyan');

  await sleep(600);

  // Mostrar resultado visual
  mostrarResultado(data, displayIp, totalCves, criticos, altos);

  // Reactivar botones
  document.querySelectorAll('.t-enter-btn, #demo-btn').forEach(b => b.disabled = false);
  if (ipInput) ipInput.disabled = false;
}

function mostrarResultado(data, ip, totalCves, criticos, altos) {
  const medios  = data.services.reduce((a, s) => a + s.cves.filter(c => c.score >= 4 && c.score < 7).length, 0);
  const seguros = data.services.filter(s => s.cves.length === 0).length;

  let portsHtml = '';
  data.services.forEach((svc, idx) => {
    const cveRows = svc.cves.map(c => `
      <div class="sr-cve-item">
        <span class="sr-cve-id">${c.id}</span>
        <span class="sr-cve-score ${c.cls}">${c.score}</span>
        <span class="sr-cve-desc">${c.desc}</span>
      </div>`).join('');

    portsHtml += `
      <div>
        <div class="sr-port-row" onclick="toggleSrCves(${idx})">
          <span class="sr-port-num">${svc.port}/${svc.proto}</span>
          <span class="sr-port-svc">${svc.service}</span>
          <span class="sr-port-prod">${svc.product} ${svc.version}</span>
          <span class="sr-badge ${svc.badge}">${svc.badge === 'critico' ? '⚠ CRÍTICO' : svc.badge === 'alto' ? '▲ ALTO' : svc.badge === 'medio' ? '● MEDIO' : '✓ SEGURO'} ${svc.cves.length > 0 ? '('+svc.cves.length+')' : ''}</span>
        </div>
        <div class="sr-cves-detail" id="sr-cves-${idx}">${cveRows}</div>
      </div>`;
  });

  const el = document.getElementById('scanner-result');
  el.className = 'scanner-result';
  el.innerHTML = `
    <div class="sr-header">
      <span>🎯 ${ip} — ${data.hostname}</span>
      <span style="color:#3fb950">● INFORME GENERADO</span>
    </div>
    <div class="sr-stats">
      <div class="sr-stat">
        <span class="sr-stat-num" style="color:#79c0ff">${data.services.length}</span>
        <span class="sr-stat-lbl">Puertos</span>
      </div>
      <div class="sr-stat">
        <span class="sr-stat-num" style="color:#c9d1d9">${totalCves}</span>
        <span class="sr-stat-lbl">CVEs</span>
      </div>
      <div class="sr-stat">
        <span class="sr-stat-num" style="color:#f85149">${criticos}</span>
        <span class="sr-stat-lbl">Críticos</span>
      </div>
      <div class="sr-stat">
        <span class="sr-stat-num" style="color:#f0883e">${altos}</span>
        <span class="sr-stat-lbl">Altos</span>
      </div>
      <div class="sr-stat">
        <span class="sr-stat-num" style="color:#3fb950">${seguros}</span>
        <span class="sr-stat-lbl">Seguros</span>
      </div>
    </div>
    <div class="sr-ports">${portsHtml}</div>
    <div style="padding:0.6rem 1rem;font-size:0.65rem;color:#484f58;border-top:1px solid #1c2128;">
      Haz clic en cada puerto para ver los CVEs detallados
    </div>`;
}

function toggleSrCves(idx) {
  const el = document.getElementById('sr-cves-' + idx);
  if (!el) return;
  el.style.display = el.style.display === 'block' ? 'none' : 'block';
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('scanner-ip');
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') iniciarDemo();
    });
  }
});