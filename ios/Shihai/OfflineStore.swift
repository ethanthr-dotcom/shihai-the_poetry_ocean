import Foundation

/// localStorage 的原生持久化兜底。
/// 若 WebKit 认为自定义 scheme 不是安全源（localStorage 抛异常），
/// shihai-native.js 会改用这里注入的键值快照，并把变更写回 UserDefaults。
final class OfflineStore {
    static let shared = OfflineStore()

    private let defaults: UserDefaults
    private let key = "SHIHAI_KV"

    private init() {
        defaults = UserDefaults(suiteName: "shihai.offline.storage") ?? .standard
    }

    /// 生成可直接注入 WKUserScript 的 JS 对象字面量
    func snapshotJavaScript() -> String {
        let dict = (defaults.dictionary(forKey: key) as? [String: String]) ?? [:]
        guard let data = try? JSONSerialization.data(withJSONObject: dict, options: []),
              let json = String(data: data, encoding: .utf8) else { return "{}" }
        return json
    }

    func set(_ value: String, for name: String) {
        var dict = (defaults.dictionary(forKey: key) as? [String: String]) ?? [:]
        dict[name] = value
        defaults.set(dict, forKey: key)
    }

    func remove(_ name: String) {
        var dict = (defaults.dictionary(forKey: key) as? [String: String]) ?? [:]
        dict.removeValue(forKey: name)
        defaults.set(dict, forKey: key)
    }

    func clear() {
        defaults.removeObject(forKey: key)
    }
}
