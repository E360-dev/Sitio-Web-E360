import React from "react";

export default function ServiceCard({ title, description }) {
  return (
    <div className="bg-white shadow p-6 rounded-lg">
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-700">{description}</p>
    </div>
  );
}