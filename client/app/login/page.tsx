"use client"

import { LoginForm } from "@/components/login-form"
import { Toaster } from "@/components/ui/sonner"
import Lanyard from '../../components/Lanyard'
import { motion } from "framer-motion"

export default function LoginPage() {
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
        className="z-[10] w-full max-w-sm flex justify-center"
      >
        <LoginForm />
      </motion.div>
      <div className="z-[0] w-full h-full absolute pointer-events-none">
        <div className="translate-x-[-30%]">
          <Lanyard
            frontImage='/cmu.png'
            backImage='/cmulogo.png'
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