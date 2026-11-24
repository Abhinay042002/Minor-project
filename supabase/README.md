# Supabase setup

1. Create a Supabase project at https://supabase.com/dashboard.
2. Open SQL Editor and run `migrations/202611240001_initial_schema.sql`.
3. Copy the project URL and the publishable/anon key from Project Settings -> API.
4. In Netlify, open Site configuration -> Environment variables and add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Add the same variables to a local `.env.local` file for development. Never commit real keys.
6. Redeploy the Netlify site after setting the variables.
7. Sign up using the customer registration form. To grant the first administrator, run this SQL with the intended account email:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'admin@example.com');
```

Do not expose the Supabase service-role key in Vite, GitHub, or Netlify client-side variables. Only the publishable/anon key belongs in the browser; row-level security policies enforce permissions.

## Tables

- `profiles`: auth-linked customer/admin roles
- `products`: shared product catalog and inventory
- `wishlists`: per-user saved products
- `reviews`: authenticated customer reviews
- `orders` and `order_items`: durable order history and immutable item snapshots

The `place_order` SQL function checks live stock and calculates product prices, coupon discount, GST, and total inside a database transaction. This creates an order record; it does not charge a payment method. Integrate a payment provider (and verify payment server-side) before accepting live online payments.
