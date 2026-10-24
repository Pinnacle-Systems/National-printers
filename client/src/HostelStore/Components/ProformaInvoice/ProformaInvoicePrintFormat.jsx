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
  topDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    border: "1 solid #eee",
    borderRadius: 4,
    padding: "6 12",
    marginBottom: 10,
    backgroundColor: "#f8f9fa",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 8.5,
    color: "#666",
    marginRight: 4,
    fontWeight: "bold",
  },
  detailValue: {
    fontSize: 8.5,
    color: "#000",
    fontWeight: "bold",
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
  label: { width: 60, fontSize: 8.5, color: "#888" },
  value: { flex: 1, fontSize: 8.5, color: "#000", fontWeight: "bold" },

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
  colTax: {
    width: 35,
    textAlign: "right",
    borderRight: "1 solid #eee",
    justifyContent: "center",
    paddingVertical: 4,
    paddingRight: 4,
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

  bankBox: {
    padding: "5 8",
    border: "1 solid #e2e8f0",
    borderRadius: 3,
    backgroundColor: "#f8fafc",
    maxWidth: 300,
  },
  bankTitle: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#1a1a2e",
    marginBottom: 3,
    borderBottom: "1 solid #e2e8f0",
    paddingBottom: 2,
    letterSpacing: 0.5,
  },
  bankRow: {
    flexDirection: "row",
    marginBottom: 1.5,
    alignItems: "center",
  },
  bankLabel: {
    width: 80,
    fontSize: 7,
    color: "#555",
  },
  bankColon: {
    width: 8,
    fontSize: 7,
    color: "#555",
  },
  bankValue: {
    flex: 1,
    fontSize: 7,
    color: "#1a1a2e",
    fontWeight: "bold",
  },

  headerCell: {
    textAlign: "center",
    fontWeight: "bold",
    color: "#fff",
    borderRight: "1 solid #333",
    paddingVertical: 6,
    justifyContent: "center",
    fontSize: 8.5,
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
    fontSize: 8.5,
    color: "#444",
    padding: 4,
    paddingLeft: 8,
  },
  taxValue: {
    fontSize: 8.5,
    color: "#000",
    textAlign: "right",
    padding: 4,
    paddingRight: 8,
    fontWeight: "bold",
  },
  taxLabelNet: {
    flex: 1,
    fontSize: 9.5,
    color: "#fff",
    fontWeight: "bold",
    padding: 6,
    paddingLeft: 8,
  },
  taxValueNet: {
    fontSize: 9.5,
    color: "#fff",
    fontWeight: "bold",
    textAlign: "right",
    padding: 6,
    paddingRight: 8,
  },
  wordsBar: {
    backgroundColor: "#1a1a2e",
    color: "#fff",
    padding: 6,
    borderTop: "1 solid #1a1a2e",
  },
  wordsText: {
    fontSize: 9,
    color: "#fff",
  },
  wordsValue: {
    fontSize: 9,
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
  const deliveryCharge = Number(data.deliveryCharge) || 0;
  const grandTotal = (calculations.net || 0) + deliveryCharge;
  const roundOff =
    calculations.roundOff !== undefined
      ? calculations.roundOff
      : data.roundOff !== undefined
        ? data.roundOff
        : 0;
  const taxRows = calculations.slabBreakup || [];

  const isCustomerExport = Boolean(
    data.isCustomerExport ??
    data.customer?.isCustomerExport ??
    (data.customer?.City?.state?.country?.name
      ? data.customer.City.state.country.name.trim().toUpperCase() !== "INDIA"
      : false),
  );

  const bank = data.Bank || data.bank;
  const bankHolder =
    bank?.bankHolderName || bank?.accountHolderName || bank?.holderName;
  const bankName = bank?.name;
  const accNo = bank?.accNo || bank?.accountNo || bank?.accountNumber;
  const branchName =
    bank?.Branch?.name ||
    bank?.branchName ||
    (typeof bank?.Branch === "string" ? bank?.Branch : null);
  const ifsc = bank?.ifsc;
  const swiftCode = bank?.swiftCode;

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
              9(1)-MAARIYAMMAN LAYOUT 2ND STREET,{"\n"}
              KUMARANATHA PURAM,TIRUPUR : 641602
            </Text>
          </View>
          <View style={styles.companyRight}>
            <View style={styles.companyRightRow}>
              <Text style={styles.companyLabel}>GSTIN :</Text>
              <Text style={styles.companyValue}>33BHEPC9190H1ZE</Text>
            </View>
            <View style={styles.companyRightRow}>
              <Text style={styles.companyLabel}>Mobile :</Text>
              <Text style={styles.companyValue}>9952138129</Text>
            </View>
          </View>
        </View>

        <Text style={styles.titleBand} fixed>
          PROFORMA INVOICE
        </Text>

        <View style={styles.topDetailsRow} fixed>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>PI No :</Text>
            <Text
              style={[
                styles.detailValue,
                data.quoteVersion > 1 && { color: "#b91c1c" },
              ]}
            >
              {data.docId}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>PI Date :</Text>
            <Text style={styles.detailValue}>
              {moment(data.docDate).format("DD-MM-YYYY")}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Order No :</Text>
            <Text style={styles.detailValue}>
              {data.OrderEntry?.docId || "-"}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Payment Mode :</Text>
            <Text style={styles.detailValue}>{data.modeOfPayment || "-"}</Text>
          </View>
          {data.quoteVersion > 1 && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Version :</Text>
              <Text style={[styles.detailValue, { color: "#b91c1c" }]}>
                v{data.quoteVersion}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.docInfoSection} fixed>
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

          <View style={styles.box}>
            <Text style={styles.sectionHeader}>SHIP TO</Text>
            <View style={styles.sectionBody}>
              <Text style={styles.partyName}>
                {data.deliveryType === "others"
                  ? data.deliveryCustomer?.name || "N/A"
                  : data.customer?.name || "N/A"}
              </Text>
              <Text style={styles.partyAddr}>
                {data.deliveryType === "others"
                  ? data.deliveryCustomer?.address || ""
                  : data.customer?.address || ""}
              </Text>
              <View style={styles.labelValueRow}>
                <Text style={styles.label}>GSTIN</Text>
                <Text style={styles.value}>
                  :{" "}
                  {data.deliveryType === "others"
                    ? data.deliveryCustomer?.gstNo || "N/A"
                    : data.customer?.gstNo || "N/A"}
                </Text>
              </View>
              <View style={styles.labelValueRow}>
                <Text style={styles.label}>Mobile No</Text>
                <Text style={styles.value}>
                  :{" "}
                  {data.deliveryType === "others"
                    ? data.deliveryCustomer?.contactNumber || "N/A"
                    : data.customer?.contactNumber || "N/A"}
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
              <Text
                style={[
                  styles.colGross,
                  styles.headerCell,
                  isCustomerExport && { borderRight: "none" },
                ]}
              >
                Gross
              </Text>
              {!isCustomerExport && (
                <Text
                  style={[
                    styles.colTax,
                    styles.headerCell,
                    { borderRight: "none" },
                  ]}
                >
                  Tax%
                </Text>
              )}
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
                      {item.sizeBreakup?.filter(
                        (sb) => (Number(sb.qty) || 0) > 0,
                      ).length > 0 && (
                        <View style={{ marginTop: 2 }}>
                          <Text style={{ fontSize: 9 }}>
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
                                  item.trackingType ===
                                  "Size Template + Barcode"
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
                    <View
                      style={[
                        styles.colGross,
                        !isCustomerExport && { borderRight: "1 solid #eee" },
                      ]}
                    >
                      <Text>{gross.toFixed(2)}</Text>
                    </View>
                    {!isCustomerExport && (
                      <View style={styles.colTax}>
                        <Text>{Number(item.taxPercent || 0)}%</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
            <View style={styles.tableFooter}>
              <View
                style={{
                  flex: 1,
                  textAlign: "right",
                  paddingRight: 10,
                  justifyContent: "center",
                }}
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
              <View style={[styles.colPrice, { borderRight: "none" }]}>
                <Text>
                  {items
                    .reduce((sum, item) => sum + (Number(item.price) || 0), 0)
                    .toFixed(2)}
                </Text>
              </View>
              <View style={[styles.colGross, { borderRight: "none" }]}>
                <Text>{subTotal.toFixed(2)}</Text>
              </View>
              {!isCustomerExport && (
                <View style={[styles.colTax, { borderRight: "none" }]} />
              )}
            </View>

            {/* Bank Details & Attached Tax Details */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "stretch",
              }}
            >
              <View
                style={{
                  flex: 1,
                  padding: 8,
                  justifyContent: "flex-start",
                }}
              >
                {bank && (
                  <View style={styles.bankBox}>
                    <Text style={styles.bankTitle}>BANK DETAILS</Text>
                    <View style={styles.bankRow}>
                      <Text style={styles.bankLabel}>Beneficiary Name</Text>
                      <Text style={styles.bankColon}>:</Text>
                      <Text style={styles.bankValue}>{bankHolder || "-"}</Text>
                    </View>
                    <View style={styles.bankRow}>
                      <Text style={styles.bankLabel}>Bank Name</Text>
                      <Text style={styles.bankColon}>:</Text>
                      <Text style={styles.bankValue}>{bankName || "-"}</Text>
                    </View>
                    <View style={styles.bankRow}>
                      <Text style={styles.bankLabel}>Account Number</Text>
                      <Text style={styles.bankColon}>:</Text>
                      <Text style={styles.bankValue}>{accNo || "-"}</Text>
                    </View>
                    <View style={styles.bankRow}>
                      <Text style={styles.bankLabel}>Branch Name</Text>
                      <Text style={styles.bankColon}>:</Text>
                      <Text style={styles.bankValue}>{branchName || "-"}</Text>
                    </View>
                    {(ifsc || !isCustomerExport) && (
                      <View style={styles.bankRow}>
                        <Text style={styles.bankLabel}>IFSC Code</Text>
                        <Text style={styles.bankColon}>:</Text>
                        <Text style={styles.bankValue}>{ifsc || "-"}</Text>
                      </View>
                    )}
                    {(swiftCode || isCustomerExport) && (
                      <View style={styles.bankRow}>
                        <Text style={styles.bankLabel}>SWIFT Code</Text>
                        <Text style={styles.bankColon}>:</Text>
                        <Text style={styles.bankValue}>{swiftCode || "-"}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              <View style={{ width: 170, borderLeft: "1 solid #eee" }}>
                <View style={styles.taxRow}>
                  <Text style={styles.taxLabel}>Taxable Amt</Text>
                  <Text style={styles.taxValue}>
                    {taxableAmount.toFixed(2)}
                  </Text>
                </View>

                {taxRows.map((tax, idx) => (
                  <View style={styles.taxRow} key={idx}>
                    <Text style={styles.taxLabel}>{tax.tax}</Text>
                    <Text style={styles.taxValue}>{tax.amount.toFixed(2)}</Text>
                  </View>
                ))}

                {deliveryCharge > 0 && (
                  <View style={styles.taxRow}>
                    <Text style={styles.taxLabel}>Delivery Charge</Text>
                    <Text style={styles.taxValue}>
                      {deliveryCharge.toFixed(2)}
                    </Text>
                  </View>
                )}

                <View style={styles.taxRow}>
                  <Text style={styles.taxLabel}>Round Off</Text>
                  <Text style={styles.taxValue}>
                    {Number(roundOff || 0).toFixed(2)}
                  </Text>
                </View>

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
                Amount in Words:{" "}
                <Text style={{ fontWeight: "bold" }}>
                  {amountInWords(grandTotal)}
                </Text>
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footerGrid}>
          <View style={styles.footerCard}>
            <Text style={styles.sectionHeader}>TERMS & CONDITIONS</Text>
            <View style={styles.sectionBody}>
              <Text style={{ fontSize: 7, color: "#444", lineHeight: 1.4 }}>
                {data.termsAndCondition ||
                  data.Terms?.description ||
                  data.OrderEntry?.termsAndCondition ||
                  ""}
              </Text>
            </View>
          </View>
          <View style={styles.footerCard}>
            <Text style={styles.sectionHeader}>REMARKS</Text>
            <View style={styles.sectionBody}>
              <Text style={{ fontSize: 7, color: "#444", lineHeight: 1.4 }}>
                {data.remarks || ""}
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
