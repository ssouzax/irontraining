import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Share, MoreVertical, Plus, Smartphone, Monitor, CheckCircle2, ArrowDown, Zap, Wifi, Bell } from "lucide-react";
import { motion } from "framer-motion";

type Platform = "ios" | "android" | "desktop" | "unknown";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPage() {
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  const benefits = [
    { icon: Zap, title: "Acesso rápido", desc: "Abra direto da tela inicial" },
    { icon: Wifi, title: "Funciona offline", desc: "Acesse mesmo sem internet" },
    { icon: Bell, title: "Tela cheia", desc: "Experiência sem barra do navegador" },
  ];

  return (
    <div className="min-h-screen bg-background px-4 py-8 max-w-lg mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent mx-auto flex items-center justify-center shadow-lg">
          <Download className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Instalar PowerBuild</h1>
        <p className="text-muted-foreground text-sm">
          Instale o app no seu celular para a melhor experiência de treino.
        </p>
      </motion.div>

      {isInstalled && (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Card className="border-green-500/30 bg-green-500/10">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />
              <div>
                <p className="font-semibold text-foreground">App já instalado!</p>
                <p className="text-sm text-muted-foreground">Você já pode abrir pela tela inicial.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {deferredPrompt && !isInstalled && (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Button onClick={handleInstall} size="lg" className="w-full text-lg gap-2">
            <Download className="w-5 h-5" /> Instalar agora
          </Button>
        </motion.div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {benefits.map((b, i) => (
          <motion.div key={b.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="bg-card border-border">
              <CardContent className="p-3 text-center space-y-2">
                <b.icon className="w-6 h-6 text-primary mx-auto" />
                <p className="text-xs font-semibold text-foreground">{b.title}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{b.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Platform tabs */}
      <div className="flex gap-2 justify-center">
        {(["ios", "android", "desktop"] as Platform[]).map((p) => (
          <Button
            key={p}
            variant={platform === p ? "default" : "outline"}
            size="sm"
            onClick={() => setPlatform(p)}
            className="gap-1.5"
          >
            {p === "ios" && <Smartphone className="w-4 h-4" />}
            {p === "android" && <Smartphone className="w-4 h-4" />}
            {p === "desktop" && <Monitor className="w-4 h-4" />}
            {p === "ios" ? "iPhone" : p === "android" ? "Android" : "Desktop"}
          </Button>
        ))}
      </div>

      {/* iOS instructions */}
      {platform === "ios" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">Como instalar no iPhone</h2>
          <Step num={1} icon={<Share className="w-5 h-5" />} title="Abra no Safari" desc='Certifique-se de que está usando o Safari (não Chrome ou outro navegador).' />
          <ArrowDown className="w-4 h-4 text-muted-foreground mx-auto" />
          <Step num={2} icon={<Share className="w-5 h-5" />} title='Toque em "Compartilhar"' desc="Toque no ícone de compartilhar (quadrado com seta para cima) na barra inferior do Safari." />
          <ArrowDown className="w-4 h-4 text-muted-foreground mx-auto" />
          <Step num={3} icon={<Plus className="w-5 h-5" />} title='"Adicionar à Tela de Início"' desc='Role para baixo e toque em "Adicionar à Tela de Início". Confirme tocando em "Adicionar".' />
          <ArrowDown className="w-4 h-4 text-muted-foreground mx-auto" />
          <Step num={4} icon={<CheckCircle2 className="w-5 h-5 text-green-400" />} title="Pronto!" desc="O PowerBuild aparecerá como um app na sua tela inicial." />
        </motion.div>
      )}

      {/* Android instructions */}
      {platform === "android" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">Como instalar no Android</h2>
          <Step num={1} icon={<Smartphone className="w-5 h-5" />} title="Abra no Chrome" desc="Acesse o app pelo Google Chrome." />
          <ArrowDown className="w-4 h-4 text-muted-foreground mx-auto" />
          <Step num={2} icon={<MoreVertical className="w-5 h-5" />} title="Menu do Chrome" desc='Toque nos 3 pontos (⋮) no canto superior direito.' />
          <ArrowDown className="w-4 h-4 text-muted-foreground mx-auto" />
          <Step num={3} icon={<Download className="w-5 h-5" />} title='"Instalar app" ou "Adicionar à tela inicial"' desc='Toque na opção "Instalar app" ou "Adicionar à tela inicial".' />
          <ArrowDown className="w-4 h-4 text-muted-foreground mx-auto" />
          <Step num={4} icon={<CheckCircle2 className="w-5 h-5 text-green-400" />} title="Pronto!" desc="O app será instalado e aparecerá na sua tela inicial." />
        </motion.div>
      )}

      {/* Desktop instructions */}
      {platform === "desktop" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">Como instalar no Desktop</h2>
          <Step num={1} icon={<Monitor className="w-5 h-5" />} title="Abra no Chrome ou Edge" desc="Acesse o app pelo Google Chrome ou Microsoft Edge." />
          <ArrowDown className="w-4 h-4 text-muted-foreground mx-auto" />
          <Step num={2} icon={<Download className="w-5 h-5" />} title="Clique no ícone de instalação" desc="Na barra de endereço, clique no ícone de instalação (monitor com seta) que aparece à direita." />
          <ArrowDown className="w-4 h-4 text-muted-foreground mx-auto" />
          <Step num={3} icon={<CheckCircle2 className="w-5 h-5 text-green-400" />} title="Confirme" desc='Clique em "Instalar" na janela que aparecer.' />
        </motion.div>
      )}
    </div>
  );
}

function Step({ num, icon, title, desc }: { num: number; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: num * 0.1 }}>
      <Card className="bg-card border-border">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
            {icon}
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">{title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
