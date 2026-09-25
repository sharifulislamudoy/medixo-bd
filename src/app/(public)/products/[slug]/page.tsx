import { getApi } from "@/lib/server-api";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ProductDetailsClient from "./ProductDetailsClient";
import ProductSliderWrapper from "@/components/products/ProductSliderWrapper";

interface Props {
  params: Promise<{ slug: string }>;
}

type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  category: string;
  mrp: number;
  sellPrice: number;
  availability: boolean;
  generic: { name: string } | null;
  brand: { name: string } | null;
  stock: { quantity: number } | null;
};

type ProductPayload = {
  product: CatalogProduct | null;
  similar: CatalogProduct[];
  suggested: CatalogProduct[];
};

async function loadProduct(slug: string): Promise<ProductPayload> {
  return getApi<ProductPayload>(`/api/customer/products/${encodeURIComponent(slug)}`);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await loadProduct(slug);
  if (!product) {
    return { title: "Product Not Found", description: "The requested product could not be found." };
  }

  const title = `${product.name} | Buy Online at Best Price | Medixo`;
  const description = product.description.slice(0, 160);
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://medixo-bd.vercel.app/products/${slug}`,
      images: [{ url: product.image, width: 800, height: 600, alt: product.name }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [product.image],
    },
    keywords: [product.name, product.brand?.name || "", product.generic?.name || "",
      "buy medicine online Bangladesh", "wholesale pharmacy"].filter(Boolean),
    alternates: { canonical: `/products/${slug}` },
  };
}

export default async function ProductDetailsPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?error=Login%20required");

  const { slug } = await params;
  const { product, similar, suggested } = await loadProduct(slug);
  if (!product) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
      <Suspense fallback={<div className="h-4 bg-gray-200 rounded w-48 mb-6 animate-pulse" />}>
        <nav className="text-sm mb-6">
          <Link href="/" className="text-gray-500 hover:text-[#0F9D8F]">Home</Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link href="/products" className="text-gray-500 hover:text-[#0F9D8F]">Products</Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-700">{product.name}</span>
        </nav>
      </Suspense>

      <Suspense fallback={<ProductDetailsSkeleton />}>
        <ProductDetailsClient product={product} />
      </Suspense>

      {similar.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Similar Products</h2>
          <ProductSliderWrapper products={similar} />
        </section>
      )}

      {suggested.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Suggested Products</h2>
          <ProductSliderWrapper products={suggested} />
        </section>
      )}
    </div>
  );
}

// Skeleton components (unchanged)
function ProductDetailsSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
      <div className="md:flex">
        <div className="md:w-1/2 h-80 md:h-auto bg-gray-200" />
        <div className="md:w-1/2 p-6 md:p-8">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
          <div className="h-10 bg-gray-200 rounded w-32 mb-6" />
          <div className="space-y-3 mb-6">
            <div className="h-4 bg-gray-200 rounded w-40" />
            <div className="h-4 bg-gray-200 rounded w-36" />
            <div className="h-4 bg-gray-200 rounded w-28" />
          </div>
          <div className="h-20 bg-gray-200 rounded mb-6" />
          <div className="h-12 bg-gray-200 rounded w-40" />
        </div>
      </div>
    </div>
  );
}

function SliderSkeleton({ title }: { title: string }) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
            <div className="h-40 bg-gray-200" />
            <div className="p-3">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}