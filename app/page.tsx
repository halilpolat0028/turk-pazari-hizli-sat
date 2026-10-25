
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
  image_url?: string | null;
  emoji: string;
  urgent: boolean;
};

const categories = [
  "Tümü", "Vasıta", "Emlak", "Elektronik",
  "İkinci El", "Yedek Parça", "Hayvanlar", "Hizmetler",
];

const samples: Listing[] = [
  { id: "demo-1", title: "Otomatik Vites Aile Arabası", price: 875000, category: "Vasıta", city: "Sakarya / Adapazarı", description: "Örnek ilan. Gerçek satıcı ilanı değildir.", emoji: "🚗", urgent: true },
  { id: "demo-2", title: "Geniş ve Ferah 3+1 Daire", price: 4250000, category: "Emlak", city: "İstanbul", description: "Örnek ilan. Gerçek satıcı ilanı değildir.", emoji: "🏠", urgent: false },
  { id: "demo-3", title: "Dizüstü Bilgisayar", price: 18500, category: "Elektronik", city: "Ankara", description: "Örnek ilan. Gerçek satıcı ilanı değildir.", emoji: "💻", urgent: false },
  { id: "demo-4", title: "Bakımlı Dağ Bisikleti", price: 6500, category: "İkinci El", city: "Sakarya", description: "Örnek ilan. Gerçek satıcı ilanı değildir.", emoji: "🚲", urgent: false },
  { id: "demo-5", title: "Çelik Kapı", price: 12500, category: "Yedek Parça", city: "Kocaeli", description: "Örnek ilan. Gerçek satıcı ilanı değildir.", emoji: "🚪", urgent: true },
  { id: "demo-6", title: "Besi Hayvanı", price: 65000, category: "Hayvanlar", city: "Sakarya / Karapürçek", description: "Örnek ilan. Gerçek satıcı ilanı değildir.", emoji: "🐄", urgent: false },
];

const money = (price: number) => price.toLocaleString("tr-TR") + " TL";

