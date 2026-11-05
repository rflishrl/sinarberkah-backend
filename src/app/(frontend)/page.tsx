import configPromise from "@payload-config";
import { getPayload } from "payload";
import Image from "next/image";
import Link from "next/link";
import { ContactForm } from "@/features/leads/components/contact-form";
import type { Banner, Category, Product, Testimonial } from "@/payload-types";

export const revalidate = 60;

export default async function LandingPageSinarBerkah() {
  let bannerDocs: Banner[] = [];
  let categoryDocs: Category[] = [];
  let featuredDocs: Product[] = [];
  let testimonialDocs: Testimonial[] = [];

  try {
    const payload = await getPayload({ config: configPromise });
    const [bannersData, categoriesData, featuredProductsData, testimonialsData] =
      await Promise.all([
        payload.find({
          collection: "banners",
          where: { aktif: { equals: true } },
          sort: "urutan",
          depth: 1,
        }),
        payload.find({
          collection: "categories",
          limit: 10,
        }),
        payload.find({
          collection: "products",
          where: { featured: { equals: true } },
          limit: 6,
          depth: 2,
        }),
        payload.find({
          collection: "testimonials",
          limit: 3,
          depth: 1,
        }),
      ]);
    bannerDocs = bannersData.docs;
    categoryDocs = categoriesData.docs;
    featuredDocs = featuredProductsData.docs;
    testimonialDocs = testimonialsData.docs;
  } catch (error) {
    console.warn("Database tidak dapat diakses saat render:", error);
  }

  return (
    <main id="main-content" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero / Banner Aktif */}
      {bannerDocs.length > 0 ? (
        <section className="mb-12 overflow-hidden rounded-2xl border border-border bg-card">
          {bannerDocs.map((b) => {
            const hero =
              typeof b.gambarHero === "object" ? b.gambarHero : null;
            return (
              <div
                key={b.id}
                className="relative flex min-h-[380px] flex-col justify-end p-8 sm:p-12"
              >
                {hero?.url && (
                  <Image
                    src={hero.url}
                    alt={hero.alt || b.judul}
                    fill
                    priority
                    className="object-cover brightness-50"
                  />
                )}
                <div className="relative z-10 max-w-2xl text-white">
                  <h1 className="text-3xl font-extrabold sm:text-5xl">
                    {b.judul}
                  </h1>
                  {b.subjudul && (
                    <p className="mt-3 text-lg text-white/90">{b.subjudul}</p>
                  )}
                  {b.linkCta && b.teksCta && (
                    <div className="mt-6">
                      <Link
                        href={b.linkCta}
                        className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 font-semibold text-primary-foreground shadow-xs hover:bg-primary/90"
                      >
                        {b.teksCta}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      ) : (
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Sinar Berkah
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Spesialis Produksi Konveksi Seragam, Kaos Sablon, dan Cetak Pola
          </p>
          <div className="mt-4">
            <Link
              href="/admin"
              className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground"
            >
              Masuk ke Panel Admin CMS
            </Link>
          </div>
        </header>
      )}

      {/* Kategori Produk */}
      {categoryDocs.length > 0 && (
        <section aria-labelledby="categories-title" className="mb-12">
          <h2 id="categories-title" className="mb-4 text-2xl font-bold">
            Kategori Pilihan
          </h2>
          <div className="flex flex-wrap gap-2.5">
            {categoryDocs.map((cat) => (
              <span
                key={cat.id}
                className="rounded-full border border-border bg-muted/60 px-4 py-1.5 text-sm font-medium"
              >
                {cat.nama}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Produk Unggulan */}
      <section aria-labelledby="featured-title" className="mb-12">
        <h2 id="featured-title" className="mb-4 text-2xl font-bold">
          Produk Unggulan
        </h2>
        {featuredDocs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada produk unggulan yang dipilih.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredDocs.map((p) => {
              const firstImageObj =
                p.gambar && p.gambar.length > 0 && typeof p.gambar[0]?.foto === "object"
                  ? p.gambar[0].foto
                  : null;
              return (
                <article
                  key={p.id}
                  className="overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-shadow hover:shadow-md"
                >
                  {firstImageObj?.url && (
                    <div className="relative aspect-square w-full bg-muted">
                      <Image
                        src={firstImageObj.url}
                        alt={firstImageObj.alt || p.nama}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-bold">{p.nama}</h3>
                    <p className="mt-1 text-sm font-semibold text-primary">
                      Rp {p.harga.toLocaleString("id-ID")}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Testimoni Klien */}
      {testimonialDocs.length > 0 && (
        <section aria-labelledby="testimonials-title" className="mb-12">
          <h2 id="testimonials-title" className="mb-4 text-2xl font-bold">
            Ulasan Pelanggan
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {testimonialDocs.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-border bg-card p-5 shadow-xs"
              >
                <div className="text-amber-500">
                  {"★".repeat(t.rating)}
                  {"☆".repeat(5 - t.rating)}
                </div>
                <p className="mt-2 text-sm text-foreground/80 italic">
                  &ldquo;{t.ulasan}&rdquo;
                </p>
                <div className="mt-4 font-semibold text-sm">
                  {t.namaKlien}
                  {t.perusahaanJabatan && (
                    <span className="block font-normal text-xs text-muted-foreground">
                      {t.perusahaanJabatan}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Form Kontak / Pemesanan (Leads) */}
      <section aria-labelledby="contact-title" className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="max-w-xl">
          <h2 id="contact-title" className="text-2xl font-bold">
            Konsultasi & Pesan Konveksi
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Kirimkan rincian kebutuhan seragam atau sablon Anda. Tim Sinar Berkah akan segera merespons via WhatsApp.
          </p>
          <div className="mt-6">
            <ContactForm />
          </div>
        </div>
      </section>
    </main>
  );
}
