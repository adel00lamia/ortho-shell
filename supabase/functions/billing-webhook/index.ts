import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.5.0'

serve(async (req) => {
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const signature = req.headers.get('stripe-signature')
    const body = await req.text()
    
    if (!signature) {
      return new Response('No signature', { status: 400 })
    }

    let event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response('Invalid signature', { status: 400 })
    }

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

          // Create subscription record
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

          if (error) {
            console.error('Error inserting subscription:', error)
          } else {
            console.log('Subscription created successfully')
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Update existing subscription
        const { error } = await supabaseClient
          .from('subscriptions')
          .update({
            status: subscription.status === 'trialing' ? 'trialing' : 
                   subscription.status === 'active' ? 'active' :
                   subscription.status === 'past_due' ? 'past_due' : 'canceled',
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error('Error updating subscription:', error)
        } else {
          console.log('Subscription updated successfully')
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Mark subscription as canceled
        const { error } = await supabaseClient
          .from('subscriptions')
          .update({
            status: 'canceled'
          })
          .eq('stripe_subscription_id', subscription.id)

        if (error) {
          console.error('Error canceling subscription:', error)
        } else {
          console.log('Subscription canceled successfully')
        }
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        
        if (invoice.subscription) {
          // Update subscription to active if payment succeeded
          const { error } = await supabaseClient
            .from('subscriptions')
            .update({
              status: 'active'
            })
            .eq('stripe_subscription_id', invoice.subscription as string)

          if (error) {
            console.error('Error updating subscription after payment:', error)
          } else {
            console.log('Subscription activated after payment')
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        
        if (invoice.subscription) {
          // Update subscription to past_due if payment failed
          const { error } = await supabaseClient
            .from('subscriptions')
            .update({
              status: 'past_due'
            })
            .eq('stripe_subscription_id', invoice.subscription as string)

          if (error) {
            console.error('Error updating subscription after payment failure:', error)
          } else {
            console.log('Subscription marked as past due after payment failure')
          }
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