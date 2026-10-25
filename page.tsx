
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createClient } from "../utils/supabase/client";

type Listing = {
  id: string;
  user_id?: string | null;
  title: string;
  price: number;
  category: string;
  city: string;
  description: string;
  phone?: string | null;
  image_url?: string | null;
  image_urls?: string[] | null;
  emoji: string;
  urgent: boolean;
};

const categories = [
  "Tümü", "Vasıta", "Emlak", "Elektronik", "İkinci El",
  "Yedek Parça", "Hayvanlar", "Hizmetler",
];

const sampleListings: Listing[] = [
  {
    id: "demo-1",
    title: "Otomatik Vites Aile Arabası",
    price: 875000,
    category: "Vasıta",
    city: "Sakarya / Adapazarı",
    description: "Örnek ilan. Gerçek satıcı ilanı değildir.",
    emoji: "🚗",
    urgent: true,
  },
  {
    id: "demo-2",
    title: "Geniş ve Ferah 3+1 Daire",
    price: 4250000,
    category: "Emlak",
    city: "İstanbul",
    description: "Örnek ilan. Gerçek satıcı ilanı değildir.",
    emoji: "🏠",
    urgent: false,
  },
  {
    id: "demo-3",
    title: "Dizüstü Bilgisayar",
    price: 18500,
    category: "Elektronik",
    city: "Ankara",
    description: "Örnek ilan. Gerçek satıcı ilanı değildir.",
    emoji: "💻",
    urgent: false,
  },
  {
    id: "demo-4",
    title: "Bakımlı Dağ Bisikleti",
    price: 6500,
    category: "İkinci El",
    city: "Sakarya",
    description: "Örnek ilan. Gerçek satıcı ilanı değildir.",
    emoji: "🚲",
    urgent: false,
  },
  {
    id: "demo-5",
    title: "Çelik Kapı",
    price: 12500,
    category: "Yedek Parça",
    city: "Kocaeli",
    description: "Örnek ilan. Gerçek satıcı ilanı değildir.",
    emoji: "🚪",
    urgent: false,
  },
  {
    id: "demo-6",
    title: "Besi Hayvanı",
    price: 65000,
    category: "Hayvanlar",
    city: "Sakarya / Karapürçek",
    description: "Örnek ilan. Gerçek satıcı ilanı değildir.",
    emoji: "🐄",
    urgent: false,
  },
];

const plans = [
  { name: "2. Bireysel İlan", price: 400, detail: "İkinci ilan hakkı" },
  { name: "3. Bireysel İlan", price: 450, detail: "Üçüncü ilan hakkı" },
  { name: "4. Bireysel İlan", price: 500, detail: "Dördüncü ilan hakkı" },
  { name: "Ek Bireysel İlan", price: 550, detail: "Ek ilan hakkı" },
  { name: "Öne Çıkan İlan", price: 150, detail: "İlanını öne çıkar" },
  { name: "Esnaf Tek İlan", price: 350, detail: "İşletmeler için" },
  { name: "Esnaf Başlangıç", price: 1750, detail: "5 aktif ilan" },
  { name: "Esnaf Aktif", price: 3750, detail: "15 aktif ilan" },
  { name: "Esnaf Profesyonel", price: 6000, detail: "30 aktif ilan" },
];

const money = (n: number) => n.toLocaleString("tr-TR") + " TL";

const MAX_PHOTOS = 10;
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const reportReasons = [
  "Sahte ilan",
  "Yanlış fiyat veya açıklama",
  "Şüpheli ürün",
  "Dolandırıcılık şüphesi",
  "Uygunsuz fotoğraf veya içerik",
  "Diğer",
];

function getPhotos(item: Listing): string[] {
  if (item.image_urls?.length) return item.image_urls;
  return item.image_url ? [item.image_url] : [];
}

function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

function whatsappNumber(phone: string): string {
  let number = phoneDigits(phone);
  if (number.startsWith("00")) number = number.slice(2);
  if (number.startsWith("0")) number = "90" + number.slice(1);
  else if (number.length === 10) number = "90" + number;
  return number;
}

