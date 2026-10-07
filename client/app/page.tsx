'use client'

import Image from "next/image";
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation";
import LightRays from '../components/LightRays';
import { motion } from "framer-motion";
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LIS CMU',
  description: 'ระบบลงทรัพยากรสารสนเทศห้องสมุด',
  icons:{
    icon: '/logo.png'
  }
}

export default function Home() {

  let navigate = useRouter()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative bg-[#0e1111] w-full h-screen"
    >

      <LightRays
        raysOrigin="top-center"
        raysColor="#ffffff"
        raysSpeed={1}
        lightSpread={0.5}
        rayLength={3}
        followMouse={true}
        mouseInfluence={0.1}
        noiseAmount={0}
        distortion={0}
        className="custom-rays"
        pulsating={false}
        fadeDistance={1}
        saturation={1}
      />

      {/* <PixelSnow
        color="#A1E3F7"
        flakeSize={0.02}
        minFlakeSize={1.25}
        pixelResolution={200}
        speed={1.3}
        density={0.1}
        direction={100}
        brightness={1}
        depthFade={8}
        farPlane={20}
        gamma={0.4545}
        variant="square"
      /> */}

      {/* <Aurora
        colorStops={["#6d28d9", "#ec4899", "#06b6d4"]}
        blend={0.5}
        amplitude={1.0}
        speed={1}
        lightMode
      /> */}


      {/* <div className="absolute inset-0 z-10 bg-black/50 pointer-events-none" /> */}

      {/* Text */}
      <motion.div
        initial={{ opacity: 0, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
        className="absolute inset-0 z-20 flex items-center flex-col justify-center pointer-events-none"
      >

        <h1 className="font-[k-medium] text-white text-[50px]">
          โรงเรียนวัดห้วยแก้ว
        </h1>
        <h1 className="font-[k-regular] text-white/60 text-[20px] mt-[-10px]">
          โครงการผ้าป่าหนังสือสร้างห้องสมุด 2569
        </h1>

        <div className="flex  gap-5 mt-6 pointer-events-auto">
          <Button className="font-[k-regular] bg-white text-black text-lg p-[20px] cursor-pointer">ห้องสมุดโรงเรียน</Button>
          <Button onClick={() => {
            navigate.push("/catalog")
          }} className="font-[k-regular] text-lg p-[20px] cursor-pointer">ทรัพยากรสารสนเทศ</Button>
        </div>
      </motion.div>

    </motion.div>
  );
}
