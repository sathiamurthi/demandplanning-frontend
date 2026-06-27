"use client";

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight } from "lucide-react";

import DashboardLayout from "@/components/DashboardLayout";

const initialCart = [
  {
    id: 1,
    name: "Wireless Headphones",
    sku: "WH-001",
    price: 49.99,
    qty: 3,
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80&h=80&fit=crop",
  },
  {
    id: 2,
    name: "Smart Watch Pro",
    sku: "SW-002",
    price: 199.99,
    qty: 1,
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&h=80&fit=crop",
  },
  {
    id: 3,
    name: "USB-C Hub 7-in-1",
    sku: "UH-003",
    price: 29.99,
    qty: 5,
    image:
      "https://images.unsplash.com/photo-1625895197185-efcec01cffe0?w=80&h=80&fit=crop",
  },
];

export default function Cart() {
  const [items, setItems] = useState(initialCart);

  const updateQty = (id: number, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, qty: Math.max(1, item.qty + delta) }
          : item
      )
    );
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  return (
    <DashboardLayout title="Cart" subtitle="Review and manage your current order.">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.length === 0 ? (
            <div className="bg-[#161a23] border border-white/8 rounded-xl p-12 text-center">
              <ShoppingCart size={40} className="text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">Your cart is empty</p>
            </div>
          ) : (
            items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-[#161a23] border border-white/8 rounded-xl p-5 flex items-center gap-4"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">
                    {item.name}
                  </p>
                  <p className="text-white/40 text-xs font-mono mt-0.5">
                    {item.sku}
                  </p>
                  <p className="text-[#6c63ff] font-bold text-sm mt-1">
                    ${item.price.toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQty(item.id, -1)}
                    className="w-7 h-7 rounded-lg bg-white/8 hover:bg-white/15 flex items-center justify-center"
                  >
                    <Minus size={13} className="text-white/60" />
                  </button>

                  <span className="text-white text-sm font-semibold w-6 text-center">
                    {item.qty}
                  </span>

                  <button
                    onClick={() => updateQty(item.id, 1)}
                    className="w-7 h-7 rounded-lg bg-white/8 hover:bg-white/15 flex items-center justify-center"
                  >
                    <Plus size={13} className="text-white/60" />
                  </button>
                </div>

                <div className="text-right hidden sm:block">
                  <p className="text-white font-bold text-sm">
                    ${(item.price * item.qty).toFixed(2)}
                  </p>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center"
                >
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </motion.div>
            ))
          )}
        </div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#161a23] border border-white/8 rounded-xl p-6 h-fit"
        >
          <h2 className="text-white font-semibold mb-5">Order Summary</h2>

          <div className="space-y-3 mb-5">
            <div className="flex justify-between text-sm">
              <span className="text-white/50">
                Subtotal ({items.length} items)
              </span>
              <span className="text-white">${subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-white/50">Tax (8%)</span>
              <span className="text-white">${tax.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-white/50">Shipping</span>
              <span className="text-emerald-400 font-semibold">Free</span>
            </div>

            <div className="border-t border-white/8 pt-3 flex justify-between">
              <span className="text-white font-semibold">Total</span>
              <span className="text-white font-bold text-lg">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>

          <button className="w-full bg-[#6c63ff] hover:bg-[#5a52e0] text-white py-3 rounded-lg flex items-center justify-center gap-2">
            Proceed to Checkout <ArrowRight size={16} />
          </button>

          <button className="w-full mt-3 border border-white/10 text-white/60 hover:text-white py-2.5 rounded-lg">
            Continue Shopping
          </button>
        </motion.div>

      </div>
    </DashboardLayout>
  );
}