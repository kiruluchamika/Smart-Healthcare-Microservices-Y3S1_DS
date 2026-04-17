import React, { useEffect, useState } from 'react';
import { getPrescription } from '../../services/prescriptionApi';
import { Download, X, Stethoscope, BadgeCheck, UserRound, FileBadge2, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';
import { getDoctorById } from '../../services/doctor/doctorApi';

const PDF_PAGE_WIDTH = 595.28;
const PDF_PAGE_HEIGHT = 841.89;
const PDF_MARGIN = 42;

function escapePdfText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function wrapText(value: string, maxChars: number) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (!words.length) {
    return [''];
  }

  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length > maxChars && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = nextLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function buildPrescriptionPdfDocument(rx: any, doctorName: string) {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [0];
  let currentOffset = 0;

  const appendText = (text: string) => {
    const bytes = encoder.encode(text);
    chunks.push(bytes);
    currentOffset += bytes.length;
  };

  const beginObject = (id: number) => {
    offsets[id] = currentOffset;
    appendText(`${id} 0 obj\n`);
  };

  const endObject = () => {
    appendText(`endobj\n`);
  };

  appendText(`%PDF-1.4\n%\u00E2\u00E3\u00CF\u00D3\n`);

  type PageState = { lines: string[]; y: number };
  const pages: PageState[] = [{ lines: [], y: PDF_PAGE_HEIGHT - PDF_MARGIN }];
  const currentPage = () => pages[pages.length - 1];
  const ensureSpace = (height: number) => {
    if (currentPage().y - height < PDF_MARGIN) {
      pages.push({ lines: [], y: PDF_PAGE_HEIGHT - PDF_MARGIN });
    }
  };
  const pushLine = (line: string) => {
    currentPage().lines.push(line);
  };
  const setFillColor = (r: number, g: number, b: number) => {
    pushLine(`${r} ${g} ${b} rg`);
  };
  const setStrokeColor = (r: number, g: number, b: number) => {
    pushLine(`${r} ${g} ${b} RG`);
  };
  const drawRect = (x: number, y: number, width: number, height: number, fill = true) => {
    pushLine(`${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re ${fill ? 'f' : 'S'}`);
  };
  const addText = (text: string, x: number, y: number, size: number, font = 'F1') => {
    pushLine(`BT /${font} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${escapePdfText(text)}) Tj ET`);
  };
  const addWrappedText = (text: string, x: number, maxChars: number, size: number, leading: number, font = 'F1') => {
    wrapText(text, maxChars).forEach((line) => {
      ensureSpace(leading);
      addText(line, x, currentPage().y, size, font);
      currentPage().y -= leading;
    });
  };
  const addSectionGap = (gap: number) => {
    ensureSpace(gap);
    currentPage().y -= gap;
  };

  setFillColor(0.05, 0.09, 0.17);
  drawRect(0, PDF_PAGE_HEIGHT - 120, PDF_PAGE_WIDTH, 120, true);
  setFillColor(1, 1, 1);
  addText('Clinexa Digital Prescription', PDF_MARGIN, PDF_PAGE_HEIGHT - 56, 22, 'F2');
  addText('Official Clinical Order', PDF_MARGIN, PDF_PAGE_HEIGHT - 78, 11, 'F2');
  addText(`Rx Number: ${rx.rxNumber || '-'}`, PDF_PAGE_WIDTH - 200, PDF_PAGE_HEIGHT - 56, 11, 'F2');
  addText(rx.status === 'SIGNED' ? 'Digitally Signed' : 'Draft', PDF_PAGE_WIDTH - 200, PDF_PAGE_HEIGHT - 76, 10, 'F1');
  currentPage().y = PDF_PAGE_HEIGHT - 150;

  const drawInfoCard = (x: number, y: number, width: number, title: string, firstLine: string, secondLine: string) => {
    setFillColor(0.97, 0.98, 0.99);
    drawRect(x, y - 64, width, 64, true);
    setFillColor(0.35, 0.4, 0.48);
    addText(title, x + 12, y - 16, 9, 'F2');
    setFillColor(0.1, 0.15, 0.22);
    addText(firstLine, x + 12, y - 34, 11, 'F2');
    setFillColor(0.4, 0.45, 0.52);
    addText(secondLine, x + 12, y - 50, 9, 'F1');
  };

  drawInfoCard(PDF_MARGIN, currentPage().y, 160, 'PATIENT', `Patient #${rx.patientId}`, 'Registered Clinexa patient');
  drawInfoCard(218, currentPage().y, 160, 'PRESCRIBER', doctorName || `Doctor #${rx.doctorId}`, `Provider ID: #${rx.doctorId}`);
  drawInfoCard(394, currentPage().y, 160, 'ISSUANCE', rx.issuedAt ? new Date(rx.issuedAt).toLocaleString() : 'Not recorded', `Appointment #${rx.appointmentId}`);
  currentPage().y -= 96;

  setFillColor(0.1, 0.15, 0.22);
  addText('Diagnosis And Clinical Notes', PDF_MARGIN, currentPage().y, 12, 'F2');
  currentPage().y -= 24;
  addWrappedText(rx.diagnosis || '-', PDF_MARGIN, 78, 15, 20, 'F2');
  if (rx.notes) {
    addSectionGap(6);
    addWrappedText(`Notes: ${rx.notes}`, PDF_MARGIN, 92, 10, 14, 'F1');
  }

  addSectionGap(26);
  addText('Medications Prescribed', PDF_MARGIN, currentPage().y, 12, 'F2');
  currentPage().y -= 24;

  rx.items?.forEach((item: any, index: number) => {
    ensureSpace(92);
    setStrokeColor(0.88, 0.9, 0.93);
    drawRect(PDF_MARGIN, currentPage().y - 74, PDF_PAGE_WIDTH - PDF_MARGIN * 2, 74, false);
    setFillColor(0.35, 0.4, 0.48);
    addText(String(index + 1).padStart(2, '0'), PDF_MARGIN + 10, currentPage().y - 24, 10, 'F2');
    setFillColor(0.1, 0.15, 0.22);
    addText(item.medicineName || '-', PDF_MARGIN + 42, currentPage().y - 20, 12, 'F2');
    addText([item.strength, item.form].filter(Boolean).join(' / ') || 'Strength/form not specified', PDF_MARGIN + 42, currentPage().y - 38, 9, 'F1');
    addText(`Dosage: ${[item.doseAmount, item.doseUnit].filter(Boolean).join(' ') || 'As directed'}`, PDF_MARGIN + 42, currentPage().y - 54, 9, 'F1');
    addText(`Instructions: ${item.frequencyText || 'As directed'} for ${item.durationDays ? `${item.durationDays} day(s)` : 'unspecified duration'}`, PDF_MARGIN + 250, currentPage().y - 20, 9, 'F1');
    addText(`Route: ${item.route || 'Not specified'}`, PDF_MARGIN + 250, currentPage().y - 38, 9, 'F1');
    addText(`Quantity: ${item.quantity ?? '-'}`, PDF_MARGIN + 430, currentPage().y - 20, 9, 'F2');
    addText(item.substitutionAllowed ? 'Substitution allowed' : 'No substitution', PDF_MARGIN + 430, currentPage().y - 38, 9, 'F1');
    currentPage().y -= 92;
  });

  addSectionGap(12);
  addText('Prescription Guidance', PDF_MARGIN, currentPage().y, 12, 'F2');
  currentPage().y -= 22;
  addWrappedText(
    'This is a digitally generated prescription issued through the Clinexa platform. Present this document to the dispensing pharmacy. Medication substitution should follow the prescription instructions and local clinical policy.',
    PDF_MARGIN,
    96,
    10,
    14,
    'F1',
  );

  addSectionGap(28);
  ensureSpace(80);
  addText('Digital Signature', PDF_MARGIN, currentPage().y, 12, 'F2');
  currentPage().y -= 22;
  addText(doctorName || rx.signedBy || `Doctor #${rx.doctorId}`, PDF_MARGIN, currentPage().y, 16, 'F3');
  currentPage().y -= 18;
  addText(rx.status === 'SIGNED' ? 'Digitally Signed' : 'Draft / Unsigned', PDF_MARGIN, currentPage().y, 10, 'F2');
  currentPage().y -= 14;
  addText(
    rx.signedAt ? `Signed on ${new Date(rx.signedAt).toLocaleString()}` : (rx.signedBy || 'Signature pending'),
    PDF_MARGIN,
    currentPage().y,
    10,
    'F1',
  );

  const pageObjectIds: number[] = [];
  const contentObjectIds: number[] = [];
  let objectId = 1;

  pages.forEach(() => {
    pageObjectIds.push(objectId++);
    contentObjectIds.push(objectId++);
  });

  const fontRegularId = objectId++;
  const fontBoldId = objectId++;
  const fontItalicId = objectId++;
  const pagesObjectId = objectId++;
  const catalogObjectId = objectId++;

  pages.forEach((page, index) => {
    const content = `${page.lines.join('\n')}\n`;
    beginObject(contentObjectIds[index]);
    appendText(`<< /Length ${content.length} >>\nstream\n${content}endstream\n`);
    endObject();

    beginObject(pageObjectIds[index]);
    appendText(
      `<< /Type /Page /Parent ${pagesObjectId} 0 R /MediaBox [0 0 ${PDF_PAGE_WIDTH} ${PDF_PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R /F3 ${fontItalicId} 0 R >> >> /Contents ${contentObjectIds[index]} 0 R >>\n`,
    );
    endObject();
  });

  beginObject(fontRegularId);
  appendText(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\n`);
  endObject();

  beginObject(fontBoldId);
  appendText(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\n`);
  endObject();

  beginObject(fontItalicId);
  appendText(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>\n`);
  endObject();

  beginObject(pagesObjectId);
  appendText(
    `<< /Type /Pages /Count ${pageObjectIds.length} /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] >>\n`,
  );
  endObject();

  beginObject(catalogObjectId);
  appendText(`<< /Type /Catalog /Pages ${pagesObjectId} 0 R >>\n`);
  endObject();

  const xrefOffset = currentOffset;
  appendText(`xref\n0 ${catalogObjectId + 1}\n`);
  appendText(`0000000000 65535 f \n`);
  for (let id = 1; id <= catalogObjectId; id += 1) {
    appendText(`${String(offsets[id]).padStart(10, '0')} 00000 n \n`);
  }
  appendText(`trailer\n<< /Size ${catalogObjectId + 1} /Root ${catalogObjectId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return new Blob(chunks, { type: 'application/pdf' });
}

function formatDoctorName(doctor: any) {
  if (!doctor) {
    return null;
  }

  const fullName = `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim();
  return fullName ? `Dr. ${fullName}` : null;
}

export default function PrescriptionDetail({
  prescriptionId,
  onClose,
  allowPrint = true,
}: {
  prescriptionId: number,
  onClose: () => void,
  allowPrint?: boolean,
}) {
  const [rx, setRx] = useState<any>(null);
  const [doctorName, setDoctorName] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getPrescription(prescriptionId)
      .then(res => setRx(res))
      .catch(() => setError('Failed to load prescription'))
      .finally(() => setLoading(false));
  }, [prescriptionId]);

  useEffect(() => {
    if (!rx?.doctorId) {
      setDoctorName('');
      return;
    }

    let isActive = true;

    getDoctorById(rx.doctorId)
      .then((doctor) => {
        if (isActive) {
          setDoctorName(formatDoctorName(doctor) || `Doctor #${rx.doctorId}`);
        }
      })
      .catch(() => {
        if (isActive) {
          setDoctorName(`Doctor #${rx.doctorId}`);
        }
      });

    return () => {
      isActive = false;
    };
  }, [rx?.doctorId]);

  const handleDownloadPdf = async () => {
    if (downloading) {
      return;
    }

    setDownloading(true);
    setError('');

    try {
      const pdfBlob = buildPrescriptionPdfDocument(rx, doctorName);
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `prescription-${rx?.rxNumber || prescriptionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'Failed to download prescription PDF');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return (
      <div className="flex justify-center items-center py-20 bg-white min-h-[500px] rounded-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
  );
  if (error) return <div className="text-red-500 p-10 bg-white rounded-2xl">{error}</div>;
  if (!rx) return <div className="p-10 bg-white rounded-2xl">Prescription not found.</div>;

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-prescription, #printable-prescription * {
            visibility: visible;
          }
          #printable-prescription {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
            border: none;
            box-shadow: none;
            background: white;
          }
          .no-print { display: none !important; }
          @page {
            size: A4;
            margin: 12mm;
          }
        }
      `}</style>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-4xl border border-slate-200 relative"
      >
          {/* Controls - These hide during print */}
          <div className="bg-slate-100 p-4 flex justify-between items-center border-b border-slate-200 no-print">
              <h3 className="font-bold text-slate-700">Digital Prescription Viewer</h3>
              <div className="flex gap-3">
                  {allowPrint && (
                    <button
                      onClick={() => void handleDownloadPdf()}
                      disabled={downloading}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Download className="w-4 h-4" /> {downloading ? 'Preparing PDF...' : 'Save as PDF'}
                    </button>
                  )}
                  <button onClick={onClose} className="bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 p-2 rounded-lg transition-colors">
                      <X className="w-5 h-5" />
                  </button>
              </div>
          </div>

          <div id="printable-prescription" className="mx-auto min-h-[1122px] w-full max-w-[794px] bg-white p-8 sm:p-10">
              <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_60px_rgba(15,23,42,0.08)] print:shadow-none">
              {/* Rx Header */}
              <div className="flex justify-between items-start rounded-t-[28px] border-b border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-8 py-7 text-white">
                  <div className="flex items-center gap-4">
                      <div className="rounded-2xl bg-white/10 p-3">
                        <Stethoscope className="w-10 h-10 text-blue-100" />
                      </div>
                      <div>
                          <h1 className="text-3xl font-extrabold tracking-tight">Clinexa Digital Prescription</h1>
                          <p className="mt-1 text-sm font-semibold tracking-[0.24em] text-blue-100 uppercase">Official Clinical Order</p>
                      </div>
                  </div>
                  <div className="text-right">
                      <div className="text-xs font-bold uppercase tracking-[0.22em] text-blue-100">Rx Number</div>
                      <div className="mt-1 font-mono text-lg font-bold">{rx.rxNumber}</div>
                      <div className="mt-3 inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-50">
                        {rx.status === 'SIGNED' ? 'Digitally Signed' : 'Draft'}
                      </div>
                  </div>
              </div>

              <div className="p-8">
              <div className="grid gap-4 md:grid-cols-3 mb-8 text-sm">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                        <UserRound className="h-4 w-4" /> Patient
                      </div>
                      <p className="font-semibold text-slate-900 text-base">Patient #{rx.patientId}</p>
                      <p className="mt-2 text-slate-600">Prescription prepared for registered Clinexa patient record.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                        <Stethoscope className="h-4 w-4" /> Prescriber
                      </div>
                      <p className="font-semibold text-slate-900 text-base">{doctorName || `Doctor #${rx.doctorId}`}</p>
                      <p className="mt-2 text-slate-600">Provider ID: #{rx.doctorId}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                        <CalendarDays className="h-4 w-4" /> Issuance
                      </div>
                      <p className="font-semibold text-slate-900 text-base">
                        {rx.issuedAt ? new Date(rx.issuedAt).toLocaleString() : 'Not recorded'}
                      </p>
                      <p className="mt-2 text-slate-600">Appointment #{rx.appointmentId}</p>
                  </div>
              </div>

              <div className="mb-8 rounded-3xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-200 px-6 py-4">
                    <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Diagnosis And Clinical Notes</h4>
                  </div>
                  <div className="px-6 py-5">
                  <p className="text-xl font-bold text-slate-900">{rx.diagnosis}</p>
                  {rx.notes && (
                      <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-slate-700">
                          <strong className="text-slate-900">Notes:</strong> {rx.notes}
                      </p>
                  )}
                  </div>
              </div>

              <div className="mb-10">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Medications Prescribed</h4>
                    <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      <FileBadge2 className="h-4 w-4" /> {rx.items?.length || 0} item(s)
                    </div>
                  </div>
                  
                  <div className="overflow-hidden rounded-3xl border border-slate-200">
                      <div className="grid grid-cols-[64px_1.7fr_1.2fr_1.2fr_1fr] bg-slate-100 px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                        <div>No.</div>
                        <div>Medicine</div>
                        <div>Dosage</div>
                        <div>Instructions</div>
                        <div>Quantity</div>
                      </div>
                      <div className="divide-y divide-slate-200">
                      {rx.items?.map((item: any, idx: number) => (
                          <div key={idx} className="grid grid-cols-[64px_1.7fr_1.2fr_1.2fr_1fr] gap-4 px-6 py-5 text-sm text-slate-700">
                              <div className="font-mono font-bold text-slate-400">{(idx + 1).toString().padStart(2, '0')}</div>
                              <div>
                                <p className="text-base font-bold text-slate-900">{item.medicineName}</p>
                                <p className="mt-1 text-slate-500">{[item.strength, item.form].filter(Boolean).join(' / ') || 'Strength/form not specified'}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {[item.doseAmount, item.doseUnit].filter(Boolean).join(' ') || 'As directed'}
                                </p>
                                <p className="mt-1 text-slate-500">{item.route || 'Route not specified'}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{item.frequencyText || 'As directed'}</p>
                                <p className="mt-1 text-slate-500">{item.durationDays ? `${item.durationDays} day(s)` : 'Duration not specified'}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{item.quantity ?? '-'}</p>
                                <p className="mt-1 text-slate-500">{item.substitutionAllowed ? 'Substitution allowed' : 'No substitution'}</p>
                              </div>
                          </div>
                      ))}
                      </div>
                  </div>
              </div>

              <div className="grid gap-6 md:grid-cols-[1.3fr_0.9fr] border-t border-slate-200 pt-8">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Prescription Guidance</h4>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      This is a digitally generated prescription issued through the Clinexa platform. Present this
                      document to the dispensing pharmacy. Medication substitution should follow the instructions
                      indicated for each item and local clinical policy.
                    </p>
                  </div>
                  
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-5 text-center">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Digital Signature</p>
                      {rx.status === 'SIGNED' ? (
                          <div className="mt-4">
                              <div className="text-blue-700 font-serif italic text-2xl mb-2">
                                {doctorName || rx.signedBy}
                              </div>
                              <div className="mx-auto mb-3 h-px w-40 bg-slate-400" />
                              <div className="flex justify-center items-center gap-1 text-xs font-bold text-emerald-600">
                                  <BadgeCheck className="w-4 h-4" /> Digitally Signed
                              </div>
                              <p className="mt-2 text-xs text-slate-500">
                                {rx.signedAt ? `Signed on ${new Date(rx.signedAt).toLocaleString()}` : rx.signedBy}
                              </p>
                          </div>
                      ) : (
                          <div className="mt-4 inline-block border-b-2 border-slate-300 pb-2 mb-2 px-10 text-slate-400 italic">
                             Draft / Unsigned
                          </div>
                      )}
                  </div>
              </div>
              </div>
              </div>
          </div>
      </motion.div>
    </>
  );
}
