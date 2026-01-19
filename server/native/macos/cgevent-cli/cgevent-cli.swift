import Foundation
import ApplicationServices

func click(x: Int, y: Int) -> Bool {
    let src = CGEventSource(stateID: .hidSystemState)
    let down = CGEvent(mouseEventSource: src, mouseType: .leftMouseDown, mouseCursorPosition: CGPoint(x: x, y: y), mouseButton: .left)
    let up = CGEvent(mouseEventSource: src, mouseType: .leftMouseUp, mouseCursorPosition: CGPoint(x: x, y: y), mouseButton: .left)
    down?.post(tap: .cghidEventTap)
    usleep(10000)
    up?.post(tap: .cghidEventTap)
    return down != nil && up != nil
}

func accesscheck() -> Bool {
    let key = kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String
    let opts = [key: false] as CFDictionary
    return AXIsProcessTrustedWithOptions(opts)
}

func typeText(_ text: String, perCharDelayMs: Int) -> Bool {
    for scalar in text.unicodeScalars {
        let src = CGEventSource(stateID: .hidSystemState)
        guard let evDown = CGEvent(keyboardEventSource: src, virtualKey: 0, keyDown: true) else { return false }
        var ch = [UniChar(scalar.value)]
        evDown.keyboardSetUnicodeString(stringLength: 1, unicodeString: &ch)
        evDown.post(tap: .cghidEventTap)
        usleep(useconds_t(max(1, perCharDelayMs)) * 1000)
        guard let evUp = CGEvent(keyboardEventSource: src, virtualKey: 0, keyDown: false) else { return false }
        evUp.keyboardSetUnicodeString(stringLength: 1, unicodeString: &ch)
        evUp.post(tap: .cghidEventTap)
        usleep(5000)
    }
    return true
}

func flags(for keys: [String]) -> CGEventFlags {
    var f: CGEventFlags = []
    for k in keys.map({ $0.lowercased() }) {
        if k == "cmd" || k == "command" || k == "meta" { f.insert(.maskCommand) }
        else if k == "alt" || k == "option" { f.insert(.maskAlternate) }
        else if k == "ctrl" || k == "control" { f.insert(.maskControl) }
        else if k == "shift" { f.insert(.maskShift) }
        else if k == "fn" { f.insert(.maskSecondaryFn) }
    }
    return f
}

func keycode(for key: String) -> UInt16? {
    let m: [String:Int] = [
        "a": 0x00, "s": 0x01, "d": 0x02, "f": 0x03, "h": 0x04, "g": 0x05, "z": 0x06, "x": 0x07, "c": 0x08, "v": 0x09,
        "b": 0x0B, "q": 0x0C, "w": 0x0D, "e": 0x0E, "r": 0x0F, "y": 0x10, "t": 0x11, "1": 0x12, "2": 0x13, "3": 0x14,
        "4": 0x15, "6": 0x16, "5": 0x17, "=": 0x18, "9": 0x19, "7": 0x1A, "-": 0x1B, "8": 0x1C, "0": 0x1D, "]": 0x1E,
        "o": 0x1F, "u": 0x20, "[": 0x21, "i": 0x22, "p": 0x23, "return": 0x24, "l": 0x25, "j": 0x26, "'": 0x27, "k": 0x28, ";": 0x29,
        "\\": 0x2A, ",": 0x2B, "/": 0x2C, "n": 0x2D, "m": 0x2E, ".": 0x2F, "tab": 0x30, "space": 0x31, "`": 0x32,
        "delete": 0x33, "escape": 0x35, "command": 0x37, "shift": 0x38, "capslock": 0x39, "option": 0x3A, "control": 0x3B,
        "rightshift": 0x3C, "rightoption": 0x3D, "rightcontrol": 0x3E, "f17": 0x40, "volumeup": 0x48, "volumedown": 0x49,
        "mute": 0x4A, "f18": 0x4F, "f19": 0x50, "f20": 0x5A, "f5": 0x60, "f6": 0x61, "f7": 0x62, "f3": 0x63,
        "f8": 0x64, "f9": 0x65, "f11": 0x67, "f13": 0x69, "f16": 0x6A, "f14": 0x6B, "f10": 0x6D, "f12": 0x6F,
        "f15": 0x71, "help": 0x72, "home": 0x73, "pageup": 0x74, "forwarddelete": 0x75, "f4": 0x76, "end": 0x77,
        "f2": 0x78, "pagedown": 0x79, "f1": 0x7A, "left": 0x7B, "right": 0x7C, "down": 0x7D, "up": 0x7E
    ]
    let k = key.lowercased()
    if let v = m[k] { return UInt16(v) }
    return nil
}

