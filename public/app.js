// Donation page logic: language toggle, project list, amount choice,
// sending the donor to Stripe's secure payment page, and the thank-you message.

import projects, { SORT } from "./projects.js";

// ---------- Text in each language (edit wording here) ----------
const TEXT = {
  en: {
    title: "Make a donation",
    intro: "Your generous gift supports the programs and activities of the Chabad Lubavitch Youth Organization.",
    projectLabel: "Where should your gift go?",
    amountLabel: "Amount (CAD)",
    otherPlaceholder: "Enter amount",
    otherProject: "Other (please specify)",
    otherProjPlaceholder: "Please describe",
    errOtherProj: "Please describe what your gift is for.",
    dedLabel: "Dedication (optional)",
    dedPlaceholder: "Name",
    dedTypes: { "": "No dedication", MEM: "In memory of", HON: "In honour of", MER: "In the merit of", REC: "For the recovery of" },
    errDedName: "Please enter the name for the dedication.",
    dDedication: "Dedication",
    donateBtn: "Donate",
    secure: "🔒 Payments are processed securely by Stripe. We never see your card number.",
    cancelled: "Your donation was cancelled and your card was not charged.",
    processingTitle: "Thank you – payment in progress",
    processingText: "Your bank payment is being processed. You will receive a confirmation by email once it is complete.",
    again: "Make another donation",
    errProject: "Please choose where your gift should go.",
    errAmount: "Please enter an amount of at least $5.",
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
    charityNo: "Charitable registration no.",
    headOffice: "Head office: 3429 Peel Street, Montréal, QC\u00a0H3A\u00a01W7",
    mailAddress: "Mailing address: 4842 Carlton Ave., Montréal, QC\u00a0H3W\u00a01G6",
    orgName: "Chabad Lubavitch Youth Organization",
  },
  fr: {
    title: "Faire un don",
    intro: "Votre généreux don soutient les programmes et activités de l'Organisation de la jeunesse Chabad Loubavitch.",
    projectLabel: "À quel projet destinez-vous votre don?",
    amountLabel: "Montant (CAD)",
    otherPlaceholder: "Entrez le montant",
    otherProject: "Autre (veuillez préciser)",
    otherProjPlaceholder: "Veuillez préciser",
    errOtherProj: "Veuillez préciser l'objet de votre don.",
    dedLabel: "Dédicace (facultatif)",
    dedPlaceholder: "Nom",
    dedTypes: { "": "Aucune dédicace", MEM: "À la mémoire de", HON: "En l'honneur de", MER: "Au mérite de", REC: "Pour la guérison de" },
    errDedName: "Veuillez entrer le nom pour la dédicace.",
    dDedication: "Dédicace",
    donateBtn: "Donner",
    secure: "🔒 Les paiements sont traités de façon sécurisée par Stripe. Nous ne voyons jamais votre numéro de carte.",
    cancelled: "Votre don a été annulé et votre carte n'a pas été débitée.",
    processingTitle: "Merci – paiement en cours",
    processingText: "Votre paiement bancaire est en cours de traitement. Vous recevrez une confirmation par courriel une fois terminé.",
    again: "Faire un autre don",
    errProject: "Veuillez choisir un projet.",
    errAmount: "Veuillez entrer un montant d'au moins 5 $.",
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
    charityNo: "No d'enregistrement d'organisme de bienfaisance",
    headOffice: "Siège social\u00a0: 3429, rue Peel, Montréal (Québec)\u00a0H3A\u00a01W7",
    mailAddress: "Adresse postale\u00a0: 4842, avenue Carlton, Montréal (Québec)\u00a0H3W\u00a01G6",
    orgName: "L'Organisation de la jeunesse Chabad Loubavitch",
  },
  he: {
    title: "תרומה",
    intro: "תרומתכם הנדיבה תומכת בתוכניות ובפעילויות של\nצעירי\u00a0אגודת\u00a0חב״ד\u00a0ליובאוויטש.",
    projectLabel: "לאיזו מטרה תרצו לתרום?",
    amountLabel: "סכום (דולר קנדי)",
    otherPlaceholder: "הזינו סכום",
    otherProject: "אחר (נא לפרט)",
    otherProjPlaceholder: "נא לפרט",
    errOtherProj: "נא לפרט את מטרת התרומה.",
    dedLabel: "הקדשה (לא חובה)",
    dedPlaceholder: "שם",
    dedTypes: { "": "ללא הקדשה", MEM: "לעילוי נשמת", HON: "לכבוד", MER: "לזכות", REC: "לרפואת" },
    errDedName: "נא להזין שם להקדשה.",
    dDedication: "הקדשה",
    donateBtn: "לתרומה",
    secure: "🔒 התשלום מעובד באופן מאובטח על ידי Stripe. איננו רואים את מספר הכרטיס שלכם.",
    cancelled: "התרומה בוטלה והכרטיס שלכם לא חויב.",
    processingTitle: "תודה – התשלום בתהליך",
    processingText: "התשלום הבנקאי שלכם בעיבוד. אישור יישלח אליכם בדוא״ל עם השלמתו.",
    again: "לתרומה נוספת",
    errProject: "נא לבחור מטרה לתרומה.",
    errAmount: "נא להזין סכום של ‎$5‎ לפחות.",
    errNetwork: "אירעה שגיאה. נא לנסות שוב בעוד רגע.",
    working: "פותח תשלום מאובטח…",
    thanksTitle: "תודה רבה!",
    thanksText: (name) => `${name ? name + ", " : ""}תרומתכם התקבלה. אישור יישלח לכתובת הדוא״ל שלכם.`,
    declinedTitle: "התשלום לא הושלם",
    declinedText: "הכרטיס שלכם לא חויב. נא לבדוק את הפרטים ולנסות שוב.",
    pendingTitle: "לא הצלחנו לאשר את התשלום",
    pendingText: "נא לא לתרום שוב בינתיים. בדקו בדוא״ל אם התקבל אישור, או צרו איתנו קשר.",
    dAmount: "סכום",
    dProject: "מטרה",
    dOrder: "אסמכתא",
    // Registration line stays in English (not an address; legal wording).
    charityNo: "Charitable registration no.",
    // Hebrew title on the left, then the address exactly as in English.
    // (\u2067 … \u2069 keep the Hebrew title separate, so the street number stays with the street.)
    // (The footer reads left-to-right on every page; see .org in styles.css.)
    headOffice: "\u2067משרד ראשי\u2069: 3429 Peel Street, Montréal, QC\u00a0H3A\u00a01W7",
    mailAddress: "\u2067כתובת למשלוח דואר\u2069: 4842 Carlton Ave., Montréal, QC\u00a0H3W\u00a01G6",
    // Legal name stays in English: the charity has no registered Hebrew name with the CRA.
    orgName: "Chabad Lubavitch Youth Organization",
  },
};

