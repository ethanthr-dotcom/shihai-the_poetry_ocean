import Foundation
import WebKit

/// 把 shihai://localhost/... 映射到 .app 内嵌的 WebRoot 目录。
/// WKWebView 不会为这个 scheme 发起任何网络请求，所有响应都由本地文件合成。
final class LocalSchemeHandler: NSObject, WKURLSchemeHandler {

    static let scheme = "shihai"
    static let host = "localhost"
    static let entryURL = URL(string: "\(scheme)://\(host)/index.html")!

    private static let root: URL = {
        let base = Bundle.main.resourceURL ?? Bundle.main.bundleURL
        return base.appendingPathComponent("WebRoot", isDirectory: true)
    }()

    private static let mime: [String: String] = [
        "html": "text/html; charset=utf-8",
        "htm": "text/html; charset=utf-8",
        "js": "application/javascript; charset=utf-8",
        "json": "application/json; charset=utf-8",
        "css": "text/css; charset=utf-8",
        "svg": "image/svg+xml",
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "gif": "image/gif",
        "webp": "image/webp",
        "txt": "text/plain; charset=utf-8",
        "woff2": "font/woff2"
    ]

    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        guard let url = task.request.url else {
            task.didFailWithError(URLError(.badURL))
            return
        }
        var relative = url.path
        if relative.isEmpty || relative == "/" { relative = "/index.html" }
        // 防目录穿越：只保留安全路径片段
        let parts = relative
            .split(separator: "/")
            .map(String.init)
            .filter { !$0.isEmpty && $0 != "." && $0 != ".." }
        let name = parts.isEmpty ? "index.html" : parts.joined(separator: "/")
        let file = Self.root.appendingPathComponent(name)

        guard FileManager.default.fileExists(atPath: file.path),
              let data = try? Data(contentsOf: file, options: .mappedIfSafe) else {
            respond(task, url: url, status: 404, data: Data(), mime: "text/plain; charset=utf-8")
            return
        }
        let type = Self.mime[file.pathExtension.lowercased()] ?? "application/octet-stream"
        respond(task, url: url, status: 200, data: data, mime: type)
    }

    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {
        // 同步读取，无在途异步任务
    }

    private func respond(_ task: WKURLSchemeTask, url: URL, status: Int, data: Data, mime: String) {
        guard let response = HTTPURLResponse(
            url: url,
            statusCode: status,
            httpVersion: "HTTP/1.1",
            headerFields: [
                "Content-Type": mime,
                "Content-Length": String(data.count),
                "Cache-Control": "public, max-age=31536000, immutable",
                "Access-Control-Allow-Origin": "*",
                "X-Content-Source": "app-bundle"
            ]
        ) else {
            task.didFailWithError(URLError(.cannotCreateFile))
            return
        }
        task.didReceive(response)
        task.didReceive(data)
        task.didFinish()
    }
}
