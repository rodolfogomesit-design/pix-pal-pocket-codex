import { motion } from "framer-motion";

interface Props {
  size?: number;
  className?: string;
}

const AnimatedPig = ({ size = 48, className = "" }: Props) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`pig-logo ${className}`}
      whileHover={{ scale: 1.1 }}
    >
      {/* Face */}
      <circle cx="50" cy="55" r="32" className="pig-face" />

      {/* Left ear - swinging */}
      <motion.ellipse
        cx="25" cy="28" rx="12" ry="14"
        className="pig-ear"
        style={{ transformOrigin: "30px 40px" }}
        animate={{ rotate: [-8, 12, -8] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Right ear - swinging opposite */}
      <motion.ellipse
        cx="75" cy="28" rx="12" ry="14"
        className="pig-ear"
        style={{ transformOrigin: "70px 40px" }}
        animate={{ rotate: [8, -12, 8] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
      />

      {/* Left eye */}
      <motion.ellipse
        cx="38" cy="50" rx="4" ry="5"
        className="pig-eye"
        animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, times: [0, 0.42, 0.46, 0.5, 1] }}
        style={{ transformOrigin: "38px 50px" }}
      />

      {/* Right eye */}
      <motion.ellipse
        cx="62" cy="50" rx="4" ry="5"
        className="pig-eye"
        animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, times: [0, 0.42, 0.46, 0.5, 1] }}
        style={{ transformOrigin: "62px 50px" }}
      />

      {/* Eye shine left */}
      <circle cx="36" cy="48" r="1.5" className="pig-eye-shine" />
      {/* Eye shine right */}
      <circle cx="60" cy="48" r="1.5" className="pig-eye-shine" />

      {/* Snout */}
      <ellipse cx="50" cy="63" rx="14" ry="10" className="pig-ear" />

      {/* Nostrils */}
      <ellipse cx="44" cy="63" rx="3" ry="2.5" className="pig-nostril" />
      <ellipse cx="56" cy="63" rx="3" ry="2.5" className="pig-nostril" />

      {/* Animated smile */}
      <motion.path
        d="M 42 72 Q 50 78 58 72"
        className="pig-smile"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        animate={{
          d: [
            "M 44 72 Q 50 75 56 72",
            "M 40 71 Q 50 82 60 71",
            "M 44 72 Q 50 75 56 72",
          ],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Cheeks - pulse with smile */}
      <motion.circle
        cx="28" cy="60" r="6"
        className="pig-cheek"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.circle
        cx="72" cy="60" r="6"
        className="pig-cheek"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.svg>
  );
};

export default AnimatedPig;