export default function HomePage() {
  const [supabase] = useState(() => createClient());

  const [listings, setListings] = useState<Listing[]>(sampleListings);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tümü");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [memberType, setMemberType] =
    useState<"individual" | "business">("individual");
  const [companyName, setCompanyName] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Listing | null>(null);
  const [selectedPlan, setSelectedPlan] =
    useState<(typeof plans)[number] | null>(null);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Sahte ilan");
  const [reportDetails, setReportDetails] = useState("");
  const [reportBusy, setReportBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [city, setCity] = useState("Sakarya");
  const [newCategory, setNewCategory] = useState("İkinci El");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");

  const [photos, setPhotos] = useState<File[]>([]);
  const [photoError, setPhotoError] = useState("");
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const { data } = await supabase.auth.getSession();
        if (active) setUser(data.session?.user ?? null);
      } catch {
        if (active) setNotice("Oturum bilgisi alınamadı.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    const urls = photos.map((file) => URL.createObjectURL(file));
    setPhotoPreviews(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photos]);

  const filteredListings = useMemo(() => {
    const term = search.toLocaleLowerCase("tr-TR").trim();

    return listings.filter((item) => {
      const allText =
        `${item.title} ${item.city} ${item.category} ${item.description}`
          .toLocaleLowerCase("tr-TR");

      return (
        (category === "Tümü" || item.category === category) &&
        (!term || allText.includes(term)) &&
        (!onlyFavorites || favorites.includes(item.id))
      );
    });
  }, [listings, search, category, onlyFavorites, favorites]);

  function choosePhotos(files: FileList | null) {
    setPhotoError("");
    if (!files) return;

    const chosen = Array.from(files);

    if (chosen.length > MAX_PHOTOS) {
      setPhotoError("En fazla 10 fotoğraf seçebilirsin.");
      return;
    }

    if (chosen.some((f) => !ALLOWED_TYPES.includes(f.type))) {
      setPhotoError("Yalnızca JPG, PNG ve WebP fotoğrafları kabul edilir.");
      return;
    }

    if (chosen.some((f) => f.size > MAX_SIZE)) {
      setPhotoError("Her fotoğraf en fazla 5 MB olabilir.");
      return;
    }

    setPhotos(chosen);
  }

  async function handleAuth(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAuthBusy(true);
    setNotice("");

    try {
      const result =
        authMode === "signup"
          ? await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  member_type: memberType,
                  company_name:
                    memberType === "business" ? companyName : "",
                },
              },
            })
          : await supabase.auth.signInWithPassword({ email, password });

      if (result.error) throw result.error;

      if (authMode === "signup" && !result.data.session) {
        setNotice(
          "Kayıt isteği gönderildi. E-postanı doğrulaman gerekebilir."
        );
      } else {
        setNotice("Giriş başarılı.");
      }

      setAuthOpen(false);
      setPassword("");
    } catch (error) {
      setNotice(
        "İşlem başarısız: " +
          (error instanceof Error ? error.message : "Bilinmeyen hata.")
      );
    } finally {
      setAuthBusy(false);
    }
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();
    setNotice(error ? error.message : "Oturum kapatıldı.");
  }

  async function addListing(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNotice("");
    setPhotoError("");

    if (!user) {
      setShowForm(false);
      setAuthMode("signup");
      setAuthOpen(true);
      setNotice("İlan vermek için önce giriş yapmalısın.");
      return;
    }

    const amount = Number(price);
    const cleanPhone = phone.trim();

    if (
      !title.trim() ||
      !city.trim() ||
      !description.trim() ||
      !cleanPhone ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setNotice("Lütfen bütün alanları doğru doldur.");
      return;
    }

    if (
      photos.length > MAX_PHOTOS ||
      photos.some(
        (f) => !ALLOWED_TYPES.includes(f.type) || f.size > MAX_SIZE
      )
    ) {
      setPhotoError("Fotoğrafları kontrol edip yeniden seç.");
      return;
    }

    setSaving(true);

    try {
      const imageUrls: string[] = [];

      for (const photo of photos) {
        const extension =
          photo.type === "image/png"
            ? "png"
            : photo.type === "image/webp"
              ? "webp"
              : "jpg";

        const path = `${user.id}/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("listing-images")
          .upload(path, photo, {
            contentType: photo.type,
            upsert: false,
          });

        if (uploadError) {
          throw new Error("Fotoğraf yüklenemedi: " + uploadError.message);
        }

        const { data: publicData } = supabase.storage
          .from("listing-images")
          .getPublicUrl(path);

        imageUrls.push(publicData.publicUrl);
      }

      const { data, error } = await supabase
        .from("listings")
        .insert({
          user_id: user.id,
          title: title.trim(),
          price: amount,
          category: newCategory,
          city: city.trim(),
          description: description.trim(),
          phone: cleanPhone,
          image_url: imageUrls[0] ?? null,
          image_urls: imageUrls,
        })
        .select()
        .single();

      if (error) throw error;

      const newListing: Listing = {
        id: String(data.id),
        user_id: data.user_id,
        title: data.title,
        price: Number(data.price),
        category: data.category,
        city: data.city,
        description: data.description ?? "",
        phone: data.phone ?? cleanPhone,
        image_url: data.image_url ?? imageUrls[0] ?? null,
        image_urls: data.image_urls ?? imageUrls,
        emoji: "📦",
        urgent: false,
      };

      setListings((old) => [newListing, ...old]);
      setShowForm(false);
      setTitle("");
      setPrice("");
      setCity("Sakarya");
      setNewCategory("İkinci El");
      setDescription("");
      setPhone("");
      setPhotos([]);
      setPhotoError("");
      setNotice("İlanın kaydedildi.");
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "İlan kaydedilemedi."
      );
    } finally {
      setSaving(false);
    }
  }

  async function submitReport(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!user) {
      setReportOpen(false);
      setAuthMode("login");
      setAuthOpen(true);
      setNotice("Şikâyet göndermek için önce giriş yapmalısın.");
      return;
    }

    if (!selected || selected.id.startsWith("demo-")) {
      setNotice("Örnek ilanlar için şikâyet gönderilemez.");
      return;
    }

    if (selected.user_id === user.id) {
      setNotice("Kendi ilanını şikâyet edemezsin.");
      return;
    }

    setReportBusy(true);

    try {
      const { error } = await supabase.from("listing_reports").insert({
        listing_id: String(selected.id),
        reporter_id: user.id,
        reason: reportReason,
        details: reportDetails.trim() || null,
      });

      if (error) {
        if (error.code === "23505") {
          throw new Error("Bu ilan için daha önce şikâyet göndermişsin.");
        }

        throw error;
      }

      setReportOpen(false);
      setReportDetails("");
      setReportReason("Sahte ilan");
      setNotice("Şikâyetin inceleme için kaydedildi.");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Şikâyet gönderilemedi."
      );
    } finally {
      setReportBusy(false);
    }
  }

  function toggleFavorite(id: string) {
    setFavorites((old) =>
      old.includes(id) ? old.filter((x) => x !== id) : [...old, id]
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800">
      <header className="sticky top-0 z-30 bg-[#234f82] text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-4">
          <button
            className="text-left text-xl font-black sm:text-2xl"
            onClick={() => {
              setCategory("Tümü");
              setSearch("");
              setOnlyFavorites(false);
            }}
          >
            <span className="rounded bg-yellow-400 px-2 py-1 text-slate-950">
              TÜRK
            </span>{" "}
            PAZARI <span className="text-yellow-300">Hızlı Sat</span>
          </button>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ne arıyorsunuz?"
            className="min-w-[150px] flex-1 rounded-lg px-4 py-3 text-slate-900 outline-none"
          />

          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className="rounded-lg border border-white/30 px-3 py-2 font-bold"
          >
            ♥ Favoriler
          </button>

          {user ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="max-w-40 truncate text-sm">{user.email}</span>
              <button
                onClick={logout}
                className="rounded-lg border border-white/40 px-3 py-2"
              >
                Çıkış
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="rounded-lg bg-yellow-400 px-4 py-3 font-black text-slate-950"
              >
                + İlan Ver
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => {
                  setAuthMode("login");
                  setAuthOpen(true);
                }}
                className="rounded-lg border border-white/40 px-3 py-2 font-bold"
              >
                Giriş Yap
              </button>
              <button
                onClick={() => {
                  setAuthMode("signup");
                  setAuthOpen(true);
                }}
                className="rounded-lg bg-yellow-400 px-4 py-3 font-black text-slate-950"
              >
                Üye Ol
              </button>
            </>
          )}
        </div>
      </header>

      <section className="bg-white px-4 py-6">
        <div className="mx-auto max-w-7xl rounded-2xl bg-gradient-to-r from-[#18375c] to-[#3982bd] p-7 text-white sm:p-12">
          <p className="font-bold tracking-widest text-yellow-300">
            TÜRK PAZARI HIZLI SAT
          </p>
          <h1 className="mt-3 max-w-2xl text-3xl font-black sm:text-5xl">
            Ara, bul, al ve sat!
          </h1>
          <p className="mt-4 max-w-xl text-blue-100">
            Emlak, vasıta, elektronik ve ikinci el ürünler tek pazarda.
            Satıcıyla iletişim kur, ürünü yüz yüze kontrol et.
          </p>
          <button
            onClick={() => {
              if (user) setShowForm(true);
              else {
                setAuthMode("signup");
                setAuthOpen(true);
              }
            }}
            className="mt-6 rounded-lg bg-yellow-400 px-6 py-3 font-black text-slate-950"
          >
            Hemen İlan Ver →
          </button>
        </div>
      </section>

      <section className="bg-white px-4 py-9">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-3xl font-black">Satıcı Paketleri</h2>
          <p className="mt-2 text-center text-slate-600">
            Paket ödemeleri şu anda kapalıdır; PayTR onayı bekleniyor.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className="rounded-xl border bg-slate-50 p-5"
              >
                <h3 className="font-black">{plan.name}</h3>
                <p className="mt-3 text-2xl font-black text-blue-800">
                  {money(plan.price)}
                </p>
                <p className="mt-1 text-sm text-slate-600">{plan.detail}</p>
                <button
                  onClick={() => setSelectedPlan(plan)}
                  className="mt-4 w-full rounded-lg border border-blue-800 px-4 py-2 font-bold text-blue-800"
                >
                  Paket Detayı
                </button>
              </article>
            ))}
          </div>

          {selectedPlan && (
            <div className="mx-auto mt-5 max-w-xl rounded-xl border bg-blue-50 p-5">
              <h3 className="text-lg font-black">{selectedPlan.name}</h3>
              <p className="mt-2">
                {money(selectedPlan.price)} — {selectedPlan.detail}
              </p>
              <p className="mt-3 text-sm text-slate-700">
                PayTR onayı tamamlanmadı. Şimdilik ödeme yapamazsın.
                Müşteri ile satıcı arasındaki ürün ödemesi bu paketlerden
                ayrıdır ve siteden alınmaz.
              </p>
              <button
                onClick={() => setSelectedPlan(null)}
                className="mt-4 rounded-lg bg-blue-800 px-4 py-2 font-bold text-white"
              >
                Kapat
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        {notice && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
            <span>{notice}</span>
            <button onClick={() => setNotice("")} className="underline">
              Kapat
            </button>
          </div>
        )}

        <h2 className="mb-4 text-xl font-black">Kategoriler</h2>
        <div className="mb-7 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setCategory(cat);
                setOnlyFavorites(false);
              }}
              className={`rounded-full border px-4 py-2 font-bold ${
                category === cat && !onlyFavorites
                  ? "border-blue-800 bg-blue-800 text-white"
                  : "bg-white hover:border-blue-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black">
            {onlyFavorites ? "Favori İlanlar" : "İlanlar"}
          </h2>
          <span className="text-sm text-slate-500">
            {loading ? "Yükleniyor..." : `${filteredListings.length} ilan`}
          </span>
        </div>

        {filteredListings.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center">
            İlan bulunamadı. Başka bir arama deneyebilirsin.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredListings.map((item) => {
              const images = getPhotos(item);

              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-xl border bg-white shadow-sm"
                >
                  <button
                    onClick={() => setSelected(item)}
                    className="relative flex h-48 w-full items-center justify-center bg-gradient-to-br from-blue-50 to-slate-200 text-7xl"
                  >
                    {images[0] ? (
                      <img
                        src={images[0]}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      item.emoji
                    )}

                    {images.length > 1 && (
                      <span className="absolute bottom-2 right-2 rounded-lg bg-black/75 px-2 py-1 text-sm font-bold text-white">
                        📷 {images.length} fotoğraf
                      </span>
                    )}
                  </button>

                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded bg-blue-50 px-2 py-1 text-xs font-bold text-blue-800">
                        {item.category}
                      </span>
                      {item.urgent && (
                        <span className="rounded bg-red-600 px-2 py-1 text-xs font-bold text-white">
                          ACİL
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => setSelected(item)}
                      className="mt-3 block text-left font-black hover:text-blue-700"
                    >
                      {item.title}
                    </button>

                    <p className="mt-2 text-sm text-slate-500">
                      📍 {item.city}
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t pt-3">
                      <strong className="text-lg text-blue-800">
                        {money(item.price)}
                      </strong>
                      <button
                        onClick={() => toggleFavorite(item.id)}
                        className="rounded-full border px-3 py-2"
                        aria-label="Favorilere ekle veya çıkar"
                      >
                        {favorites.includes(item.id) ? "♥" : "♡"}
                      </button>
                    </div>

                    <button
                      onClick={() => setSelected(item)}
                      className="mt-3 w-full rounded-lg bg-blue-800 px-4 py-3 font-bold text-white"
                    >
                      İlanı İncele
                    </button>

                    {item.id.startsWith("demo-") && (
                      <p className="mt-2 text-xs text-amber-700">
                        Örnek ilan — gerçek satış ilanı değildir.
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <footer className="mt-8 bg-[#18375c] px-4 py-8 text-center text-blue-100">
        <p className="font-black text-white">TÜRK PAZARI HIZLI SAT</p>
        <p className="mt-2 text-sm">Alım satımın kolay adresi.</p>
        <p className="mt-3 text-xs">
          Ürün ödemeleri ve teslimat alıcı ile satıcı arasında yapılır.
          Sitemiz ürün ödemesi almaz.
        </p>
      </footer>

      {authOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4">
          <form
            onSubmit={handleAuth}
            className="my-auto w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black">
                {authMode === "signup" ? "Üye Ol" : "Giriş Yap"}
              </h2>
              <button
                type="button"
                onClick={() => setAuthOpen(false)}
                className="text-2xl"
              >
                ×
              </button>
            </div>

            {authMode === "signup" && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMemberType("individual")}
                  className={`rounded-lg border p-3 font-bold ${
                    memberType === "individual" ? "bg-blue-800 text-white" : ""
                  }`}
                >
                  Bireysel
                </button>
                <button
                  type="button"
                  onClick={() => setMemberType("business")}
                  className={`rounded-lg border p-3 font-bold ${
                    memberType === "business" ? "bg-blue-800 text-white" : ""
                  }`}
                >
                  İşletme
                </button>
              </div>
            )}

            {authMode === "signup" && memberType === "business" && (
              <label className="block text-sm font-bold">
                Firma adı
                <input
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="mt-1 w-full rounded-lg border p-3 font-normal"
                />
              </label>
            )}

            <label className="block text-sm font-bold">
              E-posta
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border p-3 font-normal"
                placeholder="ornek@mail.com"
              />
            </label>

            <label className="block text-sm font-bold">
              Parola
              <input
                required
                minLength={6}
                type="password"
                autoComplete={
                  authMode === "signup" ? "new-password" : "current-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border p-3 font-normal"
                placeholder="En az 6 karakter"
              />
            </label>

            <button
              disabled={authBusy}
              type="submit"
              className="w-full rounded-lg bg-yellow-400 p-3 font-black text-slate-950 disabled:opacity-50"
            >
              {authBusy
                ? "Bekle..."
                : authMode === "signup"
                  ? "Hesap Oluştur"
                  : "Giriş Yap"}
            </button>

            <button
              type="button"
              className="w-full text-sm underline"
              onClick={() =>
                setAuthMode(authMode === "signup" ? "login" : "signup")
              }
            >
              {authMode === "signup"
                ? "Zaten üye misin? Giriş yap"
                : "Hesabın yok mu? Üye ol"}
            </button>
          </form>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4">
          <form
            onSubmit={addListing}
            className="my-auto w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black">İlan Ver</h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-2xl"
              >
                ×
              </button>
            </div>

            <label className="block text-sm font-bold">
              İlan başlığı
              <input
                required
                maxLength={100}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border p-3 font-normal"
                placeholder="Örn. İkinci el bisiklet"
              />
            </label>

            <label className="block text-sm font-bold">
              Fiyat (TL)
              <input
                required
                type="number"
                min="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1 w-full rounded-lg border p-3 font-normal"
                placeholder="15000"
              />
            </label>

            <label className="block text-sm font-bold">
              Kategori
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="mt-1 w-full rounded-lg border bg-white p-3 font-normal"
              >
                {categories
                  .filter((cat) => cat !== "Tümü")
                  .map((cat) => (
                    <option key={cat}>{cat}</option>
                  ))}
              </select>
            </label>

            <label className="block text-sm font-bold">
              Şehir / ilçe
              <input
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1 w-full rounded-lg border p-3 font-normal"
                placeholder="Sakarya / Adapazarı"
              />
            </label>

            <label className="block text-sm font-bold">
              Telefon / WhatsApp
              <input
                required
                type="tel"
                maxLength={25}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border p-3 font-normal"
                placeholder="05XX XXX XX XX"
              />
              <span className="mt-1 block font-normal text-slate-500">
                Telefon numarası henüz SMS ile doğrulanmıyor. Bu nedenle
                ilanlarda doğrulanmış telefon rozeti gösterilmez.
              </span>
            </label>

            <label className="block text-sm font-bold">
              Açıklama
              <textarea
                required
                maxLength={2000}
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-lg border p-3 font-normal"
                placeholder="Ürünün özelliklerini yaz..."
              />
            </label>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Çıplaklık, pornografik içerik ve yasa dışı ürün ilanları
              yasaktır. Dosya kontrolleri uygunsuz görsellerin tamamını
              tespit edemez.
            </div>

            <div className="text-sm font-bold">
              Fotoğraflar
              <p className="mt-1 font-normal text-slate-500">
                En fazla 10 fotoğraf, JPG / PNG / WebP, her biri en fazla 5 MB.
              </p>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => choosePhotos(e.target.files)}
                className="mt-2 block w-full rounded-lg border p-3 font-normal"
              />

              {photoError && (
                <p className="mt-2 text-red-600">{photoError}</p>
              )}

              {photoPreviews.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {photoPreviews.map((src, index) => (
                    <div key={src} className="overflow-hidden rounded-xl border">
                      <img
                        src={src}
                        alt={`Fotoğraf ${index + 1}`}
                        className="h-28 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setPhotos((old) => old.filter((_, i) => i !== index))
                        }
                        className="w-full p-2 text-red-600"
                      >
                        Fotoğrafı sil ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              disabled={saving || Boolean(photoError)}
              type="submit"
              className="w-full rounded-lg bg-yellow-400 p-3 font-black text-slate-950 disabled:opacity-50"
            >
              {saving ? "Kaydediliyor..." : "İlanı Kaydet"}
            </button>
          </form>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4">
          <div className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-2xl font-black">{selected.title}</h2>
              <button
                onClick={() => setSelected(null)}
                className="text-2xl"
                aria-label="Kapat"
              >
                ×
              </button>
            </div>

            <div className="my-5 grid grid-cols-2 gap-3">
              {getPhotos(selected).map((url, index) => (
                <img
                  key={`${url}-${index}`}
                  src={url}
                  alt={`${selected.title} fotoğraf ${index + 1}`}
                  className="h-40 w-full rounded-xl bg-blue-50 object-contain"
                />
              ))}

              {getPhotos(selected).length === 0 && (
                <div className="col-span-2 flex h-40 items-center justify-center rounded-xl bg-blue-50 text-7xl">
                  {selected.emoji}
                </div>
              )}
            </div>

            <p className="text-2xl font-black text-blue-800">
              {money(selected.price)}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              📍 {selected.city} · {selected.category}
            </p>
            <p className="mt-4 whitespace-pre-wrap">{selected.description}</p>

            {selected.phone ? (
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <a
                  href={`tel:${selected.phone.replace(/[^\d+]/g, "")}`}
                  className="rounded-lg bg-blue-700 p-3 text-center font-bold text-white"
                >
                  📞 Satıcıyı Ara
                </a>
                <a
                  href={`https://wa.me/${whatsappNumber(selected.phone)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-green-600 p-3 text-center font-bold text-white"
                >
                  WhatsApp ile Yaz
                </a>
              </div>
            ) : (
              <p className="mt-5 rounded-lg bg-slate-100 p-3 text-sm text-slate-600">
                Bu örnek ilanda iletişim bilgisi yok.
              </p>
            )}

            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-center text-sm text-amber-900">
              Ürün ödemesi ve teslimatı alıcı ile satıcı arasında yüz yüze
              yapılır. Sitemiz ürün ödemesi almaz. Buluşmadan önce ürünü ve
              satıcının bilgilerini kontrol edin.
            </p>

            {selected.id.startsWith("demo-") ? (
              <p className="mt-4 rounded-lg bg-slate-100 p-3 text-center text-sm text-slate-600">
                Bu bir örnek ilandır. Telefon doğrulama durumu mevcut değil.
              </p>
            ) : (
              <>
                <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                  <span className="font-bold">Telefon durumu:</span>{" "}
                  Henüz doğrulanmadı.
                </div>

                {selected.user_id !== user?.id && (
                  <button
                    onClick={() => {
                      if (!user) {
                        setAuthMode("login");
                        setAuthOpen(true);
                        setNotice("Şikâyet göndermek için önce giriş yap.");
                        return;
                      }

                      setReportReason("Sahte ilan");
                      setReportDetails("");
                      setReportOpen(true);
                    }}
                    className="mt-4 w-full rounded-lg border border-red-300 p-3 font-bold text-red-700 hover:bg-red-50"
                  >
                    ⚑ Şüpheli ilanı şikâyet et
                  </button>
                )}
              </>
            )}

            <button
              onClick={() => toggleFavorite(selected.id)}
              className="mt-4 w-full rounded-lg border p-3 font-bold"
            >
              {favorites.includes(selected.id)
                ? "♥ Favorilerden Çıkar"
                : "♡ Favorilerime Ekle"}
            </button>
          </div>
        </div>
      )}

      {reportOpen && selected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/60 p-4">
          <form
            onSubmit={submitReport}
            className="my-auto w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black">İlanı şikâyet et</h2>
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="text-2xl"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-slate-600">
              İlan: {selected.title}
            </p>

            <label className="block text-sm font-bold">
              Şikâyet nedeni
              <select
                required
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="mt-1 w-full rounded-lg border bg-white p-3 font-normal"
              >
                {reportReasons.map((reason) => (
                  <option key={reason}>{reason}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-bold">
              Açıklama (isteğe bağlı)
              <textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                maxLength={1000}
                rows={4}
                className="mt-1 w-full rounded-lg border p-3 font-normal"
                placeholder="Sorunu kısaca anlat..."
              />
            </label>

            <button
              type="submit"
              disabled={reportBusy}
              className="w-full rounded-lg bg-red-600 p-3 font-black text-white disabled:opacity-50"
            >
              {reportBusy ? "Gönderiliyor..." : "Şikâyeti Gönder"}
            </button>

            <p className="text-xs text-slate-500">
              Şikâyet inceleme için kaydedilir. İlan otomatik olarak
              kaldırılmaz.
            </p>
          </form>
        </div>
      )}
    </main>
  );
}
