"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxMms30w6xARNCid9_bjkcokytWwxhzX3wamSRhfZEtxIzAn5gfoIqYQE4uo9b_qfjktQ/exec";

const VAT_RATE = 0.19;

const supplier = {
  name: "Adrián Zachar - Tropic",
  address1: "Budatínska 3230/16A",
  address2: "851 06 Bratislava - mestská časť Petržalka",
  country: "Slovensko",
  ico: "55723748",
  icdph: "SK1129257998",
  dic: "1129257998",
  email: "zachar.ado@gmail.com",
  phone: "0951407519",
};

const defaultCompanies = [
  {
    id: "1",
    name: "EDOKIN Cubicon",
    email: "zachar@edo-kin.sk",
    priceWithVat: 1.85,
    ico: "46988882",
    icdph: "SK2023704199",
    dic: "2023704199",
    address: "Stare Grunty 24, Bratislava",
  },
  {
    id: "2",
    name: "EDOKIN Blumental",
    email: "chmelar@edo-kin.sk",
    priceWithVat: 1.85,
    ico: "46988882",
    icdph: "SK2023704199",
    dic: "2023704199",
    address: "Namestie Mateja Korvina 1, Bratislava",
  },
  {
    id: "3",
    name: "EDOKIN Central",
    email: "babos@edo-kin.sk",
    priceWithVat: 1.85,
    ico: "46988882",
    icdph: "SK2023704199",
    dic: "2023704199",
    address: "OC Central Metodova 6, Bratislava",
  },
  {
    id: "4",
    name: "EDOKIN BoryMall",
    email: "balog@edo-kin.sk",
    priceWithVat: 1.85,
    ico: "46988882",
    icdph: "SK2023704199",
    dic: "2023704199",
    address: "BoryMall Bratislava",
  },
];

function formatEUR(value: number) {
  return new Intl.NumberFormat("sk-SK", {
    style: "currency",
    currency: "EUR",
  }).format(value || 0);
}

function formatNum(value: number) {
  return new Intl.NumberFormat("sk-SK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateSK(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat("sk-SK").format(d);
}

function nextDeliveryNumber() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const dateKey = `${y}${m}${d}`;

  const lastDate = localStorage.getItem("dodaci-system-last-date");
  const lastCount = Number(localStorage.getItem("dodaci-system-last-count") || "0");

  const nextCount = lastDate === dateKey ? lastCount + 1 : 1;
  localStorage.setItem("dodaci-system-last-date", dateKey);
  localStorage.setItem("dodaci-system-last-count", String(nextCount));

  return `DL-${dateKey}-${String(nextCount).padStart(3, "0")}`;
}

function drawBarcodeBars(
  doc: any,
  x: number,
  y: number,
  width: number,
  height: number,
  text: string
) {
  const digits = String(text).replace(/\D/g, "") || "20260415";
  const bars = digits.repeat(4).slice(0, 48);
  const barWidth = width / bars.length;

  for (let i = 0; i < bars.length; i++) {
    const num = Number(bars[i]);
    if (num % 2 === 0) {
      doc.setFillColor(0, 0, 0);
      doc.rect(x + i * barWidth, y, Math.max(1, barWidth * 0.7), height, "F");
    }
  }
}

