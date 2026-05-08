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
    flex: 4,
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
  taxBox: {
    width: 160,
    border: "1 solid #ddd",
    borderRadius: 3,
    overflow: "hidden",
  },
  taxHeader: {
    backgroundColor: "#1a1a2e",
    color: "#fff",
    textAlign: "center",
    fontSize: 8,
    fontWeight: "bold",
    letterSpacing: 1,
    paddingVertical: 4,
  },
  taxRow: {
    flexDirection: "row",
    borderTop: "1 solid #ebebeb",
  },
  taxRowNet: {
    flexDirection: "row",
    borderTop: "1.5 solid #1a1a2e",
    backgroundColor: "#1a1a2e",
  },
  taxLabel: {
    flex: 1,
    fontSize: 7.5,
    color: "#444",
    padding: 4,
    paddingLeft: 8,
  },
  taxValue: {
    fontSize: 7.5,
    color: "#000",
    textAlign: "right",
    padding: 4,
    paddingRight: 8,
    fontWeight: "bold",
  },
  taxLabelNet: {
    flex: 1,
    fontSize: 8.5,
    color: "#fff",
    fontWeight: "bold",
    padding: 6,
    paddingLeft: 8,
  },
  taxValueNet: {
    fontSize: 8.5,
    color: "#fff",
    fontWeight: "bold",
    textAlign: "right",
    padding: 6,
    paddingRight: 8,
  },
  wordsBar: {
    backgroundColor: "#1a1a2e",
    color: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
    borderRadius: 3,
  },
  wordsText: {
    fontSize: 8,
    fontStyle: "italic",
    color: "#e8e8f0",
  },
  wordsValue: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#fff",
    textTransform: "capitalize",
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
                <Text
                  style={[
                    styles.value,
                    data.quoteVersion > 1 && { color: "#b91c1c" },
                  ]}
                >
                  : {data.docId}
                </Text>
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
                      <Text
                        style={{
                          fontWeight: "bold",
                          color: "black",
                          fontSize: 9,
                        }}
                      >
                        {item.StyleItem?.name || "N/A"}
                      </Text>
                      {item.sizeBreakup?.filter((sb) => (Number(sb.qty) || 0) > 0)
                        .length > 0 && (
                        <View style={{ marginTop: 2 }}>
                          <Text style={{ fontSize: 9, color: "black" }}>
                            {item.sizeBreakup
                              .filter((sb) => (Number(sb.qty) || 0) > 0)
                              .map((sb) => {
                                const size = sb.Size?.name || "Size";
                                const qty = Number(sb.qty);
                                const range = sb.barcodeFrom
                                  ? `${sb.barcodeFrom}-${sb.barcodeTo}`
                                  : "";

                                if (item.trackingType === "Barcode")
                                  return `${range}/${qty}`;
                                if (item.trackingType === "Size Template")
                                  return `${size}/${qty}`;
                                if (
                                  item.trackingType === "Size Template + Barcode"
                                )
                                  return `${size}/${range}/${qty}`;
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
          <View style={styles.taxBox}>
            <Text style={styles.taxHeader}>TAX DETAILS</Text>
            
            <View style={styles.taxRow}>
              <Text style={styles.taxLabel}>Taxable Amt</Text>
              <Text style={styles.taxValue}>{taxableAmount.toFixed(2)}</Text>
            </View>

            {taxRows.map((tax, idx) => (
              <View style={styles.taxRow} key={idx}>
                <Text style={styles.taxLabel}>{tax.tax}</Text>
                <Text style={styles.taxValue}>{tax.amount.toFixed(2)}</Text>
              </View>
            ))}

            <View style={styles.taxRowNet}>
              <Text style={styles.taxLabelNet}>Net Amount</Text>
              <Text style={styles.taxValueNet}>
                {grandTotal.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.wordsBar}>
          <Text style={styles.wordsText}>
            Amount in Words: <Text style={styles.wordsValue}>{amountInWords(grandTotal)} Only</Text>
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