export default function HomePage() {
  const [supabase] = useState(() => createClient());
  const [listings, setListings] = useState<Listing[]>(samples);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tümü");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Listing | null>(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
const [memberType, setMemberType] = useState<"individual" | "business">("individual");
const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [city, setCity] = useState("Sakarya");
  const [newCategory, setNewCategory] = useState("İkinci El");
  const [description, setDescription] = useState("");
const [photo, setPhoto] = useState<File | null>(null);
const [savingListing, setSavingListing] = useState(false);

  
  useEffect(() => {
    let active = true;

    async function loadData() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (active) {
        setUser(sessionData.session?.user ?? null);
      }
    }

    loadData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const filtered = useMemo(() => {
    const term = search.toLocaleLowerCase("tr-TR").trim();
    return listings.filter((item) => {
      const text = `${item.title} ${item.city} ${item.category} ${item.description}`.toLocaleLowerCase("tr-TR");
      return (
        (category === "Tümü" || item.category === category) &&
        (!term || text.includes(term)) &&
        (!onlyFavorites || favorites.includes(item.id))
      );
    });
  }, [listings, search, category, onlyFavorites, favorites]);

  async function handleAuth(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAuthBusy(true);
    setNotice("");

    try {
      const result = authMode === "signup"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      if (result.error) throw result.error;
      if (authMode === "signup" && !result.data.session) {
        setNotice("Kayıt isteği oluşturuldu. E-postana gelen doğrulama bağlantısını kontrol et.");
      } else {
        setNotice("Giriş başarılı.");
      }

      setAuthOpen(false);
      setPassword("");
    } catch (error) {
      setNotice("Üyelik işlemi başarısız: " + (error instanceof Error ? error.message : "Bir hata oluştu."));
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

    if (!user) {
      setShowForm(false);
      setAuthMode("signup");
      setAuthOpen(true);
      setNotice("İlan vermek için önce üye ol veya giriş yap.");
      return;
    }

    const amount = Number(price);

    if (
      !title.trim() ||
      !city.trim() ||
      !description.trim() ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setNotice("Lütfen tüm alanları doğru doldur.");
      return;
    }

    setSavingListing(true);

    try {
      let imageUrl: string | null = null;
      if (photo) {
        const fileName = `${user.id}/${Date.now()}-${photo.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

        const { error: uploadError } = await supabase.storage
          .from("listing-images")
          .upload(fileName, photo);

        if (uploadError) {
          setNotice("Fotoğraf yüklenemedi: " + uploadError.message);
          return;
        }

        const { data: imageData } = supabase.storage
          .from("listing-images")
          .getPublicUrl(fileName);

        imageUrl = imageData.publicUrl;
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
          image_url: imageUrl,
        })
        .select()
        .single();

      if (error) {
        setNotice("İlan kaydedilemedi: " + error.message);
        return;
      }

      const newListing: Listing = {
        id: String(data.id),
        user_id: data.user_id,
        title: data.title,
        price: Number(data.price),
        category: data.category,
        city: data.city,
        description: data.description ?? "",
        image_url: data.image_url ?? null,
        emoji: "📦",
        urgent: false,
      };

      setListings((old) => [newListing, ...old]);
      setCategory("Tümü");
      setSearch("");
      setOnlyFavorites(false);
      setShowForm(false);
      setNotice("İlanın ve fotoğrafın kaydedildi.");
      setTitle("");
      setPrice("");
      setCity("Sakarya");
      setDescription("");
      setPhoto(null);
    } catch {
      setNotice("Bir hata oluştu. Lütfen tekrar dene.");
    } finally {
      setSavingListing(false);
    }
  }
          
return (
    <main className="min-h-screen bg-slate-100 text-slate-800">
      <header className="sticky top-0 z-30 bg-[#234f82] text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-4">
          <button onClick={() => { setCategory("Tümü"); setSearch(""); setOnlyFavorites(false); }} className="text-left text-xl font-black sm:text-2xl">
            <span className="rounded bg-yellow-400 px-2 py-1 text-slate-950">TÜRK</span>{" "}
            PAZARI <span className="text-yellow-300">Hızlı Sat</span>
          </button>
          <div className="flex min-w-[180px] flex-1 overflow-hidden rounded-lg bg-white">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ne arıyorsunuz?" className="min-w-0 flex-1 px-4 py-3 text-slate-900 outline-none" />
            <span className="px-3 py-3 text-xl text-slate-700">⌕</span>
          </div>
          <button onClick={() => setOnlyFavorites(!onlyFavorites)} className="rounded-lg px-3 py-2 font-semibold hover:bg-white/10">♥ Favoriler ({favorites.length})</button>
          {user ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="max-w-40 truncate text-sm">{user.email}</span>
              <button onClick={logout} className="rounded-lg border border-white/40 px-3 py-2 font-semibold">Çıkış</button>
              <button onClick={() => setShowForm(true)} className="rounded-lg bg-yellow-400 px-4 py-3 font-bold text-slate-950 hover:bg-yellow-300">+ Ücretsiz İlan Ver</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => { setAuthMode("login"); setAuthOpen(true); }} className="rounded-lg border border-white/50 px-3 py-2 font-semibold">Giriş Yap</button>
              <button onClick={() => { setAuthMode("signup"); setAuthOpen(true); }} className="rounded-lg bg-yellow-400 px-4 py-3 font-bold text-slate-950">Üye Ol</button>
            </div>
          )}
        </div>
      </header>

      <section className="bg-white px-4 py-6">
        <div className="mx-auto max-w-7xl rounded-2xl bg-gradient-to-r from-[#18375c] to-[#3982bd] p-7 text-white sm:p-12">
          <p className="mb-3 font-bold tracking-widest text-yellow-300">TÜRK PAZARI HIZLI SAT</p>
          <h1 className="max-w-2xl text-3xl font-black sm:text-5xl">Ara, bul, al ve sat!</h1>
          <p className="mt-4 max-w-xl text-blue-100">Emlak, vasıta, elektronik ve ikinci el ürünler tek pazarda. İlanını oluştur, alıcılarla buluş.</p>
          <button onClick={() => user ? setShowForm(true) : (setAuthMode("signup"), setAuthOpen(true))} className="mt-6 rounded-lg bg-yellow-400 px-6 py-3 font-black text-slate-950 hover:bg-yellow-300">Hemen İlan Ver →</button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-7">
        <h2 className="mb-4 text-xl font-black">Kategoriler</h2>
        <div className="mb-7 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button key={cat} onClick={() => { setCategory(cat); setOnlyFavorites(false); }} className={`rounded-full border px-4 py-2 font-semibold ${category === cat && !onlyFavorites ? "border-[#234f82] bg-[#234f82] text-white" : "border-slate-200 bg-white hover:border-[#234f82]"}`}>{cat}</button>
          ))}
        </div>

        {notice && <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">{notice}<button className="ml-3 underline" onClick={() => setNotice("")}>Kapat</button></div>}

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black">{onlyFavorites ? "Favori İlanlarım" : "Son Eklenen İlanlar"}</h2>
          <span className="text-sm text-slate-500">{loading ? "Yükleniyor..." : `${filtered.length} ilan`}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center">İlan bulunamadı. Başka bir arama deneyin.</div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <button onClick={() => setSelected(item)} className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-blue-50 to-slate-200 text-7xl" aria-label={`${item.title} ilan detayını aç`}>{item.emoji}</button>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded bg-blue-50 px-2 py-1 text-xs font-bold text-blue-800">{item.category}</span>
                    {item.urgent && <span className="rounded bg-red-600 px-2 py-1 text-xs font-bold text-white">ACİL</span>}
                  </div>
                  <button onClick={() => setSelected(item)} className="mt-3 block min-h-12 text-left font-bold hover:text-blue-700">{item.title}</button>
                  <p className="mt-2 text-sm text-slate-500">📍 {item.city}</p>
                  <div className="mt-4 flex items-center justify-between border-t pt-3">
                    <strong className="text-lg text-[#234f82]">{money(item.price)}</strong>
                    <button onClick={() => setFavorites((old) => old.includes(item.id) ? old.filter((id) => id !== item.id) : [...old, item.id])} className={`rounded-full border px-3 py-2 ${favorites.includes(item.id) ? "border-red-200 bg-red-50 text-red-600" : "border-slate-200"}`} aria-label="Favorilere ekle veya çıkar">{favorites.includes(item.id) ? "♥" : "♡"}</button>
                  </div>
                  {item.id.startsWith("demo-") && <p className="mt-2 text-xs text-amber-700">Örnek ilan — gerçek satış ilanı değildir.</p>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="mt-8 bg-[#18375c] px-4 py-8 text-center text-sm text-blue-100">
        <p className="font-black text-white">TÜRK PAZARI HIZLI SAT</p>
        <p className="mt-2">Alım satımın kolay adresi.</p>
        <p className="mt-3 text-xs">İlanlar Supabase veritabanından yüklenir.</p>
      </footer>

      {authOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4">
          <form onSubmit={handleAuth} className="my-auto w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black">{authMode === "signup" ? "Üye Ol" : "Giriş Yap"}</h2>
              <button type="button" onClick={() => setAuthOpen(false)} className="text-2xl" aria-label="Kapat">×</button>
            </div>{authMode === "signup" && (
  <div className="grid grid-cols-2 gap-2">
    <button
      type="button"
      onClick={() => setMemberType("individual")}
      className={`rounded-lg border p-3 font-bold ${memberType === "individual" ? "bg-blue-900 text-white" : "bg-white text-slate-900"}`}
    >
      Bireysel
    </button>
    <button
      type="button"
      onClick={() => setMemberType("business")}
      className={`rounded-lg border p-3 font-bold ${memberType === "business" ? "bg-blue-900 text-white" : "bg-white text-slate-900"}`}
    >
      İşletme
    </button>
  </div>
)}
{authMode === "signup" && memberType === "business" && (
  <label className="block text-sm font-bold">
    Firma Adı
    <input
      required
      value={companyName}
      onChange={(e) => setCompanyName(e.target.value)}
      className="mt-1 w-full rounded-lg border p-3 font-normal"
      placeholder="İşletme veya firma adı"
    />
  </label>
)}
            <label className="block text-sm font-bold">E-posta
              <input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border p-3 font-normal" placeholder="ornek@mail.com" />
            </label>
            <label className="block text-sm font-bold">Parola
              <input required minLength={6} type="password" autoComplete={authMode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border p-3 font-normal" placeholder="En az 6 karakter" />
            </label>
            <button disabled={authBusy} type="submit" className="w-full rounded-lg bg-yellow-400 p-3 font-black text-slate-950 disabled:opacity-50">{authBusy ? "Bekle..." : authMode === "signup" ? "Hesap Oluştur" : "Giriş Yap"}</button>
            <button type="button" className="w-full text-sm underline" onClick={() => setAuthMode(authMode === "signup" ? "login" : "signup")}>{authMode === "signup" ? "Zaten üye misin? Giriş yap" : "Hesabın yok mu? Üye ol"}</button>
            <p className="text-xs text-slate-500">Kayıt sırasında e-posta doğrulaması istenebilir.</p>
          </form>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4">
          <form onSubmit={addListing} className="my-auto w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black">Ücretsiz İlan Ver</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-2xl" aria-label="Kapat">×</button>
            </div>
            <label className="block text-sm font-bold">İlan başlığı
              <input required maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-lg border p-3 font-normal" placeholder="Örn. Temiz ikinci el bisiklet" />
            </label>
            <label className="block text-sm font-bold">Fiyat (TL)
              <input required type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 w-full rounded-lg border p-3 font-normal" placeholder="15000" />
            </label>
            <label className="block text-sm font-bold">Kategori
              <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="mt-1 w-full rounded-lg border bg-white p-3 font-normal">
                {categories.filter((cat) => cat !== "Tümü").map((cat) => <option key={cat}>{cat}</option>)}
              </select>
            </label>
            <label className="block text-sm font-bold">Şehir / İlçe
              <input required value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 w-full rounded-lg border p-3 font-normal" placeholder="Sakarya / Adapazarı" />
            </label>
            <label className="block text-sm font-bold">Açıklama
              <textarea required maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full rounded-lg border p-3 font-normal" rows={4} placeholder="Ürünün özelliklerini yazın..." />
            </label>
            <label className="block text-sm font-bold">
              Ürün Fotoğrafı
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                className="mt-2 block w-full rounded-lg border p-3 font-normal"
              />
            </label>
            <button type="submit" className="w-full rounded-lg bg-yellow-400 p-3 font-black text-slate-950 hover:bg-yellow-300">İlanı Kaydet</button>
            <p className="text-xs text-slate-500">İlan vermek için hesabınla giriş yapmalısın.</p>
          </form>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-2xl font-black">{selected.title}</h2>
              <button onClick={() => setSelected(null)} className="text-2xl" aria-label="Kapat">×</button>
            </div>
            <div className="my-5 flex h-40 items-center justify-center rounded-xl bg-blue-50 text-7xl">{selected.emoji}</div>
            <p className="text-2xl font-black text-[#234f82]">{money(selected.price)}</p>
            <p className="mt-2 text-sm text-slate-500">📍 {selected.city} · {selected.category}</p>
            <p className="mt-4">{selected.description}</p>
            <button onClick={() => setFavorites((old) => old.includes(selected.id) ? old.filter((id) => id !== selected.id) : [...old, selected.id])} className="mt-5 w-full rounded-lg border p-3 font-bold">
              {favorites.includes(selected.id) ? "♥ Favorilerden Çıkar" : "♡ Favorilerime Ekle"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
