import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import Logo from "../../../assets/NationalPrintLogo.jpeg";
import moment from "moment";
import { amountInWords } from "../../../Utils/helper";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    paddingBottom: 50,
    fontSize: 8,
    color: "#333",
    fontFamily: "Helvetica",
    backgroundColor: "#fff",
    display: "flex",
    flexDirection: "column",
  },
  contentArea: {
    flexGrow: 1,
  },
  topBar: { height: 4, backgroundColor: "#1a1a2e", marginBottom: 10 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 15,
    borderBottom: "1.5 solid #1a1a2e",
    marginBottom: 15,
  },
  logoContainer: { width: 130, alignItems: "flex-start" },
  logo: { height: 60, width: 130 },
  companyCenter: { flex: 2, alignItems: "center", paddingHorizontal: 10 },
  companyName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1a1a2e",
    marginBottom: 4,
  },
  companyAddr: {
    fontSize: 7.5,
    color: "#444",
    textAlign: "center",
    lineHeight: 1.3,
    maxWidth: 250,
  },
  companyRight: { width: 130, alignItems: "flex-end" },
  companyRightRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 3,
  },
  companyLabel: { fontSize: 7, color: "#888", marginRight: 4 },
  companyValue: { fontSize: 7, color: "#1a1a2e", fontWeight: "bold" },

  titleBand: {
    backgroundColor: "#1a1a2e",
    color: "#fff",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 2,
    paddingVertical: 5,
    marginBottom: 15,
  },

  docInfoSection: {
    flexDirection: "row",
    marginBottom: 15,
    gap: 20,
  },
  box: {
    flex: 1,
    border: "1 solid #eee",
    borderRadius: 4,
  },
  piDetailsBox: {
    width: 180,
    border: "1 solid #eee",
    borderRadius: 4,
  },
  sectionHeader: {
    backgroundColor: "#f8f9fa",
    borderBottom: "1 solid #eee",
    padding: "4 8",
    fontSize: 8,
    fontWeight: "bold",
    color: "#1a1a2e",
  },
  sectionBody: { padding: 8 },
  partyName: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  partyAddr: { fontSize: 7.5, color: "#555", lineHeight: 1.4, marginBottom: 6 },
  labelValueRow: { flexDirection: "row", marginBottom: 2 },
  label: { width: 60, fontSize: 7.5, color: "#888" },
  value: { flex: 1, fontSize: 7.5, color: "#000", fontWeight: "bold" },

  table: {
    marginTop: 5,
    border: "1 solid #eee",
    borderRadius: 4,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1a1a2e",
    color: "#fff",
    fontSize: 6.5,
    fontWeight: "bold",
    alignItems: "stretch",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1 solid #eee",
    alignItems: "stretch",
    minHeight: 25,
  },
  tableFooter: {
    flexDirection: "row",
    backgroundColor: "#1a1a2e",
    color: "#fff",
    fontWeight: "bold",
    alignItems: "stretch",
    minHeight: 20,
  },
  colSno: {
    width: 20,
    textAlign: "center",
    borderRight: "1 solid #eee",
    justifyContent: "center",
    paddingVertical: 4,
  },
  colDesc: {
    flex: 2.5,
    textAlign: "left",
    paddingLeft: 4,
    borderRight: "1 solid #eee",
    justifyContent: "center",
    paddingVertical: 4,
  },
  colHSN: {
    width: 50,
    textAlign: "right",
    borderRight: "1 solid #eee",
    justifyContent: "center",
    paddingVertical: 4,
    paddingRight: 2,
  },
  colType: {
    width: 75,
    textAlign: "left",
    paddingLeft: 4,
    borderRight: "1 solid #eee",
    justifyContent: "center",
    paddingVertical: 4,
  },
  colUOM: {
    width: 35,
    textAlign: "left",
    borderRight: "1 solid #eee",
    justifyContent: "center",
    paddingVertical: 4,
    paddingLeft: 2,
  },
  colQty: {
    width: 50,
    textAlign: "right",
    paddingRight: 4,
    borderRight: "1 solid #eee",
    justifyContent: "center",
    paddingVertical: 4,
  },
  colPrice: {
    width: 50,
    textAlign: "right",
    paddingRight: 4,
    borderRight: "1 solid #eee",
    justifyContent: "center",
    paddingVertical: 4,
  },
  colGross: {
    width: 65,
    textAlign: "right",
    paddingRight: 4,
    justifyContent: "center",
    paddingVertical: 4,
  },

  headerCell: {
    textAlign: "center",
    fontWeight: "bold",
    color: "#fff",
    borderRight: "1 solid #333",
    paddingVertical: 6,
    justifyContent: "center",
  },

  footerGrid: {
    flexDirection: "row",
    marginTop: 15,
    marginBottom: 10,
    gap: 10,
  },
  footerCard: {
    flex: 1,
    border: "1 solid #eee",
    borderRadius: 4,
    overflow: "hidden",
  },
  summaryValue: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#1a1a2e",
  },

  summaryContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 15,
  },
  summaryBox: {
    width: 180,
    border: "1 solid #eee",
    borderRadius: 4,
    overflow: "hidden",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: "4 10",
    borderBottom: "1 solid #f9f9f9",
  },
  grandTotalRow: {
    backgroundColor: "#1a1a2e",
    color: "#fff",
    fontWeight: "bold",
    padding: "6 10",
  },
  wordsBar: {
    backgroundColor: "#1a1a2e",
    color: "#fff",
    padding: "6 10",
    marginTop: 5,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
  },

  footer: {
    position: "absolute",
    bottom: 15,
    left: 20,
    right: 20,
    borderTop: "1 solid #eee",
    paddingTop: 10,
    textAlign: "center",
    fontSize: 7,
    color: "#999",
  },
});

