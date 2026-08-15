// wx.request 的 Promise 封装
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: "GET",
      dataType: "json",
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(new Error("请求失败 (HTTP " + res.statusCode + ")"));
        }
      },
      fail: (err) => reject(new Error((err && err.errMsg) || "网络错误"))
    });
  });
}

module.exports = { fetchJson };
