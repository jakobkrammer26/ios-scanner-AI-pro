import React, { useState, useEffect, useRef } from "react";
import { Camera, Folder, Plus, Trash2, Download, RefreshCw, AlertCircle, CheckCircle, FileText, Calendar, TrendingUp, Sparkles, X, Eye } from "lucide-react";
import { MOCK_RECEIPT_OPTIONS, generateReceiptImage } from "./mockReceipts";
export default function App() {
    var _a;
    const [currentUser, setCurrentUser] = useState(() => {
        const saved = localStorage.getItem("user_session");
        if (saved) {
            try {
                return JSON.parse(saved);
            }
            catch (e) {
                return null;
            }
        }
        return null;
    });
    const [authMode, setAuthMode] = useState("login");
    const [authForm, setAuthForm] = useState({
        email: "",
        name: "",
        password: ""
    });
    const [authError, setAuthError] = useState(null);
    const [authLoading, setAuthLoading] = useState(false);
    const [receipts, setReceipts] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    // Active filter for categories (null means all)
    const [activeCategoryFilter, setActiveCategoryFilter] = useState(null);
    const [activeKontoFilter, setActiveKontoFilter] = useState(null);
    // Camera State
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    // Manual Form State
    const [showManualForm, setShowManualForm] = useState(false);
    const [manualForm, setManualForm] = useState({
        geschaeft: "",
        datum: new Date().toLocaleDateString("de-DE"),
        gesamtbetrag: "",
        kategorie: "Sonstiges",
        bemerkung: "",
        kontoId: "acc_1"
    });
    // Account Form State (inline)
    const [showAccountForm, setShowAccountForm] = useState(false);
    const [accountForm, setAccountForm] = useState({
        name: "",
        kontotyp: "Bankkonto",
        startguthaben: "",
        farbe: "indigo"
    });
    // Selected Receipt Modal
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    // Custom File Upload Input
    const fileInputRef = useRef(null);
    // Helper to generate auth headers
    const getHeaders = () => {
        const headers = {
            "Content-Type": "application/json"
        };
        if (currentUser === null || currentUser === void 0 ? void 0 : currentUser.token) {
            headers["Authorization"] = `Bearer ${currentUser.token}`;
        }
        return headers;
    };
    // Auth Handlers
    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        setAuthError(null);
        setAuthLoading(true);
        const url = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
        const body = authMode === "login"
            ? { email: authForm.email, password: authForm.password }
            : { email: authForm.email, name: authForm.name, password: authForm.password };
        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Authentifizierung fehlgeschlagen.");
            }
            localStorage.setItem("user_session", JSON.stringify(data));
            setCurrentUser(data);
            setSuccessMsg(authMode === "login" ? "Erfolgreich eingeloggt!" : "Konto erfolgreich erstellt!");
        }
        catch (err) {
            setAuthError(err.message);
        }
        finally {
            setAuthLoading(false);
        }
    };
    const handleDemoLogin = async () => {
        setAuthError(null);
        setAuthLoading(true);
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: "demo@example.com", password: "demo123" })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Demo-Login fehlgeschlagen.");
            }
            localStorage.setItem("user_session", JSON.stringify(data));
            setCurrentUser(data);
            setSuccessMsg("Erfolgreich als Demo-User angemeldet!");
        }
        catch (err) {
            setAuthError(err.message);
        }
        finally {
            setAuthLoading(false);
        }
    };
    const handleLogout = () => {
        localStorage.removeItem("user_session");
        setCurrentUser(null);
        setReceipts([]);
        setAccounts([]);
        setSuccessMsg("Erfolgreich abgemeldet.");
    };
    // Fetch receipts from Server
    const fetchReceipts = async () => {
        if (!currentUser)
            return;
        setLoading(true);
        try {
            const res = await fetch("/api/receipts", {
                headers: getHeaders()
            });
            if (!res.ok)
                throw new Error("Fehler beim Laden der Belege");
            const data = await res.json();
            setReceipts(data);
        }
        catch (err) {
            setError(err.message || "Verbindung zum Server fehlgeschlagen.");
        }
        finally {
            setLoading(false);
        }
    };
    // Fetch accounts from Server
    const fetchAccounts = async () => {
        if (!currentUser)
            return;
        try {
            const res = await fetch("/api/accounts", {
                headers: getHeaders()
            });
            if (!res.ok)
                throw new Error("Fehler beim Laden der Konten");
            const data = await res.json();
            setAccounts(data);
        }
        catch (err) {
            setError(err.message || "Konnte Konten nicht laden.");
        }
    };
    useEffect(() => {
        if (currentUser) {
            fetchReceipts();
            fetchAccounts();
        }
    }, [currentUser]);
    // Set timeout for success messages
    useEffect(() => {
        if (successMsg) {
            const timer = setTimeout(() => setSuccessMsg(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [successMsg]);
    // Start Camera
    const startCamera = async () => {
        setError(null);
        setCapturedImage(null);
        setIsCameraActive(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        }
        catch (err) {
            console.warn("Kamera konnte nicht gestartet werden, verwende Fallback-Upload:", err);
            setError("Webcam-Zugriff nicht möglich (IFrame-Beschränkung oder keine Kamera). Bitte nutze die Vorlagen oder lade eine Datei hoch.");
            setIsCameraActive(false);
        }
    };
    // Stop Camera
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraActive(false);
    };
    // Capture Photo
    const capturePhoto = () => {
        if (!videoRef.current)
            return;
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/jpeg");
            setCapturedImage(dataUrl);
            stopCamera();
        }
    };
    // Upload/Process scanned receipt
    const processReceiptImage = async (base64Image) => {
        setProcessing(true);
        setError(null);
        try {
            // 1. Send image to Gemini API backend
            const response = await fetch("/api/process-receipt", {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ imageBase64: base64Image, mimeType: "image/jpeg" })
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Analyse fehlgeschlagen");
            }
            const parsedResult = await response.json();
            // 2. Save categorized receipt into database
            const saveResponse = await fetch("/api/receipts", {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({
                    geschaeft: parsedResult.geschaeft,
                    datum: parsedResult.datum,
                    gesamtbetrag: parsedResult.gesamtbetrag,
                    kategorie: parsedResult.kategorie,
                    image: base64Image,
                    bemerkung: parsedResult.bemerkung || "Automatisch erfasst mit Gemini",
                    kontoId: parsedResult.kontoId || "acc_1"
                })
            });
            if (!saveResponse.ok) {
                throw new Error("Fehler beim Speichern in der Belegdatenbank.");
            }
            const newReceipt = await saveResponse.json();
            setReceipts(prev => [newReceipt, ...prev]);
            setSuccessMsg(`Erfolgreich ausgelesen: ${newReceipt.geschaeft} (${newReceipt.gesamtbetrag.toFixed(2)} €)`);
            setCapturedImage(null);
        }
        catch (err) {
            console.error(err);
            setError("Analysefehler: " + (err.message || "Bitte stellen Sie sicher, dass Ihr GEMINI_API_KEY gültig ist."));
        }
        finally {
            setProcessing(false);
        }
    };
    // Trigger file selection
    const handleFileChange = (e) => {
        var _a;
        const file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result;
            setCapturedImage(base64);
        };
        reader.readAsDataURL(file);
    };
    // Use a pre-generated mock template
    const handleUseMockTemplate = (option) => {
        setError(null);
        const todayStr = new Date().toLocaleDateString("de-DE");
        const mockImageBase64 = generateReceiptImage(option, todayStr);
        setCapturedImage(mockImageBase64);
    };
    // Delete Receipt
    const handleDeleteReceipt = async (id, e) => {
        e.stopPropagation();
        if (!confirm("Möchten Sie diesen Beleg wirklich löschen?"))
            return;
        try {
            const res = await fetch(`/api/receipts/${id}`, {
                method: "DELETE",
                headers: getHeaders()
            });
            if (!res.ok)
                throw new Error("Fehler beim Löschen des Belegs");
            setReceipts(prev => prev.filter(r => r.id !== id));
            setSuccessMsg("Beleg wurde erfolgreich gelöscht.");
            if ((selectedReceipt === null || selectedReceipt === void 0 ? void 0 : selectedReceipt.id) === id) {
                setSelectedReceipt(null);
            }
        }
        catch (err) {
            setError(err.message);
        }
    };
    // Reset database to default
    const handleResetDb = async () => {
        if (!confirm("Möchten Sie alle Ihre Belege wirklich löschen?"))
            return;
        try {
            for (const rec of receipts) {
                await fetch(`/api/receipts/${rec.id}`, {
                    method: "DELETE",
                    headers: getHeaders()
                });
            }
            setReceipts([]);
            setSuccessMsg("Belege gelöscht.");
            setActiveCategoryFilter(null);
        }
        catch (err) {
            setError("Fehler beim Zurücksetzen: " + err.message);
        }
    };
    // Manual receipt addition
    const handleManualSubmit = async (e) => {
        e.preventDefault();
        if (!manualForm.geschaeft || !manualForm.gesamtbetrag || !manualForm.datum) {
            setError("Bitte füllen Sie alle Pflichtfelder aus.");
            return;
        }
        try {
            const res = await fetch("/api/receipts", {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({
                    geschaeft: manualForm.geschaeft,
                    datum: manualForm.datum,
                    gesamtbetrag: Number(manualForm.gesamtbetrag.replace(",", ".")),
                    kategorie: manualForm.kategorie,
                    bemerkung: manualForm.bemerkung || "Manuell eingetragen",
                    kontoId: manualForm.kontoId || "acc_1"
                })
            });
            if (!res.ok)
                throw new Error("Fehler beim manuellen Speichern.");
            const newRec = await res.json();
            setReceipts(prev => [newRec, ...prev]);
            setSuccessMsg("Beleg wurde manuell hinzugefügt.");
            setShowManualForm(false);
            setManualForm({
                geschaeft: "",
                datum: new Date().toLocaleDateString("de-DE"),
                gesamtbetrag: "",
                kategorie: "Sonstiges",
                bemerkung: "",
                kontoId: "acc_1"
            });
        }
        catch (err) {
            setError(err.message);
        }
    };
    // Export to CSV/Excel
    const handleExportCSV = () => {
        if (receipts.length === 0) {
            alert("Keine Daten zum Exportieren vorhanden.");
            return;
        }
        const headers = ["ID", "Datum", "Geschaeft", "Kategorie", "Betrag EUR", "Bemerkung", "Erstellt Am"];
        const rows = receipts.map(r => [
            r.id,
            r.datum,
            `"${r.geschaeft.replace(/"/g, '""')}"`,
            r.kategorie,
            r.gesamtbetrag.toFixed(2).replace(".", ","),
            `"${(r.bemerkung || "").replace(/"/g, '""')}"`,
            r.erstelltAm
        ]);
        const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(e => e.join(";"))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `beleg_export_${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    // Recurrence analysis:
    // Detects if there are multiple entries of the exact same business name.
    // If count >= 2, we consider it a recurring candidate ("Wiederkehrend").
    const analyzeRecurringExpenses = () => {
        const counts = {};
        receipts.forEach(r => {
            const cleanName = r.geschaeft.trim().toLowerCase();
            if (!counts[cleanName]) {
                counts[cleanName] = { count: 0, category: r.kategorie, total: 0, dates: [] };
            }
            counts[cleanName].count += 1;
            counts[cleanName].total += r.gesamtbetrag;
            counts[cleanName].dates.push(r.datum);
        });
        return Object.entries(counts)
            .filter(([_, stats]) => stats.count >= 2)
            .map(([name, stats]) => ({
            name: name.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
            category: stats.category,
            count: stats.count,
            totalAverage: stats.total / stats.count,
            interval: "Monatlich (erkannt)"
        }));
    };
    const recurringList = analyzeRecurringExpenses();
    // Folder helper mappings
    // Tanken -> Fahrtkosten
    // Büromaterial -> Büro
    // Bewirtung -> Essen
    // Sonstiges -> Sonstiges
    const getFolderCounts = () => {
        const stats = {
            Fahrtkosten: { count: 0, sum: 0 },
            Büro: { count: 0, sum: 0 },
            Essen: { count: 0, sum: 0 },
            Sonstiges: { count: 0, sum: 0 }
        };
        receipts.forEach(r => {
            if (stats[r.kategorie]) {
                stats[r.kategorie].count += 1;
                stats[r.kategorie].sum += r.gesamtbetrag;
            }
        });
        return stats;
    };
    const folderStats = getFolderCounts();
    // Filtered receipts by category and/or account
    const filteredReceipts = receipts.filter(r => {
        const matchesCategory = activeCategoryFilter ? r.kategorie === activeCategoryFilter : true;
        const matchesKonto = activeKontoFilter ? r.kontoId === activeKontoFilter : true;
        return matchesCategory && matchesKonto;
    });
    // Monthly totals (filtered by selected account if any, or total of all)
    const totalExpenses = receipts
        .filter(r => activeKontoFilter ? r.kontoId === activeKontoFilter : true)
        .reduce((sum, r) => sum + r.gesamtbetrag, 0);
    // Get computed accounts with current balances
    const accountsWithBalances = accounts.map(acc => {
        // Sum of all receipts associated with this account
        const totalOutflow = receipts
            .filter(r => r.kontoId === acc.id)
            .reduce((sum, r) => sum + r.gesamtbetrag, 0);
        return Object.assign(Object.assign({}, acc), { balance: acc.startguthaben - totalOutflow });
    });
    // Handlers for managing accounts
    const handleAccountSubmit = async (e) => {
        e.preventDefault();
        if (!accountForm.name) {
            setError("Bitte geben Sie einen Kontonamen ein.");
            return;
        }
        try {
            const res = await fetch("/api/accounts", {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({
                    name: accountForm.name,
                    kontotyp: accountForm.kontotyp,
                    startguthaben: Number(accountForm.startguthaben) || 0,
                    farbe: accountForm.farbe
                })
            });
            if (!res.ok)
                throw new Error("Fehler beim Speichern des Kontos");
            const newAcc = await res.json();
            setAccounts(prev => [...prev, newAcc]);
            setSuccessMsg(`Konto "${newAcc.name}" wurde erfolgreich erstellt.`);
            setShowAccountForm(false);
            setAccountForm({
                name: "",
                kontotyp: "Bankkonto",
                startguthaben: "",
                farbe: "indigo"
            });
        }
        catch (err) {
            setError(err.message);
        }
    };
    const handleDeleteAccount = async (id, e) => {
        e.stopPropagation();
        // Check if user has only one account left
        const userAccountsCount = accounts.length;
        if (userAccountsCount <= 1) {
            setError("Ihr einziges verbleibendes Konto kann nicht gelöscht werden.");
            return;
        }
        if (!confirm("Möchten Sie dieses Konto wirklich löschen? Alle verknüpften Belege werden auf Ihr anderes Konto verschoben."))
            return;
        try {
            const res = await fetch(`/api/accounts/${id}`, {
                method: "DELETE",
                headers: getHeaders()
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Fehler beim Löschen des Kontos");
            }
            setAccounts(prev => prev.filter(a => a.id !== id));
            // Refresh receipts because linked ones are shifted on the backend
            fetchReceipts();
            setSuccessMsg("Konto erfolgreich gelöscht.");
            if (activeKontoFilter === id) {
                setActiveKontoFilter(null);
            }
        }
        catch (err) {
            setError(err.message);
        }
    };
    if (!currentUser) {
        return (React.createElement("div", { className: "min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans text-slate-800" },
            React.createElement("div", { className: "w-full max-w-md bg-white rounded-3xl p-8 shadow-sm border border-slate-200" },
                React.createElement("div", { className: "flex flex-col items-center mb-6" },
                    React.createElement("div", { className: "w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 mb-3" },
                        React.createElement(Sparkles, { className: "w-7 h-7 text-white" })),
                    React.createElement("h1", { className: "text-2xl font-black text-slate-900 tracking-tight" }, "BelegMagic AI"),
                    React.createElement("p", { className: "text-xs text-slate-500 font-medium mt-1" }, "Smart Beleg-Scanner & Ausgaben-Manager")),
                React.createElement("h2", { className: "text-lg font-bold text-slate-800 mb-4 text-center" }, authMode === "login" ? "In Ihr Konto einloggen" : "Neues Konto registrieren"),
                authError && (React.createElement("div", { className: "bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-xs mb-4 flex items-start gap-2.5" },
                    React.createElement(AlertCircle, { className: "w-4 h-4 shrink-0 mt-0.5" }),
                    React.createElement("span", null, authError))),
                React.createElement("form", { onSubmit: handleAuthSubmit, className: "space-y-4 text-xs" },
                    authMode === "register" && (React.createElement("div", null,
                        React.createElement("label", { className: "block font-semibold text-slate-700 mb-1" }, "Name"),
                        React.createElement("input", { type: "text", placeholder: "z.B. Max Mustermann", value: authForm.name, onChange: e => setAuthForm(Object.assign(Object.assign({}, authForm), { name: e.target.value })), className: "w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500", required: true }))),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block font-semibold text-slate-700 mb-1" }, "E-Mail-Adresse"),
                        React.createElement("input", { type: "email", placeholder: "ihre.mail@domain.de", value: authForm.email, onChange: e => setAuthForm(Object.assign(Object.assign({}, authForm), { email: e.target.value })), className: "w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500", required: true })),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block font-semibold text-slate-700 mb-1" }, "Passwort"),
                        React.createElement("input", { type: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: authForm.password, onChange: e => setAuthForm(Object.assign(Object.assign({}, authForm), { password: e.target.value })), className: "w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500", required: true })),
                    React.createElement("button", { type: "submit", disabled: authLoading, className: "w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold p-3 rounded-xl transition shadow-md shadow-indigo-150 flex justify-center items-center gap-2" }, authLoading ? (React.createElement(RefreshCw, { className: "w-4 h-4 animate-spin" })) : (React.createElement("span", null, authMode === "login" ? "Anmelden" : "Konto erstellen")))),
                React.createElement("div", { className: "relative my-5" },
                    React.createElement("div", { className: "absolute inset-0 flex items-center" },
                        React.createElement("span", { className: "w-full border-t border-slate-200" })),
                    React.createElement("div", { className: "relative flex justify-center text-xs uppercase" },
                        React.createElement("span", { className: "bg-white px-3 text-slate-400 font-semibold tracking-wider text-[10px]" }, "ODER"))),
                React.createElement("button", { type: "button", onClick: handleDemoLogin, disabled: authLoading, className: "w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold p-3 rounded-xl transition shadow-md shadow-emerald-150 flex justify-center items-center gap-2 mb-4 text-xs" },
                    React.createElement(Sparkles, { className: "w-4 h-4" }),
                    React.createElement("span", null, "Sofort mit Demo-Account einloggen")),
                React.createElement("div", { className: "text-center text-xs mt-4" },
                    React.createElement("button", { onClick: () => {
                            setAuthMode(authMode === "login" ? "register" : "login");
                            setAuthError(null);
                        }, className: "text-indigo-600 hover:underline font-bold" }, authMode === "login" ? "Noch kein Konto? Jetzt registrieren" : "Bereits registriert? Hier anmelden"))),
            React.createElement("div", { className: "text-center text-[10px] text-slate-400 mt-6 max-w-sm" },
                "\uD83D\uDCA1 ",
                React.createElement("span", { className: "font-semibold" }, "Hinweis:"),
                " BelegMagic speichert Ihre Daten sicher benutzerspezifisch auf unserem lokalen Server, so dass Sie immer nur Ihre eigenen Belege sehen.")));
    }
    return (React.createElement("div", { className: "min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800" },
        React.createElement("header", { className: "bg-white px-6 py-4 flex flex-col sm:flex-row justify-between items-center border-b border-slate-200 shadow-xs shrink-0 gap-4" },
            React.createElement("div", { className: "flex items-center gap-3" },
                React.createElement("div", { className: "w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200" },
                    React.createElement(Sparkles, { className: "w-6 h-6 text-white" })),
                React.createElement("div", null,
                    React.createElement("span", { className: "text-xl font-extrabold text-slate-900 tracking-tight block" }, "BelegMagic AI"),
                    React.createElement("span", { className: "text-xs text-slate-500 font-medium" }, "Smart Beleg-Scanner & Ausgaben-Manager"))),
            React.createElement("div", { className: "flex items-center flex-wrap gap-3" },
                React.createElement("div", { className: "flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100" },
                    React.createElement("div", { className: "w-2 h-2 bg-emerald-500 rounded-full animate-pulse" }),
                    React.createElement("span", { className: "text-xs font-bold text-indigo-700 tracking-wider" }, "Gemini 3.5 Flash")),
                currentUser && (React.createElement("div", { className: "flex items-center gap-2 bg-slate-100 px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs" },
                    React.createElement("span", { className: "font-medium text-slate-600" },
                        "Hallo, ",
                        React.createElement("span", { className: "font-extrabold text-slate-800" }, currentUser.name)),
                    React.createElement("button", { onClick: handleLogout, className: "ml-1.5 text-rose-600 hover:text-rose-700 font-extrabold hover:underline" }, "Abmelden"))))),
        React.createElement("main", { className: "flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6" },
            React.createElement("section", { className: "lg:col-span-5 flex flex-col gap-6" },
                React.createElement("div", { id: "capture-panel", className: "bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80" },
                    React.createElement("div", { className: "flex justify-between items-center mb-4" },
                        React.createElement("h2", { className: "text-lg font-bold text-slate-900 flex items-center gap-2" },
                            React.createElement(Camera, { className: "w-5 h-5 text-indigo-600" }),
                            "Beleg erfassen"),
                        capturedImage && (React.createElement("button", { onClick: () => setCapturedImage(null), className: "text-xs text-rose-500 hover:underline flex items-center gap-1" },
                            React.createElement(X, { className: "w-3 h-3" }),
                            " Verwerfen"))),
                    error && (React.createElement("div", { className: "mb-4 bg-rose-50 border-l-4 border-rose-500 p-3 rounded-r-xl flex items-start gap-2 text-rose-800 text-xs" },
                        React.createElement(AlertCircle, { className: "w-4 h-4 shrink-0 mt-0.5" }),
                        React.createElement("div", null,
                            React.createElement("p", { className: "font-bold" }, "Hinweis"),
                            React.createElement("p", null, error)))),
                    successMsg && (React.createElement("div", { className: "mb-4 bg-emerald-50 border-l-4 border-emerald-500 p-3 rounded-r-xl flex items-start gap-2 text-emerald-800 text-xs animate-fade-in" },
                        React.createElement(CheckCircle, { className: "w-4 h-4 shrink-0 mt-0.5" }),
                        React.createElement("div", null,
                            React.createElement("p", { className: "font-bold" }, "Erfolgreich!"),
                            React.createElement("p", null, successMsg)))),
                    isCameraActive ? (React.createElement("div", { className: "relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 aspect-video mb-4 flex flex-col justify-center items-center" },
                        React.createElement("video", { ref: videoRef, autoPlay: true, playsInline: true, className: "w-full h-full object-cover" }),
                        React.createElement("div", { className: "absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2" },
                            React.createElement("button", { onClick: capturePhoto, className: "bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-full text-xs shadow-md transition" }, "Foto schie\u00DFen"),
                            React.createElement("button", { onClick: stopCamera, className: "bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-full text-xs transition" }, "Abbrechen")))) : capturedImage ? (React.createElement("div", { className: "mb-4" },
                        React.createElement("div", { className: "relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 max-h-64 flex justify-center items-center" },
                            React.createElement("img", { src: capturedImage, alt: "Beleg Vorschau", className: "object-contain max-h-64 w-full" }),
                            React.createElement("div", { className: "absolute top-2 right-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm" }, "Beleg geladen")),
                        React.createElement("div", { className: "mt-4 flex flex-col gap-2" },
                            React.createElement("button", { onClick: () => processReceiptImage(capturedImage), disabled: processing, className: "w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-3 px-4 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition" }, processing ? (React.createElement(React.Fragment, null,
                                React.createElement(RefreshCw, { className: "w-4 h-4 animate-spin" }),
                                React.createElement("span", null, "Gemini liest Beleg aus..."))) : (React.createElement(React.Fragment, null,
                                React.createElement(Sparkles, { className: "w-4 h-4" }),
                                React.createElement("span", null, "Mit Gemini KI analysieren")))),
                            React.createElement("button", { onClick: () => setCapturedImage(null), disabled: processing, className: "w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-xs font-semibold transition" }, "Anderes Foto w\u00E4hlen")))) : (React.createElement("div", { className: "flex flex-col gap-3" },
                        React.createElement("button", { onClick: startCamera, className: "w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-xl shadow-indigo-100 hover:shadow-indigo-200 transition cursor-pointer group" },
                            React.createElement("div", { className: "w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-3 border border-white/30 group-hover:scale-105 transition-transform duration-300" },
                                React.createElement(Camera, { className: "w-7 h-7 text-white" })),
                            React.createElement("h3", { className: "text-lg font-extrabold text-white mb-1" }, "Beleg fotografieren"),
                            React.createElement("p", { className: "text-indigo-100 text-xs opacity-90" }, "Kamera \u00F6ffnen f\u00FCr automatische Beleg-Erkennung")),
                        React.createElement("div", { className: "grid grid-cols-2 gap-2 mt-1" },
                            React.createElement("button", { onClick: () => { var _a; return (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click(); }, className: "bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center transition" },
                                React.createElement(Plus, { className: "w-5 h-5 text-indigo-600 mb-1" }),
                                React.createElement("span", { className: "text-xs font-bold text-slate-700" }, "Foto hochladen"),
                                React.createElement("span", { className: "text-[9px] text-slate-400" }, "JPEG, PNG w\u00E4hlen")),
                            React.createElement("input", { type: "file", ref: fileInputRef, onChange: handleFileChange, accept: "image/*", className: "hidden" }),
                            React.createElement("button", { onClick: () => setShowManualForm(!showManualForm), className: `border rounded-xl p-3 flex flex-col items-center justify-center text-center transition ${showManualForm
                                    ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                                    : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"}` },
                                React.createElement(FileText, { className: "w-5 h-5 text-indigo-600 mb-1" }),
                                React.createElement("span", { className: "text-xs font-bold" }, "Manuell eintragen"),
                                React.createElement("span", { className: "text-[9px] text-slate-400" }, "Ohne Belegbild"))),
                        React.createElement("div", { className: "mt-3" },
                            React.createElement("div", { className: "text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1" },
                                React.createElement(Sparkles, { className: "w-3 h-3 text-amber-500" }),
                                "Demo-Simulation (Empfohlen f\u00FCr schnellen Test)"),
                            React.createElement("div", { className: "grid grid-cols-2 gap-2" }, MOCK_RECEIPT_OPTIONS.map((opt) => (React.createElement("button", { key: opt.key, onClick: () => handleUseMockTemplate(opt), className: "bg-indigo-50/40 hover:bg-indigo-50 border border-indigo-100/70 hover:border-indigo-200 rounded-lg p-2 text-left transition flex items-start gap-1.5" },
                                React.createElement("div", { className: "w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" }),
                                React.createElement("div", null,
                                    React.createElement("div", { className: "text-[11px] font-bold text-slate-800 line-clamp-1" }, opt.name),
                                    React.createElement("div", { className: "text-[9px] text-slate-500 font-medium" }, opt.category))))))))),
                    showManualForm && (React.createElement("form", { onSubmit: handleManualSubmit, className: "mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80 animate-fade-in text-xs flex flex-col gap-3" },
                        React.createElement("h4", { className: "font-bold text-slate-900 border-b pb-1" }, "Beleg manuell eingeben"),
                        React.createElement("div", null,
                            React.createElement("label", { className: "block font-medium text-slate-700 mb-1" }, "Gesch\u00E4ft / Name *"),
                            React.createElement("input", { type: "text", placeholder: "z.B. Aral Tankstelle", value: manualForm.geschaeft, onChange: e => setManualForm(Object.assign(Object.assign({}, manualForm), { geschaeft: e.target.value })), className: "w-full bg-white border border-slate-300 rounded-md p-1.5 text-slate-800 focus:outline-none focus:border-indigo-500 text-xs", required: true })),
                        React.createElement("div", { className: "grid grid-cols-2 gap-2" },
                            React.createElement("div", null,
                                React.createElement("label", { className: "block font-medium text-slate-700 mb-1" }, "Datum (TT.MM.JJJJ) *"),
                                React.createElement("input", { type: "text", placeholder: "z.B. 30.06.2026", value: manualForm.datum, onChange: e => setManualForm(Object.assign(Object.assign({}, manualForm), { datum: e.target.value })), className: "w-full bg-white border border-slate-300 rounded-md p-1.5 text-slate-800 focus:outline-none focus:border-indigo-500 text-xs", required: true })),
                            React.createElement("div", null,
                                React.createElement("label", { className: "block font-medium text-slate-700 mb-1" }, "Betrag in \u20AC *"),
                                React.createElement("input", { type: "text", placeholder: "z.B. 45.00", value: manualForm.gesamtbetrag, onChange: e => setManualForm(Object.assign(Object.assign({}, manualForm), { gesamtbetrag: e.target.value })), className: "w-full bg-white border border-slate-300 rounded-md p-1.5 text-slate-800 focus:outline-none focus:border-indigo-500 text-xs", required: true }))),
                        React.createElement("div", { className: "grid grid-cols-2 gap-2" },
                            React.createElement("div", null,
                                React.createElement("label", { className: "block font-medium text-slate-700 mb-1" }, "Kategorie *"),
                                React.createElement("select", { value: manualForm.kategorie, onChange: e => setManualForm(Object.assign(Object.assign({}, manualForm), { kategorie: e.target.value })), className: "w-full bg-white border border-slate-300 rounded-md p-1.5 text-slate-800 focus:outline-none focus:border-indigo-500 text-xs" },
                                    React.createElement("option", { value: "Fahrtkosten" }, "Fahrtkosten (Tanken)"),
                                    React.createElement("option", { value: "B\u00FCro" }, "B\u00FCro (B\u00FCromaterial)"),
                                    React.createElement("option", { value: "Essen" }, "Essen (Bewirtung)"),
                                    React.createElement("option", { value: "Sonstiges" }, "Sonstiges"))),
                            React.createElement("div", null,
                                React.createElement("label", { className: "block font-medium text-slate-700 mb-1" }, "Konto *"),
                                React.createElement("select", { value: manualForm.kontoId, onChange: e => setManualForm(Object.assign(Object.assign({}, manualForm), { kontoId: e.target.value })), className: "w-full bg-white border border-slate-300 rounded-md p-1.5 text-slate-800 focus:outline-none focus:border-indigo-500 text-xs" }, accounts.map(acc => (React.createElement("option", { key: acc.id, value: acc.id }, acc.name)))))),
                        React.createElement("div", null,
                            React.createElement("label", { className: "block font-medium text-slate-700 mb-1" }, "Bemerkung (optional)"),
                            React.createElement("input", { type: "text", placeholder: "z.B. Super getankt", value: manualForm.bemerkung, onChange: e => setManualForm(Object.assign(Object.assign({}, manualForm), { bemerkung: e.target.value })), className: "w-full bg-white border border-slate-300 rounded-md p-1.5 text-slate-800 focus:outline-none focus:border-indigo-500 text-xs" })),
                        React.createElement("div", { className: "flex justify-end gap-2 mt-2" },
                            React.createElement("button", { type: "button", onClick: () => setShowManualForm(false), className: "bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-3 py-1.5 rounded text-xs" }, "Abbrechen"),
                            React.createElement("button", { type: "submit", className: "bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded text-xs" }, "Speichern"))))),
                React.createElement("div", { className: "bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80" },
                    React.createElement("div", { className: "flex justify-between items-center mb-4" },
                        React.createElement("div", null,
                            React.createElement("h3", { className: "font-bold text-slate-900 text-base" }, "Meine Ordner"),
                            React.createElement("p", { className: "text-xs text-slate-400" }, "Automatische Sortierung durch Gemini")),
                        activeCategoryFilter && (React.createElement("button", { onClick: () => setActiveCategoryFilter(null), className: "text-indigo-600 text-xs font-bold hover:underline" }, "Filter aufheben"))),
                    React.createElement("div", { className: "grid grid-cols-2 gap-3" },
                        React.createElement("div", { onClick: () => setActiveCategoryFilter(activeCategoryFilter === "Fahrtkosten" ? null : "Fahrtkosten"), className: `p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${activeCategoryFilter === "Fahrtkosten"
                                ? "bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-100"
                                : "bg-slate-50 hover:bg-amber-50/50 border-slate-100 text-slate-800"}` },
                            React.createElement("div", { className: `w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${activeCategoryFilter === "Fahrtkosten" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-600"}` },
                                React.createElement(Folder, { className: "w-5 h-5 fill-current" })),
                            React.createElement("div", { className: "font-extrabold text-sm" }, "Tanken"),
                            React.createElement("div", { className: `text-[10px] ${activeCategoryFilter === "Fahrtkosten" ? "text-amber-100" : "text-slate-500"}` },
                                folderStats.Fahrtkosten.count,
                                " Belege \u2022 ",
                                folderStats.Fahrtkosten.sum.toFixed(2),
                                " \u20AC")),
                        React.createElement("div", { onClick: () => setActiveCategoryFilter(activeCategoryFilter === "Büro" ? null : "Büro"), className: `p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${activeCategoryFilter === "Büro"
                                ? "bg-blue-600 text-white border-blue-700 shadow-md shadow-blue-100"
                                : "bg-slate-50 hover:bg-blue-50/50 border-slate-100 text-slate-800"}` },
                            React.createElement("div", { className: `w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${activeCategoryFilter === "Büro" ? "bg-white/20 text-white" : "bg-blue-100 text-blue-600"}` },
                                React.createElement(Folder, { className: "w-5 h-5 fill-current" })),
                            React.createElement("div", { className: "font-extrabold text-sm" }, "B\u00FCromaterial"),
                            React.createElement("div", { className: `text-[10px] ${activeCategoryFilter === "Büro" ? "text-blue-100" : "text-slate-500"}` },
                                folderStats.Büro.count,
                                " Belege \u2022 ",
                                folderStats.Büro.sum.toFixed(2),
                                " \u20AC")),
                        React.createElement("div", { onClick: () => setActiveCategoryFilter(activeCategoryFilter === "Essen" ? null : "Essen"), className: `p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${activeCategoryFilter === "Essen"
                                ? "bg-rose-600 text-white border-rose-700 shadow-md shadow-rose-100"
                                : "bg-slate-50 hover:bg-rose-50/50 border-slate-100 text-slate-800"}` },
                            React.createElement("div", { className: `w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${activeCategoryFilter === "Essen" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-600"}` },
                                React.createElement(Folder, { className: "w-5 h-5 fill-current" })),
                            React.createElement("div", { className: "font-extrabold text-sm" }, "Bewirtung"),
                            React.createElement("div", { className: `text-[10px] ${activeCategoryFilter === "Essen" ? "text-rose-100" : "text-slate-500"}` },
                                folderStats.Essen.count,
                                " Belege \u2022 ",
                                folderStats.Essen.sum.toFixed(2),
                                " \u20AC")),
                        React.createElement("div", { onClick: () => setActiveCategoryFilter(activeCategoryFilter === "Sonstiges" ? null : "Sonstiges"), className: `p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${activeCategoryFilter === "Sonstiges"
                                ? "bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-100"
                                : "bg-slate-50 hover:bg-emerald-50/50 border-slate-100 text-slate-800"}` },
                            React.createElement("div", { className: `w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${activeCategoryFilter === "Sonstiges" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-600"}` },
                                React.createElement(Folder, { className: "w-5 h-5 fill-current" })),
                            React.createElement("div", { className: "font-extrabold text-sm" }, "Sonstiges"),
                            React.createElement("div", { className: `text-[10px] ${activeCategoryFilter === "Sonstiges" ? "text-emerald-100" : "text-slate-500"}` },
                                folderStats.Sonstiges.count,
                                " Belege \u2022 ",
                                folderStats.Sonstiges.sum.toFixed(2),
                                " \u20AC"))),
                    React.createElement("div", { className: "mt-3 bg-indigo-50 rounded-xl p-3 border border-indigo-100 text-xs text-indigo-700 font-medium" },
                        "\uD83D\uDCA1 ",
                        React.createElement("span", { className: "font-bold" }, "Tipp:"),
                        " Tippen Sie auf einen Ordner, um die unten stehende Belegliste sofort nach dieser Kategorie zu filtern.")),
                React.createElement("div", { className: "bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80" },
                    React.createElement("div", { className: "flex justify-between items-center mb-4" },
                        React.createElement("div", null,
                            React.createElement("h3", { className: "font-bold text-slate-900 text-base" }, "Zahlungskonten"),
                            React.createElement("p", { className: "text-xs text-slate-400" }, "Verwalte deine Konten & Guthaben")),
                        React.createElement("div", { className: "flex gap-1.5" },
                            activeKontoFilter && (React.createElement("button", { onClick: () => setActiveKontoFilter(null), className: "text-indigo-600 text-xs font-bold hover:underline mr-2" }, "Filter aus")),
                            React.createElement("button", { onClick: () => setShowAccountForm(!showAccountForm), className: "p-1 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition", title: "Konto hinzuf\u00FCgen" },
                                React.createElement(Plus, { className: "w-4 h-4" })))),
                    showAccountForm && (React.createElement("form", { onSubmit: handleAccountSubmit, className: "mb-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex flex-col gap-3 animate-fade-in" },
                        React.createElement("h4", { className: "font-bold text-slate-900" }, "Neues Zahlungskonto anlegen"),
                        React.createElement("div", null,
                            React.createElement("label", { className: "block font-medium text-slate-700 mb-1" }, "Kontoname *"),
                            React.createElement("input", { type: "text", placeholder: "z.B. Sparkasse, N26, Amex", value: accountForm.name, onChange: e => setAccountForm(Object.assign(Object.assign({}, accountForm), { name: e.target.value })), className: "w-full bg-white border border-slate-300 rounded-md p-1.5 text-slate-800 text-xs focus:outline-none focus:border-indigo-500", required: true })),
                        React.createElement("div", { className: "grid grid-cols-2 gap-2" },
                            React.createElement("div", null,
                                React.createElement("label", { className: "block font-medium text-slate-700 mb-1" }, "Kontotyp *"),
                                React.createElement("select", { value: accountForm.kontotyp, onChange: e => setAccountForm(Object.assign(Object.assign({}, accountForm), { kontotyp: e.target.value })), className: "w-full bg-white border border-slate-300 rounded-md p-1.5 text-slate-800 text-xs focus:outline-none focus:border-indigo-500" },
                                    React.createElement("option", { value: "Bankkonto" }, "Bankkonto"),
                                    React.createElement("option", { value: "Kreditkarte" }, "Kreditkarte"),
                                    React.createElement("option", { value: "Bargeld" }, "Bargeld"),
                                    React.createElement("option", { value: "Online-Konto" }, "Online-Konto"))),
                            React.createElement("div", null,
                                React.createElement("label", { className: "block font-medium text-slate-700 mb-1" }, "Startguthaben (\u20AC)"),
                                React.createElement("input", { type: "number", step: "0.01", placeholder: "z.B. 1000.00", value: accountForm.startguthaben, onChange: e => setAccountForm(Object.assign(Object.assign({}, accountForm), { startguthaben: e.target.value })), className: "w-full bg-white border border-slate-300 rounded-md p-1.5 text-slate-800 text-xs focus:outline-none focus:border-indigo-500" }))),
                        React.createElement("div", null,
                            React.createElement("label", { className: "block font-medium text-slate-700 mb-1" }, "Farbe *"),
                            React.createElement("div", { className: "flex gap-2.5 mt-1" }, ["indigo", "amber", "emerald", "blue", "rose", "purple"].map((col) => {
                                let bgClass = "bg-indigo-500";
                                if (col === "amber")
                                    bgClass = "bg-amber-500";
                                else if (col === "emerald")
                                    bgClass = "bg-emerald-500";
                                else if (col === "blue")
                                    bgClass = "bg-blue-500";
                                else if (col === "rose")
                                    bgClass = "bg-rose-500";
                                else if (col === "purple")
                                    bgClass = "bg-purple-500";
                                return (React.createElement("button", { key: col, type: "button", onClick: () => setAccountForm(Object.assign(Object.assign({}, accountForm), { farbe: col })), className: `w-6 h-6 rounded-full border-2 transition ${bgClass} ${accountForm.farbe === col ? "border-slate-800 scale-110" : "border-transparent"}` }));
                            }))),
                        React.createElement("div", { className: "flex justify-end gap-2 pt-1.5 border-t" },
                            React.createElement("button", { type: "button", onClick: () => setShowAccountForm(false), className: "bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-3 py-1.5 rounded text-[11px]" }, "Abbrechen"),
                            React.createElement("button", { type: "submit", className: "bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded text-[11px]" }, "Konto erstellen")))),
                    React.createElement("div", { className: "flex flex-col gap-2.5" }, accountsWithBalances.map((acc) => {
                        const isActive = activeKontoFilter === acc.id;
                        // Color mapping
                        let colorClass = "border-l-indigo-500 text-indigo-700 bg-indigo-50/20";
                        let dotColor = "bg-indigo-500";
                        if (acc.farbe === "amber") {
                            colorClass = "border-l-amber-500 text-amber-700 bg-amber-50/20";
                            dotColor = "bg-amber-500";
                        }
                        else if (acc.farbe === "emerald") {
                            colorClass = "border-l-emerald-500 text-emerald-700 bg-emerald-50/20";
                            dotColor = "bg-emerald-500";
                        }
                        else if (acc.farbe === "blue") {
                            colorClass = "border-l-blue-500 text-blue-700 bg-blue-50/20";
                            dotColor = "bg-blue-500";
                        }
                        else if (acc.farbe === "rose") {
                            colorClass = "border-l-rose-500 text-rose-700 bg-rose-50/20";
                            dotColor = "bg-rose-500";
                        }
                        else if (acc.farbe === "purple") {
                            colorClass = "border-l-purple-500 text-purple-700 bg-purple-50/20";
                            dotColor = "bg-purple-500";
                        }
                        return (React.createElement("div", { key: acc.id, onClick: () => setActiveKontoFilter(isActive ? null : acc.id), className: `p-3.5 rounded-2xl border border-slate-150 border-l-4 cursor-pointer transition-all flex justify-between items-center ${colorClass} ${isActive ? "ring-2 ring-indigo-500/30 scale-[1.01] shadow-xs" : "hover:bg-slate-50/50"}` },
                            React.createElement("div", { className: "flex items-center gap-2.5" },
                                React.createElement("div", { className: `w-2.5 h-2.5 rounded-full ${dotColor}` }),
                                React.createElement("div", null,
                                    React.createElement("div", { className: "font-extrabold text-xs text-slate-900" }, acc.name),
                                    React.createElement("div", { className: "text-[9px] text-slate-400 font-medium" }, acc.kontotyp))),
                            React.createElement("div", { className: "flex items-center gap-2.5 text-right", onClick: (e) => e.stopPropagation() },
                                React.createElement("div", null,
                                    React.createElement("div", { className: `text-xs font-black ${acc.balance < 0 ? "text-rose-600" : "text-slate-950"}` }, acc.balance.toLocaleString("de-DE", { style: "currency", currency: "EUR" })),
                                    React.createElement("div", { className: "text-[9px] text-slate-400" },
                                        "Soll: ",
                                        acc.startguthaben.toLocaleString("de-DE", { style: "currency", currency: "EUR" }))),
                                acc.id !== "acc_1" && (React.createElement("button", { onClick: (e) => handleDeleteAccount(acc.id, e), title: "Konto l\u00F6schen", className: "p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition" },
                                    React.createElement(Trash2, { className: "w-3.5 h-3.5" }))))));
                    })),
                    React.createElement("div", { className: "mt-3 text-[10px] text-slate-400 text-center italic" }, "* Guthaben berechnet sich aus dem Startguthaben abz\u00FCglich Belege."))),
            React.createElement("section", { className: "lg:col-span-7 flex flex-col gap-6" },
                React.createElement("div", { className: "bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" },
                    React.createElement("div", { className: "flex gap-6 flex-wrap" },
                        React.createElement("div", null,
                            React.createElement("div", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1" }, "Gesamtausgaben"),
                            React.createElement("div", { className: "text-2xl font-black text-slate-950" }, totalExpenses.toLocaleString("de-DE", { style: "currency", currency: "EUR" }))),
                        React.createElement("div", { className: "border-l border-slate-200 pl-6" },
                            React.createElement("div", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1" }, "Belege Gesamt"),
                            React.createElement("div", { className: "text-2xl font-black text-indigo-600" }, receipts.length)),
                        React.createElement("div", { className: "border-l border-slate-200 pl-6" },
                            React.createElement("div", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1" }, "Ausgaben im Filter"),
                            React.createElement("div", { className: "text-2xl font-black text-emerald-600" }, filteredReceipts.reduce((s, r) => s + r.gesamtbetrag, 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" })))),
                    React.createElement("button", { onClick: handleExportCSV, className: "w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-100 shrink-0" },
                        React.createElement(Download, { className: "w-4 h-4" }),
                        "Excel Export")),
                React.createElement("div", { className: "bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80" },
                    React.createElement("div", { className: "flex justify-between items-center mb-3" },
                        React.createElement("h3", { className: "font-bold text-slate-900 text-sm flex items-center gap-1.5" },
                            React.createElement(TrendingUp, { className: "w-4 h-4 text-amber-500" }),
                            "Erkennung wiederkehrender Ausgaben"),
                        React.createElement("span", { className: "bg-amber-100 text-amber-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider" }, "KI Analyse")),
                    recurringList.length === 0 ? (React.createElement("p", { className: "text-xs text-slate-500 italic bg-slate-50 rounded-xl p-3 border border-slate-100" }, "Noch nicht gen\u00FCgend Belege hochgeladen, um automatische Wiederholungszyklen zuverl\u00E4ssig vorherzusagen. (Mindestens 2 gleiche Ausgabequellen erforderlich).")) : (React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2.5" }, recurringList.map((rec, idx) => (React.createElement("div", { key: idx, className: "bg-amber-50/50 border border-amber-200/60 rounded-xl p-3 flex items-start gap-2.5" },
                        React.createElement("div", { className: "w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center text-amber-700 text-xs font-bold shrink-0" }, "\u21BB"),
                        React.createElement("div", null,
                            React.createElement("div", { className: "text-xs font-bold text-slate-950 line-clamp-1" }, rec.name),
                            React.createElement("div", { className: "text-[10px] text-slate-500" },
                                "Kategorie: ",
                                React.createElement("span", { className: "font-semibold" }, rec.category)),
                            React.createElement("div", { className: "text-[10px] text-slate-600 mt-1" },
                                "Durchschnitt: ",
                                React.createElement("span", { className: "font-bold text-amber-700" },
                                    rec.totalAverage.toFixed(2),
                                    " \u20AC"))),
                        React.createElement("span", { className: "ml-auto bg-amber-100/80 text-amber-800 text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase" }, "Abo/Zyklisch"))))))),
                React.createElement("div", { className: "bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden flex-1 flex flex-col" },
                    React.createElement("div", { className: "px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50" },
                        React.createElement("div", null,
                            React.createElement("h3", { className: "font-extrabold text-slate-900 text-base" },
                                "Letzte Scans",
                                activeCategoryFilter ? (React.createElement("span", { className: "text-indigo-600 ml-2 text-xs font-medium" },
                                    "(Gefiltert nach: ",
                                    activeCategoryFilter,
                                    ")")) : (React.createElement("span", { className: "text-slate-400 ml-2 text-xs font-normal" }, "(Alle Ordner)")))),
                        React.createElement("div", { className: "text-xs text-slate-400 font-medium" },
                            "Zeige ",
                            filteredReceipts.length,
                            " von ",
                            receipts.length,
                            " Eintr\u00E4gen")),
                    loading ? (React.createElement("div", { className: "p-12 text-center flex flex-col items-center justify-center" },
                        React.createElement(RefreshCw, { className: "w-8 h-8 text-indigo-600 animate-spin mb-2" }),
                        React.createElement("p", { className: "text-sm text-slate-500 font-medium" }, "Lade Belege aus der Server-Datenbank..."))) : filteredReceipts.length === 0 ? (React.createElement("div", { className: "p-12 text-center flex flex-col items-center justify-center" },
                        React.createElement(FileText, { className: "w-12 h-12 text-slate-300 mb-2" }),
                        React.createElement("p", { className: "text-sm font-bold text-slate-800" }, "Keine Belege gefunden"),
                        React.createElement("p", { className: "text-xs text-slate-500 mt-1 max-w-xs" }, activeCategoryFilter
                            ? `Es sind noch keine Belege im Ordner "${activeCategoryFilter}" vorhanden.`
                            : "Fotografieren Sie Ihren ersten Beleg, um die automatische Erfassung zu starten."))) : (React.createElement("div", { className: "overflow-x-auto" },
                        React.createElement("table", { className: "w-full text-left text-xs" },
                            React.createElement("thead", { className: "bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100" },
                                React.createElement("tr", null,
                                    React.createElement("th", { className: "px-5 py-3" }, "Datum"),
                                    React.createElement("th", { className: "px-5 py-3" }, "Gesch\u00E4ft / Bemerkung"),
                                    React.createElement("th", { className: "px-5 py-3" }, "Kategorie"),
                                    React.createElement("th", { className: "px-5 py-3" }, "Konto"),
                                    React.createElement("th", { className: "px-5 py-3 text-right" }, "Betrag"),
                                    React.createElement("th", { className: "px-5 py-3 text-center" }, "Aktionen"))),
                            React.createElement("tbody", { className: "divide-y divide-slate-100" }, filteredReceipts.map((r) => {
                                const isRecurring = receipts.filter(other => other.geschaeft.trim().toLowerCase() === r.geschaeft.trim().toLowerCase()).length >= 2;
                                // Assign color tags to folders
                                let badgeStyle = "bg-slate-100 text-slate-700";
                                if (r.kategorie === "Fahrtkosten")
                                    badgeStyle = "bg-amber-100 text-amber-700 border border-amber-200/50";
                                else if (r.kategorie === "Büro")
                                    badgeStyle = "bg-blue-100 text-blue-700 border border-blue-200/50";
                                else if (r.kategorie === "Essen")
                                    badgeStyle = "bg-rose-100 text-rose-700 border border-rose-200/50";
                                else if (r.kategorie === "Sonstiges")
                                    badgeStyle = "bg-emerald-100 text-emerald-700 border border-emerald-200/50";
                                // Find associated account
                                const account = accounts.find(a => a.id === r.kontoId) || { name: "Hauptkonto (Spk)", farbe: "indigo" };
                                let accountColor = "bg-indigo-100 text-indigo-700 border border-indigo-200/50";
                                if (account.farbe === "amber")
                                    accountColor = "bg-amber-100 text-amber-700 border border-amber-200/50";
                                else if (account.farbe === "emerald")
                                    accountColor = "bg-emerald-100 text-emerald-700 border border-emerald-200/50";
                                else if (account.farbe === "blue")
                                    accountColor = "bg-blue-100 text-blue-700 border border-blue-200/50";
                                else if (account.farbe === "rose")
                                    accountColor = "bg-rose-100 text-rose-700 border border-rose-200/50";
                                else if (account.farbe === "purple")
                                    accountColor = "bg-purple-100 text-purple-700 border border-purple-200/50";
                                return (React.createElement("tr", { key: r.id, onClick: () => setSelectedReceipt(r), className: `hover:bg-indigo-50/20 transition-colors cursor-pointer group ${isRecurring ? "border-l-4 border-amber-400 bg-amber-50/10" : ""}` },
                                    React.createElement("td", { className: "px-5 py-4 whitespace-nowrap text-slate-600 font-medium" },
                                        React.createElement("span", { className: "flex items-center gap-1.5" },
                                            React.createElement(Calendar, { className: "w-3.5 h-3.5 text-slate-400" }),
                                            r.datum)),
                                    React.createElement("td", { className: "px-5 py-4" },
                                        React.createElement("div", { className: "font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors" }, r.geschaeft),
                                        r.bemerkung && (React.createElement("div", { className: "text-[10px] text-slate-500 font-normal line-clamp-1" }, r.bemerkung)),
                                        isRecurring && (React.createElement("span", { className: "inline-flex items-center gap-1 mt-1 bg-amber-100 text-amber-800 text-[8px] font-bold px-1.5 py-0.5 rounded" }, "Wiederkehrend"))),
                                    React.createElement("td", { className: "px-5 py-4 whitespace-nowrap" },
                                        React.createElement("span", { className: `px-2.5 py-1 rounded-full text-[10px] font-bold ${badgeStyle}` }, r.kategorie)),
                                    React.createElement("td", { className: "px-5 py-4 whitespace-nowrap" },
                                        React.createElement("span", { className: `px-2.5 py-1 rounded-full text-[10px] font-bold ${accountColor}` }, account.name)),
                                    React.createElement("td", { className: "px-5 py-4 text-right font-black text-slate-950 text-sm whitespace-nowrap" }, r.gesamtbetrag.toLocaleString("de-DE", { style: "currency", currency: "EUR" })),
                                    React.createElement("td", { className: "px-5 py-4 text-center whitespace-nowrap", onClick: e => e.stopPropagation() },
                                        React.createElement("div", { className: "flex justify-center gap-1.5" },
                                            React.createElement("button", { onClick: () => setSelectedReceipt(r), title: "Beleg ansehen", className: "p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" },
                                                React.createElement(Eye, { className: "w-3.5 h-3.5" })),
                                            React.createElement("button", { onClick: (e) => handleDeleteReceipt(r.id, e), title: "Beleg l\u00F6schen", className: "p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition" },
                                                React.createElement(Trash2, { className: "w-3.5 h-3.5" }))))));
                            })))))))),
        selectedReceipt && (React.createElement("div", { className: "fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" },
            React.createElement("div", { className: "bg-white rounded-3xl shadow-xl max-w-md w-full overflow-hidden flex flex-col border border-slate-200" },
                React.createElement("div", { className: "px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center" },
                    React.createElement("div", null,
                        React.createElement("h3", { className: "font-extrabold text-slate-950 text-base" }, "Beleg-Details"),
                        React.createElement("p", { className: "text-[10px] text-slate-400" },
                            "Erfasst am ",
                            new Date(selectedReceipt.erstelltAm).toLocaleDateString("de-DE"),
                            " um ",
                            new Date(selectedReceipt.erstelltAm).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }))),
                    React.createElement("button", { onClick: () => setSelectedReceipt(null), className: "p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100" },
                        React.createElement(X, { className: "w-5 h-5" }))),
                React.createElement("div", { className: "p-6 flex-1 overflow-y-auto max-h-[70vh] flex flex-col gap-4" },
                    selectedReceipt.image ? (React.createElement("div", { className: "border border-slate-200 rounded-2xl overflow-hidden bg-slate-100 p-2 flex justify-center" },
                        React.createElement("img", { src: selectedReceipt.image, alt: "Belegoriginal", className: "max-h-72 object-contain rounded-xl" }))) : (React.createElement("div", { className: "border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 flex flex-col items-center justify-center" },
                        React.createElement(FileText, { className: "w-10 h-10 mb-1 text-slate-300" }),
                        React.createElement("span", { className: "text-xs font-medium" }, "Keine Belegkopie hinterlegt"),
                        React.createElement("span", { className: "text-[10px] text-slate-400" }, "Manuelle Eingabe"))),
                    React.createElement("div", { className: "bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-2.5 text-xs" },
                        React.createElement("div", { className: "flex justify-between py-1 border-b border-slate-200/50" },
                            React.createElement("span", { className: "text-slate-400 font-medium" }, "Gesch\u00E4ft:"),
                            React.createElement("span", { className: "font-extrabold text-slate-900" }, selectedReceipt.geschaeft)),
                        React.createElement("div", { className: "flex justify-between py-1 border-b border-slate-200/50" },
                            React.createElement("span", { className: "text-slate-400 font-medium" }, "Datum auf Beleg:"),
                            React.createElement("span", { className: "font-bold text-slate-900" }, selectedReceipt.datum)),
                        React.createElement("div", { className: "flex justify-between py-1 border-b border-slate-200/50" },
                            React.createElement("span", { className: "text-slate-400 font-medium" }, "Kategorie:"),
                            React.createElement("span", { className: "font-bold text-indigo-700" }, selectedReceipt.kategorie)),
                        React.createElement("div", { className: "flex justify-between py-1 border-b border-slate-200/50" },
                            React.createElement("span", { className: "text-slate-400 font-medium" }, "Zahlungskonto:"),
                            React.createElement("span", { className: "font-bold text-slate-900" }, ((_a = accounts.find(a => a.id === selectedReceipt.kontoId)) === null || _a === void 0 ? void 0 : _a.name) || "Hauptkonto (Spk)")),
                        selectedReceipt.bemerkung && (React.createElement("div", { className: "py-1 border-b border-slate-200/50" },
                            React.createElement("span", { className: "text-slate-400 font-medium block mb-0.5" }, "Bemerkung/Beschreibung:"),
                            React.createElement("span", { className: "font-medium text-slate-700 italic" }, selectedReceipt.bemerkung))),
                        React.createElement("div", { className: "flex justify-between items-center pt-2" },
                            React.createElement("span", { className: "text-slate-400 font-bold text-sm" }, "Gesamtsumme:"),
                            React.createElement("span", { className: "text-lg font-black text-slate-950" }, selectedReceipt.gesamtbetrag.toLocaleString("de-DE", { style: "currency", currency: "EUR" }))))),
                React.createElement("div", { className: "px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2" },
                    React.createElement("button", { onClick: () => setSelectedReceipt(null), className: "bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition" }, "Schlie\u00DFen"))))),
        React.createElement("footer", { className: "bg-indigo-900 text-white p-4 flex flex-col sm:flex-row justify-between items-center px-6 sm:px-10 gap-3 shrink-0 mt-auto" },
            React.createElement("div", { className: "flex items-center gap-3" },
                React.createElement("div", { className: "w-6 h-6 bg-amber-400 rounded-full border border-indigo-950 flex items-center justify-center text-[10px] text-indigo-950 font-extrabold shadow-xs" }, "AI"),
                React.createElement("span", { className: "text-xs font-medium text-indigo-200 text-center sm:text-left" }, recurringList.length > 0 ? (React.createElement(React.Fragment, null,
                    "Intelligente Vorhersage: ",
                    React.createElement("span", { className: "font-bold text-amber-300" },
                        recurringList.length,
                        " wiederkehrende Ausgabequellen"),
                    " aktiv analysiert.")) : (React.createElement(React.Fragment, null, "Intelligente Vorhersage: Laden Sie Belege hoch, um zyklische Vertr\u00E4ge & Abonnements automatisch vorherzusagen.")))),
            React.createElement("div", { className: "text-[10px] text-indigo-300 font-medium italic" }, "Bilder verarbeitet \u00FCber die Google Gemini 3.5 Flash Multimodal API"))));
}
