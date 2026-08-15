"use strict";

/* ── Config ───────────────────────────────────────────────── */
/* La URL del backend llega en runtime desde el servidor, no escrita aquí:
   apunta al origen y no tiene por qué vivir en el repositorio.
   La define /api/pb-config, cargado antes que este script en index.html. */
const PB_URL = window.__PB_URL__ || "";

function fallarInicio(mensaje) {
  const err = document.getElementById("login-error");
  if (err) {
    err.textContent = mensaje;
    err.hidden = false;
  }
  throw new Error(mensaje);
}

if (!PB_URL) {
  fallarInicio(
    "Falta la configuración del backend (NEXT_PUBLIC_PB_URL). Avisa al administrador."
  );
}
if (typeof PocketBase === "undefined") {
  fallarInicio("No cargó la librería del panel. Recarga la página o revisa tu conexión.");
}
const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

const DAYS = [
  { n: 1, l: "Lun" }, { n: 2, l: "Mar" }, { n: 3, l: "Mié" },
  { n: 4, l: "Jue" }, { n: 5, l: "Vie" }, { n: 6, l: "Sáb" }, { n: 7, l: "Dom" },
];

/* ── Tiny safe DOM helper ─────────────────────────────────── */
function h(tag, attrs = {}, kids = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === "class") e.className = v;
    else if (k === "value") e.value = v;
    else if (k === "checked") e.checked = !!v;
    else if (k === "text") e.textContent = v;
    else if (k === "html") e.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  for (const c of [].concat(kids)) {
    if (c == null || c === false) continue;
    e.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return e;
}
const $ = (sel) => document.querySelector(sel);
const fileUrl = (rec, field) =>
  rec && rec[field] ? `${PB_URL}/api/files/${rec.collectionId}/${rec.id}/${rec[field]}` : "";

