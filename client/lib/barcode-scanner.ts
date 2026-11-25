// ระบบถอดรหัสบาร์โค้ดแบบ Real-time จากกล้องวิดีโอ
// รองรับทั้ง Native BarcodeDetector API (Android Chrome / Edge / macOS)
// และ Pure-JS 1D Scanline Decoder (Code 128, Code 39, EAN-13) สำหรับ iOS Safari และเบราว์เซอร์ทั่วไป

const SUPPORTED_FORMATS = [
    "code_128",
    "code_39",
    "code_93",
    "codabar",
    "ean_13",
    "ean_8",
    "itf",
    "upc_a",
    "upc_e",
    "qr_code",
]

let nativeDetectorPromise: Promise<any | null> | null = null

async function getNativeDetector(): Promise<any | null> {
    if (typeof window === "undefined") return null
    const BD = (window as any).BarcodeDetector
    if (!BD) return null

    if (!nativeDetectorPromise) {
        nativeDetectorPromise = (async () => {
            try {
                if (typeof BD.getSupportedFormats === "function") {
                    const supported: string[] = await BD.getSupportedFormats()
                    const formats = SUPPORTED_FORMATS.filter((f) => supported.includes(f))
                    return new BD(formats.length > 0 ? { formats } : undefined)
                }
                return new BD({ formats: SUPPORTED_FORMATS })
            } catch {
                try {
                    return new BD()
                } catch {
                    return null
                }
            }
        })()
    }
    return nativeDetectorPromise
}

// ==================== CODE 128 TABLE ====================
// 107 รูปแบบมาตรฐานของ Code 128 (กว้างรวม 11 โมดูล สำหรับ 0..105 และ 13 โมดูลสำหรับ Stop=106)
const CODE128_PATTERNS = [
    "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
    "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
    "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
    "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
    "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
    "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
    "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
    "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
    "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
    "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
    "114131", "311141", "411131", "211412", "211214", "211232",
]
const CODE128_MAP = new Map<string, number>(CODE128_PATTERNS.map((p, idx) => [p, idx]))

// ==================== CODE 39 TABLE ====================
const CODE39_CHARS: Record<string, string> = {
    "000110100": "0", "100100001": "1", "001100001": "2", "101100000": "3",
    "000110001": "4", "100110000": "5", "001110000": "6", "000100101": "7",
    "100100100": "8", "001100100": "9", "100001001": "A", "001001001": "B",
    "101001000": "C", "000011001": "D", "100011000": "E", "001011000": "F",
    "000001101": "G", "100001100": "H", "001001100": "I", "000011100": "J",
    "100000011": "K", "001000011": "L", "101000010": "M", "000010011": "N",
    "100010010": "O", "001010010": "P", "000000111": "Q", "100000110": "R",
    "001000110": "S", "000010110": "T", "110000001": "U", "011000001": "V",
    "111000000": "W", "010010001": "X", "110010000": "Y", "011010000": "Z",
    "010000101": "-", "110000100": ".", "011000100": " ", "010101000": "$",
    "010100010": "/", "010001010": "+", "000101010": "%", "010010100": "*",
}

// ==================== EAN-13 TABLE ====================
const EAN_LEFT_MAP: Record<string, { digit: string; parity: "L" | "G" }> = {
    "0001101": { digit: "0", parity: "L" }, "0100111": { digit: "0", parity: "G" },
    "0011001": { digit: "1", parity: "L" }, "0110011": { digit: "1", parity: "G" },
    "0010011": { digit: "2", parity: "L" }, "0011011": { digit: "2", parity: "G" },
    "0111101": { digit: "3", parity: "L" }, "0100001": { digit: "3", parity: "G" },
    "0100011": { digit: "4", parity: "L" }, "0011101": { digit: "4", parity: "G" },
    "0110001": { digit: "5", parity: "L" }, "0111001": { digit: "5", parity: "G" },
    "0101111": { digit: "6", parity: "L" }, "0000101": { digit: "6", parity: "G" },
    "0111011": { digit: "7", parity: "L" }, "0010001": { digit: "7", parity: "G" },
    "0110111": { digit: "8", parity: "L" }, "0001001": { digit: "8", parity: "G" },
    "0001011": { digit: "9", parity: "L" }, "0010111": { digit: "9", parity: "G" },
}
const EAN_RIGHT_MAP: Record<string, string> = {
    "1110010": "0", "1100110": "1", "1101100": "2", "1000010": "3", "1011100": "4",
    "1001110": "5", "1010000": "6", "1000100": "7", "1001000": "8", "1110100": "9",
}
const EAN_PARITY_FIRST_DIGIT: Record<string, string> = {
    "LLLLLL": "0", "LLGLGG": "1", "LLGGLG": "2", "LLGGGL": "3", "LGLLGG": "4",
    "LGGLLG": "5", "LGGGLL": "6", "LGLGLG": "7", "LGLGGL": "8", "LGGLGL": "9",
}

