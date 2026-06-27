import { motion } from 'framer-motion'

// Pembungkus animasi muncul saat elemen masuk viewport.
export default function Reveal({
  children,
  className,
  delay = 0,
  y = 26,
  as = 'div',
  once = true,
}) {
  const MotionTag = motion[as] ?? motion.div
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </MotionTag>
  )
}