// ---------- State ----------
const $ = (id) => document.getElementById(id);
const LANGS = ["en", "fr", "he"];
let lang = loadLang();
let amount = null;
// Any letter in any alphabet (English, French, Hebrew…)
const hasLetter = (s) => /\p{L}/u.test(s);

// ---------- Language ----------
function loadLang() {
  const q = new URLSearchParams(location.search).get("lang");
  if (LANGS.includes(q)) return q;
  try {
    const saved = localStorage.getItem("donateLang");
    if (LANGS.includes(saved)) return saved;
  } catch {}
  const nav = (navigator.language || "").toLowerCase();
  if (nav.startsWith("fr")) return "fr";
  if (nav.startsWith("he") || nav.startsWith("iw")) return "he";
  return "en";
}

function applyLang() {
  const t = TEXT[lang];
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
  document.querySelectorAll(".lang").forEach((b) => {
    const on = b.dataset.lang === lang;
    b.classList.toggle("active", on);
    b.setAttribute("aria-pressed", on ? "true" : "false");
  });
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const v = t[el.dataset.i18n];
    if (typeof v === "string") el.textContent = v;
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t[el.dataset.i18nPlaceholder];
  });
  fillProjects();
  fillDedications();
  updateButton();
}

document.querySelectorAll(".lang").forEach((b) =>
  b.addEventListener("click", () => {
    lang = b.dataset.lang;
    try { localStorage.setItem("donateLang", lang); } catch {}
    applyLang();
    hideError();
  })
);

// ---------- Projects ----------
function fillProjects() {
  const sel = $("project");
  const current = sel.value || new URLSearchParams(location.search).get("project")?.toUpperCase();
  sel.innerHTML = "";
  for (const p of sortedProjects()) {
    const opt = document.createElement("option");
    opt.value = p.code;
    opt.textContent = p[lang] || p.en;
    sel.appendChild(opt);
  }
  const other = document.createElement("option");
  other.value = "OTHER";
  other.textContent = TEXT[lang].otherProject;
  sel.appendChild(other);
  if (current && (current === "OTHER" || projects.some((p) => p.code === current))) sel.value = current;
  $("otherProject").hidden = sel.value !== "OTHER";
}

// The list in the order chosen in projects.js (SORT). The first project stays on top.
function sortedProjects() {
  if (SORT !== "alphabet") return projects;
  const [first, ...rest] = projects;
  const name = (p) => p[lang] || p.en;
  const collator = new Intl.Collator({ fr: "fr-CA", he: "he" }[lang] || "en-CA", { sensitivity: "base", ignorePunctuation: true });
  return [first, ...rest.sort((a, b) => collator.compare(name(a), name(b)))];
}

