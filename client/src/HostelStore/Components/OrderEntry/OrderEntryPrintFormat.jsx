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

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 7,
    padding: 20,
    paddingBottom: 60,
    backgroundColor: "#fff",
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
  logoContainer: { width: 140, alignItems: "flex-start" },
  logo: { height: 70, width: 70 },
  companyCenter: { flex: 1, alignItems: "center" },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a2e",
    marginBottom: 4,
  },
  companyAddr: {
    fontSize: 8,
    color: "#444",
    textAlign: "center",
    lineHeight: 1.3,
  },
  companyRight: { width: 140, alignItems: "flex-end" },
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

  infoGrid: {
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
    padding: "6 4",
    fontSize: 7.5,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1 solid #f0f0f0",
    padding: "6 4",
    alignItems: "center",
    minHeight: 25,
  },
  colSno: { width: 25, textAlign: "center" },
  colDesc: { flex: 1, paddingRight: 10 },
  colSize: { width: 60, textAlign: "center" },
  colGSM: { width: 45, textAlign: "center" },
  colHSN: { width: 50, textAlign: "center" },
  colUOM: { width: 45, textAlign: "center" },
  colQty: { width: 50, textAlign: "right" },

  totalRow: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    padding: "6 4",
    borderTop: "1 solid #eee",
    fontWeight: "bold",
  },

  notesSection: {
    marginTop: 20,
    flexDirection: "row",
    gap: 15,
  },
  noteBox: {
    flex: 1,
    border: "1 solid #eee",
    borderRadius: 4,
  },
  noteContent: { padding: 8, fontSize: 7.5, color: "#555", lineHeight: 1.4 },

  footer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    borderTop: "1 solid #eee",
    paddingTop: 10,
    textAlign: "center",
    fontSize: 7,
    color: "#999",
  },
});

const OrderEntryPrintFormat = ({
  data,
  customerDetails,
  branchData,
  qrCodeDataUrl,
  styleItemList,
  sizeList,
  uomList,
  gsmList,
  hsnList,
}) => {
  if (!data) return null;
  console.log(branchData, "branchData");

  const getName = (id, list) => {
    if (!id || !list) return "-";
    const item = list.find((i) => i.id === id);
    return item ? item.name : "-";
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topBar} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image src={Logo} style={styles.logo} />
          </View>
          <View style={styles.companyCenter}>
            <Text style={styles.companyName}>NATIONAL PRINTING PRESS</Text>
            <Text style={styles.companyAddr}>
              {branchData?.address ||
                "9(1)-MAARIYAMMAN LAYOUT 2ND STREET,KUMARANATHA PURAM,TIRUPUR : 641602"}
            </Text>
          </View>
          <View style={styles.companyRight}>
            <View style={styles.companyRightRow}>
              <Text style={styles.companyLabel}>GSTIN :</Text>
              <Text style={styles.companyValue}>
                {branchData?.gstNo || "33BHEPC9190H1ZE"}
              </Text>
            </View>
            <View style={styles.companyRightRow}>
              <Text style={styles.companyLabel}>Mobile :</Text>
              <Text style={styles.companyValue}>
                {branchData?.contactMobile || "9952138129"}
              </Text>
            </View>
            {qrCodeDataUrl && (
              <View style={{ marginTop: 5 }}>
                <Image src={qrCodeDataUrl} style={{ width: 40, height: 40 }} />
              </View>
            )}
          </View>
        </View>

        <Text style={styles.titleBand}>ORDER ENTRY</Text>

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.box}>
            <Text style={styles.sectionHeader}>CUSTOMER DETAILS</Text>
            <View style={styles.sectionBody}>
              <Text style={styles.partyName}>
                {customerDetails?.name || "N/A"}
              </Text>
              <Text style={styles.partyAddr}>
                {customerDetails?.address || ""}
              </Text>
              <View style={styles.labelValueRow}>
                <Text style={styles.label}>Contact Person</Text>
                <Text style={styles.value}>
                  : {customerDetails?.contactPersonName || "N/A"}
                </Text>
              </View>
              <View style={styles.labelValueRow}>
                <Text style={styles.label}>Mobile No</Text>
                <Text style={styles.value}>
                  : {customerDetails?.contactNumber || "N/A"}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.piDetailsBox}>
            <Text style={styles.sectionHeader}>ORDER DETAILS</Text>
            <View style={styles.sectionBody}>
              <View style={styles.labelValueRow}>
                <Text style={styles.label}>Order No</Text>
                <Text style={styles.value}>: {data?.docId}</Text>
              </View>
              <View style={styles.labelValueRow}>
                <Text style={styles.label}>Order Date</Text>
                <Text style={styles.value}>
                  : {moment(data?.docDate).format("DD-MM-YYYY")}
                </Text>
              </View>
              <View style={styles.labelValueRow}>
                <Text style={styles.label}>Order Type</Text>
                <Text style={styles.value}>: {data?.orderType}</Text>
              </View>
              <View style={styles.labelValueRow}>
                <Text style={styles.label}>Delivery Date</Text>
                <Text style={styles.value}>
                  :{" "}
                  {data?.deliveryDate
                    ? moment(data.deliveryDate).format("DD-MM-YYYY")
                    : "N/A"}
                </Text>
              </View>
              <View style={styles.labelValueRow}>
                <Text style={styles.label}>Job Type</Text>
                <Text style={styles.value}>
                  : {data?.jobType || "Internal"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colSno}>S.No</Text>
            <Text style={styles.colDesc}>Description of Goods</Text>
            <Text style={styles.colSize}>Size</Text>
            <Text style={styles.colGSM}>GSM</Text>
            <Text style={styles.colHSN}>HSN</Text>
            <Text style={styles.colUOM}>UOM</Text>
            <Text style={styles.colQty}>Qty</Text>
          </View>
          {data?.orderItems?.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.colSno}>{index + 1}</Text>
              <Text style={[styles.colDesc, { fontWeight: "bold" }]}>
                {getName(item.styleItemId, styleItemList)}
              </Text>
              <Text style={styles.colSize}>
                {getName(item.sizeId, sizeList)}
              </Text>
              <Text style={styles.colGSM}>{getName(item.gsmId, gsmList)}</Text>
              <Text style={styles.colHSN}>{getName(item.hsnId, hsnList)}</Text>
              <Text style={styles.colUOM}>{getName(item.uomId, uomList)}</Text>
              <Text style={styles.colQty}>
                {Number(item.orderQty || 0).toFixed(3)}
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={{ flex: 1, textAlign: "right", paddingRight: 10 }}>
              Total Quantity :
            </Text>
            <Text style={[styles.colQty, { fontWeight: "bold" }]}>
              {data?.orderItems
                ?.reduce((sum, item) => sum + (Number(item.orderQty) || 0), 0)
                .toFixed(3)}
            </Text>
          </View>
        </View>

        {/* Terms and Remarks */}
        <View style={styles.notesSection}>
          <View style={styles.noteBox}>
            <Text style={styles.sectionHeader}>TERMS & CONDITIONS</Text>
            <View style={styles.noteContent}>
              <Text>{data?.termsAndCondition || "N/A"}</Text>
            </View>
          </View>
          <View style={styles.noteBox}>
            <Text style={styles.sectionHeader}>REMARKS</Text>
            <View style={styles.noteContent}>
              <Text>{data?.remarks || "N/A"}</Text>
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

export default OrderEntryPrintFormat;
