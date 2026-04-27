import {
    Document,
    Page,
    View,
    Text,
    Image,
    StyleSheet,
} from "@react-pdf/renderer";
import Logo from "../../../assets/mplogo.png";
import moment from "moment";

const styles = StyleSheet.create({
    borderBox: { border: "1 solid #ccc", margin: 0, padding: 0 },
    page: { fontFamily: "Helvetica", fontSize: 8, padding: 0, paddingBottom: 60, backgroundColor: "#fff" },
    topBar: { height: 4, backgroundColor: "#1a1a2e" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 10,
        borderBottom: "1.5 solid #1a1a2e",
    },
    logo: { height: 52, width: 52 },
    companyLeft: { width: 140, alignItems: "flex-start" },
    companyCenter: { alignItems: "center", flex: 1 },
    companyName: { fontSize: 18, fontWeight: "bold", color: "#1a1a2e", letterSpacing: 0.5 },
    companyRight: { width: 140, alignItems: "flex-start" },
    companyRightRow: { flexDirection: "row", marginBottom: 2, width: "100%" },
    companyLabel: { fontSize: 7.5, color: "#888", width: 38 },
    companyColon: { fontSize: 7.5, color: "#888", width: 8 },
    companyValue: { fontSize: 7.5, color: "#1a1a2e", fontWeight: "bold", flex: 1 },
    titleBand: {
        backgroundColor: "#1a1a2e",
        color: "#fff",
        textAlign: "center",
        fontSize: 13,
        fontWeight: "bold",
        letterSpacing: 3,
        paddingVertical: 6,
        marginBottom: 10,
    },
    metaRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 4,
        gap: 8,
    },
    metaPill: {
        flexDirection: "row",
        backgroundColor: "#f4f4f6",
        border: "1 solid #ddd",
        borderLeft: "2 solid #1a1a2e",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 2,
    },
    metaLabel: { fontSize: 7.5, color: "#888", marginRight: 3 },
    metaValue: { fontSize: 7.5, fontWeight: "bold", color: "#1a1a2e" },
    twoCol: {
        flexDirection: "row",
        marginHorizontal: 20,
        marginBottom: 10,
        border: "1 solid #ddd",
        borderRadius: 3,
    },
    colHalf: { flex: 1 },
    sectionHeader: {
        backgroundColor: "#2d2d44",
        color: "#e8e8f0",
        fontSize: 7.5,
        fontWeight: "bold",
        letterSpacing: 1,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    sectionBody: { padding: 8 },
    partyName: { fontSize: 9, fontWeight: "bold", color: "#1a1a2e", marginBottom: 3 },
    partyAddr: { fontSize: 7.5, color: "#555", textTransform: "uppercase", marginBottom: 4, lineHeight: 1.5 },
    partyRow: { flexDirection: "row", marginBottom: 1.5 },
    partyLabel: { fontSize: 7.5, color: "#888", width: 58 },
    partyValue: { fontSize: 7.5, color: "#222", fontWeight: "bold" },
    table: {
        marginHorizontal: 20,
        marginVertical: 10,
        border: "1 solid #ddd",
        borderRadius: 3,
        overflow: "hidden",
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#2d2d44",
        color: "#fff",
        fontSize: 7.5,
        fontWeight: "bold",
        paddingVertical: 5,
        paddingHorizontal: 5,
    },
    tableRow: {
        flexDirection: "row",
        borderBottom: "1 solid #eee",
        paddingVertical: 5,
        paddingHorizontal: 5,
    },
    colSno: { width: 30 },
    colDesc: { flex: 1 },
    colQty: { width: 50, textAlign: "center" },
    colPrice: { width: 60, textAlign: "right" },
    colTax: { width: 40, textAlign: "center" },
    colAmount: { width: 70, textAlign: "right" },
    totalRow: {
        flexDirection: "row",
        backgroundColor: "#f9fafb",
        paddingVertical: 8,
        paddingHorizontal: 5,
        borderTop: "1 solid #ddd",
    },
    totalLabel: { flex: 1, textAlign: "right", fontWeight: "bold", fontSize: 9, color: "#1a1a2e", marginRight: 10 },
    totalValue: { width: 70, textAlign: "right", fontWeight: "bold", fontSize: 9, color: "#1a1a2e" },
    footer: {
        marginHorizontal: 20,
        marginTop: 10,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    footerSection: { width: "48%", border: "1 solid #ddd", borderRadius: 3 },
    footerContent: { padding: 8, fontSize: 7.5, color: "#555", lineHeight: 1.4 },
    sigArea: {
        marginTop: 30,
        marginHorizontal: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
    },
    sigBox: { width: 120, borderTop: "1 solid #ccc", textAlign: "center", paddingTop: 5, fontSize: 8, color: "#888" },
    pageFooter: {
        position: "absolute",
        bottom: 20,
        left: 0,
        right: 0,
        textAlign: "center",
        fontSize: 7,
        color: "#999",
    }
});

const ProformaInvoicePrintFormat = ({ data }) => {
    if (!data) return null;

    const totalAmount = data.items?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.topBar} />
                
                <View style={styles.header}>
                    <View style={styles.companyLeft}>
                        <Image src={Logo} style={styles.logo} />
                    </View>
                    <View style={styles.companyCenter}>
                        <Text style={styles.companyName}>{data.Branch?.branchName || "National Printers"}</Text>
                        <Text style={{ fontSize: 7, color: "#666", marginTop: 2 }}>{data.Branch?.address}</Text>
                    </View>
                    <View style={styles.companyRight}>
                        <View style={styles.companyRightRow}>
                            <Text style={styles.companyLabel}>GSTIN</Text>
                            <Text style={styles.companyColon}>:</Text>
                            <Text style={styles.companyValue}>{data.Branch?.gstNo || "N/A"}</Text>
                        </View>
                        <View style={styles.companyRightRow}>
                            <Text style={styles.companyLabel}>Mobile</Text>
                            <Text style={styles.companyColon}>:</Text>
                            <Text style={styles.companyValue}>{data.Branch?.contactMobile || "N/A"}</Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.titleBand}>PROFORMA INVOICE</Text>

                <View style={styles.metaRow}>
                    <View style={styles.metaPill}>
                        <Text style={styles.metaLabel}>Doc No:</Text>
                        <Text style={styles.metaValue}>{data.docId}</Text>
                    </View>
                    <View style={styles.metaPill}>
                        <Text style={styles.metaLabel}>Doc Date:</Text>
                        <Text style={styles.metaValue}>{moment(data.docDate).format('DD-MM-YYYY')}</Text>
                    </View>
                </View>

                <View style={styles.twoCol}>
                    <View style={[styles.colHalf, { borderRight: "1 solid #ddd" }]}>
                        <Text style={styles.sectionHeader}>BILL TO</Text>
                        <View style={styles.sectionBody}>
                            <Text style={styles.partyName}>{data.customer?.name}</Text>
                            <Text style={styles.partyAddr}>{data.customer?.address}</Text>
                            <View style={styles.partyRow}>
                                <Text style={styles.partyLabel}>GSTIN</Text>
                                <Text style={styles.partyValue}>: {data.customer?.gstNo || "N/A"}</Text>
                            </View>
                            <View style={styles.partyRow}>
                                <Text style={styles.partyLabel}>Contact</Text>
                                <Text style={styles.partyValue}>: {data.customer?.contactNumber || "N/A"}</Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.colHalf}>
                        <Text style={styles.sectionHeader}>DELIVERY DETAILS</Text>
                        <View style={styles.sectionBody}>
                            <View style={styles.partyRow}>
                                <Text style={styles.partyLabel}>Expected Date</Text>
                                <Text style={styles.partyValue}>: {moment(data.deliveryDate).format('DD-MM-YYYY')}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.colSno}>S.No</Text>
                        <Text style={styles.colDesc}>Product Description</Text>
                        <Text style={styles.colQty}>Qty</Text>
                        <Text style={styles.colPrice}>Price</Text>
                        <Text style={styles.colTax}>Tax %</Text>
                        <Text style={styles.colAmount}>Amount</Text>
                    </View>
                    {data.items?.map((item, index) => (
                        <View key={index} style={styles.tableRow}>
                            <Text style={styles.colSno}>{index + 1}</Text>
                            <View style={styles.colDesc}>
                                <Text style={{ fontWeight: "bold" }}>{item.StyleItem?.name || "N/A"}</Text>
                                <Text style={{ fontSize: 6.5, color: "#666", marginTop: 1 }}>
                                    {[
                                        item.Size?.name ? `Size: ${item.Size.name}` : "",
                                        item.Gsm?.name ? `GSM: ${item.Gsm.name}` : "",
                                        item.Uom?.name ? `UOM: ${item.Uom.name}` : ""
                                    ].filter(Boolean).join(" | ")}
                                </Text>
                            </View>
                            <Text style={styles.colQty}>{item.qty}</Text>
                            <Text style={styles.colPrice}>{item.price?.toFixed(2)}</Text>
                            <Text style={styles.colTax}>{item.taxPercent}%</Text>
                            <Text style={styles.colAmount}>{item.amount?.toFixed(2)}</Text>
                        </View>
                    ))}
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
                        <Text style={styles.totalValue}>{totalAmount.toFixed(2)}</Text>
                    </View>
                </View>

                <View style={styles.footer}>
                    <View style={styles.footerSection}>
                        <Text style={styles.sectionHeader}>TERMS & CONDITIONS</Text>
                        <View style={styles.footerContent}>
                            <Text>{data.termsAndCondition || "N/A"}</Text>
                        </View>
                    </View>
                    <View style={styles.footerSection}>
                        <Text style={styles.sectionHeader}>REMARKS</Text>
                        <View style={styles.footerContent}>
                            <Text>{data.remarks || "N/A"}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.sigArea}>
                    <Text style={styles.sigBox}>Customer Signature</Text>
                    <Text style={styles.sigBox}>Authorized Signatory</Text>
                </View>

                <Text style={styles.pageFooter} fixed>
                    Generated on {moment().format('DD-MM-YYYY HH:mm')}
                </Text>
            </Page>
        </Document>
    );
};

export default ProformaInvoicePrintFormat;
