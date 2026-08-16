// 诗海数据云函数：data/ 目录与函数一起打包部署（开发者工具右键「上传并部署：所有文件」）
// 数据以 gzip 压缩存放（*.json.gz）控制部署包体积，读取时即时解压并缓存
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const cache = new Map(); // 热实例内存缓存，重复读取零开销

exports.main = async (event) => {
  const name = String((event && event.file) || "");
  // 严格校验文件名：只允许 数字.json，杜绝路径穿越
  if (!/^\d{3}\.json$/.test(name) && name !== "index.json" && name !== "index-full.json" && name !== "search-index.json") {
    return { code: 400 };
  }
  if (cache.has(name)) return { code: 200, data: cache.get(name) };
  try {
    const gzPath = path.join(__dirname, "data", name + ".gz");
    const text = fs.existsSync(gzPath)
      ? zlib.gunzipSync(fs.readFileSync(gzPath)).toString("utf8")
      : fs.readFileSync(path.join(__dirname, "data", name), "utf8");
    const data = JSON.parse(text);
    cache.set(name, data);
    return { code: 200, data };
  } catch (e) {
    return { code: 404 };
  }
};
