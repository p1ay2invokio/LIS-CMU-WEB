"use client"

import { useEffect, useState } from "react"
import { LoginForm } from "@/components/login-form"
import { Toaster } from "@/components/ui/sonner"
import Lanyard from '../../components/Lanyard'
import { motion } from "framer-motion"
import { endpoint } from "@/config"
import { Globe, Database } from "lucide-react"

type NetworkStatus = "checking" | "connected" | "offline"
type DatabaseStatus = "checking" | "connected" | "error"

export default function LoginPage() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>("checking")
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>("checking")

  useEffect(() => {
    let isMounted = true

    const checkNetwork = async () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        if (isMounted) setNetworkStatus("offline")
        return
      }

      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 4000)
        await fetch("https://www.gstatic.com/generate_204", {
          mode: "no-cors",
          cache: "no-store",
          signal: controller.signal,
        })
        clearTimeout(timeout)
        if (isMounted) setNetworkStatus("connected")
      } catch {
        if (isMounted) setNetworkStatus("offline")
      }
    }

    const checkDatabase = async () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        if (isMounted) setDbStatus("error")
        return
      }

      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000)
        const res = await fetch(`${endpoint}/health`, {
          cache: "no-store",
          signal: controller.signal,
        })
        clearTimeout(timeout)

        const data = await res.json().catch(() => null)
        if (!isMounted) return

        if (res.ok && data?.database) {
          setDbStatus("connected")
        } else {
          setDbStatus("error")
        }
      } catch {
        if (isMounted) setDbStatus("error")
      }
    }

    const checkAll = () => {
      checkNetwork()
      checkDatabase()
    }

    checkAll()
    const interval = setInterval(checkAll, 10000)
    window.addEventListener("online", checkAll)
    window.addEventListener("offline", checkAll)

    return () => {
      isMounted = false
      clearInterval(interval)
      window.removeEventListener("online", checkAll)
      window.removeEventListener("offline", checkAll)
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="min-h-screen flex items-center justify-center bg-muted/40 p-4 font-[k-regular] relative overflow-hidden"
    >
      <Toaster position="top-center" richColors />
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
        className="z-[10] w-full max-w-sm flex flex-col items-center gap-3"
      >
        <LoginForm />

        <div className="flex flex-col items-center gap-1 text-[11px] font-[k-regular]">
          <div
            className={
              networkStatus === "connected"
                ? "flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"
                : networkStatus === "checking"
                  ? "flex items-center gap-1.5 text-muted-foreground"
                  : "flex items-center gap-1.5 text-red-500"
            }
          >
            <Globe className="size-3 shrink-0" />
            <span>
              {networkStatus === "connected"
                ? "Network Connected"
                : networkStatus === "checking"
                  ? "Network: กำลังตรวจสอบ..."
                  : "Network: ไม่สามารถเชื่อมต่อได้"}
            </span>
          </div>

          <div
            className={
              dbStatus === "connected"
                ? "flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"
                : dbStatus === "checking"
                  ? "flex items-center gap-1.5 text-muted-foreground"
                  : "flex items-center gap-1.5 text-red-500"
            }
          >
            <Database className="size-3 shrink-0" />
            <span>
              {dbStatus === "connected"
                ? "Database Connected"
                : dbStatus === "checking"
                  ? "Database: กำลังตรวจสอบ..."
                  : "Database Disconnected"}
            </span>
          </div>
        </div>
      </motion.div>
      <div className="z-[0] w-full h-full absolute pointer-events-none">
        <div className="translate-x-[-30%]">
          <Lanyard
            frontImage='/cmu.png'
            backImage='/morchorlogo.png'
            // lanyardImage={'/cmulogo.png'}
            position={[0, 0, 20]}
            gravity={[0, -20, 0]}
            fov={20}
          />
        </div>
      </div>
    </motion.div>
  )
}