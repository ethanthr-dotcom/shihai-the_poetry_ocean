// 生成 App 图标：白底留白 + 缩小后的圆形印章 logo + 柔和投影，输出无 alpha 的 1024px PNG。
// 纯 CoreGraphics，不依赖 AppKit / NSApplication，可在命令行直接编译运行。
// 用法: make_appicon <源 PNG> <输出 PNG>
import Foundation
import CoreGraphics
import ImageIO

let args = CommandLine.arguments
guard args.count == 3 else {
    fputs("usage: make_appicon <src.png> <out.png>\n", stderr)
    exit(2)
}

let side = 1024
let logoSize: CGFloat = 660          // 印章直径，约占画布 64%
let shadowBlur: CGFloat = 30
let shadowAlpha: CGFloat = 0.20
let shadowOffset = CGSize(width: 0, height: -14)  // 位图上下文 y 向下，负值=阴影在下方

let colorSpace = CGColorSpaceCreateDeviceRGB()
let alphaLast = CGImageAlphaInfo.premultipliedLast.rawValue

guard
    let source = CGImageSourceCreateWithURL(URL(fileURLWithPath: args[1]) as CFURL, nil),
    let original = CGImageSourceCreateImageAtIndex(source, 0, nil)
else {
    fputs("cannot read source image\n", stderr)
    exit(1)
}

// 1) 把源图按圆形裁剪，得到边缘干净的圆形 logo（避免源图四角残留白块影响投影形状）
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

// 2) 不透明白底 + 带投影的 logo
guard let output = CGContext(
    data: nil, width: side, height: side,
    bitsPerComponent: 8, bytesPerRow: 0, space: colorSpace,
    bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue
) else { exit(1) }
output.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
output.fill(CGRect(x: 0, y: 0, width: side, height: side))

let rect = CGRect(
    x: (CGFloat(side) - logoSize) / 2,
    y: (CGFloat(side) - logoSize) / 2 - 10,
    width: logoSize, height: logoSize
)
output.saveGState()
output.setShadow(
    offset: shadowOffset, blur: shadowBlur,
    color: CGColor(gray: 0, alpha: shadowAlpha)
)
output.draw(logo, in: rect)
output.restoreGState()

guard let final = output.makeImage(),
      let destination = CGImageDestinationCreateWithURL(
          URL(fileURLWithPath: args[2]) as CFURL, "public.png" as CFString, 1, nil
      ) else { exit(1) }
CGImageDestinationAddImage(destination, final, nil)
guard CGImageDestinationFinalize(destination) else { exit(1) }
print("wrote \(args[2]) (1024x1024, no alpha)")
