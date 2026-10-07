"use client"

import React, { useEffect, useState, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import { jwtDecode } from "jwt-decode"
import { PlayBook } from "@/class/playbook.class"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarProvider,
    SidebarRail,
    SidebarSeparator,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    ArrowLeft,
    BookOpen,
    BookPlus,
    Barcode,
    Calendar,
    CheckCircle2,
    ChevronDown,
    ChevronsUpDown,
    CircleCheck,
    Clock,
    Copy,
    ExternalLink,
    FileText,
    History,
    Layers,
    Library,
    Loader2,
    LogOut,
    PlusCircle,
    Printer,
    QrCode,
    RotateCcw,
    ShieldCheck,
    Sparkles,
    Tag,
    User,
    Building2,
    Bookmark,
    Share2,
    Hash,
    Info,
    Trash2,
    AlertTriangle,
    Pencil,
    Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import QRCode from "react-qr-code"
import { EditBookDialog } from "@/components/edit-book-dialog"

interface BookDetailData {
    bibid: number
    create_dt: string
    last_change_dt: string
    last_change_userid: number
    material_cd: number
    collection_cd: number
    call_nmbr1: string | null
    call_nmbr2: string | null
    call_nmbr3: string | null
    title: string | null
    title_remainder: string | null
    responsibility_stmt: string | null
    author: string | null
    topic1: string | null
    topic2: string | null
    topic3: string | null
    topic4: string | null
    topic5: string | null
    opac_flg: string
    has_cover: string | null
    status: string
    material: string
    collection: string
    staffName: string
    copyCount: number
    barcodes: string[]
    copies: Array<{
        bibid: number
        copyid: number
        create_dt: string
        copy_desc: string | null
        barcode_nmbr: string
        status_cd: string
        status_begin_dt: string
        due_back_dt: string | null
        mbrid: number | null
        renewal_count: number
        staff_id?: number | null
        staffName?: string
        staffUsername?: string
    }>
    fields: Array<{
        bibid: number
        fieldid: number
        tag: number
        ind1_cd: string | null
        ind2_cd: string | null
        subfield_cd: string
        field_data: string | null
        tagName: string
    }>
    marc: {
        isbn: string
        lcCallNumber: string
        deweyCallNumber: string
        author: string
        title: string
        edition: string
        publicationPlace: string
        publisher: string
        publicationYear: string
        physicalExtent: string
        physicalFormat: string
        physicalSize: string
        summary: string
        subjects: string[]
        coAuthors: string[]
    }
}

export default function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)
    const bibid = resolvedParams.id
    const router = useRouter()

    const [book, setBook] = useState<BookDetailData | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<"bibliographic" | "copies" | "marc" | "history">("bibliographic")
    const [user, setUser] = useState<any>(null)
    const isRole1 = Boolean(user && (Number(user.role) === 1 || user.role === 1 || user.role === "1"))
    const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false)
    const [isCatalogSubMenuOpen, setIsCatalogSubMenuOpen] = useState<boolean>(false)

    // Modal state for adding a new copy
    const [isAddCopyOpen, setIsAddCopyOpen] = useState<boolean>(false)
    const [newCopyDesc, setNewCopyDesc] = useState<string>("")
    const [isAddingCopy, setIsAddingCopy] = useState<boolean>(false)

    // QR Code modal
    const [selectedBarcode, setSelectedBarcode] = useState<string | null>(null)

    // Load book data
    const fetchBook = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const playbook = new PlayBook()
            const res = await playbook.getBook(bibid)
            if (res && res.success && res.data) {
                setBook(res.data)
            } else {
                setError(res?.message || "ไม่พบข้อมูลหนังสือเล่มนี้")
            }
        } catch (err: any) {
            console.error("Failed to load book:", err)
            setError(err?.response?.data?.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้")
        } finally {
            setLoading(false)
        }
    }, [bibid])

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) {
            router.replace("/login")
            return
        }
        try {
            const decoded = jwtDecode(token)
            setUser(decoded)
        } catch {
            router.replace("/login")
            return
        }
        fetchBook()
    }, [fetchBook, router])

    // Edit Book State (เฉพาะ Role 1)
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false)

    // Toggle status (รอตรวจสอบ <-> เสร็จสิ้น - เฉพาะ Role 1)
    const handleToggleStatus = async () => {
        if (!book) return
        if (!isRole1) {
            toast.error("เฉพาะผู้ใช้งาน Role 1 เท่านั้นที่สามารถตรวจสอบ/อนุมัติหนังสือได้")
            return
        }
        const nextStatus = book.status === "เสร็จสิ้น" ? "รอตรวจสอบ" : "เสร็จสิ้น"
        try {
            setIsUpdatingStatus(true)
            const playbook = new PlayBook()
            await playbook.updateBookStatus(book.bibid, nextStatus)
            toast.success(`เปลี่ยนสถานะเป็น "${nextStatus}" เรียบร้อยแล้ว`, {
                icon: nextStatus === "เสร็จสิ้น" ? <CheckCircle2 className="size-4 text-emerald-500" /> : <Clock className="size-4 text-amber-500" />,
            })
            await fetchBook()
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "ไม่สามารถเปลี่ยนสถานะได้")
        } finally {
            setIsUpdatingStatus(false)
        }
    }

    // Add physical copy
    const handleAddCopy = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!book) return
        try {
            setIsAddingCopy(true)
            const playbook = new PlayBook()
            const res = await playbook.addBookCopy(book.bibid, {
                copy_desc: newCopyDesc.trim() || undefined,
            })
            toast.success(res?.message || "เพิ่มตัวเล่มเรียบร้อยแล้ว", {
                icon: <CircleCheck className="size-4 text-emerald-500" />,
            })
            setIsAddCopyOpen(false)
            setNewCopyDesc("")
            await fetchBook()
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "เกิดข้อผิดพลาดในการเพิ่มตัวเล่ม")
        } finally {
            setIsAddingCopy(false)
        }
    }

    // Delete Book State & Handler
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false)
    const [isDeleting, setIsDeleting] = useState<boolean>(false)

    // Delete Copy State & Handler
    const [copyToDelete, setCopyToDelete] = useState<BookDetailData["copies"][number] | null>(null)
    const [isDeleteCopyOpen, setIsDeleteCopyOpen] = useState<boolean>(false)
    const [isDeletingCopy, setIsDeletingCopy] = useState<boolean>(false)

    const handleDeleteCopy = async () => {
        if (!book?.bibid || !copyToDelete) return
        if (!isRole1) {
            toast.error("เฉพาะผู้ใช้งาน Role 1 เท่านั้นที่สามารถลบตัวเล่มได้")
            setIsDeleteCopyOpen(false)
            return
        }
        try {
            setIsDeletingCopy(true)
            const playbook = new PlayBook()
            const res = await playbook.deleteBookCopy(book.bibid, copyToDelete.copyid)

            if (res?.bookDeleted || (book.copies && book.copies.length <= 1)) {
                toast.success(res?.message || "ลบตัวเล่มฉบับสุดท้ายและนำหนังสือออกจากระบบเรียบร้อยแล้ว", {
                    icon: <CircleCheck className="size-4 text-emerald-500" />,
                })
                setIsDeleteCopyOpen(false)
                setCopyToDelete(null)
                router.push("/catalog")
                return
            }

            toast.success(res?.message || `ลบตัวเล่มฉบับที่ ${copyToDelete.copyid} เรียบร้อยแล้ว`, {
                icon: <CircleCheck className="size-4 text-emerald-500" />,
            })
            setIsDeleteCopyOpen(false)
            setCopyToDelete(null)
            await fetchBook()
        } catch (err: any) {
            console.error("Error deleting copy:", err)
            toast.error(err?.response?.data?.message || "เกิดข้อผิดพลาดในการลบตัวเล่ม")
        } finally {
            setIsDeletingCopy(false)
        }
    }

    const handleDeleteBook = async () => {
        if (!book?.bibid) return
        if (!isRole1) {
            toast.error("เฉพาะผู้ใช้งาน Role 1 เท่านั้นที่สามารถลบหนังสือได้")
            setIsDeleteDialogOpen(false)
            return
        }
        try {
            setIsDeleting(true)
            const playbook = new PlayBook()
            const res = await playbook.deleteBook(book.bibid)
            toast.success(res?.message || "ลบหนังสือและตัวเล่มทั้งหมดเรียบร้อยแล้ว", {
                icon: <CircleCheck className="size-4 text-emerald-500" />,
            })
            setIsDeleteDialogOpen(false)
            router.push("/catalog")
        } catch (err: any) {
            console.error("Error deleting book:", err)
            toast.error(err?.response?.data?.message || "เกิดข้อผิดพลาดในการลบหนังสือ")
        } finally {
            setIsDeleting(false)
        }
    }


    // Copy to clipboard helper
    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast.success(`คัดลอก ${label} เรียบร้อยแล้ว`)
    }

    const formatDate = (isoString?: string) => {
        if (!isoString) return "-"
        try {
            const d = new Date(isoString)
            return d.toLocaleDateString("th-TH", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            })
        } catch {
            return isoString
        }
    }

    return (
        <SidebarProvider>
            <Toaster position="top-right" richColors />
            <div className="flex min-h-screen w-full bg-muted/20">
                {/* Sidebar */}
                <Sidebar collapsible="icon" className="border-r border-sidebar-border">
                    <SidebarHeader className="border-b border-sidebar-border p-3">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-transparent text-primary-foreground shadow-sm">
                                <img src="/cmulogo.png" alt="CMU Logo" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                                <span className="truncate font-semibold font-[k-medium] text-[16px] text-sidebar-foreground">
                                    LIS CMU CATALOGING
                                </span>
                                <span className="truncate text-xs text-muted-foreground font-[k-light]">
                                    สารสนเทศศึกษา
                                </span>
                            </div>
                        </div>
                    </SidebarHeader>

                    <SidebarContent className="px-2 py-2">
                        {/* กลุ่มเมนู: ระบบลงรายการหนังสือ */}
                        <SidebarGroup>
                            <SidebarGroupLabel className="font-[k-medium] text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
                                ระบบลงรายการ (Cataloging)
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            onClick={() => router.push("/catalog")}
                                            tooltip="ระบบลงรายการหนังสือ"
                                            className="cursor-pointer font-[k-medium]"
                                        >
                                            <BookPlus className="size-4" />
                                            <span>ลงรายการ</span>
                                        </SidebarMenuButton>

                                        {isCatalogSubMenuOpen && (
                                            <SidebarMenuSub>
                                                <SidebarMenuSubItem>
                                                    <SidebarMenuSubButton
                                                        onClick={() => router.push("/catalog")}
                                                        className="cursor-pointer font-[k-regular]"
                                                    >
                                                        <PlusCircle className="size-3.5" />
                                                        <span>ลงรายการใหม่</span>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            </SidebarMenuSub>
                                        )}
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>

                        <SidebarSeparator className="my-2" />

                        {/* กลุ่มเมนู: จัดการและรายงาน */}
                        <SidebarGroup>
                            <SidebarGroupLabel className="font-[k-medium] text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
                                รายงาน & การตั้งค่า
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                     <SidebarMenuItem>
                                        <SidebarMenuButton
                                            onClick={() => router.push("/history")}
                                            tooltip="ประวัติการลงรายการ"
                                            className="cursor-pointer font-[k-regular]"
                                        >
                                            <History className="size-4" />
                                            <span>ประวัติการลงรายการ</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>

                    {/* ส่วนท้าย (Footer) แสดง ID และข้อมูลผู้ใช้งานที่กำลัง Login พร้อมเมนู Dropdown */}
                    <SidebarFooter className="border-t border-sidebar-border p-2">
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <DropdownMenu>
                                    <DropdownMenuTrigger
                                        render={
                                            <SidebarMenuButton
                                                size="lg"
                                                className="w-full cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                            >
                                                <div className="relative">
                                                    <Avatar className="size-8 rounded-lg border border-sidebar-border">
                                                        <AvatarImage src={user?.avatar} alt={user?.last_name || user?.username} />
                                                        <AvatarFallback suppressHydrationWarning className="rounded-lg bg-primary/10 text-primary font-[k-medium] text-xs">
                                                            {user?.initials || user?.username?.slice(0, 2).toUpperCase() || "LI"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    {/* สถานะ Online (จุดสีเขียว) */}
                                                    <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
                                                </div>

                                                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                                                    <span className="truncate font-semibold font-[k-medium] text-[13px] flex items-center gap-1.5">
                                                        <span suppressHydrationWarning>{user?.last_name || "กำลังโหลด..."}</span>
                                                        {isRole1 ? (
                                                            <span className="text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/30">
                                                                Role 1
                                                            </span>
                                                        ) : (
                                                            <span className="text-[9px] font-mono bg-muted text-muted-foreground px-1.5 py-0.2 rounded border">
                                                                Role 0
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span suppressHydrationWarning className="truncate text-xs font-[k-regular] text-gray-500">
                                                        {user?.username || "กำลังโหลด..."}
                                                    </span>
                                                </div>

                                                <ChevronsUpDown className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                                            </SidebarMenuButton>
                                        }
                                    />

                                    {/* เมนูเมื่อกดที่ Footer Profile */}
                                    <DropdownMenuContent
                                        className="w-64 rounded-lg p-2"
                                        side="top"
                                        align="start"
                                        sideOffset={8}
                                    >
                                        <div className="flex items-center gap-3 p-2">
                                            <Avatar className="size-10 rounded-lg border">
                                                <AvatarImage src={user?.avatar} alt={user?.last_name || user?.username} />
                                                <AvatarFallback suppressHydrationWarning className="rounded-lg bg-primary/10 text-primary font-[k-medium]">
                                                    {user?.initials || user?.username?.slice(0, 2).toUpperCase() || "LI"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="grid flex-1 text-left text-sm leading-tight">
                                                <span suppressHydrationWarning className="font-semibold font-[k-medium] text-[14px]">
                                                    {user?.last_name || "กำลังโหลด..."}
                                                </span>
                                                <span suppressHydrationWarning className="text-xs text-muted-foreground font-[k-regular]">
                                                    {user?.username || "กำลังโหลด..."}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="px-2 py-1.5 bg-muted/50 rounded-md my-1 text-xs">
                                            <div className="flex items-center gap-1.5 text-muted-foreground font-[k-light]">
                                                {isRole1 ? (
                                                    <>
                                                        <ShieldCheck className="size-3.5 text-emerald-600" />
                                                        <span>สถานะ: <strong className="text-emerald-600 font-[k-medium]">ผู้ดูแลระบบ (Role 1)</strong></span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <User className="size-3.5 text-blue-500" />
                                                        <span>สถานะ: <strong className="text-foreground font-[k-regular]">เจ้าหน้าที่ทั่วไป (Role 0)</strong></span>
                                                    </>
                                                )}
                                            </div>
                                            <div className="text-[11px] text-muted-foreground font-[k-light] mt-0.5 pl-5">
                                                {isRole1 ? "สิทธิ์: ลบข้อมูล, แก้ไข, กดตรวจสอบ" : "สิทธิ์: บันทึกข้อมูลและดูรายการ"}
                                            </div>
                                        </div>

                                        <DropdownMenuSeparator />

                                        <DropdownMenuItem
                                            onClick={() => {
                                                const logoutPromise = new Promise<string>((resolve) => {
                                                    setTimeout(() => {
                                                        localStorage.removeItem("token")
                                                        resolve("ออกจากระบบเรียบร้อยแล้ว")
                                                        router.replace("/login")
                                                    }, 1000)
                                                })

                                                toast.promise(logoutPromise, {
                                                    loading: "กำลังออกจากระบบ...",
                                                    success: (msg: string) => msg,
                                                    error: () => "ไม่สามารถออกจากระบบได้"
                                                })
                                            }}
                                            variant="destructive"
                                            className="cursor-pointer font-[k-medium] text-sm text-destructive"
                                        >
                                            <LogOut className="mr-2 size-4" />
                                            <span>ออกจากระบบ (Logout)</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarFooter>

                    {/* รางด้านข้างสำหรับกดหรือลากเพื่อย่อ-ขยาย (SidebarRail) */}
                    <SidebarRail />
                </Sidebar>

                {/* Main Content Area */}
                <SidebarInset className="flex flex-col flex-1 min-w-0">
                    {/* Top Bar Navigation */}
                    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background/95 px-4 backdrop-blur-sm sm:px-6">
                        <div className="flex items-center gap-3">
                            <SidebarTrigger className="-ml-1 cursor-pointer" />
                            <div className="h-4 w-px bg-border" />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push("/catalog")}
                                className="font-[k-medium] text-xs cursor-pointer flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                            >
                                <ArrowLeft className="size-3.5" />
                                <span>กลับไปยังรายการหนังสือ</span>
                            </Button>
                            <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground font-[k-light]">
                                <span>/</span>
                                <span className="font-[k-medium] text-foreground truncate max-w-xs">
                                    {book?.title || "รายละเอียดหนังสือ"}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {book && (
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "font-[k-medium] text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5",
                                        book.status === "เสร็จสิ้น"
                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                    )}
                                >
                                    {book.status === "เสร็จสิ้น" ? (
                                        <CheckCircle2 className="size-3.5 text-emerald-500" />
                                    ) : (
                                        <Clock className="size-3.5 text-amber-500" />
                                    )}
                                    <span>สถานะ: {book.status}</span>
                                </Badge>
                            )}

                        </div>
                    </header>

                    {/* Page Body */}
                    <main className="flex-1 p-4 md:p-6 lg:p-8">
                        {loading ? (
                            <div className="mx-auto max-w-5xl flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
                                <Loader2 className="size-8 animate-spin text-primary" />
                                <p className="font-[k-medium] text-sm">กำลังโหลดข้อมูลรายละเอียดหนังสือ...</p>
                            </div>
                        ) : error || !book ? (
                            <div className="mx-auto max-w-lg rounded-2xl border bg-card p-8 text-center shadow-xs">
                                <div className="mx-auto size-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
                                    <Info className="size-7" />
                                </div>
                                <h3 className="font-[k-medium] text-lg text-foreground mb-1">ไม่พบข้อมูลหนังสือ</h3>
                                <p className="font-[k-light] text-sm text-muted-foreground mb-6">
                                    {error || "หนังสือที่คุณกำลังค้นหาอาจถูกลบหรือไม่มีอยู่ในฐานข้อมูล"}
                                </p>
                                <Button onClick={() => router.push("/catalog")} className="font-[k-medium] cursor-pointer">
                                    <ArrowLeft className="size-4 mr-2" />
                                    กลับไปยังหน้ารายการหนังสือ
                                </Button>
                            </div>
                        ) : (
                            <div className="mx-auto max-w-5xl space-y-6">
                                {/* Book Hero Overview Card */}
                                <div className="rounded-2xl border bg-card p-5 md:p-6 shadow-sm overflow-hidden relative">
                                    <div className="flex flex-col md:flex-row gap-6 items-start">
                                        {/* Book Cover / Icon Visual */}
                                        <div className="w-full sm:w-44 md:w-48 shrink-0 flex flex-col items-center">
                                            <div className="w-full aspect-3/4 rounded-xl bg-gradient-to-br from-purple-500/15 via-violet-500/10 to-primary/20 border-2 border-primary/20 flex flex-col items-center justify-between p-4 shadow-md relative overflow-hidden">

                                                <div className="my-auto flex flex-col items-center text-center p-2">
                                                    <BookOpen className="size-12 text-primary/80 mb-2" />
                                                    <p className="font-[k-medium] text-xs text-foreground line-clamp-3 leading-snug">
                                                        {book.title}
                                                    </p>
                                                    <p className="font-[k-light] text-[11px] text-muted-foreground mt-1 line-clamp-1">
                                                        {book.author}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Book Details Summary */}
                                        <div className="flex-1 min-w-0 space-y-4">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    <Badge variant="outline" className="font-mono text-xs text-primary bg-primary/5 border-primary/30">
                                                        ID:{book.bibid}
                                                    </Badge>
                                                    <Badge variant="outline" className="font-[k-medium] text-xs text-muted-foreground">
                                                        {book.material}
                                                    </Badge>
                                                </div>

                                                <h1 className="font-[k-medium] text-2xl md:text-3xl text-foreground font-bold tracking-tight">
                                                    {book.title}
                                                </h1>

                                                {book.author && (
                                                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground font-[k-regular]">
                                                        <User className="size-4 text-primary" />
                                                        <span>ผู้แต่ง / ผู้รับผิดชอบ:</span>
                                                        <span className="font-[k-medium] text-foreground">{book.author}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Key Specifications Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3.5 rounded-xl bg-muted/40 border text-xs">
                                                <div>
                                                    <span className="text-muted-foreground font-[k-light] block">เลขเรียกหนังสือ</span>
                                                    <span className="font-mono font-bold text-foreground text-sm">
                                                        {[book.call_nmbr1, book.call_nmbr2, book.call_nmbr3].filter(Boolean).join(" ") || "-"}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground font-[k-light] block">ISBN</span>
                                                    <span className="font-mono font-medium text-foreground text-sm">
                                                        {book.marc.isbn || "-"}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground font-[k-light] block">จำนวนเล่มในระบบ (Copies):</span>
                                                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm flex items-center gap-1 mt-0.5">
                                                        <Copy className="size-3.5" />
                                                        <span>{book.copyCount} เล่ม</span>
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground font-[k-light] block">สถานที่จัดเก็บ:</span>
                                                    <span className="font-[k-medium] text-foreground">{book.collection}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground font-[k-light] block">วันที่ลงรายการ:</span>
                                                    <span className="font-[k-regular] text-foreground">{formatDate(book.create_dt)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground font-[k-light] block">ผู้ลงรายการ:</span>
                                                    <span className="font-[k-medium] text-foreground">{book.staffName}</span>
                                                </div>
                                            </div>

                                            {/* Action Buttons Row */}
                                            <div className="pt-2 flex flex-wrap items-center gap-2.5">
                                                {isRole1 && (
                                                    book.status === "รอตรวจสอบ" ? (
                                                        <Button
                                                            onClick={handleToggleStatus}
                                                            disabled={isUpdatingStatus}
                                                            className="font-[k-medium] text-xs cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                                                        >
                                                            {isUpdatingStatus ? (
                                                                <Loader2 className="size-3.5 animate-spin mr-1.5" />
                                                            ) : (
                                                                <CheckCircle2 className="size-3.5 mr-1.5" />
                                                            )}
                                                            <span>Approve</span>
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="outline"
                                                            onClick={handleToggleStatus}
                                                            disabled={isUpdatingStatus}
                                                            className="font-[k-medium] text-xs cursor-pointer text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10 border-amber-500/30"
                                                        >
                                                            {isUpdatingStatus ? (
                                                                <Loader2 className="size-3.5 animate-spin mr-1.5" />
                                                            ) : (
                                                                <RotateCcw className="size-3.5 mr-1.5" />
                                                            )}
                                                            <span>ส่งกลับไปรอตรวจสอบ</span>
                                                        </Button>
                                                    )
                                                )}

                                                {isRole1 && (
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setIsEditModalOpen(true)}
                                                        className="font-[k-medium] text-xs cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                                                    >
                                                        <Pencil className="size-3.5 mr-1.5" />
                                                        <span>แก้ไข</span>
                                                    </Button>
                                                )}

                                                <Button
                                                    variant="ghost"
                                                    onClick={() => handleCopy(window.location.href, "ลิงก์หน้านี้")}
                                                    className="font-[k-medium] text-xs cursor-pointer text-muted-foreground"
                                                >
                                                    <Share2 className="size-3.5 mr-1.5" />
                                                    <span>แชร์ลิงก์</span>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tabbed Navigation */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-1.5 border-b pb-2 overflow-x-auto">
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab("bibliographic")}
                                            className={cn(
                                                "px-4 py-2 rounded-lg font-[k-medium] text-sm cursor-pointer transition-all flex items-center gap-2 whitespace-nowrap",
                                                activeTab === "bibliographic"
                                                    ? "bg-primary text-primary-foreground shadow-xs font-bold"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                            )}
                                        >
                                            <Bookmark className="size-4" />
                                            <span>ข้อมูลทางบรรณานุกรม</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setActiveTab("copies")}
                                            className={cn(
                                                "px-4 py-2 rounded-lg font-[k-medium] text-sm cursor-pointer transition-all flex items-center gap-2 whitespace-nowrap",
                                                activeTab === "copies"
                                                    ? "bg-primary text-primary-foreground shadow-xs font-bold"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                            )}
                                        >
                                            <Copy className="size-4" />
                                            <span>COPIES</span>
                                        </button>
                                    </div>

                                    {/* Tab 1: ข้อมูลทางบรรณานุกรม (Bibliographic Details) */}
                                    {activeTab === "bibliographic" && (
                                        <div className="space-y-4">
                                            {/* ข้อมูลการพิมพ์และการจัดจำหน่าย */}
                                            <div className="rounded-xl border bg-card p-5 shadow-2xs space-y-4">
                                                <div className="flex items-center gap-2 border-b pb-3">
                                                    <Building2 className="size-4 text-primary" />
                                                    <h3 className="font-[k-medium] text-base text-foreground">
                                                        ข้อมูลการจัดพิมพ์และจำหน่าย
                                                    </h3>
                                                    <Badge variant="secondary" className="font-mono text-[11px] ml-auto">
                                                        MARC 260
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div className="space-y-1">
                                                        <span className="text-xs text-muted-foreground font-[k-light] block">สำนักพิมพ์</span>
                                                        <span className="font-[k-medium] text-foreground text-blue-600 dark:text-blue-400">
                                                            {book.marc.publisher || "-"}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-xs text-muted-foreground font-[k-light] block">สถานที่พิมพ์</span>
                                                        <span className="font-[k-medium] text-foreground">
                                                            {book.marc.publicationPlace || "-"}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-xs text-muted-foreground font-[k-light] block">ปีที่พิมพ์</span>
                                                        <span className="font-mono font-medium text-foreground">
                                                            {book.marc.publicationYear || "-"}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-xs text-muted-foreground font-[k-light] block">ครั้งที่พิมพ์</span>
                                                        <span className="font-[k-medium] text-foreground">
                                                            {book.marc.edition || "-"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ลักษณะทางกายภาพ */}
                                            <div className="rounded-xl border bg-card p-5 shadow-2xs space-y-4">
                                                <div className="flex items-center gap-2 border-b pb-3">
                                                    <Layers className="size-4 text-primary" />
                                                    <h3 className="font-[k-medium] text-base text-foreground">
                                                        ลักษณะทางกายภาพ
                                                    </h3>
                                                    <Badge variant="secondary" className="font-mono text-[11px] ml-auto">
                                                        MARC 300
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                                                    <div className="space-y-1">
                                                        <span className="text-xs text-muted-foreground font-[k-light] block">จำนวนหน้า</span>
                                                        <span className="font-[k-medium] text-foreground">
                                                            {book.marc.physicalExtent || "-"}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-xs text-muted-foreground font-[k-light] block">ภาพประกอบ</span>
                                                        <span className="font-[k-medium] text-foreground">
                                                            {book.marc.physicalFormat || "-"}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-xs text-muted-foreground font-[k-light] block">ขนาดตัวเล่ม</span>
                                                        <span className="font-[k-medium] text-foreground">
                                                            {book.marc.physicalSize || "-"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* หัวเรื่องและคำสำคัญ */}
                                            <div className="rounded-xl border bg-card p-5 shadow-2xs space-y-4">
                                                <div className="flex items-center gap-2 border-b pb-3">
                                                    <Tag className="size-4 text-primary" />
                                                    <h3 className="font-[k-medium] text-base text-foreground">
                                                        หัวเรื่องและคำสำคัญ
                                                    </h3>
                                                    <Badge variant="secondary" className="font-mono text-[11px] ml-auto">
                                                        MARC 650
                                                    </Badge>
                                                </div>

                                                {book.marc.subjects.length > 0 ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {book.marc.subjects.map((sub, i) => (
                                                            <Badge
                                                                key={i}
                                                                variant="outline"
                                                                className="font-[k-medium] text-xs px-3 py-1 bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20"
                                                            >
                                                                <Tag className="size-3 mr-1 text-purple-500" />
                                                                <span>{sub}</span>
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="font-[k-light] text-xs text-muted-foreground">
                                                        ไม่มีข้อมูลหัวเรื่อง
                                                    </p>
                                                )}
                                            </div>

                                            {/* ผู้แต่งร่วม */}
                                            {book.marc.coAuthors.length > 0 && (
                                                <div className="rounded-xl border bg-card p-5 shadow-2xs space-y-4">
                                                    <div className="flex items-center gap-2 border-b pb-3">
                                                        <User className="size-4 text-primary" />
                                                        <h3 className="font-[k-medium] text-base text-foreground">
                                                            ผู้แต่งร่วม
                                                        </h3>
                                                        <Badge variant="secondary" className="font-mono text-[11px] ml-auto">
                                                            MARC 700
                                                        </Badge>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {book.marc.coAuthors.map((ca, i) => (
                                                            <Badge key={i} variant="outline" className="font-[k-medium] text-xs px-2.5 py-1">
                                                                {ca}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* บทคัดย่อ / สาระสังเขป */}
                                            {book.marc.summary && (
                                                <div className="rounded-xl border bg-card p-5 shadow-2xs space-y-3">
                                                    <div className="flex items-center gap-2 border-b pb-3">
                                                        <FileText className="size-4 text-primary" />
                                                        <h3 className="font-[k-medium] text-base text-foreground">
                                                            สาระสังเขป / เรื่องย่อ (Summary / Abstract)
                                                        </h3>
                                                        <Badge variant="secondary" className="font-mono text-[11px] ml-auto">
                                                            MARC 520
                                                        </Badge>
                                                    </div>
                                                    <p className="font-[k-light] text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                                                        {book.marc.summary}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Tab 2: ทะเบียนตัวเล่มและบาร์โค้ด (Copies & Inventory) */}
                                    {activeTab === "copies" && (
                                        <div className="space-y-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl bg-card border">
                                                <div>
                                                    <h3 className="font-[k-medium] text-base text-foreground flex items-center gap-2">
                                                        <span>ทะเบียนตัวเล่มของชื่อเรื่องนี้</span>
                                                        <Badge variant="outline" className="font-mono text-xs text-blue-600 bg-blue-500/10 border-blue-500/30">
                                                            {book.copyCount} เล่ม
                                                        </Badge>
                                                    </h3>
                                                    <p className="font-[k-light] text-xs text-muted-foreground mt-0.5">
                                                        หนังสือแต่ละฉบับจะได้รับหมายเลขบาร์โค้ดเฉพาะตัวเพื่อใช้ในการบริการยืม-คืนในระบบ OpenBiblio
                                                    </p>
                                                </div>

                                                <Button
                                                    size="sm"
                                                    onClick={() => setIsAddCopyOpen(true)}
                                                    className="font-[k-medium] text-xs cursor-pointer shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
                                                >
                                                    <PlusCircle className="size-4 mr-1.5" />
                                                    เพิ่มตัวเล่ม (ฉบับถัดไป)
                                                </Button>
                                            </div>

                                            {/* Copies Table */}
                                            <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left text-sm">
                                                        <thead className="bg-muted/50 text-xs font-[k-medium] text-muted-foreground">
                                                            <tr>
                                                                <th className="px-4 py-3">Copy</th>
                                                                <th className="px-4 py-3">Barcode</th>
                                                                <th className="px-4 py-3">ผู้ลงรายการ</th>
                                                                <th className="px-4 py-3">สถานะตัวเล่ม</th>
                                                                <th className="px-4 py-3">วันที่ขึ้นทะเบียน</th>
                                                                {isRole1 && <th className="px-4 py-3 text-center">จัดการ</th>}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-border font-[k-regular]">
                                                            {book.copies.map((c) => (
                                                                <tr key={c.copyid} className="hover:bg-muted/30 transition-colors">
                                                                    <td className="px-4 py-3 font-mono font-medium text-xs">
                                                                        <Badge variant="outline" className="bg-muted/60">
                                                                            {c.copyid}
                                                                        </Badge>
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        <div className="flex items-center gap-2">
                                                                            <Barcode className="size-4 text-primary" />
                                                                            <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                                                                                {c.barcode_nmbr}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                                                                        <div className="flex items-center gap-2">
                                                                            <div>
                                                                                <span className="font-[k-medium] text-foreground block">
                                                                                    {c.staffName || "เจ้าหน้าที่"}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        <Badge
                                                                            variant="outline"
                                                                            className={cn(
                                                                                "font-[k-medium] text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1",
                                                                                c.status_cd === "in"
                                                                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                                                                    : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                                                                            )}
                                                                        >
                                                                            {c.status_cd === "in" ? (
                                                                                <>
                                                                                    <CheckCircle2 className="size-3 text-emerald-500" />
                                                                                    <span>อยู่บนชั้น (In Library)</span>
                                                                                </>
                                                                            ) : (
                                                                            <>
                                                                                <Clock className="size-3 text-red-500" />
                                                                                <span>ยืมออก (Checked Out)</span>
                                                                            </>
                                                                            )}
                                                                        </Badge>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-xs text-muted-foreground">
                                                                        {formatDate(c.create_dt)}
                                                                    </td>
                                                                    {isRole1 && (
                                                                        <td className="px-4 py-3 text-center">
                                                                            <Button
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                onClick={() => {
                                                                                    setCopyToDelete(c)
                                                                                    setIsDeleteCopyOpen(true)
                                                                                }}
                                                                                className="size-8 p-0 cursor-pointer text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                                                title={`ลบตัวเล่มฉบับที่ ${c.copyid} (Barcode: ${c.barcode_nmbr})`}
                                                                            >
                                                                                <Trash2 className="size-4 text-red-500" />
                                                                            </Button>
                                                                        </td>
                                                                    )}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tab 3: ตารางระเบียน MARC 21 (Full MARC 21 Record) */}
                                    {activeTab === "marc" && (
                                        <div className="space-y-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl bg-card border">
                                                <div>
                                                    <h3 className="font-[k-medium] text-base text-foreground flex items-center gap-2">
                                                        <span>ระเบียนบรรณานุกรมตามมาตรฐาน MARC 21</span>
                                                        <Badge variant="outline" className="font-mono text-xs">
                                                            {book.fields.length} เขตข้อมูล
                                                        </Badge>
                                                    </h3>
                                                    <p className="font-[k-light] text-xs text-muted-foreground mt-0.5">
                                                        แสดงข้อมูลโครงสร้างตามมาตรฐานการลงรายการบรรณานุกรมสากล Machine-Readable Cataloging (MARC 21)
                                                    </p>
                                                </div>

                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        const rawMarc = book.fields
                                                            .map(f => `${String(f.tag).padStart(3, "0")} ${f.ind1_cd || " "} ${f.ind2_cd || " "} $${f.subfield_cd} ${f.field_data}`)
                                                            .join("\n")
                                                        handleCopy(rawMarc, "ข้อมูล MARC 21 ทั้งหมด")
                                                    }}
                                                    className="font-[k-medium] text-xs cursor-pointer"
                                                >
                                                    <Copy className="size-3.5 mr-1.5" />
                                                    คัดลอกระเบียน MARC ทั้งหมด
                                                </Button>
                                            </div>

                                            <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left text-sm">
                                                        <thead className="bg-muted/50 text-xs font-[k-medium] text-muted-foreground">
                                                            <tr>
                                                                <th className="px-4 py-3 font-mono">Tag</th>
                                                                <th className="px-3 py-3 font-mono text-center">Ind 1</th>
                                                                <th className="px-3 py-3 font-mono text-center">Ind 2</th>
                                                                <th className="px-3 py-3 font-mono text-center">Subfield</th>
                                                                <th className="px-4 py-3">ข้อมูลในเขตข้อมูล (Field Data)</th>
                                                                <th className="px-4 py-3">ชื่อเขตข้อมูล (Description)</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-border">
                                                            {book.fields.length === 0 ? (
                                                                <tr>
                                                                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground font-[k-light]">
                                                                        ยังไม่มีข้อมูลในตาราง biblio_field สำหรับหนังสือเล่มนี้
                                                                    </td>
                                                                </tr>
                                                            ) : (
                                                                book.fields.map((f, idx) => (
                                                                    <tr key={idx} className="hover:bg-muted/30 transition-colors font-mono text-xs">
                                                                        <td className="px-4 py-2.5 font-bold text-primary">
                                                                            {String(f.tag).padStart(3, "0")}
                                                                        </td>
                                                                        <td className="px-3 py-2.5 text-center text-muted-foreground">
                                                                            {f.ind1_cd === "N" || !f.ind1_cd ? "#" : f.ind1_cd}
                                                                        </td>
                                                                        <td className="px-3 py-2.5 text-center text-muted-foreground">
                                                                            {f.ind2_cd === "N" || !f.ind2_cd ? "#" : f.ind2_cd}
                                                                        </td>
                                                                        <td className="px-3 py-2.5 text-center font-bold text-amber-600 dark:text-amber-400">
                                                                            ${f.subfield_cd}
                                                                        </td>
                                                                        <td className="px-4 py-2.5 font-[k-medium] text-foreground text-sm font-sans">
                                                                            {f.field_data}
                                                                        </td>
                                                                        <td className="px-4 py-2.5 font-[k-light] text-muted-foreground text-xs font-sans">
                                                                            {f.tagName}
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tab 4: ประวัติและระบบ (History & System Metadata) */}
                                    {activeTab === "history" && (
                                        <div className="rounded-xl border bg-card p-5 shadow-2xs space-y-4">
                                            <div className="flex items-center gap-2 border-b pb-3">
                                                <History className="size-4 text-primary" />
                                                <h3 className="font-[k-medium] text-base text-foreground">
                                                    ข้อมูลประวัติและการบันทึกในฐานข้อมูล
                                                </h3>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                                <div className="p-3.5 rounded-lg bg-muted/30 border space-y-1">
                                                    <span className="text-xs text-muted-foreground font-[k-light] block">BibID</span>
                                                    <span className="font-mono font-bold text-base text-primary">#{book.bibid}</span>
                                                </div>
                                                <div className="p-3.5 rounded-lg bg-muted/30 border space-y-1">
                                                    <span className="text-xs text-muted-foreground font-[k-light] block">สถานะการตรวจสอบ:</span>
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "font-[k-medium] text-xs",
                                                            book.status === "เสร็จสิ้น"
                                                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                                                : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                                        )}
                                                    >
                                                        {book.status}
                                                    </Badge>
                                                </div>
                                                <div className="p-3.5 rounded-lg bg-muted/30 border space-y-1">
                                                    <span className="text-xs text-muted-foreground font-[k-light] block">วันที่สร้างระเบียน</span>
                                                    <span className="font-[k-regular] text-foreground">{formatDate(book.create_dt)}</span>
                                                </div>
                                                <div className="p-3.5 rounded-lg bg-muted/30 border space-y-1">
                                                    <span className="text-xs text-muted-foreground font-[k-light] block">วันที่แก้ไขล่าสุด</span>
                                                    <span className="font-[k-regular] text-foreground">{formatDate(book.last_change_dt)}</span>
                                                </div>
                                                <div className="p-3.5 rounded-lg bg-muted/30 border space-y-1">
                                                    <span className="text-xs text-muted-foreground font-[k-light] block">แก้ไขล่าสุด</span>
                                                    <span className="font-[k-medium] text-foreground">{book.staffName} (User ID: {book.last_change_userid})</span>
                                                </div>
                                                <div className="p-3.5 rounded-lg bg-muted/30 border space-y-1">
                                                    <span className="text-xs text-muted-foreground font-[k-light] block">การแสดงผลใน OPAC</span>
                                                    <span className="font-[k-medium] text-foreground">
                                                        {book.opac_flg === "Y" ? "เปิดใช้งาน (Yes)" : "ปิดการแสดงผล (No)"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* โซนอันตราย (Danger Zone - เฉพาะ Role 1) */}
                                    {isRole1 && (
                                        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 md:p-6 mt-6">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-destructive font-[k-medium] text-base">
                                                        <AlertTriangle className="size-5" />
                                                        <span>Danger Zone</span>
                                                    </div>
                                                    <p className="font-[k-light] text-xs text-muted-foreground max-w-xl">
                                                        ลบหนังสือและตัวเล่มทั้งหมด
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="destructive"
                                                    onClick={() => setIsDeleteDialogOpen(true)}
                                                    className="font-[k-medium] text-xs cursor-pointer shrink-0 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
                                                >
                                                    <Trash2 className="size-4" />
                                                    <span>ลบ</span>
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </main>
                </SidebarInset>
            </div>

            {/* Modal: Add New Copy */}
            <Dialog open={isAddCopyOpen} onOpenChange={setIsAddCopyOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-[k-medium] text-lg flex items-center gap-2">
                            <PlusCircle className="size-5 text-blue-600" />
                            <span>เพิ่มตัวเล่มใหม่</span>
                        </DialogTitle>
                        <DialogDescription className="font-[k-light] text-xs text-muted-foreground">
                            ระบบจะรันหมายเลขบาร์โค้ดลำดับถัดไปให้อัตโนมัติสำหรับหนังสือ &ldquo;{book?.title}&rdquo;
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleAddCopy} className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="copyDesc" className="font-[k-medium] text-sm">
                                รายละเอียดตัวเล่ม (ไม่บังคับ)
                            </Label>
                            <Input
                                id="copyDesc"
                                placeholder={`เช่น ฉบับที่ ${(book?.copyCount || 0) + 1} หรือ เล่มบริจาค`}
                                value={newCopyDesc}
                                onChange={(e) => setNewCopyDesc(e.target.value)}
                                className="font-[k-regular] text-sm"
                            />
                            <p className="text-xs font-[k-light] text-muted-foreground">
                                หากไม่ระบุ ระบบจะใส่เป็น &ldquo;ฉบับที่ {(book?.copyCount || 0) + 1}&rdquo; ให้อัตโนมัติ
                            </p>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsAddCopyOpen(false)}
                                className="font-[k-regular] cursor-pointer"
                            >
                                ยกเลิก
                            </Button>
                            <Button
                                type="submit"
                                disabled={isAddingCopy}
                                className="font-[k-medium] cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {isAddingCopy ? (
                                    <Loader2 className="size-4 animate-spin mr-1.5" />
                                ) : (
                                    <PlusCircle className="size-4 mr-1.5" />
                                )}
                                <span>ยืนยันการเพิ่มตัวเล่ม</span>
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal: QR Code Preview */}
            <Dialog open={!!selectedBarcode} onOpenChange={(open) => !open && setSelectedBarcode(null)}>
                <DialogContent className="sm:max-w-xs rounded-2xl text-center flex flex-col items-center">
                    <DialogHeader>
                        <DialogTitle className="font-[k-medium] text-base">
                            บาร์โค้ดตัวเล่ม
                        </DialogTitle>
                        <DialogDescription className="font-mono text-sm font-bold text-primary">
                            Barcode: {selectedBarcode}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedBarcode && (
                        <div className="p-4 bg-white rounded-xl shadow-xs border my-2">
                            <QRCode value={selectedBarcode} size={160} />
                        </div>
                    )}

                    <p className="font-[k-light] text-xs text-muted-foreground">
                        สแกน QR Code นี้เพื่อเข้าถึงข้อมูลตัวเล่มในระบบยืม-คืน
                    </p>

                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedBarcode(null)}
                        className="font-[k-medium] text-xs mt-2 cursor-pointer w-full"
                    >
                        ปิดหน้าต่าง
                    </Button>
                </DialogContent>
            </Dialog>

            {/* Modal: Delete Book Confirmation */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-2 mx-auto sm:mx-0">
                            <Trash2 className="size-6" />
                        </div>
                        <DialogTitle className="font-[k-medium] text-lg text-destructive">
                            ยืนยันการลบหนังสือและฉบับทั้งหมด?
                        </DialogTitle>
                        <DialogDescription className="font-[k-regular] text-sm text-muted-foreground pt-1">
                            คุณแน่ใจหรือไม่ว่าต้องการลบหนังสือเล่มนี้ออกจากระบบ?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-2 text-sm font-[k-regular]">
                        <div className="rounded-xl border bg-muted/40 p-3.5 space-y-2">
                            <div className="font-[k-medium] text-foreground text-sm line-clamp-2">
                                {book?.title}
                            </div>
                            <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                                <span>ผู้แต่ง: <strong className="text-foreground">{book?.author}</strong></span>
                                <span>•</span>
                                <span>ISBN: <strong className="font-mono text-foreground">{book?.marc?.isbn || "-"}</strong></span>
                            </div>
                            <div className="text-xs text-amber-600 dark:text-amber-400 font-[k-medium] flex items-center gap-1.5 pt-1 border-t border-border/50">
                                <Copy className="size-3.5 shrink-0" />
                                <span>ตัวเล่ม (Copies) ที่จะถูกลบทั้งหมด: <strong>{book?.copies?.length || 0} เล่ม</strong></span>
                            </div>
                            {book?.copies && book.copies.length > 0 && (
                                <div className="text-[11px] font-mono text-muted-foreground bg-background/60 p-2 rounded border">
                                    บาร์โค้ด: {book.copies.map((c: any) => c.barcode_nmbr).join(", ")}
                                </div>
                            )}
                        </div>

                        <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
                            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                            <span>
                                <strong>คำเตือน:</strong> การลบหนังสือเล่มนี้จะลบตัวเล่ม (Copies) ทั้งหมดและรายการที่เกี่ยวข้องอย่างถาวร ไม่สามารถกู้คืนข้อมูลได้
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            disabled={isDeleting}
                            className="font-[k-regular] text-xs cursor-pointer"
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteBook}
                            disabled={isDeleting}
                            className="font-[k-medium] text-xs cursor-pointer flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin" />
                                    <span>กำลังลบข้อมูล...</span>
                                </>
                            ) : (
                                <>
                                    <Trash2 className="size-3.5" />
                                    <span>ยืนยันการลบหนังสือ</span>
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal: Delete Copy Confirmation */}
            <Dialog open={isDeleteCopyOpen} onOpenChange={setIsDeleteCopyOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-2 mx-auto sm:mx-0">
                            <Trash2 className="size-6" />
                        </div>
                        <DialogTitle className="font-[k-medium] text-lg text-destructive">
                            {book?.copies && book.copies.length === 1
                                ? "ยืนยันการลบตัวเล่มฉบับสุดท้าย (และลบหนังสือ)?"
                                : "ยืนยันการลบตัวเล่มนี้?"}
                        </DialogTitle>
                        <DialogDescription className="font-[k-regular] text-sm text-muted-foreground pt-1">
                            {book?.copies && book.copies.length === 1
                                ? "หนังสือเล่มนี้มีตัวเล่มเหลืออยู่เพียง 1 ฉบับ หากลบออก รายการหนังสือจะถูกลบออกจากระบบด้วย"
                                : "คุณแน่ใจหรือไม่ว่าต้องการลบตัวเล่มฉบับนี้ออกจากระบบ?"}
                        </DialogDescription>
                    </DialogHeader>

                    {copyToDelete && (
                        <div className="space-y-3 py-2 text-sm font-[k-regular]">
                            <div className="rounded-xl border bg-muted/40 p-3.5 space-y-2">
                                <div className="font-[k-medium] text-foreground text-sm line-clamp-2">
                                    {book?.title}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/50">
                                    <div>
                                        <span className="text-muted-foreground block font-[k-light]">ฉบับที่ (Copy):</span>
                                        <span className="font-mono font-bold text-foreground">ฉบับที่ {copyToDelete.copyid}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block font-[k-light]">หมายเลขบาร์โค้ด:</span>
                                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{copyToDelete.barcode_nmbr}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block font-[k-light]">ผู้ลงรายการ:</span>
                                        <span className="text-foreground">{copyToDelete.staffName || "เจ้าหน้าที่"}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block font-[k-light]">สถานะตัวเล่ม:</span>
                                        <span className={copyToDelete.status_cd === "in" ? "text-emerald-600 font-[k-medium]" : "text-red-500 font-[k-medium]"}>
                                            {copyToDelete.status_cd === "in" ? "อยู่บนชั้น (In Library)" : "ยืมออก (Checked Out)"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {book?.copies && book.copies.length === 1 ? (
                                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                                    <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                                    <span>
                                        <strong>คำเตือนพิเศษ:</strong> ตัวเล่มนี้เป็น<strong>ฉบับสุดท้าย</strong>ของหนังสือเล่มนี้ หากลบออก ระบบจะ<strong>ลบหนังสือเล่มนี้ออกจากระบบด้วยโดยอัตโนมัติ</strong> เนื่องจากไม่มีตัวเล่มคงเหลืออยู่ในห้องสมุด
                                    </span>
                                </div>
                            ) : (
                                <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
                                    <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                                    <span>
                                        <strong>คำเตือน:</strong> ตัวเล่มและหมายเลขบาร์โค้ดนี้จะถูกลบออกจากระบบอย่างถาวร ข้อมูลหนังสือหลักและฉบับอื่นจะยังคงอยู่
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteCopyOpen(false)}
                            disabled={isDeletingCopy}
                            className="font-[k-regular] text-xs cursor-pointer"
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteCopy}
                            disabled={isDeletingCopy}
                            className="font-[k-medium] text-xs cursor-pointer flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isDeletingCopy ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin" />
                                    <span>กำลังลบ...</span>
                                </>
                            ) : (
                                <>
                                    <Trash2 className="size-3.5" />
                                    <span>{book?.copies && book.copies.length === 1 ? "ยืนยันการลบตัวเล่มและหนังสือ" : "ยืนยันการลบตัวเล่ม"}</span>
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal แก้ไขข้อมูลหนังสือ (เฉพาะ Role 1) */}
            <EditBookDialog
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                bibid={book?.bibid || null}
                onSuccess={fetchBook}
            />
        </SidebarProvider>
    )
}

