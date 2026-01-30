import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
}

const SectionHeader = ({ title, onSeeAll }: SectionHeaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="section-title"
    >
      <span>{title}</span>
      {onSeeAll && (
        <button
          onClick={onSeeAll}
          className="flex items-center text-sm text-primary font-medium hover:underline"
        >
          Ver todos
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
};

export default SectionHeader;
