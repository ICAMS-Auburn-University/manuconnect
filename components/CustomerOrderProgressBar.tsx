"use client";

import { OrderStatus } from "@/lib/definitions";
import { Check } from "lucide-react";

// Using the enum provided by the parent component

interface OrderProgressBarProps {
  currentStatus: OrderStatus;
}

export function OrderProgressBar({ currentStatus }: OrderProgressBarProps) {
  const allStatuses = Object.values(OrderStatus);
  const currentIndex = allStatuses.indexOf(currentStatus);

  return (
    <div className="w-full px-2 py-6 overflow-x-auto">
      <div className="relative min-w-max md:min-w-0">
        {/* Progress bar line */}
        <div className="absolute top-1/4 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2" />

        {/* Status indicators */}
        <div
          className="relative flex justify-between"
          style={{
            gap: "clamp(8px, 2vw, 24px)",
            margin: "0 auto",
            width: "fit-content",
            minWidth: "100%",
          }}
        >
          {allStatuses.map((status, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = status === currentStatus;

            return (
              <div
                key={status}
                className="flex flex-col items-center"
                style={{ flex: "1" }}
              >
                <div
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mb-2 z-10 transition-colors duration-300 ${
                    isCompleted
                      ? "bg-brand text-white"
                      : isCurrent
                        ? "bg-brand text-white border-2 border-blue-600"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                  ) : (
                    <span className="text-[10px] sm:text-xs">{index + 1}</span>
                  )}
                </div>
                <span
                  className={`text-[8px] sm:text-xs text-center ${
                    isCurrent ? "font-medium text-brand" : "text-gray-500"
                  }`}
                >
                  {status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default OrderProgressBar;
