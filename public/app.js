// Donation page logic: language toggle, project list, amount choice,
// and opening the secure Moneris Checkout form.

import projects from "./projects.js";

// ---------- Text in both languages (edit wording here) ----------
const TEXT = {
  en: {
    toggle: "Français",
    title: "Make a donation",
    intro: "Your generous gift supports the programs and activities of the Chabad Lubavitch Youth Organization.",
    projectLabel: "Where should your gift go?",
    amountLabel: "Amount (CAD)",
    otherPlaceholder: "Other amount",
    donateBtn: "Donate",
    secure: "🔒 Payments are processed securely by Moneris. We never see your card number.",
    again: "Make another donation",
    errProject: "Please choose where your gift should go.",
    errAmount: "Please choose or enter an amount of at least $1.",
    errNetwork: "Something went wrong. Please try again in a moment.",
    working: "Opening secure payment…",
    thanksTitle: "Thank you!",
    thanksText: (name) => `${name ? name + ", your" : "Your"} donation was received. A confirmation will be sent to your email.`,
    declinedTitle: "Payment not completed",
    declinedText: "Your card was not charged. Please check your details and try again.",
    pendingTitle: "We couldn't confirm your payment",
    pendingText: "Please don't donate again yet. Check your email for a confirmation, or contact us.",
    dAmount: "Amount",
    dProject: "Project",
    dOrder: "Reference",
  },
  fr: {
    toggle: "English",
    title: "Faire un don",
    intro: "Votre généreux don soutient les programmes et activités de la Chabad Lubavitch Youth Organization.",
    projectLabel: "À quel projet destinez-vous votre don?",
    amountLabel: "Montant (CAD)",
    otherPlaceholder: "Autre montant",
    donateBtn: "Donner",
    secure: "🔒 Les paiements sont traités de façon sécurisée par Moneris. Nous ne voyons jamais votre numéro de carte.",
    again: "Faire un autre don",
    errProject: "Veuillez choisir un projet.",
    errAmount: "Veuillez choisir ou entrer un montant d'au moins 1 $.",
    errNetwork: "Une erreur est survenue. Veuillez réessayer dans un instant.",
    working: "Ouverture du paiement sécurisé…",
    thanksTitle: "Merci!",
    thanksText: (name) => `${name ? name + ", votre" : "Votre"} don a bien été reçu. Une confirmation vous sera envoyée par courriel.`,
    declinedTitle: "Paiement non complété",
    declinedText: "Votre carte n'a pas été débitée. Veuillez vérifier vos informations et réessayer.",
    pendingTitle: "Nous n'avons pas pu confirmer votre paiement",
    pendingText: "Veuillez ne pas refaire de don pour l'instant. Vérifiez vos courriels ou communiquez avec nous.",
    dAmount: "Montant",
    dProject: "Projet",
    dOrder: "Référence",
  },
};

// ---------- State ----------
const $ = (id) => document.getElementById(id);
let lang = loadLang();
let amount = null;
let ticket = null;
let checkout = null;
let finished = false;

// ---------- Language ----------
function loadLang() {
  const q = new URLSearchParams(location.search).get("lang");
  if (q === "fr" || q === "en") return q;
  try {
    const saved = localStorage.getItem("donateLang");
    if (saved === "fr" || saved === "en") return saved;
  } catch {}
  return (navigator.language || "").toLowerCase().startsWith("fr") ? "fr" : "en";
}

function applyLang() {
  const t = TEXT[lang];
  document.documentElement.lang = lang;
  $("langToggle").textContent = t.toggle;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const v = t[el.dataset.i18n];
    if (typeof v === "string") el.textContent = v;
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t[el.dataset.i18nPlaceholder];
  });
  fillProjects();
  updateButton();
}

$("langToggle").addEventListener("click", () => {
  lang = lang === "en" ? "fr" : "en";
  try { localStorage.setItem("donateLang", lang); } catch {}
  applyLang();
});

// ---------- Projects ----------
function fillProjects() {
  const sel = $("project");
  const current = sel.value || new URLSearchParams(location.search).get("project")?.toUpperCase();
  sel.innerHTML = "";
  for (const p of projects) {
    const opt = document.createElement("option");
    opt.value = p.code;
    opt.textContent = p[lang] || p.en;
    sel.appendChild(opt);
  }
  if (current && projects.some((p) => p.code === current)) sel.value = current;
}

const projectName = (code) => {
  const p = projects.find((x) => x.code === code);
  return p ? p[lang] || p.en : code;
};

// ---------- Amount ----------
const money = (n) =>
  new Intl.NumberFormat(lang === "fr" ? "fr-CA" : "en-CA", { style: "currency", currency: "CAD" }).format(n);

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach((c) => c.classList.remove("selected"));
    chip.classList.add("selected");
    $("otherAmount").value = "";
    amount = Number(chip.dataset.amount);
    hideError();
    updateButton();
  });
});

