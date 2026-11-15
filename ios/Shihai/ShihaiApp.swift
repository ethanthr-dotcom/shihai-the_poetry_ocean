import UIKit

@main
final class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: "Default Configuration",
                                         sessionRole: connectingSceneSession.role)
        config.delegateClass = SceneDelegate.self
        return config
    }
}

final class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene,
               willConnectTo session: UISceneSession,
               options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }
        let window = UIWindow(windowScene: windowScene)
        window.rootViewController = RootViewController()
        window.makeKeyAndVisible()
        self.window = window
    }
}

final class RootViewController: UIViewController, OfflineWebControllerDelegate {
    private let web = OfflineWebController()
    private var splash: UIView?
    private var darkTheme = false

    override var preferredStatusBarStyle: UIStatusBarStyle {
        darkTheme ? .lightContent : .darkContent
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        let paper = UIColor(red: 0.957, green: 0.945, blue: 0.910, alpha: 1)
        view.backgroundColor = paper
        web.delegate = self

        let webView = web.webView
        webView.frame = view.bounds
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(webView)

        let overlay = makeSplash()
        overlay.frame = view.bounds
        overlay.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(overlay)
        splash = overlay

        web.load()
    }

    private func makeSplash() -> UIView {
        let v = UIView()
        v.backgroundColor = UIColor(red: 0.957, green: 0.945, blue: 0.910, alpha: 1)

        let title = UILabel()
        title.text = "詩 海"
        title.font = UIFont(name: "Songti SC", size: 46)
            ?? UIFont.systemFont(ofSize: 46, weight: .light)
        title.textColor = UIColor(red: 0.184, green: 0.165, blue: 0.141, alpha: 1)
        title.textAlignment = .center

        let rule = UIView()
        rule.backgroundColor = UIColor(red: 0.31, green: 0.37, blue: 0.29, alpha: 1)

        let subtitle = UILabel()
        subtitle.text = "掬古人之詩 · 養今時之心"
        subtitle.font = UIFont(name: "Songti SC", size: 15)
            ?? UIFont.systemFont(ofSize: 15)
        subtitle.textColor = UIColor(red: 0.46, green: 0.43, blue: 0.39, alpha: 1)
        subtitle.textAlignment = .center

        let stack = UIStackView(arrangedSubviews: [title, rule, subtitle])
        stack.axis = .vertical
        stack.alignment = .center
        stack.spacing = 22
        stack.translatesAutoresizingMaskIntoConstraints = false
        v.addSubview(stack)
        NSLayoutConstraint.activate([
            stack.centerXAnchor.constraint(equalTo: v.centerXAnchor),
            stack.centerYAnchor.constraint(equalTo: v.centerYAnchor),
            rule.widthAnchor.constraint(equalToConstant: 44),
            rule.heightAnchor.constraint(equalToConstant: 1)
        ])
        return v
    }

    // MARK: OfflineWebControllerDelegate

    func offlineWebDidFinishLoading() {
        guard let splash else { return }
        UIView.animate(withDuration: 0.35, animations: {
            splash.alpha = 0
        }, completion: { _ in
            splash.removeFromSuperview()
            self.splash = nil
        })
    }

    func offlineWeb(_ controller: OfflineWebController,
                    didChangeBackground color: UIColor, dark: Bool) {
        darkTheme = dark
        view.backgroundColor = color
        web.webView.backgroundColor = color
        web.webView.scrollView.backgroundColor = color
        setNeedsStatusBarAppearanceUpdate()
    }
}
