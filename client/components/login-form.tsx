"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { IdCard, LogIn, Loader2 } from "lucide-react"
import { cn } from "cn"
import { PlayBook } from "@/class/playbook.class"

interface LoginFormProps extends React.ComponentProps<"div"> {
  onSuccess?: (studentId: string) => void
  redirectTo?: string
}

export function LoginForm({
  className,
  onSuccess,
  redirectTo = "/catalog",
  ...props
}: LoginFormProps) {
  const router = useRouter()
  const [studentId, setStudentId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const trimmedId = studentId.trim()
    if (!trimmedId) {
      setError("กรุณากรอกรหัสนักศึกษา")
      toast.error("กรุณากรอกรหัสนักศึกษา")
      return
    }

    setError("")
    setIsLoading(true)

    try {
      // บันทึกรหัสนักศึกษาใน localStorage

      let pb = new PlayBook()

      let result = await pb.login(trimmedId)

      console.log(result)

      if (result.logged) {
        localStorage.setItem("token", result.token)

        setTimeout(() => {

          toast.success("เข้าสู่ระบบสำเร็จ")

          router.replace("/catalog")
          setIsLoading(false)
        }, 1000)


      } else {
        toast.error("รหัสนักศึกษาไม่ถูกต้อง")

        setTimeout(() => {
          setIsLoading(false)
        }, 1000)
      }


    } catch {
      toast.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบ")
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("w-full max-w-sm z-[10]", className)} {...props}>
      <Card className="shadow-md border-border">
        <CardHeader className="text-center space-y-1.5 pb-2">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IdCard className="size-6" />
          </div>
          <CardTitle className="text-2xl font-[k-medium]">เข้าสู่ระบบ</CardTitle>
          <CardDescription className="text-sm">
            กรุณากรอกรหัสนักศึกษาเพื่อเข้าสู่ระบบ
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studentId" className="text-sm font-[k-medium]">
                Student ID
              </Label>
              <Input
                id="studentId"
                name="studentId"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="กรอกรหัสนักศึกษา"
                value={studentId}
                onChange={(e) => {
                  setStudentId(e.target.value)
                  if (error) setError("")
                }}
                disabled={isLoading}
                autoFocus
                className="h-10 text-base"
              />
              {error && (
                <p className="text-xs text-destructive font-[k-regular]">{error}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading || !studentId.trim()}
              className="w-full h-10 text-base font-[k-medium] cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 size-4" />
                  เข้าสู่ระบบ
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
