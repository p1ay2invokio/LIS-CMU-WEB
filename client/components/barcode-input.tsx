"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
import Webcam from "react-webcam"
import QRCode from "react-qr-code"
import { socket } from "@/app/socket"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
    Barcode,
    Smartphone,
    Camera,
    Check,
    Loader2,
    Sparkles,
    SwitchCamera,
    Upload,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { detectBarcodeFromVideo } from "@/lib/barcode-scanner"
import { PlayBook } from "@/class/playbook.class"

interface BarcodeInputProps {
    id?: string
    value: string
    onChange: (value: string) => void
    placeholder?: string
    disabled?: boolean
    required?: boolean
    username?: string
    targetKey: string
    label?: string
    autoFocus?: boolean
    className?: string
    listenWhenMounted?: boolean
}

export function BarcodeInput({
    id,
    value,
    onChange,
    placeholder = "กรอกหรือสแกนเลขบาร์โค้ด...",
    disabled = false,
    required = false,
    username = "",
    targetKey,
    label = "บาร์โค้ดตัวเล่ม",
    autoFocus = false,
    className,
    listenWhenMounted = true,
}: BarcodeInputProps) {
    const [isScanDialogOpen, setIsScanDialogOpen] = useState(false)
    const [scanMode, setScanMode] = useState<"phone" | "local">("phone")
    const [isPhoneConnected, setIsPhoneConnected] = useState(false)
    const [facingMode, setFacingMode] = useState<"environment" | "user">("environment")
    const [isAiScanning, setIsAiScanning] = useState(false)

    const webcamRef = useRef<Webcam>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const onChangeRef = useRef(onChange)
    onChangeRef.current = onChange

    // เชื่อมต่อห้อง Socket และรอรับหมายเลขบาร์โค้ดจากโทรศัพท์
    useEffect(() => {
        if (!username) return
        if (!isScanDialogOpen && !listenWhenMounted) return

        const ensureJoined = () => {
            socket.emit("computer-join-room", username)
            socket.emit("check-phone-status", username)
        }

        const onPhoneStatus = ({ connected }: { connected: boolean }) => {
            setIsPhoneConnected(Boolean(connected))
        }

        const onPhoneConnected = () => {
            setIsPhoneConnected(true)
            if (isScanDialogOpen) {
                socket.emit("request-barcode-scan", {
                    sessionId: username,
                    target: targetKey,
                    label,
                })
            }
        }

        const onPhoneDisconnected = () => {
            setIsPhoneConnected(false)
        }

        const onBarcodeScanned = (payload: any) => {
            const scanned = String(payload?.barcode ?? "").trim().slice(0, 20)
            if (!scanned) return

            // ถ้าระบุ target มาให้รับเฉพาะช่องที่ตรงกัน หรือถ้าไม่ได้ระบุ target ให้ช่องที่เปิดอยู่รับได้
            if (payload?.target && payload.target !== targetKey && !isScanDialogOpen) {
                return
            }

            onChangeRef.current(scanned)
            setIsScanDialogOpen(false)
            toast.success(`รับเลขบาร์โค้ด "${scanned}" เรียบร้อยแล้ว`, {
                icon: <Barcode className="size-4 text-emerald-500" />,
            })
        }

        socket.on("phone-status", onPhoneStatus)
        socket.on("phone-connected", onPhoneConnected)
        socket.on("phone-disconnected", onPhoneDisconnected)
        socket.on("barcode:scanned", onBarcodeScanned)

        if (!socket.connected) {
            socket.once("connect", ensureJoined)
            socket.connect()
        } else {
            ensureJoined()
        }

        return () => {
            socket.off("connect", ensureJoined)
            socket.off("phone-status", onPhoneStatus)
            socket.off("phone-connected", onPhoneConnected)
            socket.off("phone-disconnected", onPhoneDisconnected)
            socket.off("barcode:scanned", onBarcodeScanned)
        }
    }, [username, targetKey, label, isScanDialogOpen, listenWhenMounted])

    // เมื่อกดเปิดหน้าต่างสแกน ให้ส่งคำสั่งไปยังโทรศัพท์ที่เชื่อมต่ออยู่ให้สลับเข้าโหมดสแกนบาร์โค้ดทันที
    const handleOpenScan = () => {
        if (disabled) return
        setIsScanDialogOpen(true)
        if (username) {
            if (!socket.connected) {
                socket.connect()
            }
            socket.emit("computer-join-room", username)
            socket.emit("check-phone-status", username)
            socket.emit("request-barcode-scan", {
                sessionId: username,
                target: targetKey,
                label,
            })
        } else {
            setScanMode("local")
        }
    }

    // ลูปสแกนบาร์โค้ดแบบสดด้วยกล้องเครื่องปัจจุบันเมื่อเลือกแท็บ local
    useEffect(() => {
        if (!isScanDialogOpen || scanMode !== "local") return

        let active = true
        const timer = setInterval(async () => {
            if (!active) return
            const video = webcamRef.current?.video
            if (!video) return
            const code = await detectBarcodeFromVideo(video)
            if (code && active) {
                active = false
                onChangeRef.current(code)
                setIsScanDialogOpen(false)
                toast.success(`สแกนบาร์โค้ด "${code}" สำเร็จ!`)
            }
        }, 160)

        return () => {
            active = false
            clearInterval(timer)
        }
    }, [isScanDialogOpen, scanMode])

    // อัปโหลด/ถ่ายภาพบาร์โค้ดให้ AI อ่าน (กรณีกล้องโฟกัสยาก)
    const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (fileInputRef.current) fileInputRef.current.value = ""

        try {
            setIsAiScanning(true)
            const pb = new PlayBook()
            const res = await pb.scanBarcodeImage(file)
            if (res?.barcode) {
                onChangeRef.current(String(res.barcode).trim().slice(0, 20))
                setIsScanDialogOpen(false)
                toast.success(`อ่านบาร์โค้ด "${res.barcode}" สำเร็จ!`)
            } else {
                toast.error("ไม่พบหมายเลขบาร์โค้ดในภาพ")
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "ไม่สามารถอ่านบาร์โค้ดจากภาพได้")
        } finally {
            setIsAiScanning(false)
        }
    }

    const qrUrl = typeof window !== "undefined" && username
        ? `${window.location.origin}/camera/${encodeURIComponent(username)}?mode=barcode&target=${encodeURIComponent(targetKey)}`
        : ""

    return (
        <>
            <div className="relative flex items-center w-full">
                <Input
                    id={id}
                    value={value}
                    onChange={(e) => onChange(e.target.value.slice(0, 20))}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            // ป้องกันปุ่ม Enter เผลอ Submit ฟอร์มหลักโดยไม่ตั้งใจขณะสแกน
                            e.stopPropagation()
                        }
                    }}
                    maxLength={20}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    autoFocus={autoFocus}
                    className={cn(
                        "font-mono font-semibold text-sm w-full h-9 pr-24 bg-background/50 focus:bg-background text-blue-600 dark:text-blue-400 placeholder:text-muted-foreground/60 placeholder:font-[k-light] placeholder:font-normal focus-visible:border-blue-500 focus-visible:ring-blue-500/20 transition-colors",
                        className
                    )}
                />
                <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={disabled}
                    onClick={handleOpenScan}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2.5 text-xs font-[k-medium] cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 rounded-md flex items-center gap-1 shadow-2xs"
                    title="สแกนบาร์โค้ดด้วยโทรศัพท์หรือกล้อง"
                >
                    <Barcode className="size-3.5 shrink-0" />
                    <span>สแกน</span>
                </Button>
            </div>

            <Dialog open={isScanDialogOpen} onOpenChange={setIsScanDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl p-5">
                    <DialogHeader className="space-y-1">
                        <DialogTitle className="font-[k-medium] text-base flex items-center gap-2">
                            <Barcode className="size-5 text-primary" />
                            <span>สแกนหมายเลขบาร์โค้ด</span>
                        </DialogTitle>
                        <DialogDescription className="font-[k-light] text-xs text-muted-foreground">
                            สแกนด้วยโทรศัพท์มือถือหรือกล้องของอุปกรณ์นี้ เพื่อกรอกเลขบาร์โค้ดลงในช่องอัตโนมัติ
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs
                        value={scanMode}
                        onValueChange={(v) => setScanMode(v as "phone" | "local")}
                        className="w-full pt-1"
                    >
                        <TabsList className="grid grid-cols-2 w-full h-9 p-1 bg-muted rounded-xl mb-3">
                            <TabsTrigger
                                value="phone"
                                className="rounded-lg text-xs font-[k-medium] flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <Smartphone className="size-3.5" />
                                <span>สแกนด้วยมือถือ</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="local"
                                className="rounded-lg text-xs font-[k-medium] flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <Camera className="size-3.5" />
                                <span>กล้องเครื่องนี้</span>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="phone" className="space-y-4 focus-visible:outline-none">
                            {isPhoneConnected ? (
                                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center space-y-2">
                                    <div className="mx-auto size-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                                        <Check className="size-5 stroke-[2.5]" />
                                    </div>
                                    <p className="font-[k-medium] text-sm text-emerald-700 dark:text-emerald-300">
                                        เชื่อมต่อกับโทรศัพท์แล้ว!
                                    </p>
                                    <p className="font-[k-light] text-xs text-muted-foreground">
                                        หน้าจอมือถือสลับเป็นโหมดสแกนบาร์โค้ดแล้ว ส่องแถบบาร์โค้ดของหนังสือได้เลย เลขจะถูกส่งมาใส่ช่องนี้โดยอัตโนมัติ
                                    </p>
                                    <div className="pt-1 flex items-center justify-center gap-1.5 text-xs font-[k-medium] text-primary">
                                        <Loader2 className="size-3.5 animate-spin" />
                                        <span>กำลังรอรับเลขบาร์โค้ดจากมือถือ...</span>
                                    </div>
                                </div>
                            ) : null}

                            {qrUrl && (
                                <div className="flex flex-col items-center gap-2.5">
                                    <div className="p-3 bg-white rounded-xl border shadow-xs">
                                        <QRCode value={qrUrl} size={176} level="M" />
                                    </div>
                                    <p className="font-[k-regular] text-xs text-center text-muted-foreground">
                                        {isPhoneConnected
                                            ? "หรือสแกน QR Code นี้หากต้องการเปิดกล้องจากมือถือเครื่องอื่น"
                                            : "ใช้กล้องโทรศัพท์สแกน QR Code นี้เพื่อเปิดโหมดสแกนบาร์โค้ด"}
                                    </p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="local" className="space-y-3 focus-visible:outline-none">
                            <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-zinc-950 border flex items-center justify-center">
                                <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    mirrored={facingMode === "user"}
                                    videoConstraints={{
                                        facingMode,
                                        width: { ideal: 1280 },
                                        height: { ideal: 720 },
                                    }}
                                    className="w-full h-full object-cover"
                                />
                                {/* กรอบเล็งบาร์โค้ด */}
                                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                                    <div className="relative w-4/5 h-24 border-2 border-emerald-400/80 rounded-xl bg-black/10 flex items-center justify-center">
                                        <div className="w-full h-0.5 bg-red-500/90 shadow-[0_0_8px_rgba(239,68,68,0.9)] animate-pulse" />
                                    </div>
                                    <span className="mt-2 px-2.5 py-0.5 rounded-full bg-black/60 text-white text-[11px] font-[k-regular]">
                                        วางแถบบาร์โค้ดให้อยู่ในกรอบเส้นสีแดง
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setFacingMode((p) => (p === "environment" ? "user" : "environment"))}
                                    className="absolute top-2.5 right-2.5 size-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 cursor-pointer"
                                    title="สลับกล้อง"
                                >
                                    <SwitchCamera className="size-4" />
                                </button>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={handleFileScan}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={isAiScanning}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full text-xs font-[k-medium] cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    {isAiScanning ? (
                                        <>
                                            <Loader2 className="size-3.5 animate-spin" />
                                            <span>กำลังอ่านบาร์โค้ดจากภาพ...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="size-3.5" />
                                            <Sparkles className="size-3 text-purple-500" />
                                            <span>เลือกรูป / ถ่ายภาพบาร์โค้ดให้ AI อ่าน</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>
        </>
    )
}
