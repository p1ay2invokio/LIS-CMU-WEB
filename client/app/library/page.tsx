'use client'

import React, { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { PlayBook } from "@/class/playbook.class"
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Search,
    ArrowLeft,
    BookOpen,
    ChevronLeft,
    ChevronRight,
    X,
    Barcode,
    MapPin,
    Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface BookCopy {
    bibid: number
    copyid: number
    copy_desc: string | null
    barcode_nmbr: string
    status_cd: string
    due_back_dt?: string | null
}

interface BookItem {
    bibid: number
    title: string
    author: string
    isbn: string
    category: string
    call_nmbr1?: string | null
    call_nmbr2?: string | null
    call_nmbr3?: string | null
    copyCount: number
    copies: BookCopy[]
    status: string
    opac_flg: string
}

interface BookDetail {
    bibid: number
    title: string
    author: string
    material: string
    collection: string
    call_nmbr1?: string | null
    call_nmbr2?: string | null
    call_nmbr3?: string | null
    copyCount: number
    copies: BookCopy[]
    marc?: {
        isbn?: string
        deweyCallNumber?: string
        publisher?: string
        publicationPlace?: string
        publicationYear?: string
        edition?: string
        physicalExtent?: string
        physicalSize?: string
        summary?: string
        subjects?: string[]
    }
}

const ITEMS_PER_PAGE = 20

export default function LibraryPage() {
    const router = useRouter()

    const [books, setBooks] = useState<BookItem[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [debouncedSearch, setDebouncedSearch] = useState<string>("")
    const [currentPage, setCurrentPage] = useState<number>(1)
    const [totalBooks, setTotalBooks] = useState<number>(0)
    const [totalPages, setTotalPages] = useState<number>(1)

    // Detail Modal State
    const [selectedBook, setSelectedBook] = useState<BookItem | null>(null)
    const [bookDetail, setBookDetail] = useState<BookDetail | null>(null)
    const [detailLoading, setDetailLoading] = useState<boolean>(false)

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery.trim())
            setCurrentPage(1)
        }, 250)
        return () => clearTimeout(timer)
    }, [searchQuery])

    const fetchBooks = useCallback(async () => {
        try {
            setLoading(true)
            const playbook = new PlayBook()
            const res = await playbook.getBooks({
                page: currentPage,
                limit: ITEMS_PER_PAGE,
                status: "เสร็จสิ้น",
                opac: "Y",
                search: debouncedSearch || undefined,
            })

            const list: BookItem[] = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
            const filtered = list.filter(
                (b) => b.opac_flg === "Y" && b.status === "เสร็จสิ้น"
            )

            setBooks(filtered)
            setTotalBooks(typeof res?.total === "number" ? res.total : filtered.length)
            setTotalPages(typeof res?.totalPages === "number" ? res.totalPages : 1)
        } catch (err) {
            console.error("Failed to fetch library books:", err)
            setBooks([])
        } finally {
            setLoading(false)
        }
    }, [currentPage, debouncedSearch])

    useEffect(() => {
        fetchBooks()
    }, [fetchBooks])

    const handleOpenBook = async (book: BookItem) => {
        setSelectedBook(book)
        setBookDetail(null)
        setDetailLoading(true)
        try {
            const playbook = new PlayBook()
            const res = await playbook.getBook(book.bibid)
            if (res?.success && res?.data) {
                setBookDetail(res.data)
            }
        } catch (err) {
            console.error("Failed to load book detail:", err)
        } finally {
            setDetailLoading(false)
        }
    }

    const formatCallNumber = (b?: { call_nmbr1?: string | null; call_nmbr2?: string | null; call_nmbr3?: string | null } | null) => {
        if (!b) return "-"
        return [b.call_nmbr1, b.call_nmbr2, b.call_nmbr3].filter(Boolean).join(" ") || "-"
    }

    const activeDetail = bookDetail || selectedBook
    const detailCopies = bookDetail?.copies || selectedBook?.copies || []
    const detailAvailableCount = detailCopies.filter((c) => c.status_cd === "in").length

    return (
        <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] selection:bg-blue-500/15">
            {/* Dynamic Island Floating Header (White Frosted Glass) */}
            <header className="sticky top-3 z-30 flex justify-center px-4 pointer-events-none">
                <motion.div
                    initial={{ y: -24, opacity: 0, scale: 0.96 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 320, damping: 26 }}
                    className="pointer-events-auto flex items-center gap-2 sm:gap-3 px-2.5 py-2 rounded-full bg-white/75 backdrop-blur-2xl text-[#1d1d1f] shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-black/[0.08] max-w-full transition-colors"
                >

                    <div className="flex items-center gap-2 px-1 min-w-0">
                        <h1 className="font-[k-medium] text-xs sm:text-sm tracking-tight text-[#1d1d1f] truncate">
                            โรงเรียนสันป่าตองวิทยาคม
                        </h1>
                    </div>

                    <div className="h-4 w-px bg-black/10 shrink-0" />

                    {/* Search inside Dynamic Island */}
                    <div className="relative flex items-center">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#86868b] pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="ค้นหา..."
                            className="h-8 w-32 sm:w-44 focus:w-44 sm:focus:w-64 pl-8 pr-7 rounded-full bg-black/[0.05] hover:bg-black/[0.08] focus:bg-white/90 text-xs font-[k-regular] text-[#1d1d1f] placeholder:text-[#86868b] outline-none ring-1 ring-transparent focus:ring-black/10 transition-all duration-300"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] cursor-pointer"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>
                </motion.div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6 sm:px-12 lg:px-16 py-6 sm:py-8">
                {/* Concise Title Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="flex items-baseline justify-between mb-5"
                >
                    <h2 className="font-[k-medium] text-xl sm:text-2xl tracking-tight text-[#1d1d1f]">
                        ชั้นหนังสือ
                    </h2>
                    <span className="font-[k-regular] text-xs sm:text-sm text-[#86868b]">
                        {totalBooks.toLocaleString()} รายการ
                    </span>
                </motion.div>

                {/* Book Grid: 4 Columns */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div
                                key={i}
                                className="rounded-2xl bg-white p-3 border border-black/[0.04] shadow-2xs animate-pulse space-y-2.5"
                            >
                                <div className="aspect-[4/5] rounded-xl bg-black/[0.05]" />
                                <div className="h-3.5 bg-black/[0.06] rounded w-3/4" />
                                <div className="h-3 bg-black/[0.04] rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : books.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="rounded-3xl bg-white border border-black/[0.05] py-16 px-6 text-center shadow-2xs"
                    >
                        <div className="size-12 rounded-2xl bg-black/[0.04] text-[#86868b] flex items-center justify-center mx-auto mb-3">
                            <BookOpen className="size-6" />
                        </div>
                        <p className="font-[k-medium] text-base text-[#1d1d1f]">
                            ไม่พบรายการหนังสือ
                        </p>
                        <p className="font-[k-light] text-sm text-[#86868b] mt-1">
                            {debouncedSearch ? "ลองเปลี่ยนคำค้นหาใหม่อีกครั้ง" : "ยังไม่มีหนังสือที่เผยแพร่ในขณะนี้"}
                        </p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {books.map((book, idx) => {
                            const availableCount = (book.copies || []).filter((c) => c.status_cd === "in").length
                            const callNo = formatCallNumber(book)

                            return (
                                <motion.button
                                    key={book.bibid}
                                    type="button"
                                    initial={{ opacity: 0, y: 14, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{
                                        duration: 0.35,
                                        delay: Math.min(idx * 0.03, 0.3),
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                    whileHover={{ y: -4 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleOpenBook(book)}
                                    className="group text-left rounded-2xl bg-white border border-black/[0.06] p-3 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_14px_30px_rgba(0,0,0,0.08)] transition-shadow duration-300 cursor-pointer flex flex-col"
                                >
                                    {/* Cover Image */}
                                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-[#f2f2f7] mb-2.5">
                                        <img
                                            src="/cover.png"
                                            alt={book.title || "ปกหนังสือ"}
                                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                                        />
                                        {callNo !== "-" && (
                                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-mono font-medium text-[#1d1d1f] shadow-xs">
                                                {callNo}
                                            </span>
                                        )}
                                    </div>

                                    {/* Concise Info */}
                                    <div className="flex-1 flex flex-col justify-between gap-1.5 px-0.5">
                                        <div>
                                            <h3 className="font-[k-medium] text-sm leading-snug text-[#1d1d1f] line-clamp-1 group-hover:text-blue-600 transition-colors">
                                                {book.title || "ไม่มีชื่อเรื่อง"}
                                            </h3>
                                            <p className="font-[k-light] text-xs text-[#86868b] line-clamp-1 mt-0.5">
                                                {book.author || "-"}
                                            </p>
                                        </div>

                                        <div className="pt-1.5 border-t border-black/[0.05] flex items-center justify-between text-[11px]">
                                            <span className="font-[k-regular] text-[#86868b] truncate max-w-[110px]">
                                                {book.category}
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 font-[k-medium] shrink-0">
                                                <span
                                                    className={cn(
                                                        "size-1.5 rounded-full",
                                                        availableCount > 0 ? "bg-emerald-500" : "bg-amber-500"
                                                    )}
                                                />
                                                <span className={availableCount > 0 ? "text-emerald-700" : "text-amber-700"}>
                                                    {availableCount > 0
                                                        ? `ว่าง ${availableCount}/${book.copyCount}`
                                                        : "ถูกยืมทั้งหมด"}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </motion.button>
                            )
                        })}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-10 flex items-center justify-center gap-2">
                        <button
                            type="button"
                            disabled={currentPage <= 1}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className="h-9 px-3.5 rounded-full bg-white border border-black/[0.08] text-xs font-[k-medium] flex items-center gap-1 hover:bg-black/[0.03] disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
                        >
                            <ChevronLeft className="size-4" />
                            <span>ก่อนหน้า</span>
                        </button>
                        <span className="px-3 text-xs font-mono text-[#86868b]">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            type="button"
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            className="h-9 px-3.5 rounded-full bg-white border border-black/[0.08] text-xs font-[k-medium] flex items-center gap-1 hover:bg-black/[0.03] disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
                        >
                            <span>ถัดไป</span>
                            <ChevronRight className="size-4" />
                        </button>
                    </div>
                )}
            </main>

            {/* Book Detail Modal (Apple-style Clean Modal) */}
            <Dialog
                open={!!selectedBook}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedBook(null)
                        setBookDetail(null)
                    }
                }}
            >
                <DialogContent className="sm:max-w-2xl max-h-[88vh] overflow-y-auto rounded-3xl bg-white text-[#1d1d1f] border border-black/[0.08] p-0 shadow-2xl">
                    {activeDetail && (
                        <div className="p-6 sm:p-7 space-y-6">
                            {/* Top Book Overview */}
                            <div className="flex flex-col sm:flex-row gap-5 pr-6">
                                <div className="w-32 sm:w-36 aspect-[3/4] rounded-2xl overflow-hidden bg-[#f2f2f7] shrink-0 mx-auto sm:mx-0 shadow-sm border border-black/[0.05]">
                                    <img
                                        src="/cover.png"
                                        alt={activeDetail.title || "ปกหนังสือ"}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                <div className="flex-1 min-w-0 space-y-2.5 text-center sm:text-left">
                                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                        <span className="px-2.5 py-0.5 rounded-full bg-black/[0.05] text-[11px] font-[k-medium] text-[#1d1d1f]">
                                            {bookDetail?.material || selectedBook?.category || "หนังสือ"}
                                        </span>
                                        {bookDetail?.collection && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-[11px] font-[k-medium] text-blue-700">
                                                <MapPin className="size-3" />
                                                {bookDetail.collection}
                                            </span>
                                        )}
                                    </div>

                                    <DialogTitle className="font-[k-medium] text-xl sm:text-2xl leading-snug text-[#1d1d1f]">
                                        {activeDetail.title || "ไม่มีชื่อเรื่อง"}
                                    </DialogTitle>

                                    <p className="font-[k-regular] text-sm text-[#86868b]">
                                        {activeDetail.author || "-"}
                                    </p>

                                    <div className="pt-1 flex items-center justify-center sm:justify-start gap-2">
                                        <span
                                            className={cn(
                                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-[k-medium]",
                                                detailAvailableCount > 0
                                                    ? "bg-emerald-50 text-emerald-700"
                                                    : "bg-amber-50 text-amber-700"
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "size-1.5 rounded-full",
                                                    detailAvailableCount > 0 ? "bg-emerald-500" : "bg-amber-500"
                                                )}
                                            />
                                            {detailAvailableCount > 0
                                                ? `พร้อมให้ยืม ${detailAvailableCount} จาก ${detailCopies.length} เล่ม`
                                                : "ถูกยืมครบทุกเล่ม"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Concise Metadata Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl bg-[#f5f5f7] p-4 text-xs">
                                <div>
                                    <span className="text-[#86868b] font-[k-light] block">เลขเรียกหนังสือ</span>
                                    <span className="font-mono font-medium text-[#1d1d1f] mt-0.5 block">
                                        {bookDetail?.marc?.deweyCallNumber || formatCallNumber(activeDetail)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[#86868b] font-[k-light] block">ISBN</span>
                                    <span className="font-mono font-medium text-[#1d1d1f] mt-0.5 block">
                                        {bookDetail?.marc?.isbn || selectedBook?.isbn || "-"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[#86868b] font-[k-light] block">สำนักพิมพ์ / ปี</span>
                                    <span className="font-[k-regular] text-[#1d1d1f] mt-0.5 block truncate">
                                        {[bookDetail?.marc?.publisher, bookDetail?.marc?.publicationYear].filter(Boolean).join(" ") || "-"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[#86868b] font-[k-light] block">ลักษณะกายภาพ</span>
                                    <span className="font-[k-regular] text-[#1d1d1f] mt-0.5 block truncate">
                                        {[bookDetail?.marc?.physicalExtent, bookDetail?.marc?.physicalSize].filter(Boolean).join(" • ") || "-"}
                                    </span>
                                </div>
                            </div>

                            {bookDetail?.marc?.summary && (
                                <div className="text-xs font-[k-light] text-[#515154] leading-relaxed bg-[#f5f5f7]/60 rounded-2xl p-4">
                                    {bookDetail.marc.summary}
                                </div>
                            )}

                            {/* Copies List */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-[k-medium] text-sm text-[#1d1d1f]">
                                        รายการตัวเล่ม ({detailCopies.length})
                                    </h4>
                                    {detailLoading && (
                                        <Loader2 className="size-4 animate-spin text-[#86868b]" />
                                    )}
                                </div>

                                {detailCopies.length === 0 ? (
                                    <div className="rounded-2xl border border-black/[0.06] py-6 text-center text-xs text-[#86868b] font-[k-light]">
                                        ไม่มีข้อมูลตัวเล่ม
                                    </div>
                                ) : (
                                    <div className="divide-y divide-black/[0.06] rounded-2xl border border-black/[0.06] overflow-hidden bg-white">
                                        {detailCopies.map((copy, idx) => {
                                            const isAvailable = copy.status_cd === "in"
                                            return (
                                                <motion.div
                                                    key={copy.copyid}
                                                    initial={{ opacity: 0, x: -6 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.22, delay: Math.min(idx * 0.03, 0.25) }}
                                                    className="px-4 py-3 flex items-center justify-between gap-3 text-xs hover:bg-[#f5f5f7]/60 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <span className="px-2 py-0.5 rounded-md bg-[#f5f5f7] font-mono font-medium text-[#1d1d1f] shrink-0">
                                                            ฉบับที่ {copy.copyid}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-[#1d1d1f] truncate">
                                                            <Barcode className="size-3.5 text-[#86868b] shrink-0" />
                                                            {copy.barcode_nmbr}
                                                        </span>
                                                        {copy.copy_desc && (
                                                            <span className="font-[k-light] text-[#86868b] truncate hidden sm:inline">
                                                                {copy.copy_desc}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <span
                                                        className={cn(
                                                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-[k-medium] shrink-0",
                                                            isAvailable
                                                                ? "bg-emerald-50 text-emerald-700"
                                                                : "bg-amber-50 text-amber-700"
                                                        )}
                                                    >
                                                        <span
                                                            className={cn(
                                                                "size-1.5 rounded-full",
                                                                isAvailable ? "bg-emerald-500" : "bg-amber-500"
                                                            )}
                                                        />
                                                        {isAvailable ? "อยู่บนชั้น" : "ถูกยืม"}
                                                    </span>
                                                </motion.div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
