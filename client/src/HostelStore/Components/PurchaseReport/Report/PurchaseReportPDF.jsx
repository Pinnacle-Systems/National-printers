// ─────────────────────────────────────────────────────────────────────────────
//  PurchaseReportPDF.jsx — @react-pdf/renderer document
//  Used by PurchaseReport.jsx for PDF preview + download
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import mpLogo from "../../../../assets/NationalPrintLogo.jpeg";

// ── short codes ───────────────────────────────────────────────────────────────
const INWARD_SHORT = {
  "Order Purchase Inward": "OPI",
  "General Purchase Inward": "GPI",
  "Direct Inward": "DI",
};

// ── helpers ───────────────────────────────────────────────────────────────────
function fmt3(val) {
  const n = typeof val === "number" ? val : parseFloat(val) || 0;
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt)) return String(d);
  return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
}

// ── columns config for PDF (key, label, width, align) ─────────────────────────
const PDF_COLS = [
  { key: "sno",          label: "S.No",      w: 28,  align: "center" },
  { key: "docId",        label: "PO No.",     w: 70,  align: "left"   },
  { key: "docDate",      label: "PO Date",    w: 52,  align: "center" },
  { key: "dueDate",      label: "Due Date",   w: 52,  align: "center" },
  { key: "supplier",     label: "Supplier",   w: 110, align: "left"   },
  { key: "poType",       label: "Type",       w: 38,  align: "center" },
  { key: "inwardType",   label: "Inw.Type",   w: 38,  align: "center" },
  { key: "branch",       label: "Branch",     w: 52,  align: "left"   },
  { key: "poQty",        label: "PO Qty",     w: 46,  align: "right"  },
  { key: "inwardQty",    label: "Inw Qty",    w: 46,  align: "right"  },
  { key: "cancelQty",    label: "Cncl Qty",   w: 46,  align: "right"  },
  { key: "returnQty",    label: "Ret Qty",    w: 46,  align: "right"  },
  { key: "billedQty",    label: "Billed",     w: 46,  align: "right"  },
  { key: "balanceQty",   label: "Balance",    w: 46,  align: "right"  },
  { key: "dueStatus",    label: "Due Status", w: 62,  align: "center" },
  { key: "status",       label: "Status",     w: 80,  align: "left"   },
];

// ── StyleSheet ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 7,
    paddingTop: 14,
    paddingBottom: 18,
    paddingHorizontal: 14,
    backgroundColor: "#ffffff",
  },

  // header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: "#1E3A5F",
    paddingBottom: 5,
    marginBottom: 5,
  },
  logo: { width: 52, height: 24, objectFit: "contain" },
  headerTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    color: "#1E3A5F",
    flex: 1,
    textAlign: "center",
  },
  headerDate: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    textAlign: "right",
    minWidth: 70,
  },

  // legend
  legendBox: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    padding: "4 6",
    marginBottom: 5,
    backgroundColor: "#F9FAFB",
  },
  legendLabel: { fontFamily: "Helvetica-Bold", color: "#1E3A5F", fontSize: 7 },
  legendItem: { fontSize: 7, color: "#374151", marginRight: 10 },
  legendBold: { fontFamily: "Helvetica-Bold" },

  // table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderTopWidth: 1,
    borderTopColor: "#374151",
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  th: {
    fontFamily: "Helvetica-Bold",
    fontSize: 6.5,
    color: "#111827",
    paddingVertical: 3,
    paddingHorizontal: 3,
    borderRightWidth: 0.5,
    borderRightColor: "#9CA3AF",
  },
  thLast: { borderRightWidth: 0 },

  // rows
  rowEven: { flexDirection: "row", backgroundColor: "#FFFFFF" },
  rowOdd:  { flexDirection: "row", backgroundColor: "#F9FAFB" },
  rowOverdue: { flexDirection: "row", backgroundColor: "#FEF2F2" },

  // group row
  groupRow: {
    flexDirection: "row",
    backgroundColor: "#EEF2FF",
    borderTopWidth: 0.5,
    borderTopColor: "#C7D2FE",
    borderBottomWidth: 0.5,
    borderBottomColor: "#C7D2FE",
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  groupText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 6.5,
    color: "#3730A3",
    flex: 1,
  },

  // cell
  td: {
    fontSize: 7,
    color: "#374151",
    paddingVertical: 2.5,
    paddingHorizontal: 3,
    borderRightWidth: 0.5,
    borderRightColor: "#E5E7EB",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  tdLast: { borderRightWidth: 0 },

  // footer
  footer: {
    position: "absolute",
    bottom: 10,
    left: 14,
    right: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: "#D1D5DB",
    paddingTop: 3,
  },
  footerText: { fontSize: 6, color: "#9CA3AF" },
});

// ── cell value resolver ───────────────────────────────────────────────────────
function getCellText(key, row, sno) {
  switch (key) {
    case "sno":         return String(sno);
    case "docDate":
    case "dueDate":     return fmtDate(row[key]);
    case "dueStatus":   return row.dueStatus ?? "—";
    case "inwardType":  return INWARD_SHORT[row.inwardType] ?? row.inwardType ?? "—";
    case "poQty":
    case "inwardQty":
    case "cancelQty":
    case "returnQty":
    case "billedQty":
    case "balanceQty":  return fmt3(row[key]);
    default:            return String(row[key] ?? "—");
  }
}

