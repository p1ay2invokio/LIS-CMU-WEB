"use client"

import React, { useEffect, useState, useMemo, useCallback } from "react"
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
import { Input } from "@/components/ui/input"
import {
    BookOpen,
    BookPlus,
    PlusCircle,
    ChevronDown,
    ChevronsUpDown,
    ShieldCheck,
    User,
    LogOut,
    History,
    Search,
    Calendar,
    CheckCircle2,
    Clock,
    Copy,
    Barcode,
    ArrowLeft,
    RefreshCw,
    Printer,
    ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface HistoryItem {
    bibid: number
    copyid: number
    id: string
    copyBadge: string
    title: string
    author: string
    isbn: string
    callNumber: string
    category: string
    collection: string
    status: string
    barcode: string
    copyDesc: string
    staffId: number
    staffName: string
    staffUsername: string
    createDate: string
    copyCreateDate: string
    biblioCreateDate: string
}

interface HistoryStats {
    todayCount: number
    weekCount: number
    monthCount: number
    totalCount: number
    pendingCount: number
    completedCount: number
}

interface StaffInfo {
    userid: number
    username: string
    name: string
    firstName?: string
}

export default function HistoryPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const isRole1 = Boolean(user && (Number(user.role) === 1 || user.role === 1 || user.role === "1"))
    const [staffInfo, setStaffInfo] = useState<StaffInfo | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
    const [stats, setStats] = useState<HistoryStats>({
        todayCount: 0,
        weekCount: 0,
        monthCount: 0,
        totalCount: 0,
        pendingCount: 0,
        completedCount: 0,
    })

    // Search and Filter States
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all")
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
    const [isCatalogSubMenuOpen, setIsCatalogSubMenuOpen] = useState<boolean>(false)

    // Load History Data: decode token from storage -> send userid to backend
    const loadHistory = useCallback(async (explicitUserId?: number) => {
        try {
            setIsRefreshing(true)
            let uid = explicitUserId

            if (!uid) {
                const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
                if (token) {
                    try {
                        const decoded: any = jwtDecode(token)
                        uid = decoded?.userid
                        setUser(decoded)
                    } catch {
                        // ignore
                    }
                }
            }

            if (!uid) {
                setLoading(false)
                setIsRefreshing(false)
                return
            }

            const playbook = new PlayBook()
            const res = await playbook.getHistory(uid)

            if (res && res.success) {
                setHistoryItems(res.history || [])
                setStats(res.stats || {
                    todayCount: 0,
                    weekCount: 0,
                    monthCount: 0,
                    totalCount: 0,
                    pendingCount: 0,
                    completedCount: 0,
                })
                if (res.staffInfo) {
                    setStaffInfo(res.staffInfo)
                }
            }
        } catch (err: any) {
            console.error("Failed to fetch history:", err)
            toast.error(err?.response?.data?.message || "ไม่สามารถโหลดประวัติการลงรายการได้")
        } finally {
            setIsRefreshing(false)
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) {
            router.replace("/login")
            return
        }
        try {
            const decoded: any = jwtDecode(token)
            setUser(decoded)
            loadHistory(decoded.userid)
        } catch {
            router.replace("/login")
        }
    }, [loadHistory, router])

    const formatDateOnly = (isoString?: string) => {
        if (!isoString) return "-"
        try {
            const d = new Date(isoString)
            return d.toLocaleDateString("th-TH", {
                year: "numeric",
                month: "short",
                day: "numeric",
            })
        } catch {
            return isoString
        }
    }

    const formatTimeOnly = (isoString?: string) => {
        if (!isoString) return "-"
        try {
            const d = new Date(isoString)
            return d.toLocaleTimeString("th-TH", {
                hour: "2-digit",
                minute: "2-digit",
            }) + " น."
        } catch {
            return isoString
        }
    }

    // Filter Items
    const filteredItems = useMemo(() => {
        return historyItems.filter((item) => {
            // Search query filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim()
                const matchTitle = item.title?.toLowerCase().includes(q)
                const matchAuthor = item.author?.toLowerCase().includes(q)
                const matchIsbn = item.isbn?.toLowerCase().includes(q)
                const matchId = item.id?.toLowerCase().includes(q)
                const matchBarcode = item.barcode?.toLowerCase().includes(q)
                const matchCallNo = item.callNumber?.toLowerCase().includes(q)
                if (!matchTitle && !matchAuthor && !matchIsbn && !matchId && !matchBarcode && !matchCallNo) {
                    return false
                }
            }

            // Status filter
            if (statusFilter === "pending" && item.status !== "รอตรวจสอบ") return false
            if (statusFilter === "completed" && item.status !== "เสร็จสิ้น") return false

            return true
        })
    }, [historyItems, searchQuery, statusFilter])

    const displayName = staffInfo?.name || user?.last_name || user?.username || "เจ้าหน้าที่"
    const displayUsername = staffInfo?.username || user?.username || "-"

    return (
        <SidebarProvider>
            <Toaster position="top-center" richColors />
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
                                            isActive={true}
                                            tooltip="ประวัติการลงรายการ"
                                            className="cursor-pointer font-[k-medium]"
                                        >
                                            <History className="size-4 text-primary" />
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
                                                        <AvatarImage src={user?.avatar} alt={displayName} />
                                                        <AvatarFallback suppressHydrationWarning className="rounded-lg bg-primary/10 text-primary font-[k-medium] text-xs">
                                                            {user?.initials || displayName?.slice(0, 2).toUpperCase() || "LI"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    {/* สถานะ Online (จุดสีเขียว) */}
                                                    <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
                                                </div>

                                                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                                                    <span className="truncate font-semibold font-[k-medium] text-[13px] flex items-center gap-1.5">
                                                        <span suppressHydrationWarning>{displayName}</span>
                                                    </span>
                                                    <span suppressHydrationWarning className="truncate text-xs font-[k-regular] text-gray-500">
                                                        {displayUsername}
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
                                                <AvatarImage src={user?.avatar} alt={displayName} />
                                                <AvatarFallback suppressHydrationWarning className="rounded-lg bg-primary/10 text-primary font-[k-medium]">
                                                    {user?.initials || displayName?.slice(0, 2).toUpperCase() || "LI"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="grid flex-1 text-left text-sm leading-tight">
                                                <span suppressHydrationWarning className="font-semibold font-[k-medium] text-[14px]">
                                                    {displayName}
                                                </span>
                                                <span suppressHydrationWarning className="text-xs text-muted-foreground font-[k-regular]">
                                                    {displayUsername}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="px-2 py-1.5 bg-muted/50 rounded-md my-1 text-xs">
                                            <div className="flex items-center gap-1.5 text-muted-foreground font-[k-light]">
                                                <ShieldCheck className="size-3.5 text-emerald-600" />
                                                <span>สถานะ: <strong className="text-foreground font-[k-regular]">ฝ่าย IT</strong></span>
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

                {/* Main Content */}
                <SidebarInset className="flex flex-col flex-1 min-w-0">
                    {/* Header */}
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
                                <span>กลับไปหน้ารายการหนังสือ</span>
                            </Button>
                            <span className="text-muted-foreground text-xs">/</span>
                            <div className="flex items-center gap-2">
                                <History className="size-4 text-primary" />
                                <span className="font-[k-medium] text-sm text-foreground">
                                    ประวัติการลงรายการของฉัน
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => loadHistory(user?.userid)}
                                disabled={isRefreshing}
                                className="font-[k-medium] text-xs cursor-pointer flex items-center gap-1.5"
                                title="รีเฟรชข้อมูลประวัติ"
                            >
                                <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
                                <span className="hidden sm:inline">รีเฟรช</span>
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.print()}
                                className="font-[k-medium] text-xs cursor-pointer flex items-center gap-1.5"
                                title="พิมพ์รายงานประวัติ"
                            >
                                <Printer className="size-3.5" />
                                <span className="hidden sm:inline">พิมพ์</span>
                            </Button>
                        </div>
                    </header>

                    {/* Page Content: Table Only */}
                    <main className="flex-1 p-4 md:p-6 lg:p-8">
                        <div className="mx-auto max-w-6xl space-y-4">
                            {/* Filter & Search Toolbar */}
                            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                                {/* Search Input */}
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="ค้นหาตามชื่อเรื่อง, ผู้แต่ง, ISBN, บาร์โค้ด หรือเลขเรียก..."
                                        className="pl-9 h-9 text-sm font-[k-regular] bg-background"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                                        >
                                            ล้าง
                                        </button>
                                    )}
                                </div>

                                {/* Status Filters */}
                                <div className="flex items-center bg-muted/60 p-1 rounded-lg border text-xs font-[k-medium] self-start sm:self-auto">
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter("all")}
                                        className={cn(
                                            "px-2.5 py-1 rounded-md transition-all cursor-pointer",
                                            statusFilter === "all" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        ทั้งหมด ({historyItems.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter("pending")}
                                        className={cn(
                                            "px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1",
                                            statusFilter === "pending" ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 shadow-xs" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <Clock className="size-3 text-amber-500" />
                                        <span>รอตรวจสอบ ({stats.pendingCount})</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter("completed")}
                                        className={cn(
                                            "px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1",
                                            statusFilter === "completed" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 shadow-xs" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <CheckCircle2 className="size-3 text-emerald-500" />
                                        <span>เสร็จสิ้น ({stats.completedCount})</span>
                                    </button>
                                </div>
                            </div>

                            {/* Table */}
                            {loading ? (
                                <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground font-[k-light]">
                                    <div className="mx-auto size-8 animate-spin text-primary mb-3">
                                        <RefreshCw className="size-8" />
                                    </div>
                                    <p className="font-[k-medium] text-sm">กำลังโหลดประวัติการลงรายการของคุณ...</p>
                                </div>
                            ) : filteredItems.length === 0 ? (
                                <div className="rounded-xl border bg-card p-12 text-center space-y-4">
                                    <div className="mx-auto size-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                        <History className="size-7" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-[k-medium] text-base text-foreground">
                                            {searchQuery || statusFilter !== "all"
                                                ? "ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา"
                                                : "คุณยังไม่มีประวัติการลงรายการหนังสือ"}
                                        </h3>
                                        <p className="font-[k-light] text-xs text-muted-foreground max-w-md mx-auto">
                                            {searchQuery || statusFilter !== "all"
                                                ? "ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองเป็น 'ทั้งหมด' เพื่อดูรายการทั้งหมด"
                                                : "เมื่อคุณทำการลงรายการหนังสือใหม่ หรือเพิ่มฉบับ (Copy) ข้อมูลจะแสดงในตารางนี้โดยอัตโนมัติ"}
                                        </p>
                                    </div>
                                    {searchQuery || statusFilter !== "all" ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSearchQuery("")
                                                setStatusFilter("all")
                                            }}
                                            className="font-[k-medium] text-xs cursor-pointer"
                                        >
                                            ล้างการค้นหาและตัวกรอง
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => router.push("/catalog")}
                                            className="font-[k-medium] text-xs cursor-pointer flex items-center gap-2 mx-auto"
                                        >
                                            <BookPlus className="size-4" />
                                            <span>ไปที่หน้าลงรายการหนังสือ</span>
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-muted/50 text-xs font-[k-medium] text-muted-foreground border-b">
                                                <tr>
                                                    <th className="px-4 py-3">วัน-เวลาที่ลงรายการ</th>
                                                    <th className="px-4 py-3">ชื่อเรื่อง (Title)</th>
                                                    <th className="px-4 py-3 text-center">ตัวเล่ม / บาร์โค้ด</th>
                                                    <th className="px-4 py-3">ผู้แต่ง (Author)</th>
                                                    <th className="px-4 py-3">เลขเรียก (Call No.)</th>
                                                    <th className="px-4 py-3">สถานะ</th>
                                                    <th className="px-4 py-3 text-center w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {filteredItems.map((item, index) => (
                                                    <tr
                                                        key={`${item.bibid}-${item.copyid}-${index}`}
                                                        onClick={() => router.push(`/book/${item.bibid}`)}
                                                        className="hover:bg-muted/50 cursor-pointer transition-colors group"
                                                        title={`คลิกเพื่อดูรายละเอียด: ${item.title}`}
                                                    >
                                                        <td className="px-4 py-3 text-xs whitespace-nowrap">
                                                            <div className="font-[k-medium] text-foreground flex items-center gap-1.5">
                                                                <Calendar className="size-3.5 text-muted-foreground" />
                                                                <span>{formatDateOnly(item.createDate)}</span>
                                                            </div>
                                                            <div className="text-[11px] font-mono text-muted-foreground mt-0.5 ml-5">
                                                                {formatTimeOnly(item.createDate)}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 font-[k-medium] text-foreground max-w-xs">
                                                            <div className="font-[k-medium] text-foreground group-hover:text-primary transition-colors truncate">
                                                                {item.title}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground font-[k-light] flex items-center gap-1.5 mt-0.5">
                                                                <span className="font-mono text-[11px] text-primary bg-primary/10 px-1 rounded">
                                                                    {item.id}
                                                                </span>
                                                                <span>• {item.category}</span>
                                                                <span>• {item.collection}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center whitespace-nowrap">
                                                            <div className="inline-flex flex-col items-center">
                                                                <Badge
                                                                    variant="outline"
                                                                    className="font-mono text-xs px-2 py-0.5 font-medium flex items-center gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                                                                >
                                                                    <Copy className="size-3" />
                                                                    <span>{item.copyBadge}</span>
                                                                </Badge>
                                                                <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1 mt-0.5">
                                                                    <Barcode className="size-3 text-muted-foreground" />
                                                                    <span>BC: {item.barcode}</span>
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-muted-foreground font-[k-light] max-w-[160px] truncate">
                                                            {item.author}
                                                        </td>
                                                        <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                                                            {item.callNumber}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <Badge
                                                                variant="outline"
                                                                className={cn(
                                                                    "text-xs font-[k-medium] inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full",
                                                                    item.status === "เสร็จสิ้น"
                                                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                                                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                                                )}
                                                            >
                                                                {item.status === "เสร็จสิ้น" ? (
                                                                    <CheckCircle2 className="size-3 text-emerald-500" />
                                                                ) : (
                                                                    <Clock className="size-3 text-amber-500" />
                                                                )}
                                                                <span>{item.status}</span>
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <ChevronRight className="size-4 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all inline" />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    )
}
