"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { PlayBook } from "@/class/playbook.class"
import { toast } from "sonner"
import {
    Pencil,
    Loader2,
    BookOpen,
    CheckCircle2,
    Clock,
    Tag,
    Building2,
    Calendar,
    Layers,
    Save,
    PlusCircle,
    Trash2,
    Hash,
} from "lucide-react"

// ชื่อคำอธิบายของ MARC 21 Tags ที่พบบ่อย
const MARC_TAG_LABELS: Record<string, string> = {
    "010": "หมายเลขควบคุม LC",
    "020": "ISBN",
    "022": "ISSN",
    "041": "รหัสภาษา",
    "050": "เลขเรียกหนังสือ LC",
    "082": "เลขหมู่ดิวอี้ (DDC)",
    "100": "ชื่อผู้แต่งหลัก",
    "110": "ผู้แต่งนิติบุคคล",
    "245": "ชื่อเรื่อง",
    "246": "ชื่อเรื่องอื่นๆ",
    "250": "ครั้งที่พิมพ์",
    "260": "ข้อมูลการพิมพ์",
    "264": "การผลิต/เผยแพร่",
    "300": "ลักษณะกายภาพ",
    "440": "ชื่อชุด",
    "490": "แถลงชุด (Series)",
    "500": "หมายเหตุทั่วไป",
    "504": "หมายเหตุบรรณานุกรม",
    "505": "หมายเหตุสารบัญ",
    "520": "สาระสังเขป / เรื่องย่อ",
    "600": "หัวเรื่องบุคคล",
    "650": "หัวเรื่อง",
    "651": "หัวเรื่องภูมิศาสตร์",
    "700": "ผู้แต่งร่วม",
    "710": "นิติบุคคลร่วม",
    "856": "ที่อยู่สื่ออิเล็กทรอนิกส์ (URL)",
    "902": "ภาพปก",
}

interface EditBookDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    bibid: number | null
    onSuccess?: () => void
    collections?: any[]
    materials?: any[]
}

