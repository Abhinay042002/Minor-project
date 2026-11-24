const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const backendConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let accessToken = null;
let currentSession = null;

function headers(extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    ...extra
  };
}

async function request(path, options = {}) {
  if (!backendConfigured) throw new Error("Backend is not configured. Add the Supabase environment variables.");
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: headers(options.headers || {})
  });
  const body = await response.text();
  const data = body ? JSON.parse(body) : null;
  if (!response.ok) throw new Error(data?.message || data?.msg || "Database request failed.");
  return data;
}

async function authRequest(path, body, token) {
  if (!backendConfigured) throw new Error("Backend is not configured. Add the Supabase environment variables.");
  const response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.msg || data.message || "Authentication failed.");
  return data;
}

function saveSession(session) {
  currentSession = session;
  accessToken = session?.access_token || null;
  try {
    if (session) localStorage.setItem("se_supabase_session", JSON.stringify(session));
    else localStorage.removeItem("se_supabase_session");
  } catch {}
}

export async function restoreSession() {
  try {
    const raw = localStorage.getItem("se_supabase_session");
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session?.access_token || !session?.refresh_token) return null;
    if (session.expires_at && session.expires_at * 1000 < Date.now()) {
      const refreshed = await authRequest("token?grant_type=refresh_token", { refresh_token: session.refresh_token });
      const next = { ...refreshed, expires_at: Math.floor(Date.now() / 1000) + refreshed.expires_in };
      saveSession(next);
      return next;
    }
    saveSession(session);
    return session;
  } catch {
    saveSession(null);
    return null;
  }
}

export async function signIn(email, password) {
  const session = await authRequest("token?grant_type=password", { email, password });
  saveSession({ ...session, expires_at: Math.floor(Date.now() / 1000) + session.expires_in });
  return getProfile(session.user.id, session.user);
}

export async function signUp(email, password, name) {
  const data = await authRequest("signup", { email, password, data: { full_name: name } });
  if (data.access_token) {
    saveSession({ ...data, expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600) });
    return getProfile(data.user.id, data.user);
  }
  return { id: data.user?.id, email, name, isAdmin: false, needsEmailConfirmation: true };
}

async function getProfile(userId, authUser) {
  const rows = await request(`profiles?id=eq.${encodeURIComponent(userId)}&select=id,full_name,role`);
  const profile = rows?.[0];
  return {
    id: userId,
    email: authUser?.email || "",
    name: profile?.full_name || authUser?.user_metadata?.full_name || authUser?.email || "Customer",
    isAdmin: profile?.role === "admin"
  };
}

export async function signOut() {
  if (accessToken) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, { method: "POST", headers: headers() });
  }
  saveSession(null);
}

export async function getCurrentProfile() {
  const session = await restoreSession();
  if (!session?.user?.id) return null;
  return getProfile(session.user.id, session.user);
}

export async function fetchProducts() {
  return request("products?select=id,code,name,category,description,image,price,stock,rating,specs&active=eq.true&order=id.asc");
}

export async function fetchOrders() {
  return request("orders?select=id,order_number,created_at,customer_name,customer_email,shipping_address,payment_method,subtotal,discount,tax,total,coupon_code,status,order_items(product_id,product_name,product_image,unit_price,quantity)&order=created_at.desc");
}

export async function fetchWishlist() {
  return request("wishlists?select=product_id&order=created_at.desc");
}

export async function saveWishlist(productIds) {
  await request("wishlists?on_conflict=product_id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(productIds.map(product_id => ({ product_id }))) });
}

export async function removeWishlist(productId) {
  await request(`wishlists?product_id=eq.${productId}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
}

export async function createReview({ productId, rating, comment }) {
  return request("reviews", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ product_id: productId, rating, comment }) });
}

export async function createOrder({ customerName, customerEmail, address, paymentMethod, couponCode, items }) {
  const rows = await request("rpc/place_order", {
    method: "POST",
    body: JSON.stringify({
      p_customer_name: customerName,
      p_customer_email: customerEmail,
      p_shipping_address: address,
      p_payment_method: paymentMethod,
      p_coupon_code: couponCode || null,
      p_items: items.map(item => ({ product_id: item.id, quantity: item.quantity }))
    })
  });
  return rows;
}

export async function createProduct(product) {
  const rows = await request("products", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      code: product.code,
      name: product.name,
      category: product.category,
      description: product.description,
      image: product.image,
      price: product.price,
      stock: product.stock,
      specs: product.specs || []
    })
  });
  return rows?.[0];
}

export async function updateOrderStatus(orderId, status) {
  return request(`orders?id=eq.${orderId}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ status })
  });
}
