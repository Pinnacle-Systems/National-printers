// ─────────────────────────────────────────────────────────────────────────────
//  PDFPreviewModal.jsx — full-screen preview modal using @react-pdf/renderer
// ─────────────────────────────────────────────────────────────────────────────
import React, { Suspense, useCallback } from "react";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import { PurchaseReportPDF } from "./PurchaseReportPDF";

/**
 * Props:
 *  open       — boolean
 *  onClose    — () => void
 *  tree       — the grouped/flat tree array (same as used in the table)
 *  colOrder   — array of column keys in current display order
 */
export default function PDFPreviewModal({ open, onClose, tree, colOrder }) {
  const today = new Date()
    .toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
    .replace(/\//g, "-");

  const fileName = `Purchase_Report_${today}.pdf`;

  // close on backdrop click
  const handleBackdrop = useCallback(
    (e) => { if (e.target === e.currentTarget) onClose(); },
    [onClose],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: "rgba(0,0,0,0.72)" }}
      onClick={handleBackdrop}
    >
      {/* ── top bar ── */}
      <div
        className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ backgroundColor: "#1E3A5F" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          {/* PDF icon */}
          <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
            <path d="M14 2v6h6" fill="none" stroke="#fff" strokeWidth="1.5"/>
            <text x="6" y="18" fontSize="6" fill="#fff" fontFamily="Helvetica-Bold">PDF</text>
          </svg>
          <span className="text-white font-semibold text-sm tracking-wide">
            Purchase Report — PDF Preview
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Download button */}
          <Suspense fallback={
            <button className="h-8 px-4 text-xs bg-green-500 text-white rounded-lg opacity-60 cursor-not-allowed">
              Preparing…
            </button>
          }>
            <PDFDownloadLink
              document={<PurchaseReportPDF tree={tree} columns={colOrder} />}
              fileName={fileName}
            >
              {({ loading }) =>
                loading ? (
                  <button className="h-8 px-4 text-xs bg-green-500 text-white rounded-lg opacity-60 cursor-not-allowed flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                      <path d="M12 2a10 10 0 0110 10" strokeLinecap="round"/>
                    </svg>
                    Preparing…
                  </button>
                ) : (
                  <button className="h-8 px-4 text-xs bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-1.5 transition-colors">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download PDF
                  </button>
                )
              }
            </PDFDownloadLink>
          </Suspense>

          {/* Close button */}
          <button
            onClick={onClose}
            className="h-8 px-3 text-xs border border-white/30 rounded-lg text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            Close
          </button>
        </div>
      </div>

      {/* ── viewer area ── */}
      <div
        className="flex-1 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Suspense fallback={
          <div className="flex items-center justify-center h-full text-white/60 text-sm gap-3">
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
              <path d="M12 2a10 10 0 0110 10" strokeLinecap="round"/>
            </svg>
            Rendering PDF…
          </div>
        }>
          <PDFViewer
            width="100%"
            height="100%"
            style={{ border: "none", display: "block" }}
            showToolbar={false}   // hide browser's default toolbar — we have our own
          >
            <PurchaseReportPDF tree={tree} columns={colOrder} />
          </PDFViewer>
        </Suspense>
      </div>
    </div>
  );
}
