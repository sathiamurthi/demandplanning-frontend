import { useState } from "react";

export function useToast() {
  const [toast, setToast] = useState<any>(null);

  function show(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });

    setTimeout(() => setToast(null), 3000);
  }

  return { toast, show };
}

