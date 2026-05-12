import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { dirname } from "path";

import {
  employees,
  states,
  countries,
  cities,
  departments,
  companies,
  branches,
  users,
  pages,
  roles,
  subscriptions,
  finYear,
  employeeCategories,
  pageGroup,
  party,
  partyCategories,
  productBrand,
  productCategory,
  product,
  purchaseBill,
  OpeningStock,
  stock,
  salesBill,
  purchaseReturn,
  salesReturn,
  payments,
  uom,
  style,
  styleItem,
  deliveryChallan,
  deliveryInvoice,
  color,
  taxTerm,
  taxTemplate,
  hsn,
  partyBranch,
  branchType,
  openingBalance,
  po,
  termsAndCondition,
  payTerm,
  location,
  purchaseInwardEntry,
  purchaseCancel,
  purchaseBillEntry,
  size,
  gsm,
  itemGroup,
  Sizetemplate,
  purchaseReport,
  approvalConfig,
  approvalMasterData,
  orderEntry,
  processMaster,
  processGroup,
  plateMaster,
  dieMaster,
  jobCard,
  board,
  proformaInvoice,
  productionalallocation,
} from "./src/routes/index.js";
import { setIo } from "./src/utils/notificationHelper.js";
import { socketMain } from "./src/sockets/socket.js";

const app = express();
// app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization",
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  );
  next();
});
app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.json());

const path = __dirname + "/client/dist/";

app.use(express.static(path));

app.get("/", function (req, res) {
  res.sendFile(path + "index.html");
});

BigInt.prototype["toJSON"] = function () {
  return parseInt(this.toString());
};

const apiRouter = express.Router();

apiRouter.use("/employees", employees);
apiRouter.use("/countries", countries);
apiRouter.use("/states", states);
apiRouter.use("/cities", cities);
apiRouter.use("/departments", departments);
apiRouter.use("/companies", companies);
apiRouter.use("/branches", branches);
apiRouter.use("/users", users);
apiRouter.use("/pages", pages);
apiRouter.use("/pageGroup", pageGroup);
apiRouter.use("/roles", roles);
apiRouter.use("/subscriptions", subscriptions);
apiRouter.use("/finYear", finYear);
apiRouter.use("/employeeCategories", employeeCategories);
apiRouter.use("/partyCategories", partyCategories);
apiRouter.use("/party", party);
apiRouter.use("/productBrand", productBrand);
apiRouter.use("/productCategory", productCategory);
apiRouter.use("/product", product);
apiRouter.use("/purchaseBill", purchaseBill);
apiRouter.use("/OpeningStock", OpeningStock);
apiRouter.use("/color", color);
apiRouter.use("/size", size);
apiRouter.use("/gsm", gsm);
apiRouter.use("/itemGroup", itemGroup);
apiRouter.use("/purchaseInwardEntry", purchaseInwardEntry);
apiRouter.use("/stock", stock);
apiRouter.use("/salesBill", salesBill);
apiRouter.use("/purchaseReturn", purchaseReturn);
apiRouter.use("/purchaseCancel", purchaseCancel);
apiRouter.use("/salesReturn", salesReturn);
apiRouter.use("/uom", uom);
apiRouter.use("/payments", payments);
apiRouter.use("/style", style);
apiRouter.use("/styleItem", styleItem);
apiRouter.use("/deliveryChallan", deliveryChallan);
apiRouter.use("/deliveryInvoice", deliveryInvoice);
apiRouter.use("/taxTerm", taxTerm);
apiRouter.use("/taxTemplate", taxTemplate);
apiRouter.use("/hsn", hsn);
apiRouter.use("/partyBranch", partyBranch);
apiRouter.use("/branchType", branchType);
apiRouter.use("/openingBalance", openingBalance);
apiRouter.use("/po", po);
apiRouter.use("/termsconditions", termsAndCondition);
apiRouter.use("/payTerm", payTerm);
apiRouter.use("/location", location);
apiRouter.use("/purchaseBillEntry", purchaseBillEntry);
apiRouter.use("/sizeTemplate", Sizetemplate);
apiRouter.use("/purchaseReport", purchaseReport);
apiRouter.use("/approval", approvalConfig);
apiRouter.use("/approvalMasterData", approvalMasterData);
apiRouter.use("/orderEntry", orderEntry);
apiRouter.use("/process", processMaster);
apiRouter.use("/processGroup", processGroup);
apiRouter.use("/plate", plateMaster);
apiRouter.use("/die", dieMaster);
apiRouter.use("/jobCard", jobCard);
apiRouter.use("/board", board);
apiRouter.use("/proformaInvoice", proformaInvoice);
apiRouter.use("/productionAllocation", productionalallocation);

apiRouter.get("/retreiveFile/:fileName", (req, res) => {
  const { fileName } = req.params;
  res.sendFile(__dirname + "/uploads/" + fileName);
});

app.use("/api", apiRouter);

const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
setIo(io);
io.on("connection", socketMain);

const PORT = process.env.PORT || 6900;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