/* ── Iconos inline (feather) ──────────────────────────────── */
const ICON = {
  users: '<circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.87"/>',
  open: '<path d="M15 3h6v6"/><path d="M10 14L21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  sessions: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  avg: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
  chat: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
  inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
};
function svg(path, cls) {
  return h("span", { class: cls || "ico", html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>` });
}

/* ── Skeletons de carga ───────────────────────────────────── */
function skeleton(cards = 2) {
  const wrap = h("div", {});
  for (let i = 0; i < cards; i++) wrap.append(h("div", { class: "sk sk-card" }));
  return wrap;
}

/* ── Avatar por iniciales (color estable según nombre) ────── */
function initials(name) {
  const p = (name || "?").trim().split(/\s+/);
  return ((p[0]?.[0] || "") + (p[1]?.[0] || "")).toUpperCase() || "?";
}
function avatarColor(seed) {
  let n = 0;
  for (const ch of seed || "x") n = (n * 31 + ch.charCodeAt(0)) >>> 0;
  const hues = [[210, 255], [265, 255], [150, 220], [35, 255], [340, 255]];
  const [hue] = hues[n % hues.length];
  return `hsl(${hue} 70% 52%)`;
}
function avatar(name) {
  const a = h("div", { class: "avatar", text: initials(name) });
  a.style.background = avatarColor(name);
  return a;
}

/* ── Logo de marca (desde app_config) ─────────────────────── */
async function loadBrandLogo() {
  try {
    const rec = (await pb.collection("app_config").getList(1, 1)).items[0];
    const url = fileUrl(rec, "logo");
    if (!url) return; // sin logo en app_config → queda el /assets/logo.webp por defecto
    document.querySelectorAll(".brand-mark, .login-logo").forEach((el) => {
      const img = el.querySelector("img");
      if (img) img.src = url; // reemplaza el logo por defecto
      else { el.innerHTML = ""; el.append(h("img", { src: url, alt: "Logo" })); }
    });
  } catch (e) { /* deja el ícono por defecto */ }
}

let toastTimer;
function toast(msg, isErr = false) {
  const t = $("#toast");
  t.textContent = msg;
  t.className = "toast" + (isErr ? " err" : "");
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 2600);
}

/* ── Auth ─────────────────────────────────────────────────── */
$("#login-form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const btn = $("#login-btn");
  const err = $("#login-error");
  err.hidden = true;
  btn.disabled = true;
  btn.textContent = "Entrando…";
  try {
    const auth = pb.collection("_superusers").authWithPassword(
      $("#login-email").value.trim().toLowerCase(),
      $("#login-pass").value
    );
    const timeout = new Promise((_, rej) =>
      setTimeout(() => rej({ status: 0, message: "timeout" }), 15000)
    );
    await Promise.race([auth, timeout]);
    showApp();
  } catch (e) {
    const status = e && e.status;
    if (status === 400) {
      err.textContent = "Correo o contraseña incorrectos.";
    } else if (e && e.message === "timeout") {
      err.textContent = "El servidor no respondió (posible bloqueo de red o extensión del navegador).";
    } else if (!status) {
      err.textContent = "Sin conexión con el servidor (red o extensión bloqueando). Prueba en incógnito.";
    } else {
      err.textContent = "No se pudo entrar (error " + status + ").";
    }
    err.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = "Entrar";
  }
});

$("#logout").addEventListener("click", () => {
  pb.authStore.clear();
  location.reload();
});

function showApp() {
  $("#login").hidden = true;
  $("#app").hidden = false;
  loadBrandLogo();
  startLiveBadge();
  refreshChatBadge();
  setInterval(refreshChatBadge, 30000);
  switchTab("general");
}

function showLogin() {
  $("#app").hidden = true;
  $("#login").hidden = false;
}

// Token local "válido" pero rechazado por el server (reinicio/redeploy de PB,
// cambio de tokenKey). Detecta 401/403 → limpia sesión y obliga re-login.
function isAuthError(e) {
  return e && (e.status === 401 || e.status === 403);
}
function handleAuthError(e) {
  if (!isAuthError(e)) return false;
  pb.authStore.clear();
  showLogin();
  const err = $("#login-error");
  if (err) {
    err.textContent = "Tu sesión expiró. Inicia sesión de nuevo.";
    err.hidden = false;
  }
  return true;
}

/* ── Badge global "en vivo" (topbar) ──────────────────────── */
let liveBadgeTimer;
async function startLiveBadge() {
  const badge = $("#live-badge"), count = $("#live-count");
  if (!badge || !count) return;
  const refresh = async () => {
    try {
      const rows = await pb.collection("presence").getFullList({ batch: 500 });
      const now = Date.now();
      const n = rows.filter((r) => now - new Date(String(r.last_seen).replace(" ", "T")).getTime() < 60000).length;
      count.textContent = n;
      badge.hidden = false;
    } catch (e) { badge.hidden = true; }
  };
  refresh();
  clearInterval(liveBadgeTimer);
  liveBadgeTimer = setInterval(refresh, 20000);
}

/* ── Badge de chat sin responder (sidebar) ────────────────── */
async function refreshChatBadge() {
  const badge = $("#chat-nav-badge");
  if (!badge) return;
  try {
    const unseen = await pb.collection("messages").getList(1, 1, {
      filter: 'sender="listener" && seen=false', fields: "id",
    });
    const n = unseen.totalItems || 0;
    badge.textContent = n > 99 ? "99+" : n;
    badge.hidden = n === 0;
  } catch (e) { badge.hidden = true; }
}

/* ── Tabs ─────────────────────────────────────────────────── */
const renderers = {};
const TAB_TITLES = {
  general: "General", redes: "Redes sociales", programacion: "Programación",
  publicidad: "Publicidad", chat: "Chat con oyentes", reportes: "Reportes y analítica",
};
document.querySelectorAll(".tabs button").forEach((b) =>
  b.addEventListener("click", () => switchTab(b.dataset.tab))
);
function switchTab(name) {
  document.querySelectorAll(".tabs button").forEach((b) =>
    b.classList.toggle("active", b.dataset.tab === name)
  );
  document.querySelectorAll(".tab").forEach((t) => (t.hidden = t.id !== "tab-" + name));
  const title = $("#page-title");
  if (title) title.textContent = TAB_TITLES[name] || name;
  closeSidebar();
  renderers[name] && renderers[name]();
}

/* ── Menú lateral (móvil) ── */
function closeSidebar() {
  const sb = $("#sidebar"), sc = $("#scrim");
  if (sb) sb.classList.remove("open");
  if (sc) sc.classList.remove("show");
}
(function wireMenu() {
  const toggle = $("#menu-toggle"), sb = $("#sidebar"), sc = $("#scrim");
  if (toggle && sb && sc) {
    toggle.addEventListener("click", () => {
      sb.classList.toggle("open");
      sc.classList.toggle("show");
    });
    sc.addEventListener("click", closeSidebar);
  }
})();

/* ── GENERAL ──────────────────────────────────────────────── */
renderers.general = async function () {
  const box = $("#tab-general");
  box.innerHTML = "";
  box.append(skeleton(3));
  let rec;
  try {
    rec = (await pb.collection("app_config").getList(1, 1)).items[0];
  } catch (e) {
    box.innerHTML = "";
    box.append(h("p", { class: "error", text: "No se pudo cargar la configuración." }));
    return;
  }
  box.innerHTML = "";

  const logoImg = h("img", { class: "thumb", src: fileUrl(rec, "logo") || "" });
  const logoInput = h("input", { type: "file", accept: "image/*" });
  const fields = {
    station_name: h("input", { value: rec.station_name || "" }),
    tagline: h("input", { value: rec.tagline || "" }),
    stream_url: h("input", { value: rec.stream_url || "" }),
    privacy_url: h("input", { value: rec.privacy_url || "" }),
    live_video_url: h("input", { value: rec.live_video_url || "" }),
    chat_prize_message: h("textarea", { rows: "3", value: rec.chat_prize_message || "" }),
    color_primary: h("input", { type: "color", value: rec.color_primary || "#3B82F6" }),
    color_secondary: h("input", { type: "color", value: rec.color_secondary || "#FACC15" }),
    color_on_live: h("input", { type: "color", value: rec.color_on_live || "#EF4444" }),
    color_seed: h("input", { type: "color", value: rec.color_seed || "#3B82F6" }),
    logo_includes_name: h("input", { type: "checkbox", checked: rec.logo_includes_name }),
  };

  const lbl = (txt, node) => h("label", {}, [txt, node]);

  box.append(
    h("div", { class: "card" }, [
      h("h3", { text: "Identidad" }),
      h("div", { class: "grid2" }, [
        lbl("Nombre de la emisora", fields.station_name),
        lbl("Lema", fields.tagline),
      ]),
      lbl("URL del stream de audio", fields.stream_url),
      h("div", { class: "row" }, [
        h("div", {}, [h("p", { class: "muted", text: "Logo actual" }), logoImg]),
        h("div", { class: "grow" }, [lbl("Cambiar logo (PNG/JPG)", logoInput)]),
      ]),
      h("label", {}, [fields.logo_includes_name, " El logo ya incluye el nombre (no repetir texto)"]),
    ]),
    h("div", { class: "card" }, [
      h("h3", { text: "Colores de marca" }),
      h("div", { class: "row" }, [
        lbl("Primario", fields.color_primary),
        lbl("Acento", fields.color_secondary),
        lbl("EN VIVO", fields.color_on_live),
        lbl("Semilla", fields.color_seed),
      ]),
    ]),
    h("div", { class: "card" }, [
      h("h3", { text: "Enlaces y chat" }),
      lbl("URL política de privacidad", fields.privacy_url),
      lbl("URL video en vivo (opcional)", fields.live_video_url),
      lbl("Mensaje incentivo del chat (sorteos)", fields.chat_prize_message),
    ]),
    h("div", { class: "actions" }, [
      h("button", {
        class: "btn",
        text: "Guardar cambios",
        onclick: async (ev) => {
          ev.target.disabled = true;
          const data = {
            station_name: fields.station_name.value.trim(),
            tagline: fields.tagline.value.trim(),
            stream_url: fields.stream_url.value.trim(),
            privacy_url: fields.privacy_url.value.trim(),
            live_video_url: fields.live_video_url.value.trim(),
            chat_prize_message: fields.chat_prize_message.value.trim(),
            color_primary: fields.color_primary.value,
            color_secondary: fields.color_secondary.value,
            color_on_live: fields.color_on_live.value,
            color_seed: fields.color_seed.value,
            logo_includes_name: fields.logo_includes_name.checked,
          };
          if (logoInput.files[0]) data.logo = logoInput.files[0];
          try {
            await pb.collection("app_config").update(rec.id, data);
            toast("Configuración guardada.");
            renderers.general();
          } catch (e) {
            toast("Error al guardar.", true);
          } finally {
            ev.target.disabled = false;
          }
        },
      }),
    ])
  );
};

/* ── REDES ────────────────────────────────────────────────── */
renderers.redes = async function () {
  const box = $("#tab-redes");
  box.innerHTML = "";
  box.append(skeleton(3));
  const items = (await pb.collection("socials").getList(1, 100, { sort: "sort" })).items;
  box.innerHTML = "";
  box.append(
    h("p", { class: "muted", text: "Edita la URL e imagen de cada botón. Desactiva los que no uses. WhatsApp: pon el número internacional sin + (ej. 573001234567)." })
  );

  items.forEach((rec) => box.append(socialCard(rec)));

  box.append(
    h("div", { class: "actions" }, [
      h("button", {
        class: "btn accent",
        text: "+ Agregar red",
        onclick: async () => {
          try {
            await pb.collection("socials").create({ platform: "custom", label: "Nueva red", url: "", enabled: false, sort: items.length });
            renderers.redes();
          } catch (e) { toast("Error al crear.", true); }
        },
      }),
    ])
  );
};

function socialCard(rec) {
  const f = {
    label: h("input", { value: rec.label || "" }),
    platform: h("input", { value: rec.platform || "" }),
    url: h("input", { value: rec.url || "" }),
    message: h("input", { value: rec.message || "" }),
    enabled: h("input", { type: "checkbox", checked: rec.enabled }),
    image: h("input", { type: "file", accept: "image/*" }),
  };
  const isWa = (rec.platform || "").toLowerCase() === "whatsapp";
  return h("div", { class: "card" }, [
    h("div", { class: "row" }, [
      rec.image ? h("img", { class: "thumb", src: fileUrl(rec, "image") }) : h("span", { class: "pill", text: rec.platform || "—" }),
      h("div", { class: "grow" }, [
        h("div", { class: "grid2" }, [
          h("label", {}, ["Nombre / etiqueta", f.label]),
          h("label", {}, ["Identificador (platform)", f.platform]),
        ]),
        h("label", {}, [isWa ? "Número WhatsApp (sin +)" : "URL de destino", f.url]),
        isWa ? h("label", {}, ["Mensaje WhatsApp", f.message]) : null,
        h("label", {}, ["Ícono personalizado (opcional)", f.image]),
        h("label", {}, [f.enabled, " Mostrar este botón en la app"]),
      ]),
    ]),
    h("div", { class: "actions" }, [
      h("button", {
        class: "btn small", text: "Guardar",
        onclick: async (ev) => {
          ev.target.disabled = true;
          const data = {
            label: f.label.value.trim(), platform: f.platform.value.trim(),
            url: f.url.value.trim(), message: f.message.value.trim(), enabled: f.enabled.checked,
          };
          if (f.image.files[0]) data.image = f.image.files[0];
          try { await pb.collection("socials").update(rec.id, data); toast("Red guardada."); }
          catch (e) { toast("Error al guardar.", true); }
          finally { ev.target.disabled = false; }
        },
      }),
      h("button", {
        class: "btn small danger", text: "Eliminar",
        onclick: async () => {
          if (!confirm("¿Eliminar esta red?")) return;
          try { await pb.collection("socials").delete(rec.id); renderers.redes(); }
          catch (e) { toast("Error al eliminar.", true); }
        },
      }),
    ]),
  ]);
}

/* ── PROGRAMACIÓN ─────────────────────────────────────────── */
renderers.programacion = async function () {
  const box = $("#tab-programacion");
  box.innerHTML = "";
  box.append(skeleton(3));
  const items = (await pb.collection("programs").getList(1, 200, { sort: "sort" })).items;
  box.innerHTML = "";
  items.forEach((rec) => box.append(programCard(rec)));
  box.append(
    h("div", { class: "actions" }, [
      h("button", {
        class: "btn accent", text: "+ Agregar programa",
        onclick: async () => {
          try {
            await pb.collection("programs").create({ name: "Nuevo programa", host: "", days: [1, 2, 3, 4, 5], start: "08:00", end: "10:00", sort: items.length });
            renderers.programacion();
          } catch (e) { toast("Error al crear.", true); }
        },
      }),
    ])
  );
};

function programCard(rec) {
  const days = Array.isArray(rec.days) ? rec.days : [];
  const f = {
    name: h("input", { value: rec.name || "" }),
    host: h("input", { value: rec.host || "" }),
    start: h("input", { type: "time", value: rec.start || "" }),
    end: h("input", { type: "time", value: rec.end || "" }),
    image: h("input", { type: "file", accept: "image/*" }),
  };
  const dayBoxes = DAYS.map((d) => {
    const cb = h("input", { type: "checkbox", checked: days.includes(d.n) });
    cb.dataset.day = d.n;
    return h("label", { style: "display:inline-flex;align-items:center;gap:.2rem;margin-right:.6rem" }, [cb, d.l]);
  });
  return h("div", { class: "card" }, [
    h("div", { class: "row" }, [
      rec.image ? h("img", { class: "thumb", src: fileUrl(rec, "image") }) : null,
      h("div", { class: "grow" }, [
        h("div", { class: "grid2" }, [
          h("label", {}, ["Nombre", f.name]),
          h("label", {}, ["Locutor / host", f.host]),
        ]),
        h("div", { class: "row" }, [
          h("label", {}, ["Inicia", f.start]),
          h("label", {}, ["Termina", f.end]),
        ]),
        h("p", { class: "muted", style: "margin:.4rem 0 .2rem", text: "Días" }),
        h("div", {}, dayBoxes),
        h("label", {}, ["Imagen (opcional)", f.image]),
      ]),
    ]),
    h("div", { class: "actions" }, [
      h("button", {
        class: "btn small", text: "Guardar",
        onclick: async (ev) => {
          ev.target.disabled = true;
          const selDays = dayBoxes
            .map((lbl) => lbl.querySelector("input"))
            .filter((c) => c.checked)
            .map((c) => Number(c.dataset.day));
          const data = {
            name: f.name.value.trim(), host: f.host.value.trim(),
            start: f.start.value, end: f.end.value, days: selDays,
          };
          if (f.image.files[0]) data.image = f.image.files[0];
          try { await pb.collection("programs").update(rec.id, data); toast("Programa guardado."); }
          catch (e) { toast("Error al guardar.", true); }
          finally { ev.target.disabled = false; }
        },
      }),
      h("button", {
        class: "btn small danger", text: "Eliminar",
        onclick: async () => {
          if (!confirm("¿Eliminar este programa?")) return;
          try { await pb.collection("programs").delete(rec.id); renderers.programacion(); }
          catch (e) { toast("Error al eliminar.", true); }
        },
      }),
    ]),
  ]);
}

/* ── PUBLICIDAD ───────────────────────────────────────────── */
renderers.publicidad = async function () {
  const box = $("#tab-publicidad");
  box.innerHTML = "";
  box.append(skeleton(2));
  const items = (await pb.collection("sponsors").getList(1, 200, { sort: "sort" })).items;
  box.innerHTML = "";
  box.append(h("p", { class: "muted", text: "Patrocinadores del carrusel del Home. Sube la imagen y opcionalmente un enlace al tocar." }));
  items.forEach((rec) => box.append(sponsorCard(rec)));
  box.append(
    h("div", { class: "actions" }, [
      h("button", {
        class: "btn accent", text: "+ Agregar patrocinador",
        onclick: () => box.insertBefore(sponsorCard(null), box.querySelector(".actions")),
      }),
    ])
  );
};

function sponsorCard(rec) {
  const isNew = !rec;
  const f = {
    name: h("input", { value: rec ? rec.name || "" : "" }),
    link: h("input", { value: rec ? rec.link || "" : "" }),
    enabled: h("input", { type: "checkbox", checked: rec ? rec.enabled : true }),
    image: h("input", { type: "file", accept: "image/*" }),
  };
  return h("div", { class: "card" }, [
    h("div", { class: "row" }, [
      rec && rec.image ? h("img", { class: "thumb", src: fileUrl(rec, "image") }) : null,
      h("div", { class: "grow" }, [
        h("div", { class: "grid2" }, [
          h("label", {}, ["Nombre", f.name]),
          h("label", {}, ["Enlace al tocar (opcional)", f.link]),
        ]),
        h("label", {}, [isNew ? "Imagen (requerida)" : "Cambiar imagen", f.image]),
        h("label", {}, [f.enabled, " Mostrar en el carrusel"]),
      ]),
    ]),
    h("div", { class: "actions" }, [
      h("button", {
        class: "btn small", text: "Guardar",
        onclick: async (ev) => {
          ev.target.disabled = true;
          const data = { name: f.name.value.trim(), link: f.link.value.trim(), enabled: f.enabled.checked };
          if (f.image.files[0]) data.image = f.image.files[0];
          try {
            if (isNew) {
              if (!f.image.files[0]) { toast("Sube una imagen.", true); ev.target.disabled = false; return; }
              await pb.collection("sponsors").create(data);
            } else {
              await pb.collection("sponsors").update(rec.id, data);
            }
            toast("Patrocinador guardado.");
            renderers.publicidad();
          } catch (e) { toast("Error al guardar.", true); ev.target.disabled = false; }
        },
      }),
      !isNew && h("button", {
        class: "btn small danger", text: "Eliminar",
        onclick: async () => {
          if (!confirm("¿Eliminar este patrocinador?")) return;
          try { await pb.collection("sponsors").delete(rec.id); renderers.publicidad(); }
          catch (e) { toast("Error al eliminar.", true); }
        },
      }),
    ]),
  ]);
}

/* ── CHAT (sala pública: moderación + envío como admin) ───── */
let chatState = { unsub: null, msgsEl: null };

const ICON_TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
const ICON_BAN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>';

/** Nick del admin actual, derivado del email (editable, recordado por admin). */
function adminNickInfo() {
  const email = (pb.authStore.record && pb.authStore.record.email) || "admin";
  const key = "radio_admin_nick:" + email;
  let nick = localStorage.getItem(key);
  if (!nick) {
    const base = (email.split("@")[0] || "Admin").replace(/[._-]+/g, " ").trim();
    nick = base.charAt(0).toUpperCase() + base.slice(1);
  }
  return { key, nick };
}

async function delMessage(id) {
  try { await pb.collection("messages").delete(id); }
  catch (e) { toast("No se pudo borrar.", true); }
}

async function banDevice(m) {
  if (m.sender !== "listener" || !m.device_id) return;
  if (!confirm(`¿Banear a "${m.name || "Oyente"}"?\nNo podrá volver a escribir y se borrarán sus mensajes.`)) return;
  try {
    await pb.collection("bans").create({ device_id: m.device_id, name: m.name || "" });
    const rows = await pb.collection("messages").getFullList({ batch: 500, filter: `device_id="${m.device_id}"`, fields: "id" });
    await Promise.all(rows.map((r) => pb.collection("messages").delete(r.id)));
    toast("Oyente baneado.");
  } catch (e) { toast("No se pudo banear.", true); }
}

async function clearChat() {
  if (!confirm("¿Borrar TODOS los mensajes del chat?\nEsta acción no se puede deshacer.")) return;
  try {
    const rows = await pb.collection("messages").getFullList({ batch: 1000, fields: "id" });
    await Promise.all(rows.map((r) => pb.collection("messages").delete(r.id)));
    toast("Chat limpiado.");
    renderers.chat();
  } catch (e) { toast("No se pudo limpiar.", true); }
}

async function manageBans() {
  let bans = [];
  try { bans = await pb.collection("bans").getFullList({ batch: 500, sort: "-created" }); }
  catch (e) { toast("No se pudieron cargar.", true); return; }
  if (!bans.length) { toast("No hay oyentes baneados."); return; }
  const box = $("#tab-chat");
  const panel = h("div", { class: "card" }, [
    h("h3", {}, [h("span", { class: "grow", text: `Baneados (${bans.length})` }),
      h("button", { class: "btn small ghost", text: "Cerrar", onclick: () => panel.remove() })]),
    ...bans.map((b) => h("div", { class: "list-item" }, [
      h("div", { class: "grow" }, [h("strong", { text: b.name || "Oyente" }), h("div", { class: "ph mono", text: b.device_id })]),
      h("button", {
        class: "btn small", text: "Quitar ban",
        onclick: async (ev) => { ev.target.disabled = true; try { await pb.collection("bans").delete(b.id); toast("Ban retirado."); panel.remove(); } catch (e) { toast("Error.", true); } },
      }),
    ])),
  ]);
  box.prepend(panel);
}

renderers.chat = async function () {
  const box = $("#tab-chat");
  box.innerHTML = "";
  box.append(skeleton(1));
  let msgs = [];
  try {
    msgs = (await pb.collection("messages").getList(1, 300, { sort: "created" })).items;
  } catch (e) {
    box.innerHTML = "";
    box.append(h("p", { class: "error", text: "No se pudo cargar el chat." }));
    return;
  }

  box.innerHTML = "";
  const { key: nickKey, nick: nickDefault } = adminNickInfo();
  const msgsEl = h("div", { class: "msgs" });
  chatState.msgsEl = msgsEl;
  msgs.forEach((m) => msgsEl.append(chatBubble(m)));
  if (!msgs.length) msgsEl.append(h("div", { class: "empty", text: "Aún no hay mensajes en la sala." }));

  const nick = h("input", { class: "mono", placeholder: "Tu nick", value: nickDefault, style: "max-width:150px",
    oninput: () => localStorage.setItem(nickKey, nick.value.trim()) });
  localStorage.setItem(nickKey, nickDefault);
  const input = h("input", { placeholder: "Escribe en la sala pública…" });
  const send = async () => {
    const text = input.value.trim();
    const nk = nick.value.trim();
    if (!text) return;
    if (!nk) { toast("Escribe tu nick primero.", true); return; }
    localStorage.setItem(nickKey, nk);
    input.value = "";
    try {
      await pb.collection("messages").create({ device_id: "admin", name: nk, text, sender: "admin", seen: true });
    } catch (e) { toast("No se pudo enviar.", true); input.value = text; }
  };
  input.addEventListener("keydown", (ev) => { if (ev.key === "Enter") send(); });

  box.append(h("div", { class: "chat-wrap public" }, [
    h("div", { class: "thread" }, [
      h("div", { class: "thread-head" }, [
        h("div", { class: "pinfo grow" }, [
          h("strong", { text: "Sala pública en vivo" }),
          h("div", { class: "ph", text: "Escribes como " }),
        ]),
        h("button", { class: "btn small ghost", text: "Baneados", onclick: manageBans }),
        h("button", { class: "btn small danger", text: "Limpiar", onclick: clearChat }),
      ]),
      msgsEl,
      h("div", { class: "composer" }, [nick, input, h("button", { class: "btn", text: "Enviar", onclick: send })]),
    ]),
  ]));
  // muestra el nick en el subtítulo
  box.querySelector(".thread-head .ph").textContent = `Escribes como ${nickDefault}_admin (resaltado)`;
  msgsEl.scrollTop = msgsEl.scrollHeight;

  markRoomSeen();

  if (chatState.unsub) { chatState.unsub(); chatState.unsub = null; }
  chatState.unsub = await pb.collection("messages").subscribe("*", (e) => {
    if (!chatState.msgsEl) return;
    if (e.action === "create") {
      const atBottom = msgsEl.scrollHeight - msgsEl.scrollTop - msgsEl.clientHeight < 80;
      msgsEl.append(chatBubble(e.record));
      if (atBottom) msgsEl.scrollTop = msgsEl.scrollHeight;
      if (e.record.sender === "listener") markRoomSeen();
    } else if (e.action === "delete") {
      const el = msgsEl.querySelector(`[data-id="${e.record.id}"]`);
      if (el) el.remove();
    }
  });
};

function chatBubble(m) {
  const kind = m.sender === "admin" ? "admin" : m.sender === "station" ? "station" : "listener";
  const who = kind === "admin" ? `${m.name || "admin"}_admin`
    : kind === "station" ? "Radio Demo"
    : (m.name || "Oyente");
  const acts = h("div", { class: "bubble-acts" }, [
    kind === "listener" ? h("button", { class: "act danger", title: "Banear oyente", html: ICON_BAN, onclick: () => banDevice(m) }) : null,
    h("button", { class: "act", title: "Borrar mensaje", html: ICON_TRASH, onclick: () => delMessage(m.id) }),
  ]);
  return h("div", { class: "bubble " + kind, "data-id": m.id, "data-dev": m.device_id || "" }, [
    h("span", { class: "who", text: who }),
    h("span", { text: m.text || "" }),
    h("span", { class: "meta", text: fmtTime(m.created) }),
    acts,
  ]);
}

/** Marca como leídos los mensajes de oyentes para limpiar el badge del sidebar. */
async function markRoomSeen() {
  try {
    const rows = await pb.collection("messages").getFullList({ batch: 500, filter: 'sender="listener" && seen=false', fields: "id" });
    if (!rows.length) return;
    await Promise.all(rows.map((r) => pb.collection("messages").update(r.id, { seen: true })));
    refreshChatBadge();
  } catch (e) { /* ignore */ }
}

function fmtTime(s) {
  if (!s) return "";
  const d = new Date(s.replace(" ", "T"));
  return isNaN(d) ? s : d.toLocaleString("es-CO", { hour: "2-digit", minute: "2-digit" });
}
function dayLabel(s) {
  if (!s) return "";
  const d = new Date(s.replace(" ", "T"));
  if (isNaN(d)) return "";
  const today = new Date(), yest = new Date(); yest.setDate(today.getDate() - 1);
  const same = (a, b) => a.toDateString() === b.toDateString();
  if (same(d, today)) return "Hoy";
  if (same(d, yest)) return "Ayer";
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" });
}

/* ── REPORTES + ACTIVOS EN TIEMPO REAL ────────────────────── */
const reportState = { preset: "semana", from: null, to: null, presUnsub: null, presTimer: null, charts: [] };
const CLICK_LABELS = {
  play: "Play", pause: "Pausa", social_whatsapp: "WhatsApp", social_facebook: "Facebook",
  social_instagram: "Instagram", social_tiktok: "TikTok", social_youtube: "YouTube",
  social_website: "Sitio web", video_live: "Video en vivo", chat_open: "Abrir chat",
};

if (typeof Chart !== "undefined") Chart.defaults.color = "#9fb2d8";

function pbDate(d) { return d.toISOString().replace("T", " "); }
function fmtDur(secs) {
  secs = Math.round(secs || 0);
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s}s`;
  return `${s}s`;
}
function flag(cc) {
  if (!cc || cc.length !== 2) return "🌐";
  return String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}
function rangeFor(preset) {
  const now = new Date();
  const to = new Date(now);
  const from = new Date(now);
  switch (preset) {
    case "dia": from.setHours(0, 0, 0, 0); break;
    case "semana": from.setDate(now.getDate() - 7); break;
    case "mes": from.setMonth(now.getMonth() - 1); break;
    case "trimestre": from.setMonth(now.getMonth() - 3); break;
    case "semestre": from.setMonth(now.getMonth() - 6); break;
    case "anio": from.setFullYear(now.getFullYear() - 1); break;
  }
  return { from, to };
}

renderers.reportes = function () {
  const box = $("#tab-reportes");
  box.innerHTML = "";

  // 1) Visor de activos en tiempo real
  const activeNum = h("div", { class: "active-num", text: "—" });
  const activeChat = h("div", { class: "active-num", text: "—" });
  const activeCountries = h("div", { class: "active-countries" });
  box.append(h("div", { class: "card active-card" }, [
    h("div", { class: "live-row" }, [h("span", { class: "live-dot" }), h("strong", { text: "En vivo ahora mismo" })]),
    h("div", { class: "live-stats" }, [
      h("div", {}, [activeNum, h("div", { class: "live-stat-lbl", text: "Oyentes conectados" })]),
      h("div", {}, [activeChat, h("div", { class: "live-stat-lbl", text: "En el chat" })]),
    ]),
    activeCountries,
    h("small", { class: "hint", text: "En vivo · presencia de los últimos 60 segundos." }),
  ]));

  // 2) Filtros de período
  const filterRow = h("div", { class: "filter-row" });
  const presets = [["dia", "Hoy"], ["semana", "Semana"], ["mes", "Mes"], ["trimestre", "Trimestre"], ["semestre", "Semestre"], ["anio", "Año"]];
  const content = h("div", {});
  presets.forEach(([k, label]) => {
    filterRow.append(h("button", {
      class: "chip" + (reportState.preset === k ? " on" : ""),
      text: label,
      onclick: () => { reportState.preset = k; reportState.from = reportState.to = null; renderers.reportes(); },
    }));
  });
  const fromI = h("input", { type: "date" });
  const toI = h("input", { type: "date" });
  filterRow.append(
    h("span", { class: "muted", text: "  ·  " }),
    h("label", { class: "inline" }, ["Desde", fromI]),
    h("label", { class: "inline" }, ["Hasta", toI]),
    h("button", {
      class: "btn small", text: "Aplicar",
      onclick: () => {
        if (!fromI.value || !toI.value) { toast("Elige ambas fechas.", true); return; }
        reportState.preset = null;
        reportState.from = new Date(fromI.value + "T00:00:00");
        reportState.to = new Date(toI.value + "T23:59:59");
        loadReport(content);
      },
    })
  );
  box.append(h("div", { class: "card" }, [h("h3", { text: "Reportes por período" }), filterRow]));
  box.append(content);

  startActive(activeNum, activeChat, activeCountries);
  loadReport(content);
};

function startActive(numEl, chatEl, countriesEl) {
  if (reportState.presUnsub) { reportState.presUnsub(); reportState.presUnsub = null; }
  if (reportState.presTimer) clearInterval(reportState.presTimer);
  const refresh = async () => {
    let rows = [];
    try { rows = await pb.collection("presence").getFullList({ batch: 500, sort: "-last_seen" }); }
    catch (e) { handleAuthError(e); return; }
    const now = Date.now();
    const active = rows.filter((r) => now - new Date(String(r.last_seen).replace(" ", "T")).getTime() < 60000);
    numEl.textContent = active.length;
    chatEl.textContent = active.filter((r) => r.in_chat).length;
    const byC = {};
    active.forEach((r) => {
      const c = r.country || "??";
      const place = r.city ? `${r.city}` : c;
      byC[place] = byC[place] || { n: 0, cc: c };
      byC[place].n++;
    });
    countriesEl.innerHTML = "";
    const entries = Object.entries(byC).sort((a, b) => b[1].n - a[1].n);
    if (!entries.length) countriesEl.append(h("span", { class: "muted", text: "Nadie conectado ahora." }));
    entries.forEach(([place, { n, cc }]) => countriesEl.append(h("span", { class: "pill on", text: `${flag(cc)} ${place} · ${n}` })));
  };
  refresh();
  reportState.presTimer = setInterval(refresh, 15000);
  pb.collection("presence").subscribe("*", refresh).then((u) => (reportState.presUnsub = u)).catch(() => {});
}

async function loadReport(contentEl) {
  const { from, to } = reportState.preset ? rangeFor(reportState.preset) : { from: reportState.from, to: reportState.to };
  contentEl.innerHTML = "";
  contentEl.append(skeleton(2));
  let events = [];
  try {
    events = await pb.collection("events").getFullList({
      batch: 1000, sort: "created",
      filter: `created >= "${pbDate(from)}" && created <= "${pbDate(to)}"`,
    });
  } catch (e) {
    if (handleAuthError(e)) return;
    contentEl.innerHTML = "";
    contentEl.append(h("p", { class: "error", text: "No se pudieron cargar los datos." }));
    return;
  }

  const users = new Set(), byCountry = {}, clicks = {}, byDay = {};
  let sessions = 0, totalDur = 0, opens = 0, chatMsgs = 0;
  events.forEach((e) => {
    if (e.device_id) users.add(e.device_id);
    if (e.type === "chat") chatMsgs++; // cuenta cada mensaje (actividad del chat)
    if (e.name === "session_end") { sessions++; totalDur += Number(e.duration) || 0; }
    if (e.name === "app_open") { opens++; const d = String(e.created).slice(0, 10); byDay[d] = (byDay[d] || 0) + 1; }
    if (e.type === "click") clicks[e.name] = (clicks[e.name] || 0) + 1;
    if (e.device_id) {
      const c = e.country || "??";
      (byCountry[c] = byCountry[c] || new Set()).add(e.device_id);
    }
  });

  const stats = [
    ["Usuarios únicos", String(users.size), ICON.users, ""],
    ["Aperturas", String(opens), ICON.open, ""],
    ["Sesiones", String(sessions), ICON.sessions, "gold"],
    ["Tiempo total", fmtDur(totalDur), ICON.clock, "gold"],
    ["Tiempo promedio", fmtDur(sessions ? totalDur / sessions : 0), ICON.avg, "ok"],
    ["Mensajes en chat", String(chatMsgs), ICON.chat, "ok"],
  ];
  const grid = h("div", { class: "stat-grid" });
  stats.forEach(([label, val, icon, cls]) => grid.append(
    h("div", { class: "stat" }, [
      svg(icon, "stat-ico " + cls),
      h("div", { class: "stat-body" }, [
        h("div", { class: "stat-val mono", text: val }),
        h("div", { class: "stat-lbl", text: label }),
      ]),
    ])
  ));

  const clickEntries = Object.entries(clicks).sort((a, b) => b[1] - a[1]);
  const countryEntries = Object.entries(byCountry).map(([c, set]) => [c, set.size]).sort((a, b) => b[1] - a[1]);
  const dayEntries = Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0]));
  reportState.last = { from, to, stats, clickEntries, countryEntries, dayEntries, charts: {} };

  // Barra de exportación
  const exportBar = h("div", { class: "actions", style: "margin:0 0 1.1rem" }, [
    h("button", { class: "btn", onclick: exportPDF }, [svg(ICON.download), "Descargar PDF"]),
    h("button", { class: "btn ghost", onclick: exportCSV }, [svg(ICON.download), "Exportar CSV"]),
  ]);

  contentEl.innerHTML = "";
  if (!events.length) {
    contentEl.append(grid, h("p", { class: "muted", text: "Sin datos en el período seleccionado." }));
    return;
  }
  const c0 = h("canvas", {});
  const c1 = h("canvas", {});
  const c2 = h("canvas", {});
  const chartCard = (title, canvas) =>
    h("div", { class: "card" }, [h("h3", { text: title }), h("div", { class: "chart-box" }, [canvas])]);
  contentEl.append(exportBar, grid,
    chartCard("Aperturas por día", c0),
    h("div", { class: "report-2col" }, [
      chartCard("Botones más usados", c1),
      chartCard("Usuarios por país", c2),
    ]));

  reportState.charts.forEach((ch) => ch.destroy());
  reportState.charts = [];
  if (typeof Chart === "undefined") return;
  const noLegend = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } };

  const trend = new Chart(c0, {
    type: "line",
    data: {
      labels: dayEntries.map(([d]) => d.slice(5)),
      datasets: [{
        data: dayEntries.map(([, v]) => v), borderColor: "#4f8cff", borderWidth: 2,
        backgroundColor: "rgba(79,140,255,.18)", fill: true, tension: .35, pointRadius: 3, pointBackgroundColor: "#4f8cff",
      }],
    },
    options: noLegend,
  });
  const clicksChart = new Chart(c1, {
    type: "bar",
    data: {
      labels: clickEntries.map(([k]) => CLICK_LABELS[k] || k),
      datasets: [{ data: clickEntries.map(([, v]) => v), backgroundColor: "#3B82F6", borderRadius: 6 }],
    },
    options: noLegend,
  });
  const countryChart = new Chart(c2, {
    type: "bar",
    data: {
      labels: countryEntries.map(([c]) => `${flag(c)} ${c}`),
      datasets: [{ data: countryEntries.map(([, v]) => v), backgroundColor: "#FACC15", borderRadius: 6 }],
    },
    options: noLegend,
  });
  reportState.charts.push(trend, clicksChart, countryChart);
  reportState.last.charts = { trend, clicks: clicksChart, country: countryChart };
}

