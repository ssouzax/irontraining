import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log('Kiwify webhook received:', JSON.stringify(body));

    // Kiwify webhook event types:
    // order_approved, order_refunded, subscription_canceled, subscription_renewed
    const eventType = body.event || body.order_status;
    const customerEmail = body.Customer?.email || body.customer?.email;
    const productId = body.Product?.product_id || body.product?.product_id;
    const subscriptionId = body.subscription_id || body.Subscription?.id;
    const orderId = body.order_id || body.Order?.order_id;

    if (!customerEmail) {
      return new Response(JSON.stringify({ error: 'No customer email found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find user by email in profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', customerEmail)
      .maybeSingle();

    if (!profile) {
      console.log(`No user found for email: ${customerEmail}`);
      return new Response(JSON.stringify({ error: 'User not found', email: customerEmail }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = profile.user_id;

    // Find which plan matches the Kiwify product
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('kiwify_product_id', productId)
      .maybeSingle();

    const planId = plan?.id || 'basic_monthly';
    const interval = plan?.interval || 'monthly';

    switch (eventType) {
      case 'order_approved':
      case 'approved': {
        const expiresAt = interval === 'yearly'
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        // Deactivate any existing active subscription
        await supabase
          .from('user_subscriptions')
          .update({ status: 'replaced' })
          .eq('user_id', userId)
          .eq('status', 'active');

        // Create new subscription
        const { error: subError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            plan_id: planId,
            status: 'active',
            expires_at: expiresAt,
            kiwify_subscription_id: subscriptionId,
            kiwify_customer_id: customerEmail,
          });

        if (subError) console.error('Error creating subscription:', subError);

        // Log payment
        await supabase.from('payment_logs').insert({
          user_id: userId,
          amount_cents: plan?.price_cents || 0,
          payment_type: 'subscription',
          reference_id: orderId || subscriptionId,
          status: 'completed',
          metadata: { kiwify_event: eventType, product_id: productId },
        });

        console.log(`Subscription activated for user ${userId}, plan: ${planId}`);
        break;
      }

      case 'order_refunded':
      case 'refunded':
      case 'subscription_canceled':
      case 'canceled': {
        await supabase
          .from('user_subscriptions')
          .update({ status: 'canceled', canceled_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('status', 'active');

        console.log(`Subscription canceled for user ${userId}`);
        break;
      }

      case 'subscription_renewed':
      case 'renewed': {
        const expiresAt = interval === 'yearly'
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        await supabase
          .from('user_subscriptions')
          .update({ status: 'active', expires_at: expiresAt })
          .eq('user_id', userId)
          .eq('status', 'active');

        // Log renewal payment
        await supabase.from('payment_logs').insert({
          user_id: userId,
          amount_cents: plan?.price_cents || 0,
          payment_type: 'subscription',
          reference_id: orderId || subscriptionId,
          status: 'completed',
          metadata: { kiwify_event: 'renewal', product_id: productId },
        });

        console.log(`Subscription renewed for user ${userId}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
