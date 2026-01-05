import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Users,
  ClipboardCheck,
  Calendar,
  ArrowRight,
  CheckCircle,
  MapPin,
  Send,
  Shield,
  Zap,
  Globe,
  Award,
  BarChart3,
  Lock,
  MessageSquare,
  Layers,
  Clock,
  Star,
  Building2,
  Mail,
  Phone,
  ChevronRight,
} from "lucide-react";
import { conferenceApi } from "@/lib/api";

// Firma bilgileri - Akademik İnovasyon & BK SoftStudio
const COMPANY = {
  name: "Akademik İnovasyon",
  tagline: "Akademik Konferans Yönetim Sistemi",
  description: "BK SoftStudio ortaklığı ile geliştirilmiş profesyonel konferans yönetim platformu",
  email: "akademikinovasyon2025@gmail.com",
  phone: "+90 (362) 311 1000",
  address: "Samsun Teknopark, Türkiye",
  partners: [
    { name: "Samsun Üniversitesi", logo: "/logos/samsununiversitesi.png" },
    { name: "BK SoftStudio", logo: "/logos/bksoftstudio.png" },
    { name: "Akademik İnovasyon", logo: "/logos/akademikinovasyon.png" },
  ],
};

const features = [
  {
    icon: <FileText className="h-6 w-6" />,
    title: "Makale Gönderimi",
    description: "Kolay makale yükleme, çoklu dosya formatı desteği ve versiyon takibi.",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Hakem Atama",
    description: "Uzmanlık alanına göre akıllı hakem eşleştirme ve çıkar çatışması tespiti.",
  },
  {
    icon: <ClipboardCheck className="h-6 w-6" />,
    title: "Değerlendirme Yönetimi",
    description: "Kapsamlı değerlendirme formları, puanlama ve geri bildirim toplama.",
  },
  {
    icon: <Calendar className="h-6 w-6" />,
    title: "Süre Takibi",
    description: "Otomatik hatırlatmalar ve tüm paydaşlar için son tarih yönetimi.",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Güvenli Altyapı",
    description: "SSL şifreleme, KVKK uyumlu veri saklama ve yedekleme.",
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: "Detaylı Raporlama",
    description: "Gerçek zamanlı istatistikler, grafikler ve dışa aktarma seçenekleri.",
  },
  {
    icon: <MessageSquare className="h-6 w-6" />,
    title: "Tartışma Paneli",
    description: "Hakemler arası iletişim ve karar alma süreçleri için tartışma alanı.",
  },
  {
    icon: <Layers className="h-6 w-6" />,
    title: "Çoklu Track Desteği",
    description: "Sınırsız track ile her biri bağımsız yapılandırılabilir.",
  },
];

const processSteps = [
  {
    step: "01",
    title: "Konferans Oluştur",
    description: "Konferansınızı dakikalar içinde oluşturun, track'leri ve son tarihleri belirleyin.",
  },
  {
    step: "02",
    title: "Makale Kabul Et",
    description: "Yazarlar makalelerini kolayca yüklesin, siz de gelen başvuruları takip edin.",
  },
  {
    step: "03",
    title: "Hakem Ata",
    description: "Manuel veya otomatik atama ile hakemleri makalelere eşleştirin.",
  },
  {
    step: "04",
    title: "Değerlendirme Al",
    description: "Hakemler değerlendirmelerini tamamlasın, puanları ve yorumları görün.",
  },
  {
    step: "05",
    title: "Karar Ver",
    description: "Kabul, ret veya revizyon kararlarını verin ve yazarları bilgilendirin.",
  },
  {
    step: "06",
    title: "Yayınla",
    description: "Camera-ready dosyaları toplayın ve proceedings'i oluşturun.",
  },
];

const stats = [
  { value: "10,000+", label: "Değerlendirilen Makale" },
  { value: "500+", label: "Konferans" },
  { value: "50,000+", label: "Kayıtlı Kullanıcı" },
  { value: "99.9%", label: "Uptime" },
];

const testimonials = [
  {
    quote: "AcademiaFlow sayesinde konferans yönetimi artık çok daha kolay. Hakem atama süreci mükemmel çalışıyor.",
    author: "Prof. Dr. Ahmet Yılmaz",
    role: "Konferans Başkanı, UBMK 2024",
  },
  {
    quote: "Kullanıcı dostu arayüzü ve Türkçe desteği ile akademik çalışmalarımızı çok kolaylaştırdı.",
    author: "Doç. Dr. Ayşe Kaya",
    role: "Program Komitesi Üyesi",
  },
];

