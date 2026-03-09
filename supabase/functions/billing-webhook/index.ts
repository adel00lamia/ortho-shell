import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.5.0'

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!stripeSecretKey || !webhookSecret) {
      console.error('Missing Stripe configuration')
      return new Response('Server configuration error', { status: 500 })
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' })

    const signature = req.headers.get('stripe-signature')
    const body = await req.text()

    if (!signature) {
      return new Response('No signature', { status: 400 })
    }

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response('Invalid signature', { status: 400 })
    }

    // Idempotency: skip already-processed events
    const { data: existing } = await supabaseClient
      .from('stripe_events')
      .select('id')
      .eq('stripe_event_id', event.id)
      .maybeSingle()

    if (existing) {
      console.log(`Event ${event.id} already processed, skipping`)
      return new Response('Already processed', { status: 200 })
    }

    // Log the event before processing
    await supabaseClient.from('stripe_events').insert({
      stripe_event_id: event.id,
      event_type: event.type,
      processed_at: new Date().toISOString(),
    })

    console.log('Processing webhook event:', event.type)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          const userId = session.metadata?.supabase_user_id

          if (!userId) {
            console.error('No user ID in session metadata')
            break
          }

          const { error } = await supabaseClient
            .from('subscriptions')
            .insert({
              user_id: userId,
              plan: session.metadata?.plan || 'starter',
              interval: session.metadata?.interval || 'monthly',
              status: subscription.status === 'trialing' ? 'trialing' : 'active',
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              stripe_subscription_id: subscription.id,
              stripe_customer_id: subscription.customer as string,
              seats: 1
            })

          if (error) console.error('Error inserting subscription:', error)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const statusMap: Record<string, string> = {
          trialing: 'trialing',
          active: 'active',
          past_due: 'past_due',
        }
        const status = statusMap[subscription.status] || 'canceled'

        const { error } = await supabaseClient
          .from('subscriptions')
          .update({
            status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) console.error('Error updating subscription:', error)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const { error } = await supabaseClient
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', subscription.id)

        if (error) console.error('Error canceling subscription:', error)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice

        if (invoice.subscription) {
          const { error } = await supabaseClient
            .from('subscriptions')
            .update({ status: 'active' })
            .eq('stripe_subscription_id', invoice.subscription as string)

          if (error) console.error('Error updating subscription after payment:', error)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        if (invoice.subscription) {
          const { error } = await supabaseClient
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_subscription_id', invoice.subscription as string)

          if (error) console.error('Error updating subscription after payment failure:', error)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response('ok', { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('Internal server error', { status: 500 })
  }
})
