import Foundation
import WebKit
import UIKit
import Photos
import CoreMotion

protocol OfflineWebControllerDelegate: AnyObject {
    func offlineWebDidFinishLoading()
    func offlineWeb(_ controller: OfflineWebController, didChangeBackground color: UIColor, dark: Bool)
}

/// 离线 WebView 控制器：只加载 shihai://localhost 下的 App Bundle 资源。
final class OfflineWebController: NSObject, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {

    weak var delegate: OfflineWebControllerDelegate?
    let webView: WKWebView

    private var didFinish = false
    private let motion = CMMotionManager()
    private var lastShake = Date.distantPast

    override init() {
        let config = WKWebViewConfiguration()
        config.setURLSchemeHandler(LocalSchemeHandler(), forURLScheme: LocalSchemeHandler.scheme)

        let controller = WKUserContentController()
        let kv = OfflineStore.shared.snapshotJavaScript()
        controller.addUserScript(WKUserScript(
            source: "window.__SHIHAI_KV__=\(kv);",
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        ))
        config.userContentController = controller

        let prefs = WKWebpagePreferences()
        prefs.allowsContentJavaScript = true
        config.defaultWebpagePreferences = prefs
        config.dataDetectorTypes = []
        config.allowsInlineMediaPlayback = true

        webView = WKWebView(frame: .zero, configuration: config)
        super.init()

        controller.add(self, name: "shihai")
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .automatic
        webView.backgroundColor = UIColor(red: 0.957, green: 0.945, blue: 0.910, alpha: 1)
        webView.scrollView.backgroundColor = webView.backgroundColor
        webView.isOpaque = true
        webView.allowsBackForwardNavigationGestures = false
    }

    deinit {
        motion.stopAccelerometerUpdates()
        webView.configuration.userContentController.removeScriptMessageHandler(forName: "shihai")
    }

    func load() {
        webView.load(URLRequest(url: LocalSchemeHandler.entryURL,
                                cachePolicy: .reloadIgnoringLocalCacheData,
                                timeoutInterval: 30))
        startMotion()
    }

