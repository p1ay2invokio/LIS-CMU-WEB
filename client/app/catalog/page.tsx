'use client'

import * as React from "react"
import { useEffect, useState } from "react"
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
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import {
    BookOpen,
    BookPlus,
    Search,
    History,
    Settings,
    LogOut,
    User,
    ChevronsUpDown,
    Library,
    PlusCircle,
    FolderTree,
    Barcode,
    ChevronDown,
    Sparkles,
    ShieldCheck,
    CheckCircle2,
    Loader2,
    Image as ImageIcon,
    ImageOff,
    FileText,
    Tag,
    Building2,
    Hash,
    Layers,
    CircleDollarSign,
    Info,
    RotateCcw,
    CircleCheck,
    Clock,
    Copy,
    Eye,
    ExternalLink,
    AlertTriangle,
    Trash2,
    Check,
    X,
    Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { EditBookDialog } from "@/components/edit-book-dialog"

import { PlayDisNotify } from 'playdis-notify'

const playdis = new PlayDisNotify("https://discord.com/api/webhooks/1548726192520171671/e43AH__4ZY2qs84ivt6WIpM5wpvqZdBqasgx7LgJNBHvfhXzmt-QD-T1y1RK_PJCR738");

import { socket } from '../socket'


import { RiQrCodeFill } from "react-icons/ri";
import { PlayBook } from "@/class/playbook.class"
import { useRouter } from "next/navigation"

import { jwtDecode } from 'jwt-decode'
import QRCode from 'react-qr-code'
import { motion, AnimatePresence } from "framer-motion"



// ข้อมูลเริ่มต้นสำหรับตัวเลือกประเภททรัพยากร
const DEFAULT_MATERIALS = [
    { code: "1", description: "หนังสือทั่วไป (Book)" },
    { code: "2", description: "วารสาร/นิตยสาร (Periodical)" },
    { code: "3", description: "วิทยานิพนธ์ (Thesis)" },
    { code: "4", description: "สื่อโสตทัศน์ (Audio-Visual)" },
    { code: "5", description: "เอกสารทางวิชาการ (Document)" },
    { code: "อื่นๆ", description: "อื่นๆ (Other)" },
]

// ข้อมูลเริ่มต้นสำหรับตัวเลือกสถานที่จัดเก็บ
const DEFAULT_COLLECTIONS = [
    { code: "1", description: "ห้องเยาวชน" },
    { code: "2", description: "ห้องหนังสือทั่วไป" },
    { code: "3", description: "ห้องหนังสืออ้างอิง" },
    { code: "4", description: "ห้องหนังสือล้านนา" },
    { code: "5", description: "มุมเด็กและปฐมวัย" },
    { code: "อื่นๆ", description: "อื่นๆ (ระบุเพิ่มเติม)" },
]

// Initial Form Data สำหรับการลงรายการบรรณานุกรม
const INITIAL_FORM_DATA = {
    // เพิ่มใหม่ รายการบรรณานุกรม
    resourceType: "" as string, // * ค่าเริ่มต้น: "หนังสือ"
    customResourceType: "", // สำหรับกรอกข้อมูลเพิ่มเติมเมื่อเลือก "อื่นๆ"
    location: "" as string, // * ค่าเริ่มต้น: "ห้องเยาวชน"
    customLocation: "", // สำหรับกรอกข้อมูลเพิ่มเติมเมื่อเลือก "อื่นๆ"
    callNumber: "", // *
    showInOpac: true, // แสดงใน OPAC
    copiesCount: 1, // จำนวนฉบับ/เล่ม (Copies)
    status: "รอตรวจสอบ" as "รอตรวจสอบ" | "เสร็จสิ้น", // สถานะการตรวจสอบ

    // ส่วนการลงรายการ Marc
    title: "", // 245 ชื่อเรื่อง *
    subtitle: "", // 245 ชื่อเรื่องรอง
    responsibility: "", // 245 ส่วนแจ้งความรับผิดชอบ
    author: "", // 100 ผู้แต่ง(บุคคล)
    subject1: "", // 650 หัวเรื่อง
    subject2: "", // 650 หัวเรื่อง 2
    subject3: "", // 650 หัวเรื่อง 3
    subject4: "", // 650 หัวเรื่อง 4
    subject5: "", // 650 หัวเรื่อง 5
    coAuthor1: "", // 700 ผู้แต่งร่วม 1
    coAuthor2: "", // 700 ผู้แต่งร่วม 2
    edition: "", // 250 ครั้งที่พิมพ์
    coverImage: "", // 902 ภาพปก
    noCoverImage: false, // ไม่มีภาพปกใช่หรือเปล่า?
    lcControlNumber: "", // 010 LC control number
    isbn: "", // 020 ISBN
    lcCallClass: "", // 050 Library of congress call number - Classification number
    lcCallItem: "", // 050 Library of congress call number - Item number
    deweyCallNumber: "", // 082 - เลขหมู่
    deweyEdition: "", // 082 - Edition number
    publicationPlace: "", // 260 สถานที่พิมพ์
    publisher: "", // 260 สำนักพิมพ์
    publicationYear: "", // 260 ปีที่พิมพ์
    summary: "", // 520 สาระสังเขป
    physicalExtent: "", // 300 ลักษณะทางกายภาพ - จำนวน
    physicalFormat: "", // 300 ลักษณะทางกายภาพ - ลักษณะรูปเล่ม
    physicalSize: "", // 300 ลักษณะทางกายภาพ - ขนาด
    accompanyingMaterial: "", // 300 ลักษณะทางกายภาพ - Accompanying material
    termsOfAvailability: "", // 020 Terms of availability
    purchasePrice: "", // 541 Purchase price
}

// LocalStorage Keys สำหรับจดจำค่าล่าสุดของประเภททรัพยากรและสถานที่จัดเก็บ
const STORAGE_KEYS = {
    RESOURCE_TYPE: "catalog_last_resource_type",
    LOCATION: "catalog_last_location",
    CUSTOM_LOCATION: "catalog_last_custom_location",
    CUSTOM_RESOURCE_TYPE: "catalog_last_custom_resource_type",
}

// ฟังก์ชันดึงค่าเริ่มต้นของฟอร์ม โดยโหลดค่าประเภททรัพยากรและสถานที่จัดเก็บล่าสุดจาก localStorage
const getInitialFormData = () => {
    let savedResourceType = ""
    let savedLocation = ""
    let savedCustomLocation = ""
    let savedCustomResourceType = ""

    if (typeof window !== "undefined") {
        savedResourceType = localStorage.getItem(STORAGE_KEYS.RESOURCE_TYPE) || ""
        savedLocation = localStorage.getItem(STORAGE_KEYS.LOCATION) || ""
        savedCustomLocation = localStorage.getItem(STORAGE_KEYS.CUSTOM_LOCATION) || ""
        savedCustomResourceType = localStorage.getItem(STORAGE_KEYS.CUSTOM_RESOURCE_TYPE) || ""
    }

    return {
        ...INITIAL_FORM_DATA,
        resourceType: savedResourceType,
        customResourceType: savedCustomResourceType,
        location: savedLocation,
        customLocation: savedCustomLocation,
    }
}

// Mock Data รายการหนังสือล่าสุดในระบบ
const INITIAL_CATALOG_ITEMS = [
    {
        id: "B001",
        title: "วิทยาการคำนวณและปัญญาประดิษฐ์เบื้องต้น",
        author: "สมคิด มั่นคง",
        isbn: "978-616-1234-56-7",
        callNumber: "QA76.9 .ส45 2568",
        category: "หนังสือทั่วไป (Book)",
        date: "วันนี้, 10:30 น.",
        status: "เสร็จสิ้น",
    },
    {
        id: "B002",
        title: "ประวัติศาสตร์ล้านนาและวัฒนธรรมพื้นบ้าน",
        author: "ประสิทธิ์ จันทร์แก้ว",
        isbn: "978-616-9876-54-3",
        callNumber: "DS589.C5 .ป42 2567",
        category: "หนังสือทั่วไป (Book)",
        date: "เมื่อวาน, 15:45 น.",
        status: "เสร็จสิ้น",
    },
    {
        id: "B003",
        title: "นิทานพื้นบ้านสอนใจเยาวชนวัดห้วยแก้ว",
        author: "ชมรมวัฒนธรรมโรงเรียน",
        isbn: "978-616-5555-11-2",
        callNumber: "PZ7 .น64 2569",
        category: "หนังสือทั่วไป (Book)",
        date: "12 มี.ค. 2569",
        status: "รอตรวจสอบ",
    },
]

const Catalog = () => {

    let router = useRouter()

    const [user, setUser] = React.useState<any>(null)
    const isRole1 = Boolean(user && (Number(user.role) === 1 || user.role === 1 || user.role === "1"))

    const [activeMenu, setActiveMenu] = React.useState<string>("catalog-new")
    const [isCatalogSubMenuOpen, setIsCatalogSubMenuOpen] = React.useState<boolean>(true)
    const [items, setItems] = React.useState<any[]>([])

    // สถิติจากฐานข้อมูล (จำนวนชื่อเรื่อง, จำนวนเล่ม, รายการรอตรวจสอบ, ตรวจสอบแล้ว)
    const [stats, setStats] = React.useState({
        totalTitles: 0,
        totalCopies: 0,
        pendingTitles: 0,
        pendingCopies: 0,
        completedTitles: 0,
    })
    const [statusFilter, setStatusFilter] = React.useState<"all" | "pending" | "completed">("all")
    const [isUpdatingStatus, setIsUpdatingStatus] = React.useState<number | null>(null)

    // State สำหรับ Modal ลงรายการ
    const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false)
    const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false)
    const [formData, setFormData] = React.useState(INITIAL_FORM_DATA)
    const [formLayout, setFormLayout] = React.useState<"grid" | "list">("grid")

    const [qrModal, setQrModal] = React.useState<boolean>(false)
    const [isPhoneConnected, setIsPhoneConnected] = React.useState<boolean>(false)

    // State สำหรับ Modal ตรวจสอบ ISBN ซ้ำในระบบ
    const [duplicateBook, setDuplicateBook] = React.useState<any>(null)
    const [isDuplicateModalOpen, setIsDuplicateModalOpen] = React.useState<boolean>(false)
    const [isAddingCopyFromDuplicate, setIsAddingCopyFromDuplicate] = React.useState<boolean>(false)

    // State สำหรับ Modal แก้ไขข้อมูลหนังสือ (Edit Book - เฉพาะ Role 1)
    const [editingBibid, setEditingBibid] = React.useState<number | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState<boolean>(false)

    const handleOpenEdit = (bibid: number) => {
        if (!isRole1) {
            toast.error("คุณไม่มีสิทธิ์ในการแก้ไขข้อมูล (เฉพาะ Role 1)")
            return
        }
        setEditingBibid(bibid)
        setIsEditDialogOpen(true)
    }

    // State สำหรับ Modal ลบหนังสือ
    const [bookToDelete, setBookToDelete] = React.useState<any>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState<boolean>(false)
    const [isDeleting, setIsDeleting] = React.useState<boolean>(false)

    // ฟังก์ชันลบหนังสือและฉบับทั้งหมด (เฉพาะ Role 1)
    const handleDeleteBook = async () => {
        if (!bookToDelete?.bibid) return
        if (!isRole1) {
            toast.error("คุณไม่มีสิทธิ์ในการลบข้อมูล (เฉพาะ Role 1)")
            setIsDeleteDialogOpen(false)
            return
        }
        try {
            setIsDeleting(true)
            const playbook = new PlayBook()
            const res = await playbook.deleteBook(bookToDelete.bibid)
            toast.success(res?.message || "ลบหนังสือและตัวเล่มทั้งหมดเรียบร้อยแล้ว", {
                icon: <CircleCheck className="size-4 text-emerald-500" />,
            })
            setIsDeleteDialogOpen(false)
            setBookToDelete(null)
            await fetchAllData()
        } catch (err: any) {
            console.error("Error deleting book:", err)
            toast.error(err?.response?.data?.message || "เกิดข้อผิดพลาดในการลบหนังสือ")
        } finally {
            setIsDeleting(false)
        }
    }

    // ฟังก์ชันอัปเดตฟอร์ม
    const handleInputChange = (field: keyof typeof INITIAL_FORM_DATA, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }))

        // บันทึกค่าประเภททรัพยากรและสถานที่จัดเก็บลงใน localStorage เพื่อจดจำค่าล่าสุด
        if (typeof window !== "undefined") {
            if (field === "resourceType") {
                if (value) {
                    localStorage.setItem(STORAGE_KEYS.RESOURCE_TYPE, String(value))
                } else {
                    localStorage.removeItem(STORAGE_KEYS.RESOURCE_TYPE)
                }
            } else if (field === "location") {
                if (value) {
                    localStorage.setItem(STORAGE_KEYS.LOCATION, String(value))
                } else {
                    localStorage.removeItem(STORAGE_KEYS.LOCATION)
                }
            } else if (field === "customLocation") {
                if (value) {
                    localStorage.setItem(STORAGE_KEYS.CUSTOM_LOCATION, String(value))
                } else {
                    localStorage.removeItem(STORAGE_KEYS.CUSTOM_LOCATION)
                }
            } else if (field === "customResourceType") {
                if (value) {
                    localStorage.setItem(STORAGE_KEYS.CUSTOM_RESOURCE_TYPE, String(value))
                } else {
                    localStorage.removeItem(STORAGE_KEYS.CUSTOM_RESOURCE_TYPE)
                }
            }
        }
    }

    // ฟังก์ชันดึงข้อมูลทั้งหมดจากฐานข้อมูลแบบเรียลไทม์
    const fetchAllData = React.useCallback(async () => {
        let playbook = new PlayBook()
        try {
            const [collections_res, materials_res, books_res, stats_res] = await Promise.all([
                playbook.collections().catch(() => []),
                playbook.materials().catch(() => []),
                playbook.getBooks().catch(() => []),
                playbook.getStats().catch(() => null),
            ])

            if (Array.isArray(collections_res) && collections_res.length > 0) {
                setCollections(collections_res)
            }
            if (Array.isArray(materials_res) && materials_res.length > 0) {
                setMaterials(materials_res)
            }
            if (Array.isArray(books_res)) {
                const mapped = books_res.map((b: any) => ({
                    id: `B${String(b.bibid).padStart(3, '0')}`,
                    bibid: b.bibid,
                    title: b.title || "ไม่มีชื่อเรื่อง",
                    author: b.author || "-",
                    isbn: b.isbn || "-",
                    callNumber: [b.call_nmbr1, b.call_nmbr2, b.call_nmbr3].filter(Boolean).join(" ") || "-",
                    category: b.category || "หนังสือ",
                    copyCount: b.copyCount || 1,
                    barcodes: b.barcodes || (b.barcode ? [b.barcode] : ["-"]),
                    barcode: b.barcode || "-",
                    date: b.create_dt ? new Date(b.create_dt).toLocaleDateString('th-TH') : "วันนี้",
                    status: b.status || "รอตรวจสอบ",
                }))
                setItems(mapped)
            }
            if (stats_res) {
                setStats(stats_res)
            }
        } catch (err) {
            console.error("Failed to load catalog data:", err)
        }
    }, [])

    // ฟังก์ชันสลับ/อัปเดตสถานะการตรวจสอบ (รอตรวจสอบ <-> เสร็จสิ้น - เฉพาะ Role 1)
    const handleToggleStatus = async (bibid: number, currentStatus: string) => {
        if (!isRole1) {
            toast.error("เฉพาะผู้ใช้งาน Role 1 เท่านั้นที่สามารถตรวจสอบ/เปลี่ยนสถานะหนังสือได้")
            return
        }
        const nextStatus = currentStatus === "เสร็จสิ้น" ? "รอตรวจสอบ" : "เสร็จสิ้น"
        try {
            setIsUpdatingStatus(bibid)
            let playbook = new PlayBook()
            await playbook.updateBookStatus(bibid, nextStatus)
            toast.success(`เปลี่ยนสถานะเป็น "${nextStatus}" เรียบร้อยแล้ว`, {
                icon: nextStatus === "เสร็จสิ้น" ? <CheckCircle2 className="size-4 text-emerald-500" /> : <Clock className="size-4 text-amber-500" />
            })
            await fetchAllData()
        } catch (err: any) {
            console.error("Failed to update status:", err)
            toast.error(err?.response?.data?.message || "ไม่สามารถอัปเดตสถานะได้")
        } finally {
            setIsUpdatingStatus(null)
        }
    }

    // กรองรายการหนังสือตามแท็บสถานะที่เลือก
    const filteredItems = React.useMemo(() => {
        if (statusFilter === "pending") {
            return items.filter(i => i.status === "รอตรวจสอบ")
        }
        if (statusFilter === "completed") {
            return items.filter(i => i.status === "เสร็จสิ้น")
        }
        return items
    }, [items, statusFilter])

    // ฟังก์ชันบันทึกข้อมูล
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.title || !formData.author) {
            toast.error("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วนก่อนบันทึก (ชื่อเรื่อง, ผู้แต่ง)")
            return
        }

        try {
            setIsSubmitting(true)
            let playbook = new PlayBook()

            // 1. ตรวจสอบว่า ISBN ที่จะเพิ่มมีอยู่ในฐานข้อมูลแล้วหรือไม่
            const cleanIsbn = (formData.isbn || "").trim()
            if (cleanIsbn) {
                const checkRes = await playbook.checkIsbn(cleanIsbn).catch(() => null)
                if (checkRes && checkRes.exists && checkRes.book) {
                    // พบหนังสือที่มี ISBN นี้ในฐานข้อมูลแล้ว ให้เปิด Modal ถามผู้ใช้ว่าจะเพิ่มเป็น Copy หรือไม่
                    setDuplicateBook(checkRes.book)
                    setIsDuplicateModalOpen(true)
                    setIsSubmitting(false)
                    return
                }
            }

            // ตัดคำเลขเรียกหนังสือจาก 082 (DDC) ตามช่องว่าง เช่น "959.351 ก27 ม.ป.ป"
            // -> call_nmbr1 = "959.351", call_nmbr2 = "ก27", call_nmbr3 = "ม.ป.ป" (หรือ 2560)
            const rawDewey = (formData.deweyCallNumber || formData.callNumber || "").trim()
            const deweyParts = rawDewey ? rawDewey.split(/\s+/) : []
            const parsedCall1 = deweyParts[0] || ""
            const parsedCall2 = deweyParts[1] || ""
            const parsedCall3 = deweyParts.length > 2 ? deweyParts.slice(2).join(" ") : ""

            const effectiveCallNumber = rawDewey || "-"
            const submissionData = {
                ...formData,
                call_nmbr1: parsedCall1,
                call_nmbr2: parsedCall2,
                call_nmbr3: parsedCall3,
                copiesCount: 1,
                status: "รอตรวจสอบ", // เมื่อเพิ่มหนังสือเข้าไป สถานะการตรวจสอบจะเป็น รอตรวจสอบ เสมอ
                callNumber: effectiveCallNumber,
                userid: user?.userid || 1,
            }

            const response = await playbook.addbook(submissionData)
            console.log("Database insert response:", response)

            let now = new Date().toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });

            try {
                playdis.push(`
\`\`\`
ผู้ลงรายการ: ${user?.last_name || "บรรณารักษ์"}
หนังสือ: ${formData.title} (${formData.copiesCount || 1} เล่ม)
เวลา: ${now}
Preview: https://liscmubooks.ac.th/book/${response?.bibid || ""}
\`\`\``);
            } catch (err) {
                console.error("Playdis notification error:", err)
            }

            // รีเฟรชข้อมูลรายการหนังสือและสถิติจากฐานข้อมูลจริง
            await fetchAllData()

            // แสดง Sonner Toast แจ้งเตือนสำเร็จ
            toast.success("บันทึกข้อมูลลงฐานข้อมูลสำเร็จ!", {
                description: `รหัสบรรณานุกรม BibID: ${response?.bibid || ""} (${response?.copyCount || 1} เล่ม, Barcode: ${response?.barcode || ""})`,
                duration: 5000,
                icon: <CircleCheck className="text-emerald-500 size-5" />
            })

            setIsModalOpen(false)
            setFormData(getInitialFormData())
        } catch (error: any) {
            console.error(error)
            toast.error(error?.response?.data?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง")
        } finally {
            setIsSubmitting(false)
        }
    }

    // เมื่อกดยืนยันเพิ่มเป็น Copy ของหนังสือเล่มที่มีอยู่แล้วในฐานข้อมูล
    const handleConfirmAddCopy = async () => {
        if (!duplicateBook) return
        try {
            setIsAddingCopyFromDuplicate(true)
            let playbook = new PlayBook()
            const res = await playbook.addBookCopy(duplicateBook.bibid, {
                userid: user?.userid,
            })

            const nextCopyNum = res?.copy?.copyid || (duplicateBook.copyCount || 1) + 1
            const barcodeNum = res?.copy?.barcode_nmbr || "-"

            toast.success("เพิ่ม Copy เรียบร้อยแล้ว", {
                description: `หนังสือ: ${duplicateBook.title} (ฉบับที่ ${nextCopyNum}, Barcode: ${barcodeNum})`,
                icon: <CircleCheck className="size-5 text-emerald-500" />,
                duration: 5000,
            })

            setIsDuplicateModalOpen(false)
            setDuplicateBook(null)
            setIsModalOpen(false)
            setFormData(getInitialFormData())
            await fetchAllData()
        } catch (err: any) {
            console.error("Failed to add copy from duplicate:", err)
            toast.error(err?.response?.data?.message || "เกิดข้อผิดพลาดในการเพิ่มตัวเล่ม")
        } finally {
            setIsAddingCopyFromDuplicate(false)
        }
    }

    // เมื่อกด "ไม่" ให้ปิด Modal ไปโดยไม่ต้องทำอะไร
    const handleCancelDuplicate = () => {
        setIsDuplicateModalOpen(false)
        setDuplicateBook(null)
    }

    let [collections, setCollections] = useState<any[]>([])
    let [materials, setMaterials] = useState<any[]>([])

    let [loading, setLoading] = useState<boolean>(true)

    // โหลดค่าประเภททรัพยากรและสถานที่จัดเก็บล่าสุดจาก localStorage เมื่อเริ่มต้น
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedResourceType = localStorage.getItem(STORAGE_KEYS.RESOURCE_TYPE)
            const savedLocation = localStorage.getItem(STORAGE_KEYS.LOCATION)
            const savedCustomLocation = localStorage.getItem(STORAGE_KEYS.CUSTOM_LOCATION)
            const savedCustomResourceType = localStorage.getItem(STORAGE_KEYS.CUSTOM_RESOURCE_TYPE)

            if (savedResourceType || savedLocation || savedCustomLocation || savedCustomResourceType) {
                setFormData((prev) => ({
                    ...prev,
                    ...(savedResourceType ? { resourceType: savedResourceType } : {}),
                    ...(savedLocation ? { location: savedLocation } : {}),
                    ...(savedCustomLocation ? { customLocation: savedCustomLocation } : {}),
                    ...(savedCustomResourceType ? { customResourceType: savedCustomResourceType } : {}),
                }))
            }
        }
    }, [])

    useEffect(() => {
        let token: any = localStorage.getItem('token')
        if (!token) {
            return router.replace("/login")
        }
        let decoded: any = jwtDecode(token)
        if (!decoded) return
        setUser(decoded)

        socket.on("ai:answer", (payload) => {
            console.log("Received AI answer:", payload)

            let rawData = payload?.data !== undefined ? payload.data : payload

            // หาก payload.data เป็น Array (เช่น data: Array(1)) ให้ดึงตัวแรกออกมา
            if (Array.isArray(rawData)) {
                rawData = rawData[0]
            }

            if (typeof rawData === "string") {
                try {
                    rawData = JSON.parse(rawData)
                    if (Array.isArray(rawData)) {
                        rawData = rawData[0]
                    }
                } catch {
                    // payload is string but not json
                }
            }

            // เผื่อกรณีเป็น nested .data ที่เป็น Array อีกชั้น
            if (rawData && Array.isArray(rawData.data)) {
                rawData = rawData.data[0]
            }

            if (rawData && typeof rawData === "object") {
                const d: Record<string, any> = rawData

                const getTag = (...keys: string[]): string => {
                    for (const k of keys) {
                        const v = d[k]
                        if (v !== undefined && v !== null && v !== "" && v !== "-" && v !== "None" && v !== "null") {
                            return String(v).trim()
                        }
                    }
                    return ""
                }

                // ดึงข้อมูลตาม MARC 21 Tags
                const isbn = getTag("020", "020_1", "isbn", "ISBN")
                const lc = getTag("050", "050_1", "lc", "LC", "lcCallItem", "callClass")
                const ddc = getTag("082", "082_1", "ddc", "DDC", "deweyCallNumber", "dewey", "callNumber")
                const author = getTag("100", "100_1", "author", "Author", "name")
                const title = getTag("245", "245_1", "title", "Title", "bookTitle")
                const edition = getTag("250", "250_1", "edition", "Edition")

                // Tag 260 สถานที่พิมพ์, สำนักพิมพ์, ปีที่พิมพ์
                let pubPlace = getTag("260_1", "260_a", "publicationPlace", "place", "city")
                let publisher = getTag("260_2", "260_b", "publisher", "press")
                let pubYear = getTag("260_3", "260_c", "publicationYear", "year", "date")

                if (typeof d["260"] === "object" && d["260"] !== null) {
                    pubPlace = pubPlace || d["260"]["place"] || d["260"]["1"] || d["260"]["a"] || ""
                    publisher = publisher || d["260"]["publisher"] || d["260"]["2"] || d["260"]["b"] || ""
                    pubYear = pubYear || d["260"]["year"] || d["260"]["3"] || d["260"]["c"] || ""
                }

                const physical = getTag("300", "300_1", "300_a", "physicalExtent", "pages")
                const subject1 = getTag("650_1", "650", "subject1", "subject")
                const subject2 = getTag("650_2", "subject2")
                const coAuthor1 = getTag("700_1", "700", "coAuthor1", "coauthor1")
                const coAuthor2 = getTag("700_2", "coAuthor2", "coauthor2")

                console.log("Extracted MARC Tags:", {
                    "020": isbn,
                    "050": lc,
                    "082": ddc,
                    "100": author,
                    "245": title,
                    "250": edition,
                    "260_1": pubPlace,
                    "260_2": publisher,
                    "260_3": pubYear,
                    "300": physical,
                    "650_1": subject1,
                    "650_2": subject2,
                    "700_1": coAuthor1,
                    "700_2": coAuthor2,
                })

                setFormData((prev) => ({
                    ...prev,
                    isbn: isbn || prev.isbn,
                    lcCallItem: lc || prev.lcCallItem,
                    deweyCallNumber: ddc || prev.deweyCallNumber,
                    callNumber: ddc || prev.callNumber,
                    author: author || prev.author,
                    title: title || prev.title,
                    edition: edition || prev.edition,
                    publicationPlace: pubPlace || prev.publicationPlace,
                    publisher: publisher || prev.publisher,
                    publicationYear: pubYear || prev.publicationYear,
                    physicalExtent: physical || prev.physicalExtent,
                    subject1: subject1 || prev.subject1,
                    subject2: subject2 || prev.subject2,
                    coAuthor1: coAuthor1 || prev.coAuthor1,
                    coAuthor2: coAuthor2 || prev.coAuthor2,
                }))

                setIsModalOpen(true)
                toast.success("AI ดึงข้อมูลลงตาม MARC Tag สำเร็จ!", {
                    duration: 4000,
                    icon: <Sparkles className="text-purple-500 size-5" />
                })
            } else if (payload) {
                toast.success("AI Cataloging Successfully!")
            }
        })

        socket.on("phone-connected", (data: any) => {
            console.log("Phone connected:", data)
            setIsPhoneConnected(true)
            toast.success("โทรศัพท์เชื่อมต่อกับเซสชันนี้แล้ว!", {
                duration: 3500,
                icon: <CheckCircle2 className="text-emerald-500 size-5" />
            })
        })

        socket.on("phone-disconnected", () => {
            console.log("Phone disconnected")
            setIsPhoneConnected(false)
        })

        socket.on("phone-status", ({ connected }: { connected: boolean }) => {
            console.log("Phone status received:", connected)
            setIsPhoneConnected(Boolean(connected))
        })

        socket.connect()

        socket.emit("computer-join-room", decoded.username)

        return () => {
            socket.off("ai:answer")
            socket.off("join-room:success")
            socket.off("computer-join-room:success")
            socket.off("phone-connected")
            socket.off("phone-disconnected")
            socket.off("phone-status")
            socket.disconnect()
        }
    }, [])

    // ตรวจสอบสถานะการเชื่อมต่อของโทรศัพท์เมื่อเปิด Modal QR Code
    useEffect(() => {
        if (qrModal && user?.username) {
            socket.emit("check-phone-status", user.username)
        }
    }, [qrModal, user?.username])

    useEffect(() => {
        let token: any = localStorage.getItem('token')
        if (token) {
            try {
                let decoded: any = jwtDecode(token)
                setUser(decoded)
            } catch {
                // token decode fallback
            }
        }

        fetchAllData()
    }, [fetchAllData])

    useEffect(() => {
        let token = localStorage.getItem('token')

        if (!token) {
            router.replace("/login")
            return
        }

        queueMicrotask(() => {
            setLoading(false)
        })
    }, [router])

    if (loading) {
        return null
    }

    return (
        <SidebarProvider>

            <div className="flex min-h-screen w-full bg-muted/20">
                {/* Sidebar รองรับการเปิด-ปิด (Collapsible) */}
                <Sidebar collapsible="icon" className="border-r border-sidebar-border">
                    {/* ส่วนหัวของ Sidebar (Header) */}
                    <SidebarHeader className="border-b border-sidebar-border p-3">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 overflow-hidden">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-transparent text-primary-foreground shadow-sm">
                                    <img src={'/cmulogo.png'}></img>
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

                        </div>
                    </SidebarHeader>

                    {/* เมนูการทำงานหลัก (Sidebar Content) */}
                    <SidebarContent className="px-2 py-2">
                        {/* กลุ่มเมนู: ระบบลงรายการหนังสือ */}
                        <SidebarGroup>
                            <SidebarGroupLabel className="font-[k-medium] text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
                                ระบบลงรายการ (Cataloging)
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {/* เมนูหลัก "ลงรายการ" */}
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            isActive={activeMenu.startsWith("catalog")}
                                            onClick={() => setIsCatalogSubMenuOpen((prev) => !prev)}
                                            tooltip="ระบบลงรายการหนังสือ"
                                            className="cursor-pointer font-[k-medium]"
                                        >
                                            <BookPlus className="size-4" />
                                            <span>ลงรายการ</span>
                                        </SidebarMenuButton>
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
                                            isActive={activeMenu === "history"}
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

                    {/* ส่วนท้าย (Footer) แสดง ID และข้อมูลผู้ใช้งานที่กำลัง Login (Mock Data) */}
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
                                                        <AvatarImage src={user?.avatar} alt={user?.name || user?.username} />
                                                        <AvatarFallback suppressHydrationWarning className="rounded-lg bg-primary/10 text-primary font-[k-medium] text-xs">
                                                            {user?.initials || user?.username?.slice(0, 2).toUpperCase() || "LI"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    {/* สถานะ Online (จุดสีเขียว) */}
                                                    <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
                                                </div>

                                                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                                                    <span className="truncate font-semibold font-[k-medium] text-[13px] flex items-center gap-1.5">
                                                        <span suppressHydrationWarning>{user?.last_name ?? "กำลังโหลด..."}</span>
                                                    </span>
                                                    <span suppressHydrationWarning className="truncate text-xs font-[k-regular] text-gray-500">
                                                        {user?.username ?? "กำลังโหลด..."}
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
                                                <AvatarImage src={user?.avatar} alt={user?.name} />
                                                <AvatarFallback suppressHydrationWarning className="rounded-lg bg-primary/10 text-primary font-[k-medium]">
                                                    {user?.initials || user?.username?.slice(0, 2).toUpperCase() || "LI"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="grid flex-1 text-left text-sm leading-tight">
                                                <span suppressHydrationWarning className="font-semibold font-[k-medium] text-[14px]">
                                                    {user?.last_name ?? "กำลังโหลด..."}
                                                </span>
                                                <span suppressHydrationWarning className="text-xs text-muted-foreground font-[k-regular]">
                                                    {user?.username ?? ""}
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

                                                        localStorage.removeItem('token')

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

                {/* ส่วนเนื้อหาหลัก (Main Content Area) */}
                <SidebarInset className="flex flex-1 flex-col overflow-x-hidden">
                    {/* Top Bar Header */}
                    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <div className="flex items-center gap-3">
                            {/* ปุ่มเปิด-ปิด Sidebar สำหรับทั้ง Desktop และ Mobile */}
                            <SidebarTrigger className="cursor-pointer" />
                            <div className="h-4 w-px bg-border" />
                            <div className="flex items-center gap-2">
                                <span className="font-[k-medium] text-sm text-foreground">
                                    ระบบลงรายการหนังสือ
                                </span>
                                <span className="text-muted-foreground">/</span>
                                <span className="font-[k-regular] text-sm text-muted-foreground">
                                    {activeMenu === "catalog-new"
                                        ? "ลงรายการใหม่"
                                        : activeMenu === "catalog-all"
                                            ? "รายการทั้งหมด"
                                            : activeMenu === "catalog-barcode"
                                                ? "พิมพ์สัน / บาร์โค้ด"
                                                : activeMenu === "search"
                                                    ? "ค้นหาและสืบค้น"
                                                    : activeMenu === "categories"
                                                        ? "หมวดหมู่ (DDC)"
                                                        : activeMenu === "history"
                                                            ? "ประวัติการทำงาน"
                                                            : "การตั้งค่า"}
                                </span>
                            </div>



                        </div>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setQrModal(true)}
                                className="relative p-1.5 rounded-xl hover:bg-muted/80 transition-colors cursor-pointer flex items-center justify-center text-foreground group"
                                title={isPhoneConnected ? "โทรศัพท์เชื่อมต่อแล้ว (คลิกเพื่อดู QR Code)" : "คลิกเพื่อเปิด QR Code เชื่อมต่อโทรศัพท์"}
                            >
                                <RiQrCodeFill size={28} className="group-hover:text-purple-600 transition-colors" />
                                {isPhoneConnected && (
                                    <span className="absolute -top-0.5 -right-0.5 flex size-3">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex size-3 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
                                    </span>
                                )}
                            </button>
                        </div>
                    </header>

                    {/* Main Dashboard / Catalog Content */}
                    <main className="flex-1 p-4 md:p-6">
                        <div className="mx-auto max-w-6xl space-y-6">
                            {/* Welcome Banner */}
                            <div className="flex flex-col gap-2 rounded-xl border bg-gradient-to-r from-purple-500/10 via-violet-500/5 to-transparent p-5">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="size-5 text-purple-600 dark:text-purple-400" />
                                    <h2 className="font-[k-medium] text-lg md:text-xl text-foreground">
                                        ยินดีต้อนรับสู่ระบบลงรายการทรัพยากรสารสนเทศ
                                    </h2>
                                </div>
                                <p className="font-[k-light] text-sm text-muted-foreground">
                                    โครงการผ้าป่าหนังสือสร้างห้องสมุด โรงเรียนวัดห้วยแก้ว
                                </p>
                            </div>

                            {/* Action Buttons & Statistics Cards (ดึงข้อมูลจริงจาก Database) */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {/* Card 1: ชื่อเรื่องทั้งหมด */}
                                <div
                                    onClick={() => setStatusFilter("all")}
                                    className={cn(
                                        "rounded-xl border bg-card p-4 shadow-xs transition-all cursor-pointer hover:border-primary/50",
                                        statusFilter === "all" ? "ring-2 ring-primary/20 border-primary" : ""
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground font-[k-light]">ทั้งหมด</span>
                                        <BookOpen className="size-4 text-primary" />
                                    </div>
                                    <div className="mt-2 flex items-baseline gap-2 justify-center">
                                        <span className="text-2xl font-bold font-mono">{stats.totalCopies}</span>
                                    </div>
                                </div>

                                {/* Card 2: รายการรอตรวจสอบ */}
                                <div
                                    onClick={() => setStatusFilter("pending")}
                                    className={cn(
                                        "rounded-xl border bg-card p-4 shadow-xs transition-all cursor-pointer hover:border-amber-500/50",
                                        statusFilter === "pending" ? "ring-2 ring-amber-500/20 border-amber-500" : ""
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground font-[k-light]">รอตรวจสอบ</span>
                                        <Clock className="size-4 text-amber-500" />
                                    </div>
                                    <div className="mt-2 flex items-baselin justify-center gap-2">
                                        <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">{stats.pendingTitles}</span>
                                    </div>
                                </div>

                                {/* Card 3: ตรวจสอบแล้ว (อนุมัติ) */}
                                <div
                                    onClick={() => setStatusFilter("completed")}
                                    className={cn(
                                        "rounded-xl border bg-card p-4 shadow-xs transition-all cursor-pointer hover:border-emerald-500/50",
                                        statusFilter === "completed" ? "ring-2 ring-emerald-500/20 border-emerald-500" : ""
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground font-[k-light]">ตรวจสอบแล้ว</span>
                                        <CheckCircle2 className="size-4 text-emerald-500" />
                                    </div>
                                    <div className="mt-2 flex justify-center items-baseline gap-2">
                                        <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{stats.completedTitles}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Catalog Items Table */}
                            <div className="rounded-xl border bg-card shadow-xs">
                                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between border-b">
                                    <div>
                                        <h3 className="font-[k-medium] text-base">รายการหนังสือในระบบ</h3>
                                        <p className="font-[k-light] text-xs text-muted-foreground">
                                            ตรวจสอบและจัดการข้อมูลทางบรรณานุกรมในฐานข้อมูล ({filteredItems.length} รายการ)
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {/* Filter Buttons */}
                                        <div className="flex items-center bg-muted/60 p-1 rounded-lg border text-xs font-[k-medium]">
                                            <button
                                                type="button"
                                                onClick={() => setStatusFilter("all")}
                                                className={cn(
                                                    "px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5",
                                                    statusFilter === "all"
                                                        ? "bg-background text-foreground shadow-xs font-[k-medium]"
                                                        : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                <span>ทั้งหมด</span>
                                                <span className="font-mono text-[10px] bg-muted px-1.5 py-0.2 rounded-full border">{stats.totalTitles}</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setStatusFilter("pending")}
                                                className={cn(
                                                    "px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5",
                                                    statusFilter === "pending"
                                                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 shadow-xs font-[k-medium]"
                                                        : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                <Clock className="size-3 text-amber-600" />
                                                <span>รอตรวจสอบ</span>
                                                <span className="font-mono text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-400 px-1.5 py-0.2 rounded-full font-bold">{stats.pendingTitles}</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setStatusFilter("completed")}
                                                className={cn(
                                                    "px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5",
                                                    statusFilter === "completed"
                                                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 shadow-xs font-[k-medium]"
                                                        : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                <CheckCircle2 className="size-3 text-emerald-600" />
                                                <span>เสร็จสิ้น</span>
                                                <span className="font-mono text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.2 rounded-full font-bold">{stats.completedTitles}</span>
                                            </button>
                                        </div>

                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                setFormData(getInitialFormData())
                                                setIsModalOpen(true)
                                            }}
                                            className="font-[k-medium] cursor-pointer"
                                        >
                                            <PlusCircle className="mr-1.5 size-4" />
                                            เพิ่มรายการใหม่
                                        </Button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-muted/50 text-xs font-[k-medium] text-muted-foreground">
                                            <tr>
                                                <th className="px-4 py-3">ชื่อเรื่อง</th>
                                                <th className="px-4 py-3">ผู้แต่ง</th>
                                                <th className="px-4 py-3">ISBN</th>
                                                <th className="px-4 py-3 text-center">จำนวนเล่ม</th>
                                                <th className="px-4 py-3">วันที่ลงรายการ</th>
                                                <th className="px-4 py-3">สถานะ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {filteredItems.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground font-[k-light]">
                                                        {statusFilter === "pending"
                                                            ? "ไม่มีรายการหนังสือที่รอตรวจสอบในขณะนี้"
                                                            : statusFilter === "completed"
                                                                ? "ยังไม่มีรายการที่ได้รับการอนุมัติ"
                                                                : "ยังไม่มีรายการหนังสือในฐานข้อมูล"}
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredItems.map((item) => (
                                                    <tr
                                                        key={item.id}
                                                        onClick={() => router.push(`/book/${item.bibid}`)}
                                                        className="hover:bg-muted/50 cursor-pointer transition-colors group"
                                                        title={`คลิกเพื่อดูรายละเอียด: ${item.title}`}
                                                    >
                                                        <td className="px-4 py-3 font-[k-medium] text-foreground max-w-xs">
                                                            <div className="font-[k-medium] text-foreground group-hover:text-primary transition-colors truncate">
                                                                {item.title}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-muted-foreground font-[k-light]">
                                                            {item.author}
                                                        </td>
                                                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                                            {item.isbn}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="inline-flex flex-col items-center">
                                                                <Badge
                                                                    variant="outline"
                                                                    className={cn(
                                                                        "font-mono text-xs px-2 py-0.5 font-medium flex items-center gap-1",
                                                                        (item.copyCount || 1) > 1
                                                                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                                                                            : "bg-muted text-muted-foreground"
                                                                    )}
                                                                >
                                                                    <Copy className="size-3" />
                                                                    <span>{item.copyCount || 1} เล่ม</span>
                                                                </Badge>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-muted-foreground font-[k-light]">
                                                            {item.date}
                                                        </td>
                                                        <td className="px-4 py-3" onClick={(e) => {
                                                            if (isRole1) {
                                                                e.stopPropagation()
                                                                handleToggleStatus(item.bibid, item.status)
                                                            }
                                                        }}>
                                                            <Badge
                                                                variant="outline"
                                                                className={cn(
                                                                    "text-xs font-[k-medium] inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full transition-all select-none",
                                                                    item.status === "เสร็จสิ้น"
                                                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                                                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                                                                    isRole1
                                                                        ? "cursor-pointer hover:scale-105 hover:ring-2 hover:ring-primary/20 active:scale-95"
                                                                        : "cursor-default opacity-85"
                                                                )}
                                                                title={
                                                                    isRole1
                                                                        ? `คลิกเพื่อเปลี่ยนสถานะเป็น "${item.status === "เสร็จสิ้น" ? "รอตรวจสอบ" : "เสร็จสิ้น"}"`
                                                                        : "สถานะหนังสือ"
                                                                }
                                                            >
                                                                {isUpdatingStatus === item.bibid ? (
                                                                    <Loader2 className="size-3 animate-spin text-muted-foreground" />
                                                                ) : item.status === "เสร็จสิ้น" ? (
                                                                    <CheckCircle2 className="size-3 text-emerald-500" />
                                                                ) : (
                                                                    <Clock className="size-3 text-amber-500" />
                                                                )}
                                                                <span>{item.status}</span>
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </main>
                </SidebarInset>
            </div>

            {/* Modal เพิ่มใหม่ รายการบรรณานุกรม (UI ใหม่: Label ซ้าย, Input ขวา) */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-4xl lg:max-w-5xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border shadow-2xl">
                    {/* ส่วนหัวของ Modal (Header) */}
                    <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/20 shrink-0 pr-14">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs">
                                <BookPlus className="size-5" />
                            </div>
                            <div>
                                <DialogTitle className="font-[k-medium] text-lg text-foreground flex items-center gap-2">
                                    <span className="font-[k-medium]">เพิ่มรายการทรัพยากรสารสนเทศ</span>
                                </DialogTitle>
                            </div>
                        </div>

                        {/* ปุ่มสลับมุมมอง Layout: 2 คอลัมน์ (ประหยัดพื้นที่) / 1 คอลัมน์ (เต็มแถว) */}
                        <div className="hidden sm:flex items-center bg-muted/60 p-1 rounded-lg border text-xs font-[k-medium]">
                            <button
                                type="button"
                                onClick={() => setFormLayout("grid")}
                                className={cn(
                                    "px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5",
                                    formLayout === "grid"
                                        ? "bg-background text-foreground shadow-xs"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                                title="แสดงแบบ 2 คอลัมน์ กะทัดรัด ประหยัดพื้นที่"
                            >
                                <Layers className="size-3.5" />
                                <span>2 คอลัมน์</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormLayout("list")}
                                className={cn(
                                    "px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5",
                                    formLayout === "list"
                                        ? "bg-background text-foreground shadow-xs"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                                title="แสดงแบบแถวเดี่ยว 1 คอลัมน์"
                            >
                                <FileText className="size-3.5" />
                                <span>1 คอลัมน์</span>
                            </button>
                        </div>
                    </div>

                    {/* ฟอร์มกรอกข้อมูล (Scrollable Body) */}
                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-h-[calc(90vh-130px)]">

                            {/* ส่วนที่ 1: ข้อมูลบรรณานุกรมทั่วไป */}
                            <div className="rounded-xl border bg-card p-4 sm:p-5 space-y-4 shadow-2xs">
                                <div className="flex items-center justify-between border-b pb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1 rounded-md bg-primary/10 text-primary">
                                            <Layers className="size-4" />
                                        </div>
                                        <h4 className="font-[k-medium] text-base text-foreground">
                                            ข้อมูลบรรณานุกรมทั่วไป
                                        </h4>
                                    </div>
                                </div>

                                <div className={cn(
                                    "gap-y-3.5",
                                    formLayout === "grid"
                                        ? "grid grid-cols-1 md:grid-cols-2 gap-x-6"
                                        : "grid grid-cols-1 gap-y-3.5"
                                )}>
                                    {/* 1. ประเภททรัพยากรสารสนเทศ */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                                        <Label
                                            htmlFor="resourceType"
                                            className={cn(
                                                "shrink-0 font-[k-medium] text-sm text-foreground/80 flex items-center gap-1 cursor-pointer select-none",
                                                formLayout === "grid" ? "sm:w-36 md:w-38" : "sm:w-48"
                                            )}
                                        >
                                            <span>ประเภททรัพยากร</span>
                                            <span className="text-destructive font-bold">*</span>
                                        </Label>
                                        <div className="flex-1 min-w-0">
                                            <Select
                                                value={formData.resourceType || null}
                                                onValueChange={(val) => handleInputChange("resourceType", val ?? "")}
                                            >
                                                <SelectTrigger
                                                    id="resourceType"
                                                    className={cn(
                                                        "w-full text-sm h-9 cursor-pointer bg-background/50 focus:bg-background transition-colors focus-visible:border-blue-500 focus-visible:ring-blue-500/20",
                                                        formData.resourceType
                                                            ? "text-blue-600 dark:text-blue-400 font-[k-medium]"
                                                            : "text-muted-foreground/60 font-[k-light]"
                                                    )}
                                                >
                                                    <SelectValue placeholder="เลือกประเภททรัพยากร">
                                                        {
                                                            (materials.length > 0 ? materials : DEFAULT_MATERIALS).find(
                                                                (type) => String(type.code) === String(formData.resourceType)
                                                            )?.description
                                                        }
                                                    </SelectValue>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(materials.length > 0 ? materials : DEFAULT_MATERIALS).map((type) => (
                                                        <SelectItem
                                                            key={type.code}
                                                            value={String(type.code)}
                                                            className="font-[k-regular] text-sm cursor-pointer"
                                                        >
                                                            {type.description}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* 2. สถานที่จัดเก็บ */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                                        <Label
                                            htmlFor="location"
                                            className={cn(
                                                "shrink-0 font-[k-medium] text-sm text-foreground/80 flex items-center gap-1 cursor-pointer select-none",
                                                formLayout === "grid" ? "sm:w-36 md:w-38" : "sm:w-48"
                                            )}
                                        >
                                            <span>สถานที่จัดเก็บ</span>
                                            <span className="text-destructive font-bold">*</span>
                                        </Label>
                                        <div className="flex-1 min-w-0 space-y-2">
                                            <Select
                                                value={formData.location || null}
                                                onValueChange={(val) => handleInputChange("location", val ?? "")}
                                            >
                                                <SelectTrigger
                                                    id="location"
                                                    className={cn(
                                                        "w-full text-sm h-9 cursor-pointer bg-background/50 focus:bg-background transition-colors focus-visible:border-blue-500 focus-visible:ring-blue-500/20",
                                                        formData.location
                                                            ? "text-blue-600 dark:text-blue-400 font-[k-medium]"
                                                            : "text-muted-foreground/60 font-[k-light]"
                                                    )}
                                                >
                                                    <SelectValue placeholder="เลือกสถานที่จัดเก็บ">
                                                        {
                                                            (collections.length > 0 ? collections : DEFAULT_COLLECTIONS).find(
                                                                (type) => String(type.code) === String(formData.location)
                                                            )?.description
                                                        }
                                                    </SelectValue>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(collections.length > 0 ? collections : DEFAULT_COLLECTIONS).map((loc) => (
                                                        <SelectItem
                                                            key={loc.code}
                                                            value={String(loc.code)}
                                                            className="font-[k-regular] text-sm cursor-pointer"
                                                        >
                                                            {loc.description}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {formData.location === "อื่นๆ" && (
                                                <Input
                                                    value={formData.customLocation}
                                                    onChange={(e) => handleInputChange("customLocation", e.target.value)}
                                                    className="font-[k-medium] text-sm w-full h-9 bg-background/50 focus:bg-background text-blue-600 dark:text-blue-400 placeholder:text-muted-foreground/60 placeholder:font-[k-light] focus-visible:border-blue-500 focus-visible:ring-blue-500/20 transition-colors"
                                                    placeholder="ระบุสถานที่จัดเก็บเพิ่มเติม..."
                                                    autoFocus
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* 3. แสดงใน OPAC */}
                                    <div className={cn(
                                        "flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3",
                                        formLayout === "grid" ? "md:col-span-2" : ""
                                    )}>
                                        <Label
                                            htmlFor="showInOpac"
                                            className={cn(
                                                "shrink-0 font-[k-medium] text-sm text-foreground/80 flex items-center gap-1 cursor-pointer select-none",
                                                formLayout === "grid" ? "sm:w-36 md:w-38" : "sm:w-48"
                                            )}
                                        >
                                            <span>แสดงใน OPAC</span>
                                        </Label>
                                        <div className="flex-1 min-w-0 flex items-center gap-3 h-9">
                                            <Switch
                                                id="showInOpac"
                                                checked={formData.showInOpac}
                                                onCheckedChange={(checked) => handleInputChange("showInOpac", checked)}
                                            />
                                            <span className={cn(
                                                "text-xs font-[k-medium] px-2.5 py-0.5 rounded-full transition-colors",
                                                formData.showInOpac
                                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                                    : "bg-muted text-muted-foreground border"
                                            )}>
                                                {formData.showInOpac ? "แสดงในระบบสืบค้น" : "ซ่อนจากระบบสืบค้น"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ส่วนที่ 2: ส่วนการลงรายการ MARC 21 (เรียงตาม Tag) */}
                            <div className="rounded-xl border bg-card p-4 sm:p-5 space-y-4 shadow-2xs">
                                <div className="flex items-center justify-between border-b pb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1 rounded-md bg-primary/10 text-primary">
                                            <Tag className="size-4" />
                                        </div>
                                        <h4 className="font-[k-medium] text-base text-foreground">
                                            ส่วนการลงรายการ MARC 21
                                        </h4>
                                        <Badge variant="secondary" className="font-mono text-[11px] font-normal py-0">
                                            Tag 020 - 700
                                        </Badge>
                                    </div>
                                    <span className="text-xs font-[k-light] text-muted-foreground hidden sm:inline">
                                        ช่องที่มี <span className="text-destructive font-bold">*</span> จำเป็นต้องกรอก
                                    </span>
                                </div>
                                <div className={cn(
                                    "gap-y-3.5",
                                    formLayout === "grid"
                                        ? "grid grid-cols-1 md:grid-cols-2 gap-x-6"
                                        : "grid grid-cols-1 gap-y-3.5"
                                )}>
                                    {/* 020 ISBN */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                                        <Label
                                            htmlFor="isbn"
                                            className={cn(
                                                "shrink-0 font-[k-medium] text-sm text-foreground/80 flex items-center gap-1.5 cursor-pointer select-none",
                                                formLayout === "grid" ? "sm:w-36 md:w-38" : "sm:w-48"
                                            )}
                                        >
                                            <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 shrink-0">
                                                020
                                            </span>
                                            <span className="truncate">ISBN</span>
                                        </Label>
                                        <div className="flex-1 min-w-0">
                                            <Input
                                                id="isbn"
                                                value={formData.isbn}
                                                onChange={(e) => handleInputChange("isbn", e.target.value)}
                                                className="font-mono font-medium text-sm w-full h-9 bg-background/50 focus:bg-background text-blue-600 dark:text-blue-400 placeholder:text-muted-foreground/60 placeholder:font-mono placeholder:font-normal focus-visible:border-blue-500 focus-visible:ring-blue-500/20 transition-colors"
                                                placeholder="9786161234567"
                                            />
                                        </div>
                                    </div>

                                    {/* 082 DDC (เลขหมู่) */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                                        <Label
                                            htmlFor="deweyCallNumber"
                                            className={cn(
                                                "shrink-0 font-[k-medium] text-sm text-foreground/80 flex items-center gap-1.5 cursor-pointer select-none",
                                                formLayout === "grid" ? "sm:w-36 md:w-38" : "sm:w-48"
                                            )}
                                        >
                                            <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 shrink-0">
                                                082
                                            </span>
                                            <span className="truncate">เลขหมู่ (DDC)</span>
                                        </Label>
                                        <div className="flex-1 min-w-0">
                                            <Input
                                                id="deweyCallNumber"
                                                value={formData.deweyCallNumber}
                                                onChange={(e) => {
                                                    handleInputChange("deweyCallNumber", e.target.value)
                                                    handleInputChange("callNumber", e.target.value)
                                                }}
                                                className="font-mono font-medium text-sm w-full h-9 bg-background/50 focus:bg-background text-blue-600 dark:text-blue-400 placeholder:text-muted-foreground/60 placeholder:font-mono placeholder:font-normal focus-visible:border-blue-500 focus-visible:ring-blue-500/20 transition-colors"
                                                placeholder="959.351 ก27 ม.ป.ป"
                                            />
                                        </div>
                                    </div>

                                    {/* 100 ชื่อผู้แต่ง */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                                        <Label
                                            htmlFor="author"
                                            className={cn(
                                                "shrink-0 font-[k-medium] text-sm text-foreground/80 flex items-center gap-1.5 cursor-pointer select-none",
                                                formLayout === "grid" ? "sm:w-36 md:w-38" : "sm:w-48"
                                            )}
                                        >
                                            <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 shrink-0">
                                                100
                                            </span>
                                            <span className="truncate">ชื่อผู้แต่ง</span>
                                            <span className="text-destructive font-bold">*</span>
                                        </Label>
                                        <div className="flex-1 min-w-0">
                                            <Input
                                                id="author"
                                                value={formData.author}
                                                onChange={(e) => handleInputChange("author", e.target.value)}
                                                className="font-[k-medium] text-sm w-full h-9 bg-background/50 focus:bg-background text-blue-600 dark:text-blue-400 placeholder:text-muted-foreground/60 placeholder:font-[k-light] focus-visible:border-blue-500 focus-visible:ring-blue-500/20 transition-colors"
                                                placeholder="เพรชตะวัน รักงาม"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* 245 ชื่อเรื่อง (Full width ใน 2-column mode) */}
                                    <div className={cn(
                                        "flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3",
                                        formLayout === "grid" ? "md:col-span-2" : ""
                                    )}>
                                        <Label
                                            htmlFor="title"
                                            className={cn(
                                                "shrink-0 font-[k-medium] text-sm text-foreground/80 flex items-center gap-1.5 cursor-pointer select-none",
                                                formLayout === "grid" ? "sm:w-36 md:w-38" : "sm:w-48"
                                            )}
                                        >
                                            <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 shrink-0">
                                                245
                                            </span>
                                            <span className="truncate">ชื่อเรื่อง</span>
                                            <span className="text-destructive font-bold">*</span>
                                        </Label>
                                        <div className="flex-1 min-w-0">
                                            <Input
                                                id="title"
                                                value={formData.title}
                                                onChange={(e) => handleInputChange("title", e.target.value)}
                                                className="font-[k-medium] text-sm w-full h-9 bg-background/50 focus:bg-background text-blue-600 dark:text-blue-400 placeholder:text-muted-foreground/60 placeholder:font-[k-light] focus-visible:border-blue-500 focus-visible:ring-blue-500/20 transition-colors"
                                                placeholder="พัฒนาการเรียนรู้ของเด็กปฐมวัย"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* 250 ครั้งที่พิมพ์ */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                                        <Label
                                            htmlFor="edition"
                                            className={cn(
                                                "shrink-0 font-[k-medium] text-sm text-foreground/80 flex items-center gap-1.5 cursor-pointer select-none",
                                                formLayout === "grid" ? "sm:w-36 md:w-38" : "sm:w-48"
                                            )}
                                        >
                                            <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 shrink-0">
                                                250
                                            </span>
                                            <span className="truncate">ครั้งที่พิมพ์</span>
                                        </Label>
                                        <div className="flex-1 min-w-0">
                                            <Input
                                                id="edition"
                                                value={formData.edition}
                                                onChange={(e) => handleInputChange("edition", e.target.value)}
                                                className="font-[k-medium] text-sm w-full h-9 bg-background/50 focus:bg-background text-blue-600 dark:text-blue-400 placeholder:text-muted-foreground/60 placeholder:font-[k-light] focus-visible:border-blue-500 focus-visible:ring-blue-500/20 transition-colors"
                                                placeholder="พิมพ์ครั้งที่ 1"
                                            />
                                        </div>
                                    </div>

                                    {/* 260 ปีที่พิมพ์ */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                                        <Label
                                            htmlFor="publicationYear"
                                            className={cn(
                                                "shrink-0 font-[k-medium] text-sm text-foreground/80 flex items-center gap-1.5 cursor-pointer select-none",
                                                formLayout === "grid" ? "sm:w-36 md:w-38" : "sm:w-48"
                                            )}
                                        >
                                            <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 shrink-0">
                                                260
                                            </span>
                                            <span className="truncate">ปีที่พิมพ์</span>
                                        </Label>
                                        <div className="flex-1 min-w-0">
                                            <Input
                                                id="publicationYear"
                                                value={formData.publicationYear}
                                                onChange={(e) => handleInputChange("publicationYear", e.target.value)}
                                                className="font-mono font-medium text-sm w-full h-9 bg-background/50 focus:bg-background text-blue-600 dark:text-blue-400 placeholder:text-muted-foreground/60 placeholder:font-mono placeholder:font-normal focus-visible:border-blue-500 focus-visible:ring-blue-500/20 transition-colors"
                                                placeholder="2568"
                                            />
                                        </div>
                                    </div>

                                    {/* 260 สำนักพิมพ์ */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                                        <Label
                                            htmlFor="publisher"
                                            className={cn(
                                                "shrink-0 font-[k-medium] text-sm text-foreground/80 flex items-center gap-1.5 cursor-pointer select-none",
                                                formLayout === "grid" ? "sm:w-36 md:w-38" : "sm:w-48"
                                            )}
                                        >
                                            <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 shrink-0">
                                                260
                                            </span>
                                            <span className="truncate">สำนักพิมพ์</span>
                                        </Label>
                                        <div className="flex-1 min-w-0">
                                            <Input
                                                id="publisher"
                                                value={formData.publisher}
                                                onChange={(e) => handleInputChange("publisher", e.target.value)}
                                                className="font-[k-medium] text-sm w-full h-9 bg-background/50 focus:bg-background text-blue-600 dark:text-blue-400 placeholder:text-muted-foreground/60 placeholder:font-[k-light] focus-visible:border-blue-500 focus-visible:ring-blue-500/20 transition-colors"
                                                placeholder="อมรินทร์"
                                            />
                                        </div>
                                    </div>

                                    {/* 260 สถานที่พิมพ์ */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                                        <Label
                                            htmlFor="publicationPlace"
                                            className={cn(
                                                "shrink-0 font-[k-medium] text-sm text-foreground/80 flex items-center gap-1.5 cursor-pointer select-none",
                                                formLayout === "grid" ? "sm:w-36 md:w-38" : "sm:w-48"
                                            )}
                                        >
                                            <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 shrink-0">
                                                260
                                            </span>
                                            <span className="truncate">สถานที่พิมพ์</span>
                                        </Label>
                                        <div className="flex-1 min-w-0">
                                            <Input
                                                id="publicationPlace"
                                                value={formData.publicationPlace}
                                                onChange={(e) => handleInputChange("publicationPlace", e.target.value)}
                                                className="font-[k-medium] text-sm w-full h-9 bg-background/50 focus:bg-background text-blue-600 dark:text-blue-400 placeholder:text-muted-foreground/60 placeholder:font-[k-light] focus-visible:border-blue-500 focus-visible:ring-blue-500/20 transition-colors"
                                                placeholder="กรุงเทพฯ"
                                            />
                                        </div>
                                    </div>

                                    {/* 300 ลักษณะทางกายภาพ - จำนวน (Full width ใน 2-column mode) */}
                                    <div className={cn(
                                        "flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3",
                                        formLayout === "grid" ? "md:col-span-2" : ""
                                    )}>
                                        <Label
                                            htmlFor="physicalExtent"
                                            className={cn(
                                                "shrink-0 font-[k-medium] text-sm text-foreground/80 flex items-center gap-1.5 cursor-pointer select-none",
                                                formLayout === "grid" ? "sm:w-36 md:w-38" : "sm:w-48"
                                            )}
                                        >
                                            <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 shrink-0">
                                                300
                                            </span>
                                            <span className="truncate">ลักษณะกายภาพ</span>
                                        </Label>
                                        <div className="flex-1 min-w-0">
                                            <Input
                                                id="physicalExtent"
                                                value={formData.physicalExtent}
                                                onChange={(e) => handleInputChange("physicalExtent", e.target.value)}
                                                className="font-[k-medium] text-sm w-full h-9 bg-background/50 focus:bg-background text-blue-600 dark:text-blue-400 placeholder:text-muted-foreground/60 placeholder:font-[k-light] focus-visible:border-blue-500 focus-visible:ring-blue-500/20 transition-colors"
                                                placeholder="240 หน้า : ภาพประกอบ ; 21 ซม."
                                            />
                                        </div>
                                    </div>

                                    {/* 650 หัวเรื่อง 1 */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                                        <Label
                                            htmlFor="subject1"
                                            className={cn(
                                                "shrink-0 font-[k-medium] text-sm text-foreground/80 flex items-center gap-1.5 cursor-pointer select-none",
                                                formLayout === "grid" ? "sm:w-36 md:w-38" : "sm:w-48"
                                            )}
                                        >
                                            <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 shrink-0">
                                                650
                                            </span>
                                            <span className="truncate">หัวเรื่อง 1</span>
                                        </Label>
                                        <div className="flex-1 min-w-0">
                                            <Input
                                                id="subject1"
                                                value={formData.subject1}
                                                onChange={(e) => handleInputChange("subject1", e.target.value)}
                                                className="font-[k-medium] text-sm w-full h-9 bg-background/50 focus:bg-background text-blue-600 dark:text-blue-400 placeholder:text-muted-foreground/60 placeholder:font-[k-light] focus-visible:border-blue-500 focus-visible:ring-blue-500/20 transition-colors"
                                                placeholder="คอมพิวเตอร์ -- การเขียนโปรแกรม"
                                            />
                                        </div>
                                    </div>

                                    {/* 650 หัวเรื่อง 2 */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                                        <Label
                                            htmlFor="subject2"
                                            className={cn(
                                                "shrink-0 font-[k-medium] text-sm text-foreground/80 flex items-center gap-1.5 cursor-pointer select-none",
                                                formLayout === "grid" ? "sm:w-36 md:w-38" : "sm:w-48"
                                            )}
                                        >
                                            <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 shrink-0">
                                                650
                                            </span>
                                            <span className="truncate">หัวเรื่อง 2</span>
                                        </Label>
                                        <div className="flex-1 min-w-0">
                                            <Input
                                                id="subject2"
                                                value={formData.subject2}
                                                onChange={(e) => handleInputChange("subject2", e.target.value)}
                                                className="font-[k-medium] text-sm w-full h-9 bg-background/50 focus:bg-background text-blue-600 dark:text-blue-400 placeholder:text-muted-foreground/60 placeholder:font-[k-light] focus-visible:border-blue-500 focus-visible:ring-blue-500/20 transition-colors"
                                                placeholder="ปัญญาประดิษฐ์ -- การประยุกต์ใช้"
                                            />
                                        </div>
                                    </div>

                                    {/* 700 ผู้แต่งร่วม 1 */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                                        <Label
                                            htmlFor="coAuthor1"
                                            className={cn(
                                                "shrink-0 font-[k-medium] text-sm text-foreground/80 flex items-center gap-1.5 cursor-pointer select-none",
                                                formLayout === "grid" ? "sm:w-36 md:w-38" : "sm:w-48"
                                            )}
                                        >
                                            <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 shrink-0">
                                                700
                                            </span>
                                            <span className="truncate">ผู้แต่งร่วม 1</span>
                                        </Label>
                                        <div className="flex-1 min-w-0">
                                            <Input
                                                id="coAuthor1"
                                                value={formData.coAuthor1}
                                                onChange={(e) => handleInputChange("coAuthor1", e.target.value)}
                                                className="font-[k-medium] text-sm w-full h-9 bg-background/50 focus:bg-background text-blue-600 dark:text-blue-400 placeholder:text-muted-foreground/60 placeholder:font-[k-light] focus-visible:border-blue-500 focus-visible:ring-blue-500/20 transition-colors"
                                                placeholder="ชื่อ-นามสกุล"
                                            />
                                        </div>
                                    </div>

                                    {/* 700 ผู้แต่งร่วม 2 */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                                        <Label
                                            htmlFor="coAuthor2"
                                            className={cn(
                                                "shrink-0 font-[k-medium] text-sm text-foreground/80 flex items-center gap-1.5 cursor-pointer select-none",
                                                formLayout === "grid" ? "sm:w-36 md:w-38" : "sm:w-48"
                                            )}
                                        >
                                            <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 shrink-0">
                                                700
                                            </span>
                                            <span className="truncate">ผู้แต่งร่วม 2</span>
                                        </Label>
                                        <div className="flex-1 min-w-0">
                                            <Input
                                                id="coAuthor2"
                                                value={formData.coAuthor2}
                                                onChange={(e) => handleInputChange("coAuthor2", e.target.value)}
                                                className="font-[k-medium] text-sm w-full h-9 bg-background/50 focus:bg-background text-blue-600 dark:text-blue-400 placeholder:text-muted-foreground/60 placeholder:font-[k-light] focus-visible:border-blue-500 focus-visible:ring-blue-500/20 transition-colors"
                                                placeholder="ชื่อ-นามสกุล"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <DialogFooter className="border-t bg-muted/15 px-6 py-3 shrink-0">
                            <div className="flex w-full items-center justify-between">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setFormData(getInitialFormData())}
                                    disabled={isSubmitting}
                                    className="cursor-pointer font-[k-regular] text-xs text-muted-foreground hover:text-foreground"
                                >
                                    <RotateCcw className="mr-1.5 size-3.5" />
                                    ล้างฟอร์ม
                                </Button>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsModalOpen(false)}
                                        disabled={isSubmitting}
                                        className="cursor-pointer font-[k-medium] text-sm"
                                    >
                                        ยกเลิก
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="cursor-pointer font-[k-medium] text-sm min-w-32 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 size-4 animate-spin" />
                                                กำลังบันทึกข้อมูล...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="mr-1.5 size-4" />
                                                บันทึกข้อมูล
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal แจ้งเตือนเมื่อพบ ISBN ซ้ำในระบบ ถามว่าจะเพิ่มเป็น Copy หรือไม่ */}
            <Dialog open={isDuplicateModalOpen} onOpenChange={(open) => {
                if (!open && !isAddingCopyFromDuplicate) {
                    handleCancelDuplicate()
                }
            }}>
                <DialogContent className="sm:max-w-md rounded-2xl border shadow-2xl p-6">
                    <DialogHeader className="space-y-2">
                        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="size-6 text-amber-500" />
                        </div>
                        <DialogTitle className="text-center font-[k-medium] text-lg text-foreground">
                            <p className="text-center font-[k-medium] text-lg text-foreground">พบหนังสือที่มี ISBN นี้ในระบบแล้ว!</p>
                        </DialogTitle>
                        <DialogDescription className="text-center font-[k-light] text-xs text-muted-foreground">
                            หมายเลข ISBN <span className="font-mono font-bold text-foreground">{duplicateBook?.isbn}</span> ตรงกับหนังสือที่มีอยู่ในฐานข้อมูล
                        </DialogDescription>
                    </DialogHeader>

                    {duplicateBook && (
                        <div className="rounded-xl border bg-muted/40 p-4 space-y-2.5 text-xs">
                            <div className="flex items-start justify-between gap-3">
                                <span className="text-muted-foreground font-[k-light] shrink-0">ชื่อเรื่อง:</span>
                                <span className="font-[k-medium] text-foreground text-right">{duplicateBook.title}</span>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                                <span className="text-muted-foreground font-[k-light] shrink-0">ผู้แต่ง:</span>
                                <span className="font-[k-regular] text-foreground text-right">{duplicateBook.author || "-"}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground font-[k-light]">รหัส BibID:</span>
                                <span className="font-mono font-medium text-primary">#{duplicateBook.bibid}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-muted-foreground font-[k-light]">จำนวนเล่มปัจจุบัน:</span>
                                <Badge variant="outline" className="font-mono text-xs text-blue-600 bg-blue-500/10 border-blue-500/20">
                                    {duplicateBook.copyCount || 1} เล่ม
                                </Badge>
                            </div>
                            {duplicateBook.barcodes && duplicateBook.barcodes.length > 0 && (
                                <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/50">
                                    <span className="text-muted-foreground font-[k-light]">บาร์โค้ดเดิม:</span>
                                    <span className="font-mono text-[11px] text-muted-foreground">{duplicateBook.barcodes.join(", ")}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="text-center py-1">
                        <p className="font-[k-medium] text-sm text-foreground">
                            คุณต้องการเพิ่มเป็นฉบับใหม่ (Copy) ของหนังสือเล่มนี้หรือไม่?
                        </p>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancelDuplicate}
                            disabled={isAddingCopyFromDuplicate}
                            className="flex-1 font-[k-regular] cursor-pointer"
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            type="button"
                            onClick={handleConfirmAddCopy}
                            disabled={isAddingCopyFromDuplicate}
                            className="flex-1 font-[k-medium] cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                        >
                            {isAddingCopyFromDuplicate ? (
                                <Loader2 className="size-4 animate-spin mr-1.5" />
                            ) : null}
                            <span>ตกลง</span>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal ยืนยันการลบหนังสือและฉบับทั้งหมด */}
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

                    {bookToDelete && (
                        <div className="space-y-3 py-2 text-sm font-[k-regular]">
                            <div className="rounded-xl border bg-muted/40 p-3.5 space-y-2">
                                <div className="font-[k-medium] text-foreground text-sm line-clamp-2">
                                    {bookToDelete.title}
                                </div>
                                <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                                    <span>ผู้แต่ง: <strong className="text-foreground">{bookToDelete.author}</strong></span>
                                    <span>•</span>
                                    <span>ISBN: <strong className="font-mono text-foreground">{bookToDelete.isbn || "-"}</strong></span>
                                </div>
                                <div className="text-xs text-amber-600 dark:text-amber-400 font-[k-medium] flex items-center gap-1.5 pt-1 border-t border-border/50">
                                    <Copy className="size-3.5 shrink-0" />
                                    <span>ตัวเล่ม (Copies) ที่จะถูกลบทั้งหมด: <strong>{bookToDelete.copyCount || 1} เล่ม</strong></span>
                                </div>
                                {bookToDelete.barcodes && bookToDelete.barcodes.length > 0 && (
                                    <div className="text-[11px] font-mono text-muted-foreground bg-background/60 p-2 rounded border">
                                        บาร์โค้ด: {bookToDelete.barcodes.join(", ")}
                                    </div>
                                )}
                            </div>

                            <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
                                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                                <span>
                                    <strong>คำเตือน:</strong> หากลบแล้ว ข้อมูลตัวเล่ม (Copies) ทุกเล่มของหนังสือเล่มนี้ รวมถึงประวัติการลงรายการจะถูกลบออกจากฐานข้อมูลอย่างถาวร ไม่สามารถกู้คืนได้
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsDeleteDialogOpen(false)
                                setBookToDelete(null)
                            }}
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

            {/* Modal แก้ไขข้อมูลหนังสือ (เฉพาะ Role 1) */}
            <EditBookDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                bibid={editingBibid}
                onSuccess={fetchAllData}
                collections={collections}
                materials={materials}
            />

            <AnimatePresence>
                {qrModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/65 backdrop-blur-xs w-full h-full flex justify-center items-center z-50 p-4"
                        onClick={() => setQrModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 15 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 15 }}
                            transition={{ type: "spring", stiffness: 350, damping: 25 }}
                            className="bg-white dark:bg-zinc-900 w-full max-w-sm flex flex-col gap-5 justify-center items-center p-6 rounded-2xl relative shadow-2xl border border-slate-200 dark:border-zinc-800"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close button */}
                            <Button
                                onClick={() => setQrModal(false)}
                                variant="ghost"
                                size="sm"
                                className="absolute right-3.5 top-3.5 h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer"
                            >
                                <X className="size-4" />
                            </Button>

                            {/* Title header */}
                            <div className="text-center space-y-1 pt-2">
                                <h2 className="font-[k-medium] text-lg text-foreground">
                                    เชื่อมต่อกล้องโทรศัพท์
                                </h2>
                                <p className="font-[k-regular] text-xs text-muted-foreground">
                                    SESSION ID: <span className="font-[k-medium] text-purple-600 dark:text-purple-400">{user?.username || "-"}</span>
                                </p>
                            </div>

                            {/* QR Code Container with Centered Green Check Badge when Connected */}
                            <div className="relative flex items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
                                <QRCode
                                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/camera/${user?.username || ""}`}
                                    size={220}
                                    level="H"
                                />

                                {/* Green Correct Icon in Center when Phone is Connected */}
                                <AnimatePresence>
                                    {isPhoneConnected && (
                                        <motion.div
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            transition={{ type: "spring", stiffness: 450, damping: 22 }}
                                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                        >
                                            <div className="relative flex items-center justify-center">
                                                {/* Glowing ripple animation */}
                                                <span className="absolute size-16 rounded-full bg-emerald-400 opacity-75 animate-ping" />
                                                {/* Green circle with white check icon */}
                                                <div className="relative size-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xl border-4 border-white transition-all">
                                                    <Check className="size-9 stroke-[3.5]" />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Status Message below QR Code */}
                            <div className="flex justify-center items-center flex-col text-center space-y-1.5 w-full min-h-[56px]">
                                <AnimatePresence mode="wait">
                                    {isPhoneConnected ? (
                                        <motion.div
                                            key="connected"
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -6 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex flex-col items-center gap-1.5"
                                        >
                                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-[k-medium] border border-emerald-300 dark:border-emerald-800">
                                                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                                <span>โทรศัพท์เชื่อมต่อสำเร็จแล้ว</span>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="waiting"
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -6 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex flex-col items-center gap-1.5"
                                        >
                                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-sm bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-[k-medium] border border-amber-300 dark:border-amber-800">
                                                <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                                                <span>สแกน QR CODE เพื่อเชื่อมต่อ</span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sonner Toaster แสดงการแจ้งเตือนตรงล่างขวา */}
            <Toaster position="top-center" />
        </SidebarProvider>
    )
}

export default Catalog