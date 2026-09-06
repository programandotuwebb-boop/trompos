import FadeIn from "@/components/FadeIn";
import { ScissorsIcon, RazorIcon } from "@/components/ServiceIcons";
import { siteConfig } from "@/lib/site-content";

const icons = [ScissorsIcon, RazorIcon];

export default function ServicesSection() {
  return (
    <section id="servicios" className="bg-cream py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-6 text-center sm:px-10">
        <FadeIn>
          <p className="text-xs tracking-[0.3em] text-taupe-dark">
            {siteConfig.services.eyebrow.toUpperCase()}
          </p>
          <h2 className="mt-4 font-serif text-4xl text-charcoal sm:text-5xl">
            ¿Qué hacemos?
          </h2>
          <p className="mx-auto mt-6 max-w-xl leading-relaxed text-body">
            {siteConfig.services.description}
          </p>
        </FadeIn>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
          {siteConfig.services.items.map((item, index) => {
            const Icon = icons[index];
            return (
              <FadeIn key={item.name} delayMs={index * 120}>
                <div className="group flex h-full flex-col items-center rounded-2xl border border-charcoal/10 bg-white/50 px-8 py-12 transition-all duration-300 hover:-translate-y-1 hover:border-taupe/40 hover:shadow-lg hover:shadow-charcoal/5">
                  <Icon className="h-12 w-12 text-taupe transition-transform duration-300 group-hover:scale-110" />
                  <p className="mt-6 font-serif text-2xl text-charcoal">{item.name}</p>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
