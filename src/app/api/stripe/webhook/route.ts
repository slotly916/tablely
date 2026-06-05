import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, WEBHOOK_SECRET);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Signatur ungültig";
    console.error("Webhook signature error:", msg);
    return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      // Erste Zahlung erfolgreich ODER monatliche Verlängerung
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Seit der "basil" API ist invoice.subscription entfernt.
        // Die Subscription steckt jetzt unter parent.subscription_details.
        const parent = (invoice as Stripe.Invoice & {
          parent?: { subscription_details?: { subscription?: string } };
        }).parent;
        const subscriptionId = parent?.subscription_details?.subscription || null;

        // Restaurant über Customer ID finden
        const { data: restaurant } = await supabase
          .from("restaurants")
          .select("*")
          .eq("stripe_customer_id", customerId)
          .single();

        if (restaurant) {
          const plan = restaurant.selected_plan || "standard";
          const periodEnd = invoice.lines?.data?.[0]?.period?.end;

          await supabase
            .from("restaurants")
            .update({
              plan: plan,
              subscription_status: "active",
              is_blocked: false,
              stripe_subscription_id: subscriptionId || restaurant.stripe_subscription_id,
              subscription_current_period_end: periodEnd
                ? new Date(periodEnd * 1000).toISOString()
                : null,
            })
            .eq("id", restaurant.id);

          console.log(`Restaurant ${restaurant.name} -> Plan ${plan} aktiviert`);
        }
        break;
      }

      // Zahlung fehlgeschlagen
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: restaurant } = await supabase
          .from("restaurants")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (restaurant) {
          await supabase
            .from("restaurants")
            .update({ subscription_status: "past_due" })
            .eq("id", restaurant.id);
        }
        break;
      }

      // Abo gekündigt / gelöscht
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: restaurant } = await supabase
          .from("restaurants")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (restaurant) {
          await supabase
            .from("restaurants")
            .update({
              subscription_status: "canceled",
              plan: "trial",
              is_blocked: true,
            })
            .eq("id", restaurant.id);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }
}