import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Lazy-Init: Stripe wird erst beim Request erstellt, nicht beim Build.
// Verhindert "Neither apiKey nor config.authenticator provided" beim Build.
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

const PRICE_IDS: Record<string, string | undefined> = {
  standard: process.env.STRIPE_PRICE_STANDARD,
  plus: process.env.STRIPE_PRICE_PLUS,
  premium: process.env.STRIPE_PRICE_PREMIUM,
};

export async function POST(req: Request) {
  try {
    const stripe = getStripe();
    const supabase = getSupabase();

    const { restaurantId, email, plan } = await req.json();

    if (!restaurantId || !email || !plan) {
      return NextResponse.json({ error: "Fehlende Angaben." }, { status: 400 });
    }

    const priceId = PRICE_IDS[plan];
    if (!priceId) {
      return NextResponse.json({ error: "Ungültiger Plan." }, { status: 400 });
    }

    // Restaurant laden
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", restaurantId)
      .single();

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant nicht gefunden." }, { status: 404 });
    }

    // Stripe Customer erstellen oder wiederverwenden
    let customerId = restaurant.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        name: restaurant.name,
        metadata: { restaurantId },
      });
      customerId = customer.id;
      await supabase
        .from("restaurants")
        .update({ stripe_customer_id: customerId })
        .eq("id", restaurantId);
    }

    // Subscription mit "default_incomplete" erstellen.
    // Seit der Stripe "basil" API hat die Invoice kein payment_intent mehr,
    // sondern ein confirmation_secret für das Payment Element.
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.confirmation_secret"],
      metadata: { restaurantId, plan },
    });

    // Subscription ID + gewählten Plan speichern (noch nicht aktiv bis bezahlt)
    await supabase
      .from("restaurants")
      .update({
        stripe_subscription_id: subscription.id,
        selected_plan: plan,
      })
      .eq("id", restaurantId);

    // confirmation_secret aus der expandierten Invoice holen
    const invoice = subscription.latest_invoice as Stripe.Invoice & {
      confirmation_secret?: { client_secret: string };
    };
    const clientSecret = invoice.confirmation_secret?.client_secret;

    if (!clientSecret) {
      return NextResponse.json({ error: "Kein Zahlungsschlüssel erhalten." }, { status: 500 });
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret,
    });
  } catch (err: unknown) {
    console.error("create-subscription error:", err);
    const msg = err instanceof Error ? err.message : "Fehler beim Erstellen der Zahlung.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}