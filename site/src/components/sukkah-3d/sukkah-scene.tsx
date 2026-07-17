"use client";

import { Canvas } from "@react-three/fiber";
import { SukkahModel, type SukkahType } from "./sukkah-model";

export function SukkahScene({
  stage,
  sukkahType,
  className,
}: {
  stage: number;
  sukkahType: SukkahType;
  className?: string;
}) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [5.5, 3, 7], fov: 36, near: 0.5, far: 50 }}
        dpr={[1, 1.75]}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[3, 4, 3]} intensity={40} color="#ffb877" />
        <pointLight position={[-3, 2, -3]} intensity={20} color="#37b463" />
        <SukkahModel stage={stage} sukkahType={sukkahType} />
      </Canvas>
    </div>
  );
}