func keyStateList(_ list: String) -> String {
    let tokens = list.split(separator: ",").map { String($0).trimmingCharacters(in: .whitespacesAndNewlines).lowercased() }
    var out: [String] = []
    for t in tokens {
        let code: UInt16?
        switch t {
        case "ctrl", "control": code = 0x3B // left control
        case "alt", "option": code = 0x3A // left option
        default: code = keycode(for: t)
        }
        if let c = code {
            let pressed = CGEventSource.keyState(.hidSystemState, key: c)
            out.append(pressed ? "true" : "false")
        } else {
            out.append("false")
        }
    }
    return out.joined(separator: ",")
}

func hotkey(_ keys: [String]) -> Bool {
    let mods = keys.filter { $0.lowercased() == "cmd" || $0.lowercased() == "command" || $0.lowercased() == "meta" || $0.lowercased() == "alt" || $0.lowercased() == "option" || $0.lowercased() == "ctrl" || $0.lowercased() == "control" || $0.lowercased() == "shift" || $0.lowercased() == "fn" }
    let main = keys.first { k in
        let l = k.lowercased()
        return l != "cmd" && l != "command" && l != "meta" && l != "alt" && l != "option" && l != "ctrl" && l != "control" && l != "shift" && l != "fn"
    }
    guard let m = main, let code = keycode(for: m) else { return false }
    let src = CGEventSource(stateID: .hidSystemState)
    guard let down = CGEvent(keyboardEventSource: src, virtualKey: code, keyDown: true) else { return false }
    down.flags = flags(for: mods)
    down.post(tap: .cghidEventTap)
    usleep(15000)
    guard let up = CGEvent(keyboardEventSource: src, virtualKey: code, keyDown: false) else { return false }
    up.flags = flags(for: mods)
    up.post(tap: .cghidEventTap)
    return true
}

func mousePath(_ points: [(Int, Int, Int)]) -> Bool {
    for (x, y, d) in points {
        let src = CGEventSource(stateID: .hidSystemState)
        let move = CGEvent(mouseEventSource: src, mouseType: .mouseMoved, mouseCursorPosition: CGPoint(x: x, y: y), mouseButton: .left)
        move?.post(tap: .cghidEventTap)
        usleep(useconds_t(max(0, d)) * 1000)
    }
    return true
}

func clickPid(x: Int, y: Int, pid: pid_t) -> Bool {
    let src = CGEventSource(stateID: .hidSystemState)
    guard let down = CGEvent(mouseEventSource: src, mouseType: .leftMouseDown, mouseCursorPosition: CGPoint(x: x, y: y), mouseButton: .left) else { return false }
    guard let up = CGEvent(mouseEventSource: src, mouseType: .leftMouseUp, mouseCursorPosition: CGPoint(x: x, y: y), mouseButton: .left) else { return false }
    down.postToPid(pid)
    usleep(10000)
    up.postToPid(pid)
    return true
}

