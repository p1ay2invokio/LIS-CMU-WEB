'use client'

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useParams } from "next/navigation"
import Webcam from "react-webcam"
import { socket } from "@/app/socket"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Toaster, toast } from "sonner"
import {
    Camera as CameraIcon,
    Upload,
    SwitchCamera,
    RefreshCw,
    CheckCircle2,
    Send,
    Trash2,
    ImageIcon,
    AlertCircle,
    Wifi,
    WifiOff,
    Check,
    ArrowLeft,
    Sparkles,
    Info,
    ZoomIn,
    X,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { PlayBook } from "@/class/playbook.class"

const CameraPage = () => {
    const params = useParams()
    const rawSessionId = params?.sessionId
    const sessionId = typeof rawSessionId === "string" ? rawSessionId : Array.isArray(rawSessionId) ? rawSessionId[0] : ""

    const [isMounted, setIsMounted] = useState<boolean>(false)
    const [activeTab, setActiveTab] = useState<string>("camera")
    const [isConnected, setIsConnected] = useState<boolean>(false)

    // Camera State
    const webcamRef = useRef<Webcam>(null)
    const [facingMode, setFacingMode] = useState<"environment" | "user">("environment")
    const [cameraReady, setCameraReady] = useState<boolean>(false)
    const [cameraError, setCameraError] = useState<string | null>(null)
    const [capturedImage, setCapturedImage] = useState<string | null>(null)
    const [capturedInfo, setCapturedInfo] = useState<{
        size: string
        sizeInBytes: number
        resolution?: string
    } | null>(null)

    // File State
    const fileInputRef = useRef<HTMLInputElement>(null)
    const nativeCameraInputRef = useRef<HTMLInputElement>(null)
    const [fileImage, setFileImage] = useState<string | null>(null)
    const [fileInfo, setFileInfo] = useState<{
        name: string
        size: string
        sizeInBytes: number
        resolution?: string
    } | null>(null)
    const [isDragging, setIsDragging] = useState<boolean>(false)

    // Submission State
    const [isSending, setIsSending] = useState<boolean>(false)
    const [isSuccess, setIsSuccess] = useState<boolean>(false)
    const [lastSentImage, setLastSentImage] = useState<string | null>(null)
    const [enlargedImage, setEnlargedImage] = useState<string | null>(null)
    const [zoomScale, setZoomScale] = useState<number>(1)

    // LocalStorage Keys for remembering user preferences
    const TAB_STORAGE_KEY = "camera_preferred_tab"
    const FACING_MODE_STORAGE_KEY = "camera_preferred_facing_mode"

    // Mounting Check for SSR Safety & restore saved user preferences
    useEffect(() => {
        try {
            const savedTab = localStorage.getItem(TAB_STORAGE_KEY)
            if (savedTab === "camera" || savedTab === "file") {
                setActiveTab(savedTab)
            }
            const savedFacing = localStorage.getItem(FACING_MODE_STORAGE_KEY)
            if (savedFacing === "environment" || savedFacing === "user") {
                setFacingMode(savedFacing)
            }
        } catch (e) {
            console.error("Failed to restore preferences from localStorage:", e)
        }
        setIsMounted(true)
    }, [])

    // Handle tab change and persist to localStorage
    const handleTabChange = (val: string) => {
        setActiveTab(val)
        try {
            localStorage.setItem(TAB_STORAGE_KEY, val)
        } catch (e) {
            console.error("Failed to save tab preference to localStorage:", e)
        }
    }

    // Socket Connection & Room Joining
    useEffect(() => {
        if (!sessionId) return

        const onConnect = () => {
            console.log("Socket connected, joining room:", sessionId)
            socket.emit("phone-join-room", sessionId)
        }

        const onJoinSuccess = (room: string) => {
            console.log("Phone joined room successfully:", room)
            setIsConnected(true)
            toast.success(`เชื่อมต่อ Session ${room}`, { position: "bottom-right" })
        }

        const onDisconnect = () => {
            console.log("Socket disconnected")
            setIsConnected(false)
        }

        socket.on("connect", onConnect)
        socket.on("phone-join-room:success", onJoinSuccess)
        socket.on("disconnect", onDisconnect)

        if (!socket.connected) {
            socket.connect()
        } else {
            socket.emit("phone-join-room", sessionId)
        }

        return () => {
            socket.off("connect", onConnect)
            socket.off("phone-join-room:success", onJoinSuccess)
            socket.off("disconnect", onDisconnect)
            socket.disconnect()
        }
    }, [sessionId])

    const [image_source, setImageSource] = useState<File | null>(null)

    // Helper: Convert Base64 DataURL to File object for high quality upload
    const dataURLtoFile = (dataurl: string, filename: string): File => {
        const arr = dataurl.split(',')
        const mimeMatch = arr[0].match(/:(.*?);/)
        const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg'
        const bstr = atob(arr[1])
        let n = bstr.length
        const u8arr = new Uint8Array(n)
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n)
        }
        return new File([u8arr], filename, { type: mime })
    }

    // Helper: Format bytes to human readable string (KB / MB)
    const formatBytes = (bytes: number): string => {
        const sizeInMB = bytes / (1024 * 1024)
        return sizeInMB >= 1 ? `${sizeInMB.toFixed(2)} MB` : `${(bytes / 1024).toFixed(1)} KB`
    }

    // Webcam capture handler with direct full-resolution canvas capture
    const capturePhoto = useCallback(() => {
        if (!webcamRef.current) return

        let imageSrc: string | null = null
        const video = webcamRef.current.video

        // Priority 1: Direct capture from video element at full native stream resolution (bypasses CSS clientWidth scale-down)
        if (video && video.videoWidth > 0 && video.videoHeight > 0) {
            try {
                const canvas = document.createElement("canvas")
                canvas.width = video.videoWidth
                canvas.height = video.videoHeight
                const ctx = canvas.getContext("2d")
                if (ctx) {
                    if (facingMode === "user") {
                        ctx.translate(canvas.width, 0)
                        ctx.scale(-1, 1)
                    }
                    ctx.imageSmoothingEnabled = true
                    ctx.imageSmoothingQuality = "high"
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                    imageSrc = canvas.toDataURL("image/jpeg", 0.96)
                }
            } catch (e) {
                console.error("Direct canvas draw failed, using fallback:", e)
            }
        }

        // Priority 2: Fallback to webcam getScreenshot
        if (!imageSrc) {
            imageSrc = webcamRef.current.getScreenshot()
        }

        if (imageSrc) {
            const file = dataURLtoFile(imageSrc, `webcam_${Date.now()}.jpg`)
            const formattedSize = formatBytes(file.size)

            const img = new Image()
            img.onload = () => {
                setCapturedInfo({
                    size: formattedSize,
                    sizeInBytes: file.size,
                    resolution: `${img.naturalWidth} × ${img.naturalHeight} px`,
                })
            }
            img.src = imageSrc

            setCapturedImage(imageSrc)
            toast.info(`ถ่ายรูปเรียบร้อย (ขนาด ${formattedSize})`)
        } else {
            toast.error("ไม่สามารถจับภาพได้ กรุณาลองใหม่อีกครั้ง")
        }
    }, [facingMode])

    // Toggle camera (Front / Back)
    const toggleFacingMode = () => {
        setCameraReady(false)
        setFacingMode((prev) => {
            const next = prev === "environment" ? "user" : "environment"
            try {
                localStorage.setItem(FACING_MODE_STORAGE_KEY, next)
            } catch (e) {
                console.error("Failed to save camera facing preference:", e)
            }
            return next
        })
    }

    // Retake camera photo
    const retakePhoto = () => {
        setCapturedImage(null)
        setCapturedInfo(null)
    }

    // Native Camera handler (Full sensor resolution)
    const handleNativeCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setImageSource(file)
        processFile(file)
        setActiveTab("file")
        if (nativeCameraInputRef.current) {
            nativeCameraInputRef.current.value = ""
        }
    }

    // File selection handler
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setImageSource(file)
        processFile(file)
    }

    // Process selected file
    const processFile = (file: File) => {
        if (!file.type.startsWith("image/")) {
            toast.error("กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WEBP)")
            return
        }

        // Limit size to 25MB for high-res photos
        if (file.size > 25 * 1024 * 1024) {
            toast.error("ขนาดไฟล์เกิน 25MB กรุณาเลือกไฟล์ที่มีขนาดเล็กลง")
            return
        }

        const formattedSize = formatBytes(file.size)

        const reader = new FileReader()
        reader.onload = () => {
            const result = reader.result as string
            const img = new Image()
            img.onload = () => {
                setFileInfo({
                    name: file.name,
                    size: formattedSize,
                    sizeInBytes: file.size,
                    resolution: `${img.naturalWidth} × ${img.naturalHeight} px`,
                })
            }
            img.src = result
            setFileImage(result)
            toast.info(`โหลดไฟล์เรียบร้อย (ขนาด ${formattedSize})`)
        }
        reader.onerror = () => {
            toast.error("เกิดข้อผิดพลาดในการอ่านไฟล์")
        }
        reader.readAsDataURL(file)
    }

    // Drag and Drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file) {
            setImageSource(file)
            processFile(file)
        }
    }

    // Clear file selection
    const clearFile = () => {
        setFileImage(null)
        setFileInfo(null)
        setImageSource(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    // Send Image via Socket & AI API
    const handleSendImage = async (imageSrc: string, source: "camera" | "file", rawFile?: File | null) => {
        if (!imageSrc) {
            toast.error("ไม่พบรูปภาพที่จะส่ง")
            return
        }

        setIsSending(true)

        try {
            let fileToSend: File | null = rawFile || null
            if (!fileToSend && imageSrc.startsWith("data:")) {
                fileToSend = dataURLtoFile(imageSrc, `book_camera_${Date.now()}.jpg`)
            }

            if (!fileToSend) {
                toast.error("ไม่พบข้อมูลไฟล์รูปภาพ กรุณาถ่ายภาพหรือเลือกไฟล์ใหม่อีกครั้ง")
                setIsSending(false)
                return
            }

            const pb = new PlayBook()
            await pb.uploadImageToAI(fileToSend, sessionId)

            setIsSending(false)
            setIsSuccess(true)
            setLastSentImage(imageSrc)
            toast.success("ส่งรูปภาพไปยังหน้าจอหลักเรียบร้อยแล้ว!")
        } catch (err: any) {
            console.error("Upload to AI error:", err)
            setIsSending(false)
            const errorMsg = err?.response?.data?.message || err?.message || "เกิดข้อผิดพลาดในการส่งรูปภาพ"
            toast.error(`ส่งรูปภาพไม่สำเร็จ: ${errorMsg}`)
        }
    }

    // Reset everything to send another image
    const handleResetAll = () => {
        setIsSuccess(false)
        setCapturedImage(null)
        setCapturedInfo(null)
        clearFile()
        setLastSentImage(null)
    }

    if (!isMounted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-zinc-950 font-[k-regular]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-500 text-sm">กำลังโหลดหน้ากล้อง...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 dark:from-zinc-950 dark:to-zinc-900 text-foreground font-[k-regular] p-4 flex flex-col items-center justify-start pb-12">
            <Toaster position="top-center" richColors />

            <div className="w-full max-w-md mx-auto space-y-4">
                {/* Header & Session Bar */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-purple-600/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                <CameraIcon className="size-5" />
                            </div>
                            <div>
                                <p className="font-[k-light] text-xs text-muted-foreground">
                                    LIS CMU Book Catalog
                                </p>
                            </div>
                        </div>

                        {/* Connection Status Badge */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-[k-medium] bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                            {isConnected ? (
                                <>
                                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-emerald-600 dark:text-emerald-400">เชื่อมต่อแล้ว</span>
                                </>
                            ) : (
                                <>
                                    <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                                    <span className="text-amber-600 dark:text-amber-400">กำลังเชื่อมต่อ</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Session ID display */}
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs text-muted-foreground font-[k-regular]">
                        <span>รหัสเซสชัน (Session ID):</span>
                        <span className="font-[k-medium] text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                            {sessionId || "ไม่ระบุ"}
                        </span>
                    </div>
                </div>

                {/* Success View */}
                {isSuccess ? (
                    <Card className="rounded-2xl border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm p-6 text-center">
                        <CardContent className="p-0 flex flex-col items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                <CheckCircle2 className="size-8" />
                            </div>

                            <div className="space-y-1">
                                <h2 className="font-[k-semi-bold] text-lg text-emerald-800 dark:text-emerald-200">
                                    ส่งรูปภาพสำเร็จแล้ว!
                                </h2>
                                <p className="font-[k-regular] text-xs text-muted-foreground">
                                    ภาพได้ถูกส่งต่อไปยังคอมพิวเตอร์ในห้อง {sessionId} เรียบร้อยแล้ว
                                </p>
                            </div>

                            {lastSentImage && (
                                <div className="flex flex-col items-center gap-2">
                                    <div
                                        onClick={() => {
                                            setEnlargedImage(lastSentImage)
                                            setZoomScale(1)
                                        }}
                                        className="relative w-56 h-56 rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-lg cursor-pointer group bg-black/5 dark:bg-black/40 transition-all active:scale-95 hover:scale-[1.02] hover:border-emerald-500"
                                        title="แตะเพื่อดูรูปภาพขนาดใหญ่"
                                    >
                                        <img
                                            src={lastSentImage}
                                            alt="Sent preview"
                                            className="w-full h-full object-contain p-1"
                                        />
                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white">
                                            <div className="size-10 rounded-full bg-white/25 backdrop-blur-xs flex items-center justify-center">
                                                <ZoomIn className="size-5" />
                                            </div>
                                            <span className="font-[k-medium] text-xs">แตะเพื่อขยายใหญ่</span>
                                        </div>

                                        {/* Corner badge for mobile users */}
                                        <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-xs text-white text-[11px] font-[k-regular] flex items-center gap-1 shadow-sm border border-white/10">
                                            <ZoomIn className="size-3.5" />
                                            <span>แตะเพื่อขยาย</span>
                                        </div>
                                    </div>
                                    <p className="font-[k-light] text-[11px] text-muted-foreground flex items-center gap-1">
                                        <Info className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                                        แตะที่รูปภาพเพื่อขยายใหญ่ตรวจสอบความชัด
                                    </p>
                                </div>
                            )}

                            <div className="pt-2 w-full">
                                <Button
                                    onClick={handleResetAll}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-[k-medium] rounded-xl h-11 shadow-sm gap-2"
                                >
                                    <RefreshCw className="size-4" />
                                    ส่งรูปภาพอื่นเพิ่มเติม
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    /* Main Card with Tabs */
                    <Card className="rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
                        <CardContent className="p-4 sm:p-5">
                            <Tabs
                                value={activeTab}
                                onValueChange={(val) => handleTabChange(val as string)}
                                className="w-full"
                            >
                                {/* Tab Navigation */}
                                <TabsList className="grid grid-cols-2 w-full h-11 p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl mb-4">
                                    <TabsTrigger
                                        value="camera"
                                        className="rounded-lg text-sm font-[k-medium] flex items-center justify-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400"
                                    >
                                        <CameraIcon className="size-4" />
                                        <span>แบบถ่ายรูป</span>
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="file"
                                        className="rounded-lg text-sm font-[k-medium] flex items-center justify-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400"
                                    >
                                        <Upload className="size-4" />
                                        <span>แบบไฟล์</span>
                                    </TabsTrigger>
                                </TabsList>

                                {/* TAB 1: CAMERA (ถ่ายรูปด้วย react-webcam) */}
                                <TabsContent value="camera" className="space-y-4 focus-visible:outline-none">
                                    {capturedImage ? (
                                        /* Captured Image Preview */
                                        <div className="space-y-4">
                                            <div
                                                onClick={() => {
                                                    setEnlargedImage(capturedImage)
                                                    setZoomScale(1)
                                                }}
                                                className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-black shadow-inner border border-slate-200 dark:border-zinc-700 cursor-pointer group"
                                                title="แตะเพื่อขยายใหญ่ตรวจสอบความชัด"
                                            >
                                                <img
                                                    src={capturedImage}
                                                    alt="Captured"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-[k-regular] flex items-center gap-1.5">
                                                    <Check className="size-3 text-emerald-400" />
                                                    ภาพถ่ายจากกล้องเว็บ
                                                </div>

                                                {/* File Size Badge on image */}
                                                {capturedInfo && (
                                                    <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-xs font-[k-medium] flex items-center gap-1.5 border border-white/20 shadow-md">
                                                        <span className="text-amber-300 font-[k-bold]">{capturedInfo.size}</span>
                                                    </div>
                                                )}

                                                {/* Corner badge to zoom */}
                                                <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-xs text-white text-[11px] font-[k-regular] flex items-center gap-1 shadow-sm border border-white/10">
                                                    <ZoomIn className="size-3.5" />
                                                    <span>แตะเพื่อขยาย</span>
                                                </div>
                                            </div>

                                            {/* File Size & Resolution Card */}
                                            {capturedInfo && (
                                                <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 dark:bg-amber-950/20 dark:border-amber-800/40 rounded-xl space-y-2 text-xs">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-[k-medium] text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                                                            <Info className="size-4 text-amber-600 dark:text-amber-400" />
                                                            ขนาดไฟล์ภาพ:
                                                        </span>
                                                        <span className="font-[k-bold] text-amber-950 dark:text-amber-100 text-sm">
                                                            {capturedInfo.size}
                                                        </span>
                                                    </div>

                                                    {capturedInfo.resolution && (
                                                        <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                                                            <span>ความละเอียดภาพ (Resolution):</span>
                                                            <span className="font-[k-medium] text-foreground">{capturedInfo.resolution}</span>
                                                        </div>
                                                    )}

                                                    <div className="pt-2 border-t border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed space-y-1">
                                                        <p>
                                                            💡 <strong>ทำไมภาพจากกล้องเว็บอาจไม่คมชัด?</strong> Safari บน iPhone จะจำกัดความละเอียดวิดีโอบนเว็บไว้ที่ ~720p/1080p (ประมาณ 0.2 - 0.5 MB) และไม่มี Macro Autofocus สำหรับตัวหนังสือเล็ก
                                                        </p>
                                                        <p className="text-purple-700 dark:text-purple-300 font-[k-medium]">
                                                            👉 หากภาพเบลอ แนะนำให้กด <strong>&quot;ถ่ายใหม่&quot;</strong> แล้วเลือก <strong>&quot;ถ่ายด้วยกล้องมือถือ (Native Camera)&quot;</strong> เพื่อใช้เซนเซอร์ 12-48MP ของ iPhone เต็มความละเอียด
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-3">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={retakePhoto}
                                                    className="w-full font-[k-medium] rounded-xl h-11 gap-2 border-slate-200 dark:border-zinc-700 cursor-pointer"
                                                    disabled={isSending}
                                                >
                                                    <RefreshCw className="size-4" />
                                                    ถ่ายใหม่
                                                </Button>

                                                <Button
                                                    type="button"
                                                    onClick={() => handleSendImage(capturedImage, "camera", null)}
                                                    className="w-full font-[k-medium] rounded-xl h-11 gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-sm cursor-pointer"
                                                    disabled={isSending}
                                                >
                                                    {isSending ? (
                                                        <>
                                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                            กำลังส่ง...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Send className="size-4" />
                                                            ส่งรูปภาพ
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Live Webcam View */
                                        <div className="space-y-4">
                                            <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-zinc-950 shadow-md flex items-center justify-center border border-zinc-800">
                                                {cameraError ? (
                                                    <div className="p-6 text-center text-white space-y-3">
                                                        <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center">
                                                            <AlertCircle className="size-6" />
                                                        </div>
                                                        <p className="font-[k-medium] text-sm text-red-300">
                                                            {cameraError}
                                                        </p>
                                                        <p className="font-[k-light] text-xs text-gray-400">
                                                            กรุณาตรวจสอบการอนุญาตใช้งานกล้อง หรือสลับไปใช้แท็บ &quot;แบบไฟล์&quot; หรือกล้องมือถือ
                                                        </p>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setCameraError(null)
                                                                setCameraReady(false)
                                                            }}
                                                            className="text-xs font-[k-regular] text-white border-zinc-700"
                                                        >
                                                            ลองใหม่
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Webcam
                                                            audio={false}
                                                            ref={webcamRef}
                                                            screenshotFormat="image/jpeg"
                                                            screenshotQuality={1.0}
                                                            forceScreenshotSourceSize={true}
                                                            imageSmoothing={true}
                                                            mirrored={facingMode === "user"}
                                                            videoConstraints={{
                                                                facingMode: facingMode,
                                                                width: { ideal: 1920 },
                                                                height: { ideal: 1080 },
                                                            }}
                                                            onUserMedia={(stream) => {
                                                                setCameraReady(true)
                                                                setCameraError(null)
                                                                try {
                                                                    const track = stream.getVideoTracks()[0]
                                                                    const capabilities: any = track.getCapabilities?.() || {}
                                                                    if (capabilities.focusMode?.includes("continuous")) {
                                                                        track.applyConstraints({
                                                                            advanced: [{ focusMode: "continuous" }]
                                                                        } as any).catch(() => {})
                                                                    }
                                                                } catch {
                                                                    // ignore
                                                                }
                                                            }}
                                                            onUserMediaError={(err) => {
                                                                console.error("Camera error:", err)
                                                                setCameraError("ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการเข้าถึงกล้อง")
                                                            }}
                                                            className="w-full h-full object-cover"
                                                        />

                                                        {/* Camera Overlay Guide */}
                                                        <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
                                                            <div className="flex justify-between items-start">
                                                                <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[11px] text-white/90 font-[k-regular] flex items-center gap-1.5">
                                                                    <span className="size-2 rounded-full bg-red-500 animate-pulse" />
                                                                    กล้อง {facingMode === "environment" ? "หลัง" : "หน้า"}
                                                                </span>
                                                            </div>

                                                            {/* Viewfinder Frame corners */}
                                                            <div className="relative w-full aspect-[4/3] border-2 border-white/40 rounded-xl">
                                                                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-purple-400 rounded-tl" />
                                                                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-purple-400 rounded-tr" />
                                                                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-purple-400 rounded-bl" />
                                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-purple-400 rounded-br" />
                                                            </div>

                                                            <p className="text-center text-[11px] text-white/80 bg-black/40 backdrop-blur-xs py-1 px-3 rounded-full mx-auto">
                                                                จัดวางภาพปกหนังสือหรือสิ่งของให้อยู่ในกรอบ
                                                            </p>
                                                        </div>

                                                        {/* Flip Camera Button */}
                                                        <button
                                                            type="button"
                                                            onClick={toggleFacingMode}
                                                            className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/80 active:scale-95 transition-all shadow-md"
                                                            title="สลับกล้องหน้า/หลัง"
                                                        >
                                                            <SwitchCamera className="size-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>

                                            {/* Shutter Capture Button & Native Camera Option */}
                                            <div className="flex flex-col items-center justify-center pt-1 gap-3">
                                                <div className="flex items-center gap-6">
                                                    <button
                                                        type="button"
                                                        onClick={capturePhoto}
                                                        disabled={!cameraReady || !!cameraError}
                                                        className="w-18 h-18 rounded-full border-4 border-purple-600 p-1 flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer group shadow-lg"
                                                        title="ถ่ายภาพจากจอแสดงผล"
                                                    >
                                                        <div className="w-full h-full rounded-full bg-purple-600 group-hover:bg-purple-700 flex items-center justify-center text-white transition-colors">
                                                            <CameraIcon className="size-7" />
                                                        </div>
                                                    </button>
                                                </div>
                                                <span className="text-xs font-[k-regular] text-muted-foreground">
                                                    กดเพื่อถ่ายภาพจากจอ (Webcam)
                                                </span>

                                                {/* Native Camera High-Res Button */}
                                                <div className="w-full pt-1 space-y-1.5">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => nativeCameraInputRef.current?.click()}
                                                        className="w-full rounded-xl h-12 border-purple-400 dark:border-purple-700 text-purple-700 dark:text-purple-300 bg-purple-50/80 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/70 font-[k-medium] gap-2 shadow-xs cursor-pointer text-sm"
                                                    >
                                                        <Sparkles className="size-4 text-purple-600 dark:text-purple-400 animate-pulse" />
                                                        <span>ถ่ายด้วยกล้องมือถือ (แนะนำ: คมชัด 12-48MP)</span>
                                                    </Button>
                                                    <p className="text-[11px] text-center text-muted-foreground">
                                                        * แนะนำสำหรับถ่ายหน้าปกใน/CIP เพราะกล้องไอโฟนจะโฟกัสตัวหนังสือเล็กได้คมชัดที่สุด
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>

                                {/* TAB 2: FILE UPLOAD (แบบไฟล์) */}
                                <TabsContent value="file" className="space-y-4 focus-visible:outline-none">
                                    {fileImage ? (
                                        /* Selected File Preview */
                                        <div className="space-y-4">
                                            <div
                                                onClick={() => {
                                                    setEnlargedImage(fileImage)
                                                    setZoomScale(1)
                                                }}
                                                className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-black shadow-inner border border-slate-200 dark:border-zinc-700 cursor-pointer group"
                                                title="แตะเพื่อขยายใหญ่ตรวจสอบความชัด"
                                            >
                                                <img
                                                    src={fileImage}
                                                    alt="Uploaded file preview"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-[k-regular] flex items-center gap-1.5">
                                                    <ImageIcon className="size-3 text-purple-400" />
                                                    รูปภาพจากไฟล์ / กล้องมือถือ
                                                </div>

                                                {/* File Size Badge on image */}
                                                {fileInfo && (
                                                    <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-xs font-[k-medium] flex items-center gap-1.5 border border-white/20 shadow-md">
                                                        <span className="text-emerald-300 font-[k-bold]">{fileInfo.size}</span>
                                                    </div>
                                                )}

                                                {/* Corner badge to zoom */}
                                                <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-xs text-white text-[11px] font-[k-regular] flex items-center gap-1 shadow-sm border border-white/10">
                                                    <ZoomIn className="size-3.5" />
                                                    <span>แตะเพื่อขยาย</span>
                                                </div>
                                            </div>

                                            {/* File Info */}
                                            {fileInfo && (
                                                <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-200 dark:border-zinc-800 space-y-2 text-xs font-[k-regular]">
                                                    <div className="flex items-center justify-between">
                                                        <div className="truncate max-w-[200px]">
                                                            <p className="font-[k-medium] text-foreground truncate">
                                                                {fileInfo.name}
                                                            </p>
                                                            {fileInfo.resolution && (
                                                                <p className="text-[11px] text-muted-foreground">
                                                                    ความละเอียด: {fileInfo.resolution}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="font-[k-bold] text-sm text-purple-600 dark:text-purple-400">
                                                                {fileInfo.size}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-zinc-700/60">
                                                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-[k-medium]">
                                                            <Check className="size-3" /> คมชัดระดับต้นฉบับ (Original Full Res)
                                                        </span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={clearFile}
                                                            className="h-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs gap-1 font-[k-regular] px-2 cursor-pointer"
                                                        >
                                                            <Trash2 className="size-3" />
                                                            ลบ
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-3">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => nativeCameraInputRef.current?.click()}
                                                    className="w-full font-[k-medium] rounded-xl h-11 gap-2 border-slate-200 dark:border-zinc-700 cursor-pointer"
                                                    disabled={isSending}
                                                >
                                                    <RefreshCw className="size-4" />
                                                    ถ่ายใหม่
                                                </Button>

                                                <Button
                                                    type="button"
                                                    onClick={() => handleSendImage(fileImage, "file", image_source)}
                                                    className="w-full font-[k-medium] rounded-xl h-11 gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-sm cursor-pointer"
                                                    disabled={isSending}
                                                >
                                                    {isSending ? (
                                                        <>
                                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                            กำลังส่ง...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Send className="size-4" />
                                                            ส่งรูปภาพ
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Native Camera & File Picker */
                                        <div className="space-y-3">
                                            <Button
                                                type="button"
                                                onClick={() => nativeCameraInputRef.current?.click()}
                                                className="w-full rounded-xl h-12 bg-purple-600 hover:bg-purple-700 text-white font-[k-medium] gap-2 shadow-sm cursor-pointer"
                                            >
                                                <CameraIcon className="size-5" />
                                                <span>เปิดกล้องมือถือถ่ายภาพ (คมชัดสูงสุด 12-48MP)</span>
                                            </Button>

                                            {/* Drag & Drop File Picker */}
                                            <div
                                                onDragOver={handleDragOver}
                                                onDragLeave={handleDragLeave}
                                                onDrop={handleDrop}
                                                onClick={() => fileInputRef.current?.click()}
                                                className={`rounded-2xl border-2 border-dashed p-6 text-center flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all aspect-[4/3] ${isDragging
                                                    ? "border-purple-600 bg-purple-50/50 dark:bg-purple-950/20 scale-[0.99]"
                                                    : "border-slate-300 dark:border-zinc-700 hover:border-purple-400 dark:hover:border-purple-600 bg-slate-50/50 dark:bg-zinc-800/30"
                                                    }`}
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-purple-600/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-inner">
                                                    <Upload className="size-6" />
                                                </div>

                                                <div className="space-y-0.5">
                                                    <p className="font-[k-semi-bold] text-sm text-foreground">
                                                        แตะเพื่อเลือกรูปภาพจากเครื่อง / คลังภาพ
                                                    </p>
                                                    <p className="font-[k-light] text-xs text-muted-foreground">
                                                        หรือลากไฟล์รูปภาพมาวางที่นี่
                                                    </p>
                                                </div>

                                                <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/60 dark:bg-zinc-800 text-[11px] text-muted-foreground font-[k-regular]">
                                                    <span>JPG, PNG, WEBP (สูงสุด 25MB)</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Hidden file input */}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />

                                    {/* Hidden native camera input (Full sensor resolution) */}
                                    <input
                                        ref={nativeCameraInputRef}
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        className="hidden"
                                        onChange={handleNativeCameraChange}
                                    />
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                )}

                {/* Footer Tips */}
                <p className="text-center text-xs text-muted-foreground font-[k-light]">
                    รูปภาพที่ส่งจะถูกส่งต่อไปยังคอมพิวเตอร์ที่เปิดเซสชันนี้อยู่โดยอัตโนมัติ
                </p>
            </div>

            {/* Enlarged Image Lightbox Modal for Staff Rechecking */}
            <AnimatePresence>
                {enlargedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between select-none"
                        onClick={() => {
                            setEnlargedImage(null)
                            setZoomScale(1)
                        }}
                    >
                        {/* Top bar header */}
                        <div
                            className="flex items-center justify-between w-full px-4 py-3 bg-zinc-950/80 backdrop-blur-sm border-b border-white/10 z-10 text-white"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-2">
                                <span className="font-[k-medium] text-sm sm:text-base flex items-center gap-1.5 text-white">
                                    <CheckCircle2 className="size-4 text-emerald-400" />
                                    ตรวจสอบภาพต้นฉบับ
                                </span>
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 font-[k-regular] hidden sm:inline">
                                    ขนาดเต็มความละเอียด
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setZoomScale((prev) => (prev === 1 ? 2 : 1))}
                                    className="h-8 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-[k-regular] text-xs cursor-pointer flex items-center gap-1.5"
                                    title="สลับการซูม 100% / 200%"
                                >
                                    <ZoomIn className="size-3.5" />
                                    <span>{zoomScale === 1 ? "ซูม 2x" : "ขนาดปกติ 1x"}</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setEnlargedImage(null)
                                        setZoomScale(1)
                                    }}
                                    className="size-8 p-0 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                                    title="ปิดหน้าต่างขยาย"
                                >
                                    <X className="size-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Image Viewer with pan / zoom */}
                        <div
                            className="flex-1 overflow-auto flex items-center justify-center p-2 sm:p-4 touch-pan-x touch-pan-y"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <motion.img
                                initial={{ scale: 0.92, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.92, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                src={enlargedImage}
                                alt="Enlarged preview"
                                style={{
                                    transform: `scale(${zoomScale})`,
                                    transition: "transform 0.25s ease-out",
                                    cursor: zoomScale > 1 ? "zoom-out" : "zoom-in",
                                }}
                                onClick={() => setZoomScale((prev) => (prev === 1 ? 2 : 1))}
                                className="max-h-[82vh] max-w-full object-contain rounded-lg shadow-2xl transition-transform"
                            />
                        </div>

                        {/* Bottom bar hint */}
                        <div
                            className="w-full flex items-center justify-between px-4 py-2.5 bg-zinc-950/80 backdrop-blur-sm border-t border-white/10 text-xs text-zinc-400 z-10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <span className="font-[k-light] text-[11px] truncate">
                                💡 แตะที่รูปเพื่อซูม 2x เข้า-ออก หรือแตะปุ่มปิดเพื่อกลับ
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setEnlargedImage(null)
                                    setZoomScale(1)
                                }}
                                className="rounded-full bg-white/10 hover:bg-white/20 border-white/20 text-white font-[k-regular] text-xs h-7 px-3 cursor-pointer shrink-0 ml-2"
                            >
                                ปิด
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default CameraPage