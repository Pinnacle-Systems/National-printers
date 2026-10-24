export const INITIAL_PAGE_NUMBER = 1;
export const DATA_PER_PAGE = 30;
const BASE_URL = process.env.REACT_APP_SERVER_URL;

export const IMAGE_UPLOAD_URL = BASE_URL + 'retreiveFile/' 

export function getImageUrlPath(fileName) {
    if (!fileName) return "";
    if (fileName.startsWith("http://") || fileName.startsWith("https://") || fileName.startsWith("data:")) {
        return fileName;
    }
    const cleanFileName = fileName.replace(/^uploads\//, "");
    return `${IMAGE_UPLOAD_URL}${cleanFileName}`;
}