func typeTextPid(_ text: String, perCharDelayMs: Int, pid: pid_t) -> Bool {
    for scalar in text.unicodeScalars {
        let src = CGEventSource(stateID: .hidSystemState)
        guard let evDown = CGEvent(keyboardEventSource: src, virtualKey: 0, keyDown: true) else { return false }
        var ch = [UniChar(scalar.value)]
        evDown.keyboardSetUnicodeString(stringLength: 1, unicodeString: &ch)
        evDown.postToPid(pid)
        usleep(useconds_t(max(1, perCharDelayMs)) * 1000)
        guard let evUp = CGEvent(keyboardEventSource: src, virtualKey: 0, keyDown: false) else { return false }
        evUp.keyboardSetUnicodeString(stringLength: 1, unicodeString: &ch)
        evUp.postToPid(pid)
        usleep(5000)
    }
    return true
}

func hotkeyPid(_ keys: [String], pid: pid_t) -> Bool {
    let mods = keys.filter { $0.lowercased() == "cmd" || $0.lowercased() == "command" || $0.lowercased() == "meta" || $0.lowercased() == "alt" || $0.lowercased() == "option" || $0.lowercased() == "ctrl" || $0.lowercased() == "control" || $0.lowercased() == "shift" || $0.lowercased() == "fn" }
    let main = keys.first { k in
        let l = k.lowercased()
        return l != "cmd" && l != "command" && l != "meta" && l != "alt" && l != "option" && l != "ctrl" && l != "control" && l != "shift" && l != "fn"
    }
    guard let m = main, let code = keycode(for: m) else { return false }
    let src = CGEventSource(stateID: .hidSystemState)
    guard let down = CGEvent(keyboardEventSource: src, virtualKey: code, keyDown: true) else { return false }
    down.flags = flags(for: mods)
    down.postToPid(pid)
    usleep(15000)
    guard let up = CGEvent(keyboardEventSource: src, virtualKey: code, keyDown: false) else { return false }
    up.flags = flags(for: mods)
    up.postToPid(pid)
    return true
}

func mousePathPid(_ points: [(Int, Int, Int)], pid: pid_t) -> Bool {
    for (x, y, d) in points {
        let src = CGEventSource(stateID: .hidSystemState)
        let move = CGEvent(mouseEventSource: src, mouseType: .mouseMoved, mouseCursorPosition: CGPoint(x: x, y: y), mouseButton: .left)
        if let mv = move { mv.postToPid(pid) }
        usleep(useconds_t(max(0, d)) * 1000)
    }
    return true
}

func winlist(_ filter: String?) {
    let opts: CGWindowListOption = [CGWindowListOption.optionAll, CGWindowListOption.excludeDesktopElements]
    guard let info = CGWindowListCopyWindowInfo(opts, kCGNullWindowID) as? [[String: Any]] else {
        print("[]")
        return
    }
    var out: [[String: Any]] = []
    for w in info {
        let ownerName = (w[kCGWindowOwnerName as String] as? String) ?? ""
        let ownerPID = (w[kCGWindowOwnerPID as String] as? Int) ?? 0
        let windowNumber = (w[kCGWindowNumber as String] as? Int) ?? 0
        let name = (w[kCGWindowName as String] as? String) ?? ""
        let layer = (w[kCGWindowLayer as String] as? Int) ?? 0
        var bx: Int = 0, by: Int = 0, bw: Int = 0, bh: Int = 0
        if let bounds = w[kCGWindowBounds as String] as? [String: Any] {
            bx = (bounds["X"] as? NSNumber)?.intValue ?? 0
            by = (bounds["Y"] as? NSNumber)?.intValue ?? 0
            bw = (bounds["Width"] as? NSNumber)?.intValue ?? 0
            bh = (bounds["Height"] as? NSNumber)?.intValue ?? 0
        }
        if let f = filter, !f.isEmpty {
            if !ownerName.lowercased().contains(f.lowercased()) && !name.lowercased().contains(f.lowercased()) { continue }
        }
        out.append([
            "windowNumber": windowNumber,
            "ownerName": ownerName,
            "ownerPID": ownerPID,
            "name": name,
            "layer": layer,
            "bounds": ["x": bx, "y": by, "w": bw, "h": bh]
        ])
    }
    if let data = try? JSONSerialization.data(withJSONObject: out, options: []) {
        if let s = String(data: data, encoding: .utf8) { print(s) }
    } else {
        print("[]")
    }
}