/* ── Exportación de reportes ──────────────────────────────── */
function periodLabel() {
  const L = { dia: "Hoy", semana: "Última semana", mes: "Último mes", trimestre: "Último trimestre", semestre: "Último semestre", anio: "Último año" };
  if (reportState.preset) return L[reportState.preset] || reportState.preset;
  const f = (d) => d ? d.toLocaleDateString("es-CO") : "—";
  return `${f(reportState.from)} — ${f(reportState.to)}`;
}

function exportCSV() {
  const r = reportState.last;
  if (!r) { toast("Genera un reporte primero.", true); return; }
  const rows = [["Radio Demo — Reporte"], ["Período", periodLabel()], [], ["Métrica", "Valor"]];
  r.stats.forEach(([label, val]) => rows.push([label, val]));
  rows.push([], ["Botón", "Usos"]);
  r.clickEntries.forEach(([k, v]) => rows.push([CLICK_LABELS[k] || k, v]));
  rows.push([], ["País", "Usuarios"]);
  r.countryEntries.forEach(([c, v]) => rows.push([c, v]));
  rows.push([], ["Día", "Aperturas"]);
  r.dayEntries.forEach(([d, v]) => rows.push([d, v]));
  const csv = rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, `reporte-radio-demo-${todayStamp()}.csv`);
  toast("CSV descargado.");
}

