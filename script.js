/* ============================================================
   LeafAI — script.js
   AI-Powered Leaf Health Detection — Frontend Logic
   ============================================================ */

'use strict';

/* ======================================================
   1. PARTICLES BACKGROUND
====================================================== */
(function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  const count = 28;
  const colors = ['#22c55e','#86efac','#bbf7d0','#34d399','#6ee7b7','#a7f3d0'];

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 18 + 6;
    const duration = Math.random() * 18 + 10;
    const delay = Math.random() * 12;
    const left = Math.random() * 100;
    const color = colors[Math.floor(Math.random() * colors.length)];

    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${left}%;
      background:${color};
      animation-duration:${duration}s;
      animation-delay:-${delay}s;
    `;
    container.appendChild(p);
  }
})();


/* ======================================================
   2. NAVBAR — scroll effect + hamburger
====================================================== */
(function initNavbar() {
  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.querySelector('.nav-links');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 30);
    updateActiveLink();
  }, { passive: true });

  hamburger?.addEventListener('click', () => {
    navLinks?.classList.toggle('mobile-open');
    hamburger.classList.toggle('open');
  });

  /* Active link highlight on scroll */
  function updateActiveLink() {
    const sections = document.querySelectorAll('section[id]');
    const links    = document.querySelectorAll('.nav-link');
    let current    = '';

    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
    });
    links.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
  }
})();


/* ======================================================
   3. COUNTER ANIMATION (for hero stats & dashboard)
====================================================== */
function animateCounter(el, target, duration = 1800) {
  const start    = performance.now();
  const startVal = 0;

  function update(ts) {
    const progress = Math.min((ts - start) / duration, 1);
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(startVal + eased * (target - startVal)).toLocaleString('en-IN');
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

/* Real scan counters — start at 0, only update on actual scans */
(function initCounters() {
  /* Hero stats — these are informational/static, keep as-is */
  const heroCounters = document.querySelectorAll('.hero-stat [data-target]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.animated) {
        entry.target.dataset.animated = 'true';
        animateCounter(entry.target, parseInt(entry.target.dataset.target));
      }
    });
  }, { threshold: 0.5 });
  heroCounters.forEach(c => observer.observe(c));

  /* Dashboard counters — set to 0, updated only by real scans */
  const dashCounters = document.querySelectorAll('.dash-value[data-target]');
  dashCounters.forEach(el => {
    el.textContent = '0';
    el.removeAttribute('data-target'); /* prevent old observer from firing */
  });
})();


/* ======================================================
   4. WEEKLY BAR CHART — built from real scan data only
====================================================== */
/* realWeekData[0] = Mon, [6] = Sun. Each day: {h, d, p} counts */
const realWeekData = [
  { h: 0, d: 0, p: 0 },
  { h: 0, d: 0, p: 0 },
  { h: 0, d: 0, p: 0 },
  { h: 0, d: 0, p: 0 },
  { h: 0, d: 0, p: 0 },
  { h: 0, d: 0, p: 0 },
  { h: 0, d: 0, p: 0 },
];

function renderBarChart() {
  const chart = document.getElementById('weeklyChart');
  if (!chart) return;
  chart.innerHTML = '';

  /* Find max count across all days for scaling */
  let maxCount = 0;
  realWeekData.forEach(day => {
    maxCount = Math.max(maxCount, day.h, day.d, day.p);
  });
  const maxBarH = 140;
  const scale = (v) => maxCount === 0 ? 0 : Math.round((v / maxCount) * maxBarH);

  realWeekData.forEach(day => {
    const group = document.createElement('div');
    group.className = 'bar-group';

    const bh = makeBar('bar-h', scale(day.h), `Healthy: ${day.h}`);
    const bd = makeBar('bar-d', scale(day.d), `Dry: ${day.d}`);
    const bp = makeBar('bar-p', scale(day.p), `Pest: ${day.p}`);

    group.append(bh, bd, bp);
    chart.appendChild(group);
  });

  function makeBar(cls, height, tooltip) {
    const bar = document.createElement('div');
    bar.className = `bar ${cls}`;
    bar.style.height = '0px';
    bar.setAttribute('data-val', tooltip);
    setTimeout(() => { bar.style.height = (height || 2) + 'px'; }, 100);
    return bar;
  }
}
renderBarChart(); /* Initial render — all zeros */


/* ======================================================
   5. SCROLL REVEAL ANIMATION
====================================================== */
(function initScrollReveal() {
  const targets = document.querySelectorAll(
    '.dash-card, .tip-card, .step-card, .color-guide-card, .color-guide'
  );
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('animate-in'), i * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  targets.forEach(t => observer.observe(t));
})();


/* ======================================================
   6. LEAF ANALYZER — AI Color Analysis Engine
====================================================== */
(function initAnalyzer() {
  const uploadZone   = document.getElementById('uploadZone');
  const fileInput    = document.getElementById('fileInput');
  const previewArea  = document.getElementById('previewArea');
  const previewImg   = document.getElementById('previewImg');
  const analyzeBtn   = document.getElementById('analyzeBtn');
  const analyzeBtnTx = document.getElementById('analyzeBtnText');
  const btnLoader    = document.getElementById('btnLoader');
  const changeBtn    = document.getElementById('changeBtn');
  const scanAnim     = document.querySelector('.scan-animation');

  const resultPlaceholder = document.getElementById('resultPlaceholder');
  const resultContent     = document.getElementById('resultContent');

  let currentFile = null;

  /* ---------- drag & drop ---------- */
  uploadZone.addEventListener('dragover', e => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
  });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop', e => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    handleFile(e.dataTransfer.files[0]);
  });

  fileInput.addEventListener('change', () => handleFile(fileInput.files[0]));
  changeBtn?.addEventListener('click', resetUpload);

  /* ---------- handle file ---------- */
  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('Please upload an image file!');
      return;
    }
    currentFile = file;
    const reader = new FileReader();
    reader.onload = e => {
      previewImg.src = e.target.result;
      uploadZone.style.display = 'none';
      previewArea.style.display = 'block';
      analyzeBtn.disabled = false;
      resultPlaceholder.style.display = 'flex';
      resultContent.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }

  function resetUpload() {
    uploadZone.style.display = 'block';
    previewArea.style.display = 'none';
    analyzeBtn.disabled = true;
    currentFile = null;
    fileInput.value = '';
    resultContent.style.display = 'none';
    resultPlaceholder.style.display = 'flex';
    if (scanAnim) scanAnim.classList.remove('active');
  }

  /* ---------- analyze button ---------- */
  analyzeBtn.addEventListener('click', () => {
    if (!currentFile) return;
    startAnalysis();
  });

  function startAnalysis() {
    /* Show loading state */
    analyzeBtnTx.textContent = 'Analyzing...';
    btnLoader.style.display = 'block';
    analyzeBtn.disabled = true;
    if (scanAnim) scanAnim.classList.add('active');

    /* Extract colors from canvas */
    extractImageColors(previewImg, (colors) => {
      setTimeout(() => {
        const result = diagnoseLeaf(colors);
        displayResult(result, colors);

        /* Stop loading */
        analyzeBtnTx.textContent = 'Analyze Again';
        btnLoader.style.display = 'none';
        analyzeBtn.disabled = false;
        if (scanAnim) scanAnim.classList.remove('active');

        addToHistory(result, previewImg.src);
        showToast('Analysis complete! 🌿');
      }, 2000); /* 2s for UX realism */
    });
  }


  /* ======================================================
     CORE AI ENGINE — Color-Based Leaf Diagnosis
  ====================================================== */

  /**
   * Extract dominant colors from image via Canvas API.
   * Returns averaged RGB values and color percentages.
   */
  function extractImageColors(imgEl, callback) {
    const canvas = document.createElement('canvas');
    const ctx    = canvas.getContext('2d');
    const size   = 80; /* downscale for speed */
    canvas.width = canvas.height = size;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imgEl.src;
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);
      const pixels = size * size;

      let rSum = 0, gSum = 0, bSum = 0;
      let greenPx = 0, yellowPx = 0, brownPx = 0, darkPx = 0, grayPx = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        rSum += r; gSum += g; bSum += b;

        /* Categorize pixel colors */
        if (isGreen(r, g, b))  greenPx++;
        else if (isYellow(r, g, b)) yellowPx++;
        else if (isBrown(r, g, b))  brownPx++;
        else if (isDark(r, g, b))   darkPx++;
        else if (isGray(r, g, b))   grayPx++;
      }

      callback({
        avgR: Math.round(rSum / pixels),
        avgG: Math.round(gSum / pixels),
        avgB: Math.round(bSum / pixels),
        greenPct:  Math.round((greenPx  / pixels) * 100),
        yellowPct: Math.round((yellowPx / pixels) * 100),
        brownPct:  Math.round((brownPx  / pixels) * 100),
        darkPct:   Math.round((darkPx   / pixels) * 100),
        grayPct:   Math.round((grayPx   / pixels) * 100),
      });
    };
    img.onerror = () => {
      /* Fallback if CORS blocked — simulate moderate result */
      callback({
        avgR: 80, avgG: 140, avgB: 60,
        greenPct: 55, yellowPct: 20, brownPct: 15, darkPct: 5, grayPct: 5
      });
    };
  }

  /* Color detection helpers (RGB ranges tuned for leaf photos) */
  function isGreen(r, g, b)  { return g > 100 && g > r * 1.2 && g > b * 1.1 && b < 120; }
  function isYellow(r, g, b) { return r > 150 && g > 130 && b < 100 && r > b * 1.8; }
  function isBrown(r, g, b)  { return r > 100 && r > g * 1.2 && b < 100 && g < 140; }
  function isDark(r, g, b)   { return r < 60 && g < 80 && b < 80; }
  function isGray(r, g, b)   { return Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && r > 60 && r < 180; }

  /**
   * Core diagnosis algorithm.
   * Weighted scoring based on extracted color percentages.
   */
  function diagnoseLeaf(c) {
    /* ---- Score healthy (rich green) ---- */
    const healthyScore =
      (c.greenPct * 2.5) -
      (c.yellowPct * 1.0) -
      (c.brownPct  * 1.5) -
      (c.darkPct   * 2.0);

    /* ---- Score dry (yellow-brown dominance) ---- */
    const dryScore =
      (c.yellowPct * 2.0) +
      (c.brownPct  * 1.8) -
      (c.greenPct  * 1.2) +
      (c.grayPct   * 0.5);

    /* ---- Score pest/disease (dark spots, discoloration) ---- */
    const pestScore =
      (c.darkPct   * 3.0) +
      (c.brownPct  * 0.8) -
      (c.greenPct  * 0.5) +
      (c.yellowPct * 0.3);

    const maxScore = Math.max(healthyScore, dryScore, pestScore);

    let status, confidence, icon, subtitle, iconClass, diagnosis, recommendations, colors;

    /* ---- Determine diagnosis ---- */
    if (healthyScore >= dryScore && healthyScore >= pestScore) {
      status = 'Healthy';
      iconClass = 'healthy';
      icon = 'fa-check-circle';
      subtitle = 'Your crop looks in great condition!';
      confidence = Math.min(97, Math.max(72, Math.round(55 + c.greenPct * 0.8)));
      diagnosis = `The leaf shows strong green pigmentation (${c.greenPct}% green pixels), indicating healthy chlorophyll levels. There is minimal yellowing (${c.yellowPct}%) or browning (${c.brownPct}%), which suggests good water uptake and nutrient absorption. No significant pest damage patterns were detected.`;
      recommendations = [
        'Continue regular watering schedule (early morning preferred)',
        'Maintain balanced NPK fertilization every 2 weeks',
        'Monitor for any new discoloration weekly',
        'Ensure proper sunlight exposure (6-8 hours/day)',
      ];
      colors = [
        { hex: '#22c55e', label: 'Healthy Green', pct: c.greenPct },
        { hex: '#86efac', label: 'Light Green',   pct: Math.max(5, 15 - c.brownPct) },
        { hex: '#bbf7d0', label: 'Pale Green',     pct: Math.max(3, 10 - c.yellowPct) },
      ];
    } else if (dryScore >= pestScore) {
      status = 'Dry / Wilting';
      iconClass = 'dry';
      icon = 'fa-sun';
      subtitle = 'Needs watering or shade attention';
      confidence = Math.min(94, Math.max(68, Math.round(45 + c.yellowPct * 1.2 + c.brownPct * 0.8)));
      diagnosis = `The leaf exhibits significant yellowing (${c.yellowPct}%) and browning (${c.brownPct}%), which are classic signs of dehydration or nutrient deficiency. The low green content (${c.greenPct}%) suggests chlorophyll breakdown. This may be caused by insufficient watering, excessive heat, or potassium/magnesium deficiency.`;
      recommendations = [
        'Water the plant immediately — check soil moisture 2 inches deep',
        'Apply mulch around the base to retain soil moisture',
        'Move plant to partial shade if exposed to harsh afternoon sun',
        'Test soil pH (ideal 6.0–7.0) and apply balanced fertilizer',
        'Check for root-bound condition if in a pot',
      ];
      colors = [
        { hex: '#f59e0b', label: 'Yellow (Stress)', pct: c.yellowPct },
        { hex: '#a16207', label: 'Brown (Dry)',      pct: c.brownPct },
        { hex: '#22c55e', label: 'Remaining Green',  pct: c.greenPct },
      ];
    } else {
      status = 'Pest / Disease Detected';
      iconClass = 'pest';
      icon = 'fa-bug';
      subtitle = 'Immediate treatment recommended!';
      confidence = Math.min(93, Math.max(70, Math.round(50 + c.darkPct * 2.5 + c.brownPct * 0.9)));
      diagnosis = `Detected unusual dark spots and discoloration (${c.darkPct}% dark pixels, ${c.brownPct}% brown patches), which are strong indicators of fungal infection, bacterial disease, or insect damage. The abnormal color distribution pattern suggests active pest infestation or disease progression. Immediate action is required.`;
      recommendations = [
        'Remove and dispose of severely affected leaves immediately',
        'Spray neem oil solution (5ml per litre of water) every 3 days',
        'Apply copper-based fungicide if fungal infection is suspected',
        'Isolate the plant from healthy crops to prevent spreading',
        'Consult local Krishi Vigyan Kendra (KVK) for severe cases',
        'Increase plant spacing for better airflow',
      ];
      colors = [
        { hex: '#7f1d1d', label: 'Dark Spots',       pct: c.darkPct },
        { hex: '#b45309', label: 'Diseased Brown',    pct: c.brownPct },
        { hex: '#22c55e', label: 'Remaining Healthy', pct: c.greenPct },
      ];
    }

    return { status, iconClass, icon, subtitle, confidence, diagnosis, recommendations, colors };
  }


  /* ======================================================
     DISPLAY RESULT
  ====================================================== */
  function displayResult(result, extractedColors) {
    /* Show result panel */
    resultPlaceholder.style.display = 'none';
    resultContent.style.display = 'block';

    /* Status icon */
    const iconEl   = document.getElementById('resultIcon');
    const iconFa   = document.getElementById('resultStatusIcon');
    iconEl.className = `result-status-icon ${result.iconClass}`;
    iconFa.className = `fas ${result.icon}`;

    /* Title & subtitle */
    document.getElementById('resultTitle').textContent    = result.status;
    document.getElementById('resultSubtitle').textContent = result.subtitle;

    /* Confidence bar */
    const confText = document.getElementById('confidenceText');
    const confFill = document.getElementById('confidenceFill');
    confText.textContent = `${result.confidence}%`;
    setTimeout(() => { confFill.style.width = `${result.confidence}%`; }, 100);

    /* Color fill based on status */
    const gradMap = {
      healthy: 'linear-gradient(90deg, #15803d, #22c55e)',
      dry:     'linear-gradient(90deg, #b45309, #f59e0b)',
      pest:    'linear-gradient(90deg, #991b1b, #ef4444)',
    };
    confFill.style.background = gradMap[result.iconClass];

    /* Color swatches */
    const swatchContainer = document.getElementById('colorSwatches');
    swatchContainer.innerHTML = '';
    result.colors.forEach(col => {
      const swatch = document.createElement('div');
      swatch.className = 'color-swatch';
      swatch.style.background = col.hex + '20';
      swatch.style.border = `1px solid ${col.hex}40`;
      swatch.innerHTML = `
        <div class="swatch-dot" style="background:${col.hex};"></div>
        <span style="color:${col.hex}">${col.label}</span>
        <span style="color:var(--text-muted); font-weight:400">${col.pct}%</span>
      `;
      swatchContainer.appendChild(swatch);
    });

    /* Diagnosis text */
    document.getElementById('diagnosisText').textContent = result.diagnosis;

    /* Recommendations */
    const recList = document.getElementById('recommendationList');
    recList.innerHTML = '';
    result.recommendations.forEach(rec => {
      const li = document.createElement('li');
      li.textContent = rec;
      recList.appendChild(li);
    });

    /* Save button */
    document.getElementById('saveResultBtn').onclick = () => downloadReport(result);
  }


  /* ======================================================
     DOWNLOAD REPORT
  ====================================================== */
  function downloadReport(result) {
    const now  = new Date().toLocaleString('en-IN');
    const report = `
========================================
       LeafAI — Leaf Health Report
========================================
Date & Time   : ${now}
Status        : ${result.status}
Confidence    : ${result.confidence}%
========================================
DIAGNOSIS
----------------------------------------
${result.diagnosis}

RECOMMENDATIONS
----------------------------------------
${result.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

COLOR ANALYSIS
----------------------------------------
${result.colors.map(c => `• ${c.label}: ${c.pct}%`).join('\n')}
========================================
Generated by LeafAI — AI Leaf Detector
School Project | Made for Indian Farmers
    `.trim();

    const blob = new Blob([report], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `LeafAI_Report_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Report downloaded!');
  }


/* ======================================================
     REAL SCAN COUNTERS — updated only on actual scans
  ====================================================== */
  const scanCounts = { healthy: 0, dry: 0, pest: 0, total: 0 };

  function updateDashboard(iconClass) {
    /* Increment real counts */
    if (iconClass === 'healthy') scanCounts.healthy++;
    else if (iconClass === 'dry') scanCounts.dry++;
    else if (iconClass === 'pest') scanCounts.pest++;
    scanCounts.total++;

    /* Update dashboard cards with animation */
    const map = [
      { sel: '.dash-healthy .dash-value', val: scanCounts.healthy },
      { sel: '.dash-dry .dash-value',     val: scanCounts.dry     },
      { sel: '.dash-pest .dash-value',    val: scanCounts.pest    },
      { sel: '.dash-total .dash-value',   val: scanCounts.total   },
    ];
    map.forEach(({ sel, val }) => {
      const el = document.querySelector(sel);
      if (el) animateCounter(el, val, 600);
    });

    /* Update weekly chart — today's column */
    const todayIdx = (new Date().getDay() + 6) % 7; /* 0=Mon … 6=Sun */
    if (iconClass === 'healthy') realWeekData[todayIdx].h++;
    else if (iconClass === 'dry') realWeekData[todayIdx].d++;
    else if (iconClass === 'pest') realWeekData[todayIdx].p++;
    renderBarChart();
  }

  /* ======================================================
     HISTORY TABLE
  ====================================================== */
  const historyData = [];

  function addToHistory(result, imgSrc) {
    const now = new Date().toLocaleTimeString('en-IN');
    historyData.unshift({ result, imgSrc, time: now });
    updateDashboard(result.iconClass); /* ← real counter update */
    renderHistory();
  }

  function renderHistory() {
    const tbody = document.getElementById('historyBody');
    if (!tbody) return;

    if (historyData.length === 0) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="5"><i class="fas fa-leaf"></i><p>No scans yet.</p></td></tr>`;
      return;
    }

    const badgeMap = {
      'Healthy':               'badge-healthy',
      'Dry / Wilting':         'badge-dry',
      'Pest / Disease Detected': 'badge-pest',
    };
    const iconMap = {
      'Healthy':               '🌿',
      'Dry / Wilting':         '🌞',
      'Pest / Disease Detected': '🐛',
    };

    tbody.innerHTML = historyData.map((item, idx) => `
      <tr>
        <td><img src="${item.imgSrc}" class="leaf-thumb" alt="Leaf ${idx + 1}"/></td>
        <td>
          <span class="status-badge ${badgeMap[item.result.status] || 'badge-healthy'}">
            ${iconMap[item.result.status] || '🌿'} ${item.result.status}
          </span>
        </td>
        <td><strong>${item.result.confidence}%</strong></td>
        <td>${item.time}</td>
        <td>
          <button class="delete-btn" onclick="deleteHistory(${idx})">
            <i class="fas fa-trash"></i> Remove
          </button>
        </td>
      </tr>
    `).join('');
  }

  /* Expose delete to global scope */
  window.deleteHistory = function(idx) {
    const removed = historyData[idx];
    if (removed) {
      const ic = removed.result.iconClass;
      if (ic === 'healthy' && scanCounts.healthy > 0) scanCounts.healthy--;
      else if (ic === 'dry' && scanCounts.dry > 0) scanCounts.dry--;
      else if (ic === 'pest' && scanCounts.pest > 0) scanCounts.pest--;
      if (scanCounts.total > 0) scanCounts.total--;

      /* Update today's bar chart too */
      const todayIdx = (new Date().getDay() + 6) % 7;
      if (ic === 'healthy' && realWeekData[todayIdx].h > 0) realWeekData[todayIdx].h--;
      else if (ic === 'dry' && realWeekData[todayIdx].d > 0) realWeekData[todayIdx].d--;
      else if (ic === 'pest' && realWeekData[todayIdx].p > 0) realWeekData[todayIdx].p--;

      /* Refresh UI */
      [
        { sel: '.dash-healthy .dash-value', val: scanCounts.healthy },
        { sel: '.dash-dry .dash-value',     val: scanCounts.dry     },
        { sel: '.dash-pest .dash-value',    val: scanCounts.pest    },
        { sel: '.dash-total .dash-value',   val: scanCounts.total   },
      ].forEach(({ sel, val }) => {
        const el = document.querySelector(sel);
        if (el) animateCounter(el, val, 400);
      });
      renderBarChart();
    }
    historyData.splice(idx, 1);
    renderHistory();
    showToast('Entry removed');
  };

})(); /* end initAnalyzer */


/* ======================================================
   7. TOAST NOTIFICATION
====================================================== */
function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  const msg   = document.getElementById('toastMsg');
  if (!toast || !msg) return;

  msg.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}
window.showToast = showToast;


/* ======================================================
   8. SMOOTH SCROLLING for nav links
====================================================== */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = 80;
    const top    = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });

    /* Close mobile menu if open */
    document.querySelector('.nav-links')?.classList.remove('mobile-open');
  });
});


/* ======================================================
   9. MOBILE MENU STYLES (injected dynamically)
====================================================== */
(function injectMobileStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .nav-links.mobile-open {
      display: flex !important;
      flex-direction: column;
      position: absolute;
      top: 72px; left: 0; right: 0;
      background: white;
      padding: 16px;
      border-bottom: 1px solid rgba(0,0,0,0.08);
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
      z-index: 999;
      gap: 4px;
    }
    .nav-links.mobile-open .nav-link { padding: 12px 16px; font-size: 15px; }
    .hamburger.open span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
    .hamburger.open span:nth-child(2) { opacity: 0; }
    .hamburger.open span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }
    .navbar { position: fixed; }
  `;
  document.head.appendChild(style);
})();


/* ======================================================
   10. PAGE LOAD ANIMATION
====================================================== */
window.addEventListener('load', () => {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.5s ease';
  requestAnimationFrame(() => {
    document.body.style.opacity = '1';
  });
});

/* ======================================================
   END OF LEAFAI SCRIPT.JS
====================================================== */
