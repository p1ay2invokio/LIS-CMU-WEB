import { endpoint } from "@/config"
import axios from "axios"

export class PlayBook {
    public collections = async () => {
        let data = await axios.get(`${endpoint}/collections`)

        return data.data
    }

    public materials = async () => {
        let data = await axios.get(`${endpoint}/materials`)

        return data.data
    }

    public addbook = async (formData: any) => {
        let data = await axios.post(`${endpoint}/book`, formData)

        return data.data
    }

    public getBooks = async () => {
        let data = await axios.get(`${endpoint}/books`)

        return data.data
    }

    public login = async (student_id: string) => {
        let data = await axios.post(`${endpoint}/login`, {
            student_id: student_id
        })

        return data.data
    }

    public uploadImageToAI = async (file: File, sessionId: string) => {

        let formData = new FormData()

        formData.append("image", file)
        formData.append("sessionId", sessionId)

        let data = await axios.post(`${endpoint}/askai`, formData)

        return data.data
    }

    public getStats = async () => {
        let data = await axios.get(`${endpoint}/stats`)

        return data.data
    }

    public updateBookStatus = async (bibid: number | string, status: string) => {
        let token = typeof window !== "undefined" ? localStorage.getItem("token") : null
        let headers: any = {}
        if (token) {
            headers["Authorization"] = `Bearer ${token}`
        }
        let data = await axios.patch(`${endpoint}/book/${bibid}/status`, { status }, { headers })

        return data.data
    }

    public updateBook = async (bibid: number | string, bookData: any) => {
        let token = typeof window !== "undefined" ? localStorage.getItem("token") : null
        let headers: any = {}
        if (token) {
            headers["Authorization"] = `Bearer ${token}`
        }
        let data = await axios.put(`${endpoint}/book/${bibid}`, bookData, { headers })

        return data.data
    }

    public addBookCopy = async (bibid: number | string, copyData?: any) => {
        let data = await axios.post(`${endpoint}/book/${bibid}/copy`, copyData || {})

        return data.data
    }

    public getBook = async (bibid: number | string) => {
        let data = await axios.get(`${endpoint}/book/${bibid}`)

        return data.data
    }

    public checkIsbn = async (isbn: string) => {
        let data = await axios.get(`${endpoint}/book/check-isbn`, {
            params: { isbn }
        })

        return data.data
    }

    public getHistory = async (userid?: number | string) => {
        let token = typeof window !== "undefined" ? localStorage.getItem("token") : null
        let headers: any = {}
        if (token) {
            headers["Authorization"] = `Bearer ${token}`
        }
        let data = await axios.get(`${endpoint}/history`, {
            params: userid ? { userid } : {},
            headers,
        })

        return data.data
    }

    public deleteBook = async (bibid: number | string) => {
        let token = typeof window !== "undefined" ? localStorage.getItem("token") : null
        let headers: any = {}
        if (token) {
            headers["Authorization"] = `Bearer ${token}`
        }
        let data = await axios.delete(`${endpoint}/book/${bibid}`, {
            headers,
        })

        return data.data
    }

    public deleteBookCopy = async (bibid: number | string, copyid: number | string) => {
        let token = typeof window !== "undefined" ? localStorage.getItem("token") : null
        let headers: any = {}
        if (token) {
            headers["Authorization"] = `Bearer ${token}`
        }
        let data = await axios.delete(`${endpoint}/book/${bibid}/copy/${copyid}`, {
            headers,
        })

        return data.data
    }
}