interface Conference {
  id: string;
  name: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  _count?: {
    papers: number;
  };
}

export default function LandingPage() {
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConferences = async () => {
      try {
        const response = await conferenceApi.getAll();
        setConferences(response.data.data || []);
      } catch (error) {
        console.error("Failed to fetch conferences:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchConferences();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-3">
            <img 
              src="/logos/akademikinovasyon.png" 
              alt="Akademik İnovasyon"
              className="h-10 w-auto object-contain"
            />
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-none">{COMPANY.name}</span>
              <span className="text-[10px] text-muted-foreground leading-none hidden sm:block">Konferans Yönetim Sistemi</span>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Özellikler
            </a>
            <a href="#process" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Nasıl Çalışır
            </a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Fiyatlandırma
            </a>
            <a href="#conferences" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Konferanslar
            </a>
            <a href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              İletişim
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/sign-in">
              <Button variant="ghost" size="sm">Giriş Yap</Button>
            </Link>
            <Link to="/sign-up">
              <Button size="sm" className="gap-1">
                Ücretsiz Başla
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container relative mx-auto px-4 pt-16">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5">
              <Star className="h-3.5 w-3.5 mr-1.5 text-yellow-500" />
              Türkiye'nin 1 Numaralı Akademik Platform'u
            </Badge>
            
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Akademik Konferanslarınızı
              <span className="block mt-2 bg-linear-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Profesyonelce Yönetin
              </span>
            </h1>
            
            <p className="mb-8 text-lg text-muted-foreground max-w-2xl mx-auto">
              Makale gönderiminden hakemlik sürecine, kararlardan yayına kadar tüm konferans 
              yönetim süreçlerinizi tek platformda, güvenle ve kolayca yönetin.
            </p>
            
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/sign-up">
                <Button size="lg" className="gap-2 h-12 px-8 text-base shadow-lg shadow-primary/25">
                  Ücretsiz Deneyin
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/sign-in">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                  Demo İncele
                </Button>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                <span className="text-sm">KVKK Uyumlu</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-500" />
                <span className="text-sm">SSL Şifreli</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-purple-500" />
                <span className="text-sm">Türkçe Destek</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <span className="text-sm">7/24 Erişim</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Özellikler</Badge>
            <h2 className="text-3xl font-bold mb-4">İhtiyacınız Olan Her Şey</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Akademik konferans yönetimi için gereken tüm araçlar tek bir platformda
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="group hover:shadow-lg transition-all hover:border-primary/50">
                <CardContent className="pt-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Süreç</Badge>
            <h2 className="text-3xl font-bold mb-4">Nasıl Çalışır?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              6 basit adımda konferansınızı baştan sona yönetin
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {processSteps.map((item) => (
              <div key={item.step} className="relative p-6 rounded-xl bg-background border hover:shadow-lg transition-shadow">
                <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-lg">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2 mt-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Active Conferences Section */}
      {!loading && conferences.length > 0 && (
        <section id="conferences" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4">Aktif Konferanslar</Badge>
              <h2 className="text-3xl font-bold mb-4">Açık Konferanslar</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Araştırmanızı göndermek için aktif konferansları inceleyin
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {conferences.slice(0, 6).map((conference) => (
                <Card key={conference.id} className="group hover:shadow-lg transition-all">
                  <CardHeader>
                    <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                      {conference.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {conference.description || "Açıklama mevcut değil"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {conference.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {conference.location}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(conference.startDate).toLocaleDateString("tr-TR")} - {new Date(conference.endDate).toLocaleDateString("tr-TR")}
                    </div>
                    {conference._count && (
                      <Badge variant="secondary">
                        {conference._count.papers} makale gönderildi
                      </Badge>
                    )}
                    <Link to="/sign-up" className="block">
                      <Button className="w-full gap-2 mt-2">
                        <Send className="h-4 w-4" />
                        Makale Gönder
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Partners Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">İş Ortaklarımız</Badge>
            <h2 className="text-3xl font-bold mb-4">Güvenilir İş Birliği</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Samsun Üniversitesi ve BK SoftStudio ile birlikte geliştirilen profesyonel çözümler
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            {COMPANY.partners.map((partner) => (
              <Card key={partner.name} className="group hover:shadow-lg transition-all">
                <CardContent className="pt-6 flex flex-col items-center">
                  <div className="h-24 w-full flex items-center justify-center mb-4 p-4">
                    <img 
                      src={partner.logo} 
                      alt={partner.name}
                      className="max-h-full max-w-full object-contain grayscale group-hover:grayscale-0 transition-all"
                    />
                  </div>
                  <p className="font-semibold text-center">{partner.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Fiyatlandırma</Badge>
            <h2 className="text-3xl font-bold mb-4">Size Özel Çözümler</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Konferansınızın ihtiyaçlarına göre özel fiyatlandırma alın
            </p>
          </div>
          
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Kurumsal Paket</CardTitle>
              <CardDescription className="text-base mt-2">
                Konferansınızın büyüklüğüne ve ihtiyaçlarına göre özelleştirilmiş fiyatlandırma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  <span className="text-sm">Sınırsız makale gönderimi</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  <span className="text-sm">Sınırsız hakem ve kullanıcı</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  <span className="text-sm">Özel domain ve branding</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  <span className="text-sm">Öncelikli teknik destek</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  <span className="text-sm">Özelleştirilebilir formlar ve süreçler</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  <span className="text-sm">Veri yedekleme ve güvenlik</span>
                </div>
              </div>

              <Separator />

              <div className="bg-muted/50 rounded-lg p-6 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Konferansınızın detaylarını bize iletin, size özel fiyat teklifi gönderelim
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-primary" />
                    <a href={`mailto:${COMPANY.email}`} className="text-primary hover:underline">
                      {COMPANY.email}
                    </a>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    veya aşağıdaki formu doldurun, 24 saat içinde size dönüş yapalım
                  </p>
                </div>
              </div>

              <a href={`mailto:${COMPANY.email}?subject=Fiyat Teklifi Talebi&body=Merhaba,%0D%0A%0D%0AKonferans adı:%0D%0ABeklenen makale sayısı:%0D%0ABeklenen hakem sayısı:%0D%0AKonferans tarihi:%0D%0AEk notlar:%0D%0A%0D%0ATeşekkürler`}>
                <Button className="w-full gap-2" size="lg">
                  <Mail className="h-4 w-4" />
                  Fiyat Teklifi İste
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Referanslar</Badge>
            <h2 className="text-3xl font-bold mb-4">Kullanıcılarımız Ne Diyor?</h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {testimonials.map((item, index) => (
              <Card key={index} className="bg-background">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">"{item.quote}"</p>
                  <div>
                    <p className="font-semibold">{item.author}</p>
                    <p className="text-sm text-muted-foreground">{item.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="relative rounded-2xl bg-linear-to-br from-primary to-primary/80 p-12 text-center text-primary-foreground overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/10" />
            <div className="relative">
              <h2 className="text-3xl font-bold mb-4">Hemen Başlayın</h2>
              <p className="mb-8 text-primary-foreground/80 max-w-xl mx-auto">
                Akademik konferanslarınızı profesyonelce yönetmek için hemen ücretsiz hesabınızı oluşturun.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/sign-up">
                  <Button size="lg" variant="secondary" className="gap-2 h-12 px-8">
                    Ücretsiz Hesap Oluştur
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/sign-in">
                  <Button size="lg" variant="outline" className="h-12 px-8 bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                    Giriş Yap
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src="/logos/akademikinovasyon.png" 
                  alt="Akademik İnovasyon"
                  className="h-10 w-auto object-contain"
                />
                <span className="text-lg font-bold">{COMPANY.name}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                {COMPANY.description}. Akademik konferanslarınızı güvenle ve kolayca yönetin.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {COMPANY.email}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {COMPANY.phone}
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {COMPANY.address}
                </div>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Özellikler</a></li>
                <li><a href="#process" className="hover:text-foreground transition-colors">Nasıl Çalışır</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Fiyatlandırma</a></li>
                <li><a href="#conferences" className="hover:text-foreground transition-colors">Konferanslar</a></li>
                <li><Link to="/sign-up" className="hover:text-foreground transition-colors">Kayıt Ol</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4">Yasal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Kullanım Şartları</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Gizlilik Politikası</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">KVKK Aydınlatma Metni</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Çerez Politikası</a></li>
              </ul>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} {COMPANY.name}. Tüm hakları saklıdır.</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-green-500" />
                KVKK Uyumlu
              </span>
              <span className="flex items-center gap-1">
                <Lock className="h-4 w-4 text-blue-500" />
                256-bit SSL
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