    // MARK: WKNavigationDelegate

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) { finish() }
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { finish() }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { finish() }

    /// App 内只允许离线 scheme；用户主动点击的外链交给系统浏览器，WebView 自身零网络请求。
    func webView(_ webView: WKWebView,
                 decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.allow)
            return
        }
        let scheme = (url.scheme ?? "").lowercased()
        if scheme == LocalSchemeHandler.scheme || ["data", "blob", "about", "javascript"].contains(scheme) {
            decisionHandler(.allow)
        } else if scheme == "https" || scheme == "http" {
            DispatchQueue.main.async { UIApplication.shared.open(url, options: [:], completionHandler: nil) }
            decisionHandler(.cancel)
        } else {
            decisionHandler(.cancel)
        }
    }

    // MARK: WKUIDelegate

    func webView(_ webView: WKWebView,
                 runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo,
                 completionHandler: @escaping () -> Void) {
        guard let vc = Self.topViewController() else { completionHandler(); return }
        let alert = UIAlertController(title: "诗海", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "好", style: .default) { _ in completionHandler() })
        vc.present(alert, animated: true)
    }

    func webView(_ webView: WKWebView,
                 runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo,
                 completionHandler: @escaping (Bool) -> Void) {
        guard let vc = Self.topViewController() else { completionHandler(false); return }
        let alert = UIAlertController(title: "诗海", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "取消", style: .cancel) { _ in completionHandler(false) })
        alert.addAction(UIAlertAction(title: "确定", style: .default) { _ in completionHandler(true) })
        vc.present(alert, animated: true)
    }

    func webView(_ webView: WKWebView,
                 createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction,
                 windowFeatures: WKWindowFeatures) -> WKWebView? {
        if navigationAction.targetFrame == nil, let url = navigationAction.request.url {
            UIApplication.shared.open(url, options: [:], completionHandler: nil)
        }
        return nil
    }

    // MARK: WKScriptMessageHandler

    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any],
              let type = body["type"] as? String else { return }
        switch type {
        case "ready":
            finish()
        case "debug":
            if let msg = body["msg"] as? String { Self.appendDebug(msg) }
        case "kv-set":
            if let k = body["k"] as? String, let v = body["v"] as? String { OfflineStore.shared.set(v, for: k) }
        case "kv-remove":
            if let k = body["k"] as? String { OfflineStore.shared.remove(k) }
        case "kv-clear":
            OfflineStore.shared.clear()
        case "haptic":
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
        case "theme":
            if let hex = body["hex"] as? String { handleTheme(hex) }
        case "save-image":
            saveImage(body["dataURL"] as? String ?? "", filename: body["filename"] as? String ?? "诗海.png")
        case "share-file":
            shareFile(body["dataURL"] as? String ?? "", filename: body["filename"] as? String ?? "诗海.txt")
        default:
            break
        }
    }

    // MARK: Native capabilities

    private func finish() {
        guard !didFinish else { return }
        didFinish = true
        DispatchQueue.main.async { self.delegate?.offlineWebDidFinishLoading() }
    }

    private func handleTheme(_ hex: String) {
        guard let color = UIColor(hex: hex) else { return }
        var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
        guard color.getRed(&r, green: &g, blue: &b, alpha: &a) else { return }
        let dark = (0.299 * r + 0.587 * g + 0.114 * b) < 0.5
        DispatchQueue.main.async { self.delegate?.offlineWeb(self, didChangeBackground: color, dark: dark) }
    }

    private func saveImage(_ raw: String, filename: String) {
        guard let (data, _) = Self.decodeDataURL(raw), let image = UIImage(data: data) else {
            toast("卡片保存失败"); return
        }
        let write = {
            UIImageWriteToSavedPhotosAlbum(image, nil, nil, nil)
            self.toast("分享卡片已保存到相册")
        }
        let status = PHPhotoLibrary.authorizationStatus(for: .addOnly)
        if status == .authorized || status == .limited {
            write()
        } else {
            PHPhotoLibrary.requestAuthorization(for: .addOnly) { result in
                DispatchQueue.main.async {
                    if result == .authorized || result == .limited {
                        write()
                    } else {
                        self.toast("请在系统设置中允许访问相册")
                    }
                }
            }
        }
    }

    private func shareFile(_ raw: String, filename: String) {
        guard let (data, _) = Self.decodeDataURL(raw), !data.isEmpty else {
            toast("导出失败"); return
        }
        let safe = filename.replacingOccurrences(of: "/", with: "_")
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(safe)
        do {
            try data.write(to: url, options: .atomic)
        } catch {
            toast("导出失败"); return
        }
        guard let vc = Self.topViewController() else { return }
        let sheet = UIActivityViewController(activityItems: [url], applicationActivities: nil)
        sheet.popoverPresentationController?.sourceView = vc.view
        sheet.popoverPresentationController?.sourceRect = CGRect(
            x: vc.view.bounds.midX, y: vc.view.bounds.midY, width: 1, height: 1
        )
        sheet.popoverPresentationController?.permittedArrowDirections = []
        vc.present(sheet, animated: true)
    }

    private func toast(_ text: String) {
        let safe = text
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "'", with: "\\'")
        DispatchQueue.main.async {
            self.webView.evaluateJavaScript("window.toast && window.toast('\(safe)')", completionHandler: nil)
        }
    }

    private func startMotion() {
        guard motion.isAccelerometerAvailable else { return }
        motion.accelerometerUpdateInterval = 0.12
        motion.startAccelerometerUpdates(to: .main) { [weak self] data, _ in
            guard let self, let a = data?.acceleration else { return }
            let g = (a.x * a.x + a.y * a.y + a.z * a.z).squareRoot()
            if g > 2.4 && Date().timeIntervalSince(self.lastShake) > 2.0 {
                self.lastShake = Date()
                self.webView.evaluateJavaScript(
                    "window.ShihaiNative && window.ShihaiNative.fireShake && window.ShihaiNative.fireShake()",
                    completionHandler: nil
                )
            }
        }
    }

    // MARK: Helpers

    private static func decodeDataURL(_ raw: String) -> (Data, String)? {
        guard let comma = raw.firstIndex(of: ",") else { return nil }
        let meta = String(raw[raw.startIndex..<comma])
        let payload = String(raw[raw.index(after: comma)...])
        if meta.contains(";base64") {
            guard let data = Data(base64Encoded: payload, options: .ignoreUnknownCharacters) else { return nil }
            return (data, meta)
        }
        guard let text = payload.removingPercentEncoding, let data = text.data(using: .utf8) else { return nil }
        return (data, meta)
    }

    private static func appendDebug(_ message: String) {
        guard let dir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first else { return }
        let file = dir.appendingPathComponent("shihai-debug.log")
        let line = Date().description + " " + message + "\n"
        if let handle = try? FileHandle(forWritingTo: file) {
            handle.seekToEndOfFile()
            try? handle.write(contentsOf: Data(line.utf8))
            try? handle.close()
        } else {
            try? Data(line.utf8).write(to: file, options: .atomic)
        }
    }

    private static func topViewController() -> UIViewController? {
        guard let scene = UIApplication.shared.connectedScenes
            .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene,
              let root = scene.windows.first(where: { $0.isKeyWindow })?.rootViewController
        else { return nil }
        var vc = root
        while let presented = vc.presentedViewController { vc = presented }
        return vc
    }
}

extension UIColor {
    convenience init?(hex: String) {
        var s = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        if s.hasPrefix("#") { s.removeFirst() }
        guard s.count == 6, let value = UInt32(s, radix: 16) else { return nil }
        self.init(
            red: CGFloat((value >> 16) & 0xff) / 255,
            green: CGFloat((value >> 8) & 0xff) / 255,
            blue: CGFloat(value & 0xff) / 255,
            alpha: 1
        )
    }
}
