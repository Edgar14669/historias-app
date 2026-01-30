import { motion } from "framer-motion";

interface CategoryPillProps {
  name: string;
  icon?: string;
  isActive: boolean;
  onClick: () => void;
}

const CategoryPill = ({ name, icon, isActive, onClick }: CategoryPillProps) => {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={isActive ? "category-pill-active" : "category-pill-inactive"}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {name}
    </motion.button>
  );
};

export default CategoryPill;
