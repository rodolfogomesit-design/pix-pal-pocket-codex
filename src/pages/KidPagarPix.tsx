import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Check, Copy, Home, Key, Pencil, Printer, Star, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import KidBottomNav from "@/components/kid-dashboard/KidBottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useKidAuth } from "@/contexts/KidAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { printReceipt } from "@/lib/printReceipt";

type Step = "inicio" | "manual" | "colar" | "qrcode" | "confirmar" | "sucesso";
type PaymentSource = "manual" | "contact" | "copyPaste" | "qr";

interface PixContact {
  id: string;
  nome: string;
  chave_pix: string;
  tipo_chave: string;
}

const TIPO_CHAVE_LABELS: Record<string, string> = {
  cpf: "CPF",
  cnpj: "CNPJ",
  email: "E-mail",
  telefone: "Telefone",
  aleatoria: "Chave aleatória",
  outro: "Outro",
};

const PAYMENT_SOURCE_LABELS: Record<PaymentSource, string> = {
  manual: "Chave Pix",
  contact: "Contato salvo",
  copyPaste: "Pix copia e cola",
  qr: "QR Code Pix",
};

const detectTipoChave = (value: string): string => {
  const cleaned = value.trim();
  const digits = cleaned.replace(/\D/g, "");

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) return "email";
  if (digits.length === 11 && /^\d{2}9\d{8}$/.test(digits)) return "telefone";
  if (digits.length === 11) return "cpf";
  if (digits.length === 14) return "cnpj";
  if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(cleaned)) return "aleatoria";
  if (digits.length >= 20) return "aleatoria";
  return "outro";
};

const validateChavePix = (chave: string, tipo: string): string | null => {
  const cleaned = chave.trim();
  const digits = cleaned.replace(/\D/g, "");

  if (!cleaned) return "Informe a chave Pix!";

  switch (tipo) {
    case "cpf":
      if (digits.length !== 11) return "CPF deve ter 11 dígitos";
      if (/^(\d)\1{10}$/.test(digits)) return "CPF inválido";
      return null;
    case "cnpj":
      if (digits.length !== 14) return "CNPJ deve ter 14 dígitos";
      if (/^(\d)\1{13}$/.test(digits)) return "CNPJ inválido";
      return null;
    case "email":
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) return "E-mail inválido";
      if (cleaned.length > 255) return "E-mail muito longo";
      return null;
    case "telefone":
      if (digits.length !== 11) return "Telefone deve ter 11 dígitos (DDD + número)";
      if (!/^\d{2}9\d{8}$/.test(digits)) return "Telefone inválido";
      return null;
    case "aleatoria":
      return null;
    case "outro":
      if (cleaned.length < 5) return "Chave Pix muito curta";
      return null;
    default:
      return null;
  }
};

const formatChavePixLive = (value: string): string => {
  if (/[a-zA-Z@]/.test(value)) return value;

  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) return value;

  if (/^\d{2}9/.test(digits) && digits.length <= 11) {
    let formatted = digits;
    if (digits.length > 2) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length > 7) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    return formatted;
  }

  if (digits.length <= 11) {
    let formatted = digits;
    if (digits.length > 3) formatted = `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length > 6) formatted = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    if (digits.length > 9) formatted = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    return formatted;
  }

  if (digits.length <= 14) {
    let formatted = digits;
    if (digits.length > 2) formatted = `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length > 5) formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length > 8) formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    if (digits.length > 12) formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
    return formatted;
  }

  return value;
};