$("project").addEventListener("change", () => {
  const isOther = $("project").value === "OTHER";
  $("otherProject").hidden = !isOther;
  if (isOther) $("otherProject").focus();
  hideError();
});

const projectName = (code) => {
  if (code === "OTHER") return $("otherProject").value.trim();
  const p = projects.find((x) => x.code === code);
  return p ? p[lang] || p.en : code;
};

// ---------- Dedication ----------
function fillDedications() {
  const sel = $("dedType");
  const current = sel.value;
  sel.innerHTML = "";
  for (const [code, label] of Object.entries(TEXT[lang].dedTypes)) {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = label;
    sel.appendChild(opt);
  }
  sel.value = current || "";
}

$("dedType").addEventListener("change", () => {
  const on = $("dedType").value !== "";
  $("dedName").disabled = !on;
  if (on) $("dedName").focus();
  else $("dedName").value = "";
  hideError();
});

// ---------- Amount ----------
// Amounts are written the same way on every page: "$36.00".
// In Hebrew it is kept left-to-right (\u2066 … \u2069).
const money = (n) => {
  const s = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n);
  return lang === "he" ? "\u2066" + s + "\u2069" : s;
};

// Reads the amount the same way in every language: "55", "55.00", "55,00", "$55", "1 000" or "1,000.50".
function parseAmount(text) {
  let s = String(text).replace(/[\s$\u00a0]/g, "");
  if (/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(s)) s = s.replace(/,/g, ""); // 1,000.50
  else s = s.replace(",", ".");                                          // 55,00
  return /^\d+(\.\d{1,2})?$/.test(s) ? Number(s) : NaN;
}

$("otherAmount").addEventListener("input", (e) => {
  const v = parseAmount(e.target.value);
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
  const otherText = project === "OTHER" ? $("otherProject").value.trim() : "";
  if (project === "OTHER" && !hasLetter(otherText)) return showError(t.errOtherProj);
  if (!amount || amount < 5) return showError(t.errAmount);
  const dedType = $("dedType").value;
  const dedName = $("dedName").value.trim();
  if (dedType && !dedName) return showError(t.errDedName);

  const btn = $("donateBtn");
  btn.disabled = true;
  const btnHtml = btn.innerHTML;
  btn.textContent = t.working;

  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, project, otherText, lang, dedType, dedName }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) throw new Error("Checkout failed: " + res.status + " " + JSON.stringify(data));
    // Go to Stripe's secure payment page; Stripe sends the donor back here afterwards.
    location.assign(data.url);
  } catch (err) {
    console.error("Donation error:", err);
    showError(t.errNetwork);
    btn.disabled = false;
    btn.innerHTML = btnHtml;
    updateButton();
  }
});

// The page is shown again if the donor uses the Back button from Stripe.
window.addEventListener("pageshow", (e) => {
  if (!e.persisted) return;
  const btn = $("donateBtn");
  btn.disabled = false;
  btn.innerHTML = '<span data-i18n="donateBtn"></span> <span id="btnAmount"></span>';
  applyLang();
});

// ---------- Back from Stripe ----------
async function handleReturn() {
  const q = new URLSearchParams(location.search);
  const t = TEXT[lang];

  if (q.get("cancelled")) {
    showError(t.cancelled);
    cleanUrl();
    return;
  }

  const sessionId = q.get("session_id");
  if (!sessionId) return;
  cleanUrl();

  try {
    const res = await fetch("/api/session?id=" + encodeURIComponent(sessionId));
    const r = await res.json();
    if (!res.ok) throw new Error();
    const projectLabel = r.projectCode === "OTHER" ? r.otherText : projectName(r.projectCode);
    const rows = [
      [t.dAmount, r.amount ? money(r.amount) : ""],
      [t.dProject, projectLabel],
      [t.dOrder, r.orderNo],
    ];
    if (r.status === "paid") showResult(t.thanksTitle, t.thanksText(r.firstName), rows);
    else if (r.status === "processing") showResult(t.processingTitle, t.processingText, rows);
    else showResult(t.declinedTitle, t.declinedText, []);
  } catch {
    showResult(t.pendingTitle, t.pendingText, []);
  }
}

// Remove ?session_id=… from the address bar, so a refresh or a shared link
// doesn't show the thank-you message again.
function cleanUrl() {
  const q = new URLSearchParams(location.search);
  q.delete("session_id");
  q.delete("cancelled");
  const rest = q.toString();
  history.replaceState(null, "", location.pathname + (rest ? "?" + rest : ""));
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
handleReturn();
