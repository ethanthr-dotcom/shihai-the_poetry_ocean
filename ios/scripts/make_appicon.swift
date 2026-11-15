// 生成两套图标资源：
//   1) 传统 PNG 图标：白底留白 + 缩小的圆形印章 + 柔和投影（无 alpha）
//   2) Icon Composer 前景层：透明底、缩小印章、无投影/无背景（交系统渲染 Liquid Glass）
// 纯 CoreGraphics，不依赖 AppKit / NSApplication，可在命令行直接编译运行。
// 用法: make_appicon <源 PNG> <传统图标输出 PNG> <Icon 前景输出 PNG>
import Foundation
import CoreGraphics
import ImageIO

let args = CommandLine.arguments
guard args.count == 4 else {
    fputs("usage: make_appicon <src.png> <legacy.png> <foreground.png>\n", stderr)
    exit(2)
}

let side = 1024
let logoSize: CGFloat = 660          // 印章直径，约占画布 64%
let shadowBlur: CGFloat = 30
let shadowAlpha: CGFloat = 0.20
let shadowOffset = CGSize(width: 0, height: -14)  // 位图上下文 y 向下，负值=阴影在下方

let colorSpace = CGColorSpaceCreateDeviceRGB()
let alphaLast = CGImageAlphaInfo.premultipliedLast.rawValue

func writePNG(_ image: CGImage, to path: String) {
    guard let destination = CGImageDestinationCreateWithURL(
        URL(fileURLWithPath: path) as CFURL, "public.png" as CFString, 1, nil
    ) else { exit(1) }
    CGImageDestinationAddImage(destination, image, nil)
    guard CGImageDestinationFinalize(destination) else { exit(1) }
    print("wrote \(path)")
}

guard
    let source = CGImageSourceCreateWithURL(URL(fileURLWithPath: args[1]) as CFURL, nil),
    let original = CGImageSourceCreateImageAtIndex(source, 0, nil)
else {
    fputs("cannot read source image\n", stderr)
    exit(1)
}

// 1) 圆形裁剪，得到边缘干净的印章位图（带 alpha）
guard let logoContext = CGContext(
    data: nil, width: Int(logoSize), height: Int(logoSize),
    bitsPerComponent: 8, bytesPerRow: 0, space: colorSpace,
    bitmapInfo: alphaLast
) else { exit(1) }
logoContext.addEllipse(in: CGRect(x: 0, y: 0, width: logoSize, height: logoSize))
logoContext.clip()
let ratio = min(logoSize / CGFloat(original.width), logoSize / CGFloat(original.height))
let drawW = CGFloat(original.width) * ratio
let drawH = CGFloat(original.height) * ratio
logoContext.draw(original, in: CGRect(
    x: (logoSize - drawW) / 2, y: (logoSize - drawH) / 2,
    width: drawW, height: drawH
))
guard let logo = logoContext.makeImage() else { exit(1) }

let rect = CGRect(
    x: (CGFloat(side) - logoSize) / 2,
    y: (CGFloat(side) - logoSize) / 2 - 10,
    width: logoSize, height: logoSize
)

// 2) 传统图标：不透明白底 + 投影
guard let output = CGContext(
    data: nil, width: side, height: side,
    bitsPerComponent: 8, bytesPerRow: 0, space: colorSpace,
    bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue
) else { exit(1) }
output.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
output.fill(CGRect(x: 0, y: 0, width: side, height: side))
output.saveGState()
output.setShadow(offset: shadowOffset, blur: shadowBlur,
                 color: CGColor(gray: 0, alpha: shadowAlpha))
output.draw(logo, in: rect)
output.restoreGState()
guard let legacy = output.makeImage() else { exit(1) }
writePNG(legacy, to: args[2])

// 3) Icon Composer 前景层：透明底，不烘焙阴影与背景
guard let glassContext = CGContext(
    data: nil, width: side, height: side,
    bitsPerComponent: 8, bytesPerRow: 0, space: colorSpace,
    bitmapInfo: alphaLast
) else { exit(1) }
glassContext.draw(logo, in: rect)
guard let foreground = glassContext.makeImage() else { exit(1) }
writePNG(foreground, to: args[3])
