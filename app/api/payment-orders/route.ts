
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !secretKey) {
      return NextResponse.json(
        { error: "Sunucu ayarları eksik." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const plans: Record<string, { title: string; amount: number }> = {
      individual2: { title: "2. ilan", amount: 400 },
      individual3: { title: "3. ilan", amount: 450 },
      individual4: { title: "4. ilan", amount: 500 },
      individual5: { title: "5. ve sonraki ilan", amount: 550 },
      featured: { title: "Öne çıkarılmış ilan - 3 gün", amount: 150 },
      merchant: { title: "Esnaf tek ilan", amount: 350 },
      starter: { title: "Başlangıç - 5 ilan", amount: 1750 },
      active: { title: "Aktif - 15 ilan", amount: 3750 },
      professional: { title: "Profesyonel - 30 ilan", amount: 6000 },
    };

    const plan = plans[body.planId];

    if (!plan) {
      return NextResponse.json(
        { error: "Geçersiz paket seçildi." },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, secretKey, {
      auth: { persistSession: false },
    });

    const orderNumber = "TPS-" + crypto.randomUUID().slice(0, 8).toUpperCase();

    const { data, error } = await supabase
      .from("payment_orders")
      .insert({
        order_number: orderNumber,
        package_name: plan.title,
        amount_try: plan.amount,
        payment_method: "bank_transfer",
        payment_status: "pending",
      })
      .select("order_number, package_name, amount_try, payment_status")
      .single();

    if (error) {
      console.error("Sipariş kaydı hatası:", error.message);
      return NextResponse.json(
        { error: "Sipariş kaydedilemedi." },
        { status: 500 }
      );
    }

    return NextResponse.json({ order: data });
  } catch {
    return NextResponse.json(
      { error: "İstek işlenemedi." },
      { status: 400 }
    );
  }
}
