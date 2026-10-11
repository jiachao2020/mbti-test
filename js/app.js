/* =========================================================
   MBTI 测试 - 主逻辑
   ========================================================= */
(function () {
  "use strict";

  const STORAGE_KEY = "mbti_progress_v1";
  const RESULT_KEY = "mbti_last_result_v1";

  /* ---------- 状态 ---------- */
  const state = {
    order: [],        // 打乱后的题目索引序列
    answers: [],      // 每题所选分值(与 order 对应)
    current: 0,       // 当前题号(0 基)
    finished: false,
  };

  /* ---------- DOM ---------- */
  const $ = (id) => document.getElementById(id);
  const screens = {
    home: $("screen-home"),
    quiz: $("screen-quiz"),
    result: $("screen-result"),
  };

  /* ---------- 工具 ---------- */
  function showScreen(name) {
    Object.values(screens).forEach((s) => s.classList.remove("active"));
    screens[name].classList.add("active");
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  let toastTimer = null;
  function toast(msg) {
    const el = $("toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.hidden = true), 2200);
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ---------- 首页:16 型人格墙 ---------- */
  function renderTypesGrid() {
    const grid = $("types-grid");
    grid.innerHTML = Object.values(TYPES)
      .map(
        (t) => `
        <div class="type-cell" title="${t.name} · ${t.tagline}">
          <b>${t.code}</b>
          <span>${t.emoji} ${t.name}</span>
          <em>${t.ratio}</em>
        </div>`
      )
      .join("");
  }

  /* ---------- 测试流程 ---------- */
  function startQuiz(resume) {
    if (resume && localStorage.getItem(STORAGE_KEY)) {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && saved.order?.length === QUESTIONS.length) {
        Object.assign(state, saved);
        showScreen("quiz");
        renderQuestion();
        return;
      }
    }
    state.order = shuffle(QUESTIONS.map((_, i) => i));
    state.answers = new Array(QUESTIONS.length).fill(null);
    state.current = 0;
    state.finished = false;
    saveProgress();
    showScreen("quiz");
    renderQuestion();
  }

  function saveProgress() {
    if (state.finished) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ order: state.order, answers: state.answers, current: state.current })
    );
  }

  function renderQuestion() {
    const qIdx = state.order[state.current];
    const q = QUESTIONS[qIdx];
    const dim = DIM_INFO[q.dim];

    $("q-current").textContent = state.current + 1;
    $("q-total").textContent = QUESTIONS.length;
    $("progress-bar").style.width = `${((state.current + 1) / QUESTIONS.length) * 100}%`;
    $("btn-back").disabled = state.current === 0;
    $("q-dim-tag").textContent = dim.name;
    $("q-text").textContent = q.text;

    const box = $("q-options");
    box.innerHTML = "";
    OPTIONS.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.className = "q-opt";
      btn.type = "button";
      btn.innerHTML = `<span class="opt-badge">${i + 1}</span><span>${opt.label}</span>`;
      if (state.answers[state.current] === opt.val) btn.classList.add("selected");
      btn.addEventListener("click", () => choose(opt.val));
      box.appendChild(btn);
    });

    const card = $("q-card");
    card.classList.remove("enter");
    void card.offsetWidth; // 重触发动画
    card.classList.add("enter");
  }

  function choose(val) {
    state.answers[state.current] = val;
    document.querySelectorAll(".q-opt").forEach((b, i) => {
      b.classList.toggle("selected", OPTIONS[i].val === val);
    });
    setTimeout(() => {
      if (state.current < QUESTIONS.length - 1) {
        state.current++;
        saveProgress();
        renderQuestion();
      } else {
        saveProgress();
        finishQuiz();
      }
    }, 220);
  }

  function goBack() {
    if (state.current === 0) return;
    state.current--;
    saveProgress();
    renderQuestion();
  }

  /* ---------- 计分 ---------- */
  // 分值符号:E=+ / I=-,S=+ / N=-,T=+ / F=-,J=+ / P=-
  const POLE_SIGN = { E: 1, I: -1, S: 1, N: -1, T: 1, F: -1, J: 1, P: -1 };

  function calcResult() {
    const raw = { EI: 0, SN: 0, TF: 0, JP: 0 };
    state.order.forEach((qIdx, i) => {
      const q = QUESTIONS[qIdx];
      const v = state.answers[i] ?? 0;
      raw[q.dim] += v * POLE_SIGN[q.pole];
    });

    const pct = {}; // 每维度「左字母」百分比(E/S/T/J)
    for (const dim of ["EI", "SN", "TF", "JP"]) {
      const max = 10; // 每维度 10 题,满分 ±10
      pct[dim] = Math.round(((raw[dim] + max) / (2 * max)) * 100);
    }
    const code =
      (pct.EI > 50 ? "E" : "I") +
      (pct.SN > 50 ? "S" : "N") +
      (pct.TF > 50 ? "T" : "F") +
      (pct.JP > 50 ? "J" : "P");
    return { code, pct, raw };
  }

  /* ---------- 结果渲染 ---------- */
  function finishQuiz() {
    state.finished = true;
    const { code, pct } = calcResult();
    localStorage.setItem(RESULT_KEY, JSON.stringify({ code, pct, time: Date.now() }));
    localStorage.removeItem(STORAGE_KEY);
    renderResult(code, pct);
    showScreen("result");
  }

  function renderResult(code, pct) {
    const t = TYPES[code];

    $("result-code").textContent = code;
    $("result-name").textContent = `${t.emoji} ${t.name} · ${t.group}`;
    $("result-tagline").textContent = `「${t.tagline}」`;
    $("result-ratio").textContent = `${t.name}型人格约占人口 ${t.ratio}`;

    // 维度条
    const bars = $("dim-bars");
    bars.innerHTML = "";
    for (const dim of ["EI", "SN", "TF", "JP"]) {
      const info = DIM_INFO[dim];
      const p = pct[dim];
      const leftName = p >= 50 ? `${info.leftName} ${info.left}` : `${info.rightName} ${info.right}`;
      const row = document.createElement("div");
      row.className = "dim-bar-row";
      row.innerHTML = `
        <div class="dim-bar-head">
          <span class="letters"><span>${info.leftName} ${info.left}</span>←→<span>${info.right} ${info.rightName}</span></span>
          <span class="pct">${p}% ${info.left} · ${100 - p}% ${info.right}</span>
        </div>
        <div class="dim-bar-track"><div class="dim-bar-fill" data-w="${p}"></div></div>`;
      bars.appendChild(row);
      // 延迟触发宽度过渡动画
      requestAnimationFrame(() =>
        setTimeout(() => (row.querySelector(".dim-bar-fill").style.width = `${p}%`), 60)
      );
    }

    // 画像与列表
    $("result-profile").innerHTML = t.profile.map((p) => `<p>${p}</p>`).join("");
    $("result-strengths").innerHTML = t.strengths.map((s) => `<li>${s}</li>`).join("");
    $("result-weaknesses").innerHTML = t.weaknesses.map((s) => `<li>${s}</li>`).join("");
    $("result-careers").innerHTML = t.careers.map((c) => `<span class="chip">${c}</span>`).join("");
    $("result-famous").innerHTML = t.famous.map((f) => `<span class="famous-item">${f}</span>`).join("");
    $("result-match").innerHTML = `默契搭档:<b>${t.match.types.join("、")}</b> ${t.match.note}`;

    renderShareCard(code, pct, t);
  }

  /* ---------- 分享卡片(Canvas) ---------- */
  function renderShareCard(code, pct, t) {
    const cv = $("share-canvas");
    const ctx = cv.getContext("2d");
    const W = cv.width, H = cv.height;

    // 背景
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#6d5bd0");
    g.addColorStop(0.5, "#8a54dd");
    g.addColorStop(1, "#b056e8");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // 装饰圆
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = "#fff";
    [[620, 120, 180], [90, 760, 220], [700, 900, 130]].forEach(([x, y, r]) => {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    ctx.textAlign = "center";
    // 标题
    ctx.fillStyle = "rgba(255,255,255,.85)";
    ctx.font = "500 30px 'PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText("我 的 M B T I 人 格 测 评", W / 2, 110);

    // 类型码
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "rgba(0,0,0,.25)";
    ctx.shadowBlur = 24;
    ctx.font = "900 150px 'PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText(code, W / 2, 320);
    ctx.shadowBlur = 0;

    ctx.font = "800 52px 'PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText(`${t.emoji} ${t.name}`, W / 2, 400);

    ctx.font = "400 27px 'PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillStyle = "rgba(255,255,255,.9)";
    ctx.fillText(`「${t.tagline}」`, W / 2, 460);

    // 维度条卡片
    const cardY = 520, cardH = 350, cardX = 60, cardW = W - 120;
    ctx.fillStyle = "rgba(255,255,255,.14)";
    roundRect(ctx, cardX, cardY, cardW, cardH, 28);
    ctx.fill();

    let y = cardY + 62;
    for (const dim of ["EI", "SN", "TF", "JP"]) {
      const info = DIM_INFO[dim];
      const p = pct[dim];
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(255,255,255,.95)";
      ctx.font = "700 26px 'PingFang SC','Microsoft YaHei',sans-serif";
      ctx.fillText(`${info.leftName} ${info.left}`, cardX + 34, y + 8);
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(255,255,255,.75)";
      ctx.font = "400 24px 'PingFang SC','Microsoft YaHei',sans-serif";
      ctx.fillText(`${info.right} ${info.rightName}`, cardX + cardW - 34, y + 8);
      // 轨道
      const barY = y + 22, barH = 14;
      ctx.fillStyle = "rgba(255,255,255,.22)";
      roundRect(ctx, cardX + 34, barY, cardW - 68, barH, 7);
      ctx.fill();
      ctx.fillStyle = "#fff";
      roundRect(ctx, cardX + 34, barY, ((cardW - 68) * p) / 100, barH, 7);
      ctx.fill();
      // 中线
      ctx.fillStyle = "rgba(109,91,208,.9)";
      ctx.fillRect(cardX + 34 + (cardW - 68) / 2 - 1.5, barY - 4, 3, barH + 8);
      y += 78;
    }

    // 底部
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,.8)";
    ctx.font = "400 24px 'PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText("扫码/搜索来测测你是什么人格 →", W / 2, H - 44);
    ctx.fillStyle = "rgba(255,255,255,.82)";
    ctx.font = "500 22px 'PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText("MBTI 人格测评 · 40 题免费测试", W / 2, H - 14);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* ---------- 事件绑定 ---------- */
  $("btn-start").addEventListener("click", () => startQuiz(false));
  $("link-resume")?.addEventListener("click", (e) => {
    e.preventDefault();
    startQuiz(true);
  });
  $("btn-back").addEventListener("click", goBack);
  $("btn-quit").addEventListener("click", () => {
    if (confirm("退出后答题进度会保留,确定退出吗?")) showScreen("home");
  });
  $("btn-retest").addEventListener("click", () => startQuiz(false));

  $("btn-copy").addEventListener("click", async () => {
    const code = $("result-code").textContent;
    const t = TYPES[code];
    const text =
      `我的 MBTI 人格类型:${code} ${t.name}(${t.tagline})\n` +
      `${t.strengths.slice(0, 3).map((s) => "· " + s).join("\n")}\n` +
      `适合领域:${t.careers.slice(0, 4).join(" / ")}\n` +
      `—— 来自 MBTI 人格测评,你也来测测吧!`;
    try {
      await navigator.clipboard.writeText(text);
      toast("已复制结果,快去分享吧 ✨");
    } catch {
      toast("复制失败,请长按页面手动复制");
    }
  });

  $("btn-share-card").addEventListener("click", () => ($("modal-card").hidden = false));
  $("btn-close-card").addEventListener("click", () => ($("modal-card").hidden = true));
  $("modal-card").addEventListener("click", (e) => {
    if (e.target === $("modal-card")) $("modal-card").hidden = true;
  });
  $("btn-download-card").addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = $("share-canvas").toDataURL("image/png");
    a.download = `MBTI-${$("result-code").textContent}.png`;
    a.click();
    toast("卡片已保存 🎉");
  });

  // 键盘 1-5 快捷选择
  document.addEventListener("keydown", (e) => {
    if (!screens.quiz.classList.contains("active")) return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= OPTIONS.length) choose(OPTIONS[n - 1].val);
  });

  /* ---------- 初始化 ---------- */
  renderTypesGrid();
  if (localStorage.getItem(STORAGE_KEY)) {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.answers?.some((a) => a !== null)) {
      $("resume-hint").hidden = false;
    }
  }
})();
