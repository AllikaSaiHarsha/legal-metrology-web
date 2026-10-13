"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { Package, Search, Factory, Calendar, Activity, ArrowUpRight, Sparkles, Barcode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BarcodeVerificationCard from "@/components/BarcodeVerificationCard";

interface Product {
  id: string;
  name: string;
  manufacturer: string;
  createdAt: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showBarcodeVerifier, setShowBarcodeVerifier] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/db/products");
        if (!res.ok) {
          throw new Error("Failed to fetch products");
        }
        const data = await res.json();
        if (!isCancelled) {
          setProducts(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };
    fetchProducts();
    return () => {
      isCancelled = true;
    };
  }, []);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.manufacturer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <main className="flex-1 ml-72">
        <TopBar
          title="Product Catalog"
          subtitle="Database of audited packaged commodities and manufacturers"
          action={
            <Link href="/scan">
              <Button size="sm" variant="default" className="shadow-blue-600/30 gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Audit New Product</span>
              </Button>
            </Link>
          }
        />

        <div className="p-8 max-w-7xl space-y-6">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl liquid-glass-card">
            <div>
              <h2 className="text-base font-bold text-slate-100 tracking-tight">
                Packaged Commodity Directory
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {products.length} distinct commodities cataloged across enforcement inspections
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                variant={showBarcodeVerifier ? "default" : "outline"}
                size="sm"
                onClick={() => setShowBarcodeVerifier(!showBarcodeVerifier)}
                className="text-xs gap-1.5 shrink-0"
              >
                <Barcode className="w-3.5 h-3.5" />
                <span>{showBarcodeVerifier ? "Hide Barcode Tool" : "Verify GS1 Barcode"}</span>
              </Button>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search products or packers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 bg-slate-900/80 border border-slate-700/60 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Collapsible Barcode Verification Widget */}
          {showBarcodeVerifier && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <BarcodeVerificationCard />
            </motion.div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-44 bg-slate-900/40 rounded-2xl border border-slate-800/80" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProducts.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.3 }}
                  className="rounded-2xl liquid-glass-card p-5 flex flex-col justify-between group hover:border-blue-500/30"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center text-blue-400 shadow-sm shadow-blue-950/40">
                        <Package className="w-5 h-5" />
                      </div>
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {product.id.slice(0, 10)}
                      </Badge>
                    </div>

                    <h3 className="text-sm font-bold text-slate-100 truncate group-hover:text-blue-300 transition-colors">
                      {product.name}
                    </h3>

                    <div className="flex items-center gap-2 text-slate-400 text-xs mt-2 truncate">
                      <Factory className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{product.manufacturer || "Manufacturer per label"}</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-mono text-[11px]">
                        {new Date(product.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <Link href={`/inspections?search=${encodeURIComponent(product.name)}`}>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300">
                        <span>Inspect</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </Link>
                  </div>
                </motion.div>
              ))}

              {filteredProducts.length === 0 && (
                <div className="col-span-full py-16 text-center rounded-2xl liquid-glass-card border-dashed">
                  <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-300 font-semibold text-sm">No products found</p>
                  <p className="text-slate-500 text-xs mt-1">
                    Try searching with another commodity or manufacturer name.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