// แปลงแถวพิกเซลเป็น Run-Length ของแถบมืด (1) และสว่าง (0) ด้วย Adaptive Local Threshold
function extractRunsFromGrayRow(gray: Uint8Array): { firstIsBar: boolean; runs: number[] } {
    const len = gray.length
    const windowRadius = 16
    const binary = new Uint8Array(len)

    let runningSum = 0
    let count = 0
    for (let i = 0; i < Math.min(len, windowRadius); i++) {
        runningSum += gray[i]
        count++
    }

    for (let i = 0; i < len; i++) {
        const addIdx = i + windowRadius
        if (addIdx < len) {
            runningSum += gray[addIdx]
            count++
        }
        const remIdx = i - windowRadius - 1
        if (remIdx >= 0) {
            runningSum -= gray[remIdx]
            count--
        }
        const localMean = runningSum / count
        binary[i] = gray[i] < localMean - 6 ? 1 : 0
    }

    const runs: number[] = []
    let current = binary[0]
    let runLen = 1
    for (let i = 1; i < len; i++) {
        if (binary[i] === current) {
            runLen++
        } else {
            runs.push(runLen)
            current = binary[i]
            runLen = 1
        }
    }
    runs.push(runLen)

    return { firstIsBar: binary[0] === 1, runs }
}

function quantizeElements(runs: number[], offset: number, count: number, totalModules: number): string | null {
    let totalWidth = 0
    for (let i = 0; i < count; i++) {
        totalWidth += runs[offset + i]
    }
    if (totalWidth < totalModules) return null

    const unit = totalWidth / totalModules
    const widths: number[] = []
    let sumQ = 0
    for (let i = 0; i < count; i++) {
        const q = Math.max(1, Math.min(4, Math.round(runs[offset + i] / unit)))
        widths.push(q)
        sumQ += q
    }
    if (sumQ !== totalModules) return null
    return widths.join("")
}

function tryDecodeCode128(runs: number[], firstIsBar: boolean): string | null {
    const startIdx = firstIsBar ? 0 : 1
    for (let i = startIdx; i + 13 <= runs.length; i += 2) {
        const pat = quantizeElements(runs, i, 6, 11)
        if (!pat) continue
        const startCode = CODE128_MAP.get(pat)
        if (startCode !== 103 && startCode !== 104 && startCode !== 105) continue

        // ตรวจสอบ Quiet Zone ด้านซ้าย (ถ้ามี)
        if (i > 0) {
            const modulePx = (runs[i] + runs[i + 1] + runs[i + 2] + runs[i + 3] + runs[i + 4] + runs[i + 5]) / 11
            if (runs[i - 1] < modulePx * 5) continue
        }

        const codes: number[] = []
        let pos = i + 6
        let foundStop = false

        while (pos + 6 <= runs.length && codes.length < 30) {
            // เช็ค Stop Pattern (7 elements, 13 modules = 2331112)
            if (pos + 7 <= runs.length) {
                const stopPat = quantizeElements(runs, pos, 7, 13)
                if (stopPat === "2331112") {
                    foundStop = true
                    break
                }
            }
            const symPat = quantizeElements(runs, pos, 6, 11)
            if (!symPat) break
            const sym = CODE128_MAP.get(symPat)
            if (sym === undefined) break
            codes.push(sym)
            pos += 6
        }

        if (!foundStop || codes.length < 2) continue

        const checkSymbol = codes[codes.length - 1]
        const dataCodes = codes.slice(0, -1)

        let checksum = startCode
        for (let k = 0; k < dataCodes.length; k++) {
            checksum += dataCodes[k] * (k + 1)
        }
        if (checksum % 103 !== checkSymbol) continue

        // แปลค่าตาม Subset A / B / C
        let subset: "A" | "B" | "C" = startCode === 103 ? "A" : startCode === 104 ? "B" : "C"
        let out = ""
        for (let k = 0; k < dataCodes.length; k++) {
            const c = dataCodes[k]
            if (subset === "C") {
                if (c < 100) {
                    out += String(c).padStart(2, "0")
                } else if (c === 100) {
                    subset = "B"
                } else if (c === 101) {
                    subset = "A"
                }
            } else if (subset === "B") {
                if (c < 95) {
                    out += String.fromCharCode(32 + c)
                } else if (c === 99) {
                    subset = "C"
                } else if (c === 101) {
                    subset = "A"
                }
            } else {
                if (c < 64) {
                    out += String.fromCharCode(32 + c)
                } else if (c < 96) {
                    out += String.fromCharCode(c - 64)
                } else if (c === 99) {
                    subset = "C"
                } else if (c === 100) {
                    subset = "B"
                }
            }
        }

        const trimmed = out.trim()
        if (trimmed.length >= 1) return trimmed
    }
    return null
}

