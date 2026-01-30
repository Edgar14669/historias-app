import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calculator, RefreshCw, X, Clock } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface MathCaptchaProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MAX_ATTEMPTS = 3;
const COOLDOWN_SECONDS = 30;

const MathCaptcha = ({ isOpen, onClose, onSuccess }: MathCaptchaProps) => {
  const { t } = useTranslation();
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [operator, setOperator] = useState<"+" | "×">("+");
  const [userAnswer, setUserAnswer] = useState("");
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  // Cooldown timer
  useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setTimeout(() => {
        setCooldownTime(cooldownTime - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isLocked && cooldownTime === 0) {
      setIsLocked(false);
      setAttempts(0);
      generateNewProblem();
    }
  }, [cooldownTime, isLocked]);

  const generateNewProblem = () => {
    // Randomly choose between addition and multiplication
    const useMultiplication = Math.random() > 0.4;
    
    if (useMultiplication) {
      // Multiplication: numbers between 6-12 (e.g., 7×9 = 63)
      setNum1(Math.floor(Math.random() * 7) + 6); // 6-12
      setNum2(Math.floor(Math.random() * 7) + 6); // 6-12
      setOperator("×");
    } else {
      // Addition with larger numbers: 15-50 + 15-50
      setNum1(Math.floor(Math.random() * 36) + 15); // 15-50
      setNum2(Math.floor(Math.random() * 36) + 15); // 15-50
      setOperator("+");
    }
    
    setUserAnswer("");
    setError(false);
  };

  useEffect(() => {
    if (isOpen) {
      generateNewProblem();
      // Reset attempts when reopening
      setAttempts(0);
      setIsLocked(false);
      setCooldownTime(0);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    
    const correctAnswer = operator === "×" ? num1 * num2 : num1 + num2;
    
    if (parseInt(userAnswer) === correctAnswer) {
      onSuccess();
      onClose();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError(true);
      
      if (newAttempts >= MAX_ATTEMPTS) {
        setIsLocked(true);
        setCooldownTime(COOLDOWN_SECONDS);
        setUserAnswer("");
      } else {
        setTimeout(() => {
          generateNewProblem();
        }, 1000);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-sm bg-card rounded-2xl p-6 shadow-2xl border border-border"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold text-foreground">{t("verificationRequired")}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-muted transition-colors"
            disabled={isLocked}
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          {t("solveMathProblem")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isLocked ? (
            <div className="flex flex-col items-center gap-3 py-6 bg-destructive/10 rounded-xl border border-destructive/30">
              <Clock className="w-10 h-10 text-destructive animate-pulse" />
              <p className="text-destructive font-semibold text-center">
                {t("tooManyAttempts")}
              </p>
              <p className="text-3xl font-bold text-destructive">
                {cooldownTime}s
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center gap-3 py-4 bg-muted rounded-xl">
                <span className="text-3xl font-bold text-foreground">{num1}</span>
                <span className="text-3xl font-bold text-accent">{operator}</span>
                <span className="text-3xl font-bold text-foreground">{num2}</span>
                <span className="text-3xl font-bold text-muted-foreground">=</span>
                <span className="text-3xl font-bold text-accent">?</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={userAnswer}
                  onChange={(e) => {
                    setUserAnswer(e.target.value);
                    setError(false);
                  }}
                  placeholder={t("yourAnswer")}
                  className={`flex-1 py-3 px-4 text-center text-xl font-bold bg-background text-foreground rounded-xl border ${
                    error ? "border-destructive" : "border-border"
                  } focus:outline-none focus:ring-2 focus:ring-accent`}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={generateNewProblem}
                  className="p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
                >
                  <RefreshCw className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </>
          )}

          {error && !isLocked && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-destructive text-center"
            >
              {t("wrongAnswer")}
            </motion.p>
          )}

          {attempts > 0 && !isLocked && (
            <p className="text-sm text-muted-foreground text-center">
              {t("attemptsRemaining")}: {MAX_ATTEMPTS - attempts}
            </p>
          )}

          {!isLocked && (
            <button
              type="submit"
              disabled={!userAnswer}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-semibold hover:from-amber-500 hover:to-orange-600 transition-all disabled:opacity-50"
            >
              {t("confirmAnswer")}
            </button>
          )}
        </form>
      </motion.div>
    </div>
  );
};

export default MathCaptcha;
