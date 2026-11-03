import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.5.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get the user from the request
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { planId, interval } = await req.json()

    // Define plan pricing
    const planPricing = {
      starter: {
        monthly: 2500,
        annual: 2075
      },
      professional: {
        monthly: 7500,
        annual: 6225
      },
      enterprise: {
        monthly: 15000,
        annual: 12450
      }
    }

    if (!planPricing[planId as keyof typeof planPricing]) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const price = planPricing[planId as keyof typeof planPricing][interval as 'monthly' | 'annual']
    
    // Create or get existing customer
    let customer
    const existingCustomers = await stripe.customers.list({
      email: user.email,
      limit: 1
    })

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0]
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id
        }
      })
    }

    // Calculate trial end (14 days from now)
    const trialEnd = Math.floor(Date.now() / 1000) + (14 * 24 * 60 * 60)

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'mad',
            product_data: {
              name: `TrainPro Academy - ${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
              description: `${interval === 'annual' ? 'Annual' : 'Monthly'} subscription`
            },
            unit_amount: price * 100, // Stripe expects amount in cents
            recurring: {
              interval: interval === 'annual' ? 'year' : 'month'
            }
          },
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/pricing`,
      subscription_data: {
        trial_end: trialEnd,
        metadata: {
          supabase_user_id: user.id,
          plan: planId,
          interval: interval
        }
      },
      metadata: {
        supabase_user_id: user.id,
        plan: planId,
        interval: interval
      }
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Checkout error:', error)
    return new Response(
      JSON.stringify({ error: 'An error occurred while creating the checkout session. Please try again.' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})