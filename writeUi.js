const fs = require('fs');

const productsPage = "use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { Package, Search, Factory, Calendar, Activity } from "lucide-react";

interface Product {
  id: string;
  name: string;
  manufacturer: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    inspections: number;
  };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/db/products");
      const data = await res.json();
      if (res.ok) {
        setProducts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.manufacturer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />
      <main className="flex-1 ml-72">
        <TopBar title="Product Catalog" subtitle="Database of inspected products" />
        
        <div className="p-8 max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Products Registry</h2>
              <p className="text-zinc-400 mt-1">All distinct products encountered during inspections</p>
            </div>
            <div className="relative">
              <Search className="w-5 h-5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search products..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-zinc-900/50 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 w-64"
              />
            </div>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-white/5 rounded-2xl"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-zinc-900/60 border border-white/[0.08] p-6 rounded-2xl flex flex-col justify-between group hover:border-indigo-500/30 transition-all">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                      <Package className="w-6 h-6 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white truncate">{product.name}</h3>
                    <div className="flex items-center gap-2 text-zinc-400 text-sm mt-2 truncate">
                      <Factory className="w-4 h-4 shrink-0" />
                      <span className="truncate">{product.manufacturer}</span>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                      <Activity className="w-4 h-4" />
                      {product._count.inspections} {product._count.inspections === 1 ? 'Inspection' : 'Inspections'}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(product.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredProducts.length === 0 && (
                <div className="col-span-full py-12 text-center border border-dashed border-white/10 rounded-2xl">
                  <Package className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-400">No products found matching your search.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
;

fs.writeFileSync('src/app/products/page.tsx', productsPage, 'utf-8');
