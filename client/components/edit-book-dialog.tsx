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
} from "lucide-react"

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
        status: "รอตรวจสอบ",
    })

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
                        lcCallItem: data.call_nmbr2 || marc.lcCall || "",
                        publicationYear: data.call_nmbr3 || marc.year || "",
                        resourceType: String(data.material_cd || "2"),
                        location: String(data.collection_cd || "2"),
                        isbn: marc.isbn || data.isbn || "",
                        edition: marc.edition || "",
                        publisher: marc.publisher || "",
                        publicationPlace: marc.place || "",
                        physicalExtent: initialPhysicalDesc,
                        subject1: data.topic1 || (marc.subjects && marc.subjects[0]) || "",
                        subject2: data.topic2 || (marc.subjects && marc.subjects[1]) || "",
                        status: data.status || "รอตรวจสอบ",
                    })
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
        </Dialog>
    )
}
