import React from 'react';
import { ChevronLeft, ChevronRight, Mail, Search } from 'lucide-react';

import { formatCOP } from '../../lib/format';
import { Client } from '../../store/almacenAplicacion';

interface ClientsSectionProps {
  filteredClients: Client[];
  customerSearch: string;
  setCustomerSearch: React.Dispatch<React.SetStateAction<string>>;
  setSelectedClientInfo: React.Dispatch<React.SetStateAction<Client | null>>;
}

export default function ClientsSection({
  filteredClients,
  customerSearch,
  setCustomerSearch,
  setSelectedClientInfo,
}: ClientsSectionProps) {
  // Paginacion (igual que la Lista de Personal)
  const POR_PAGINA = 8;
  const [pagina, setPagina] = React.useState(1);
  const totalPaginas = Math.max(1, Math.ceil(filteredClients.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const paginatedClients = filteredClients.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);

  const desde = Math.max(1, Math.min(paginaActual - 2, totalPaginas - 4));
  const hasta = Math.min(totalPaginas, desde + 4);
  const numerosPagina = [];
  for (let p = desde; p <= hasta; p++) numerosPagina.push(p);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Directorio de Clientes</h2>
        <p className="text-gray-500 dark:text-stone-400 mt-1">Base de datos de tus clientes registrados.</p>
      </div>

      <div className="bg-white dark:bg-[#151515] rounded-[32px] border border-gray-100 dark:border-stone-800 shadow-sm overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 md:px-8 py-6 border-b border-gray-100 dark:border-stone-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <h3 className="font-bold text-xl text-gray-900 dark:text-white">Lista de Clientes</h3>
          <div className="flex items-center border border-gray-200 dark:border-stone-700 rounded-full bg-gray-50 dark:bg-stone-900/50 px-4 py-2 w-full md:w-80 min-w-0">
            <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Buscar cliente por nombre o teléfono..."
              value={customerSearch}
              onChange={(e) => { setCustomerSearch(e.target.value); setPagina(1); }}
              className="bg-transparent border-none outline-none text-sm w-full text-gray-800 dark:text-stone-300 placeholder-gray-500 font-medium"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-stone-900/40 border-b border-gray-100 dark:border-stone-800">
              <tr>
                <th className="px-6 py-4 font-bold text-sm text-gray-500 dark:text-stone-400">Nombre y Contacto</th>
                <th className="px-6 py-4 font-bold text-sm text-gray-500 dark:text-stone-400">Teléfono</th>
                <th className="px-6 py-4 font-bold text-sm text-gray-500 dark:text-stone-400 text-center">Pedidos</th>
                <th className="px-6 py-4 font-bold text-sm text-gray-500 dark:text-stone-400 text-right">Total Gastado</th>
                <th className="px-6 py-4 font-bold text-sm text-gray-500 dark:text-stone-400 text-center">Último Pedido</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium">No hay clientes registrados en el sistema.</td>
                </tr>
              ) : paginatedClients.map(client => (
                <tr key={client.id} onClick={() => setSelectedClientInfo(client)} className="border-b border-gray-100 dark:border-stone-800/50 hover:bg-gray-50/50 dark:hover:bg-stone-900/20 transition-colors cursor-pointer">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange font-bold text-lg shrink-0">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white mb-0.5">{client.name}</p>
                        <p className="text-xs text-gray-500 dark:text-stone-400 truncate">{client.email || '-'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm font-medium text-gray-600 dark:text-stone-400 whitespace-nowrap">{client.phone}</td>
                  <td className="px-6 py-5 text-center">
                    <span className="inline-flex items-center justify-center bg-gray-100 dark:bg-[#222] text-gray-600 dark:text-stone-300 px-3 py-1 rounded-full text-xs font-bold">
                      {client.ordersCount || 0}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right font-black text-gray-900 dark:text-white whitespace-nowrap">
                    {formatCOP(client.totalSpent || 0)}
                  </td>
                  <td className="px-6 py-5 text-center text-sm font-medium text-gray-500 dark:text-stone-400 whitespace-nowrap">
                    {client.lastOrderDate ? new Date(client.lastOrderDate).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards for Clients */}
        <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-3 p-3">
          {filteredClients.length > 0 ? paginatedClients.map((client) => (
            <div key={client.id} onClick={() => setSelectedClientInfo(client)} className="bg-gray-50/50 dark:bg-[#1A1A1A]/50 border border-gray-100 dark:border-stone-800 rounded-2xl p-5 flex flex-col gap-3 cursor-pointer hover:border-brand-orange/30 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange font-bold text-xl shrink-0">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 dark:text-white text-[clamp(14px,4vw,16px)] line-clamp-2 leading-tight break-words">{client.name}</h4>
                  <p className="text-[clamp(11px,3.5vw,14px)] font-medium text-gray-600 dark:text-stone-400 break-words">{client.phone}</p>
                </div>
              </div>
              {client.email && (
                <p className="text-[clamp(11px,3.5vw,14px)] text-gray-500 dark:text-stone-500 flex items-center gap-2 min-w-0">
                  <Mail className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" /> <span className="truncate">{client.email}</span>
                </p>
              )}
              <div className="flex flex-col gap-3 mt-auto pt-4 border-t border-gray-200/50 dark:border-stone-800">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Pedidos</p>
                  <p className="font-black text-gray-900 dark:text-white text-lg">{client.ordersCount || 0}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Total</p>
                  <p className="font-black text-brand-orange text-[clamp(16px,4vw,18px)] leading-none">{formatCOP(client.totalSpent || 0)}</p>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-2 text-center text-gray-500 font-medium py-8">No se encontraron clientes.</div>
          )}
        </div>

        {/* Footer Pagination */}
        <div className="p-6 border-t border-gray-100 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
          <p className="text-xs font-medium text-gray-500">Mostrando {paginatedClients.length} de {filteredClients.length} clientes encontrados</p>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setPagina(Math.max(1, paginaActual - 1))}
              disabled={paginaActual === 1}
              className="w-8 h-8 rounded-full border border-gray-200 dark:border-stone-700 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {numerosPagina.map(p => (
              <button
                key={p}
                onClick={() => setPagina(p)}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm transition-colors ${paginaActual === p ? 'bg-brand-orange text-white font-bold' : 'border border-gray-200 dark:border-stone-700 text-gray-600 dark:text-stone-400 hover:bg-gray-50 dark:hover:bg-stone-800'}`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPagina(Math.min(totalPaginas, paginaActual + 1))}
              disabled={paginaActual === totalPaginas}
              className="w-8 h-8 rounded-full border border-gray-200 dark:border-stone-700 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
