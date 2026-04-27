import { useEffect, useState } from "react";
import { Loader } from "../../../Basic/components";
import {
    getDateFromDateTimeToDisplay,
} from "../../../Utils/helper";
import secureLocalStorage from "react-secure-storage";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { Tooltip } from "@mui/material";
import { useGetProformaInvoiceQuery } from "../../../redux/uniformService/ProformaInvoiceService";
import { Edit, Eye, Trash2 } from "lucide-react";

const ProformaInvoiceReport = ({
    onView,
    onEdit,
    onDelete,
    itemsPerPage = 10,
}) => {
    const branchId = secureLocalStorage.getItem(
        sessionStorage.getItem("sessionId") + "currentBranchId",
    );

    const [dataPerPage, setDataPerPage] = useState("10");
    const [serachDocNo, setSerachDocNo] = useState("");
    const [searchDocDate, setSearchDocDate] = useState("");
    const [searchCustomer, setSearchCustomer] = useState("");

    const [totalCount, setTotalCount] = useState(0);
    const [currentPageNumber, setCurrentPageNumber] = useState(1);

    const searchFields = {
        serachDocNo,
        searchDocDate,
        searchCustomer,
    };

    useEffect(() => {
        setCurrentPageNumber(1);
    }, [serachDocNo, searchDocDate, searchCustomer]);

    const {
        data: allData,
        isFetching,
        isLoading,
    } = useGetProformaInvoiceQuery({
        params: {
            branchId,
            ...searchFields,
            pagination: true,
            dataPerPage,
            pageNumber: currentPageNumber,
        },
    });

    useEffect(() => {
        if (allData?.totalCount) {
            setTotalCount(allData?.totalCount);
        }
    }, [allData, isLoading, isFetching]);

    const isLoadingIndicator = isLoading || isFetching;

    const totalPages = Math.ceil(totalCount / parseInt(dataPerPage));

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPageNumber(newPage);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white shadow-lg rounded-lg overflow-hidden border border-gray-100">
            <div className="overflow-x-auto flex-grow h-[65vh]">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-emerald-800 sticky top-0 z-10">
                        <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider w-16">S.No</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Doc No</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Order No</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Date</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider">Customer</th>
                            <th className="px-3 py-2 text-right text-xs font-semibold text-white uppercase tracking-wider">Amount</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold text-white uppercase tracking-wider w-24">Actions</th>
                        </tr>
                        <tr className="bg-emerald-50">
                            <th className="px-2 py-1"></th>
                            <th className="px-2 py-1">
                                <input
                                    type="text"
                                    className="w-full text-xs border border-gray-300 rounded px-1 py-0.5"
                                    placeholder="Search"
                                    value={serachDocNo}
                                    onChange={(e) => setSerachDocNo(e.target.value)}
                                />
                            </th>
                            <th className="px-2 py-1"></th>
                            <th className="px-2 py-1"></th>
                            <th className="px-2 py-1">
                                <input
                                    type="date"
                                    className="w-full text-xs border border-gray-300 rounded px-1 py-0.5"
                                    value={searchDocDate}
                                    onChange={(e) => setSearchDocDate(e.target.value)}
                                />
                            </th>
                            <th className="px-2 py-1">
                                <input
                                    type="text"
                                    className="w-full text-xs border border-gray-300 rounded px-1 py-0.5"
                                    placeholder="Search"
                                    value={searchCustomer}
                                    onChange={(e) => setSearchCustomer(e.target.value)}
                                />
                            </th>
                            <th className="px-2 py-1"></th>
                            <th className="px-2 py-1"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {isLoadingIndicator ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-4 text-center">
                                    <Loader />
                                </td>
                            </tr>
                        ) : allData?.data?.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-4 text-center text-gray-500 italic">
                                    No records found
                                </td>
                            </tr>
                        ) : (
                            allData?.data?.map((item, index) => {
                                const totalAmount = item.items?.reduce((sum, i) => sum + (i.amount || 0), 0) || 0;
                                return (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-3 py-2 text-xs text-gray-900">{(currentPageNumber - 1) * dataPerPage + index + 1}</td>
                                        <td className="px-3 py-2 text-xs font-medium text-indigo-600">{item.docId}</td>
                                        <td className="px-3 py-2 text-xs text-gray-700">{item.OrderEntry?.docId || "N/A"}</td>
                                        <td className="px-3 py-2 text-xs text-gray-600">{getDateFromDateTimeToDisplay(item.docDate)}</td>
                                        <td className="px-3 py-2 text-xs text-gray-800 font-medium">{item.customer?.name}</td>
                                        <td className="px-3 py-2 text-xs text-right text-gray-900 font-semibold">{totalAmount.toFixed(2)}</td>
                                        <td className="px-3 py-2 text-xs text-center space-x-2">
                                            <Tooltip title="View">
                                                <button onClick={() => onView(item.id)} className="text-blue-500 hover:text-blue-700">
                                                    <Eye size={16} />
                                                </button>
                                            </Tooltip>
                                            <Tooltip title="Edit">
                                                <button onClick={() => onEdit(item.id)} className="text-emerald-500 hover:text-emerald-700">
                                                    <Edit size={16} />
                                                </button>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <button onClick={() => onDelete(item.id)} className="text-red-500 hover:text-red-700">
                                                    <Trash2 size={16} />
                                                </button>
                                            </Tooltip>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 flex items-center justify-between sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                    <button
                        onClick={() => handlePageChange(currentPageNumber - 1)}
                        disabled={currentPageNumber === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => handlePageChange(currentPageNumber + 1)}
                        disabled={currentPageNumber === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs text-gray-700">
                            Showing <span className="font-medium">{(currentPageNumber - 1) * dataPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPageNumber * dataPerPage, totalCount)}</span> of <span className="font-medium">{totalCount}</span> results
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <select
                            value={dataPerPage}
                            onChange={(e) => {
                                setDataPerPage(e.target.value);
                                setCurrentPageNumber(1);
                            }}
                            className="text-xs border-gray-300 rounded shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        >
                            <option value="10">10 / page</option>
                            <option value="25">25 / page</option>
                            <option value="50">50 / page</option>
                        </select>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                                onClick={() => handlePageChange(currentPageNumber - 1)}
                                disabled={currentPageNumber === 1}
                                className="relative inline-flex items-center px-2 py-1 rounded-l-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            >
                                <FaChevronLeft className="h-3 w-3" />
                            </button>
                            <span className="relative inline-flex items-center px-4 py-1 border border-gray-300 bg-white text-xs font-medium text-gray-700">
                                {currentPageNumber} of {totalPages || 1}
                            </span>
                            <button
                                onClick={() => handlePageChange(currentPageNumber + 1)}
                                disabled={currentPageNumber === totalPages}
                                className="relative inline-flex items-center px-2 py-1 rounded-r-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            >
                                <FaChevronRight className="h-3 w-3" />
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProformaInvoiceReport;
