"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// let targetURLs: string[] = []; // 获取环境变量数据或默认值初始化目标URL数组
let targetURLs = process.env.DEEPLX_URLS
    ? process.env.DEEPLX_URLS.split(",")
    : ["https://api.deeplx.org"]; // 获取环境变量数据或默认值初始化目标URL数组
// const CACHE_UPDATE_INTERVAL = 1000 * 60 * 10; // 10 minutes
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true })); // 支持URL编码的请求体
// const updateTargetUrls = async () => {
//     const configUrls: string = process.env.TARGET_URLS || "";
//     console.log("Attempting to update target URLs from:", configUrls);
//     try {
//         if (configUrls) {
//             const response: AxiosResponse = await axios.get(configUrls);
//             // 确保响应数据是字符串且不为空
//             if (
//                 typeof response.data === "string" &&
//                 response.data.trim().length > 0
//             ) {
//                 targetURLs = response.data.split(",").map((url) => url.trim()); // 去除可能的空格
//                 console.log("Updated target URLs:", targetURLs);
//             }
//             return;
//         }
//         targetURLs = ["https://api.deeplx.org"];
//     } catch (err) {
//         console.error("Failed to update target URLs:", err);
//     }
// };
// updateTargetUrls(); // 初始化更新
// setInterval(updateTargetUrls, CACHE_UPDATE_INTERVAL); // 更新目标URL数组的定时器
app.all("*", async (req, res) => {
    console.log(req.method, req.path, req.body);
    const createRequestConfig = (targetURL) => ({
        method: req.method,
        url: `${targetURL}${req.path}`,
        // headers: { ...req.headers, host: new URL(targetURL).host },
        data: req.method !== "GET" ? req.body : null,
        timeout: 6000, // 加上请求超时
    });
    // 用于待会处理单个请求错误
    const makeRequest = async (config) => (0, axios_1.default)(config).catch((error) => {
        return Promise.reject(`请求到 ${config.url} 失败: ${error.message}`);
        // console.error(`Request to ${config.url} failed: ${error.message}`);
        // throw error;
    });
    try {
        const responses = await Promise.any(targetURLs.map((url) => makeRequest(createRequestConfig(url))));
        // 响应成功返回数据
        res.set({
            "Access-Control-Allow-Origin": "*",
            "Content-Type": responses.headers["content-type"] || "application/json",
        })
            .status(responses.status)
            .send(responses.data);
    }
    catch (error) {
        console.error("All requests failed", error);
        res.status(500).send({ error: "Service unavailable" });
    }
});
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