function classifyCode39Symbol(runs: number[], offset: number): string | null {
    const slice = runs.slice(offset, offset + 9)
    const indexed = slice.map((w, idx) => ({ w, idx })).sort((a, b) => b.w - a.w)
    // ต้องมีกว้าง 3 แถบ และแคบ 6 แถบ โดยแถบกว้างต้องกว้างกว่าแถบแคบอย่างชัดเจน
    if (indexed[2].w <= indexed[3].w * 1.35) return null
    if (indexed[0].w > indexed[2].w * 2.5) return null

    const wideSet = new Set([indexed[0].idx, indexed[1].idx, indexed[2].idx])
    let bits = ""
    for (let i = 0; i < 9; i++) {
        bits += wideSet.has(i) ? "1" : "0"
    }
    return CODE39_CHARS[bits] || null
}

function tryDecodeCode39(runs: number[], firstIsBar: boolean): string | null {
    const startIdx = firstIsBar ? 0 : 1
    for (let i = startIdx; i + 29 <= runs.length; i += 2) {
        if (classifyCode39Symbol(runs, i) !== "*") continue

        let out = ""
        let pos = i + 10
        let valid = false

        while (pos + 9 <= runs.length && out.length <= 24) {
            const ch = classifyCode39Symbol(runs, pos)
            if (!ch) break
            if (ch === "*") {
                valid = out.length >= 1
                break
            }
            out += ch
            pos += 10
        }

        if (valid) {
            const trimmed = out.trim()
            if (trimmed.length >= 1) return trimmed
        }
    }
    return null
}

function tryDecodeEAN13(runs: number[], firstIsBar: boolean): string | null {
    const startIdx = firstIsBar ? 0 : 1
    // EAN-13 มีทั้งหมด 59 แถบ (3 + 24 + 5 + 24 + 3)
    for (let i = startIdx; i + 59 <= runs.length; i += 2) {
        let totalWidth = 0
        for (let k = 0; k < 59; k++) totalWidth += runs[i + k]
        const unit = totalWidth / 95
        if (unit < 1) continue

        // ตรวจสอบ Guard ซ้าย (1,1,1), กลาง (1,1,1,1,1), ขวา (1,1,1)
        const checkGuard = (idx: number, count: number) => {
            for (let g = 0; g < count; g++) {
                const ratio = runs[idx + g] / unit
                if (ratio < 0.45 || ratio > 1.75) return false
            }
            return true
        }
        if (!checkGuard(i, 3) || !checkGuard(i + 27, 5) || !checkGuard(i + 56, 3)) continue

        let parities = ""
        let digits = ""
        let ok = true

        // 6 ตัวซ้าย
        for (let d = 0; d < 6; d++) {
            const off = i + 3 + d * 4
            const q = quantizeElements(runs, off, 4, 7)
            if (!q) { ok = false; break }
            // เริ่มจากช่องว่าง (0) สลับแถบดำ (1): 0, 1, 0, 1
            let bits = ""
            for (let e = 0; e < 4; e++) {
                bits += (e % 2 === 0 ? "0" : "1").repeat(Number(q[e]))
            }
            const match = EAN_LEFT_MAP[bits]
            if (!match) { ok = false; break }
            parities += match.parity
            digits += match.digit
        }
        if (!ok) continue

        const firstDigit = EAN_PARITY_FIRST_DIGIT[parities]
        if (!firstDigit) continue

        // 6 ตัวขวา
        for (let d = 0; d < 6; d++) {
            const off = i + 32 + d * 4
            const q = quantizeElements(runs, off, 4, 7)
            if (!q) { ok = false; break }
            // เริ่มจากแถบดำ (1) สลับช่องว่าง (0): 1, 0, 1, 0
            let bits = ""
            for (let e = 0; e < 4; e++) {
                bits += (e % 2 === 0 ? "1" : "0").repeat(Number(q[e]))
            }
            const digit = EAN_RIGHT_MAP[bits]
            if (!digit) { ok = false; break }
            digits += digit
        }
        if (!ok) continue

        const full = firstDigit + digits
        // ตรวจ Checksum Modulo 10
        let sum = 0
        for (let k = 0; k < 12; k++) {
            sum += Number(full[k]) * (k % 2 === 0 ? 1 : 3)
        }
        const check = (10 - (sum % 10)) % 10
        if (check === Number(full[12])) {
            return full
        }
    }
    return null
}