$("otherAmount").addEventListener("input", (e) => {
  document.querySelectorAll(".chip").forEach((c) => c.classList.remove("selected"));
  const v = Number(e.target.value);
  amount = Number.isFinite(v) && v > 0 ? Math.round(v * 100) / 100 : null;
  hideError();
  updateButton();
});

function updateButton() {
  $("btnAmount").textContent = amount ? money(amount) : "";
}

// ---------- Errors ----------
function showError(msg) {
  const el = $("formError");
  el.textContent = msg;
  el.hidden = false;
}
function hideError() {
  $("formError").hidden = true;
}

// ---------- Donate ----------
$("donateForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const t = TEXT[lang];
  const project = $("project").value;
  if (!project) return showError(t.errProject);
  if (!amount || amount < 1) return showError(t.errAmount);

  const btn = $("donateBtn");
  btn.disabled = true;
  const btnHtml = btn.innerHTML;
  btn.textContent = t.working;

  try {
    const res = await fetch("/api/preload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, project, lang }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ticket) throw new Error(t.errNetwork);

    await loadMonerisScript(data.mode);
    openCheckout(data.ticket, data.mode, project);
  } catch (err) {
    showError(t.errNetwork);
  } finally {
    btn.disabled = false;
    btn.innerHTML = btnHtml;
    updateButton();
  }
});

function loadMonerisScript(mode) {
  if (window.monerisCheckout) return Promise.resolve();
  const host = mode === "prod" ? "gateway.moneris.com" : "gatewayt.moneris.com";
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://${host}/chktv2/js/chkt_v3.00.js`;
    s.onload = resolve;
    s.onerror = () => reject(new Error(TEXT[lang].errNetwork));
    document.head.appendChild(s);
  });
}

function openCheckout(newTicket, mode, project) {
  ticket = newTicket;
  finished = false;
  $("checkoutOverlay").hidden = false;
  document.body.style.overflow = "hidden";

  checkout = new window.monerisCheckout();
  checkout.setMode(mode === "prod" ? "prod" : "qa");
  checkout.setCheckoutDiv("monerisCheckout");

  const ticketFrom = (msg) => {
    try { return JSON.parse(msg).ticket || ticket; } catch { return ticket; }
  };

  // Payment finished: confirm with our server, then show the result.
  const onDone = (msg) => {
    if (finished) return;
    finished = true;
    closeCheckout();
    confirmPayment(ticketFrom(msg), project);
  };
  checkout.setCallback("payment_receipt", onDone);
  checkout.setCallback("payment_complete", onDone);

  // Donor cancelled or closed the window.
  const onClose = () => {
    if (finished) return;
    closeCheckout();
  };
  checkout.setCallback("cancel_transaction", onClose);
  checkout.setCallback("page_closed", onClose);

  checkout.setCallback("error_event", () => {
    if (finished) return;
    closeCheckout();
    showError(TEXT[lang].errNetwork);
  });

  checkout.startCheckout(ticket);
}

function closeCheckout() {
  try { checkout && checkout.closeCheckout(ticket); } catch {}
  $("checkoutOverlay").hidden = true;
  $("monerisCheckout").innerHTML = "";
  document.body.style.overflow = "";
}

async function confirmPayment(tk, project) {
  const t = TEXT[lang];
  try {
    const res = await fetch("/api/receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticket: tk }),
    });
    const r = await res.json();
    if (!res.ok) throw new Error();
    if (r.approved) {
      showResult(t.thanksTitle, t.thanksText(r.firstName), [
        [t.dAmount, r.amount ? money(Number(r.amount)) : money(amount)],
        [t.dProject, projectName(project)],
        [t.dOrder, r.orderNo],
      ]);
    } else {
      showResult(t.declinedTitle, t.declinedText, []);
    }
  } catch {
    showResult(t.pendingTitle, t.pendingText, []);
  }
}

function showResult(title, text, rows) {
  $("formView").hidden = true;
  $("resultView").hidden = false;
  $("resultTitle").textContent = title;
  $("resultText").textContent = text;
  const dl = $("resultDetails");
  dl.innerHTML = "";
  for (const [k, v] of rows) {
    if (!v) continue;
    const dt = document.createElement("dt");
    dt.textContent = k;
    const dd = document.createElement("dd");
    dd.textContent = v;
    dl.append(dt, dd);
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

$("againBtn").addEventListener("click", () => {
  $("resultView").hidden = true;
  $("formView").hidden = false;
});

// ---------- Start ----------
applyLang();