export default function Page() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);

  const [companies, setCompanies] = useState(defaultCompanies);
  const [selectedCompanyId, setSelectedCompanyId] = useState("1");
  const [deliveryNumber, setDeliveryNumber] = useState("");
  const [date, setDate] = useState(todayISO());
  const [customerName, setCustomerName] = useState(defaultCompanies[0].name);
  const [customerEmail, setCustomerEmail] = useState(defaultCompanies[0].email);
  const [quantity, setQuantity] = useState(0);
  const [freeQuantity, setFreeQuantity] = useState(0);
  const [note, setNote] = useState("Tovar prevzatý bez zjavných poškodení.");
  const [signatureData, setSignatureData] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [sheetSaved, setSheetSaved] = useState(false);

  const selectedCompany = useMemo(() => {
    return companies.find((c) => c.id === selectedCompanyId) || companies[0];
  }, [companies, selectedCompanyId]);

  const priceWithVat = selectedCompany?.priceWithVat || 0;
  const priceWithoutVat = priceWithVat / (1 + VAT_RATE);
  const vatPerPiece = priceWithVat - priceWithoutVat;

  const totalWithVat = quantity * priceWithVat;
  const totalWithoutVat = quantity * priceWithoutVat;
  const vatAmount = totalWithVat - totalWithoutVat;

  useEffect(() => {
    setDeliveryNumber(nextDeliveryNumber());
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("dodaci-system-avokado");
    if (!raw) return;

    try {
      const data = JSON.parse(raw);
      if (data.companies) setCompanies(data.companies);
      if (data.selectedCompanyId) setSelectedCompanyId(data.selectedCompanyId);
      if (data.deliveryNumber) setDeliveryNumber(data.deliveryNumber);
      if (data.date) setDate(data.date);
      if (data.customerName) setCustomerName(data.customerName);
      if (data.customerEmail) setCustomerEmail(data.customerEmail);
      if (typeof data.quantity === "number") setQuantity(data.quantity);
      if (typeof data.freeQuantity === "number") setFreeQuantity(data.freeQuantity);
      if (data.note) setNote(data.note);
      if (data.signatureData) setSignatureData(data.signatureData);
    } catch {}
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      setCustomerName(selectedCompany.name);
      setCustomerEmail(selectedCompany.email);
    }
  }, [selectedCompany, selectedCompanyId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111111";

    if (signatureData) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      img.src = signatureData;
    }
  }, [signatureData]);

  function saveToLocalStorage() {
    localStorage.setItem(
      "dodaci-system-avokado",
      JSON.stringify({
        companies,
        selectedCompanyId,
        deliveryNumber,
        date,
        customerName,
        customerEmail,
        quantity,
        freeQuantity,
        note,
        signatureData,
      })
    );
    setSavedMessage("Uložené");
    setTimeout(() => setSavedMessage(""), 1800);
  }

  function updateSelectedCompany(field: string, value: string | number) {
    setCompanies((prev) =>
      prev.map((company) =>
        company.id === selectedCompanyId ? { ...company, [field]: value } : company
      )
    );
  }

  function addCompany() {
    const newCompany = {
      id: Date.now().toString(),
      name: "Nová firma",
      email: "firma@email.sk",
      priceWithVat: 1.85,
      ico: "",
      icdph: "",
      dic: "",
      address: "",
    };
    setCompanies((prev) => [...prev, newCompany]);
    setSelectedCompanyId(newCompany.id);
  }

  function getCanvasPos(
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function startDrawing(
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    isDrawing.current = true;
    const pos = getCanvasPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!isDrawing.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getCanvasPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setSignatureData(canvas.toDataURL("image/png"));
  }

  function stopDrawing() {
    isDrawing.current = false;
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setSignatureData("");
  }

  async function saveDeliveryToGoogleSheet() {
    if (sheetSaved) return true;

    const payload = {
      datum: date,
      firma: customerName,
      pocetKs: quantity,
      cenaZaKsSDPH: priceWithVat,
      cisloDodaciehoListu: deliveryNumber,
      emailFirmy: customerEmail,
      podpisane: !!signatureData,
    };

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      console.log("Google Sheets response:", text);
      setSheetSaved(true);
      return true;
    } catch (error) {
      console.error("Chyba pri zápise do Google Sheetu:", error);
      return false;
    }
  }

  async function generatePDF() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    const leftX = 24;
    const rightX = 415;
    const midX = 396;
    const pageWidth = 595;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Dodávateľ", leftX, 30);
    doc.setFontSize(15);
    doc.text(supplier.name, leftX, 54);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(supplier.address1, leftX, 74);
    doc.text(supplier.address2, leftX, 92);
    doc.text(supplier.country, leftX, 110);
    doc.text(`IČO: ${supplier.ico}`, leftX, 150);
    doc.text(`IČ DPH: ${supplier.icdph}`, leftX + 110, 150);
    doc.text(`DIČ: ${supplier.dic}`, leftX + 280, 150);

    doc.setFont("helvetica", "bold");
    doc.text("Kontaktné údaje", leftX, 190);
    doc.setFont("helvetica", "normal");
    doc.text("E-mail:", leftX, 214);
    doc.text(supplier.email, leftX + 80, 214);
    doc.text("Telefón:", leftX, 236);
    doc.text(supplier.phone, leftX + 80, 236);

    doc.setLineWidth(1);
    doc.setDrawColor(205, 205, 205);
    doc.line(midX, 10, midX, 445);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Dodací list", 490, 30, { align: "center" });

    doc.rect(rightX, 14, 140, 38);
    doc.setFontSize(11);
    doc.text(`k faktúre č. ${deliveryNumber}`, rightX + 70, 38, { align: "center" });
    drawBarcodeBars(doc, rightX + 68, 58, 70, 16, deliveryNumber);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Odberateľ", 430, 240);
    doc.setFontSize(15);
    doc.text(customerName, 430, 262);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const addressLines = doc.splitTextToSize(selectedCompany?.address || "", 150);
    doc.text(addressLines, 430, 280);
    const addressEndY = 280 + addressLines.length * 16;
    doc.text("Slovensko", 430, addressEndY + 10);
    doc.text(`IČO: ${selectedCompany?.ico || ""}`, 430, addressEndY + 34);
    doc.text(`IČ DPH: ${selectedCompany?.icdph || ""}`, 505, addressEndY + 34);
    doc.text(`DIČ: ${selectedCompany?.dic || ""}`, 430, addressEndY + 54);

    doc.setFont("helvetica", "normal");
    doc.text("Spôsob úhrady:", leftX, 412);
    doc.setFont("helvetica", "bold");
    doc.text("Prevodom", leftX + 100, 412);
    doc.setFont("helvetica", "normal");
    doc.text("Mena:", leftX, 436);
    doc.setFont("helvetica", "bold");
    doc.text("EUR", leftX + 65, 436);

    doc.rect(0, 460, pageWidth, 82);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Dátum", leftX, 486);
    doc.setFont("helvetica", "normal");
    doc.text("vystavenia:", leftX, 516);
    doc.setFont("helvetica", "bold");
    doc.text(formatDateSK(date), leftX + 85, 516);
    doc.setFont("helvetica", "normal");
    doc.text("dodania:", leftX + 190, 516);
    doc.setFont("helvetica", "bold");
    doc.text(formatDateSK(date), leftX + 260, 516);

    const tableY = 575;
    const cols = [leftX, 230, 295, 365, 405, 468, 535];
    doc.setFillColor(225, 225, 225);
    doc.rect(leftX - 2, tableY, 545, 26, "F");
    doc.setFont("helvetica", "bold");
    doc.text("Označenie dodávky", leftX + 4, tableY + 17);
    doc.text("Počet", cols[1], tableY + 17);
    doc.text("m. j.", cols[2], tableY + 17);
    doc.text("Cena za m.j.", cols[3], tableY + 17);
    doc.text("DPH %", cols[4], tableY + 17);
    doc.text("Bez DPH", cols[5], tableY + 17);
    doc.text("DPH", cols[6], tableY + 17);
    doc.text("Spolu", 570, tableY + 17, { align: "right" });

    const row1Y = tableY + 38;
    doc.setFont("helvetica", "normal");
    doc.text("Avokado hass", leftX + 4, row1Y);
    doc.text(formatNum(quantity), cols[1], row1Y);
    doc.text("ks", cols[2], row1Y);
    doc.text(formatNum(priceWithVat), cols[3], row1Y);
    doc.text("19", cols[4], row1Y);
    doc.text(formatNum(totalWithoutVat), cols[5], row1Y);
    doc.text(formatNum(vatAmount), cols[6], row1Y);
    doc.setFont("helvetica", "bold");
    doc.text(formatNum(totalWithVat), 570, row1Y, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.line(leftX, row1Y + 8, 570, row1Y + 8);

    const row2Y = row1Y + 22;
    doc.text("Avokado hass", leftX + 4, row2Y);
    doc.text(formatNum(freeQuantity), cols[1], row2Y);
    doc.text("ks", cols[2], row2Y);
    doc.text(formatNum(0), cols[3], row2Y);
    doc.text("19", cols[4], row2Y);
    doc.text(formatNum(0), cols[5], row2Y);
    doc.text(formatNum(0), cols[6], row2Y);
    doc.setFont("helvetica", "bold");
    doc.text(formatNum(0), 570, row2Y, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.line(leftX, row2Y + 8, 570, row2Y + 8);

    const signY = 735;
    doc.setFont("helvetica", "bold");
    doc.text("Prevzal", leftX, signY);
    doc.setLineDashPattern([1, 2], 0);
    doc.line(leftX, signY + 18, 190, signY + 18);
    doc.text("Dňa", leftX, signY + 48);
    doc.line(leftX, signY + 66, 190, signY + 66);
    doc.setLineDashPattern([], 0);

    if (signatureData) {
      doc.addImage(signatureData, "PNG", 220, 715, 150, 55);
    }

    doc.save(`dodaci-list-${deliveryNumber}.pdf`);
  }

 async function sendByEmail() {
  await saveDeliveryToGoogleSheet();

  const subject = encodeURIComponent(`Dodací list ${deliveryNumber}`);
  const body = encodeURIComponent(
    [
      "Dobrý deň,",
      "",
      `posielame dodací list k faktúre č. ${deliveryNumber}.`,
      `Odberateľ: ${customerName}`,
      `Počet kusov: ${quantity}`,
      `Cena za kus s DPH: ${formatEUR(priceWithVat)}`,
      `Suma bez DPH: ${formatEUR(totalWithoutVat)}`,
      `DPH 19 %: ${formatEUR(vatAmount)}`,
      `Suma spolu: ${formatEUR(totalWithVat)}`,
      "",
      "PDF si prosím priložte zo stiahnutého súboru.",
    ].join("\n")
  );

  const gmailUrl =
    `https://mail.google.com/mail/?view=cm&fs=1` +
    `&to=${encodeURIComponent(customerEmail)}` +
    `&su=${subject}` +
    `&body=${body}`;

  window.open(gmailUrl, "_blank");
}

  function resetForm() {
    setDeliveryNumber(nextDeliveryNumber());
    setDate(todayISO());
    setCustomerName(selectedCompany?.name || "");
    setCustomerEmail(selectedCompany?.email || "");
    setQuantity(0);
    setFreeQuantity(0);
    setNote("Tovar prevzatý bez zjavných poškodení.");
    setSignatureData("");
    setSheetSaved(false);
  }

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div>
          <h1 style={styles.title}>Dodací list - finálna verzia</h1>
          <p style={styles.subtitle}>
            Dátum a číslo listu sa nastavujú automaticky. Po podpise sa dá uložiť do Google
            Sheetu a otvoriť email klientovi.
          </p>
        </div>

        <div style={styles.actions}>
          <button
            style={styles.actionButton}
            onClick={() => {
              saveToLocalStorage();
            }}
          >
            Uložiť
          </button>

          <button style={styles.actionButton} onClick={generatePDF}>
            Stiahnuť PDF
          </button>

          <button
            style={styles.actionButton}
            onClick={sendByEmail}
            disabled={!signatureData || !customerEmail}
          >
            Otvoriť email
          </button>
        </div>
      </div>

      {savedMessage ? <div style={styles.saved}>{savedMessage}</div> : null}

      <div style={styles.mainGrid}>
        <div style={styles.previewCard}>
          <div style={styles.docPreview}>
            <div style={styles.previewTop}>
              <div style={styles.previewSupplier}>
                <div style={styles.bold}>Dodávateľ</div>
                <div style={styles.bigBold}>{supplier.name}</div>
                <div>{supplier.address1}</div>
                <div>{supplier.address2}</div>
                <div>{supplier.country}</div>
                <div style={{ marginTop: 18 }}>
                  IČO: {supplier.ico} &nbsp;&nbsp;&nbsp; IČ DPH: {supplier.icdph}
                  &nbsp;&nbsp;&nbsp; DIČ: {supplier.dic}
                </div>

                <div style={{ marginTop: 28 }}>
                  <span style={styles.bold}>Kontaktné údaje</span>
                </div>
                <div style={{ marginTop: 8 }}>E-mail: {supplier.email}</div>
                <div>Telefón: {supplier.phone}</div>
              </div>

              <div style={styles.previewDivider} />

              <div style={styles.previewRight}>
                <div style={styles.docLabel}>Dodací list</div>
                <div style={styles.invoiceBox}>k faktúre č. {deliveryNumber}</div>
                <div style={styles.barcodeBox} />

                <div style={{ marginTop: 150 }}>
                  <div style={styles.bold}>Odberateľ</div>
                  <div style={styles.bigBold}>{customerName}</div>
                  <div>{selectedCompany?.address}</div>
                  <div>Slovensko</div>
                  <div style={{ marginTop: 10 }}>
                    IČO: {selectedCompany?.ico} &nbsp;&nbsp;&nbsp; IČ DPH:{" "}
                    {selectedCompany?.icdph}
                  </div>
                  <div>DIČ: {selectedCompany?.dic}</div>
                </div>
              </div>
            </div>

            <div style={styles.paymentRow}>
              <div>
                <span>Spôsob úhrady:</span> <strong>Prevodom</strong>
              </div>
              <div>
                <span>Mena:</span> <strong>EUR</strong>
              </div>
            </div>

            <div style={styles.dateBox}>
              <div style={styles.bold}>Dátum</div>
              <div style={styles.dateRow}>
                <span>vystavenia:</span>
                <strong>{formatDateSK(date)}</strong>
                <span style={{ marginLeft: 50 }}>dodania:</span>
                <strong>{formatDateSK(date)}</strong>
              </div>
            </div>

            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.thLeft}>Označenie dodávky</th>
                  <th style={styles.th}>Počet</th>
                  <th style={styles.th}>m. j.</th>
                  <th style={styles.th}>Cena za m.j.</th>
                  <th style={styles.th}>DPH %</th>
                  <th style={styles.th}>Bez DPH</th>
                  <th style={styles.th}>DPH</th>
                  <th style={styles.th}>Spolu</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={styles.tdLeft}>Avokado hass</td>
                  <td style={styles.td}>{formatNum(quantity)}</td>
                  <td style={styles.td}>ks</td>
                  <td style={styles.td}>{formatNum(priceWithVat)}</td>
                  <td style={styles.td}>19</td>
                  <td style={styles.td}>{formatNum(totalWithoutVat)}</td>
                  <td style={styles.td}>{formatNum(vatAmount)}</td>
                  <td style={{ ...styles.td, fontWeight: 700 }}>{formatNum(totalWithVat)}</td>
                </tr>
                <tr>
                  <td style={styles.tdLeft}>Avokado hass</td>
                  <td style={styles.td}>{formatNum(freeQuantity)}</td>
                  <td style={styles.td}>ks</td>
                  <td style={styles.td}>{formatNum(0)}</td>
                  <td style={styles.td}>19</td>
                  <td style={styles.td}>{formatNum(0)}</td>
                  <td style={styles.td}>{formatNum(0)}</td>
                  <td style={{ ...styles.td, fontWeight: 700 }}>{formatNum(0)}</td>
                </tr>
              </tbody>
            </table>

            <div style={styles.signatureArea}>
              <div>
                <div style={styles.bold}>Prevzal</div>
                <div style={styles.dottedLine} />
                <div style={{ marginTop: 18, ...styles.bold }}>Dňa</div>
                <div style={styles.dottedLine} />
              </div>
              {signatureData ? (
                <img src={signatureData} alt="Podpis" style={styles.signatureImage} />
              ) : null}
            </div>
          </div>
        </div>

        <div style={styles.controlsColumn}>
          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>Firma</h2>

            <label style={styles.label}>Odberateľ</label>
            <select
              style={styles.input}
              value={selectedCompanyId}
              onChange={(e) => {
                setSelectedCompanyId(e.target.value);
                setSheetSaved(false);
              }}
            >
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>

            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              value={customerEmail}
              onChange={(e) => {
                setCustomerEmail(e.target.value);
                setSheetSaved(false);
              }}
            />

            <label style={styles.label}>Adresa</label>
            <input
              style={styles.input}
              value={selectedCompany?.address || ""}
              onChange={(e) => updateSelectedCompany("address", e.target.value)}
            />

            <label style={styles.label}>IČO</label>
            <input
              style={styles.input}
              value={selectedCompany?.ico || ""}
              onChange={(e) => updateSelectedCompany("ico", e.target.value)}
            />

            <label style={styles.label}>IČ DPH</label>
            <input
              style={styles.input}
              value={selectedCompany?.icdph || ""}
              onChange={(e) => updateSelectedCompany("icdph", e.target.value)}
            />

            <button style={styles.smallButton} onClick={addCompany}>
              Pridať firmu
            </button>
          </div>

          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>Položky</h2>

            <label style={styles.label}>Číslo faktúry / dodacieho listu</label>
            <input
              style={styles.input}
              value={deliveryNumber}
              onChange={(e) => {
                setDeliveryNumber(e.target.value);
                setSheetSaved(false);
              }}
            />

            <label style={styles.label}>Dátum</label>
            <input
              style={styles.input}
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setSheetSaved(false);
              }}
            />

            <label style={styles.label}>Počet kusov platených</label>
            <input
              style={styles.input}
              type="number"
              value={quantity}
              onChange={(e) => {
                setQuantity(Number(e.target.value));
                setSheetSaved(false);
              }}
            />

            <label style={styles.label}>Počet kusov grátis</label>
            <input
              style={styles.input}
              type="number"
              value={freeQuantity}
              onChange={(e) => setFreeQuantity(Number(e.target.value))}
            />

            <label style={styles.label}>Cena za kus s DPH</label>
            <input
              style={styles.input}
              type="number"
              step="0.01"
              value={selectedCompany?.priceWithVat || 0}
              onChange={(e) => {
                updateSelectedCompany("priceWithVat", Number(e.target.value));
                setSheetSaved(false);
              }}
            />

            <label style={styles.label}>Poznámka</label>
            <input
              style={styles.input}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>Podpis zákazníka</h2>

            <canvas
              ref={canvasRef}
              width={560}
              height={180}
              style={styles.canvas}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />

            <button style={styles.smallButton} onClick={clearSignature}>
              Vymazať podpis
            </button>

            <p style={styles.infoText}>
              Dátum sa nastaví automaticky na dnešný deň, číslo dodacieho listu sa zvyšuje
              automaticky a pri odoslaní emailu sa dodávka zapíše aj do Google Sheetu.
            </p>
          </div>

          <div style={styles.panel}>
            <h2 style={styles.panelTitle}>Rýchle akcie</h2>

            <button style={styles.smallButton} onClick={resetForm}>
              Nový dodací list dnes
            </button>

            <button style={styles.smallButton} onClick={generatePDF}>
              Export PDF s podpisom
            </button>

            <button
              style={styles.smallButton}
              onClick={sendByEmail}
              disabled={!signatureData || !customerEmail}
            >
              Otvoriť email klientovi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background: "#efefef",
    padding: 24,
    fontFamily: "Arial, Helvetica, sans-serif",
    color: "#111",
  },
  topBar: {
    maxWidth: 1500,
    margin: "0 auto 18px auto",
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  title: { margin: 0, fontSize: 28, fontWeight: 700 },
  subtitle: { marginTop: 6, color: "#555", fontSize: 14 },
  actions: { display: "flex", gap: 10, flexWrap: "wrap" },
  actionButton: {
    padding: "12px 16px",
    border: "1px solid #bbb",
    borderRadius: 8,
    background: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  saved: {
    maxWidth: 1500,
    margin: "0 auto 12px auto",
    display: "inline-block",
    background: "#dff3df",
    padding: "6px 10px",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 700,
  },
  mainGrid: {
    maxWidth: 1500,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1.55fr 0.75fr",
    gap: 18,
    alignItems: "start",
  },
  previewCard: {
    background: "#dcdcdc",
    padding: 18,
    borderRadius: 10,
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  },
  docPreview: {
    background: "#fff",
    minHeight: 980,
    padding: 26,
    boxSizing: "border-box",
  },
  previewTop: {
    display: "grid",
    gridTemplateColumns: "1fr 1px 0.9fr",
    gap: 26,
    minHeight: 370,
  },
  previewSupplier: { fontSize: 16, lineHeight: 1.45 },
  previewDivider: { background: "#c9c9c9", width: 1 },
  previewRight: { fontSize: 16, lineHeight: 1.45, position: "relative" },
  docLabel: { fontWeight: 700, fontSize: 24, textAlign: "center", marginBottom: 10 },
  invoiceBox: {
    border: "2px solid #d2d2d2",
    fontWeight: 700,
    fontSize: 18,
    textAlign: "center",
    padding: "12px 10px",
    marginLeft: 90,
    width: 260,
  },
  barcodeBox: {
    width: 160,
    height: 18,
    marginLeft: 190,
    marginTop: 8,
    background: "repeating-linear-gradient(90deg,#000 0 3px,#fff 3px 5px)",
  },
  paymentRow: {
    display: "flex",
    gap: 40,
    marginTop: 18,
    fontSize: 18,
  },
  dateBox: {
    border: "2px solid #d2d2d2",
    marginTop: 18,
    padding: 14,
    minHeight: 86,
    fontSize: 18,
  },
  dateRow: {
    marginTop: 18,
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: 42,
    fontSize: 15,
  },
  thLeft: {
    background: "#d9d9d9",
    textAlign: "left",
    padding: "10px 12px",
    borderBottom: "1px solid #d0d0d0",
  },
  th: {
    background: "#d9d9d9",
    textAlign: "right",
    padding: "10px 12px",
    borderBottom: "1px solid #d0d0d0",
  },
  tdLeft: {
    textAlign: "left",
    padding: "9px 12px",
    borderBottom: "1px solid #d9d9d9",
  },
  td: {
    textAlign: "right",
    padding: "9px 12px",
    borderBottom: "1px solid #d9d9d9",
  },
  signatureArea: {
    marginTop: 70,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 24,
  },
  dottedLine: {
    width: 360,
    borderBottom: "3px dotted #111",
    marginTop: 8,
  },
  signatureImage: {
    width: 180,
    height: 70,
    objectFit: "contain",
    border: "1px solid #ddd",
  },
  controlsColumn: {
    display: "grid",
    gap: 16,
  },
  panel: {
    background: "#fff",
    borderRadius: 10,
    padding: 18,
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  },
  panelTitle: { margin: "0 0 14px 0", fontSize: 20 },
  label: {
    display: "block",
    marginBottom: 6,
    marginTop: 10,
    fontWeight: 700,
    fontSize: 14,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #cfcfcf",
    borderRadius: 8,
    padding: "11px 12px",
    fontSize: 15,
    background: "#fff",
  },
  smallButton: {
    marginTop: 14,
    padding: "10px 14px",
    border: "1px solid #bbb",
    borderRadius: 8,
    background: "#f9f9f9",
    cursor: "pointer",
    fontWeight: 700,
    width: "100%",
  },
  canvas: {
    width: "100%",
    border: "1px solid #ccc",
    borderRadius: 8,
    background: "#fff",
    touchAction: "none",
    marginBottom: 10,
  },
  bold: { fontWeight: 700 },
  bigBold: { fontWeight: 700, fontSize: 18 },
  infoText: {
    marginTop: 10,
    fontSize: 13,
    color: "#555",
    lineHeight: 1.5,
  },
};