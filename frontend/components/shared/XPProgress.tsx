import { cn } from "@/lib/utils";

interface XPProgressProps {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  className?: string;
  showLabel?: boolean;
}

export function XPProgress({ level, currentXP, nextLevelXP, className, showLabel = true }: XPProgressProps) {
  const percentage = Math.min(100, Math.max(0, (currentXP / nextLevelXP) * 100));

  return (
    <div className={cn("flex flex-col space-y-1", className)}>
      {showLabel && (
        <div className="flex justify-between items-end text-xs font-medium">
          <span className="text-primary font-bold">LVL {level}</span>
          <span className="text-muted-foreground">
            {currentXP} / {nextLevelXP} XP
          </span>
        </div>
      )}
      <div className="h-2 w-full bg-secondary overflow-hidden rounded-full border border-border">
        <div 
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out relative"
          style={{ width: `${percentage}%` }}
        >
          {/* Shimmer effect for gaming feel */}
          <div className="absolute top-0 right-0 bottom-0 left-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>
      </div>
    </div>
  );
}