export function EditBookDialog({
    open,
    onOpenChange,
    bibid,
    onSuccess,
    collections = [],
    materials = [],
}: EditBookDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [collList, setCollList] = useState<any[]>(collections)
    const [matList, setMatList] = useState<any[]>(materials)

    const [form, setForm] = useState({
        title: "",
        author: "",
        deweyCallNumber: "",
        lcCallItem: "",
        publicationYear: "",
        resourceType: "2",
        location: "2",
        isbn: "",
        edition: "",
        publisher: "",
        publicationPlace: "",
        physicalExtent: "",
        subject1: "",
        subject2: "",
        coAuthor1: "",
        coAuthor2: "",
        status: "รอตรวจสอบ",
    })

    // State สำหรับเขตข้อมูล MARC 21 เพิ่มเติม (Custom Tags)
    const [customTags, setCustomTags] = useState<Array<{ id: string; tag: string; subfield_cd?: string; value: string; tagName?: string }>>([])
    const [isAddTagDialogOpen, setIsAddTagDialogOpen] = useState(false)
    const [newTagInput, setNewTagInput] = useState("")

    const handleConfirmAddTag = (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        const raw = newTagInput.trim()
        const digitsOnly = raw.replace(/\D/g, "")
        if (!digitsOnly) {
            toast.error("กรุณาระบุหมายเลข Tag เป็นตัวเลข (เช่น 050, 490, 500, 520)")
            return
        }
        const tagNum = parseInt(digitsOnly, 10)
        if (isNaN(tagNum) || tagNum <= 0 || tagNum > 999) {
            toast.error("หมายเลข MARC Tag ต้องอยู่ระหว่าง 001 - 999")
            return
        }
        const formattedTag = String(tagNum).padStart(3, "0")
        const newId = `edit-custom-tag-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        setCustomTags((prev) => [
            ...prev,
            {
                id: newId,
                tag: formattedTag,
                subfield_cd: "a",
                value: "",
                tagName: MARC_TAG_LABELS[formattedTag] || `Tag ${formattedTag}`,
            },
        ])
        setNewTagInput("")
        setIsAddTagDialogOpen(false)
        toast.success(`เพิ่มช่องกรอกสำหรับ Tag ${formattedTag} เรียบร้อยแล้ว`)
    }

    const handleCustomTagValueChange = (id: string, value: string) => {
        setCustomTags((prev) =>
            prev.map((item) => (item.id === id ? { ...item, value } : item))
        )
    }

    const handleRemoveCustomTag = (id: string) => {
        setCustomTags((prev) => prev.filter((item) => item.id !== id))
    }

    // โหลดข้อมูลหนังสือเมื่อเปิด Dialog
    useEffect(() => {
        if (!open || !bibid) return

        let isMounted = true
        setIsLoading(true)

        const loadData = async () => {
            try {
                const playbook = new PlayBook()

                // โหลด collections และ materials หากยังไม่มี
                const [bookRes, collectionsRes, materialsRes] = await Promise.all([
                    playbook.getBook(bibid).catch(() => null),
                    collList.length === 0 ? playbook.collections().catch(() => []) : Promise.resolve(collList),
                    matList.length === 0 ? playbook.materials().catch(() => []) : Promise.resolve(matList),
                ])

                if (!isMounted) return

                if (Array.isArray(collectionsRes) && collectionsRes.length > 0) {
                    setCollList(collectionsRes)
                }
                if (Array.isArray(materialsRes) && materialsRes.length > 0) {
                    setMatList(materialsRes)
                }

                const res = bookRes
                const data = res?.data || res
                if (data) {
                    const marc = data.marc || {}
                    // รวมข้อมูลลักษณะทางกายภาพ 300 สำหรับแสดงในช่องกรอก (เช่น "389 หน้า : ภาพประกอบ ; 22 ซม")
                    let initialPhysicalDesc = ""
                    if (marc.physicalExtent && (marc.physicalExtent.includes(":") || marc.physicalExtent.includes(";"))) {
                        initialPhysicalDesc = marc.physicalExtent
                    } else {
                        let desc = marc.physicalExtent || marc.extent || ""
                        if (marc.physicalFormat) {
                            desc = desc ? `${desc} : ${marc.physicalFormat}` : marc.physicalFormat
                        }
                        if (marc.physicalSize) {
                            desc = desc ? `${desc} ; ${marc.physicalSize}` : marc.physicalSize
                        }
                        initialPhysicalDesc = desc
                    }

                    setForm({
                        title: data.title || "",
                        author: data.author || "",
                        deweyCallNumber: [data.call_nmbr1, data.call_nmbr2, data.call_nmbr3].filter(Boolean).join(" ") || marc.deweyCallNumber || marc.callNumber || "",
                        lcCallItem: marc.lcCallNumber || marc.lcCall || "",
                        publicationYear: marc.publicationYear || data.call_nmbr3 || marc.year || "",
                        resourceType: String(data.material_cd || "2"),
                        location: String(data.collection_cd || "2"),
                        isbn: marc.isbn || data.isbn || "",
                        edition: marc.edition || "",
                        publisher: marc.publisher || "",
                        publicationPlace: marc.publicationPlace || marc.place || "",
                        physicalExtent: initialPhysicalDesc,
                        subject1: data.topic1 || (marc.subjects && marc.subjects[0]) || "",
                        subject2: data.topic2 || (marc.subjects && marc.subjects[1]) || "",
                        coAuthor1: (marc.coAuthors && marc.coAuthors[0]) || "",
                        coAuthor2: (marc.coAuthors && marc.coAuthors[1]) || "",
                        status: data.status || "รอตรวจสอบ",
                    })

                    // ดึงเขตข้อมูล MARC 21 เพิ่มเติมจากตาราง biblio_field ที่นอกเหนือจากช่องมาตรฐาน
                    const standardFieldTags = new Set([20, 50, 82, 100, 245, 250, 260, 300, 650, 700])
                    const rawFields = Array.isArray(data.fields) ? data.fields : []
                    const loadedCustomTags = rawFields
                        .filter((f: any) => !standardFieldTags.has(Number(f.tag)))
                        .map((f: any, idx: number) => {
                            const formattedTag = String(f.tag).padStart(3, "0")
                            return {
                                id: `existing-field-${f.fieldid || idx}-${f.tag}`,
                                tag: formattedTag,
                                subfield_cd: f.subfield_cd || "a",
                                value: f.field_data || "",
                                tagName: f.tagName || MARC_TAG_LABELS[formattedTag] || `Tag ${formattedTag}`,
                            }
                        })
                    setCustomTags(loadedCustomTags)
                }
            } catch (err: any) {
                console.error("Failed to load book for editing:", err)
                toast.error("ไม่สามารถโหลดข้อมูลหนังสือเพื่อแก้ไขได้")
            } finally {
                if (isMounted) setIsLoading(false)
            }
        }

        loadData()

        return () => {
            isMounted = false
        }
    }, [open, bibid])

    const handleChange = (field: string, value: string | null) => {
        setForm((prev) => ({ ...prev, [field]: value ?? "" }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!bibid) return

        if (!form.title.trim()) {
            toast.error("กรุณาระบุชื่อเรื่องหนังสือ")
            return
        }
        if (!form.author.trim()) {
            toast.error("กรุณาระบุชื่อผู้แต่ง")
            return
        }

        try {
            setIsSaving(true)
            const playbook = new PlayBook()
            const rawDewey = (form.deweyCallNumber || "").trim()
            const deweyParts = rawDewey ? rawDewey.split(/\s+/) : []
            const payload = {
                ...form,
                call_nmbr1: deweyParts[0] || "",
                call_nmbr2: deweyParts[1] || "",
                call_nmbr3: deweyParts.length > 2 ? deweyParts.slice(2).join(" ") : "",
                customTags: customTags
                    .filter((t) => t.tag && t.value.trim() !== "")
                    .map((t) => ({
                        tag: t.tag,
                        subfield_cd: t.subfield_cd || "a",
                        value: t.value.trim(),
                    })),
            }
            const res = await playbook.updateBook(bibid, payload)

            toast.success(res?.message || "บันทึกการแก้ไขข้อมูลหนังสือเรียบร้อยแล้ว")
            onOpenChange(false)
            if (onSuccess) {
                onSuccess()
            }
        } catch (err: any) {
            console.error("Error saving book:", err)
            const msg = err?.response?.data?.message || "เกิดข้อผิดพลาดในการบันทึกการแก้ไข"
            toast.error(msg)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border shadow-2xl">
                <DialogHeader className="px-6 py-4 border-b bg-muted/20 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs">
                            <Pencil className="size-5" />
                        </div>
                        <div>
                            <DialogTitle className="font-[k-medium] text-lg text-foreground flex items-center gap-2">
                                <span>แก้ไขข้อมูลหนังสือ</span>
                                {bibid && (
                                    <span className="font-mono text-xs text-primary font-normal bg-primary/10 px-2 py-0.5 rounded-full">
                                        #{bibid}
                                    </span>
                                )}
                            </DialogTitle>
                            <DialogDescription className="font-[k-light] text-xs text-muted-foreground mt-0.5">
                                เฉพาะผู้ดูแลระบบ (Role 1) สามารถแก้ไขข้อมูลบรรณานุกรมและแท็ก MARC 21
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                        <Loader2 className="size-8 animate-spin text-primary" />
                        <span className="text-sm font-[k-regular]">กำลังโหลดข้อมูลหนังสือ...</span>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-sm">
                        {/* ชื่อเรื่อง & ผู้แต่ง */}
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-title" className="font-[k-medium] text-xs text-foreground flex items-center gap-1">
                                    <BookOpen className="size-3.5 text-primary" />
                                    <span>ชื่อเรื่อง<strong className="text-destructive">*</strong></span>
                                </Label>
                                <Input
                                    id="edit-title"
                                    value={form.title}
                                    onChange={(e) => handleChange("title", e.target.value)}
                                    placeholder="กรอกชื่อเรื่องหนังสือ..."
                                    className="font-[k-medium] text-sm h-9"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit-author" className="font-[k-medium] text-xs text-foreground flex items-center gap-1">
                                    <span>ชื่อผู้แต่ง<strong className="text-destructive">*</strong></span>
                                </Label>
                                <Input
                                    id="edit-author"
                                    value={form.author}
                                    onChange={(e) => handleChange("author", e.target.value)}
                                    placeholder="เช่น บราวน์, โจเซฟ อาร์"
                                    className="font-[k-medium] text-sm h-9"
                                    required
                                />
                            </div>
                        </div>

                        {/* เลขเรียกหนังสือ (Call Numbers) */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-dewey" className="font-[k-medium] text-xs text-foreground">
                                    เลขดิวอี้
                                </Label>
                                <Input
                                    id="edit-dewey"
                                    value={form.deweyCallNumber}
                                    onChange={(e) => handleChange("deweyCallNumber", e.target.value)}
                                    placeholder="เช่น 959.351 ก27 ม.ป.ป"
                                    className="font-mono text-xs h-9"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-lc" className="font-[k-medium] text-xs text-foreground">
                                    LC
                                </Label>
                                <Input
                                    id="edit-lc"
                                    value={form.lcCallItem}
                                    onChange={(e) => handleChange("lcCallItem", e.target.value)}
                                    placeholder="เช่น QP34.5"
                                    className="font-mono text-xs h-9"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-year" className="font-[k-medium] text-xs text-foreground flex items-center gap-1">
                                    <Calendar className="size-3 text-muted-foreground" />
                                    <span>ปีที่พิมพ์</span>
                                </Label>
                                <Input
                                    id="edit-year"
                                    value={form.publicationYear}
                                    onChange={(e) => handleChange("publicationYear", e.target.value)}
                                    placeholder="เช่น 2549"
                                    className="font-mono text-xs h-9"
                                />
                            </div>
                        </div>

                        {/* ประเภททรัพยากร & สถานที่จัดเก็บ */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="font-[k-medium] text-xs text-foreground flex items-center gap-1">
                                    <Layers className="size-3.5 text-muted-foreground" />
                                    <span>ประเภททรัพยากร</span>
                                </Label>
                                <Select
                                    value={form.resourceType}
                                    onValueChange={(val) => handleChange("resourceType", val)}
                                >
                                    <SelectTrigger className="h-9 font-[k-regular] text-xs">
                                        <SelectValue placeholder="เลือกประเภท..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {matList.map((m) => (
                                            <SelectItem key={m.code} value={String(m.code)} className="text-xs">
                                                {m.description}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="font-[k-medium] text-xs text-foreground flex items-center gap-1">
                                    <Building2 className="size-3.5 text-muted-foreground" />
                                    <span>สถานที่จัดเก็บ</span>
                                </Label>
                                <Select
                                    value={form.location}
                                    onValueChange={(val) => handleChange("location", val)}
                                >
                                    <SelectTrigger className="h-9 font-[k-regular] text-xs">
                                        <SelectValue placeholder="เลือกสถานที่..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {collList.map((c) => (
                                            <SelectItem key={c.code} value={String(c.code)} className="text-xs">
                                                {c.description}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* ISBN & Edition */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-isbn" className="font-[k-medium] text-xs text-foreground">
                                    ISBN
                                </Label>
                                <Input
                                    id="edit-isbn"
                                    value={form.isbn}
                                    onChange={(e) => handleChange("isbn", e.target.value)}
                                    placeholder="เช่น 9789749987654"
                                    className="font-mono text-xs h-9"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit-edition" className="font-[k-medium] text-xs text-foreground">
                                    ครั้งที่พิมพ์
                                </Label>
                                <Input
                                    id="edit-edition"
                                    value={form.edition}
                                    onChange={(e) => handleChange("edition", e.target.value)}
                                    placeholder="เช่น พิมพ์ครั้งที่ 2"
                                    className="font-[k-regular] text-xs h-9"
                                />
                            </div>
                        </div>

                        {/* สำนักพิมพ์ & สถานที่พิมพ์ */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-publisher" className="font-[k-medium] text-xs text-foreground">
                                    สำนักพิมพ์
                                </Label>
                                <Input
                                    id="edit-publisher"
                                    value={form.publisher}
                                    onChange={(e) => handleChange("publisher", e.target.value)}
                                    placeholder="ชื่อสำนักพิมพ์..."
                                    className="font-[k-regular] text-xs h-9"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit-place" className="font-[k-medium] text-xs text-foreground">
                                    สถานที่พิมพ์
                                </Label>
                                <Input
                                    id="edit-place"
                                    value={form.publicationPlace}
                                    onChange={(e) => handleChange("publicationPlace", e.target.value)}
                                    placeholder="เช่น กรุงเทพฯ"
                                    className="font-[k-regular] text-xs h-9"
                                />
                            </div>
                        </div>

                        {/* จำนวนหน้า & สถานะ */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-extent" className="font-[k-medium] text-xs text-foreground">
                                    ลักษณะทางกายภาพ
                                </Label>
                                <Input
                                    id="edit-extent"
                                    value={form.physicalExtent}
                                    onChange={(e) => handleChange("physicalExtent", e.target.value)}
                                    placeholder="เช่น 240 หน้า : ภาพประกอบ ; 21 ซม."
                                    className="font-[k-regular] text-xs h-9"
                                />
                            </div>
                        </div>

                        {/* หัวเรื่อง (Subjects) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-subject1" className="font-[k-medium] text-xs text-foreground flex items-center gap-1">
                                    <Tag className="size-3 text-muted-foreground" />
                                    <span>หัวเรื่องที่ 1</span>
                                </Label>
                                <Input
                                    id="edit-subject1"
                                    value={form.subject1}
                                    onChange={(e) => handleChange("subject1", e.target.value)}
                                    placeholder="หัวเรื่องหลัก..."
                                    className="font-[k-regular] text-xs h-9"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit-subject2" className="font-[k-medium] text-xs text-foreground flex items-center gap-1">
                                    <Tag className="size-3 text-muted-foreground" />
                                    <span>หัวเรื่องที่ 2</span>
                                </Label>
                                <Input
                                    id="edit-subject2"
                                    value={form.subject2}
                                    onChange={(e) => handleChange("subject2", e.target.value)}
                                    placeholder="หัวเรื่องรอง..."
                                    className="font-[k-regular] text-xs h-9"
                                />
                            </div>
                        </div>

                        {/* ผู้แต่งร่วม (Co-Authors - Tag 700) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-coauthor1" className="font-[k-medium] text-xs text-foreground flex items-center gap-1">
                                    <span>ผู้แต่งร่วม 1 (700)</span>
                                </Label>
                                <Input
                                    id="edit-coauthor1"
                                    value={form.coAuthor1}
                                    onChange={(e) => handleChange("coAuthor1", e.target.value)}
                                    placeholder="ชื่อ-นามสกุล..."
                                    className="font-[k-regular] text-xs h-9"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit-coauthor2" className="font-[k-medium] text-xs text-foreground flex items-center gap-1">
                                    <span>ผู้แต่งร่วม 2 (700)</span>
                                </Label>
                                <Input
                                    id="edit-coauthor2"
                                    value={form.coAuthor2}
                                    onChange={(e) => handleChange("coAuthor2", e.target.value)}
                                    placeholder="ชื่อ-นามสกุล..."
                                    className="font-[k-regular] text-xs h-9"
                                />
                            </div>
                        </div>

                        {/* เขตข้อมูล MARC 21 เพิ่มเติม (Custom Tags ใน biblio_field) */}
                        <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                            <div className="flex items-center justify-between border-b pb-2.5">
                                <div className="flex items-center gap-2">
                                    <Hash className="size-4 text-primary" />
                                    <span className="font-[k-medium] text-xs sm:text-sm text-foreground">
                                        เขตข้อมูล MARC 21 เพิ่มเติม ({customTags.length} รายการ)
                                    </span>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setNewTagInput("")
                                        setIsAddTagDialogOpen(true)
                                    }}
                                    className="h-7 px-2.5 text-xs font-[k-medium] cursor-pointer border-primary/30 text-primary hover:bg-primary/10 flex items-center gap-1"
                                >
                                    <PlusCircle className="size-3.5" />
                                    <span>เพิ่ม Tag ใหม่</span>
                                </Button>
                            </div>

                            {customTags.length === 0 ? (
                                <p className="font-[k-light] text-xs text-muted-foreground text-center py-2">
                                    ยังไม่มีเขตข้อมูล MARC 21 เพิ่มเติม กดปุ่ม &quot;เพิ่ม Tag ใหม่&quot; ด้านบนเพื่อเพิ่มข้อมูลได้
                                </p>
                            ) : (
                                <div className="grid grid-cols-1 gap-2.5">
                                    {customTags.map((ct) => {
                                        const label = MARC_TAG_LABELS[ct.tag] || ct.tagName || `Tag ${ct.tag}`
                                        return (
                                            <div key={ct.id} className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5 bg-background/80 p-2.5 rounded-lg border">
                                                <Label
                                                    htmlFor={ct.id}
                                                    className="shrink-0 sm:w-44 font-[k-medium] text-xs text-foreground/90 flex items-center gap-1.5 cursor-pointer"
                                                >
                                                    <span className="font-mono text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/25 shrink-0">
                                                        {ct.tag}
                                                    </span>
                                                    <span className="truncate" title={label}>
                                                        {label}
                                                    </span>
                                                </Label>
                                                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                                                    <Input
                                                        id={ct.id}
                                                        value={ct.value}
                                                        onChange={(e) => handleCustomTagValueChange(ct.id, e.target.value)}
                                                        placeholder={`กรอกข้อมูลสำหรับ Tag ${ct.tag}...`}
                                                        className="font-[k-regular] text-xs h-8 flex-1"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemoveCustomTag(ct.id)}
                                                        className="h-8 w-8 p-0 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                                                        title={`ลบ Tag ${ct.tag}`}
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        <DialogFooter className="pt-3 border-t flex items-center justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSaving}
                                className="font-[k-regular] text-xs cursor-pointer"
                            >
                                ยกเลิก
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSaving}
                                className="font-[k-medium] text-xs cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="size-3.5 animate-spin" />
                                        <span>กำลังบันทึก...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="size-3.5" />
                                        <span>บันทึกการแก้ไข</span>
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>

            {/* Modal ย่อยสำหรับถามผู้ใช้ว่าต้องการเพิ่ม Tag อะไรในหน้าแก้ไข */}
            <Dialog open={isAddTagDialogOpen} onOpenChange={setIsAddTagDialogOpen}>
                <DialogContent className="sm:max-w-sm rounded-2xl border shadow-2xl p-6">
                    <form onSubmit={handleConfirmAddTag} className="space-y-4">
                        <DialogHeader className="space-y-1.5">
                            <div className="flex items-center gap-2.5">
                                <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <Tag className="size-4" />
                                </div>
                                <DialogTitle className="font-[k-medium] text-base text-foreground">
                                    เพิ่ม Tag ใหม่ (MARC 21)
                                </DialogTitle>
                            </div>
                            <DialogDescription className="font-[k-light] text-xs text-muted-foreground">
                                กรุณาระบุหมายเลข MARC Tag ที่ต้องการเพิ่มในหน้าแก้ไขหนังสือ
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-2">
                            <Label htmlFor="edit-new-marc-tag-input" className="font-[k-medium] text-sm text-foreground">
                                คือ Tag อะไร?
                            </Label>
                            <Input
                                id="edit-new-marc-tag-input"
                                value={newTagInput}
                                onChange={(e) => setNewTagInput(e.target.value)}
                                placeholder="เช่น 050, 490, 500, 520"
                                className="font-mono text-sm h-10"
                                autoFocus
                            />
                            {newTagInput.trim().replace(/\D/g, "") && (
                                <p className="text-xs font-[k-regular] text-muted-foreground">
                                    ตัวอย่างป้ายกำกับ:{" "}
                                    <span className="font-mono font-semibold text-primary">
                                        {newTagInput.trim().replace(/\D/g, "").padStart(3, "0")}
                                    </span>{" "}
                                    ({MARC_TAG_LABELS[newTagInput.trim().replace(/\D/g, "").padStart(3, "0")] || `Tag ${newTagInput.trim().replace(/\D/g, "").padStart(3, "0")}`})
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsAddTagDialogOpen(false)}
                                className="font-[k-regular] cursor-pointer"
                            >
                                ยกเลิก
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                className="font-[k-medium] cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                ตกลง
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </Dialog>
    )
}
