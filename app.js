(function () {
  const STORAGE_KEY = "packing_checklist_v1";

  const ICON_OPTIONS = [
    "luggage", "backpack", "plane", "map", "compass", "map-pin",
    "car", "train-front", "ship", "bed", "building", "ticket",
    "shirt", "glasses", "watch", "umbrella", "shopping-bag", "key",
    "droplet", "pill", "scissors", "wallet", "book", "heart",
    "smartphone", "laptop", "headphones", "camera", "battery", "plug",
    "coffee", "utensils", "gift", "flag", "alert-triangle", "package"
  ];

  const EMOJI_TO_LUCIDE = {
    "🧳": "luggage", "🎒": "backpack", "✈️": "plane", "🗺️": "map",
    "👕": "shirt", "📔": "book", "📌": "map-pin", "⚠️": "alert-triangle",
    "📦": "package", "🔌": "plug", "🔋": "battery", "📱": "smartphone",
    "💻": "laptop", "🎧": "headphones", "📷": "camera", "☕": "coffee",
    "🎁": "gift", "❤️": "heart", "🔑": "key", "👜": "shopping-bag"
  };

  const isLucideName = (v) => /^[a-z][a-z0-9-]*$/.test(v || "");

  const board = document.getElementById("board");
  const progressFill = document.getElementById("progress-fill");
  const progressText = document.getElementById("progress-text");
  const btnEdit = document.getElementById("btn-edit");
  const btnReset = document.getElementById("btn-reset");
  const btnFinalCheck = document.getElementById("btn-final-check");
  const btnFinalExit = document.getElementById("btn-final-exit");
  const finalBanner = document.getElementById("final-check-banner");

  const modalManage = document.getElementById("modal-manage-categories");
  const manageList = document.getElementById("manage-list");
  const btnManageClose = document.getElementById("btn-manage-close");
  const btnManageAdd = document.getElementById("btn-manage-add");

  const modalItemEdit = document.getElementById("modal-edit-items");
  const itemEditList = document.getElementById("item-edit-list");
  const itemEditTitle = document.getElementById("item-edit-title");
  const btnItemEditClose = document.getElementById("btn-item-edit-close");
  const btnItemAdd = document.getElementById("btn-item-add");

  const modalAddCat = document.getElementById("modal-add-category");
  const iconGrid = document.getElementById("icon-grid");
  const inputCatName = document.getElementById("input-cat-name");
  const btnCatCancel = document.getElementById("btn-cat-cancel");
  const btnCatConfirm = document.getElementById("btn-cat-confirm");

  let state = load();
  let selectedIcon = ICON_OPTIONS[0];
  let currentEditCat = null;

  function uid(prefix) {
    return prefix + "_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SVG_NS = "http://www.w3.org/2000/svg";

  function spawnFeather(checkboxEl) {
    if (prefersReducedMotion) return;
    const rect = checkboxEl.getBoundingClientRect();
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "feather-fx");
    svg.setAttribute("viewBox", "0 0 20 30");
    svg.style.left = (rect.left + rect.width / 2 - 9) + "px";
    svg.style.top = (rect.top + rect.height / 2 - 4) + "px";
    const use = document.createElementNS(SVG_NS, "use");
    use.setAttribute("href", "#ico-feather");
    svg.appendChild(use);
    document.body.appendChild(svg);
    setTimeout(() => svg.remove(), 1300);
  }

  function spawnCloud(categoryEl) {
    if (prefersReducedMotion) return;
    if (categoryEl.querySelector(".cloud-fx")) return;
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "cloud-fx");
    svg.setAttribute("viewBox", "0 0 60 30");
    const use = document.createElementNS(SVG_NS, "use");
    use.setAttribute("href", "#ico-cloud-sm");
    svg.appendChild(use);
    categoryEl.appendChild(svg);
    setTimeout(() => svg.remove(), 2100);
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && Array.isArray(data.categories)) return migrate(data);
      }
    } catch (e) {
      console.warn("載入失敗，改用預設資料", e);
    }
    return seedFromDefault();
  }

  function migrate(data) {
    const from = data.version || 1;
    if (from < 2) {
      data.categories.forEach((c) => {
        if (c.emoji && EMOJI_TO_LUCIDE[c.emoji]) c.emoji = EMOJI_TO_LUCIDE[c.emoji];
      });
      data.version = 2;
    }
    if (from < 3) {
      data.categories.forEach((c) => {
        if (typeof c.important !== "boolean") {
          c.important = c.name === "記得確認";
        }
      });
      data.version = 3;
    }
    if (from < data.version) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  }

  function seedFromDefault() {
    const categories = DEFAULT_DATA.categories.map((c) => ({
      id: uid("cat"),
      emoji: c.emoji,
      name: c.name,
      color: c.color || "gray",
      important: !!c.important,
      items: c.items.map((text) => ({ id: uid("item"), text, checked: false }))
    }));
    return { version: 3, categories };
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  /* ---------- Main board render ---------- */
  function render() {
    board.innerHTML = "";
    state.categories.forEach((cat) => board.appendChild(renderCategory(cat)));
    updateProgress();
    if (window.lucide) window.lucide.createIcons();
  }

  function renderCategory(cat) {
    const el = document.createElement("section");
    const allChecked = cat.items.length > 0 && cat.items.every((i) => i.checked);
    el.className = "category color-" + (cat.color || "gray")
      + (cat.important ? " important" : "")
      + (cat.important && allChecked ? " complete" : "");
    el.dataset.catId = cat.id;
    el.dataset.complete = allChecked ? "true" : "false";

    const head = document.createElement("div");
    head.className = "category-head";

    const emoji = document.createElement("span");
    emoji.className = "category-emoji";
    if (isLucideName(cat.emoji)) {
      emoji.classList.add("is-lucide");
      emoji.innerHTML = `<i data-lucide="${cat.emoji}"></i>`;
    } else {
      emoji.textContent = cat.emoji || "📦";
    }

    const name = document.createElement("span");
    name.className = "category-name";
    name.textContent = cat.name;

    const count = document.createElement("span");
    count.className = "category-count";
    const done = cat.items.filter((i) => i.checked).length;
    count.textContent = done + "/" + cat.items.length;

    const editBtn = document.createElement("button");
    editBtn.className = "category-edit";
    editBtn.type = "button";
    editBtn.setAttribute("aria-label", "編輯項目");
    editBtn.innerHTML = `<i data-lucide="pencil"></i>`;
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openItemEditor(cat);
    });

    head.append(emoji, name, count, editBtn);

    const list = document.createElement("ul");
    list.className = "item-list";
    cat.items.forEach((item) => list.appendChild(renderItem(cat, item)));

    el.append(head, list);
    return el;
  }

  function renderItem(cat, item) {
    const li = document.createElement("li");
    li.className = "item" + (item.checked ? " checked" : "");
    li.dataset.itemId = item.id;

    const box = document.createElement("span");
    box.className = "checkbox";
    box.setAttribute("role", "checkbox");
    box.setAttribute("aria-checked", item.checked ? "true" : "false");

    const text = document.createElement("span");
    text.className = "item-text";
    text.textContent = item.text;

    li.append(box, text);

    li.addEventListener("click", () => {
      item.checked = !item.checked;
      li.classList.toggle("checked", item.checked);
      box.setAttribute("aria-checked", item.checked ? "true" : "false");
      if (item.checked) spawnFeather(box);
      updateCategoryCount(cat);
      updateCategoryComplete(cat);
      updateProgress();
      save();
      checkFinalCheckDone();
    });

    return li;
  }

  function updateCategoryCount(cat) {
    const el = board.querySelector(`[data-cat-id="${cat.id}"] .category-count`);
    if (el) {
      const done = cat.items.filter((i) => i.checked).length;
      el.textContent = done + "/" + cat.items.length;
    }
  }

  function updateCategoryComplete(cat) {
    const section = board.querySelector(`[data-cat-id="${cat.id}"]`);
    if (!section) return;
    const allChecked = cat.items.length > 0 && cat.items.every((i) => i.checked);
    const wasComplete = section.dataset.complete === "true";
    if (cat.important) section.classList.toggle("complete", allChecked);
    section.dataset.complete = allChecked ? "true" : "false";
    if (allChecked && !wasComplete) spawnCloud(section);
  }

  function updateProgress() {
    let total = 0, done = 0;
    state.categories.forEach((c) => {
      total += c.items.length;
      done += c.items.filter((i) => i.checked).length;
    });
    progressText.textContent = done + " / " + total;
    const pct = total === 0 ? 0 : (done / total) * 100;
    progressFill.style.width = pct + "%";

    const nowAllDone = total > 0 && done === total;
    const wasAllDone = progressFill.dataset.allDone === "true";
    if (nowAllDone && !wasAllDone) {
      progressFill.dataset.allDone = "true";
      if (!prefersReducedMotion) {
        document.body.classList.add("complete");
        setTimeout(() => document.body.classList.remove("complete"), 1600);
      }
    } else if (!nowAllDone && wasAllDone) {
      progressFill.dataset.allDone = "false";
      document.body.classList.remove("complete");
    }
  }

  /* ---------- Final check mode ---------- */
  function allImportantDone() {
    const important = state.categories.filter((c) => c.important && c.items.length > 0);
    if (important.length === 0) return false;
    return important.every((c) => c.items.every((i) => i.checked));
  }

  function checkFinalCheckDone() {
    if (!document.body.classList.contains("final-check")) return;
    if (allImportantDone()) {
      setFinalCheck(false);
      setTimeout(() => alert("所有重要項目都勾好了！可以出門了 ✈"), 50);
    }
  }

  function setFinalCheck(v) {
    if (v) {
      const hasImportant = state.categories.some((c) => c.important && c.items.length > 0);
      if (!hasImportant) {
        alert("還沒有分類被標為『重要』。\n請先點右上 ✏️ 進入分類管理，點分類旁的星星標記。");
        return;
      }
    }
    document.body.classList.toggle("final-check", v);
    btnFinalCheck.classList.toggle("active", v);
    btnFinalCheck.setAttribute("aria-pressed", v ? "true" : "false");
    finalBanner.hidden = !v;
  }

  /* ---------- Modal history (mobile back button / gesture) ---------- */
  function closeTopModal() {
    if (!modalAddCat.hidden) {
      modalAddCat.hidden = true;
      return;
    }
    if (!modalItemEdit.hidden) {
      if (document.activeElement && typeof document.activeElement.blur === "function") {
        document.activeElement.blur();
      }
      modalItemEdit.hidden = true;
      currentEditCat = null;
      render();
      return;
    }
    if (!modalManage.hidden) {
      if (document.activeElement && typeof document.activeElement.blur === "function") {
        document.activeElement.blur();
      }
      modalManage.hidden = true;
      render();
    }
  }

  window.addEventListener("popstate", closeTopModal);

  /* ---------- Manage categories modal ---------- */
  function openManageCategories() {
    if (document.body.classList.contains("final-check")) setFinalCheck(false);
    buildManageList();
    modalManage.hidden = false;
    history.pushState({ checklistModal: "manage" }, "");
  }

  function buildManageList() {
    manageList.innerHTML = "";
    if (state.categories.length === 0) {
      const hint = document.createElement("div");
      hint.className = "empty-hint";
      hint.textContent = "還沒有任何分類，按下方「＋ 新增分類」開始。";
      manageList.appendChild(hint);
    } else {
      state.categories.forEach((cat) => manageList.appendChild(renderManageRow(cat)));
    }
    if (window.lucide) window.lucide.createIcons();
  }

  function renderManageRow(cat) {
    const row = document.createElement("div");
    row.className = "edit-row";
    row.dataset.catId = cat.id;

    const handle = document.createElement("span");
    handle.className = "drag-handle";
    handle.setAttribute("aria-label", "拖曳排序");
    handle.innerHTML = `<i data-lucide="grip-vertical"></i>`;

    const icon = document.createElement("span");
    icon.className = "edit-cat-icon";
    if (isLucideName(cat.emoji)) {
      icon.innerHTML = `<i data-lucide="${cat.emoji}"></i>`;
    } else {
      icon.textContent = cat.emoji || "📦";
    }

    const input = document.createElement("input");
    input.type = "text";
    input.className = "edit-input";
    input.value = cat.name;
    input.setAttribute("autocomplete", "off");
    input.addEventListener("blur", () => {
      const v = input.value.trim();
      if (!v) { input.value = cat.name; return; }
      if (v !== cat.name) { cat.name = v; save(); }
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); input.blur(); }
      else if (e.key === "Escape") { e.preventDefault(); input.value = cat.name; input.blur(); }
    });

    const star = document.createElement("button");
    star.type = "button";
    star.className = "edit-star" + (cat.important ? " active" : "");
    star.setAttribute("aria-label", "切換重要");
    star.innerHTML = `<i data-lucide="star"></i>`;
    star.addEventListener("click", () => {
      cat.important = !cat.important;
      star.classList.toggle("active", cat.important);
      save();
    });

    const del = document.createElement("button");
    del.type = "button";
    del.className = "edit-delete";
    del.setAttribute("aria-label", "刪除分類");
    del.textContent = "×";
    del.addEventListener("click", () => {
      if (!confirm(`刪除「${cat.name}」？\n底下的 ${cat.items.length} 個項目會一起刪除。`)) return;
      state.categories = state.categories.filter((c) => c.id !== cat.id);
      save();
      row.remove();
      if (state.categories.length === 0) buildManageList();
    });

    row.append(handle, icon, input, star, del);
    return row;
  }

  /* ---------- Item editor modal ---------- */
  function openItemEditor(cat) {
    if (document.body.classList.contains("final-check")) setFinalCheck(false);
    currentEditCat = cat;
    itemEditTitle.textContent = "編輯：" + cat.name;
    buildItemEditList(cat);
    modalItemEdit.hidden = false;
    history.pushState({ checklistModal: "itemEdit" }, "");
  }

  function buildItemEditList(cat) {
    itemEditList.innerHTML = "";
    if (cat.items.length === 0) {
      const hint = document.createElement("div");
      hint.className = "empty-hint";
      hint.textContent = "這個分類還沒有項目，按下方「＋ 新增項目」開始。";
      itemEditList.appendChild(hint);
    } else {
      cat.items.forEach((item) => itemEditList.appendChild(renderItemEditRow(cat, item)));
    }
    if (window.lucide) window.lucide.createIcons();
  }

  function renderItemEditRow(cat, item) {
    const row = document.createElement("div");
    row.className = "edit-row";
    row.dataset.itemId = item.id;

    const handle = document.createElement("span");
    handle.className = "drag-handle";
    handle.setAttribute("aria-label", "拖曳排序");
    handle.innerHTML = `<i data-lucide="grip-vertical"></i>`;

    const input = document.createElement("input");
    input.type = "text";
    input.className = "edit-input";
    input.value = item.text;
    input.setAttribute("autocomplete", "off");
    input.addEventListener("blur", () => {
      const v = input.value.trim();
      if (!v && !item.text) {
        cat.items = cat.items.filter((i) => i.id !== item.id);
        row.remove();
        save();
        if (cat.items.length === 0) buildItemEditList(cat);
        return;
      }
      if (!v) { input.value = item.text; return; }
      if (v !== item.text) { item.text = v; save(); }
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); input.blur(); }
      else if (e.key === "Escape") {
        e.preventDefault();
        input.value = item.text;
        input.blur();
      }
    });

    const del = document.createElement("button");
    del.type = "button";
    del.className = "edit-delete";
    del.setAttribute("aria-label", "刪除項目");
    del.textContent = "×";
    del.addEventListener("click", () => {
      if (item.text && !confirm(`刪除「${item.text}」？`)) return;
      cat.items = cat.items.filter((i) => i.id !== item.id);
      save();
      row.remove();
      if (cat.items.length === 0) buildItemEditList(cat);
    });

    row.append(handle, input, del);
    return row;
  }

  /* ---------- Add category modal ---------- */
  function openAddCategory() {
    inputCatName.value = "";
    selectedIcon = ICON_OPTIONS[0];
    buildIconGrid();
    modalAddCat.hidden = false;
    history.pushState({ checklistModal: "addCat" }, "");
    setTimeout(() => inputCatName.focus(), 50);
  }

  function buildIconGrid() {
    iconGrid.innerHTML = "";
    ICON_OPTIONS.forEach((name) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "icon-option" + (name === selectedIcon ? " selected" : "");
      btn.dataset.icon = name;
      btn.innerHTML = `<i data-lucide="${name}"></i>`;
      btn.addEventListener("click", () => {
        selectedIcon = name;
        iconGrid.querySelectorAll(".icon-option").forEach((el) => {
          el.classList.toggle("selected", el.dataset.icon === name);
        });
      });
      iconGrid.appendChild(btn);
    });
    if (window.lucide) window.lucide.createIcons();
  }

  function confirmAddCategory() {
    const name = inputCatName.value.trim();
    if (!name) { inputCatName.focus(); return; }
    state.categories.push({
      id: uid("cat"),
      emoji: selectedIcon,
      name,
      color: "gray",
      important: false,
      items: []
    });
    save();
    history.back();
    if (!modalManage.hidden) buildManageList();
  }

  /* ---------- Event wiring ---------- */
  btnEdit.addEventListener("click", openManageCategories);
  btnManageClose.addEventListener("click", () => history.back());
  btnManageAdd.addEventListener("click", openAddCategory);
  modalManage.addEventListener("click", (e) => {
    if (e.target === modalManage) history.back();
  });

  btnItemEditClose.addEventListener("click", () => history.back());
  modalItemEdit.addEventListener("click", (e) => {
    if (e.target === modalItemEdit) history.back();
  });
  btnItemAdd.addEventListener("click", () => {
    if (!currentEditCat) return;
    if (currentEditCat.items.length === 0) {
      itemEditList.innerHTML = "";
    }
    const newItem = { id: uid("item"), text: "", checked: false };
    currentEditCat.items.push(newItem);
    const row = renderItemEditRow(currentEditCat, newItem);
    itemEditList.appendChild(row);
    if (window.lucide) window.lucide.createIcons();
    const input = row.querySelector("input");
    input.focus();
    itemEditList.scrollTop = itemEditList.scrollHeight;
  });

  btnCatCancel.addEventListener("click", () => history.back());
  modalAddCat.addEventListener("click", (e) => {
    if (e.target === modalAddCat) history.back();
  });
  btnCatConfirm.addEventListener("click", confirmAddCategory);
  inputCatName.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); confirmAddCategory(); }
  });

  btnFinalCheck.addEventListener("click", () => {
    setFinalCheck(!document.body.classList.contains("final-check"));
  });
  btnFinalExit.addEventListener("click", () => setFinalCheck(false));

  btnReset.addEventListener("click", () => {
    const hasChecked = state.categories.some((c) => c.items.some((i) => i.checked));
    if (!hasChecked) return;
    if (!confirm("要清空所有勾選嗎？（項目與分類不會被刪除）")) return;
    state.categories.forEach((c) => c.items.forEach((i) => (i.checked = false)));
    save();
    render();
  });

  /* ---------- Drag-and-drop sort ---------- */
  if (window.Sortable) {
    window.Sortable.create(manageList, {
      handle: ".drag-handle",
      filter: ".empty-hint",
      preventOnFilter: true,
      animation: 150,
      onEnd: (evt) => {
        if (evt.oldIndex === evt.newIndex) return;
        const [moved] = state.categories.splice(evt.oldIndex, 1);
        state.categories.splice(evt.newIndex, 0, moved);
        save();
      }
    });

    window.Sortable.create(itemEditList, {
      handle: ".drag-handle",
      filter: ".empty-hint",
      preventOnFilter: true,
      animation: 150,
      onEnd: (evt) => {
        if (!currentEditCat) return;
        if (evt.oldIndex === evt.newIndex) return;
        const [moved] = currentEditCat.items.splice(evt.oldIndex, 1);
        currentEditCat.items.splice(evt.newIndex, 0, moved);
        save();
      }
    });
  }

  render();
})();
