// app/components/Card.tsx
import React from "react";

interface CardProps {
  title: string;
  description: string;
  className?: string;
}

export default function Card({ title, description, className }: CardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow-md p-4 border border-gray-200 ${className ?? ""}`}
    >
      <h2 className="text-lg font-semibold mb-2 text-gray-900">{title}</h2>
      <p className="text-gray-700">{description}</p>
    </div>
  );
}
