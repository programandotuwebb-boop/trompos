import Image from "next/image";
import FadeIn from "@/components/FadeIn";

const products = [
  { src: "/images/cera2.jpg", alt: "Cera mate Dr Jackson", caption: "Cera mate" },
  { src: "/images/images-1.jpg", alt: "Crema modeladora Natura Homem", caption: "Crema modeladora" },
  { src: "/images/images-2.jpg", alt: "Gel de afeitar The Barbershop", caption: "Gel de afeitar" },
  { src: "/images/images.jpg", alt: "Pomada Redken Brews", caption: "Pomada" },
];

// Se duplica la tira una sola vez: la animación recorre el primer 50% del
// ancho total (un ciclo completo de productos) y al llegar ahí la copia
// duplicada calza exactamente donde empezó la original, así el loop no
// muestra ningún salto.
const trackProducts = [...products, ...products];

export default function GallerySection() {
  return (
    <section className="bg-ink py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <FadeIn>
          <p className="text-xs tracking-[0.4em] text-bronze">PRODUCTOS</p>
          <h2 className="mt-4 font-serif text-4xl text-white sm:text-5xl">
            Los productos que usamos
          </h2>
        </FadeIn>

        <FadeIn delayMs={100}>
          <div className="mt-10 overflow-hidden">
            <div className="marquee-track flex w-max gap-6">
              {trackProducts.map((product, index) => (
                <div
                  key={`${product.src}-${index}`}
                  className="w-48 shrink-0 sm:w-56"
                  aria-hidden={index >= products.length}
                >
                  <div className="aspect-square overflow-hidden rounded-lg bg-white p-6 shadow-sm transition-transform duration-500 ease-out hover:scale-[1.04]">
                    <div className="relative h-full w-full">
                      <Image
                        src={product.src}
                        alt={product.alt}
                        fill
                        sizes="(min-width: 640px) 224px, 192px"
                        className="object-contain"
                      />
                    </div>
                  </div>
                  <p className="mt-3 text-center text-xs tracking-wide text-white/50">
                    {product.caption}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        <p className="mt-8 text-center text-xs text-white/40 sm:text-left">
          Consultá precios y disponibilidad de productos por WhatsApp.
        </p>
      </div>
    </section>
  );
}