const ProformaInvoicePrintFormat = ({ data }) => {
  if (!data) return null;

  const calculations = data.calculations || {};
  const items = calculations.items || data.items || [];

  const subTotal = calculations.gross || 0;
  const totalDiscount =
    (calculations.itemDiscount || 0) + (calculations.overallDiscount || 0);
  const taxableAmount = calculations.taxable || 0;
  const grandTotal = calculations.net || 0;
  const roundOff = calculations.roundOff || 0;
  const taxRows = calculations.slabBreakup || [];

  return (
    <Document title={`Proforma Invoice - ${data.docId}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.topBar} fixed />

        {/* Header */}
        <View style={styles.header} fixed>
          <View style={styles.logoContainer}>
            <Image src={Logo} style={styles.logo} />
          </View>
          <View style={styles.companyCenter}>
            <Text style={styles.companyName}>NATIONAL PRINTING PRESS</Text>
            <Text style={styles.companyAddr}>
              {data.Branch?.address ||
                "9(1)-MAARIYAMMAN LAYOUT 2ND STREET,KUMARANATHA PURAM,TIRUPUR : 641602"}
            </Text>
          </View>
          <View style={styles.companyRight}>
            <View style={styles.companyRightRow}>
              <Text style={styles.companyLabel}>GSTIN :</Text>
              <Text style={styles.companyValue}>
                {data.Branch?.gstNo || "33BHEPC9190H1ZE"}
              </Text>
            </View>
            <View style={styles.companyRightRow}>
              <Text style={styles.companyLabel}>Mobile :</Text>
              <Text style={styles.companyValue}>
                {data.Branch?.contactMobile || "9952138129"}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.titleBand} fixed>
          PROFORMA INVOICE
        </Text>

        <View style={styles.docInfoSection} fixed>
          <View style={styles.piDetailsBox}>
            <Text style={styles.sectionHeader}>INVOICE DETAILS</Text>
            <View style={styles.sectionBody}>
              <View style={styles.labelValueRow}>
                <Text style={styles.label}>PI No</Text>
                <Text style={styles.value}>: {data.docId}</Text>
              </View>
              <View style={styles.labelValueRow}>
                <Text style={styles.label}>PI Date</Text>
                <Text style={styles.value}>
                  : {moment(data.docDate).format("DD-MM-YYYY")}
                </Text>
              </View>
              <View style={styles.labelValueRow}>
                <Text style={styles.label}>Order No</Text>
                <Text style={styles.value}>
                  : {data.OrderEntry?.docId || "-"}
                </Text>
              </View>
              {data.quoteVersion > 1 && (
                <View style={styles.labelValueRow}>
                  <Text style={styles.label}>Version</Text>
                  <Text style={[styles.value, { color: "#b91c1c" }]}>
                    : v{data.quoteVersion}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.box}>
            <Text style={styles.sectionHeader}>BILL TO</Text>
            <View style={styles.sectionBody}>
              <Text style={styles.partyName}>
                {data.customer?.name || "N/A"}
              </Text>
              <Text style={styles.partyAddr}>
                {data.customer?.address || ""}
              </Text>
              <View style={styles.labelValueRow}>
                <Text style={styles.label}>GSTIN</Text>
                <Text style={styles.value}>
                  : {data.customer?.gstNo || "N/A"}
                </Text>
              </View>
              <View style={styles.labelValueRow}>
                <Text style={styles.label}>Mobile No</Text>
                <Text style={styles.value}>
                  : {data.customer?.contactNumber || "N/A"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.contentArea}>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.colSno, styles.headerCell]}>S.No</Text>
              <Text style={[styles.colDesc, styles.headerCell]}>
                Description of Goods
              </Text>
              <Text style={[styles.colHSN, styles.headerCell]}>HSN</Text>
              <Text style={[styles.colType, styles.headerCell]}>Type</Text>
              <Text style={[styles.colUOM, styles.headerCell]}>UOM</Text>
              <Text style={[styles.colQty, styles.headerCell]}>Qty</Text>
              <Text style={[styles.colPrice, styles.headerCell]}>Price</Text>
              <Text style={[styles.colGross, styles.headerCell]}>Gross</Text>
            </View>
            {items.map((item, index) => {
              const gross =
                parseFloat(item.qty || 0) * parseFloat(item.price || 0);
              return (
                <View key={index} wrap={false}>
                  <View style={styles.tableRow}>
                    <View style={styles.colSno}>
                      <Text>{index + 1}</Text>
                    </View>
                    <View style={styles.colDesc}>
                      <Text style={{ fontWeight: "bold" }}>
                        {item.StyleItem?.name || "N/A"}
                      </Text>
                      {item.sizeBreakup?.filter(
                        (sb) => (Number(sb.qty) || 0) > 0,
                      ).length > 0 && (
                        <View style={{ marginTop: 2 }}>
                          <Text style={{ fontSize: 6, color: "#555" }}>
                            {item.sizeBreakup
                              .filter((sb) => (Number(sb.qty) || 0) > 0)
                              .map((sb) => {
                                const qtyStr = `Qty: ${Number(sb.qty).toFixed(3)}`;
                                const rangeStr = sb.barcodeFrom
                                  ? `Barcode: ${sb.barcodeFrom} - ${sb.barcodeTo}`
                                  : "";
                                if (item.trackingType === "Barcode")
                                  return `${rangeStr}  ${qtyStr}`;
                                if (item.trackingType === "Size Template")
                                  return `${sb.Size?.name || "Size"}: ${qtyStr}`;
                                if (
                                  item.trackingType ===
                                  "Size Template + Barcode"
                                )
                                  return `${sb.Size?.name || "Size"} ${rangeStr}  ${qtyStr}`;
                                return null;
                              })
                              .filter(Boolean)
                              .join("  |  ")}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.colHSN}>
                      <Text>{item.Hsn?.name || "-"}</Text>
                    </View>
                    <View style={styles.colType}>
                      <Text>{item.trackingType || "None"}</Text>
                    </View>
                    <View style={styles.colUOM}>
                      <Text>{item.Uom?.name || "-"}</Text>
                    </View>
                    <View style={styles.colQty}>
                      <Text>{Number(item.qty || 0).toFixed(3)}</Text>
                    </View>
                    <View style={styles.colPrice}>
                      <Text>{parseFloat(item.price || 0).toFixed(2)}</Text>
                    </View>
                    <View style={styles.colGross}>
                      <Text>{gross.toFixed(2)}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
            <View style={styles.tableFooter}>
              <View
                style={[
                  styles.colSno,
                  styles.colDesc,
                  styles.colHSN,
                  styles.colType,
                  styles.colUOM,
                  {
                    width: "auto",
                    flex: 1,
                    textAlign: "right",
                    paddingRight: 10,
                    borderRight: "none",
                  },
                ]}
              >
                <Text>TOTALS</Text>
              </View>
              <View style={[styles.colQty, { borderRight: "none" }]}>
                <Text>
                  {items
                    .reduce((sum, item) => sum + (Number(item.qty) || 0), 0)
                    .toFixed(3)}
                </Text>
              </View>
              <View style={[styles.colPrice, { borderRight: "none" }]} />
              <View style={[styles.colGross, { borderRight: "none" }]}>
                <Text>{subTotal.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Summary Section */}
        {/* Summary Section */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={{ fontSize: 8, color: "#555" }}>Total Gross</Text>
              <Text style={{ fontSize: 8, fontWeight: "bold" }}>
                Rs. {subTotal.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={{ fontSize: 8, color: "#555" }}>Total Discount</Text>
              <Text style={{ fontSize: 8, fontWeight: "bold", color: "#d32f2f" }}>
                (-) Rs. {totalDiscount.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={{ fontSize: 8, color: "#1a1a2e", fontWeight: "bold" }}>
                Taxable Amount
              </Text>
              <Text style={{ fontSize: 8, fontWeight: "bold" }}>
                Rs. {taxableAmount.toFixed(2)}
              </Text>
            </View>

            {taxRows.map((tax, idx) => (
              <View style={styles.summaryRow} key={idx}>
                <Text style={{ fontSize: 7, color: "#555" }}>{tax.tax}</Text>
                <Text style={{ fontSize: 7, fontWeight: "bold" }}>
                  (+) Rs. {tax.amount.toFixed(2)}
                </Text>
              </View>
            ))}

            {Math.abs(roundOff) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={{ fontSize: 7, color: "#555" }}>Round Off</Text>
                <Text style={{ fontSize: 7, fontWeight: "bold" }}>
                  {roundOff > 0 ? "(+) " : "(-) "}
                  Rs. {Math.abs(roundOff).toFixed(2)}
                </Text>
              </View>
            )}

            <View style={[styles.summaryRow, styles.grandTotalRow]}>
              <Text style={{ fontSize: 9 }}>GRAND TOTAL</Text>
              <Text style={{ fontSize: 9 }}>Rs. {grandTotal.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.wordsBar}>
          <Text style={{ fontSize: 7, fontWeight: "bold", marginRight: 5 }}>
            AMOUNT IN WORDS :
          </Text>
          <Text style={{ fontSize: 8, fontWeight: "bold", textTransform: "capitalize" }}>
            {amountInWords(grandTotal)}
          </Text>
        </View>

        <View style={styles.footerGrid}>
          <View style={styles.footerCard}>
            <Text style={styles.sectionHeader}>TERMS & CONDITIONS</Text>
            <View style={styles.sectionBody}>
              <Text style={{ fontSize: 7, color: "#444", lineHeight: 1.4 }}>
                {data.termsAndCondition || "N/A"}
              </Text>
            </View>
          </View>
          <View style={styles.footerCard}>
            <Text style={styles.sectionHeader}>REMARKS</Text>
            <View style={styles.sectionBody}>
              <Text style={{ fontSize: 7, color: "#444", lineHeight: 1.4 }}>
                {data.remarks || "N/A"}
              </Text>
            </View>
          </View>
        </View>

        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages} | Generated on ${moment().format("DD-MM-YYYY HH:mm")} | National Printing Press`
          }
        />
      </Page>
    </Document>
  );
};

export default ProformaInvoicePrintFormat;
