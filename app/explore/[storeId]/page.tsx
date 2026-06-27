"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  MapPin, Phone, Mail, Package, Building2, Eye, ArrowLeft,
  Search, Grid3X3, List, ExternalLink, Leaf, ShoppingCart, Pill,
  Utensils, Car, Store, Tag
} from "lucide-react";

const API = "/v1";

const IndustryIcon: Record<string, any> = {
  grocery: ShoppingCart, pharma: Pill, restaurant: Utensils,
  auto: Car, retail: Store, kirana: Store, tea: Leaf,
};

interface StoreDetail {
  id: string;
  store_name: string;
  company_name: string;
  industry_id: string;
  industry_name: string;
  item_noun: string;
  phone_masked: string | null;
  has_phone: boolean;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  owner_name: string | null;
  maps_url: string | null;
  product_count: number;
  categories: { id: string; name: string }[] | null;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  brand: string;
  selling_price: number;
  mrp: number;
  category: string;
  unit: string;
  in_stock: boolean;
}

export default function StoreDetailPage() {
  const { storeId } = useParams() as { storeId: string };
  const [store, setStore]           = useState<StoreDetail | null>(null);
  const [products, setProducts]     = useState<Product[]>([]);
  const [productMeta, setProductMeta] = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [prodLoading, setProdLoading] = useState(false);
  const [search, setSearch]         = useState("");
  const [category, setCategory]     = useState("");
  const [sort, setSort]             = useState("name_asc");
  const [layout, setLayout]         = useState<"grid" | "list">("grid");
  const [page, setPage]             = useState(1);
  const [revealedPhone, setRevealedPhone] = useState<string | null>(null);

  // Load store detail
  useEffect(() => {
    if (!storeId) return;
    fetch(`${API}/public/stores/${storeId}`)
      .then(r => r.json())
      .then(d => { if (d.success) setStore(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [storeId]);

  // Load products
  useEffect(() => {
    if (!storeId) return;
    setProdLoading(true);
    const params = new URLSearchParams({
      page: String(page), limit: "20", sort,
      ...(search && { search }),
      ...(category && { category }),
    });
    fetch(`${API}/public/stores/${storeId}/products?${params}`)
      .then(r => r.json())
      .then(d => { setProducts(d.data || []); setProductMeta(d.meta); })
      .catch(() => {})
      .finally(() => setProdLoading(false));
  }, [storeId, page, sort, search, category]);

  const handleRevealPhone = async () => {
    if (revealedPhone || !storeId) return;
    try {
      const r = await fetch(`${API}/public/stores/${storeId}/reveal-phone`, { method: "POST" });
      const d = await r.json();
      if (d.success) setRevealedPhone(d.data.phone);
    } catch { alert("Could not reveal phone."); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0f14] flex items-center justify-center">
        <div className="text-white/40 text-sm animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-[#0d0f14] flex flex-col items-center justify-center gap-4">
        <p className="text-white/40">Store not found.</p>
        <Link href="/explore" className="text-[#6c63ff] hover:underline text-sm">← Back to Explore</Link>
      </div>
    );
  }

  const Icon = IndustryIcon[store.industry_id] || Building2;

  return (
    <div className="min-h-screen bg-[#0d0f14] text-white">
      {/* Back */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <Link href="/explore" className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm">
          <ArrowLeft size={14} /> Back to Explore
        </Link>
      </div>

      {/* Store header */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-[#161a23] border border-white/8 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Icon */}
            <div className="w-16 h-16 bg-[#6c63ff]/15 rounded-2xl flex items-center justify-center shrink-0">
              <Icon size={28} className="text-[#6c63ff]" />
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-2xl font-bold text-white">{store.store_name}</h1>
                  {store.company_name !== store.store_name && (
                    <p className="text-white/50 text-sm">{store.company_name}</p>
                  )}
                  <span className="inline-flex items-center gap-1.5 mt-2 text-xs bg-[#6c63ff]/15 text-[#6c63ff] px-2.5 py-1 rounded-lg">
                    <Icon size={11} />
                    {store.industry_name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {store.maps_url && (
                    <a
                      href={store.maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-[#161a23] border border-white/10 rounded-xl px-4 py-2 text-sm text-white hover:border-[#6c63ff]/40"
                    >
                      <MapPin size={13} className="text-[#6c63ff]" />
                      Open in Maps
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>

              {/* Details grid */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(store.address || store.city) && (
                  <div className="flex items-start gap-2">
                    <MapPin size={13} className="text-white/30 mt-0.5 shrink-0" />
                    <div className="text-sm text-white/60">
                      {store.address && <p>{store.address}</p>}
                      <p>{[store.city, store.state, store.pincode].filter(Boolean).join(", ")}</p>
                    </div>
                  </div>
                )}

                {store.has_phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-white/30 shrink-0" />
                    {revealedPhone ? (
                      <a href={`tel:${revealedPhone}`} className="text-[#6c63ff] text-sm hover:underline">
                        {revealedPhone}
                      </a>
                    ) : (
                      <button
                        onClick={handleRevealPhone}
                        className="flex items-center gap-1.5 text-sm text-white/50 hover:text-[#6c63ff]"
                      >
                        <Eye size={12} />
                        <span className="font-mono">{store.phone_masked}</span>
                        <span className="text-white/30 text-xs">(click to reveal)</span>
                      </button>
                    )}
                  </div>
                )}

                {store.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={13} className="text-white/30 shrink-0" />
                    <a href={`mailto:${store.email}`} className="text-sm text-white/60 hover:text-white truncate">
                      {store.email}
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center gap-3">
                <span className="text-white/30 text-xs flex items-center gap-1">
                  <Package size={11} />
                  {store.product_count} {store.item_noun || "products"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products section */}
      <div className="max-w-6xl mx-auto px-4 pb-10">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-semibold text-white">Products / Items</h2>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="bg-[#161a23] border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white w-44 focus:outline-none focus:border-[#6c63ff]"
              />
            </div>

            {/* Category filter */}
            {store.categories && store.categories.length > 0 && (
              <select
                value={category}
                onChange={e => { setCategory(e.target.value); setPage(1); }}
                className="bg-[#161a23] border border-white/10 rounded-xl px-2 py-2 text-xs text-white focus:outline-none"
              >
                <option value="">All Categories</option>
                {store.categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            )}

            {/* Sort */}
            <select
              value={sort}
              onChange={e => { setSort(e.target.value); setPage(1); }}
              className="bg-[#161a23] border border-white/10 rounded-xl px-2 py-2 text-xs text-white focus:outline-none"
            >
              <option value="name_asc">Name A-Z</option>
              <option value="name_desc">Name Z-A</option>
              <option value="price_asc">Price: Low-High</option>
              <option value="price_desc">Price: High-Low</option>
            </select>

            {/* Layout */}
            <div className="flex bg-[#161a23] border border-white/10 rounded-xl overflow-hidden">
              <button onClick={() => setLayout("grid")} className={`p-2 ${layout==="grid"?"bg-[#6c63ff]/20 text-[#6c63ff]":"text-white/40"}`}>
                <Grid3X3 size={13} />
              </button>
              <button onClick={() => setLayout("list")} className={`p-2 ${layout==="list"?"bg-[#6c63ff]/20 text-[#6c63ff]":"text-white/40"}`}>
                <List size={13} />
              </button>
            </div>
          </div>
        </div>

        {prodLoading && (
          <div className={layout === "grid" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" : "flex flex-col gap-2"}>
            {Array.from({length: 8}).map((_,i) => (
              <div key={i} className="bg-[#161a23] border border-white/8 rounded-xl h-32 animate-pulse" />
            ))}
          </div>
        )}

        {!prodLoading && products.length === 0 && (
          <div className="text-center py-16 text-white/30 text-sm">
            No products found.
          </div>
        )}

        {!prodLoading && products.length > 0 && layout === "grid" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {products.map(p => (
              <div key={p.id} className="bg-[#161a23] border border-white/8 rounded-xl p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div className="w-8 h-8 bg-[#6c63ff]/10 rounded-lg flex items-center justify-center">
                    <Package size={14} className="text-[#6c63ff]" />
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${p.in_stock ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                    {p.in_stock ? "In Stock" : "Out"}
                  </span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium leading-tight">{p.name}</p>
                  {p.brand && <p className="text-white/40 text-xs">{p.brand}</p>}
                  {p.category && (
                    <p className="text-white/30 text-xs flex items-center gap-1 mt-1">
                      <Tag size={9} />{p.category}
                    </p>
                  )}
                </div>
                <div className="mt-auto">
                  {p.selling_price && (
                    <p className="text-white font-semibold text-sm">
                      ₹{p.selling_price}
                      {p.unit && <span className="text-white/40 text-xs font-normal">/{p.unit}</span>}
                    </p>
                  )}
                  {p.mrp && p.mrp > p.selling_price && (
                    <p className="text-white/30 text-xs line-through">₹{p.mrp}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!prodLoading && products.length > 0 && layout === "list" && (
          <div className="flex flex-col gap-2">
            {products.map(p => (
              <div key={p.id} className="bg-[#161a23] border border-white/8 rounded-xl px-5 py-3 flex items-center gap-4">
                <div className="w-8 h-8 bg-[#6c63ff]/10 rounded-lg flex items-center justify-center shrink-0">
                  <Package size={14} className="text-[#6c63ff]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{p.name}</p>
                  <p className="text-white/40 text-xs">{[p.brand, p.category].filter(Boolean).join(" · ")}</p>
                </div>
                {p.sku && <p className="text-white/30 text-xs font-mono hidden sm:block">{p.sku}</p>}
                <div className="text-right">
                  {p.selling_price && <p className="text-white text-sm font-semibold">₹{p.selling_price}</p>}
                  <span className={`text-xs ${p.in_stock ? "text-emerald-400" : "text-red-400"}`}>
                    {p.in_stock ? "In Stock" : "Out"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {productMeta && productMeta.pages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
              className="px-4 py-2 rounded-lg bg-[#161a23] border border-white/10 text-sm text-white/60 disabled:opacity-30">
              ← Prev
            </button>
            <span className="text-white/40 text-sm py-2">Page {page} of {productMeta.pages}</span>
            <button onClick={() => setPage(p => Math.min(productMeta.pages, p+1))} disabled={page===productMeta.pages}
              className="px-4 py-2 rounded-lg bg-[#161a23] border border-white/10 text-sm text-white/60 disabled:opacity-30">
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
