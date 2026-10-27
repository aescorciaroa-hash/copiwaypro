import React from 'react';
import { Award, Flame, RotateCcw, Sparkles, Star, Utensils, Plus, CheckCircle2, ArrowRight } from 'lucide-react';

import { Product, Order, InventoryItem, StoreConfig } from '../../store/almacenAplicacion';

interface CatalogSectionProps {
  catalog: Product[];
  orderHistory: Order[];
  inventory: InventoryItem[];
  storeConfig: StoreConfig;
  catalogCategory: string;
  setCatalogCategory: React.Dispatch<React.SetStateAction<string>>;
  openCustomizer: (product: Product) => void;
  reorder: (order: Order) => void;
  /** Para el saludo de bienvenida. */
  clientName: string;
  points: number;
  activeOrdersCount: number;
  isStoreOpen: boolean;
  goToTab: (tab: string) => void;
}

export default function CatalogSection({
  catalog,
  orderHistory,
  inventory,
  storeConfig,
  catalogCategory,
  setCatalogCategory,
  openCustomizer,
  reorder,
  clientName,
  points,
  activeOrdersCount,
  isStoreOpen,
  goToTab,
}: CatalogSectionProps) {
    const lastOrder = orderHistory.length > 0 ? orderHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] : null;
    const getProductImage = (url?: string) => {
    let img = url || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800';
    if (img && img.includes('1594212202875-86ac56c66b88')) img = 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&q=80&w=800';
    if (img && img.includes('1628190772718-d748dc7ce31c')) img = 'https://images.unsplash.com/photo-1615719413546-198b25453f85?auto=format&fit=crop&q=80&w=800';
    if (img && img.includes('1599599811462-8cb2f8f74da0')) img = 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?auto=format&fit=crop&q=80&w=800';
    return img;
  };

  const configuredCategories = (storeConfig.categories && storeConfig.categories.length > 0)
    ? storeConfig.categories
    : ['Hamburguesas de Pan', 'Hamburguesas de Patacón', 'Perros Calientes', 'Mazorcadas', 'Salchipapas', 'Chorizos', 'Bebidas', 'Adiciones / Extras'];

  const allCategories: string[] = [];
  configuredCategories.forEach(c => {
    if (c && !allCategories.includes(c)) allCategories.push(c);
  });
  catalog.forEach(p => {
    if (p.category && !allCategories.includes(p.category)) {
      allCategories.push(p.category);
    }
  });

  const categoriesWithProducts = allCategories.filter(cat =>
    catalog.some(p => {
      const pCat = p.category || (
        p.name.toLowerCase().includes('hamburguesa') ? 'Hamburguesas de Pan' :
        p.name.toLowerCase().includes('perro') || p.name.toLowerCase().includes('salchicha') ? 'Perros Calientes' :
        p.name.toLowerCase().includes('salchipapa') ? 'Salchipapas' :
        p.name.toLowerCase().includes('patacón') ? 'Hamburguesas de Patacón' :
        'Otros'
      );
      return pCat.toLowerCase() === cat.toLowerCase() ||
             (cat === 'Hamburguesas de Pan' && pCat.toLowerCase().includes('hamburguesa')) ||
             (cat === 'Hamburguesas' && pCat.toLowerCase().includes('hamburguesa'));
    })
  );

  const availableCategories = ['Todas', ...(categoriesWithProducts.length > 0 ? categoriesWithProducts : allCategories)];

  const filteredCatalog = catalogCategory === 'Todas'
    ? catalog
    : catalog.filter(p => {
        const pCat = p.category || (
          p.name.toLowerCase().includes('hamburguesa') ? 'Hamburguesas de Pan' :
          p.name.toLowerCase().includes('perro') || p.name.toLowerCase().includes('salchicha') ? 'Perros Calientes' :
          p.name.toLowerCase().includes('salchipapa') ? 'Salchipapas' :
          p.name.toLowerCase().includes('patacón') ? 'Hamburguesas de Patacón' :
          'Otros'
        );
        if (pCat.toLowerCase() === catalogCategory.toLowerCase()) return true;
        if ((catalogCategory === 'Hamburguesas de Pan' || catalogCategory === 'Hamburguesas') && pCat.toLowerCase().includes('hamburguesa')) return true;
        return false;
      });

  return (
    <div className="space-y-6">
      {/* Bienvenida: saludo, accesos rápidos y foto */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-gray-900 via-stone-900 to-[#2a1608] text-white shadow-xl shadow-gray-900/10">
        <div className="absolute -left-16 -bottom-24 w-72 h-72 rounded-full bg-brand-orange/25 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -top-20 w-56 h-56 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

        <div className="relative grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] gap-6 p-6 sm:p-8">
          <div className="flex flex-col justify-center">
            <span className="self-start inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[11px] font-bold tracking-wide">
              <Utensils className="w-3.5 h-3.5 text-brand-orange" /> CopiwayPRO · Hamburguesas a domicilio
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              ¡Hola, {clientName.split(' ')[0] || 'bienvenido'}! 👋
            </h2>
            <p className="mt-2 text-sm sm:text-base text-white/70 max-w-lg">
              ¿Qué se te antoja hoy? Elige del menú, arma tu propia hamburguesa capa por capa o repite tu último pedido.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <button
                onClick={() => goToTab('builder')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-orange text-white text-sm font-bold hover:bg-[#e66500] shadow-lg shadow-brand-orange/30 active:scale-[0.97] transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Arma tu hamburguesa
              </button>
              {lastOrder && (
                <button
                  onClick={() => reorder(lastOrder)}
                  title="Agrega al carrito lo mismo de tu último pedido"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-sm font-bold hover:bg-white/20 active:scale-[0.97] transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" /> Pedir lo mismo de la última vez
                </button>
              )}
              {activeOrdersCount > 0 && (
                <button
                  onClick={() => goToTab('activeOrders')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-sm font-bold hover:bg-white/20 active:scale-[0.97] transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Ver mis pedidos ({activeOrdersCount})
                </button>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                <Star className="w-3.5 h-3.5 text-amber-400" /> {points} puntos acumulados
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${isStoreOpen ? 'bg-emerald-500/10 border-emerald-400/20 text-emerald-300' : 'bg-rose-500/10 border-rose-400/20 text-rose-300'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isStoreOpen ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                {isStoreOpen ? `Cocina abierta hasta las ${storeConfig.closeTime || '22:00'}` : `Cocina cerrada · abre a las ${storeConfig.openTime || '11:00'}`}
              </span>
            </div>
          </div>

          {/* Foto del producto destacado */}
          {catalog.length > 0 && (
            <button
              onClick={() => openCustomizer(catalog[0])}
              className="relative hidden sm:block h-56 lg:h-auto lg:min-h-[260px] rounded-3xl overflow-hidden group cursor-pointer text-left"
              title={`Pedir ${catalog[0].name}`}
            >
              <img loading="lazy" decoding="async" src={getProductImage(catalog[0].image)} alt={catalog[0].name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-orange text-[11px] font-black uppercase tracking-wide">
                <Flame className="w-3 h-3" /> {catalog[0].badge || 'Más vendido'}
              </span>
              <div className="absolute inset-x-0 bottom-0 p-4 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-black text-lg leading-tight truncate">{catalog[0].name}</p>
                  <p className="text-sm font-bold text-brand-orange">$ {catalog[0].price.toLocaleString('es-CO')}</p>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white text-gray-900 text-xs font-black group-hover:bg-brand-orange group-hover:text-white transition-colors">
                  Pedir <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          )}
        </div>
      </div>

      <h2 className="text-[28px] font-bold tracking-tight text-gray-900 dark:text-white">Catálogo de Productos</h2>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {availableCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setCatalogCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border ${
              catalogCategory === cat
                ? 'bg-brand-orange text-white border-brand-orange shadow-sm'
                : 'bg-white dark:bg-stone-900 text-gray-600 dark:text-stone-300 border-gray-200 dark:border-stone-800 hover:border-brand-orange hover:text-brand-orange'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredCatalog.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-[#151515] rounded-[24px] border border-gray-100 dark:border-stone-800 shadow-sm p-6 text-center">
          <Utensils className="w-14 h-14 text-gray-300 dark:text-stone-700 mb-3" />
          <h3 className="text-base font-bold text-gray-700 dark:text-stone-300 mb-1">No hay productos en esta categoría</h3>
          <p className="text-xs text-gray-500 dark:text-stone-400">Selecciona otra categoría o explora "Todas".</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-3 sm:gap-6">
          {filteredCatalog.map((prod) => {
            const isTopSeller = prod.badge === 'Más Vendido' || (catalog.length > 0 && prod.id === catalog[0].id && !prod.badge);
            const badgeText = prod.badge || (isTopSeller ? 'Más Vendido' : null);

            // Check if product is available based on recipe inventory
            let isAvailable = true;
            if (prod.ingredients && prod.ingredients.length > 0) {
              for (const baseIng of prod.ingredients) {
                const ingName = (typeof baseIng === 'string' ? baseIng : baseIng.name || '').toLowerCase();
                const invMatch = inventory.find(i => (i.name || '').toLowerCase() === ingName);
                if (invMatch && invMatch.stock <= 0) {
                  isAvailable = false;
                  break;
                }
              }
            }

            return (
              <div
                key={prod.id}
                onClick={() => {
                  if (isAvailable) openCustomizer(prod);
                }}
                className={`bg-white dark:bg-[#151515] rounded-[24px] border border-gray-100 dark:border-stone-800 flex flex-col overflow-hidden transition-all group ${isAvailable ? 'cursor-pointer hover:shadow-lg' : 'opacity-60 cursor-not-allowed grayscale-[0.2]'}`}
              >
                {prod.image && (
                  <div className="h-28 sm:h-48 md:h-56 relative bg-black/5 dark:bg-white/5 overflow-hidden shrink-0">
                    <img loading="lazy" decoding="async" src={getProductImage(prod.image)} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    {!isAvailable && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px] z-10">
                        <span className="bg-red-600 text-white font-black px-4 py-2 rounded-xl text-sm tracking-widest uppercase shadow-lg border border-white/20">Agotado</span>
                      </div>
                    )}
                    {badgeText && isAvailable && (
                      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-brand-orange text-white text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-lg tracking-wide uppercase shadow-sm flex items-center gap-1 z-0">
                        {badgeText === 'Más Vendido' && <Flame className="w-3 h-3 text-white" />}
                        {badgeText === 'Recomendado' && <Star className="w-3 h-3 text-white" />}
                        {badgeText === 'Nuevo' && <Sparkles className="w-3 h-3 text-white" />}
                        {badgeText === 'Especialidad' && <Award className="w-3 h-3 text-white" />}
                        <span>{badgeText}</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex flex-col flex-1 p-3 sm:p-5 justify-between min-w-0">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-[14px] sm:text-[18px] leading-tight mb-1 sm:mb-2 line-clamp-2">{prod.name}</h3>
                    <p className="hidden sm:block text-[13px] text-gray-500 dark:text-stone-400 leading-relaxed line-clamp-2 mb-3">{prod.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50 dark:border-stone-800/60">
                    <span className="bg-orange-50 dark:bg-stone-900/80 text-brand-orange px-2.5 sm:px-3 py-1 rounded-lg font-black text-xs sm:text-sm">
                      $ {prod.price.toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