async function getLogoDataURL() {
  try {
    const rec = (await pb.collection("app_config").getList(1, 1)).items[0];
    const url = fileUrl(rec, "logo");
    if (!url) return null;
    const blob = await (await fetch(url)).blob();
    return await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => res(null); fr.readAsDataURL(blob); });
  } catch (e) { return null; }
}

async function exportPDF() {
  const r = reportState.last;
  if (!r) { toast("Genera un reporte primero.", true); return; }
  if (!window.jspdf || !window.jspdf.jsPDF) { toast("No cargó la librería PDF.", true); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const navy = [10, 21, 48], blue = [79, 140, 255], gold = [255, 200, 61];

  // Cabecera membretada
  doc.setFillColor(...navy); doc.rect(0, 0, W, 92, "F");
  doc.setFillColor(...gold); doc.rect(0, 92, W, 4, "F");
  const logo = await getLogoDataURL();
  if (logo) { try { doc.addImage(logo, "PNG", 40, 22, 48, 48); } catch (e) {} }
  doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.setFontSize(20);
  doc.text("Radio Demo 100.0 FM", logo ? 100 : 40, 46);
  doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(200, 210, 240);
  doc.text("Reporte de analítica · " + periodLabel(), logo ? 100 : 40, 66);

  let y = 120;
  // KPIs en rejilla 3x2
  doc.setFontSize(13); doc.setTextColor(...navy); doc.setFont("helvetica", "bold");
  doc.text("Indicadores", 40, y); y += 12;
  const colW = (W - 80) / 3;
  r.stats.forEach(([label, val], i) => {
    const cx = 40 + (i % 3) * colW, cy = y + Math.floor(i / 3) * 56;
    doc.setDrawColor(225); doc.setFillColor(247, 249, 253);
    doc.roundedRect(cx, cy, colW - 12, 46, 6, 6, "FD");
    doc.setTextColor(...blue); doc.setFont("helvetica", "bold"); doc.setFontSize(16);
    doc.text(String(val), cx + 12, cy + 22);
    doc.setTextColor(110); doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.text(label, cx + 12, cy + 37);
  });
  y += 2 * 56 + 14;

  // Gráficas
  const addChart = (chart, title) => {
    if (!chart) return;
    try {
      const img = chart.toBase64Image("image/png", 1);
      if (y > 700) { doc.addPage(); y = 50; }
      doc.setTextColor(...navy); doc.setFont("helvetica", "bold"); doc.setFontSize(12);
      doc.text(title, 40, y); y += 8;
      doc.addImage(img, "PNG", 40, y, W - 80, 150); y += 168;
    } catch (e) {}
  };
  addChart(r.charts.trend, "Aperturas por día");
  addChart(r.charts.clicks, "Botones más usados");
  addChart(r.charts.country, "Usuarios por país");

  // Tabla de detalle
  if (doc.autoTable) {
    doc.autoTable({
      startY: y > 720 ? (doc.addPage(), 50) : y,
      head: [["Botón / acción", "Usos"]],
      body: r.clickEntries.map(([k, v]) => [CLICK_LABELS[k] || k, String(v)]),
      headStyles: { fillColor: navy }, styles: { fontSize: 9 }, theme: "striped", margin: { left: 40, right: 40 },
    });
  }

  // Pie de página
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i); doc.setFontSize(8); doc.setTextColor(150);
    doc.text(`Radio Demo 100.0 FM · Generado ${new Date().toLocaleString("es-CO")}`, 40, doc.internal.pageSize.getHeight() - 20);
    doc.text(`Pág. ${i}/${pages}`, W - 70, doc.internal.pageSize.getHeight() - 20);
  }
  doc.save(`reporte-radio-demo-${todayStamp()}.pdf`);
  toast("PDF generado.");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = h("a", { href: url, download: filename });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function todayStamp() { return new Date().toISOString().slice(0, 10); }

/* ── Boot ─────────────────────────────────────────────────── */
loadBrandLogo();
if (pb.authStore.isValid) {
  // isValid solo mira la expiración local del JWT. Validar contra el server:
  // si PB se reinició/redeployó, el token quedó inválido aunque "no expirado".
  showApp();
  pb.collection("_superusers").authRefresh().catch((e) => {
    if (isAuthError(e)) { pb.authStore.clear(); showLogin(); }
  });
}