const formatDisplayChave = (chave: string, tipo: string): string => {
  const digits = chave.replace(/\D/g, "");

  if (tipo === "cpf" && digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  if (tipo === "cnpj" && digits.length === 14) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }

  if (tipo === "telefone") {
    if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return chave;
};

const isReusablePixKey = (source: PaymentSource, tipo: string, chave: string): boolean => {
  if (source === "copyPaste" || source === "qr") return false;
  if (tipo === "outro") return false;
  return chave.trim().length > 0;
};

const KidPagarPix = () => {
  const { kid, setKid } = useKidAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("inicio");
  const [chavePix, setChavePix] = useState("");
  const [tipoChave, setTipoChave] = useState("outro");
  const [nomeDestinatario, setNomeDestinatario] = useState("");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<PixContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [codigoCopiaECola, setCodigoCopiaECola] = useState("");
  const [successAmount, setSuccessAmount] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [paymentSource, setPaymentSource] = useState<PaymentSource>("manual");
  const scannerRef = useRef<any>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!kid) {
      navigate("/crianca");
      return;
    }

    void loadContacts();
  }, [kid, navigate]);

  const loadContacts = async () => {
    if (!kid) return;

    setLoadingContacts(true);
    const { data } = await supabase.rpc("kid_get_pix_contacts", { _kid_id: kid.id });
    setLoadingContacts(false);

    if (data) {
      setContacts(data as PixContact[]);
    }
  };

  const handleSelectContact = (contact: PixContact) => {
    setChavePix(contact.chave_pix);
    setTipoChave(contact.tipo_chave);
    setNomeDestinatario(contact.nome);
    setPaymentSource("contact");
    setStep("confirmar");
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!kid) return;

    await supabase.rpc("kid_delete_pix_contact", {
      _kid_id: kid.id,
      _contact_id: contactId,
    });

    toast.success("Contato Pix removido!");
    void loadContacts();
  };

  const handleEditContact = (contact: PixContact) => {
    setEditingContactId(contact.id);
    setEditingName(contact.nome);
  };

  const handleSaveEditContact = async (contactId: string) => {
    if (!kid || !editingName.trim()) return;

    await supabase.rpc("kid_update_pix_contact_name" as never, {
      _kid_id: kid.id,
      _contact_id: contactId,
      _new_nome: editingName.trim(),
    });

    toast.success("Nome atualizado!");
    setEditingContactId(null);
    setEditingName("");
    void loadContacts();
  };

  const handleManualNext = () => {
    if (!chavePix.trim()) {
      toast.error("Informe a chave Pix!");
      return;
    }

    if (!nomeDestinatario.trim()) {
      toast.error("Informe o nome do destinatário!");
      return;
    }

    const detected = detectTipoChave(chavePix);
    const validationError = validateChavePix(chavePix, detected);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setTipoChave(detected);
    setPaymentSource("manual");
    setStep("confirmar");
  };

  const handleParseCopiaECola = () => {
    const rawCode = codigoCopiaECola.trim();
    if (!rawCode) {
      toast.error("Cole o código Pix copia e cola!");
      return;
    }

    setChavePix(rawCode);
    setTipoChave("outro");
    setPaymentSource("copyPaste");

    if (!nomeDestinatario.trim()) {
      setNomeDestinatario("Pix Copia e Cola");
    }

    setStep("confirmar");
  };

  const stopQrScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => undefined);
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const startQrScanner = async () => {
    setStep("qrcode");
    setScanning(true);

    const { Html5Qrcode } = await import("html5-qrcode");

    setTimeout(async () => {
      if (!scannerContainerRef.current) return;

      try {
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            stopQrScanner();
            setChavePix(decodedText);
            setTipoChave("outro");
            setPaymentSource("qr");
            if (!nomeDestinatario.trim()) {
              setNomeDestinatario("QR Code Pix");
            }
            toast.success("QR Code lido com sucesso!");
            setStep("confirmar");
          },
          () => undefined,
        );
      } catch {
        toast.error("Não foi possível acessar a câmera. Verifique as permissões.");
        setScanning(false);
        setStep("inicio");
      }
    }, 300);
  };

  const handleConfirm = async () => {
    const amount = parseFloat(valor);
    if (!amount || amount <= 0) {
      toast.error("Valor inválido!");
      return;
    }

    if (amount > (kid?.saldo || 0)) {
      toast.error("Saldo insuficiente!");
      return;
    }

    if (!kid) return;

    setLoading(true);
    const { data, error } = await supabase.rpc("kid_request_pix_payment_no_pin" as never, {
      _kid_id: kid.id,
      _nome_destinatario: nomeDestinatario,
      _chave_pix: chavePix,
      _tipo_chave: tipoChave,
      _valor: amount,
      _descricao: descricao || "Pagamento Pix",
    });
    setLoading(false);

    if (error) {
      toast.error("Erro ao solicitar pagamento.");
      return;
    }

    const result = data as { success: boolean; error?: string };
    if (!result.success) {
      toast.error(result.error || "Erro na solicitação");
      return;
    }

    setKid({ ...kid, saldo: kid.saldo - amount });

    const alreadySaved = contacts.some((contact) => contact.chave_pix === chavePix);
    if (!alreadySaved && isReusablePixKey(paymentSource, tipoChave, chavePix)) {
      await supabase.rpc("kid_save_pix_contact_no_pin" as never, {
        _kid_id: kid.id,
        _nome: nomeDestinatario,
        _chave_pix: chavePix,
        _tipo_chave: tipoChave,
      });
    }

    setSuccessAmount(amount);
    setStep("sucesso");
  };

  if (!kid) return null;

  const goBack = () => {
    if (step === "qrcode") {
      stopQrScanner();
      setStep("inicio");
      return;
    }

    if (step === "inicio") {
      navigate("/crianca/dashboard");
      return;
    }

    setStep("inicio");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-kids-blue-light to-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={goBack} className="text-muted-foreground hover:text-primary">
              <ArrowLeft size={22} />
            </button>
            <span className="text-2xl"></span>
            <span className="font-display text-xl font-bold text-primary">Pagar com Pix</span>
          </div>
          <button
            onClick={() => navigate("/crianca/dashboard")}
            className="flex items-center gap-1 text-xs font-body text-muted-foreground hover:text-primary"
          >
            <Home size={16} /> Início
          </button>
        </div>
      </header>

      <main className="container mx-auto max-w-md px-4 py-6 pb-24">
        <AnimatePresence mode="wait">
          {step === "inicio" && (
            <motion.div
              key="inicio"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-3 gap-3">
                <Button
                  onClick={() => setStep("manual")}
                  className="flex h-20 flex-col gap-1 rounded-2xl bg-primary text-xs font-display font-bold text-primary-foreground shadow-lg"
                >
                  <Key size={22} />
                  Chave Pix
                </Button>
                <Button
                  onClick={() => setStep("colar")}
                  variant="outline"
                  className="flex h-20 flex-col gap-1 rounded-2xl border-2 border-primary/20 text-xs font-display font-bold"
                >
                  <Copy size={22} />
                  Colar código
                </Button>
                <Button
                  onClick={startQrScanner}
                  variant="outline"
                  className="flex h-20 flex-col gap-1 rounded-2xl border-2 border-primary/20 text-xs font-display font-bold"
                >
                  <Camera size={22} />
                  QR Code
                </Button>
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
                  <Star size={18} className="text-kids-yellow" />
                  Contatos salvos
                </h3>

                {loadingContacts ? (
                  <div className="rounded-2xl border border-border bg-card p-6 text-center">
                    <p className="font-body text-muted-foreground">Carregando...</p>
                  </div>
                ) : contacts.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-card p-6 text-center">
                    <span className="mb-2 block text-3xl"></span>
                    <p className="font-body text-sm text-muted-foreground">
                      Nenhum contato salvo. Apenas chaves Pix reutilizáveis são salvas automaticamente.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
                      >
                        {editingContactId === contact.id ? (
                          <div className="flex flex-1 items-center gap-2">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-kids-green-light text-lg">
                              
                            </div>
                            <div className="flex-1">
                              <Input
                                value={editingName}
                                onChange={(event) => setEditingName(event.target.value.slice(0, 50))}
                                className="h-8 rounded-xl text-sm font-display font-bold"
                                autoFocus
                                maxLength={50}
                                onKeyDown={(event) => event.key === "Enter" && void handleSaveEditContact(contact.id)}
                              />
                              <p className="mt-1 font-body text-xs text-muted-foreground">
                                {formatDisplayChave(contact.chave_pix, contact.tipo_chave)}
                              </p>
                            </div>
                            <button
                              onClick={() => void handleSaveEditContact(contact.id)}
                              className="rounded-xl p-2 text-primary transition-colors hover:text-primary/80"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => setEditingContactId(null)}
                              className="rounded-xl p-2 text-muted-foreground transition-colors hover:text-foreground"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <button onClick={() => handleSelectContact(contact)} className="flex flex-1 items-center gap-3 text-left">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-kids-green-light text-lg"></div>
                              <div>
                                <p className="font-display text-sm font-bold">{contact.nome}</p>
                                <p className="font-body text-xs text-muted-foreground">
                                  {formatDisplayChave(contact.chave_pix, contact.tipo_chave)}
                                </p>
                              </div>
                            </button>
                            <button
                              onClick={() => handleEditContact(contact)}
                              className="rounded-xl p-2 text-muted-foreground transition-colors hover:text-primary"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteContact(contact.id)}
                              className="rounded-xl p-2 text-muted-foreground transition-colors hover:text-destructive"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === "manual" && (
            <motion.div
              key="manual"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="space-y-4 rounded-3xl border border-border bg-card p-6">
                <h3 className="text-center font-display text-xl font-bold">Chave Pix</h3>

                <div>
                  <Label className="text-sm font-display font-bold">Chave Pix</Label>
                  <Input
                    value={chavePix}
                    onChange={(event) => setChavePix(formatChavePixLive(event.target.value))}
                    placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
                    className="mt-1 h-12 rounded-2xl font-display"
                    autoFocus
                  />
                  {chavePix.trim() && (
                    <p className="mt-1 font-body text-xs text-muted-foreground">
                      Tipo detectado: <span className="font-semibold text-primary">{TIPO_CHAVE_LABELS[detectTipoChave(chavePix)]}</span>
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-display font-bold">Nome do destinatário</Label>
                  <Input
                    value={nomeDestinatario}
                    onChange={(event) => setNomeDestinatario(event.target.value)}
                    placeholder="Ex: João da Loja"
                    className="mt-1 h-12 rounded-2xl font-display"
                  />
                </div>

                <Button
                  onClick={handleManualNext}
                  className="w-full rounded-2xl bg-primary py-6 text-lg font-display font-bold text-primary-foreground shadow-lg"
                >
                  Continuar
                </Button>
              </div>
            </motion.div>
          )}

          {step === "colar" && (
            <motion.div
              key="colar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="space-y-4 rounded-3xl border border-border bg-card p-6">
                <h3 className="text-center font-display text-xl font-bold">Colar código Pix</h3>
                <p className="text-center font-body text-sm text-muted-foreground">
                  Cole o código Pix copia e cola ou o conteúdo do QR Code.
                </p>

                <textarea
                  value={codigoCopiaECola}
                  onChange={(event) => setCodigoCopiaECola(event.target.value)}
                  placeholder="Cole o código aqui..."
                  className="min-h-[120px] w-full resize-none rounded-2xl border-2 border-primary/20 bg-kids-blue-light p-4 font-mono text-sm focus:border-primary/50 focus:outline-none"
                  autoFocus
                />

                <div>
                  <Label className="text-sm font-display font-bold">Nome do destinatário (opcional)</Label>
                  <Input
                    value={nomeDestinatario}
                    onChange={(event) => setNomeDestinatario(event.target.value)}
                    placeholder="Ex: Loja do João"
                    className="mt-1 h-12 rounded-2xl font-display"
                  />
                </div>

                <Button
                  onClick={handleParseCopiaECola}
                  className="w-full rounded-2xl bg-primary py-6 text-lg font-display font-bold text-primary-foreground shadow-lg"
                >
                  Continuar
                </Button>
              </div>
            </motion.div>
          )}

          {step === "qrcode" && (
            <motion.div
              key="qrcode"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="space-y-4 rounded-3xl border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-bold">Escanear QR Code</h3>
                  <button
                    onClick={() => {
                      stopQrScanner();
                      setStep("inicio");
                    }}
                    className="p-2 text-muted-foreground hover:text-destructive"
                  >
                    <X size={20} />
                  </button>
                </div>
                <p className="text-center font-body text-sm text-muted-foreground">
                  {scanning ? "Aponte a câmera para o QR Code Pix." : "Preparando a câmera..."}
                </p>
                <div ref={scannerContainerRef} className="overflow-hidden rounded-2xl border-2 border-primary/20">
                  <div id="qr-reader" style={{ width: "100%" }} />
                </div>
              </div>
            </motion.div>
          )}

          {step === "confirmar" && (
            <motion.div
              key="confirmar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="rounded-3xl bg-kids-green-light p-5 text-center">
                <p className="font-body text-xs text-muted-foreground">Pagar via Pix para</p>
                <p className="mt-1 font-display text-2xl font-bold">{nomeDestinatario}</p>
                <p className="mt-1 font-body text-xs text-muted-foreground">
                  {PAYMENT_SOURCE_LABELS[paymentSource]}: {formatDisplayChave(chavePix, tipoChave)}
                </p>
                {!isReusablePixKey(paymentSource, tipoChave, chavePix) && (
                  <p className="mt-2 font-body text-xs text-muted-foreground">
                    Esse código será usado apenas neste pagamento e não será salvo como contato.
                  </p>
                )}
              </div>

              <div className="space-y-4 rounded-3xl border border-border bg-card p-6">
                <div>
                  <Label className="text-sm font-display font-bold">Quanto?</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={valor}
                    onChange={(event) => setValor(event.target.value)}
                    placeholder="10.00"
                    className="mt-1 h-14 rounded-2xl border-2 border-accent/20 bg-kids-green-light text-center font-display text-2xl font-bold"
                    autoFocus
                  />
                  <p className="mt-1 text-center font-body text-xs text-muted-foreground">
                    Saldo disponível: R$ {kid.saldo.toFixed(2)}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-display font-bold">Descrição (opcional)</Label>
                  <Input
                    value={descricao}
                    onChange={(event) => setDescricao(event.target.value.slice(0, 50))}
                    placeholder="Pagamento Pix"
                    className="mt-1 h-10 rounded-2xl"
                    maxLength={50}
                  />
                </div>

                <Button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="w-full rounded-2xl bg-kids-green py-6 text-lg font-display font-bold text-accent-foreground shadow-lg"
                >
                  {loading ? "Pagando..." : "Confirmar e pagar"}
                </Button>
              </div>
            </motion.div>
          )}

          {step === "sucesso" && (
            <motion.div
              key="sucesso"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-6"
            >
              <div className="rounded-3xl bg-kids-green-light p-8 text-center">
                <span className="mb-4 block text-6xl"></span>
                <p className="font-display text-2xl font-bold">Pagamento Pix realizado!</p>
                <p className="mt-3 font-display text-3xl font-extrabold text-primary">R$ {successAmount.toFixed(2)}</p>
                <p className="mt-2 text-sm font-body text-muted-foreground">
                  para <span className="font-bold">{nomeDestinatario}</span>
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() =>
                    printReceipt({
                      tipo: "pix",
                      valor: successAmount,
                      data: new Date(),
                      para: nomeDestinatario,
                      de: kid.apelido || kid.nome,
                      chavePix,
                      status: "aprovado",
                      descricao: descricao || "Pagamento Pix",
                    })
                  }
                  variant="outline"
                  className="flex-1 rounded-2xl py-6 font-display font-bold"
                >
                  <Printer size={18} className="mr-2" /> Comprovante
                </Button>
                <Button
                  onClick={() => navigate("/crianca/dashboard")}
                  className="flex-1 rounded-2xl bg-primary py-6 text-lg font-display font-bold text-primary-foreground shadow-lg"
                >
                  Início
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <KidBottomNav />
    </div>
  );
};

export default KidPagarPix;
