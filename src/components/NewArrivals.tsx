// components/NewArrivals.tsx

import { getApi } from "@/lib/server-api";
import ProductSliderWrapper from "@/components/products/ProductSliderWrapper";

export default async function NewArrivals() {
  const products = await getApi<any[]>("/api/customer/new-arrivals");

  if (products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">New Arrivals</h2>
      <ProductSliderWrapper products={products} />
    </section>
  );
}