// ── cell text color ────────────────────────────────────────────────────────────
function getCellColor(key, row) {
  switch (key) {
    case "dueStatus":
      return row.dueAlert === "overdue" ? "#DC2626"
           : row.dueAlert === "soon"    ? "#D97706"
           : row.dueAlert === "done"    ? "#6B7280"
           : "#16A34A";
    case "poType":
      return row.poType === "ORDER" ? "#1D4ED8" : "#374151";
    case "inwardType": {
      const map = {
        "Order Purchase Inward": "#3730A3",
        "General Purchase Inward": "#0D7377",
        "Direct Inward": "#9A3412",
      };
      return map[row.inwardType] || "#374151";
    }
    case "status": {
      const map = {
        "Fully Received": "#15803D",
        "Partially Received": "#1D4ED8",
        "Partially Received & Cancelled": "#DC2626",
        "Closed (Inward + Cancelled)": "#DC2626",
        Cancelled: "#DC2626",
        "Partially Cancelled": "#DC2626",
        Pending: "#D97706",
      };
      return map[row.status] || "#374151";
    }
    case "cancelQty": return (parseFloat(row.cancelQty) || 0) > 0 ? "#DC2626" : "#374151";
    case "returnQty":  return (parseFloat(row.returnQty)  || 0) > 0 ? "#92400E" : "#374151";
    case "billedQty": {
      const bq = parseFloat(row.billedQty) || 0;
      const iq = parseFloat(row.inwardQty) || 0;
      return bq >= iq && iq > 0 ? "#15803D" : bq > 0 ? "#D97706" : "#9CA3AF";
    }
    case "balanceQty":
      return (parseFloat(row.balanceQty) || 0) > 0 ? "#D97706" : "#374151";
    default: return "#374151";
  }
}

// ── QTY_KEYS for group totals ─────────────────────────────────────────────────
const QTY_KEYS = ["poQty","inwardQty","cancelQty","returnQty","billedQty","balanceQty"];

// ── flatten tree → flat rows with type ───────────────────────────────────────
function flattenTree(nodes, depth = 0) {
  const result = [];
  nodes.forEach((node) => {
    if (node._group) {
      function collectRows(n) {
        return n._group ? n._children.flatMap(collectRows) : [n];
      }
      const gRows = collectRows(node);
      const totals = {};
      QTY_KEYS.forEach((k) => {
        totals[k] = gRows.reduce((s, r) => s + (parseFloat(r[k]) || 0), 0);
      });
      const qtyStr = QTY_KEYS.filter((k) => totals[k] > 0)
        .map((k) => `${k.replace("Qty","")}: ${fmt3(totals[k])}`).join("  |  ");

      result.push({ _type: "group", depth, node, totals, qtyStr });
      result.push(...flattenTree(node._children, depth + 1));
    } else {
      result.push({ _type: "data", row: node });
    }
  });
  return result;
}

// ── PDF Document ──────────────────────────────────────────────────────────────
export function PurchaseReportPDF({ tree, columns }) {
  // Use provided columns or default PDF_COLS filtered to provided col keys
  const cols = columns
    ? PDF_COLS.filter((c) => columns.includes(c.key) || c.key === "sno")
    : PDF_COLS;

  const flatRows = flattenTree(tree);
  let dataIdx = 0;

  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  return (
    <Document title={`Purchase Report ${today}`}>
      <Page size="A4" orientation="landscape" style={s.page} wrap>
        {/* ── header ── */}
        <View style={s.headerRow} fixed>
          <Image src={mpLogo} style={s.logo} />
          <Text style={s.headerTitle}>PURCHASE REPORT</Text>
          <Text style={s.headerDate}>{today}</Text>
        </View>

        {/* ── inward type legend ── */}
        <View style={s.legendBox} fixed>
          <Text style={s.legendLabel}>Inward Type:  </Text>
          {Object.entries(INWARD_SHORT).map(([full, short]) => (
            <Text key={short} style={s.legendItem}>
              <Text style={s.legendBold}>{short}</Text> = {full}{"   "}
            </Text>
          ))}
        </View>

        {/* ── table header ── */}
        <View style={s.tableHeader} fixed>
          {cols.map((col, i) => (
            <Text
              key={col.key}
              style={[
                s.th,
                { width: col.w, textAlign: col.align },
                i === cols.length - 1 && s.thLast,
              ]}
            >
              {col.label}
            </Text>
          ))}
        </View>

        {/* ── rows ── */}
        {flatRows.map((item, fi) => {
          if (item._type === "group") {
            const indent = item.depth * 8;
            const label = `${item.node._key}: ${item.node._val || "(blank)"}  —  ${item.node._count} item${item.node._count !== 1 ? "s" : ""}${item.qtyStr ? "  |  " + item.qtyStr : ""}`;
            return (
              <View key={`g${fi}`} style={s.groupRow} wrap={false}>
                <Text style={[s.groupText, { paddingLeft: indent }]}>{label}</Text>
              </View>
            );
          }

          // data row
          const r = item.row;
          dataIdx++;
          const isOverdue = r.dueAlert === "overdue";
          const rowStyle = isOverdue ? s.rowOverdue : dataIdx % 2 === 0 ? s.rowEven : s.rowOdd;

          return (
            <View key={`r${fi}`} style={rowStyle} wrap={false}>
              {cols.map((col, ci) => {
                const txt   = getCellText(col.key, r, dataIdx);
                const color = getCellColor(col.key, r);
                const isBold = ["status","dueStatus"].includes(col.key);
                return (
                  <Text
                    key={col.key}
                    style={[
                      s.td,
                      {
                        width: col.w,
                        textAlign: col.align,
                        color,
                        fontFamily: isBold ? "Helvetica-Bold" : "Helvetica",
                      },
                      ci === cols.length - 1 && s.tdLast,
                    ]}
                  >
                    {txt}
                  </Text>
                );
              })}
            </View>
          );
        })}

        {/* ── footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            Generated on {today} · National Print
          </Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