let args = CommandLine.arguments
if args.count < 2 { exit(1) }
let cmd = args[1]
if cmd == "click" {
    if args.count < 4 { exit(2) }
    guard let x = Int(args[2]), let y = Int(args[3]) else { exit(3) }
    let ok = click(x: x, y: y)
    exit(ok ? 0 : 10)
} else if cmd == "type" {
    if args.count < 3 { exit(2) }
    let text = args[2]
    let delay = args.count >= 4 ? Int(args[3]) ?? 80 : 80
    let ok = typeText(text, perCharDelayMs: delay)
    exit(ok ? 0 : 11)
} else if cmd == "hotkey" {
    if args.count < 3 { exit(2) }
    let keys = args[2].split(separator: "+").map { String($0) }
    let ok = hotkey(keys)
    exit(ok ? 0 : 12)
} else if cmd == "mousepath" {
    if args.count < 3 { exit(2) }
    let segments = args[2].split(separator: ";")
    var pts: [(Int, Int, Int)] = []
    for seg in segments {
        let parts = seg.split(separator: ",")
        if parts.count >= 2 {
            let x = Int(parts[0]) ?? 0
            let y = Int(parts[1]) ?? 0
            let d = parts.count >= 3 ? Int(parts[2]) ?? 8 : 8
            pts.append((x, y, d))
        }
    }
    let ok = mousePath(pts)
    exit(ok ? 0 : 13)
} else if cmd == "clickpid" {
    if args.count < 5 { exit(2) }
    guard let x = Int(args[2]), let y = Int(args[3]), let pid = Int32(args[4]) else { exit(3) }
    let ok = clickPid(x: x, y: y, pid: pid_t(pid))
    exit(ok ? 0 : 20)
} else if cmd == "typepid" {
    if args.count < 4 { exit(2) }
    let text = args[2]
    let comps = args.count >= 5 ? (Int(args[3]) ?? 80, Int32(args[4]) ?? 0) : (80, Int32(args[3]) ?? 0)
    let delay = comps.0
    let pid = comps.1
    let ok = typeTextPid(text, perCharDelayMs: delay, pid: pid_t(pid))
    exit(ok ? 0 : 21)
} else if cmd == "hotkeypid" {
    if args.count < 4 { exit(2) }
    let keys = args[2].split(separator: "+").map { String($0) }
    guard let pid = Int32(args[3]) else { exit(3) }
    let ok = hotkeyPid(keys, pid: pid_t(pid))
    exit(ok ? 0 : 22)
} else if cmd == "mousepathpid" {
    if args.count < 4 { exit(2) }
    let segments = args[2].split(separator: ";")
    var pts: [(Int, Int, Int)] = []
    for seg in segments {
        let parts = seg.split(separator: ",")
        if parts.count >= 2 {
            let x = Int(parts[0]) ?? 0
            let y = Int(parts[1]) ?? 0
            let d = parts.count >= 3 ? Int(parts[2]) ?? 8 : 8
            pts.append((x, y, d))
        }
    }
    guard let pid = Int32(args[3]) else { exit(3) }
    let ok = mousePathPid(pts, pid: pid_t(pid))
    exit(ok ? 0 : 23)
} else if cmd == "winlist" {
    let filter = args.count >= 3 ? args[2] : nil
    winlist(filter)
    exit(0)
} else if cmd == "accesscheck" {
    let ok = accesscheck()
    print(ok ? "true" : "false")
    exit(ok ? 0 : 1)
} else if cmd == "keystate" {
    if args.count < 3 { exit(2) }
    let list = args[2]
    let result = keyStateList(list)
    print(result)
    exit(0)
} else {
    exit(99)
}
