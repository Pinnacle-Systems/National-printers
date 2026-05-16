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
    fontSize: 9,
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
  partyAddr: { fontSize: 9, color: "#555", lineHeight: 1.4, marginBottom: 6 },
  labelValueRow: { flexDirection: "row", marginBottom: 2 },
  label: { width: 80, fontSize: 9, color: "#888" },
  value: { flex: 1, fontSize: 9, color: "#000", fontWeight: "bold" },

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
    fontSize: 7.5,
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
  colItemGroup: {
    width: 70,
    textAlign: "left",
    paddingLeft: 4,
    borderRight: "1 solid #eee",
    justifyContent: "center",
    paddingVertical: 4,
  },
  colHSN: {
    width: 40,
    textAlign: "right",
    paddingRight: 2,
    borderRight: "1 solid #eee",
    justifyContent: "center",
    paddingVertical: 4,
  },
  colUOM: {
    width: 35,
    textAlign: "left",
    paddingLeft: 4,
    borderRight: "1 solid #eee",
    justifyContent: "center",
    paddingVertical: 4,
  },
  colQty: {
    width: 45,
    textAlign: "right",
    paddingRight: 4,
    borderRight: "1 solid #eee",
    justifyContent: "center",
    paddingVertical: 4,
  },
  colPrice: {
    width: 45,
    textAlign: "right",
    paddingRight: 4,
    borderRight: "1 solid #eee",
    justifyContent: "center",
    paddingVertical: 4,
  },
  colRemarks: {
    width: 80,
    textAlign: "left",
    paddingLeft: 4,
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
    fontSize: 8,
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

const OrderEntryPrintFormat = ({
  data,
  customerDetails,
  branchData,
  styleItemList,
  sizeList,
  uomList,
  gsmList,
  hsnList,
  itemGroupList,
}) => {
  if (!data) return null;

  const getName = (id, list) => {
    if (!id || !list) return "-";
    const item = list.find((i) => i.id === id);
    return item ? item.name : "-";
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topBar} fixed />
        <View style={styles.header} fixed>
          <View style={styles.logoContainer}>
            <Image src={Logo} style={styles.logo} />
          </View>
          <View style={styles.companyCenter}>
            <Text style={styles.companyName}>NATIONAL PRINTING PRESS</Text>
            <Text style={styles.companyAddr}>
              {branchData?.address || (
                <Text>
                  9(1)-MAARIYAMMAN LAYOUT 2ND STREET,{"\n"}KUMARANATHA
                  PURAM,TIRUPUR : 641602
                </Text>
              )}
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
          </View>
        </View>

        <Text style={styles.titleBand} fixed>
          ORDER ENTRY
        </Text>

        <View style={styles.docInfoSection} fixed>
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
                <Text style={styles.label}>Production Type</Text>
                <Text style={styles.value}>: {data?.productionType}</Text>
              </View>
              <View style={styles.labelValueRow}>
                <Text style={styles.label}>Delivery Date</Text>
                <Text style={styles.value}>
                  :{" "}
                  {data?.deliveryDate
                    ? moment(data.deliveryDate).format("DD-MM-YYYY")
                    : ""}
                </Text>
              </View>
            </View>
          </View>
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
        </View>

        <View style={styles.contentArea}>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.colSno, styles.headerCell]}>S.No</Text>
              <Text style={[styles.colDesc, styles.headerCell]}>
                DESCRIPTION OF GOODS
              </Text>
              <Text style={[styles.colItemGroup, styles.headerCell]}>
                ITEM GROUP
              </Text>
              <Text style={[styles.colHSN, styles.headerCell]}>HSN</Text>
              <Text style={[styles.colUOM, styles.headerCell]}>UOM</Text>
              <Text style={[styles.colQty, styles.headerCell]}>QTY</Text>
              <Text style={[styles.colPrice, styles.headerCell]}>PRICE</Text>
              <Text style={[styles.colRemarks, styles.headerCell]}>
                REMARKS
              </Text>
            </View>
            {data?.orderItems?.map((item, index) => (
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
                      {getName(item.styleItemId, styleItemList)}
                    </Text>
                    {item.sizeBreakup?.filter((sb) => (Number(sb.qty) || 0) > 0)
                      .length > 0 && (
                      <View style={{ marginTop: 2 }}>
                        <Text style={{ fontSize: 9 }}>
                          {item.sizeBreakup
                            .filter((sb) => (Number(sb.qty) || 0) > 0)
                            .map((sb) => {
                              const size = getName(sb.sizeId, sizeList);
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
                    {item.sizeBreakup?.find((sb) => sb.description) && (
                      <View style={{ marginTop: 2 }}>
                        <Text
                          style={{
                            fontSize: 9,
                            fontStyle: "italic",
                          }}
                        >
                          {
                            item.sizeBreakup.find((sb) => sb.description)
                              .description
                          }
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.colItemGroup}>
                    <Text>{getName(item.itemGroupId, itemGroupList)}</Text>
                  </View>
                  <View style={styles.colHSN}>
                    <Text>{getName(item.hsnId, hsnList)}</Text>
                  </View>
                  <View style={styles.colUOM}>
                    <Text>{getName(item.uomId, uomList)}</Text>
                  </View>
                  <View style={styles.colQty}>
                    <Text>{Number(item.orderQty || 0)}</Text>
                  </View>
                  <View style={styles.colPrice}>
                    <Text>{Number(item.price || 0).toFixed(2)}</Text>
                  </View>
                  <View style={styles.colRemarks}>
                    <Text>{item.remarks || ""}</Text>
                  </View>
                </View>
              </View>
            ))}
            <View style={styles.tableFooter}>
              <View
                style={[
                  styles.colSno,
                  styles.colDesc,
                  styles.colItemGroup,
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
                <Text>TOTAL QTY</Text>
              </View>
              <View style={[styles.colQty, { borderRight: "none" }]}>
                <Text>
                  {data?.orderItems?.reduce(
                    (sum, item) => sum + (Number(item.orderQty) || 0),
                    0,
                  )}
                </Text>
              </View>
              <View style={[styles.colPrice, { borderRight: "none" }]} />
              <View style={[styles.colRemarks, { borderRight: "none" }]} />
            </View>
          </View>
        </View>

        <View style={[styles.footerGrid, { marginTop: "auto" }]}>
          <View style={styles.footerCard}>
            <Text style={styles.sectionHeader}>REMARKS</Text>
            <View style={styles.sectionBody}>
              <Text style={{ fontSize: 7, color: "#444", lineHeight: 1.4 }}>
                {data?.remarks || ""}
              </Text>
            </View>
          </View>
          <View style={styles.footerCard}>
            <Text style={styles.sectionHeader}>ORDER SUMMARY</Text>
            <View style={styles.sectionBody}>
              <View style={[styles.labelValueRow, { marginBottom: 6 }]}>
                <Text style={[styles.label, { width: 50 }]}>Total Items</Text>
                <Text style={styles.summaryValue}>
                  :{" "}
                  {data?.orderItems?.filter((item) => item.styleItemId)
                    ?.length || 0}
                </Text>
              </View>
              <View style={styles.labelValueRow}>
                <Text style={[styles.label, { width: 50 }]}>Total Qty</Text>
                <Text style={styles.summaryValue}>
                  :{" "}
                  {data?.orderItems?.reduce(
                    (sum, item) => sum + (Number(item.orderQty) || 0),
                    0,
                  )}
                </Text>
              </View>
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
