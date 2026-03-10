"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Plus, Search, User, Phone, Mail, FileText, Calendar, Edit2, UserX, X, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  documento: string | null;
  telefono: string | null;
  email: string | null;
  fecha_nacimiento: string | null;
  activo: boolean;
}

export default function PacientesPage() {
  const router = useRouter();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  
  // Estado para Múltiples Acciones (Crear/Editar)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Estado para el formulario
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    documento: "",
    telefono: "",
    email: "",
    fecha_nacimiento: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  
  // Estado para Eliminar Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pacienteToDelete, setPacienteToDelete] = useState<Paciente | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [inactiveData, setInactiveData] = useState<{ id: string } | null>(null);

  const fetchPacientes = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/api/pacientes");
      // El backend devuelve { total, items: [...] }
      setPacientes(res.data?.items || []);
    } catch (error) {
      console.error("Error fetching pacientes:", error);
      setErrorMsg("No se pudieron cargar los pacientes.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPacientes();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Máscara para Documento de Identidad (ej. V-12345678)
    if (name === "documento") {
      // Remover todo lo que no sea letra inicial, guion, o números
      let cleanVal = value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
      
      // Si comienza con número, no es válido (debe tener letra), pero si lo pega completo,
      // podríamos intentar extraer la letra. Aquí forzamos Estructura: Letra + Guion + Números.
      if (cleanVal.length > 0) {
        // Asegurar que el primer caracter es letra
        const firstChar = cleanVal.charAt(0);
        if (/[A-Z]/.test(firstChar)) {
          // Remover guiones extra y dejar solo números en el resto
          const rest = cleanVal.substring(1).replace(/[^0-9]/g, "");
          cleanVal = rest.length > 0 ? `${firstChar}-${rest}` : firstChar;
        } else {
          cleanVal = ""; // No se permite iniciar sin letra
        }
      }
      setFormData((prev) => ({ ...prev, [name]: cleanVal }));
      return;
    }

    // Máscara para Teléfono (ej. +58 412 1234567 o 0412 1234567)
    if (name === "telefono") {
      // Eliminar letras, permitir solo un + al inicio, números y espacios
      let cleanVal = value.replace(/[^0-9+\s]/g, "");
      
      // Solo el primer caracter puede ser +
      if (cleanVal.indexOf("+") > 0) {
        cleanVal = cleanVal.replace(/\+/g, "");
      }
      // Quitar espacios repetidos
      cleanVal = cleanVal.replace(/\s+/g, " ");

      setFormData((prev) => ({ ...prev, [name]: cleanVal }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setSelectedId(null);
    setFormData({ nombre: "", apellido: "", documento: "", telefono: "", email: "", fecha_nacimiento: "" });
    setErrorMsg("");
    setInactiveData(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (paciente: Paciente) => {
    setModalMode("edit");
    setSelectedId(paciente.id);
    setFormData({
      nombre: paciente.nombre,
      apellido: paciente.apellido,
      documento: paciente.documento || "",
      telefono: paciente.telefono || "",
      email: paciente.email || "",
      fecha_nacimiento: paciente.fecha_nacimiento || "",
    });
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (paciente: Paciente) => {
    setPacienteToDelete(paciente);
    setIsDeleteModalOpen(true);
  };

  const handleSavePaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setInactiveData(null);
    
    if (!formData.nombre || !formData.apellido) {
      setErrorMsg("Nombre y Apellido son obligatorios.");
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        documento: formData.documento || null,
        telefono: formData.telefono || null,
        email: formData.email || null,
        fecha_nacimiento: formData.fecha_nacimiento || null,
      };

      if (modalMode === "create") {
        await api.post("/api/pacientes", payload);
      } else if (modalMode === "edit" && selectedId) {
        await api.patch(`/api/pacientes/${selectedId}`, payload);
      }

      setIsModalOpen(false);
      fetchPacientes();
    } catch (error: any) {
      console.error("Error saving paciente:", error);
      const detail = error.response?.data?.detail;
      
      if (typeof detail === 'object' && detail.status === 'inactivo') {
        setErrorMsg(detail.message);
        setInactiveData({ id: detail.paciente_id });
      } else {
        setErrorMsg(typeof detail === 'string' ? detail : detail?.message || "Ocurrió un error al guardar el paciente.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleReactivate = async () => {
    if (!inactiveData) return;
    try {
      setIsSaving(true);
      await api.patch(`/api/pacientes/${inactiveData.id}`, { activo: true });
      setIsModalOpen(false);
      setInactiveData(null);
      fetchPacientes();
    } catch (error) {
      console.error("Error reactivating:", error);
      setErrorMsg("No se pudo reactivar el paciente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePaciente = async () => {
    if (!pacienteToDelete) return;
    
    try {
      setIsDeleting(true);
      await api.delete(`/api/pacientes/${pacienteToDelete.id}`);
      setIsDeleteModalOpen(false);
      setPacienteToDelete(null);
      fetchPacientes();
    } catch (error) {
      console.error("Error deleting paciente:", error);
      alert("No se pudo eliminar el paciente. Puede que tenga registros asociados.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPacientes = pacientes.filter(p => 
    `${p.nombre} ${p.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.documento && p.documento.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      
      {/* Header View */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Pacientes</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona la información y el registro de tus pacientes.
          </p>
        </div>
        
        <button 
          onClick={handleOpenCreateModal}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transform transition-all shadow-lg hover:shadow-primary/40 active:scale-95"
        >
          <Plus size={18} />
          Nuevo Paciente
        </button>
      </div>

      {/* Toolbar / Search */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 group/search">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground group-focus-within/search:text-primary transition-colors">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre o documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background/50 border border-border/50 text-foreground text-sm rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
          />
        </div>
        
        <div className="text-sm font-medium text-muted-foreground">
          Total: <span className="text-foreground">{pacientes.length}</span>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold">Paciente</th>
                <th className="px-6 py-4 font-semibold">Contacto</th>
                <th className="px-6 py-4 font-semibold">Documento</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground bg-card/30">
                    <Loader2 size={32} className="mx-auto animate-spin mb-4 text-primary" />
                    Cargando pacientes...
                  </td>
                </tr>
              ) : filteredPacientes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground bg-card/30">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4 border border-border/10">
                        <User size={32} className="text-muted-foreground/30" />
                      </div>
                      <p className="text-lg font-bold text-foreground">No hay pacientes</p>
                      <p className="text-xs">No se encontraron registros activos o que coincidan con la búsqueda.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPacientes.map((paciente) => (
                  <tr key={paciente.id} className="border-b border-border/10 table-row-hover bg-card/40 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                          {paciente.nombre[0]}{paciente.apellido[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground text-sm">
                            {paciente.nombre} {paciente.apellido}
                          </div>
                          {paciente.fecha_nacimiento && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Calendar size={12} /> {paciente.fecha_nacimiento}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-muted-foreground text-xs">
                        {paciente.telefono && (
                          <span className="flex items-center gap-1.5"><Phone size={12}/> {paciente.telefono}</span>
                        )}
                        {paciente.email && (
                          <span className="flex items-center gap-1.5"><Mail size={12}/> {paciente.email}</span>
                        )}
                        {!paciente.telefono && !paciente.email && (
                          <span className="italic">Sin contacto</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {paciente.documento ? (
                        <div className="flex items-center gap-1.5 font-medium"><FileText size={14}/> {paciente.documento}</div>
                      ) : (
                        <span className="italic text-xs">No registrado</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => router.push(`/historias?paciente_id=${paciente.id}`)} 
                          className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg transition-colors" 
                          title="Ver Historia Clínica"
                        >
                          <FileText size={16} />
                        </button>
                        <button 
                          onClick={() => handleOpenEditModal(paciente)} 
                          className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors" 
                          title="Editar paciente"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleOpenDeleteModal(paciente)} 
                          className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors" 
                          title="Desactivar paciente"
                        >
                          <UserX size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Paciente */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border relative z-10 overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-border/50 bg-secondary/30">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <User size={20} className="text-primary"/> {modalMode === "create" ? "Nuevo Paciente" : "Editar Paciente"}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:bg-secondary rounded-full p-1.5 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSavePaciente} className="p-6">
                
                {errorMsg && (
                  <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                    <div className="flex items-center gap-2 mb-2">
                       <AlertCircle size={16}/> {errorMsg}
                    </div>
                    {inactiveData && (
                      <button 
                        type="button"
                        onClick={handleReactivate}
                        className="w-full mt-2 bg-primary text-primary-foreground py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"
                      >
                        <RotateCcw size={14} /> Reactivar el registro existente
                      </button>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-1.5 md:col-span-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nombre *</label>
                    <input autoFocus required type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} className="w-full bg-background border border-border/50 text-foreground text-sm rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none p-2.5 transition-all" />
                  </div>
                  <div className="space-y-1.5 md:col-span-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Apellido *</label>
                    <input required type="text" name="apellido" value={formData.apellido} onChange={handleInputChange} className="w-full bg-background border border-border/50 text-foreground text-sm rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none p-2.5 transition-all" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Documento de Identidad (Obligatorio letra, Ej. V-12345678)</label>
                    <input type="text" name="documento" value={formData.documento} onChange={handleInputChange} className="w-full bg-background border border-border/50 text-foreground text-sm rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none p-2.5 transition-all" placeholder="Ej. V-12345678" />
                  </div>
                  <div className="space-y-1.5 md:col-span-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Teléfono (Ej. +58 412 1234567 o 0412 1234567)</label>
                    <input type="text" name="telefono" value={formData.telefono} onChange={handleInputChange} className="w-full bg-background border border-border/50 text-foreground text-sm rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none p-2.5 transition-all" placeholder="+58 412 1234567" />
                  </div>
                  <div className="space-y-1.5 md:col-span-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-background border border-border/50 text-foreground text-sm rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none p-2.5 transition-all" placeholder="correo@ejemplo.com" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha de Nacimiento</label>
                    <input type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleInputChange} className="w-full bg-background border border-border/50 text-foreground text-sm rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none p-2.5 transition-all w-full text-foreground/80 [color-scheme:dark]" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border/30">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-medium hover:bg-secondary rounded-xl transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-75 disabled:active:scale-100">
                    {isSaving ? <><Loader2 size={16} className="animate-spin"/> Guardando</> : 'Guardar Paciente'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    {/* Modal Confirmar Eliminación */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card w-full max-w-sm rounded-2xl shadow-xl border border-border relative z-10 overflow-hidden text-center p-6"
            >
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4 text-destructive">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-xl font-bold mb-2">Desactivar Paciente</h2>
              <p className="text-muted-foreground text-sm mb-6">
                ¿Estás seguro de desactivar a <strong>{pacienteToDelete?.nombre} {pacienteToDelete?.apellido}</strong>? El registro ya no aparecerá en las listas pero sus fotos e historial clínico se mantendrán protegidos.
              </p>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)} 
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  Regresar
                </button>
                <button 
                  onClick={handleDeletePaciente} 
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm font-semibold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-75 disabled:active:scale-100 flex items-center justify-center gap-2"
                >
                  {isDeleting ? <><Loader2 size={16} className="animate-spin"/> Desactivando</> : 'Confirmar Desactivación'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