function decode1DFromCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): string | null {
    const w = canvas.width
    const h = canvas.height
    if (w < 80 || h < 20) return null

    // สุ่มอ่านหลายเส้นแนวนอนรอบกึ่งกลางภาพ (ต้องอ่านตรงกันอย่างน้อย 2 เส้นสำหรับ Code39 หรือผ่าน Checksum สำหรับ Code128/EAN13)
    const yRatios = [0.5, 0.45, 0.55, 0.38, 0.62, 0.3, 0.7]
    const code39Votes = new Map<string, number>()

    for (const r of yRatios) {
        const y = Math.floor(h * r)
        const imgData = ctx.getImageData(0, y, w, 1).data
        const gray = new Uint8Array(w)
        for (let x = 0; x < w; x++) {
            const idx = x * 4
            gray[x] = (imgData[idx] * 77 + imgData[idx + 1] * 150 + imgData[idx + 2] * 29) >> 8
        }

        const { firstIsBar, runs } = extractRunsFromGrayRow(gray)
        if (runs.length < 15) continue

        const c128 = tryDecodeCode128(runs, firstIsBar)
        if (c128) return c128

        const ean13 = tryDecodeEAN13(runs, firstIsBar)
        if (ean13) return ean13

        const c39 = tryDecodeCode39(runs, firstIsBar)
        if (c39) {
            const nextVotes = (code39Votes.get(c39) || 0) + 1
            if (nextVotes >= 2) return c39
            code39Votes.set(c39, nextVotes)
        }
    }

    return null
}

let sharedCanvas: HTMLCanvasElement | null = null

export async function detectBarcodeFromVideo(video: HTMLVideoElement): Promise<string | null> {
    if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
        return null
    }

    // 1. ลองใช้ Native BarcodeDetector ก่อน (เร็วและแม่นยำระดับฮาร์ดแวร์)
    const detector = await getNativeDetector()
    if (detector) {
        try {
            const results = await detector.detect(video)
            if (Array.isArray(results) && results.length > 0) {
                const raw = String(results[0]?.rawValue ?? "").trim()
                if (raw) return raw.slice(0, 20)
            }
        } catch {
            // fallback ไปใช้ตัวถอดรหัส 1D บน Canvas
        }
    }

    // 2. Pure-JS 1D Scanline Decoder สำหรับ iOS Safari และเบราว์เซอร์ที่ไม่มี BarcodeDetector
    try {
        if (!sharedCanvas) {
            sharedCanvas = document.createElement("canvas")
        }
        // ครอปเฉพาะโซนกลางภาพ (80% กว้าง x 45% สูง) เพื่อความเร็วและตัดสิ่งรบกวนขอบภาพ
        const cropW = Math.floor(video.videoWidth * 0.84)
        const cropH = Math.floor(video.videoHeight * 0.45)
        const sx = Math.floor((video.videoWidth - cropW) / 2)
        const sy = Math.floor((video.videoHeight - cropH) / 2)

        const targetW = Math.min(960, cropW)
        const scale = targetW / cropW
        const targetH = Math.max(40, Math.floor(cropH * scale))

        sharedCanvas.width = targetW
        sharedCanvas.height = targetH
        const ctx = sharedCanvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) return null

        ctx.drawImage(video, sx, sy, cropW, cropH, 0, 0, targetW, targetH)
        const decoded = decode1DFromCanvas(sharedCanvas, ctx)
        if (decoded) {
            return decoded.slice(0, 20)
        }
    } catch {
        // ignore frame error
    }

    return null
}
